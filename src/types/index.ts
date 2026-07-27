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
