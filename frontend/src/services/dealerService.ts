import { apiClient, ApiNotConfiguredError } from "./apiClient";
import { dealerWorkload } from "@/data/dealerWorkload";
import type { DealerAssignment, DealerWorkload } from "@/types";

/**
 * Returns current workload/capacity for every dealer, used by the Smart
 * Dealer Assignment panel on the Admin Quotations page.
 * TODO(backend): GET /dealers/workload
 */
export async function getDealerWorkloads(): Promise<DealerWorkload[]> {
  try {
    return await apiClient.request<DealerWorkload[]>("/dealers/workload");
  } catch (err) {
    if (err instanceof ApiNotConfiguredError) return dealerWorkload;
    throw err;
  }
}

/**
 * Persists a dealer assignment for a quotation line item.
 * TODO(backend): POST /quotations/:quotationId/items/:itemId/assign
 */
export async function assignDealerToItem(assignment: DealerAssignment): Promise<{ success: boolean }> {
  try {
    return await apiClient.post<{ success: boolean }>(
      `/quotations/${assignment.quotationId}/items/${assignment.itemId}/assign`,
      assignment,
    );
  } catch (err) {
    if (err instanceof ApiNotConfiguredError) {
      // Frontend-only fallback: no persistence layer yet, resolve optimistically.
      return { success: true };
    }
    throw err;
  }
}
