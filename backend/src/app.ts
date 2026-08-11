import '@/utils/bigint';
import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { env, corsAllowedOrigins } from '@/config/env';
import { swaggerSpec } from '@/config/swagger';
import { requestLogger } from '@/middlewares/requestLogger.middleware';
import { responseFormatter } from '@/middlewares/responseFormatter.middleware';
import { globalRateLimiter } from '@/middlewares/rateLimiter.middleware';
import { notFoundHandler } from '@/middlewares/notFound.middleware';
import { errorHandler } from '@/middlewares/errorHandler.middleware';
import { auditLogger } from '@/middlewares/auditLogger.middleware';
import healthRoutes from '@/routes/health.routes';
import apiRoutes from '@/routes';
import { ApiResponse } from '@/utils/ApiResponse';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin: corsAllowedOrigins,
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(
    express.json({
      limit: '2mb',
      verify: (req, _res, buf) => {
        (req as express.Request & { rawBody?: Buffer }).rawBody = Buffer.from(buf);
      },
    }),
  );
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use(cookieParser(env.COOKIE_SECRET));
  app.use(requestLogger);
  app.use(responseFormatter);
  app.use(globalRateLimiter);

  app.get('/', (_req, res) => {
    ApiResponse.success(res, { name: 'The EduNest API', phase: 1, docs: env.SWAGGER_ROUTE });
  });

  app.use('/health', healthRoutes);

  if (env.SWAGGER_ENABLED) {
    app.use(env.SWAGGER_ROUTE, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    app.get(`${env.SWAGGER_ROUTE}.json`, (_req, res) => res.json(swaggerSpec));
  }

  app.use(env.API_PREFIX, auditLogger, apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
