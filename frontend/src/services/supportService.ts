import { apiClient } from "./apiClient";

export type SupportCategory = "order" | "payment" | "product" | "account" | "technical" | "other";
export type SupportPriority = "low" | "medium" | "high" | "urgent";
export type SupportStatus = "open" | "in_progress" | "waiting_on_customer" | "resolved" | "closed";

export interface ApiTicketReply {
  id: string;
  message: string;
  createdAt: string;
  user?: { id: string; fullName: string; userType: string } | null;
}

export interface ApiSupportTicket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: SupportCategory;
  priority: SupportPriority;
  status: SupportStatus;
  createdAt: string;
  ticketReplies: ApiTicketReply[];
  school?: { id: string; schoolName: string } | null;
  dealer?: { id: string; businessName: string } | null;
}

export async function listMyTickets(page = 1, limit = 50) {
  const { data, meta } = await apiClient.withMeta<ApiSupportTicket[]>("/support/tickets", { query: { page, limit } });
  return { items: data ?? [], meta };
}

export async function getTicket(id: string): Promise<ApiSupportTicket> {
  const data = await apiClient.get<{ ticket: ApiSupportTicket }>(`/support/tickets/${id}`);
  return data.ticket;
}

export async function createTicket(payload: {
  subject: string;
  description: string;
  category: SupportCategory;
  priority: SupportPriority;
}): Promise<ApiSupportTicket> {
  const data = await apiClient.post<{ ticket: ApiSupportTicket }>("/support/tickets", payload);
  return data.ticket;
}

export async function replyToTicket(ticketId: string, message: string): Promise<ApiSupportTicket> {
  await apiClient.post<{ reply: ApiTicketReply }>(`/support/tickets/${ticketId}/replies`, { message });
  return getTicket(ticketId);
}

// ---- Staff/admin-only ----

export async function listAllTickets(page = 1, limit = 50, status?: SupportStatus) {
  const { data, meta } = await apiClient.withMeta<ApiSupportTicket[]>("/support/tickets/admin", {
    query: { page, limit, status },
  });
  return { items: data ?? [], meta };
}

export async function assignTicket(ticketId: string, assignedTo: string): Promise<ApiSupportTicket> {
  const data = await apiClient.post<{ ticket: ApiSupportTicket }>(`/support/tickets/${ticketId}/assign`, { assignedTo });
  return data.ticket;
}

export async function updateTicketStatus(ticketId: string, status: SupportStatus): Promise<ApiSupportTicket> {
  const data = await apiClient.patch<{ ticket: ApiSupportTicket }>(`/support/tickets/${ticketId}/status`, { status });
  return data.ticket;
}

export async function updateTicketPriority(ticketId: string, priority: SupportPriority): Promise<ApiSupportTicket> {
  const data = await apiClient.patch<{ ticket: ApiSupportTicket }>(`/support/tickets/${ticketId}/priority`, { priority });
  return data.ticket;
}
