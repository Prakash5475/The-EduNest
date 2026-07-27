import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { usePagination } from "@/hooks/usePagination";
import { paths } from "@/routes/paths";
import { orders } from "@/data/orders";
import { currentSchool, getDealerName } from "@/utils/lookups";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import type { OrderStatus } from "@/types";

const STATUS_FILTERS: ("All" | OrderStatus)[] = ["All", "Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"];

export default function PortalOrders() {
  const [statusFilter, setStatusFilter] = useState<"All" | OrderStatus>("All");

  const schoolOrders = useMemo(() => orders.filter((o) => o.schoolId === currentSchool.id), []);
  const filtered = useMemo(
    () => (statusFilter === "All" ? schoolOrders : schoolOrders.filter((o) => o.status === statusFilter)),
    [schoolOrders, statusFilter]
  );
  const { page, setPage, totalPages, pageItems } = usePagination(filtered, 8);

  return (
    <div>
      <PageHeader title="My Orders" description="View and track every order placed by your school." />

      <div className="mb-5 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
              statusFilter === s ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {pageItems.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No orders found"
          description="Orders matching this filter will appear here."
          actionLabel="Browse Shop"
          onAction={() => (window.location.href = paths.shop)}
        />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Dealer</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium text-primary">{o.id}</TableCell>
                  <TableCell>{getDealerName(o.dealerId)}</TableCell>
                  <TableCell>{formatDate(o.orderDate)}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(o.amount)}</TableCell>
                  <TableCell><StatusBadge status={o.paymentStatus} /></TableCell>
                  <TableCell><StatusBadge status={o.status} /></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={paths.portal.orderTracking(o.id)}>Track</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <div className="mt-6">
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
