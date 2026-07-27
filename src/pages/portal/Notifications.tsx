import { useState } from "react";
import { ShoppingBag, CreditCard, FileText, Store, Bell as BellIcon, CheckCheck } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { notifications as initialNotifications } from "@/data/notifications";
import type { AppNotification } from "@/types";

const ICONS: Record<AppNotification["type"], typeof ShoppingBag> = {
  order: ShoppingBag,
  payment: CreditCard,
  quotation: FileText,
  dealer: Store,
  system: BellIcon,
};

export default function Notifications() {
  const [items, setItems] = useState(initialNotifications);
  const unreadCount = items.filter((n) => !n.read).length;

  function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function markRead(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  return (
    <div>
      <PageHeader
        title="Notifications"
        description={`You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}.`}
        actions={
          unreadCount > 0 ? (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={markAllRead}>
              <CheckCheck className="h-3.5 w-3.5" /> Mark All Read
            </Button>
          ) : undefined
        }
      />

      {items.length === 0 ? (
        <EmptyState icon={BellIcon} title="No notifications" description="You're all caught up." />
      ) : (
        <Card className="divide-y divide-border overflow-hidden">
          {items.map((n) => {
            const Icon = ICONS[n.type];
            return (
              <button
                key={n.id}
                onClick={() => markRead(n.id)}
                className={`flex w-full items-start gap-3.5 p-4 text-left transition-colors hover:bg-muted/40 ${
                  !n.read ? "bg-primary/[0.03]" : ""
                }`}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-4.5 w-4.5" />
                </span>
                <span className="flex-1">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{n.title}</span>
                    {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{n.description}</span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{n.timestamp}</span>
              </button>
            );
          })}
        </Card>
      )}
    </div>
  );
}
