import { Router } from 'express';
import { adminDashboardController } from '@/controllers/adminDashboard.controller';
import { authenticate } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/rbac.middleware';
import { SYSTEM_ROLES } from '@/constants';

const router = Router();
router.use(authenticate, requireRole(SYSTEM_ROLES.SUPER_ADMIN, SYSTEM_ROLES.STAFF));

/**
 * @openapi
 * /admin/dashboard/summary:
 *   get:
 *     summary: Real SQL-aggregated dashboard summary — revenue, orders, payments, production, dealer status, quotations, inventory, recent orders
 *     tags: [Admin Dashboard]
 */
router.get('/summary', adminDashboardController.summary);

/**
 * @openapi
 * /admin/dashboard/top-products:
 *   get:
 *     summary: Top products by units sold (real OrderItem aggregation)
 *     tags: [Admin Dashboard]
 */
router.get('/top-products', adminDashboardController.topProducts);

/**
 * @openapi
 * /admin/dashboard/top-categories:
 *   get:
 *     summary: Top categories by revenue (real OrderItem aggregation)
 *     tags: [Admin Dashboard]
 */
router.get('/top-categories', adminDashboardController.topCategories);

/**
 * @openapi
 * /admin/dashboard/revenue-trend:
 *   get:
 *     summary: Monthly revenue trend (real SQL date-truncated aggregation)
 *     tags: [Admin Dashboard]
 */
router.get('/revenue-trend', adminDashboardController.revenueTrend);

/**
 * @openapi
 * /admin/dashboard/dealer-capacity:
 *   get:
 *     summary: Workload/capacity snapshot for every active dealer — the recommendation view before assigning work
 *     tags: [Admin Dashboard]
 */
router.get('/dealer-capacity', adminDashboardController.dealerCapacity);

/**
 * @openapi
 * /admin/dashboard/dealer-capacity/{dealerId}:
 *   get:
 *     summary: Workload/capacity snapshot for a single dealer
 *     tags: [Admin Dashboard]
 */
router.get('/dealer-capacity/:dealerId', adminDashboardController.dealerCapacityById);

export default router;
