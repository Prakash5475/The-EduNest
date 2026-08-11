import { AlertTriangle, Clock, Gauge, PackageCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Dealer, DealerWorkload } from "@/types";

const RECOMMENDATION_STYLE: Record<DealerWorkload["recommendation"], string> = {
  Recommended: "border-transparent bg-success/10 text-success",
  Balanced: "border-transparent bg-secondary/10 text-secondary",
  Overloaded: "border-transparent bg-destructive/10 text-destructive",
};

interface DealerAssignmentCardProps {
  dealer: Dealer;
  workload: DealerWorkload;
  selected?: boolean;
  onAssign: () => void;
}

export function DealerAssignmentCard({ dealer, workload, selected, onAssign }: DealerAssignmentCardProps) {
  const isOverloaded = workload.recommendation === "Overloaded";

  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-colors",
        selected ? "border-primary ring-1 ring-primary" : "border-border"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{dealer.name}</p>
          <p className="text-xs text-muted-foreground">
            {dealer.city}, {dealer.state}
          </p>
        </div>
        <Badge className={RECOMMENDATION_STYLE[workload.recommendation]}>{workload.recommendation}</Badge>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <PackageCheck className="h-3.5 w-3.5" /> {workload.activeOrders} Active Orders
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Gauge className="h-3.5 w-3.5" /> {workload.capacityPct}% Capacity
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-3.5 w-3.5" /> ~{workload.avgProductionDays}d Avg. Production
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <AlertTriangle className="h-3.5 w-3.5" /> {workload.ordersNearDeadline} Near Deadline
        </div>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", isOverloaded ? "bg-destructive" : "bg-success")}
          style={{ width: `${Math.min(100, workload.capacityPct)}%` }}
        />
      </div>

      {isOverloaded && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
          <AlertTriangle className="h-3.5 w-3.5" /> This dealer is overloaded — assigning may delay production.
        </p>
      )}

      <Button
        size="sm"
        variant={selected ? "default" : "outline"}
        className="mt-3 w-full"
        onClick={onAssign}
      >
        {selected ? "Assigned" : "Assign Dealer"}
      </Button>
    </div>
  );
}
