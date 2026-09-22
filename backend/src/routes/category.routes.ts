import { Router } from 'express';
import { categoryController } from '@/controllers/category.controller';
import { validate } from '@/middlewares/validate.middleware';
import { authenticate } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/rbac.middleware';
import { SYSTEM_ROLES } from '@/constants';
import {
  listCategoriesSchema,
  categoryIdParamSchema,
  categorySlugParamSchema,
  createCategorySchema,
  updateCategorySchema,
} from '@/validators/catalog.validators';

const router = Router();
const manageOnly = [authenticate, requireRole(SYSTEM_ROLES.SUPER_ADMIN, SYSTEM_ROLES.STAFF)];

/**
 * @openapi
 * /categories:
 *   get:
 *     summary: List categories (paginated, filterable by parent/search)
 *     tags: [Catalog]
 */
router.get('/', validate(listCategoriesSchema), categoryController.list);

/**
 * @openapi
 * /categories/tree:
 *   get:
 *     summary: Full active category tree for navigation menus
 *     tags: [Catalog]
 */
router.get('/tree', categoryController.tree);

/**
 * @openapi
 * /categories/slug/{slug}:
 *   get:
 *     summary: Get a category by slug
 *     tags: [Catalog]
 */
router.get('/slug/:slug', validate(categorySlugParamSchema), categoryController.getBySlug);

/**
 * @openapi
 * /categories/{id}:
 *   get:
 *     summary: Get a category by id
 *     tags: [Catalog]
 */
router.get('/:id', validate(categoryIdParamSchema), categoryController.getById);

/**
 * @openapi
 * /categories:
 *   post:
 *     summary: Create a category (admin)
 *     tags: [Catalog]
 */
router.post('/', manageOnly, validate(createCategorySchema), categoryController.create);

/**
 * @openapi
 * /categories/{id}:
 *   patch:
 *     summary: Update a category (admin)
 *     tags: [Catalog]
 */
router.patch('/:id', manageOnly, validate(updateCategorySchema), categoryController.update);

/**
 * @openapi
 * /categories/{id}:
 *   delete:
 *     summary: Soft-delete a category (admin)
 *     tags: [Catalog]
 */
router.delete('/:id', manageOnly, validate(categoryIdParamSchema), categoryController.delete);

export default router;
