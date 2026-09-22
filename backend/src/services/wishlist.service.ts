import { wishlistRepository } from '@/repositories/wishlist.repository';
import { productRepository } from '@/repositories/product.repository';
import { cartService } from '@/services/cart.service';
import { ApiError } from '@/utils/ApiError';
import type { School } from '@prisma/client';

export class WishlistService {
  async getOrCreateDefault(school: School) {
    const existing = await wishlistRepository.findDefaultBySchool(school.id);
    if (existing) return existing;
    return wishlistRepository.createDefault(school.id);
  }

  async list(school: School) {
    return this.getOrCreateDefault(school);
  }

  async addItem(school: School, productId: bigint) {
    const product = await productRepository.findById(productId);
    if (!product) throw ApiError.notFound('Product not found');

    const wishlist = await this.getOrCreateDefault(school);
    const existing = await wishlistRepository.findByProduct(wishlist.id, productId);
    if (existing) return this.getOrCreateDefault(school);

    await wishlistRepository.addItem(wishlist.id, productId);
    return this.getOrCreateDefault(school);
  }

  async removeItem(school: School, itemId: bigint) {
    const wishlist = await this.getOrCreateDefault(school);
    const item = await wishlistRepository.findItem(wishlist.id, itemId);
    if (!item) throw ApiError.notFound('Wishlist item not found');
    await wishlistRepository.removeItem(itemId);
    return this.getOrCreateDefault(school);
  }

  async moveToCart(school: School, itemId: bigint, quantity?: number) {
    const wishlist = await this.getOrCreateDefault(school);
    const item = await wishlistRepository.findItem(wishlist.id, itemId);
    if (!item) throw ApiError.notFound('Wishlist item not found');
    if (!item.productId) {
      throw ApiError.badRequest('This wishlist entry cannot be moved to cart yet');
    }

    const product = await productRepository.findById(item.productId);
    if (!product) throw ApiError.notFound('Product not found');

    await cartService.addItem(school, {
      productId: item.productId,
      quantity: quantity ?? product.minOrderQty,
    });
    await wishlistRepository.removeItem(itemId);

    return this.getOrCreateDefault(school);
  }
}

export const wishlistService = new WishlistService();
