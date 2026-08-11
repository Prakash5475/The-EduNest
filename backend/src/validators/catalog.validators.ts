import { z } from 'zod';

const idParam = z.object({ id: z.coerce.bigint() });
const slugParam = z.object({ slug: z.string().min(1) });

/* ------------------------------------------------------------------ */
/* Categories                                                          */
/* ------------------------------------------------------------------ */

export const listCategoriesSchema = z.object({
  query: z.object({
    parentId: z.coerce.bigint().optional(),
    isActive: z.coerce.boolean().optional(),
    search: z.string().trim().min(1).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const categoryIdParamSchema = z.object({ params: idParam, query: z.object({}).optional(), body: z.object({}).optional() });
export const categorySlugParamSchema = z.object({ params: slugParam, query: z.object({}).optional(), body: z.object({}).optional() });

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(120),
    slug: z.string().trim().min(1).max(140).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
    parentId: z.coerce.bigint().optional(),
    iconFileId: z.coerce.bigint().optional(),
    displayOrder: z.coerce.number().int().nonnegative().default(0),
    isActive: z.coerce.boolean().default(true),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(120).optional(),
    slug: z.string().trim().min(1).max(140).regex(/^[a-z0-9-]+$/).optional(),
    parentId: z.coerce.bigint().nullable().optional(),
    iconFileId: z.coerce.bigint().nullable().optional(),
    displayOrder: z.coerce.number().int().nonnegative().optional(),
    isActive: z.coerce.boolean().optional(),
  }),
  params: idParam,
  query: z.object({}).optional(),
});

/* ------------------------------------------------------------------ */
/* Brands                                                               */
/* ------------------------------------------------------------------ */

export const listBrandsSchema = z.object({
  query: z.object({
    isActive: z.coerce.boolean().optional(),
    search: z.string().trim().min(1).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const brandIdParamSchema = z.object({ params: idParam, query: z.object({}).optional(), body: z.object({}).optional() });

export const createBrandSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(120),
    slug: z.string().trim().min(1).max(140).regex(/^[a-z0-9-]+$/),
    logoFileId: z.coerce.bigint().optional(),
    isActive: z.coerce.boolean().default(true),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateBrandSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(120).optional(),
    slug: z.string().trim().min(1).max(140).regex(/^[a-z0-9-]+$/).optional(),
    logoFileId: z.coerce.bigint().nullable().optional(),
    isActive: z.coerce.boolean().optional(),
  }),
  params: idParam,
  query: z.object({}).optional(),
});

/* ------------------------------------------------------------------ */
/* Products                                                             */
/* ------------------------------------------------------------------ */

export const productSortSchema = z
  .enum(['relevance', 'price_asc', 'price_desc', 'newest', 'bestseller', 'rating'])
  .default('relevance');

export const listProductsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().optional(),
    search: z.string().trim().min(1).optional(),
    categoryId: z.coerce.bigint().optional(),
    categorySlug: z.string().trim().min(1).optional(),
    brandId: z.coerce.bigint().optional(),
    status: z.enum(['draft', 'active', 'inactive', 'discontinued']).optional(),
    minPrice: z.coerce.number().nonnegative().optional(),
    maxPrice: z.coerce.number().nonnegative().optional(),
    isFeatured: z.coerce.boolean().optional(),
    isCustomizable: z.coerce.boolean().optional(),
    inStockOnly: z.coerce.boolean().optional(),
    tag: z.string().trim().min(1).optional(),
    sort: productSortSchema.optional(),
  }),
  params: z.object({}).optional(),
  body: z.object({}).optional(),
});

export const productIdParamSchema = z.object({ params: idParam, query: z.object({}).optional(), body: z.object({}).optional() });
export const productSlugParamSchema = z.object({ params: slugParam, query: z.object({}).optional(), body: z.object({}).optional() });

const specificationInput = z.object({
  specName: z.string().trim().min(1).max(100),
  specValue: z.string().trim().min(1).max(255),
  displayOrder: z.coerce.number().int().nonnegative().default(0),
});

const variantInput = z.object({
  variantSku: z.string().trim().min(1).max(60),
  attributeSummary: z.string().trim().max(255).optional(),
  priceDelta: z.coerce.number().default(0),
  isActive: z.coerce.boolean().default(true),
  attributeValueIds: z.array(z.coerce.bigint()).default([]),
  quantityAvailable: z.coerce.number().int().nonnegative().default(0),
  reorderLevel: z.coerce.number().int().nonnegative().default(0),
});

