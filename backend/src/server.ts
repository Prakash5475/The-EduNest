import '@/utils/bigint';
import http from 'node:http';
import { createApp } from './app';
import { env } from '@/config/env';
import { logger } from '@/config/logger';
import { connectDatabase, disconnectDatabase } from '@/config/database';
import { disconnectRedis } from '@/config/redis';
import { verifyMailTransport } from '@/config/mailer';
import { initSocketServer } from '@/websocket/socket.server';

async function bootstrap(): Promise<void> {
  await connectDatabase();
  void verifyMailTransport();

  const app = createApp();
  const httpServer = http.createServer(app);
  initSocketServer(httpServer);

  const server = httpServer.listen(env.PORT, () => {
    logger.info(`🚀 The EduNest API listening on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`   API base:  ${env.APP_URL}${env.API_PREFIX}`);
    if (env.SWAGGER_ENABLED) {
      logger.info(`   API docs:  ${env.APP_URL}${env.SWAGGER_ROUTE}`);
    }
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Shutting down gracefully');
    server.close(async () => {
      await disconnectDatabase();
      await disconnectRedis();
      logger.info('Shutdown complete');
      process.exit(0);
    });

    // Force-exit if graceful shutdown hangs.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled promise rejection');
  });
  process.on('uncaughtException', (err) => {
    logger.error({ err }, 'Uncaught exception');
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
