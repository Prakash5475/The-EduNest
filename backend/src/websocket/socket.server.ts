import { Server as SocketIOServer } from 'socket.io';
import type { Server as HttpServer } from 'node:http';
import { corsAllowedOrigins } from '@/config/env';
import { verifyAccessToken } from '@/helpers/jwt.helper';
import { logger } from '@/config/logger';
import { SOCKET_EVENTS } from '@/constants';
import { prisma } from '@/config/database';

let io: SocketIOServer | null = null;

/** Only the order's own school, its assigned dealer, or admin/staff may join its live tracking room. */
async function canViewOrder(userId: string, orderId: string): Promise<boolean> {
  const order = await prisma.order.findUnique({
    where: { id: BigInt(orderId) },
    select: { schoolId: true, dealerId: true },
  });
  if (!order) return false;

  const user = await prisma.user.findUnique({
    where: { id: BigInt(userId) },
    include: { userRoles: { include: { role: true } } },
  });
  if (!user) return false;

  const roleSlugs = user.userRoles.map((ur) => ur.role.slug);
  if (roleSlugs.includes('super_admin') || roleSlugs.includes('staff')) return true;

  const school = await prisma.school.findFirst({ where: { userId: user.id } });
  if (school && school.id === order.schoolId) return true;

  const dealer = await prisma.dealer.findFirst({ where: { userId: user.id } });
  if (dealer && order.dealerId && dealer.id === order.dealerId) return true;

  return false;
}

export function initSocketServer(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: corsAllowedOrigins,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token =
      (socket.handshake.auth?.token as string | undefined) ??
      (socket.handshake.headers.authorization?.toString().replace('Bearer ', '') as string | undefined);

    if (!token) {
      next(new Error('Authentication token missing'));
      return;
    }

    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.userId;
      socket.data.userUuid = payload.sub;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
    const userId = socket.data.userId as string;
    void socket.join(`user:${userId}`);
    logger.info({ userId, socketId: socket.id }, 'Socket connected');

    socket.on(SOCKET_EVENTS.ORDER_SUBSCRIBE, async (orderId: string) => {
      try {
        const authorized = await canViewOrder(userId, orderId);
        if (authorized) {
          void socket.join(`order:${orderId}`);
        }
      } catch (err) {
        logger.warn({ err, orderId }, 'order:subscribe authorization check failed');
      }
    });

    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      logger.info({ userId, socketId: socket.id }, 'Socket disconnected');
    });
  });

  logger.info('Socket.io server initialized');
  return io;
}

export function getSocketServer(): SocketIOServer | null {
  return io;
}
