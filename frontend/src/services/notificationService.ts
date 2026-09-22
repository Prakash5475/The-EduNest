import { apiClient } from "./apiClient";

export interface ApiNotification {
  id: string;
  title: string;
  body: string | null;
  notifType: string;
  referenceType: string | null;
  referenceId: string | null;
  isRead: boolean;
  createdAt: string;
}

export async function listNotifications(page = 1, limit = 30) {
  const { data, meta } = await apiClient.withMeta<ApiNotification[]>("/notifications", { query: { page, limit } });
  return { items: data ?? [], meta: meta as (typeof meta & { unreadCount?: number }) };
}

export async function markNotificationRead(id: string): Promise<ApiNotification> {
  const data = await apiClient.post<{ notification: ApiNotification }>(`/notifications/${id}/read`, {});
  return data.notification;
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.post("/notifications/mark-all-read", {});
}
