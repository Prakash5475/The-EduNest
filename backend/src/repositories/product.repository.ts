import type { Prisma, Product, ProductStatus } from '@prisma/client';
import { BaseRepository } from './base.repository';

export interface ProductListFilters {
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
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'bestseller' | 'rating';
  skip: number;
  take: number;
}

const cardInclude = {
  category: { select: { id: true, name: true, slug: true } },
  brand: { select: { id: true, name: true, slug: true } },
  productImages: { orderBy: { displayOrder: 'asc' as const }, take: 1, include: { uploadedFile: { select: { filePath: true, fileName: true } } } },
  inventory: true,
  _count: { select: { productVariants: true } },
} satisfies Prisma.ProductInclude;

const detailInclude = {
  category: { select: { id: true, name: true, slug: true, parentId: true } },
  brand: { select: { id: true, name: true, slug: true } },
  productImages: { orderBy: { displayOrder: 'asc' as const }, include: { uploadedFile: { select: { filePath: true, fileName: true } } } },
  productVideos: true,
  specifications: { orderBy: { displayOrder: 'asc' as const } },
  productVariants: {
    where: { isActive: true },
    include: {
      productVariantAttributes: { include: { attributeValue: { include: { attribute: true } } } },
      inventory: true,
    },
  },
  inventory: true,
  productTags: { include: { tag: true } },
} satisfies Prisma.ProductInclude;

