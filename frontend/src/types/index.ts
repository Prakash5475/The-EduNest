// ---------- Shared ----------
export type Status = "active" | "inactive";

export interface Address {
  line1: string;
  city: string;
  state: string;
  pincode: string;
}

// ---------- School ----------
export type SchoolType = "Public" | "Private" | "International";

export interface School {
  id: string;
  name: string;
  image: string;
  city: string;
  state: string;
  status: Status;
  board: string;
  type: SchoolType;
  email: string;
  phone: string;
  principalName: string;
  establishedYear: number;
  totalStudents: number;
  totalTeachers: number;
  affiliationNo: string;
  address: Address;
}

// ---------- Dealer ----------
export type DealerType = "Distributor" | "Wholesaler" | "Retailer";

export interface Dealer {
  id: string;
  name: string;
  logo: string;
  city: string;
  state: string;
  status: Status;
  type: DealerType;
  email: string;
  phone: string;
  address: Address;
  gstNumber: string;
  establishedYear: number;
  creditLimit: number;
  outstandingBalance: number;
  rating: number;
}

// ---------- Product ----------
export type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

export interface ProductVariant {
  id: string;
  label: string;
  image: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  subCategory: string;
  price: number;
  images: string[];
  colors?: string[];
  status: Status;
  stockStatus: StockStatus;
  stockQuantity: number;
  minOrderQty: number;
  unit: string;
  hsnCode: string;
  description: string;
  tag?: "New Arrival" | "Trending" | "Popular" | "Recommend";
}

// ---------- Quotation ----------
export type QuotationStatus = "Draft" | "Sent" | "Accepted" | "Rejected" | "Expired";

export interface QuotationLineItem {
  id: string;
  productName: string;
  qty: number;
  unitPrice: number;
}

export interface Quotation {
  id: string;
  dealerId: string;
  schoolId: string;
  quoteDate: string;
  validTill: string;
  amount: number;
  status: QuotationStatus;
  items: QuotationLineItem[];
  discountPct: number;
  gstPct: number;
  notes: string;
  createdBy: string;
}

// ---------- Orders ----------
export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Processing"
  | "Shipped"
  | "Delivered"
  | "Cancelled";
export type PaymentStatus = "Paid" | "Partially Paid" | "Pending" | "Overdue" | "Refunded";

export interface OrderTimelineEvent {
  status: OrderStatus;
  date: string;
  note?: string;
}

// ---------- Production tracking ----------
// A finer-grained breakdown of the manufacturing lifecycle, shown when an
// order has moved past "Confirmed" into production. Optional on Order so
// existing orders/pages that don't set it keep working unchanged.
export const PRODUCTION_STAGES = [
  "Order Received",
  "Cutting",
  "Stitching",
  "Logo",
  "Printing",
  "Color Matching",
  "Quality Check",
  "Ready",
  "Packed",
  "Dispatched",
  "Delivered",
] as const;
export type ProductionStageName = (typeof PRODUCTION_STAGES)[number];

export interface ProductionStageEvent {
  stage: ProductionStageName;
  completed: boolean;
  date?: string;
  note?: string;
}

export interface Order {
  id: string;
  schoolId: string;
  dealerId: string;
  orderDate: string;
  deliveryDate?: string;
  amount: number;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  itemsCount: number;
  subTotal: number;
  discountPct: number;
  gstPct: number;
  amountPaid: number;
  timeline: OrderTimelineEvent[];
  /** Present once production has started; drives the production timeline UI. */
  productionStages?: ProductionStageEvent[];
  /** Dealer assigned to fulfil/produce this order, if any (see DealerAssignment). */
  assignedDealerId?: string;
}

// ---------- Smart dealer assignment ----------
export type DealerAssignmentRecommendation = "Recommended" | "Balanced" | "Overloaded";

export interface DealerWorkload {
  dealerId: string;
  activeOrders: number;
  capacity: number;
  capacityPct: number;
  avgProductionDays: number;
  ordersNearDeadline: number;
  recommendation: DealerAssignmentRecommendation;
}

