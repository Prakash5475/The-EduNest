import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_MAP: Record<string, { variant: "success" | "warning" | "destructive" | "default" | "secondary" | "muted"; }> = {
  // generic
  active: { variant: "success" },
  inactive: { variant: "muted" },
  // orders (display-cased, kept for any legacy callers)
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
  // support tickets
  Open: { variant: "warning" },
  "In Progress": { variant: "secondary" },
  Resolved: { variant: "success" },
  Closed: { variant: "muted" },

  // ---- real backend enum values (snake_case, as returned by the API) ----
  // OrderStatus
  pending: { variant: "warning" },
  confirmed: { variant: "secondary" },
  processing: { variant: "secondary" },
  shipped: { variant: "default" },
  delivered: { variant: "success" },
  completed: { variant: "success" },
  cancelled: { variant: "destructive" },
  returned: { variant: "muted" },
  // OrderPaymentStatus
  unpaid: { variant: "muted" },
  partially_paid: { variant: "warning" },
  paid: { variant: "success" },
  refunded: { variant: "secondary" },
  // SupportTicketStatus
  open: { variant: "warning" },
  in_progress: { variant: "secondary" },
  waiting_on_customer: { variant: "warning" },
  resolved: { variant: "success" },
  closed: { variant: "muted" },
  // QuotationRequestStatus
  in_review: { variant: "secondary" },
  quoted: { variant: "success" },
  expired: { variant: "destructive" },
  // SchoolStatus / DealerStatus
  pending_approval: { variant: "warning" },
  blocked: { variant: "destructive" },
  suspended: { variant: "destructive" },
  pending_verification: { variant: "warning" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const config = STATUS_MAP[status] ?? { variant: "muted" as const };
  const label = status
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <Badge variant={config.variant} className={cn("capitalize", className)}>
      {label}
    </Badge>
  );
}
