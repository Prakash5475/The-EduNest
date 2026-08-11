import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { getDealerWorkloads, assignDealerToItem } from "@/services/dealerService";
import type { DealerAssignment, DealerWorkload } from "@/types";

export function useDealerAssignment() {
  const [workloads, setWorkloads] = useState<DealerWorkload[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Record<string, string>>({}); // itemId -> dealerId

  useEffect(() => {
    let active = true;
    getDealerWorkloads()
      .then((data) => {
        if (active) setWorkloads(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const assign = useCallback(async (params: Omit<DealerAssignment, "assignedAt" | "assignedBy">) => {
    const assignment: DealerAssignment = {
      ...params,
      assignedAt: new Date().toISOString(),
      assignedBy: "Admin User",
    };
    try {
      await assignDealerToItem(assignment);
      setAssignments((prev) => ({ ...prev, [params.itemId]: params.dealerId }));
      toast.success(`Dealer assigned to item ${params.itemId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not assign dealer");
    }
  }, []);

  return { workloads, loading, assignments, assign };
}