export class ProductRepository extends BaseRepository {
  async list(filters: ProductListFilters) {
    const where: Prisma.ProductWhereInput = { deletedAt: null };

    if (filters.status) where.status = filters.status;
    else where.status = 'active';

    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.categorySlug) where.category = { slug: filters.categorySlug };
    if (filters.brandId) where.brandId = filters.brandId;
    if (filters.isFeatured !== undefined) where.isFeatured = filters.isFeatured;
    if (filters.isCustomizable !== undefined) where.isCustomizable = filters.isCustomizable;
    if (filters.tag) where.productTags = { some: { tag: { slug: filters.tag } } };

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.basePrice = {
        ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
        ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
      };
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { shortDescription: { contains: filters.search } },
        { sku: { contains: filters.search } },
      ];
    }

    if (filters.inStockOnly) {
      where.inventory = { some: { quantityAvailable: { gt: 0 } } };
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput[] = (() => {
      switch (filters.sort) {
        case 'price_asc':
          return [{ basePrice: 'asc' }];
        case 'price_desc':
          return [{ basePrice: 'desc' }];
        case 'newest':
          return [{ createdAt: 'desc' }];
        case 'rating':
          return [{ avgRating: 'desc' }];
        case 'bestseller':
          // Approximated via order-item aggregate at query time below; default fallback order here.
          return [{ avgRating: 'desc' }, { createdAt: 'desc' }];
        default:
          return [{ isFeatured: 'desc' }, { createdAt: 'desc' }];
      }
    })();

    if (filters.sort === 'bestseller') {
      return this.listByBestseller(where, filters.skip, filters.take);
    }

    const [items, total] = await Promise.all([
      this.db.product.findMany({ where, include: cardInclude, orderBy, skip: filters.skip, take: filters.take }),
      this.db.product.count({ where }),
    ]);

    return { items, total };
  }

  /** Bestseller sort ranks by historical units sold (sum of order item quantities). */
  private async listByBestseller(where: Prisma.ProductWhereInput, skip: number, take: number) {
    const candidates = await this.db.product.findMany({
      where,
      select: { id: true },
    });
    if (candidates.length === 0) return { items: [], total: 0 };

    const ids = candidates.map((c) => c.id);
    const sales = await this.db.orderItem.groupBy({
      by: ['productId'],
      where: { productId: { in: ids } },
      _sum: { quantity: true },
    });
    const salesMap = new Map(sales.map((s) => [s.productId?.toString(), s._sum.quantity ?? 0]));
    const rankedIds = [...ids].sort(
      (a, b) => (salesMap.get(b.toString()) ?? 0) - (salesMap.get(a.toString()) ?? 0),
    );
    const pageIds = rankedIds.slice(skip, skip + take);

    const items = await this.db.product.findMany({ where: { id: { in: pageIds } }, include: cardInclude });
    const itemsById = new Map(items.map((i) => [i.id.toString(), i]));
    const ordered = pageIds.map((id) => itemsById.get(id.toString())).filter((p): p is (typeof items)[number] => !!p);

    return { items: ordered, total: rankedIds.length };
  }

  findById(id: bigint) {
    return this.db.product.findFirst({ where: { id, deletedAt: null }, include: detailInclude });
  }

  findBySlug(slug: string) {
    return this.db.product.findFirst({ where: { slug, deletedAt: null }, include: detailInclude });
  }

  findBySku(sku: string) {
    return this.db.product.findFirst({ where: { sku, deletedAt: null } });
  }

  async findRelated(product: { id: bigint; categoryId: bigint }, limit: number) {
    return this.db.product.findMany({
      where: { categoryId: product.categoryId, id: { not: product.id }, status: 'active', deletedAt: null },
      include: cardInclude,
      orderBy: [{ avgRating: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });
  }

  /** Products frequently appearing in the same order as the given product. */
  async findFrequentlyBoughtTogether(productId: bigint, limit: number) {
    const coOrders = await this.db.orderItem.findMany({
      where: { productId },
      select: { orderId: true },
    });
    const orderIds = coOrders.map((o) => o.orderId);
    if (orderIds.length === 0) return [];

    const coItems = await this.db.orderItem.groupBy({
      by: ['productId'],
      where: { orderId: { in: orderIds }, productId: { not: productId } },
      _count: { productId: true },
      orderBy: { _count: { productId: 'desc' } },
      take: limit,
    });
    const ids = coItems.map((c) => c.productId).filter((id): id is bigint => id !== null);
    if (ids.length === 0) return [];

    const products = await this.db.product.findMany({ where: { id: { in: ids }, status: 'active' }, include: cardInclude });
    const byId = new Map(products.map((p) => [p.id.toString(), p]));
    return ids.map((id) => byId.get(id.toString())).filter((p): p is (typeof products)[number] => !!p);
  }

  create(data: Prisma.ProductCreateInput): Promise<Product> {
    return this.db.product.create({ data, include: detailInclude });
  }

  update(id: bigint, data: Prisma.ProductUpdateInput): Promise<Product> {
    return this.db.product.update({ where: { id }, data, include: detailInclude });
  }

  softDelete(id: bigint): Promise<Product> {
    return this.db.product.update({ where: { id }, data: { deletedAt: new Date(), status: 'discontinued' } });
  }

  replaceTags(id: bigint, tagIds: bigint[]) {
    return this.db.$transaction([
      this.db.productTag.deleteMany({ where: { productId: id } }),
      ...(tagIds.length
        ? [this.db.productTag.createMany({ data: tagIds.map((tagId) => ({ productId: id, tagId })) })]
        : []),
    ]);
  }

  replaceSpecifications(id: bigint, specs: Array<{ specName: string; specValue: string; displayOrder: number }>) {
    return this.db.$transaction([
      this.db.specification.deleteMany({ where: { productId: id } }),
      ...(specs.length
        ? [this.db.specification.createMany({ data: specs.map((s) => ({ ...s, productId: id })) })]
        : []),
    ]);
  }

  replaceImages(
    id: bigint,
    images: Array<{ fileId: bigint; altText?: string; displayOrder: number; isPrimary: boolean }>,
  ) {
    return this.db.$transaction([
      this.db.productImage.deleteMany({ where: { productId: id } }),
      ...(images.length
        ? [this.db.productImage.createMany({ data: images.map((img) => ({ ...img, productId: id })) })]
        : []),
    ]);
  }

  async createInventoryRecord(data: {
    productId: bigint;
    variantId?: bigint;
    dealerId?: bigint;
    quantityAvailable: number;
    reorderLevel: number;
    warehouseLocation?: string;
  }) {
    return this.db.inventory.create({ data: { ...data, quantityReserved: 0 } });
  }

  async createVariantWithStock(
    productId: bigint,
    variant: {
      variantSku: string;
      attributeSummary?: string;
      priceDelta: number;
      isActive: boolean;
      attributeValueIds: bigint[];
      quantityAvailable: number;
      reorderLevel: number;
    },
  ) {
    return this.db.$transaction(async (tx) => {
      const created = await tx.productVariant.create({
        data: {
          productId,
          variantSku: variant.variantSku,
          attributeSummary: variant.attributeSummary,
          priceDelta: variant.priceDelta,
          isActive: variant.isActive,
        },
      });
      if (variant.attributeValueIds.length > 0) {
        await tx.productVariantAttribute.createMany({
          data: variant.attributeValueIds.map((attributeValueId) => ({
            variantId: created.id,
            attributeValueId,
          })),
        });
      }
      await tx.inventory.create({
        data: {
          productId,
          variantId: created.id,
          quantityAvailable: variant.quantityAvailable,
          reorderLevel: variant.reorderLevel,
          quantityReserved: 0,
        },
      });
      return created;
    });
  }

  findVariantById(productId: bigint, variantId: bigint) {
    return this.db.productVariant.findFirst({ where: { id: variantId, productId } });
  }

  async updateVariant(
    variantId: bigint,
    data: {
      variantSku?: string;
      attributeSummary?: string | null;
      priceDelta?: number;
      isActive?: boolean;
      attributeValueIds?: bigint[];
    },
  ) {
    return this.db.$transaction(async (tx) => {
      const { attributeValueIds, ...rest } = data;
      const updated = await tx.productVariant.update({ where: { id: variantId }, data: rest });
      if (attributeValueIds) {
        await tx.productVariantAttribute.deleteMany({ where: { variantId } });
        if (attributeValueIds.length > 0) {
          await tx.productVariantAttribute.createMany({
            data: attributeValueIds.map((attributeValueId) => ({ variantId, attributeValueId })),
          });
        }
      }
      return updated;
    });
  }

  async adjustStock(params: {
    productId: bigint;
    variantId?: bigint;
    dealerId?: bigint;
    changeQty: number;
    reason: 'purchase' | 'sale' | 'return' | 'adjustment' | 'damage';
    referenceType?: string;
    referenceId?: bigint;
    createdBy?: bigint;
  }) {
    return this.db.$transaction(async (tx) => {
      const scope = {
        productId: params.productId,
        variantId: params.variantId ?? null,
        dealerId: params.dealerId ?? null,
      };

      let inventory = await tx.inventory.findFirst({ where: scope });
      if (!inventory) {
        if (params.changeQty < 0) {
          throw new Error('Cannot reduce stock for a product with no inventory record');
        }
        inventory = await tx.inventory.create({
          data: { ...scope, quantityAvailable: 0, quantityReserved: 0, reorderLevel: 0 },
        });
      }

      const newQty = inventory.quantityAvailable + params.changeQty;
      if (newQty < 0) {
        throw new Error('Insufficient stock for this adjustment');
      }

      const updatedInventory = await tx.inventory.update({
        where: { id: inventory.id },
        data: { quantityAvailable: newQty },
      });

      await tx.stockHistory.create({
        data: {
          inventoryId: inventory.id,
          changeQty: params.changeQty,
          reason: params.reason,
          referenceType: params.referenceType,
          referenceId: params.referenceId,
          createdBy: params.createdBy,
        },
      });

      return updatedInventory;
    });
  }

  async lowStock(threshold?: number) {
    const items = await this.db.inventory.findMany({
      include: { product: { select: { id: true, name: true, sku: true } }, productVariant: true },
    });
    return items.filter((i) => i.quantityAvailable <= (threshold ?? i.reorderLevel));
  }
}

export const productRepository = new ProductRepository();
