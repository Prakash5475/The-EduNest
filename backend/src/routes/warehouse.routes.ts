import { Router } from 'express';
import { warehouseController } from '@/controllers/warehouse.controller';
import { validate } from '@/middlewares/validate.middleware';
import { authenticate } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/rbac.middleware';
import { SYSTEM_ROLES } from '@/constants';
import {
  listWarehousesSchema,
  warehouseIdParamSchema,
  createWarehouseSchema,
  updateWarehouseSchema,
  setWarehouseActiveSchema,
} from '@/validators/warehouse.validators';

const router = Router();
router.use(authenticate, requireRole(SYSTEM_ROLES.SUPER_ADMIN, SYSTEM_ROLES.STAFF));

/**
 * @openapi
 * /admin/warehouses:
 *   get:
 *     summary: List warehouses
 *     tags: [Admin Warehouses]
 */
router.get('/', validate(listWarehousesSchema), warehouseController.list);

/**
 * @openapi
 * /admin/warehouses:
 *   post:
 *     summary: Create a warehouse
 *     tags: [Admin Warehouses]
 */
router.post('/', validate(createWarehouseSchema), warehouseController.create);

/**
 * @openapi
 * /admin/warehouses/{id}:
 *   get:
 *     summary: Get a warehouse, including its aggregate stock summary
 *     tags: [Admin Warehouses]
 */
router.get('/:id', validate(warehouseIdParamSchema), warehouseController.getById);

/**
 * @openapi
 * /admin/warehouses/{id}:
 *   patch:
 *     summary: Edit a warehouse's details
 *     tags: [Admin Warehouses]
 */
router.patch('/:id', validate(updateWarehouseSchema), warehouseController.update);

/**
 * @openapi
 * /admin/warehouses/{id}/active:
 *   patch:
 *     summary: Activate/deactivate a warehouse — blocked while inventory is still assigned to it
 *     tags: [Admin Warehouses]
 */
router.patch('/:id/active', validate(setWarehouseActiveSchema), warehouseController.setActive);

export default router;