export interface DealerAssignment {
  quotationId: string;
  itemId: string;
  dealerId: string;
  assignedAt: string;
  assignedBy: string;
  note?: string;
}

// ---------- Payments ----------
export type PaymentType = "Advance" | "Against Order" | "Full Payment" | "Refund";
export type PaymentMode = "Bank Transfer" | "UPI" | "Cheque" | "Cash" | "Card";

export interface Payment {
  id: string;
  dealerId: string;
  schoolId: string;
  orderId: string;
  date: string;
  amount: number;
  type: PaymentType;
  mode: PaymentMode;
  transactionId: string;
  status: PaymentStatus;
}

// ---------- Invoices ----------
export type InvoiceStatus = "Paid" | "Unpaid" | "Partial" | "Overdue" | "Cancelled";

export interface Invoice {
  id: string;
  schoolId: string;
  dealerId: string;
  orderId: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  status: InvoiceStatus;
  subTotal: number;
  discountPct: number;
  gstPct: number;
  paymentMethod: PaymentMode;
  transactionId?: string;
}

// ---------- Notifications ----------
export interface AppNotification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  type: "order" | "payment" | "quotation" | "dealer" | "system";
}

// ---------- Activity feed ----------
export interface ActivityItem {
  id: string;
  icon: "order" | "invoice" | "quotation" | "shipment" | "dealer";
  text: string;
  timestamp: string;
}

// ---------- Analytics ----------
export interface RevenuePoint {
  date: string;
  revenue: number;
}

export interface CategorySales {
  category: string;
  value: number;
  color: string;
}

export interface MonthlyComparison {
  day: string;
  thisMonth: number;
  lastMonth: number;
}

export interface DealerPerformancePoint {
  dealer: string;
  ordersFulfilled: number;
  onTimePct: number;
}

export interface ProductionTimePoint {
  month: string;
  avgDays: number;
}

export interface DeliveryTimePoint {
  month: string;
  avgDays: number;
}

export interface TopProductPoint {
  product: string;
  unitsSold: number;
  revenue: number;
}

export interface QuotationConversionPoint {
  month: string;
  sent: number;
  accepted: number;
}

export interface PaymentAnalyticsPoint {
  mode: string;
  value: number;
  color: string;
}

// ---------- Reports ----------
export type ReportFormat = "pdf" | "excel" | "csv";

// ---------- Support tickets ----------
export type TicketPriority = "Low" | "Medium" | "High" | "Urgent";
export type TicketStatus = "Open" | "In Progress" | "Resolved" | "Closed";

export interface TicketAttachment {
  id: string;
  name: string;
  size: string;
}

export interface TicketReply {
  id: string;
  author: string;
  authorRole: "Customer" | "Support Agent" | "Dealer";
  message: string;
  timestamp: string;
}

export interface TicketHistoryEntry {
  id: string;
  action: string;
  timestamp: string;
}

export interface SupportTicketFull {
  id: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  date: string;
  raisedBy: string;
  attachments: TicketAttachment[];
  replies: TicketReply[];
  history: TicketHistoryEntry[];
}

// ---------- Settings ----------
export interface CompanySettings {
  name: string;
  email: string;
  phone: string;
  website: string;
  address: Address;
}

export interface GstSettings {
  gstNumber: string;
  panNumber: string;
  taxRegistrationState: string;
  defaultGstPct: number;
}

export interface BrandingSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl?: string;
}

export interface ShippingSettings {
  defaultCarrier: string;
  freeShippingThreshold: number;
  standardDeliveryDays: number;
  expressDeliveryDays: number;
}

export interface BusinessRuleSettings {
  minOrderQty: number;
  quotationValidityDays: number;
  autoAssignDealers: boolean;
  overloadThresholdPct: number;
}

// ---------- Real-time / Socket.IO ----------
// Client-side channel names only — no server event names are assumed here.
// The backend team owns the actual event contract; these are the logical
// channels the UI is prepared to subscribe to once it exists.
export type RealtimeChannel =
  | "notifications"
  | "order-tracking"
  | "production-updates"
  | "quotation-updates"
  | "dealer-assignment-updates";
