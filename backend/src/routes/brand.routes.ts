import { Router } from 'express';
import { brandController } from '@/controllers/brand.controller';
import { validate } from '@/middlewares/validate.middleware';
import { authenticate } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/rbac.middleware';
import { SYSTEM_ROLES } from '@/constants';
import { listBrandsSchema, brandIdParamSchema, createBrandSchema, updateBrandSchema } from '@/validators/catalog.validators';

const router = Router();
const manageOnly = [authenticate, requireRole(SYSTEM_ROLES.SUPER_ADMIN, SYSTEM_ROLES.STAFF)];

/**
 * @openapi
 * /brands:
 *   get:
 *     summary: List brands
 *     tags: [Catalog]
 */
router.get('/', validate(listBrandsSchema), brandController.list);

/**
 * @openapi
 * /brands/{id}:
 *   get:
 *     summary: Get a brand by id
 *     tags: [Catalog]
 */
router.get('/:id', validate(brandIdParamSchema), brandController.getById);

/**
 * @openapi
 * /brands:
 *   post:
 *     summary: Create a brand (admin)
 *     tags: [Catalog]
 */
router.post('/', manageOnly, validate(createBrandSchema), brandController.create);

/**
 * @openapi
 * /brands/{id}:
 *   patch:
 *     summary: Update a brand (admin)
 *     tags: [Catalog]
 */
router.patch('/:id', manageOnly, validate(updateBrandSchema), brandController.update);

/**
 * @openapi
 * /brands/{id}:
 *   delete:
 *     summary: Delete a brand (admin)
 *     tags: [Catalog]
 */
router.delete('/:id', manageOnly, validate(brandIdParamSchema), brandController.delete);

export default router;
