import { settingsRepository } from '@/repositories/settings.repository';
import { env } from '@/config/env';

export interface CompanyGstProfile {
  legalName: string;
  tradeName: string;
  gstin: string;
  constitution: string;
  registrationType: string;
  registrationDate: string;
  addressLine1: string;
  addressLine2: string;
  locality: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
}

export interface GstBreakdown {
  isInterState: boolean;
  /** True when the supply state is a Union Territory that uses UTGST (not SGST) for intra-territory supply. */
  isUnionTerritory: boolean;
  companyGstState: string;
  supplyState: string;
  /** Always equals cgst+sgst+utgst+igst, i.e. the same figure previously stored as a flat `taxAmount`. */
  totalTax: number;
  cgst: number;
  sgst: number;
  utgst: number;
  igst: number;
}

function normalizeState(state: string): string {
  return state.trim().toLowerCase();
}

/**
 * Union Territories that are administered directly (no state legislature) and therefore
 * charge CGST + UTGST on intra-territory supply instead of CGST + SGST — per Section 8(2) of
 * the UTGST Act, 2017. Delhi, Puducherry, and Jammu & Kashmir are UTs but DO have their own
 * legislature, so they charge CGST + SGST like a state and are deliberately excluded here.
 * This was the specific defect flagged for audit: the previous version of this helper had no
 * UTGST concept at all and labelled every intra-territory supply as SGST, which is wrong for
 * these five.
 */
const UTGST_TERRITORIES = new Set([
  'chandigarh',
  'lakshadweep',
  'andaman and nicobar islands',
  'andaman & nicobar islands',
  'dadra and nagar haveli and daman and diu',
  'dadra & nagar haveli and daman & diu',
  'ladakh',
]);

function isUtgstTerritory(state: string): boolean {
  return UTGST_TERRITORIES.has(normalizeState(state));
}

/**
 * Company's own GST-registration state — the "place of supply" comparison point for every
 * CGST/SGST-vs-IGST decision in the app (quotation acceptance, checkout, invoices, reports).
 * Settings table (admin-editable, Admin Settings > Company/GST) takes priority; env vars are
 * only a pre-launch fallback so the calculation never silently breaks before an admin visits
 * Settings. Never hardcode a state name in calling code — always go through this function.
 */
export async function getCompanyGstState(): Promise<string> {
  const fromSettings = await settingsRepository.getApplicationValue('company_gst_state');
  return (fromSettings && fromSettings.trim()) || env.COMPANY_GST_STATE;
}

export async function getCompanyGstProfile(): Promise<CompanyGstProfile> {
  const get = async (key: string, fallback = '') => (await settingsRepository.getApplicationValue(key))?.trim() || fallback;
  return {
    legalName: await get('company_legal_name'),
    tradeName: await get('company_trade_name', 'The EduNest'),
    gstin: await get('company_gstin'),
    constitution: await get('company_constitution'),
    registrationType: await get('company_gst_registration_type'),
    registrationDate: await get('company_gst_registration_date'),
    addressLine1: await get('company_gst_address_line1'),
    addressLine2: await get('company_gst_address_line2'),
    locality: await get('company_gst_locality'),
    city: await get('company_gst_city'),
    district: await get('company_gst_district'),
    state: await get('company_gst_state'),
    pincode: await get('company_gst_pincode'),
  };
}

export async function getCompanyGstin(): Promise<string> {
  const fromSettings = await settingsRepository.getApplicationValue('company_gstin');
  return (fromSettings && fromSettings.trim()) || env.COMPANY_GSTIN;
}

/**
 * Splits a single tax amount into CGST+SGST (intra-state) or IGST (inter-state) per CBIC's
 * rule — never both for the same taxable supply. `totalTax` is unchanged from today's flat
 * `taxAmount` figure; this only determines how it's *labelled*, so it's safe to introduce
 * without any Order/OrderItem schema change (no new columns, no migration, no Prisma regen
 * required) — invoices/reports compute the split from the already-stored total on read.
 */
export function splitGst(totalTax: number, companyGstState: string, supplyState: string): GstBreakdown {
  const isInterState =
    !!companyGstState && !!supplyState && normalizeState(companyGstState) !== normalizeState(supplyState);
  const rounded = Math.round(totalTax * 100) / 100;
  if (isInterState) {
    return {
      isInterState,
      isUnionTerritory: false,
      companyGstState,
      supplyState,
      totalTax: rounded,
      cgst: 0,
      sgst: 0,
      utgst: 0,
      igst: rounded,
    };
  }
  // Split evenly; correct the smaller half by any rounding remainder so the two halves sum to totalTax exactly.
  const half = Math.round((rounded / 2) * 100) / 100;
  const otherHalf = Math.round((rounded - half) * 100) / 100;
  const isUnionTerritory = isUtgstTerritory(supplyState);
  return {
    isInterState,
    isUnionTerritory,
    companyGstState,
    supplyState,
    totalTax: rounded,
    cgst: half,
    sgst: isUnionTerritory ? 0 : otherHalf,
    utgst: isUnionTerritory ? otherHalf : 0,
    igst: 0,
  };
}

/** Convenience wrapper: resolves the company's configured state, then splits. */
export async function calculateGstBreakdown(totalTax: number, supplyState: string): Promise<GstBreakdown> {
  const companyGstState = await getCompanyGstState();
  return splitGst(totalTax, companyGstState, supplyState);
}
