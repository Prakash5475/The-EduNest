import { Router } from 'express';
import { orderController } from '@/controllers/order.controller';
import { validate } from '@/middlewares/validate.middleware';
import { authenticate } from '@/middlewares/auth.middleware';
import { listOrdersSchema, orderIdParamSchema, cancelOrderSchema } from '@/validators/order.validators';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /orders:
 *   get:
 *     summary: List the current school's orders (My Orders — filter by status for Current/Completed/Cancelled tabs)
 *     tags: [Orders]
 */
router.get('/', validate(listOrdersSchema), orderController.list);

/**
 * @openapi
 * /orders/{id}:
 *   get:
 *     summary: Get full order details (items, payments, invoices, status history)
 *     tags: [Orders]
 */
router.get('/:id', validate(orderIdParamSchema), orderController.getById);

/**
 * @openapi
 * /orders/{id}/cancel:
 *   post:
 *     summary: Cancel an order — only allowed before production begins (pending/confirmed)
 *     tags: [Orders]
 */
router.post('/:id/cancel', validate(cancelOrderSchema), orderController.cancel);

/**
 * @openapi
 * /orders/{id}/reorder:
 *   post:
 *     summary: Add every still-orderable item from a past order back into the cart
 *     tags: [Orders]
 */
router.post('/:id/reorder', validate(orderIdParamSchema), orderController.reorder);

/**
 * @openapi
 * /orders/{id}/challan:
 *   get:
 *     summary: Download a delivery challan PDF for an order (owning school, assigned dealer, or admin/staff) — quantities only, no pricing
 *     tags: [Orders]
 */
router.get('/:id/challan', validate(orderIdParamSchema), orderController.downloadChallanPdf);

export default router;
