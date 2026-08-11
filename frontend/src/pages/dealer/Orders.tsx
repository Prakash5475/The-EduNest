import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShoppingCart, Check } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Pagination } from "@/components/common/Pagination";
import { EmptyState } from "@/components/common/EmptyState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import { paths } from "@/routes/paths";
import { Link } from "react-router-dom";
import { listDealerOrders, updateDealerOrderStatus } from "@/services/dealerOrderService";

export default function DealerOrders() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["dealer-orders", page],
    queryFn: () => listDealerOrders(page, 8),
    placeholderData: (prev) => prev,
  });
  const items = data?.items ?? [];
  const totalPages = data?.meta?.totalPages ?? 1;

  const acceptMutation = useMutation({
    mutationFn: (id: string) => updateDealerOrderStatus(id, "confirmed"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dealer-orders"] });
      toast.success("Order accepted");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't accept order"),
  });

  return (
    <div>
      <PageHeader title="Assigned Orders" description="Orders assigned to you for fulfilment and production." />

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-xl" />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>School</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium text-primary">{o.orderNumber}</TableCell>
                  <TableCell>{o.school?.schoolName ?? "—"}</TableCell>
                  <TableCell>{formatDate(o.placedAt)}</TableCell>
                  <TableCell>{o.orderItems.length}</TableCell>
                  <TableCell className="font-medium">{formatCurrency(Number(o.totalAmount))}</TableCell>
                  <TableCell>
                    <StatusBadge status={o.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      {o.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => acceptMutation.mutate(o.id)}
                          disabled={acceptMutation.isPending}
                        >
                          <Check className="h-3.5 w-3.5" /> Accept
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={paths.dealer.tracking(o.id)}>Track</Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                    <EmptyState icon={ShoppingCart} title="No orders assigned yet" description="New assignments will appear here." />
                  </TableCell>
                </TableRow>
              )}
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

