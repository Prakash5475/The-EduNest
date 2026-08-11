import { Router } from 'express';
import { productController } from '@/controllers/product.controller';
import { validate } from '@/middlewares/validate.middleware';
import { authenticate } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/rbac.middleware';
import { SYSTEM_ROLES } from '@/constants';
import {
  listProductsSchema,
  productIdParamSchema,
  productSlugParamSchema,
  createProductSchema,
  updateProductSchema,
  addVariantSchema,
  updateVariantSchema,
  adjustStockSchema,
  relatedProductsSchema,
} from '@/validators/catalog.validators';

const router = Router();
const manageOnly = [authenticate, requireRole(SYSTEM_ROLES.SUPER_ADMIN, SYSTEM_ROLES.STAFF)];

/**
 * @openapi
 * /products:
 *   get:
 *     summary: Search/browse products with filters, sorting and pagination
 *     tags: [Catalog]
 */
router.get('/', validate(listProductsSchema), productController.list);

/**
 * @openapi
 * /products/compare:
 *   get:
 *     summary: Fetch up to 4 products side-by-side for comparison
 *     tags: [Catalog]
 */
router.get('/compare', productController.compare);

/**
 * @openapi
 * /products/low-stock:
 *   get:
 *     summary: Products/variants at or below their reorder level (admin)
 *     tags: [Catalog]
 */
router.get('/low-stock', authenticate, requireRole(SYSTEM_ROLES.SUPER_ADMIN, SYSTEM_ROLES.STAFF), productController.lowStock);

/**
 * @openapi
 * /products/recently-viewed/mine:
 *   get:
 *     summary: The current school's recently viewed products
 *     tags: [Catalog]
 */
router.get('/recently-viewed/mine', authenticate, productController.recentlyViewed);

/**
 * @openapi
 * /products/slug/{slug}:
 *   get:
 *     summary: Get a product by slug (product details page)
 *     tags: [Catalog]
 */
router.get('/slug/:slug', validate(productSlugParamSchema), productController.getBySlug);

/**
 * @openapi
 * /products/{id}:
 *   get:
 *     summary: Get a product by id
 *     tags: [Catalog]
 */
router.get('/:id', validate(productIdParamSchema), productController.getById);

/**
 * @openapi
 * /products/{id}/related:
 *   get:
 *     summary: Related products (same category)
 *     tags: [Catalog]
 */
router.get('/:id/related', validate(relatedProductsSchema), productController.related);

/**
 * @openapi
 * /products/{id}/frequently-bought-together:
 *   get:
 *     summary: Products frequently ordered alongside this one
 *     tags: [Catalog]
 */
router.get(
  '/:id/frequently-bought-together',
  validate(relatedProductsSchema),
  productController.frequentlyBoughtTogether,
);

/**
 * @openapi
 * /products/{id}/view:
 *   post:
 *     summary: Record that the current school viewed this product
 *     tags: [Catalog]
 */
router.post('/:id/view', authenticate, validate(productIdParamSchema), productController.recordView);

/**
 * @openapi
 * /products:
 *   post:
 *     summary: Create a product with images, specs and variants (admin)
 *     tags: [Catalog]
 */
router.post('/', manageOnly, validate(createProductSchema), productController.create);

/**
 * @openapi
 * /products/{id}:
 *   patch:
 *     summary: Update a product (admin)
 *     tags: [Catalog]
 */
router.patch('/:id', manageOnly, validate(updateProductSchema), productController.update);

/**
 * @openapi
 * /products/{id}:
 *   delete:
 *     summary: Soft-delete (discontinue) a product (admin)
 *     tags: [Catalog]
 */
router.delete('/:id', manageOnly, validate(productIdParamSchema), productController.delete);

/**
 * @openapi
 * /products/{id}/variants:
 *   post:
 *     summary: Add a variant to a product (admin)
 *     tags: [Catalog]
 */
router.post('/:id/variants', manageOnly, validate(addVariantSchema), productController.addVariant);

/**
 * @openapi
 * /products/{id}/variants/{variantId}:
 *   patch:
 *     summary: Update a product variant (admin)
 *     tags: [Catalog]
 */
router.patch(
  '/:id/variants/:variantId',
  manageOnly,
  validate(updateVariantSchema),
  productController.updateVariant,
);

/**
 * @openapi
 * /products/{id}/stock-adjustments:
 *   post:
 *     summary: Record a manual stock adjustment (admin) — always audited via StockHistory
 *     tags: [Catalog]
 */
router.post(
  '/:id/stock-adjustments',
  manageOnly,
  validate(adjustStockSchema),
  productController.adjustStock,
);

export default router;
