import { useEffect } from "react";
import { subscribeToNotifications, subscribeToOrderTracking, type NotificationPayload } from "@/services/socketService";
import { useAuth } from "@/context/AuthContext";

/** Fires whenever the backend pushes a new notification for the current user. */
export function useNotificationSocket(onMessage: (payload: NotificationPayload) => void) {
  const { isAuthenticated } = useAuth();
  useEffect(() => {
    if (!isAuthenticated) return;
    return subscribeToNotifications(onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);
}

/** Fires whenever the backend pushes a tracking update for a specific order. */
export function useOrderTrackingSocket(orderId: string | undefined, onMessage: (payload: unknown) => void) {
  const { isAuthenticated } = useAuth();
  useEffect(() => {
    if (!isAuthenticated || !orderId) return;
    return subscribeToOrderTracking(orderId, onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, orderId]);
}
