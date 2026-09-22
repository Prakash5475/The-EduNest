import type { DealerWorkload } from "@/types";

// TODO(backend): replace with a live capacity feed from the production/ERP
// service once available. Shape mirrors what the Admin Quotation page needs
// to render dealer workload during assignment.
export const dealerWorkload: DealerWorkload[] = [
  { dealerId: "DLR-001", activeOrders: 42, capacity: 44, capacityPct: 95, avgProductionDays: 9, ordersNearDeadline: 6, recommendation: "Overloaded" },
  { dealerId: "DLR-002", activeOrders: 18, capacity: 40, capacityPct: 45, avgProductionDays: 5, ordersNearDeadline: 1, recommendation: "Recommended" },
  { dealerId: "DLR-003", activeOrders: 31, capacity: 45, capacityPct: 69, avgProductionDays: 7, ordersNearDeadline: 3, recommendation: "Balanced" },
  { dealerId: "DLR-004", activeOrders: 12, capacity: 30, capacityPct: 40, avgProductionDays: 4, ordersNearDeadline: 0, recommendation: "Recommended" },
  { dealerId: "DLR-005", activeOrders: 26, capacity: 35, capacityPct: 74, avgProductionDays: 6, ordersNearDeadline: 2, recommendation: "Balanced" },
  { dealerId: "DLR-006", activeOrders: 5, capacity: 20, capacityPct: 25, avgProductionDays: 6, ordersNearDeadline: 0, recommendation: "Recommended" },
];

export function getDealerWorkload(dealerId: string): DealerWorkload | undefined {
  return dealerWorkload.find((w) => w.dealerId === dealerId);
}
