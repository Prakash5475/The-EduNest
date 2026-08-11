import { productRepository, type ProductListFilters } from '@/repositories/product.repository';
import { categoryRepository } from '@/repositories/category.repository';
import { recentlyViewedRepository } from '@/repositories/recentlyViewed.repository';
import { ApiError } from '@/utils/ApiError';
import { normalizePagination, buildPaginationMeta } from '@/helpers/pagination.helper';
import type { Prisma, Product, ProductStatus, School } from '@prisma/client';

export interface ProductListQuery {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: bigint;
  categorySlug?: string;
  brandId?: bigint;
  status?: ProductStatus;
  minPrice?: number;
  maxPrice?: number;
  isFeatured?: boolean;
  isCustomizable?: boolean;
  inStockOnly?: boolean;
  tag?: string;
  sort?: ProductListFilters['sort'];
}

interface SpecInput {
  specName: string;
  specValue: string;
  displayOrder: number;
}

interface ImageInput {
  fileId: bigint;
  altText?: string;
  displayOrder: number;
  isPrimary: boolean;
}

interface VariantInput {
  variantSku: string;
  attributeSummary?: string;
  priceDelta: number;
  isActive: boolean;
  attributeValueIds: bigint[];
  quantityAvailable: number;
  reorderLevel: number;
}

interface CreateProductInput {
  sku: string;
  name: string;
  slug: string;
  categoryId: bigint;
  brandId?: bigint;
  shortDescription?: string;
  description?: string;
  basePrice: number;
  mrp?: number;
  taxId?: bigint;
  minOrderQty: number;
  weightKg?: number;
  status: ProductStatus;
  isFeatured: boolean;
  isCustomizable: boolean;
  quantityAvailable: number;
  reorderLevel: number;
  warehouseLocation?: string;
  tagIds: bigint[];
  specifications: SpecInput[];
  images: ImageInput[];
  variants: VariantInput[];
  createdBy?: bigint;
}

/** Total available units for a product, summed across every inventory record (all dealers/variants). */
function computeAvailability(product: Product & { inventory?: Array<{ quantityAvailable: number; quantityReserved: number }> }) {
  const inventory = product.inventory ?? [];
  const available = inventory.reduce((sum, i) => sum + Math.max(0, i.quantityAvailable - i.quantityReserved), 0);
  return { quantityAvailable: available, inStock: available > 0 };
}

