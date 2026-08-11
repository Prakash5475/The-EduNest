import { Router } from 'express';
import { settingsController } from '@/controllers/settings.controller';
import { validate } from '@/middlewares/validate.middleware';
import { authenticate } from '@/middlewares/auth.middleware';
import { requireRole } from '@/middlewares/rbac.middleware';
import { SYSTEM_ROLES } from '@/constants';
import {
  upsertApplicationSettingSchema,
  upsertScopedSettingSchema,
  upsertPaymentSettingSchema,
  upsertKeyValueSchema,
  upsertThemeSettingSchema,
} from '@/validators/settings.validators';

const router = Router();
const staffOnly = requireRole(SYSTEM_ROLES.SUPER_ADMIN, SYSTEM_ROLES.STAFF);
router.use(authenticate);

/**
 * @openapi
 * /settings/application:
 *   get:
 *     summary: List platform-wide application settings (admin)
 *     tags: [Settings]
 */
router.get('/application', staffOnly, settingsController.listApplication);
router.put('/application', staffOnly, validate(upsertApplicationSettingSchema), settingsController.upsertApplication);

/**
 * @openapi
 * /settings/payment:
 *   get:
 *     summary: List payment gateway configuration (admin) — Business Rules/Payment Settings
 *     tags: [Settings]
 */
router.get('/payment', staffOnly, settingsController.listPayment);
router.put('/payment', staffOnly, validate(upsertPaymentSettingSchema), settingsController.upsertPayment);

/**
 * @openapi
 * /settings/email:
 *   get:
 *     summary: List email/SMTP configuration (admin)
 *     tags: [Settings]
 */
router.get('/email', staffOnly, settingsController.listEmail);
router.put('/email', staffOnly, validate(upsertKeyValueSchema), settingsController.upsertEmail);

/**
 * @openapi
 * /settings/sms:
 *   get:
 *     summary: List SMS gateway configuration (admin)
 *     tags: [Settings]
 */
router.get('/sms', staffOnly, settingsController.listSms);
router.put('/sms', staffOnly, validate(upsertKeyValueSchema), settingsController.upsertSms);

/**
 * @openapi
 * /settings/theme:
 *   get:
 *     summary: Branding/theme settings, scoped platform-wide or per-school
 *     tags: [Settings]
 */
router.get('/theme', settingsController.listTheme);
router.put('/theme', staffOnly, validate(upsertThemeSettingSchema), settingsController.upsertTheme);

/**
 * @openapi
 * /settings/school/mine:
 *   get:
 *     summary: The current school's own settings (notification preferences, etc.)
 *     tags: [Settings]
 */
router.get('/school/mine', settingsController.listMySchoolSettings);
router.put('/school/mine', validate(upsertScopedSettingSchema), settingsController.upsertMySchoolSetting);

/**
 * @openapi
 * /settings/dealer/mine:
 *   get:
 *     summary: The current dealer's own settings
 *     tags: [Settings]
 */
router.get('/dealer/mine', settingsController.listMyDealerSettings);
router.put('/dealer/mine', validate(upsertScopedSettingSchema), settingsController.upsertMyDealerSetting);

export default router;
