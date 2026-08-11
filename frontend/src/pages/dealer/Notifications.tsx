import { ShoppingBag, CreditCard, FileText, Store, LifeBuoy, Bell as BellIcon, CheckCheck } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/EmptyState";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/services/notificationService";
import { useNotificationSocket } from "@/hooks/useRealtimeSocket";
import { formatDate } from "@/lib/utils";

function iconFor(notifType: string) {
  if (notifType.includes("order") || notifType.includes("checkpoint")) return ShoppingBag;
  if (notifType.includes("payment")) return CreditCard;
  if (notifType.includes("quotation")) return FileText;
  if (notifType.includes("dealer")) return Store;
  if (notifType.includes("support")) return LifeBuoy;
  return BellIcon;
}

export default function DealerNotifications() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => listNotifications(1, 50),
  });
  const items = data?.items ?? [];
  const unreadCount = data?.meta?.unreadCount ?? items.filter((n) => !n.isRead).length;

  useNotificationSocket(() => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <div>
      <PageHeader
        title="Notifications"
        description={`You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}.`}
        actions={
          unreadCount > 0 ? (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => markAllMutation.mutate()}>
              <CheckCheck className="h-3.5 w-3.5" /> Mark All Read
            </Button>
          ) : undefined
        }
      />

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : items.length === 0 ? (
        <EmptyState icon={BellIcon} title="No notifications" description="You're all caught up." />
      ) : (
        <Card className="divide-y divide-border overflow-hidden">
          {items.map((n) => {
            const Icon = iconFor(n.notifType);
            return (
              <button
                key={n.id}
                onClick={() => !n.isRead && markReadMutation.mutate(n.id)}
                className={`flex w-full items-start gap-3.5 p-4 text-left transition-colors hover:bg-muted/40 ${
                  !n.isRead ? "bg-primary/[0.03]" : ""
                }`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span className="flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{n.title}</span>
                    {!n.isRead && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                  </span>
                  {n.body && <span className="mt-0.5 block text-xs text-muted-foreground">{n.body}</span>}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{formatDate(n.createdAt)}</span>
              </button>
            );
          })}
        </Card>
      )}
    </div>
  );
}

