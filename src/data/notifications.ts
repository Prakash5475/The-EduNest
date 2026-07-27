import type { AppNotification, ActivityItem } from "@/types";

export const notifications: AppNotification[] = [
  {
    id: "NTF-001",
    title: "New order received",
    description: "Greenfield Academy placed order ORD-2024-00156 worth ₹45,230.",
    timestamp: "2 minutes ago",
    read: false,
    type: "order",
  },
  {
    id: "NTF-002",
    title: "Payment received",
    description: "Payment of ₹45,230 received against invoice INV-2024-0126.",
    timestamp: "15 minutes ago",
    read: false,
    type: "payment",
  },
  {
    id: "NTF-003",
    title: "Quotation created",
    description: "Bright Traders created quotation QTN-2024-00125.",
    timestamp: "1 hour ago",
    read: false,
    type: "quotation",
  },
  {
    id: "NTF-004",
    title: "Order shipped",
    description: "Order ORD-2024-00155 for Sunrise Public School marked as shipped.",
    timestamp: "2 hours ago",
    read: true,
    type: "order",
  },
  {
    id: "NTF-005",
    title: "New dealer onboarded",
    description: "Future Supplies Co. was added as a new distributor partner.",
    timestamp: "3 hours ago",
    read: true,
    type: "dealer",
  },
];

export const activityFeed: ActivityItem[] = [
  { id: "ACT-1", icon: "order", text: "New order ORD-2024-00156 received", timestamp: "2 min ago" },
  { id: "ACT-2", icon: "invoice", text: "Payment received for INV-2024-0126 — ₹45,230.00", timestamp: "15 min ago" },
  { id: "ACT-3", icon: "quotation", text: "New quotation QTN-2024-00125 created", timestamp: "1 hour ago" },
  { id: "ACT-4", icon: "shipment", text: "Order ORD-2024-00155 marked as shipped", timestamp: "2 hours ago" },
  { id: "ACT-5", icon: "dealer", text: "New dealer Future Supplies Co. added", timestamp: "3 hours ago" },
];
