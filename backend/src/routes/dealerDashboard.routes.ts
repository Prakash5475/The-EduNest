import { Router } from 'express';
import { dealerDashboardController } from '@/controllers/dealerDashboard.controller';
import { dealerOrderController } from '@/controllers/dealerOrder.controller';
import { dealerAccountController } from '@/controllers/dealerAccount.controller';
import { authenticate } from '@/middlewares/auth.middleware';
import { validate } from '@/middlewares/validate.middleware';
import {
  listDealerOrdersSchema,
  dealerOrderIdParamSchema,
  updateDealerOrderStatusSchema,
} from '@/validators/dealerOrder.validators';
import { updateDealerAccountSchema, addDealerAddressSchema } from '@/validators/dealerAccount.validators';
import { dateRangeQuerySchema } from '@/validators/reports.validators';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /dealer/dashboard:
 *   get:
 *     summary: The current dealer's own dashboard — capacity snapshot, recent assigned orders, recent production checkpoints. Scoped strictly to this dealer.
 *     tags: [Dealer Dashboard]
 */
router.get('/dashboard', dealerDashboardController.dashboard);

/**
 * @openapi
 * /dealer/analytics:
 *   get:
 *     summary: The current dealer's own performance analytics — order counts, revenue, monthly trend. Add ?from&?to to filter by date range.
 *     tags: [Dealer Dashboard]
 */
router.get('/analytics', validate(dateRangeQuerySchema), dealerDashboardController.analytics);

/**
 * @openapi
 * /dealer/reports/orders:
 *   get:
 *     summary: Export the current dealer's own orders — ?format=csv|xlsx|pdf (default csv)
 *     tags: [Dealer Dashboard]
 */
router.get('/reports/orders', validate(dateRangeQuerySchema), dealerDashboardController.exportOrders);

/**
 * @openapi
 * /dealer/orders:
 *   get:
 *     summary: List orders assigned to the current dealer
 *     tags: [Dealer Dashboard]
 */
router.get('/orders', validate(listDealerOrdersSchema), dealerOrderController.list);

/**
 * @openapi
 * /dealer/orders/{id}:
 *   get:
 *     summary: Get a single assigned order's detail
 *     tags: [Dealer Dashboard]
 */
router.get('/orders/:id', validate(dealerOrderIdParamSchema), dealerOrderController.getById);

/**
 * @openapi
 * /dealer/orders/{id}/status:
 *   patch:
 *     summary: Move an assigned order to the next stage (confirm -> processing -> shipped)
 *     tags: [Dealer Dashboard]
 */
router.patch('/orders/:id/status', validate(updateDealerOrderStatusSchema), dealerOrderController.updateStatus);

/**
 * @openapi
 * /dealer/me:
 *   get:
 *     summary: Get the current dealer's own profile + saved addresses
 *     tags: [Dealer Dashboard]
 */
router.get('/me', dealerAccountController.getMe);

/**
 * @openapi
 * /dealer/me:
 *   patch:
 *     summary: Update the current dealer's business profile
 *     tags: [Dealer Dashboard]
 */
router.patch('/me', validate(updateDealerAccountSchema), dealerAccountController.updateMe);

/**
 * @openapi
 * /dealer/addresses:
 *   post:
 *     summary: Add a new address for the current dealer
 *     tags: [Dealer Dashboard]
 */
router.post('/addresses', validate(addDealerAddressSchema), dealerAccountController.addAddress);

export default router;
