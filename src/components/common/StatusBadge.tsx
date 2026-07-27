import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_MAP: Record<string, { variant: "success" | "warning" | "destructive" | "default" | "secondary" | "muted"; }> = {
  // generic
  active: { variant: "success" },
  inactive: { variant: "muted" },
  // orders
  Pending: { variant: "warning" },
  Confirmed: { variant: "secondary" },
  Processing: { variant: "secondary" },
  Shipped: { variant: "default" },
  Delivered: { variant: "success" },
  Cancelled: { variant: "destructive" },
  // payments / invoices
  Paid: { variant: "success" },
  "Partially Paid": { variant: "warning" },
  Partial: { variant: "warning" },
  Unpaid: { variant: "muted" },
  Overdue: { variant: "destructive" },
  Refunded: { variant: "secondary" },
  // quotations
  Draft: { variant: "muted" },
  Sent: { variant: "secondary" },
  Accepted: { variant: "success" },
  Rejected: { variant: "destructive" },
  Expired: { variant: "destructive" },
  // stock
  "in-stock": { variant: "success" },
  "low-stock": { variant: "warning" },
  "out-of-stock": { variant: "destructive" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const config = STATUS_MAP[status] ?? { variant: "muted" as const };
  const label = status
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <Badge variant={config.variant} className={cn("capitalize", className)}>
      {label}
    </Badge>
  );
}