export class ProductService {
  async list(query: ProductListQuery) {
    const { page, limit, skip, take } = normalizePagination(query.page, query.limit);
    const { items, total } = await productRepository.list({ ...query, skip, take });
    return {
      items: items.map((p) => ({ ...p, availability: computeAvailability(p as never) })),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getById(id: bigint) {
    const product = await productRepository.findById(id);
    if (!product) throw ApiError.notFound('Product not found');
    return { ...product, availability: computeAvailability(product as never) };
  }

  async getBySlug(slug: string) {
    const product = await productRepository.findBySlug(slug);
    if (!product) throw ApiError.notFound('Product not found');
    return { ...product, availability: computeAvailability(product as never) };
  }

  async getManyForCompare(ids: bigint[]) {
    if (ids.length === 0) return [];
    if (ids.length > 4) throw ApiError.badRequest('You can compare up to 4 products at a time');
    const products = await Promise.all(ids.map((id) => productRepository.findById(id)));
    const missing = ids.filter((_, idx) => !products[idx]);
    if (missing.length) throw ApiError.notFound('One or more products could not be found');
    return products.map((p) => ({ ...p!, availability: computeAvailability(p as never) }));
  }

  async related(id: bigint, limit = 8) {
    const product = await this.getById(id);
    return productRepository.findRelated({ id: product.id, categoryId: product.categoryId }, limit);
  }

  async frequentlyBoughtTogether(id: bigint, limit = 4) {
    await this.getById(id);
    return productRepository.findFrequentlyBoughtTogether(id, limit);
  }

  /**
   * Validates a requested order quantity against the product's Minimum Order Quantity.
   * Enforced here (not just in the UI) per the platform's B2B business rules — every
   * cart/checkout/quote flow must call this before accepting a quantity.
   */
  async validateOrderQuantity(id: bigint, requestedQty: number): Promise<Product> {
    const product = await productRepository.findById(id);
    if (!product) throw ApiError.notFound('Product not found');
    if (requestedQty < product.minOrderQty) {
      throw ApiError.badRequest(
        `Minimum order quantity for this product is ${product.minOrderQty} units`,
      );
    }
    return product;
  }

  async create(data: CreateProductInput) {
    const existingSku = await productRepository.findBySku(data.sku);
    if (existingSku) throw ApiError.conflict('A product with this SKU already exists');
    const existingSlug = await productRepository.findBySlug(data.slug);
    if (existingSlug) throw ApiError.conflict('A product with this slug already exists');

    const category = await categoryRepository.findById(data.categoryId);
    if (!category) throw ApiError.badRequest('Category not found');

    const createInput: Prisma.ProductCreateInput = {
      sku: data.sku,
      name: data.name,
      slug: data.slug,
      shortDescription: data.shortDescription,
      description: data.description,
      basePrice: data.basePrice,
      mrp: data.mrp,
      minOrderQty: data.minOrderQty,
      weightKg: data.weightKg,
      status: data.status,
      isFeatured: data.isFeatured,
      isCustomizable: data.isCustomizable,
      avgRating: 0,
      taxId: data.taxId,
      category: { connect: { id: data.categoryId } },
      ...(data.brandId ? { brand: { connect: { id: data.brandId } } } : {}),
      ...(data.createdBy ? { user: { connect: { id: data.createdBy } } } : {}),
      ...(data.specifications.length
        ? { specifications: { createMany: { data: data.specifications } } }
        : {}),
      ...(data.images.length ? { productImages: { createMany: { data: data.images } } } : {}),
      ...(data.tagIds.length ? { productTags: { createMany: { data: data.tagIds.map((tagId) => ({ tagId })) } } } : {}),
      inventory: {
        create: {
          quantityAvailable: data.quantityAvailable,
          quantityReserved: 0,
          reorderLevel: data.reorderLevel,
          warehouseLocation: data.warehouseLocation,
        },
      },
    };

    const product = await productRepository.create(createInput);

    for (const variant of data.variants) {
      await productRepository.createVariantWithStock(product.id, variant);
    }

    return this.getById(product.id);
  }

  async update(
    id: bigint,
    data: Partial<{
      sku: string;
      name: string;
      slug: string;
      categoryId: bigint;
      brandId: bigint | null;
      shortDescription: string | null;
      description: string | null;
      basePrice: number;
      mrp: number | null;
      taxId: bigint | null;
      minOrderQty: number;
      weightKg: number | null;
      status: ProductStatus;
      isFeatured: boolean;
      isCustomizable: boolean;
      tagIds: bigint[];
      specifications: SpecInput[];
      images: ImageInput[];
    }>,
  ) {
    const existing = await this.getById(id);

    if (data.sku && data.sku !== existing.sku) {
      const dupe = await productRepository.findBySku(data.sku);
      if (dupe) throw ApiError.conflict('A product with this SKU already exists');
    }
    if (data.slug && data.slug !== existing.slug) {
      const dupe = await productRepository.findBySlug(data.slug);
      if (dupe) throw ApiError.conflict('A product with this slug already exists');
    }
    if (data.categoryId) {
      const category = await categoryRepository.findById(data.categoryId);
      if (!category) throw ApiError.badRequest('Category not found');
    }

    if (data.basePrice !== undefined && data.basePrice !== Number(existing.basePrice)) {
      await this.recordPriceChange(id, Number(existing.basePrice), data.basePrice);
    }

    const { tagIds, specifications, images, categoryId, brandId, ...rest } = data;

    await productRepository.update(id, {
      ...rest,
      ...(categoryId ? { category: { connect: { id: categoryId } } } : {}),
      ...(brandId !== undefined
        ? brandId === null
          ? { brand: { disconnect: true } }
          : { brand: { connect: { id: brandId } } }
        : {}),
    });

    if (tagIds) await productRepository.replaceTags(id, tagIds);
    if (specifications) await productRepository.replaceSpecifications(id, specifications);
    if (images) await productRepository.replaceImages(id, images);

    return this.getById(id);
  }

  private async recordPriceChange(productId: bigint, oldPrice: number, newPrice: number) {
    const { prisma } = await import('@/config/database');
    await prisma.priceHistory.create({ data: { productId, oldPrice, newPrice } });
  }

  async delete(id: bigint): Promise<void> {
    await this.getById(id);
    await productRepository.softDelete(id);
  }

  async addVariant(productId: bigint, variant: VariantInput) {
    await this.getById(productId);
    await productRepository.createVariantWithStock(productId, variant);
    return this.getById(productId);
  }

  async updateVariant(
    productId: bigint,
    variantId: bigint,
    data: Partial<{
      variantSku: string;
      attributeSummary: string | null;
      priceDelta: number;
      isActive: boolean;
      attributeValueIds: bigint[];
    }>,
  ) {
    const variant = await productRepository.findVariantById(productId, variantId);
    if (!variant) throw ApiError.notFound('Variant not found for this product');
    await productRepository.updateVariant(variantId, data);
    return this.getById(productId);
  }

  async adjustStock(
    productId: bigint,
    data: {
      variantId?: bigint;
      dealerId?: bigint;
      changeQty: number;
      reason: 'purchase' | 'sale' | 'return' | 'adjustment' | 'damage';
      referenceType?: string;
      referenceId?: bigint;
      createdBy?: bigint;
    },
  ) {
    await this.getById(productId);
    try {
      return await productRepository.adjustStock({ productId, ...data });
    } catch (err) {
      if (err instanceof Error) throw ApiError.badRequest(err.message);
      throw err;
    }
  }

  async lowStockReport(threshold?: number) {
    return productRepository.lowStock(threshold);
  }

  async recordView(school: School, productId: bigint): Promise<void> {
    await this.getById(productId); // throws 404 if the product doesn't exist
    await recentlyViewedRepository.recordView(school.id, productId);
  }

  async listRecentlyViewed(school: School, limit = 12) {
    return recentlyViewedRepository.listRecent(school.id, limit);
  }
}

export const productService = new ProductService();