const imageInput = z.object({
  fileId: z.coerce.bigint(),
  altText: z.string().trim().max(150).optional(),
  displayOrder: z.coerce.number().int().nonnegative().default(0),
  isPrimary: z.coerce.boolean().default(false),
});

export const createProductSchema = z.object({
  body: z.object({
    sku: z.string().trim().min(1).max(60),
    name: z.string().trim().min(1).max(220),
    slug: z.string().trim().min(1).max(250).regex(/^[a-z0-9-]+$/),
    categoryId: z.coerce.bigint(),
    brandId: z.coerce.bigint().optional(),
    shortDescription: z.string().trim().max(500).optional(),
    description: z.string().trim().optional(),
    basePrice: z.coerce.number().positive(),
    mrp: z.coerce.number().positive().optional(),
    taxId: z.coerce.bigint().optional(),
    minOrderQty: z.coerce.number().int().positive().default(1),
    weightKg: z.coerce.number().positive().optional(),
    status: z.enum(['draft', 'active', 'inactive', 'discontinued']).default('draft'),
    isFeatured: z.coerce.boolean().default(false),
    isCustomizable: z.coerce.boolean().default(false),
    quantityAvailable: z.coerce.number().int().nonnegative().default(0),
    reorderLevel: z.coerce.number().int().nonnegative().default(0),
    warehouseLocation: z.string().trim().max(150).optional(),
    tagIds: z.array(z.coerce.bigint()).default([]),
    specifications: z.array(specificationInput).default([]),
    images: z.array(imageInput).default([]),
    variants: z.array(variantInput).default([]),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

export const updateProductSchema = z.object({
  body: z.object({
    sku: z.string().trim().min(1).max(60).optional(),
    name: z.string().trim().min(1).max(220).optional(),
    slug: z.string().trim().min(1).max(250).regex(/^[a-z0-9-]+$/).optional(),
    categoryId: z.coerce.bigint().optional(),
    brandId: z.coerce.bigint().nullable().optional(),
    shortDescription: z.string().trim().max(500).nullable().optional(),
    description: z.string().trim().nullable().optional(),
    basePrice: z.coerce.number().positive().optional(),
    mrp: z.coerce.number().positive().nullable().optional(),
    taxId: z.coerce.bigint().nullable().optional(),
    minOrderQty: z.coerce.number().int().positive().optional(),
    weightKg: z.coerce.number().positive().nullable().optional(),
    status: z.enum(['draft', 'active', 'inactive', 'discontinued']).optional(),
    isFeatured: z.coerce.boolean().optional(),
    isCustomizable: z.coerce.boolean().optional(),
    tagIds: z.array(z.coerce.bigint()).optional(),
    specifications: z.array(specificationInput).optional(),
    images: z.array(imageInput).optional(),
  }),
  params: idParam,
  query: z.object({}).optional(),
});

export const addVariantSchema = z.object({
  body: variantInput,
  params: idParam,
  query: z.object({}).optional(),
});

export const updateVariantSchema = z.object({
  body: z.object({
    variantSku: z.string().trim().min(1).max(60).optional(),
    attributeSummary: z.string().trim().max(255).nullable().optional(),
    priceDelta: z.coerce.number().optional(),
    isActive: z.coerce.boolean().optional(),
    attributeValueIds: z.array(z.coerce.bigint()).optional(),
  }),
  params: z.object({ id: z.coerce.bigint(), variantId: z.coerce.bigint() }),
  query: z.object({}).optional(),
});

export const adjustStockSchema = z.object({
  body: z.object({
    variantId: z.coerce.bigint().optional(),
    dealerId: z.coerce.bigint().optional(),
    changeQty: z.coerce.number().int(),
    reason: z.enum(['purchase', 'sale', 'return', 'adjustment', 'damage']),
    referenceType: z.string().trim().max(60).optional(),
    referenceId: z.coerce.bigint().optional(),
  }),
  params: idParam,
  query: z.object({}).optional(),
});

export const relatedProductsSchema = z.object({
  params: idParam,
  query: z.object({ limit: z.coerce.number().int().positive().max(50).optional() }),
  body: z.object({}).optional(),
});
