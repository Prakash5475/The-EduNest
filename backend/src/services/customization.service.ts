import { customizationRepository } from '@/repositories/customization.repository';
import { productRepository } from '@/repositories/product.repository';
import { cartRepository } from '@/repositories/cart.repository';
import { cartService } from '@/services/cart.service';
import { productService } from '@/services/product.service';
import { schoolRepository } from '@/repositories/school.repository';
import { notifyUser, notifyUsersWithRole } from '@/helpers/notification.helper';
import { ApiError } from '@/utils/ApiError';
import { normalizePagination, buildPaginationMeta } from '@/helpers/pagination.helper';
import type { School, CustomizationRequestStatus } from '@prisma/client';

interface FileInput {
  fileId: bigint;
  fileType: 'logo' | 'artwork' | 'reference';
  displayOrder: number;
}

interface CreateInput {
  productId: bigint;
  quantity: number;
  schoolName?: string;
  customText?: string;
  color?: string;
  size?: string;
  material?: string;
  brandingRequirements?: string;
  printingRequirements?: string;
  specialInstructions?: string;
  files: FileInput[];
}

export class CustomizationService {
  async create(school: School, input: CreateInput) {
    const product = await productRepository.findById(input.productId);
    if (!product) throw ApiError.notFound('Product not found');
    if (!product.isCustomizable) {
      throw ApiError.badRequest('This product does not support customization requests');
    }
    if (input.quantity < product.minOrderQty) {
      throw ApiError.badRequest(`Minimum order quantity for this product is ${product.minOrderQty} units`);
    }

    const request = await customizationRepository.create({
      schoolId: school.id,
      productId: input.productId,
      quantity: input.quantity,
      schoolName: input.schoolName,
      customText: input.customText,
      color: input.color,
      size: input.size,
      material: input.material,
      brandingRequirements: input.brandingRequirements,
      printingRequirements: input.printingRequirements,
      specialInstructions: input.specialInstructions,
      files: input.files,
    });

    await notifyUsersWithRole(['super_admin', 'staff'], {
      type: 'customization_request_submitted',
      title: 'New customization request',
      message: `${school.schoolName} submitted a customization request`,
      referenceType: 'customization_request',
      referenceId: request.id,
    });

    return request;
  }

  async listMine(
    school: School,
    filters: { status?: CustomizationRequestStatus; page?: number; limit?: number },
  ) {
    const { page, limit, skip, take } = normalizePagination(filters.page, filters.limit);
    const { items, total } = await customizationRepository.list({
      schoolId: school.id,
      status: filters.status,
      skip,
      take,
    });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async listForAdmin(filters: {
    status?: CustomizationRequestStatus;
    schoolId?: bigint;
    productId?: bigint;
    page?: number;
    limit?: number;
  }) {
    const { page, limit, skip, take } = normalizePagination(filters.page, filters.limit);
    const { items, total } = await customizationRepository.list({
      schoolId: filters.schoolId,
      productId: filters.productId,
      status: filters.status,
      skip,
      take,
    });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  private async getOwned(id: bigint, schoolId: bigint) {
    const request = await customizationRepository.findById(id);
    if (!request) throw ApiError.notFound('Customization request not found');
    if (request.schoolId !== schoolId) throw ApiError.forbidden('This request does not belong to your school');
    return request;
  }

  async getForSchool(id: bigint, school: School) {
    return this.getOwned(id, school.id);
  }

  async getForAdmin(id: bigint) {
    const request = await customizationRepository.findById(id);
    if (!request) throw ApiError.notFound('Customization request not found');
    return request;
  }

  /** Rejected requests may be edited and resubmitted — this resets the workflow to pending_review. */
  async resubmit(
    id: bigint,
    school: School,
    updates: Partial<Omit<CreateInput, 'productId'>>,
  ) {
    const request = await this.getOwned(id, school.id);
    if (request.status !== 'rejected') {
      throw ApiError.badRequest('Only rejected requests can be edited and resubmitted');
    }

    if (updates.quantity !== undefined) {
      await productService.validateOrderQuantity(request.productId, updates.quantity);
    }

    const { files, ...fieldUpdates } = updates;

    await customizationRepository.update(id, {
      ...fieldUpdates,
      status: 'pending_review',
      reviewedBy: null,
      reviewedAt: null,
      reviewNotes: null,
    });

    if (files) await customizationRepository.replaceFiles(id, files);
    await customizationRepository.addStatusHistory(id, 'pending_review', undefined, 'Resubmitted by school after rejection');

    await notifyUsersWithRole(['super_admin', 'staff'], {
      type: 'customization_request_resubmitted',
      title: 'Customization request resubmitted',
      message: `${school.schoolName} resubmitted a previously rejected customization request`,
      referenceType: 'customization_request',
      referenceId: id,
    });

    return customizationRepository.findById(id);
  }

  async review(
    id: bigint,
    reviewer: { id: bigint },
    input: { status: 'reviewed' | 'approved' | 'rejected'; reviewNotes?: string },
  ) {
    const request = await customizationRepository.findById(id);
    if (!request) throw ApiError.notFound('Customization request not found');
    if (request.status === 'approved' || request.status === 'rejected') {
      throw ApiError.badRequest('This request has already been finalized');
    }

    await customizationRepository.update(id, {
      status: input.status,
      reviewNotes: input.reviewNotes,
      reviewedBy: reviewer.id,
      reviewedAt: new Date(),
    });
    await customizationRepository.addStatusHistory(id, input.status, reviewer.id, input.reviewNotes);

    const school = await schoolRepository.findById(request.schoolId);
    if (school) {
      const statusLabel = input.status === 'approved' ? 'approved' : input.status === 'rejected' ? 'rejected' : 'reviewed';
      await notifyUser({
        userId: school.userId,
        type: `customization_request_${input.status}`,
        title: `Customization request ${statusLabel}`,
        message: input.reviewNotes ?? `Your customization request has been ${statusLabel}`,
        referenceType: 'customization_request',
        referenceId: id,
      });
    }

    return customizationRepository.findById(id);
  }

  /** Only an Approved request may become a cart line — and only once. */
  async convertToCart(id: bigint, school: School) {
    const request = await this.getOwned(id, school.id);
    if (request.status !== 'approved') {
      throw ApiError.badRequest('Only approved customization requests can be added to the cart');
    }
    if (request.convertedCartItemId) {
      throw ApiError.conflict('This customization request has already been added to the cart');
    }

    const product = await productService.validateOrderQuantity(request.productId, request.quantity);

    const cart = await cartService.getOrCreateActiveCart(school);
    const cartItem = await cartRepository.addItem({
      cartId: cart.id,
      productId: request.productId,
      quantity: request.quantity,
      unitPriceSnapshot: Number(product.basePrice),
    });

    await customizationRepository.update(id, { convertedCartItemId: cartItem.id });

    return cartService.getCart(school);
  }
}

export const customizationService = new CustomizationService();
