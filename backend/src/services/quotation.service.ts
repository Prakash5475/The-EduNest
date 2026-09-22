import { quotationRepository } from '@/repositories/quotation.repository';
import { orderRepository } from '@/repositories/order.repository';
import { dealerRepository } from '@/repositories/dealer.repository';
import { generateOrderNumber } from '@/helpers/orderNumber.helper';
import { notifyUser, notifyUsersWithRole } from '@/helpers/notification.helper';
import { dealerCapacityService } from '@/services/dealerCapacity.service';
import { prisma } from '@/config/database';
import { ApiError } from '@/utils/ApiError';
import { normalizePagination, buildPaginationMeta } from '@/helpers/pagination.helper';
import type { School, Dealer, QuotationRequestStatus } from '@prisma/client';
import { PLATFORM_FEE_PERCENT } from '@/constants';
interface CreateRequestInput {
  title?: string;
  notes?: string;
  items: Array<{
  productId?: bigint;
  kitId?: bigint;
  customItemName?: string;
  customItemDescription?: string;
  customItemSchoolPrice?: number;
  customItemDealerPrice?: number;
  customItemImageFileId?: bigint;
  customItemExternalUrl?: string;
  customItemNotes?: string;
  quantity: number;
}>;
}

interface AssignmentInput {
  dealerId: bigint;
  itemIds: bigint[];
  validityDays: number;
  expectedCompletionDate?: Date;
  notes?: string;
}

async function generateRequestNumber(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.floor(100000 + Math.random() * 900000);
    const candidate = `QR-${datePart}-${randomPart}`;
    const existing = await quotationRepository.findRequestByNumber(candidate);
    if (!existing) return candidate;
  }
  throw ApiError.internal('Could not generate a unique request number, please try again');
}

export class QuotationService {
  async createRequest(school: School, input: CreateRequestInput) {
  if (input.items.length === 0) {
    throw ApiError.badRequest('A quotation request needs at least one item');
  }

  for (const item of input.items) {
    if (!item.productId && !item.kitId && !item.customItemName) {
      throw ApiError.badRequest(
        'Each item needs a product, a kit, or a custom item name',
      );
    }
  }
    const requestNumber = await generateRequestNumber();
    const request = await quotationRepository.createRequest({
      requestNumber,
      schoolId: school.id,
      title: input.title,
      notes: input.notes,
      items: input.items,
    });

    await notifyUsersWithRole(['super_admin', 'staff'], {
      type: 'quotation_request_submitted',
      title: 'New quotation request',
      message: `${requestNumber} is awaiting review`,
      referenceType: 'quotation_request',
      referenceId: request.id,
    });

    return request;
  }

