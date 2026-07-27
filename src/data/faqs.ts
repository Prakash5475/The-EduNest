export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export const faqs: Faq[] = [
  {
    id: "FAQ-1",
    question: "How do I request a quotation from multiple dealers?",
    answer:
      "Go to Request Quotation, describe your requirement, and our team will source competitive quotes from our dealer network within 24 hours.",
    category: "Quotations",
  },
  {
    id: "FAQ-2",
    question: "What is the minimum order quantity for bulk purchases?",
    answer:
      "Minimum order quantities vary by product and are shown on each product's detail page. Bulk Orders lets you combine multiple SKUs in a single request.",
    category: "Orders",
  },
  {
    id: "FAQ-3",
    question: "How can I track my order after it's placed?",
    answer:
      "Visit Order Tracking from your dashboard and enter your order ID, or click any order from Order History to see its live status timeline.",
    category: "Orders",
  },
  {
    id: "FAQ-4",
    question: "What payment methods are supported?",
    answer: "We support bank transfer, UPI, cheque, and cash on delivery for eligible orders.",
    category: "Payments",
  },
  {
    id: "FAQ-5",
    question: "How do reward points work?",
    answer:
      "You earn points automatically when orders are delivered, when you refer a school, or complete feedback surveys. Points can be redeemed for discounts and perks.",
    category: "Rewards",
  },
  {
    id: "FAQ-6",
    question: "Can I change my subscription plan later?",
    answer: "Yes, you can upgrade or downgrade your plan anytime from Subscription Plans in your dashboard.",
    category: "Billing",
  },
];

export interface SupportTicket {
  id: string;
  subject: string;
  status: "Open" | "In Progress" | "Resolved";
  date: string;
  category: string;
}

export const supportTickets: SupportTicket[] = [
  { id: "TCK-2024-041", subject: "Delay in order ORD-2024-00151 shipment", status: "In Progress", date: "2024-05-21", category: "Orders" },
  { id: "TCK-2024-038", subject: "Invoice mismatch for INV-2024-0121", status: "Resolved", date: "2024-05-16", category: "Billing" },
  { id: "TCK-2024-035", subject: "Need bulk discount for uniform order", status: "Resolved", date: "2024-05-10", category: "Quotations" },
];
