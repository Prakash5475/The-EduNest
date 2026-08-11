import { apiClient, ApiNotConfiguredError } from "./apiClient";
import type {
  CompanySettings,
  GstSettings,
  BrandingSettings,
  ShippingSettings,
  BusinessRuleSettings,
} from "@/types";

// TODO(backend): each getter maps to GET /settings/<section>, each saver to
// PUT /settings/<section>. Until the settings API exists, saves resolve
// optimistically so the Settings UI is fully clickable/testable, and
// getters return sensible defaults matching the demo company data already
// used elsewhere in the app.

export const defaultCompanySettings: CompanySettings = {
  name: "The EduNest",
  email: "admin@edunest.com",
  phone: "+91 98765 43210",
  website: "https://theedunest.com",
  address: { line1: "201, Business Hub, Baner Road", city: "Pune", state: "Maharashtra", pincode: "411045" },
};

export const defaultGstSettings: GstSettings = {
  gstNumber: "27AAAAA0000A1Z5",
  panNumber: "AAAAA0000A",
  taxRegistrationState: "Maharashtra",
  defaultGstPct: 18,
};

export const defaultBrandingSettings: BrandingSettings = {
  primaryColor: "#F44336",
  secondaryColor: "#1976D2",
  accentColor: "#FFC107",
};

export const defaultShippingSettings: ShippingSettings = {
  defaultCarrier: "In-house Fleet",
  freeShippingThreshold: 10000,
  standardDeliveryDays: 5,
  expressDeliveryDays: 2,
};

export const defaultBusinessRuleSettings: BusinessRuleSettings = {
  minOrderQty: 10,
  quotationValidityDays: 15,
  autoAssignDealers: false,
  overloadThresholdPct: 90,
};

async function saveSection<T>(section: string, payload: T): Promise<{ success: boolean }> {
  try {
    return await apiClient.put<{ success: boolean }>(`/settings/${section}`, payload);
  } catch (err) {
    if (err instanceof ApiNotConfiguredError) return { success: true };
    throw err;
  }
}

export const settingsService = {
  saveCompany: (payload: CompanySettings) => saveSection("company", payload),
  saveGst: (payload: GstSettings) => saveSection("gst", payload),
  saveBranding: (payload: BrandingSettings) => saveSection("branding", payload),
  saveShipping: (payload: ShippingSettings) => saveSection("shipping", payload),
  saveBusinessRules: (payload: BusinessRuleSettings) => saveSection("business-rules", payload),
};
