import { Router } from 'express';
import { schoolAddressController } from '@/controllers/schoolAddress.controller';
import { validate } from '@/middlewares/validate.middleware';
import { authenticate } from '@/middlewares/auth.middleware';
import { createAddressSchema, updateAddressSchema, addressIdParamSchema } from '@/validators/schoolAddress.validators';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /addresses:
 *   get:
 *     summary: List the current school's saved addresses
 *     tags: [Addresses]
 */
router.get('/', schoolAddressController.list);

/**
 * @openapi
 * /addresses:
 *   post:
 *     summary: Add a new address for the current school
 *     tags: [Addresses]
 */
router.post('/', validate(createAddressSchema), schoolAddressController.create);

/**
 * @openapi
 * /addresses/{addressId}:
 *   patch:
 *     summary: Update one of the current school's addresses
 *     tags: [Addresses]
 */
router.patch('/:addressId', validate(updateAddressSchema), schoolAddressController.update);

/**
 * @openapi
 * /addresses/{addressId}:
 *   delete:
 *     summary: Remove an address
 *     tags: [Addresses]
 */
router.delete('/:addressId', validate(addressIdParamSchema), schoolAddressController.remove);

/**
 * @openapi
 * /addresses/{addressId}/default:
 *   post:
 *     summary: Mark an address as the default for future orders
 *     tags: [Addresses]
 */
router.post('/:addressId/default', validate(addressIdParamSchema), schoolAddressController.setDefault);

export default router;
