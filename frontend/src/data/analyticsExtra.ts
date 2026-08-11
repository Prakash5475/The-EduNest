import type {
  DealerPerformancePoint,
  ProductionTimePoint,
  DeliveryTimePoint,
  TopProductPoint,
  QuotationConversionPoint,
  PaymentAnalyticsPoint,
} from "@/types";

export const dealerPerformance: DealerPerformancePoint[] = [
  { dealer: "Future Supplies Co.", ordersFulfilled: 142, onTimePct: 91 },
  { dealer: "Bright Traders", ordersFulfilled: 98, onTimePct: 88 },
  { dealer: "Maxim Distributors", ordersFulfilled: 121, onTimePct: 95 },
  { dealer: "Smart Supplies Ltd.", ordersFulfilled: 54, onTimePct: 97 },
  { dealer: "Elite Global Supplies", ordersFulfilled: 87, onTimePct: 84 },
];

export const productionTimeTrend: ProductionTimePoint[] = [
  { month: "Jan", avgDays: 8.2 },
  { month: "Feb", avgDays: 7.8 },
  { month: "Mar", avgDays: 7.1 },
  { month: "Apr", avgDays: 6.6 },
  { month: "May", avgDays: 6.2 },
];

export const deliveryTimeTrend: DeliveryTimePoint[] = [
  { month: "Jan", avgDays: 5.4 },
  { month: "Feb", avgDays: 5.1 },
  { month: "Mar", avgDays: 4.8 },
  { month: "Apr", avgDays: 4.5 },
  { month: "May", avgDays: 4.1 },
];

export const topProducts: TopProductPoint[] = [
  { product: "School Uniform Set", unitsSold: 3240, revenue: 1458000 },
  { product: "Geometry Box", unitsSold: 2870, revenue: 573000 },
  { product: "Ruled Notebook Pack", unitsSold: 4120, revenue: 494400 },
  { product: "Sports Kit", unitsSold: 980, revenue: 686000 },
  { product: "Backpack Standard", unitsSold: 1120, revenue: 896000 },
];

export const quotationConversion: QuotationConversionPoint[] = [
  { month: "Jan", sent: 96, accepted: 58 },
  { month: "Feb", sent: 104, accepted: 66 },
  { month: "Mar", sent: 118, accepted: 79 },
  { month: "Apr", sent: 121, accepted: 88 },
  { month: "May", sent: 128, accepted: 97 },
];

export const paymentAnalytics: PaymentAnalyticsPoint[] = [
  { mode: "Bank Transfer", value: 42, color: "#1976D2" },
  { mode: "UPI", value: 33, color: "#4CAF50" },
  { mode: "Cheque", value: 14, color: "#FFC107" },
  { mode: "Cash", value: 7, color: "#F44336" },
  { mode: "Card", value: 4, color: "#9C27B0" },
];
