import swaggerJSDoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'The EduNest API',
      version: '1.0.0',
      description:
        'Backend foundation (auth, RBAC, shared infrastructure) plus Catalog, Cart & Wishlist, ' +
        'Product Customization, Checkout, Payments (Razorpay, 50% advance rule enforced ' +
        'server-side), school-facing Orders, Production Tracking (append-only checkpoints, ' +
        'live Socket.IO updates), and Quotation & Dealer Assignment (Master Quotation → ' +
        'admin assigns dealers → dealer quotations → school accepts → Order). Schema was ' +
        'extended for Customization, Checkout, Payments, and Production Tracking — see ' +
        'CHANGELOG.md. Admin/Dealer portal surfaces, Analytics, Reports, Support, and ' +
        'Settings ship in subsequent phases.',
    },
    servers: [{ url: `${env.APP_URL}${env.API_PREFIX}`, description: 'Current environment' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        ApiSuccess: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'OK' },
            data: { type: 'object' },
            meta: { type: 'object', nullable: true },
          },
        },
        ApiError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'object' }, nullable: true },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/**/*.ts', './src/controllers/**/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);
