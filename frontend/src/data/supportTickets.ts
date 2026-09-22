import type { SupportTicketFull } from "@/types";

export const supportTicketsFull: SupportTicketFull[] = [
  {
    id: "TCK-2024-041",
    subject: "Delay in order ORD-2024-00151 shipment",
    description:
      "Our order was confirmed 5 days ago but hasn't shipped yet. Could you check with the assigned dealer on the delay?",
    status: "In Progress",
    priority: "High",
    category: "Orders",
    date: "2024-05-21",
    raisedBy: "Greenfield Academy",
    attachments: [{ id: "ATT-1", name: "order-confirmation.pdf", size: "212 KB" }],
    replies: [
      {
        id: "RPL-1",
        author: "Support Agent — Riya K.",
        authorRole: "Support Agent",
        message: "Thanks for flagging this — we've reached out to the assigned dealer for an updated ETA.",
        timestamp: "2024-05-21 03:40 PM",
      },
      {
        id: "RPL-2",
        author: "Future Supplies Co.",
        authorRole: "Dealer",
        message: "Production is at the Quality Check stage; dispatch expected within 2 business days.",
        timestamp: "2024-05-22 11:05 AM",
      },
    ],
    history: [
      { id: "HST-1", action: "Ticket created", timestamp: "2024-05-21 02:15 PM" },
      { id: "HST-2", action: "Status changed to In Progress", timestamp: "2024-05-21 03:41 PM" },
      { id: "HST-3", action: "Assigned dealer replied", timestamp: "2024-05-22 11:05 AM" },
    ],
  },
  {
    id: "TCK-2024-038",
    subject: "Invoice mismatch for INV-2024-0121",
    description: "The GST amount on the invoice doesn't match the quotation we approved. Please review.",
    status: "Resolved",
    priority: "Medium",
    category: "Billing",
    date: "2024-05-16",
    raisedBy: "Sunrise Public School",
    attachments: [
      { id: "ATT-2", name: "INV-2024-0121.pdf", size: "98 KB" },
      { id: "ATT-3", name: "quotation-screenshot.png", size: "340 KB" },
    ],
    replies: [
      {
        id: "RPL-3",
        author: "Support Agent — Aman S.",
        authorRole: "Support Agent",
        message: "You're right, there was a rounding error. A corrected invoice has been issued.",
        timestamp: "2024-05-17 10:20 AM",
      },
    ],
    history: [
      { id: "HST-4", action: "Ticket created", timestamp: "2024-05-16 09:05 AM" },
      { id: "HST-5", action: "Corrected invoice issued", timestamp: "2024-05-17 10:22 AM" },
      { id: "HST-6", action: "Status changed to Resolved", timestamp: "2024-05-17 10:22 AM" },
    ],
  },
  {
    id: "TCK-2024-035",
    subject: "Need bulk discount for uniform order",
    description: "We're placing an order for 400+ uniform sets — is a bulk discount available?",
    status: "Resolved",
    priority: "Low",
    category: "Quotations",
    date: "2024-05-10",
    raisedBy: "Delhi Public School",
    attachments: [],
    replies: [
      {
        id: "RPL-4",
        author: "Support Agent — Riya K.",
        authorRole: "Support Agent",
        message: "Yes, orders above 300 units qualify for an additional 4% discount. We've updated your quotation.",
        timestamp: "2024-05-11 04:12 PM",
      },
    ],
    history: [
      { id: "HST-7", action: "Ticket created", timestamp: "2024-05-10 01:00 PM" },
      { id: "HST-8", action: "Status changed to Resolved", timestamp: "2024-05-11 04:13 PM" },
    ],
  },
  {
    id: "TCK-2024-044",
    subject: "Dealer overloaded, requesting reassignment",
    description: "Our assigned dealer is showing as overloaded on the tracker — can this order be reassigned?",
    status: "Open",
    priority: "Urgent",
    category: "Production",
    date: "2024-05-23",
    raisedBy: "Oxford International",
    attachments: [],
    replies: [],
    history: [{ id: "HST-9", action: "Ticket created", timestamp: "2024-05-23 09:30 AM" }],
  },
];
