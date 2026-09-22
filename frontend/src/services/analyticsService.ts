import { apiClient, ApiNotConfiguredError } from "./apiClient";
import {
  dealerPerformance,
  productionTimeTrend,
  deliveryTimeTrend,
  topProducts,
  quotationConversion,
  paymentAnalytics,
} from "@/data/analyticsExtra";
import type {
  DealerPerformancePoint,
  ProductionTimePoint,
  DeliveryTimePoint,
  TopProductPoint,
  QuotationConversionPoint,
  PaymentAnalyticsPoint,
} from "@/types";

async function withFallback<T>(path: string, fallback: T): Promise<T> {
  try {
    return await apiClient.request<T>(path);
  } catch (err) {
    if (err instanceof ApiNotConfiguredError) return fallback;
    throw err;
  }
}

// TODO(backend): each of these maps to a GET /analytics/* endpoint once the
// reporting service exists. Until then they resolve from local mock data so
// the Analytics page can be built and reviewed end-to-end.
export const analyticsService = {
  getDealerPerformance: () =>
    withFallback<DealerPerformancePoint[]>("/analytics/dealer-performance", dealerPerformance),
  getProductionTimeTrend: () =>
    withFallback<ProductionTimePoint[]>("/analytics/production-time", productionTimeTrend),
  getDeliveryTimeTrend: () =>
    withFallback<DeliveryTimePoint[]>("/analytics/delivery-time", deliveryTimeTrend),
  getTopProducts: () => withFallback<TopProductPoint[]>("/analytics/top-products", topProducts),
  getQuotationConversion: () =>
    withFallback<QuotationConversionPoint[]>("/analytics/quotation-conversion", quotationConversion),
  getPaymentAnalytics: () =>
    withFallback<PaymentAnalyticsPoint[]>("/analytics/payments", paymentAnalytics),
};
