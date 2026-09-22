import { Router } from 'express';
import { deliveryController } from '@/controllers/delivery.controller';
import { validate } from '@/middlewares/validate.middleware';
import { authenticate } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/rbac.middleware';
import { SYSTEM_ROLES } from '@/constants';
import {
  listShipmentsSchema,
  shipmentIdParamSchema,
  orderIdParamSchema,
  createShipmentSchema,
  assignShipmentSchema,
  updateShipmentStatusSchema,
  rescheduleShipmentSchema,
  sendDeliveryOtpSchema,
  verifyDeliveryOtpSchema,
} from '@/validators/delivery.validators';

const router = Router();
// Admin/staff only. Schools/dealers read delivery status through the existing
// order-detail endpoint (order.controller.ts already includes shipment data via
// orderInclude) rather than duplicating access control here.
router.use(authenticate, requireRole(SYSTEM_ROLES.SUPER_ADMIN, SYSTEM_ROLES.STAFF));

/**
 * @openapi
 * /admin/deliveries:
 *   get:
 *     summary: List shipments — filterable by delivery partner and status
 *     tags: [Admin Deliveries]
 */
router.get('/', validate(listShipmentsSchema), deliveryController.list);

/**
 * @openapi
 * /admin/deliveries:
 *   post:
 *     summary: Create a shipment for an order (Ready for Dispatch)
 *     tags: [Admin Deliveries]
 */
router.post('/', validate(createShipmentSchema), deliveryController.create);

/**
 * @openapi
 * /admin/deliveries/order/{orderId}:
 *   get:
 *     summary: Get the shipment for a given order
 *     tags: [Admin Deliveries]
 */
router.get('/order/:orderId', validate(orderIdParamSchema), deliveryController.getByOrderId);

/**
 * @openapi
 * /admin/deliveries/order/{orderId}/history:
 *   get:
 *     summary: Full delivery status-change history for an order (all shipments)
 *     tags: [Admin Deliveries]
 */
router.get('/order/:orderId/history', validate(orderIdParamSchema), deliveryController.orderHistory);

/**
 * @openapi
 * /admin/deliveries/{id}:
 *   get:
 *     summary: Get a single shipment with its tracking and status history
 *     tags: [Admin Deliveries]
 */
router.get('/:id', validate(shipmentIdParamSchema), deliveryController.getById);

/**
 * @openapi
 * /admin/deliveries/{id}/assign:
 *   post:
 *     summary: Assign or reassign a shipment to a delivery partner
 *     tags: [Admin Deliveries]
 */
router.post('/:id/assign', validate(assignShipmentSchema), deliveryController.assign);

/**
 * @openapi
 * /admin/deliveries/{id}/status:
 *   patch:
 *     summary: Move a shipment to the next status. Cannot be used to reach 'delivered' — see /otp/verify.
 *     tags: [Admin Deliveries]
 */
router.patch('/:id/status', validate(updateShipmentStatusSchema), deliveryController.updateStatus);

/**
 * @openapi
 * /admin/deliveries/{id}/reschedule:
 *   post:
 *     summary: Reschedule a failed/attempted delivery (Super Admin/staff approval, since only they can call this)
 *     tags: [Admin Deliveries]
 */
router.post('/:id/reschedule', validate(rescheduleShipmentSchema), deliveryController.reschedule);

/**
 * @openapi
 * /admin/deliveries/{id}/otp/send:
 *   post:
 *     summary: Send the delivery-confirmation OTP to the recipient (email via SMTP, or phone via WhatsApp — both real, credential-gated)
 *     tags: [Admin Deliveries]
 */
router.post('/:id/otp/send', validate(sendDeliveryOtpSchema), deliveryController.sendOtp);

/**
 * @openapi
 * /admin/deliveries/{id}/otp/verify:
 *   post:
 *     summary: Verify the delivery-confirmation OTP and mark the shipment Delivered — the ONLY way to reach that status
 *     tags: [Admin Deliveries]
 */
router.post('/:id/otp/verify', validate(verifyDeliveryOtpSchema), deliveryController.verifyOtp);

export default router;
