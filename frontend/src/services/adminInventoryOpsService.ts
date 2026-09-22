import { apiClient } from "./apiClient";

// --- Warehouses --------------------------------------------------------------------------

export interface ApiWarehouse {
  id: string;
  name: string;
  location: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  isActive: boolean;
  createdAt: string;
  stock?: { totalAvailable: number; totalReserved: number; productLines: number };
}

export async function listWarehouses(filters?: { isActive?: boolean; page?: number }) {
  const { data, meta } = await apiClient.withMeta<ApiWarehouse[]>("/admin/warehouses", {
    query: filters as Record<string, string | number | boolean | undefined>,
  });
  return { items: data ?? [], meta: meta ?? { page: 1, limit: 10, total: 0, totalPages: 1 } };
}

export async function createWarehouse(input: { name: string; location?: string; city?: string; state?: string; pincode?: string }) {
  const data = await apiClient.post<{ warehouse: ApiWarehouse }>("/admin/warehouses", input);
  return data.warehouse;
}

export async function setWarehouseActive(id: string, isActive: boolean) {
  const data = await apiClient.patch<{ warehouse: ApiWarehouse }>(`/admin/warehouses/${id}/active`, { isActive });
  return data.warehouse;
}

// --- Quantity Change Requests --------------------------------------------------------------

export interface ApiQuantityChangeRequest {
  id: string;
  currentQuantity: number;
  requestedQuantity: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  decidedAt: string | null;
  rejectionReason: string | null;
  inventory: {
    id: string;
    product: { name: string; sku: string };
    productVariant: { id: string } | null;
    warehouse: { id: string; name: string } | null;
  };
  requester: { id: string; name: string; email: string };
  decider: { id: string; name: string; email: string } | null;
}

export async function listQuantityChangeRequests(filters?: { status?: string; page?: number }) {
  const { data, meta } = await apiClient.withMeta<ApiQuantityChangeRequest[]>("/admin/quantity-change-requests", {
    query: filters as Record<string, string | number | undefined>,
  });
  return { items: data ?? [], meta: meta ?? { page: 1, limit: 10, total: 0, totalPages: 1 } };
}

export async function createQuantityChangeRequest(input: {
  inventoryId?: string;
  productId?: string;
  warehouseId?: string;
  requestedQuantity: number;
  reason: string;
}) {
  const data = await apiClient.post<{ request: ApiQuantityChangeRequest }>("/admin/quantity-change-requests", input);
  return data.request;
}

export async function approveQuantityChangeRequest(id: string) {
  const data = await apiClient.post<{ inventory: unknown }>(`/admin/quantity-change-requests/${id}/approve`, {});
  return data.inventory;
}

export async function rejectQuantityChangeRequest(id: string, rejectionReason: string) {
  const data = await apiClient.post<{ request: ApiQuantityChangeRequest }>(`/admin/quantity-change-requests/${id}/reject`, { rejectionReason });
  return data.request;
}

// --- E-way Bills ---------------------------------------------------------------------------

export interface ApiEwayBill {
  id: string;
  orderId: string;
  order?: { id: string; orderNumber: string };
  ewayBillNumber: string | null;
  transporterName: string | null;
  transporterGstin: string | null;
  transportMode: string;
  vehicleNumber: string | null;
  status: "draft" | "generated" | "cancelled" | "expired";
  validFrom: string | null;
  validUntil: string | null;
  createdAt: string;
}

export async function listEwayBills(filters?: { status?: string; page?: number }) {
  const { data, meta } = await apiClient.withMeta<ApiEwayBill[]>("/admin/eway-bills", {
    query: filters as Record<string, string | number | undefined>,
  });
  return { items: data ?? [], meta: meta ?? { page: 1, limit: 10, total: 0, totalPages: 1 } };
}

export async function createEwayBill(input: { orderId: string; transporterName?: string; transporterGstin?: string; vehicleNumber?: string; distanceKm?: number }) {
  const data = await apiClient.post<{ ewayBill: ApiEwayBill }>("/admin/eway-bills", input);
  return data.ewayBill;
}

export async function markEwayBillGenerated(id: string, ewayBillNumber: string, validFrom: string, validUntil: string) {
  const data = await apiClient.post<{ ewayBill: ApiEwayBill }>(`/admin/eway-bills/${id}/mark-generated`, { ewayBillNumber, validFrom, validUntil });
  return data.ewayBill;
}

export async function cancelEwayBill(id: string) {
  const data = await apiClient.post<{ ewayBill: ApiEwayBill }>(`/admin/eway-bills/${id}/cancel`, {});
  return data.ewayBill;
}
