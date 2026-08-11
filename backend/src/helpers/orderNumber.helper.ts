import crypto from 'node:crypto';
import { orderRepository } from '@/repositories/order.repository';
import { ApiError } from '@/utils/ApiError';

export async function generateOrderNumber(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = crypto.randomInt(100000, 999999);
    const candidate = `ORD-${datePart}-${randomPart}`;
    const existing = await orderRepository.findByOrderNumber(candidate);
    if (!existing) return candidate;
  }
  throw ApiError.internal('Could not generate a unique order number, please try again');
}
