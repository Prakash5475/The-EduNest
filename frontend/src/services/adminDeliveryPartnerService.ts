import { apiClient } from "./apiClient";

export interface ApiDeliveryPartner {
  id: string;
  uuid: string;
  fullName: string;
  mobile: string;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  vehicleType: string | null;
  vehicleNumber: string | null;
  availabilityStatus: "available" | "busy" | "offline";
  status: "active" | "inactive";
  joiningDate: string | null;
  notes: string | null;
  createdAt: string;
  activeAssignments?: number;
}

export interface CreateDeliveryPartnerInput {
  fullName: string;
  mobile: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  joiningDate?: string;
  notes?: string;
}

export async function listDeliveryPartners(filters?: { status?: string; availabilityStatus?: string; search?: string; page?: number }) {
  const { data, meta } = await apiClient.withMeta<ApiDeliveryPartner[]>("/admin/delivery-partners", {
    query: filters as Record<string, string | number | undefined>,
  });
  return { items: data ?? [], meta: meta ?? { page: 1, limit: 10, total: 0, totalPages: 1 } };
}

export async function getDeliveryPartner(id: string) {
  const data = await apiClient.get<{ partner: ApiDeliveryPartner }>(`/admin/delivery-partners/${id}`);
  return data.partner;
}

export async function createDeliveryPartner(input: CreateDeliveryPartnerInput) {
  const data = await apiClient.post<{ partner: ApiDeliveryPartner }>("/admin/delivery-partners", input);
  return data.partner;
}

export async function updateDeliveryPartner(id: string, input: Partial<CreateDeliveryPartnerInput>) {
  const data = await apiClient.patch<{ partner: ApiDeliveryPartner }>(`/admin/delivery-partners/${id}`, input);
  return data.partner;
}

export async function updateDeliveryPartnerStatus(id: string, status: "active" | "inactive") {
  const data = await apiClient.patch<{ partner: ApiDeliveryPartner }>(`/admin/delivery-partners/${id}/status`, { status });
  return data.partner;
}

export async function updateDeliveryPartnerAvailability(id: string, availabilityStatus: "available" | "busy" | "offline") {
  const data = await apiClient.patch<{ partner: ApiDeliveryPartner }>(`/admin/delivery-partners/${id}/availability`, { availabilityStatus });
  return data.partner;
}

// --- Shipments / delivery workflow -----------------------------------------------------

export interface ApiShipment {
  id: string;
  orderId: string;
  order?: { id: string; orderNumber: string; schoolId: string };
  carrierName: string | null;
  trackingNumber: string | null;
  deliveryPartnerId: string | null;
  deliveryPartner?: ApiDeliveryPartner | null;
  status: string;
  recipientName: string | null;
  recipientPhone: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  deliveryUpdates?: Array<{ id: string; updateType: string; previousStatus: string | null; newStatus: string | null; message: string | null; createdAt: string }>;
}

export async function getShipmentByOrder(orderId: string) {
  const data = await apiClient.get<{ shipment: ApiShipment }>(`/admin/deliveries/order/${orderId}`);
  return data.shipment;
}

export async function createShipment(input: { orderId: string; carrierName?: string; recipientName?: string; recipientPhone?: string }) {
  const data = await apiClient.post<{ shipment: ApiShipment }>("/admin/deliveries", input);
  return data.shipment;
}

export async function assignShipment(shipmentId: string, deliveryPartnerId: string) {
  const data = await apiClient.post<{ shipment: ApiShipment }>(`/admin/deliveries/${shipmentId}/assign`, { deliveryPartnerId });
  return data.shipment;
}

export async function updateShipmentStatus(shipmentId: string, status: string, notes?: string) {
  const data = await apiClient.patch<{ shipment: ApiShipment }>(`/admin/deliveries/${shipmentId}/status`, { status, notes });
  return data.shipment;
}

export async function rescheduleShipment(shipmentId: string, newDeliveryDate: string, reason: string) {
  const data = await apiClient.post<{ shipment: ApiShipment }>(`/admin/deliveries/${shipmentId}/reschedule`, { newDeliveryDate, reason });
  return data.shipment;
}

export async function sendDeliveryOtp(shipmentId: string, identifier: string, recipientName?: string) {
  await apiClient.post(`/admin/deliveries/${shipmentId}/otp/send`, { identifier, recipientName });
}

export async function verifyDeliveryOtp(shipmentId: string, identifier: string, otp: string) {
  const data = await apiClient.post<{ shipment: ApiShipment }>(`/admin/deliveries/${shipmentId}/otp/verify`, { identifier, otp });
  return data.shipment;
}
