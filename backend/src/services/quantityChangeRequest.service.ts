import { quantityChangeRequestRepository } from '@/repositories/quantityChangeRequest.repository';
import { normalizePagination, buildPaginationMeta } from '@/helpers/pagination.helper';
import { ApiError } from '@/utils/ApiError';
import { prisma } from '@/config/database';
import type { QuantityChangeRequestStatus } from '@prisma/client';

export class QuantityChangeRequestService {
  /**
   * Any direct edit to inventory.quantity_available outside of a normal sale/return/purchase
   * flow must go through this — there is deliberately no "just PATCH the inventory row"
   * admin endpoint for quantity, so a request+approval record always exists first.
   */
  async create(
    scope: { inventoryId?: bigint; productId?: bigint; warehouseId?: bigint },
    requestedQuantity: number,
    reason: string,
    requestedBy: bigint,
  ) {
    if (requestedQuantity < 0) throw ApiError.badRequest('Requested quantity cannot be negative');

    return prisma.$transaction(async (tx) => {
      let inventory = scope.inventoryId
        ? await tx.inventory.findUnique({ where: { id: scope.inventoryId } })
        : null;

      if (!inventory && scope.productId && scope.warehouseId) {
        const [product, warehouse] = await Promise.all([
          tx.product.findFirst({ where: { id: scope.productId, deletedAt: null }, select: { id: true } }),
          tx.warehouse.findFirst({ where: { id: scope.warehouseId, isActive: true }, select: { id: true } }),
        ]);
        if (!product) throw ApiError.notFound('Product not found');
        if (!warehouse) throw ApiError.badRequest('Active warehouse not found');

        inventory = await tx.inventory.findFirst({
          where: { productId: product.id, warehouseId: warehouse.id, variantId: null, dealerId: null },
        });
        if (!inventory) {
          inventory = await tx.inventory.create({
            data: {
              productId: product.id,
              warehouseId: warehouse.id,
              quantityAvailable: 0,
              quantityReserved: 0,
              reorderLevel: 0,
            },
          });
        }
      }

      if (!inventory) throw ApiError.notFound('Inventory record not found');

      const pending = await tx.quantityChangeRequest.findFirst({
        where: { inventoryId: inventory.id, status: 'pending' },
      });
      if (pending) throw ApiError.conflict('There is already a pending quantity-change request for this inventory record');

      return tx.quantityChangeRequest.create({
        data: {
          inventoryId: inventory.id,
          currentQuantity: inventory.quantityAvailable,
          requestedQuantity,
          reason,
          requestedBy,
        },
      });
    });
  }

  list(filters: { status?: QuantityChangeRequestStatus; page?: number; limit?: number }) {
    const { page, limit, skip, take } = normalizePagination(filters.page, filters.limit);
    return quantityChangeRequestRepository
      .list({ status: filters.status, skip, take })
      .then(({ items, total }) => ({ items, meta: buildPaginationMeta(page, limit, total) }));
  }

  async getById(id: bigint) {
    const request = await quantityChangeRequestRepository.findById(id);
    if (!request) throw ApiError.notFound('Quantity change request not found');
    return request;
  }

  /**
   * Approval is the ONLY path that changes inventory.quantity_available for a manual
   * correction. The stock delta, the inventory update, and the request's own status flip to
   * 'approved' all happen in one Prisma transaction — a crash partway through leaves neither
   * applied, never a half-applied stock change. A stock_history 'adjustment' row is written
   * in the same transaction so this shows up in the existing stock audit trail, not just in
   * quantity_change_requests.
   */
  async approve(id: bigint, decidedBy: bigint) {
    const request = await quantityChangeRequestRepository.findById(id);
    if (!request) throw ApiError.notFound('Quantity change request not found');
    if (request.status !== 'pending') throw ApiError.badRequest(`This request is already ${request.status}`);

    const delta = request.requestedQuantity - request.inventory.quantityAvailable;

    return prisma.$transaction(async (tx) => {
      const updatedInventory = await tx.inventory.update({
        where: { id: request.inventoryId },
        data: { quantityAvailable: request.requestedQuantity },
      });

      await tx.quantityChangeRequest.update({
        where: { id },
        data: { status: 'approved', decidedBy, decidedAt: new Date() },
      });

      if (delta !== 0) {
        await tx.stockHistory.createMany({
          data: [{
            inventoryId: request.inventoryId,
            changeQty: delta,
            reason: 'adjustment',
            referenceType: 'quantity_change_request',
            referenceId: id,
            createdBy: decidedBy,
          }],
        });
      }

      return updatedInventory;
    });
  }

  async reject(id: bigint, decidedBy: bigint, rejectionReason: string) {
    const request = await quantityChangeRequestRepository.findById(id);
    if (!request) throw ApiError.notFound('Quantity change request not found');
    if (request.status !== 'pending') throw ApiError.badRequest(`This request is already ${request.status}`);

    return prisma.quantityChangeRequest.update({
      where: { id },
      data: { status: 'rejected', decidedBy, decidedAt: new Date(), rejectionReason },
    });
  }
}

export const quantityChangeRequestService = new QuantityChangeRequestService();