  async listMine(school: School, filters: { status?: QuotationRequestStatus; page?: number; limit?: number }) {
    const { page, limit, skip, take } = normalizePagination(filters.page, filters.limit);
    const { items, total } = await quotationRepository.listRequests({ schoolId: school.id, status: filters.status, skip, take });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async listForAdmin(filters: { status?: QuotationRequestStatus; schoolId?: bigint; page?: number; limit?: number }) {
    const { page, limit, skip, take } = normalizePagination(filters.page, filters.limit);
    const { items, total } = await quotationRepository.listRequests({ status: filters.status, schoolId: filters.schoolId, skip, take });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async getForSchool(id: bigint, school: School) {
    const request = await quotationRepository.findRequestById(id);
    if (!request || request.schoolId !== school.id) throw ApiError.notFound('Quotation request not found');
    return request;
  }

  async getForAdmin(id: bigint) {
    const request = await quotationRepository.findRequestById(id);
    if (!request) throw ApiError.notFound('Quotation request not found');
    return request;
  }

  /** Admin assigns disjoint subsets of the request's line items to one or more dealers — one DealerQuotation per dealer. */
  async assignDealers(adminUserId: bigint, requestId: bigint, assignments: AssignmentInput[]) {
    const request = await quotationRepository.findRequestById(requestId);
    if (!request) throw ApiError.notFound('Quotation request not found');
    if (assignments.length === 0) throw ApiError.badRequest('Provide at least one dealer assignment');

    const validItemIds = new Set(request.quotationRequestProducts.map((p) => p.id.toString()));
    const alreadyAssigned = new Set(
      request.dealerQuotations.flatMap((dq) => dq.dealerQuotationItems.map((i) => i.quotationRequestProductId.toString())),
    );

    const created = [];
    for (const assignment of assignments) {
      const dealer = await dealerRepository.findById(assignment.dealerId);
      if (!dealer) throw ApiError.badRequest(`Dealer ${assignment.dealerId} not found`);

      const items = [];
      for (const itemId of assignment.itemIds) {
        if (!validItemIds.has(itemId.toString())) {
          throw ApiError.badRequest(`Item ${itemId} does not belong to this quotation request`);
        }
        if (alreadyAssigned.has(itemId.toString())) {
          throw ApiError.conflict(`Item ${itemId} has already been assigned to a dealer`);
        }
        const lineItem = request.quotationRequestProducts.find((p) => p.id === itemId)!;

const schoolUnitPrice = lineItem.product
  ? Number(lineItem.product.basePrice)
  : lineItem.customItemSchoolPrice != null
    ? Number(lineItem.customItemSchoolPrice)
    : 0;

const dealerUnitPrice =
  lineItem.customItemDealerPrice != null
    ? Number(lineItem.customItemDealerPrice)
    : 0;

items.push({
  quotationRequestProductId: itemId,
  schoolUnitPrice,
  dealerUnitPrice,
  quotedQuantity: lineItem.quantity,
});
}
      const dealerQuotation = await quotationRepository.createDealerQuotation({
        quotationRequestId: requestId,
        dealerId: assignment.dealerId,
        assignedBy: adminUserId,
        expectedCompletionDate: assignment.expectedCompletionDate,
        validityDays: assignment.validityDays,
        notes: assignment.notes,
        items,
      });
      created.push(dealerQuotation);

      const capacity = await dealerCapacityService.getSnapshot(assignment.dealerId);
      (dealerQuotation as typeof dealerQuotation & { capacityWarning?: string | null }).capacityWarning =
        capacity.status === 'overloaded' ? capacity.recommendation : null;
      if (capacity.status === 'overloaded') {
        await notifyUsersWithRole(['super_admin', 'staff'], {
          type: 'dealer_overloaded_assignment',
          title: 'Assigned work to an overloaded dealer',
          message: `${capacity.businessName} is overloaded (${capacity.capacityPercent}% capacity) but was just assigned new work from ${request.requestNumber}.`,
          referenceType: 'dealer_quotation',
          referenceId: dealerQuotation.id,
        });
      }

      await notifyUser({
        userId: dealer.userId,
        type: 'dealer_assignment',
        title: 'New work assigned',
        message: `You've been assigned ${items.length} item(s) from request ${request.requestNumber}`,
        referenceType: 'dealer_quotation',
        referenceId: dealerQuotation.id,
      });    }

    await quotationRepository.updateRequestStatus(requestId, 'quoted');

    return created;
  }

  async getDealerQuotationForDealer(id: bigint, dealer: Dealer) {
    const dq = await quotationRepository.findDealerQuotationById(id);
    if (!dq || dq.dealerId !== dealer.id) throw ApiError.notFound('Dealer quotation not found');
    return this.redactSchoolPricing(dq);
  }

  async getDealerQuotationForSchool(id: bigint, school: School) {
    const dq = await quotationRepository.findDealerQuotationById(id);
    if (!dq || dq.quotationRequest.schoolId !== school.id) throw ApiError.notFound('Dealer quotation not found');
    return dq;
  }

  async getDealerQuotationForAdmin(id: bigint) {
    const dq = await quotationRepository.findDealerQuotationById(id);
    if (!dq) throw ApiError.notFound('Dealer quotation not found');
    return dq;
  }

  async listForDealer(dealer: Dealer, page?: number, limit?: number) {
    const { page: p, limit: l, skip, take } = normalizePagination(page, limit);
    const { items, total } = await quotationRepository.listDealerQuotationsForDealer(dealer.id, skip, take);
    return { items: items.map((dq) => this.redactSchoolPricing(dq)), meta: buildPaginationMeta(p, l, total) };
  }

  /** The school's selling price is EduNest's internal margin data — a dealer only ever needs to know/enter their own procurement price. */
  private redactSchoolPricing<T extends { dealerQuotationItems: Array<Record<string, unknown>> }>(dq: T) {
    return {
      ...dq,
      dealerQuotationItems: dq.dealerQuotationItems.map((item) => {
        const { schoolUnitPrice, ...rest } = item;
        void schoolUnitPrice;
        return rest;
      }),
    };
  }

  /** Dealer may revise pricing/quantities/validity/notes while the quotation is still awaiting the school's decision. */
  async updateDealerQuotation(
    id: bigint,
    dealer: Dealer,
    input: {
      items?: Array<{ itemId: bigint; dealerUnitPrice?: number; quotedQuantity?: number }>;
      validityDays?: number;
      notes?: string;
      expectedCompletionDate?: Date;
    },
  ) {
    const dq = await this.getDealerQuotationForDealer(id, dealer);
    if (dq.status !== 'submitted') {
      throw ApiError.badRequest('This quotation can no longer be edited');
    }

    if (input.items) {
      for (const item of input.items) {
        const belongs = dq.dealerQuotationItems.some((i) => i.id === item.itemId);
        if (!belongs) throw ApiError.badRequest(`Item ${item.itemId} does not belong to this quotation`);
        await quotationRepository.updateDealerQuotationItem(item.itemId, {
          dealerUnitPrice: item.dealerUnitPrice,
          quotedQuantity: item.quotedQuantity,
        });
      }
    }

    const refreshed = await quotationRepository.findDealerQuotationById(id);
    const totalAmount = refreshed!.dealerQuotationItems.reduce(
      (sum, i) => sum + Number(i.dealerUnitPrice) * i.quotedQuantity,
      0,
    );

    return quotationRepository.updateDealerQuotation(id, {
      totalAmount,
      validityDays: input.validityDays,
      notes: input.notes,
      expectedCompletionDate: input.expectedCompletionDate,
    });
  }

  async rejectDealerQuotation(id: bigint, school: School, reason?: string) {
    const dq = await quotationRepository.findDealerQuotationById(id);
    if (!dq || dq.quotationRequest.schoolId !== school.id) throw ApiError.notFound('Dealer quotation not found');
    if (dq.status !== 'submitted' && dq.status !== 'shortlisted') {
      throw ApiError.badRequest('This quotation has already been finalized');
    }

    await quotationRepository.updateDealerQuotationStatus(id, 'rejected');
    const dealer = await dealerRepository.findById(dq.dealerId);
    if (dealer) {
      await notifyUser({
        userId: dealer.userId,
        type: 'dealer_quotation_rejected',
        title: 'Quotation not accepted',
        message: reason ? `Your quotation was declined: ${reason}` : 'Your quotation was declined',
        referenceType: 'dealer_quotation',
        referenceId: id,
      });
    }
    return quotationRepository.findDealerQuotationById(id);
  }

  /** Accepting a dealer's quotation converts exactly that dealer's assigned items into a new Order. */
  async acceptDealerQuotation(id: bigint, school: School) {
    const dq = await quotationRepository.findDealerQuotationById(id);
    if (!dq || dq.quotationRequest.schoolId !== school.id) throw ApiError.notFound('Dealer quotation not found');
    if (dq.status !== 'submitted' && dq.status !== 'shortlisted') {
      throw ApiError.badRequest('This quotation can no longer be accepted');
    }

    let subtotal = 0;
let taxAmount = 0;
let dealerTotalAmount = 0;
const orderItems = [];
    for (const item of dq.dealerQuotationItems) {
      if (item.schoolUnitPrice == null) {
        throw ApiError.badRequest(
          `Quotation item ${item.quotationRequestProductId.toString()} is missing school pricing and cannot be accepted`,
        );
      }
      const lineSubtotal = Number(item.schoolUnitPrice) * item.quotedQuantity;
      const dealerLineTotal = Number(item.dealerUnitPrice) * item.quotedQuantity;
       let rate = 0;
      const product = item.quotationRequestProduct.product;
      if (product?.taxId) {
        const tax = await prisma.tax.findUnique({ where: { id: product.taxId } });
        if (tax?.isActive) rate = Number(tax.rate);
      }
      const lineTax = (lineSubtotal * rate) / 100;
      subtotal += lineSubtotal;
      taxAmount += lineTax;
      dealerTotalAmount += dealerLineTotal;

      const name =
        product?.name ?? item.quotationRequestProduct.kit?.name ?? item.quotationRequestProduct.customItemDescription ?? 'Item';
      orderItems.push({
        itemType: (product ? 'product' : item.quotationRequestProduct.kitId ? 'kit' : 'product') as 'product' | 'kit',
        productId: item.quotationRequestProduct.productId ?? undefined,
        kitId: item.quotationRequestProduct.kitId ?? undefined,
        itemNameSnapshot: name,
        quantity: item.quotedQuantity,
        unitPrice: Number(item.schoolUnitPrice),
        dealerUnitPrice: Number(item.dealerUnitPrice),
        taxAmount: lineTax,
        lineTotal: lineSubtotal + lineTax,
      });
    }

    const totalAmount = subtotal + taxAmount;
if (totalAmount <= 0) throw ApiError.badRequest('This quotation has no billable value');

const marginAmount = subtotal - dealerTotalAmount;
const platformFeeAmount = (totalAmount * PLATFORM_FEE_PERCENT) / 100;
const netRevenueAmount = marginAmount + platformFeeAmount;

const now = new Date();
    const expectedDeliveryDate = dq.expectedCompletionDate ?? new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const productionDeadline = new Date(expectedDeliveryDate.getTime() - 2 * 24 * 60 * 60 * 1000);

    const orderNumber = await generateOrderNumber();
    const order = await orderRepository.createWithItems({
      orderNumber,
      schoolId: school.id,
      subtotal,
      taxAmount,
      discountAmount: 0,
      shippingAmount: 0,
      totalAmount: totalAmount + platformFeeAmount,
dealerTotalAmount,
marginAmount,
platformFeeAmount,
netRevenueAmount,
productionDeadline,
expectedDeliveryDate,
priority: 'normal',
items: orderItems,
    });

await orderRepository.update(order.id, {
  dealerId: dq.dealerId,
});
    await quotationRepository.updateDealerQuotationStatus(id, 'accepted');
    await prisma.acceptedQuotation.create({ data: { dealerQuotationId: id, orderId: order.id } });
    await quotationRepository.updateRequestStatus(dq.quotationRequestId, 'closed');

    const dealer = await dealerRepository.findById(dq.dealerId);
    if (dealer) {
      await notifyUser({
        userId: dealer.userId,
        type: 'dealer_quotation_accepted',
        title: 'Quotation accepted',
        message: `Order ${order.orderNumber} has been created from your quotation`,
        referenceType: 'order',
        referenceId: order.id,
      });
    }

    return orderRepository.findById(order.id);
  }
}

export const quotationService = new QuotationService();
