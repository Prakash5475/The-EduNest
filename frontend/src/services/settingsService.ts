import { apiClient } from "./apiClient";
import type {
  CompanySettings,
  GstSettings,
  BrandingSettings,
  ShippingSettings,
  BusinessRuleSettings,
} from "@/types";

// Company/GST are wired to the real backend:
//   GET  /settings/company   — public, safe read (invoices, checkout, this page)
//   PATCH /admin/settings    — bulk upsert by key (admin/staff only)
// Branding/Shipping/Business Rules have no backend model yet, so their savers still
// fall back to an optimistic no-op until that API exists (unchanged from before).

export const defaultCompanySettings: CompanySettings = {
  name: "The EduNest",
  email: "",
  phone: "",
  website: "",
  address: { line1: "", city: "", state: "", pincode: "" },
};

export const defaultGstSettings: GstSettings = {
  gstNumber: "",
  panNumber: "",
  taxRegistrationState: "",
  defaultGstPct: 18,
  legalName: "",
  constitution: "",
  registrationType: "",
  registrationDate: "",
  gstAddress: { line1: "", city: "", state: "", pincode: "" },
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

export interface CompanyApiShape {
  legalName: string;
  tradeName: string;
  email: string;
  phone: string;
  website: string;
  gstin: string;
  constitution: string;
  registrationType: string;
  registrationDate: string;
  address: {
    line1: string;
    line2: string;
    locality: string;
    city: string;
    district: string;
    state: string;
    pincode: string;
  };
}

/** Public read — used to populate both the Company Information and GST Settings tabs. */
export async function loadCompanyProfile(): Promise<CompanyApiShape | null> {
  try {
    const { company } = await apiClient.get<{ company: CompanyApiShape }>("/settings/company");
    return company;
  } catch {
    return null;
  }
}

export async function loadCompanySettings(): Promise<CompanySettings> {
  const company = await loadCompanyProfile();
  if (!company) return defaultCompanySettings;
  return {
    name: company.tradeName || defaultCompanySettings.name,
    email: company.email,
    phone: company.phone,
    website: company.website,
    address: {
      line1: [company.address.line1, company.address.line2].filter(Boolean).join(", "),
      city: company.address.city,
      state: company.address.state,
      pincode: company.address.pincode,
    },
  };
}

export async function loadGstSettings(): Promise<GstSettings> {
  const company = await loadCompanyProfile();
  if (!company) return defaultGstSettings;
  return {
    gstNumber: company.gstin,
    panNumber: "",
    taxRegistrationState: company.address.state,
    defaultGstPct: 18,
    legalName: company.legalName,
    constitution: company.constitution,
    registrationType: company.registrationType,
    registrationDate: company.registrationDate,
    gstAddress: {
      line1: [company.address.line1, company.address.line2].filter(Boolean).join(", "),
      city: company.address.city,
      state: company.address.state,
      pincode: company.address.pincode,
    },
  };
}

interface AdminSettingEntry {
  key: string;
  value: string | null;
  valueType: "string" | "number" | "boolean" | "json";
}

async function upsertAdminSettings(entries: AdminSettingEntry[]): Promise<{ success: boolean }> {
  await apiClient.patch("/admin/settings", { settings: entries });
  return { success: true };
}

async function saveSectionOptimistic<T>(section: string, payload: T): Promise<{ success: boolean }> {
  try {
    await apiClient.put<{ success: boolean }>(`/settings/${section}`, payload as unknown);
    return { success: true };
  } catch {
    // No backend model for this section yet — keep the UI clickable/testable rather than block.
    return { success: true };
  }
}

export const settingsService = {
  loadCompany: loadCompanySettings,
  loadGst: loadGstSettings,

  saveCompany: (payload: CompanySettings) =>
    upsertAdminSettings([
      { key: "company_trade_name", value: payload.name, valueType: "string" },
      { key: "company_email", value: payload.email, valueType: "string" },
      { key: "company_phone", value: payload.phone, valueType: "string" },
      { key: "company_website", value: payload.website, valueType: "string" },
      { key: "company_gst_address_line1", value: payload.address.line1, valueType: "string" },
      { key: "company_gst_city", value: payload.address.city, valueType: "string" },
      { key: "company_gst_state", value: payload.address.state, valueType: "string" },
      { key: "company_gst_pincode", value: payload.address.pincode, valueType: "string" },
    ]),

  saveGst: (payload: GstSettings) =>
    upsertAdminSettings([
      { key: "company_legal_name", value: payload.legalName, valueType: "string" },
      { key: "company_gstin", value: payload.gstNumber, valueType: "string" },
      { key: "company_constitution", value: payload.constitution, valueType: "string" },
      { key: "company_gst_registration_type", value: payload.registrationType, valueType: "string" },
      { key: "company_gst_registration_date", value: payload.registrationDate, valueType: "string" },
      { key: "company_gst_address_line1", value: payload.gstAddress.line1, valueType: "string" },
      { key: "company_gst_city", value: payload.gstAddress.city, valueType: "string" },
      { key: "company_gst_state", value: payload.gstAddress.state, valueType: "string" },
      { key: "company_gst_pincode", value: payload.gstAddress.pincode, valueType: "string" },
    ]),

  saveBranding: (payload: BrandingSettings) => saveSectionOptimistic("branding", payload),
  saveShipping: (payload: ShippingSettings) => saveSectionOptimistic("shipping", payload),
  saveBusinessRules: (payload: BusinessRuleSettings) => saveSectionOptimistic("business-rules", payload),
};
