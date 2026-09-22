import { io, type Socket } from "socket.io-client";
import { getAccessToken } from "./apiClient";

// ---------------------------------------------------------------------------
// Real-time architecture (Socket.IO)
// ---------------------------------------------------------------------------
// Matches the backend's actual `src/websocket/socket.server.ts`:
// - Auth: handshake.auth.token = current access token (JWT), re-sent on every
//   (re)connect so a token refresh mid-session is picked up automatically.
// - Every connected socket auto-joins `user:${userId}` server-side; the
//   client doesn't need to join anything to receive `notification:new`.
// - `order:subscribe` (emit an orderId) joins `order:${orderId}` for
//   `order:tracking-update` events, if the user is authorized to view it.
// ---------------------------------------------------------------------------

const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL as string | undefined) ?? "/";

export const SOCKET_EVENTS = {
  NOTIFICATION_NEW: "notification:new",
  ORDER_SUBSCRIBE: "order:subscribe",
  ORDER_TRACKING_UPDATE: "order:tracking-update",
} as const;

let socket: Socket | null = null;

export function connectSocket(): Socket | null {
  const token = getAccessToken();
  if (!token) return null;
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    transports: ["websocket"],
    autoConnect: true,
    auth: { token },
  });

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export function subscribeToOrderTracking(orderId: string, handler: (payload: unknown) => void): () => void {
  const active = connectSocket();
  if (!active) return () => {};

  active.emit(SOCKET_EVENTS.ORDER_SUBSCRIBE, orderId);
  active.on(SOCKET_EVENTS.ORDER_TRACKING_UPDATE, handler);
  return () => active.off(SOCKET_EVENTS.ORDER_TRACKING_UPDATE, handler);
}

export interface NotificationPayload {
  userId: string;
  title: string;
  message: string;
  type: string;
  data?: { referenceType?: string; referenceId?: string };
}

export function subscribeToNotifications(handler: (payload: NotificationPayload) => void): () => void {
  const active = connectSocket();
  if (!active) return () => {};

  active.on(SOCKET_EVENTS.NOTIFICATION_NEW, handler);
  return () => active.off(SOCKET_EVENTS.NOTIFICATION_NEW, handler);
}

export function isSocketConfigured(): boolean {
  return Boolean(getAccessToken());
}
