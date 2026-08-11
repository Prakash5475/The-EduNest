import type { Prisma, OrderStatus, OrderPaymentStatus, OrderPriority } from '@prisma/client';
import { BaseRepository } from './base.repository';

const orderInclude = {
  orderItems: { include: { product: true, productVariant: true } },
  schoolAddress: true,
  schoolAddressRef: true,
  shippingMethod: true,
  payments: { orderBy: { createdAt: 'asc' as const } },
  invoices: { include: { uploadedFile: { select: { filePath: true } } } },
  orderStatusHistory: { orderBy: { createdAt: 'asc' as const } },
  dealer: { select: { id: true, businessName: true } },
  school: { select: { id: true, schoolName: true, gstin: true } },
} satisfies Prisma.OrderInclude;

export interface OrderListFilters {
  schoolId?: bigint;
  dealerId?: bigint;
  status?: OrderStatus;
  paymentStatus?: OrderPaymentStatus;
  priority?: OrderPriority;
  skip: number;
  take: number;
}

export class OrderRepository extends BaseRepository {
  findById(id: bigint) {
    return this.db.order.findFirst({ where: { id, deletedAt: null }, include: orderInclude });
  }

  findByOrderNumber(orderNumber: string) {
    return this.db.order.findFirst({ where: { orderNumber, deletedAt: null }, include: orderInclude });
  }

  async list(filters: OrderListFilters) {
    const where: Prisma.OrderWhereInput = {
      deletedAt: null,
      ...(filters.schoolId ? { schoolId: filters.schoolId } : {}),
      ...(filters.dealerId ? { dealerId: filters.dealerId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.paymentStatus ? { paymentStatus: filters.paymentStatus } : {}),
      ...(filters.priority ? { priority: filters.priority } : {}),
    };

    const [items, total] = await Promise.all([
      this.db.order.findMany({
        where,
        include: orderInclude,
        orderBy: { placedAt: 'desc' },
        skip: filters.skip,
        take: filters.take,
      }),
      this.db.order.count({ where }),
    ]);

    return { items, total };
  }

  /** Orders whose production_deadline has passed but which aren't yet delivered/completed/cancelled. */
  findLate() {
    return this.db.order.findMany({
      where: {
        deletedAt: null,
        productionDeadline: { lt: new Date() },
        status: { notIn: ['delivered', 'completed', 'cancelled', 'returned'] },
      },
      include: orderInclude,
      orderBy: { productionDeadline: 'asc' },
    });
  }

  /** Orders whose deadline is within `withinDays` days — used for the "Near Deadline" dashboard widget. */
  findNearDeadline(withinDays: number) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + withinDays);
    return this.db.order.findMany({
      where: {
        deletedAt: null,
        productionDeadline: { gte: new Date(), lte: cutoff },
        status: { notIn: ['delivered', 'completed', 'cancelled', 'returned'] },
      },
      include: orderInclude,
      orderBy: { productionDeadline: 'asc' },
    });
  }

  async createWithItems(data: {
    orderNumber: string;
    schoolId: bigint;
    billingAddressId?: bigint;
    shippingAddressId?: bigint;
    shippingMethodId?: bigint;
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    shippingAmount: number;
    totalAmount: number;
    productionDeadline?: Date;
    expectedDeliveryDate?: Date;
    priority: OrderPriority;
    items: Array<{
      itemType: 'product' | 'kit';
      productId?: bigint;
      variantId?: bigint;
      kitId?: bigint;
      itemNameSnapshot: string;
      quantity: number;
      unitPrice: number;
      taxAmount: number;
      lineTotal: number;
    }>;
  }) {
    return this.db.order.create({
      data: {
        orderNumber: data.orderNumber,
        schoolId: data.schoolId,
        billingAddressId: data.billingAddressId,
        shippingAddressId: data.shippingAddressId,
        shippingMethodId: data.shippingMethodId,
        subtotal: data.subtotal,
        taxAmount: data.taxAmount,
        discountAmount: data.discountAmount,
        shippingAmount: data.shippingAmount,
        totalAmount: data.totalAmount,
        currency: 'INR',
        status: 'pending',
        paymentStatus: 'unpaid',
        productionDeadline: data.productionDeadline,
        expectedDeliveryDate: data.expectedDeliveryDate,
        priority: data.priority,
        orderItems: { createMany: { data: data.items } },
        orderStatusHistory: { create: { status: 'pending', note: 'Order created — awaiting advance payment' } },
      },
      include: orderInclude,
    });
  }

  update(
  id: bigint,
  data: Prisma.OrderUncheckedUpdateInput
) {
  return this.db.order.update({
    where: { id },
    data,
    include: orderInclude,
  });
}

  addStatusHistory(orderId: bigint, status: string, changedBy?: bigint, note?: string) {
    return this.db.orderStatusHistory.create({ data: { orderId, status, changedBy, note } });
  }

  /** Real aggregation — never stored — of everything successfully paid toward an order. */
  async sumSuccessfulPayments(orderId: bigint): Promise<number> {
    const result = await this.db.payment.aggregate({
      where: { orderId, status: 'success' },
      _sum: { amount: true },
    });
    return Number(result._sum.amount ?? 0);
  }
}

export const orderRepository = new OrderRepository();
