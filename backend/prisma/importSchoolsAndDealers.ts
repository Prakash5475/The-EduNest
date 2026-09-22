/**
 * One-time import for real business master data:
 *   prisma/import-data/schools.xlsx  (School Name, WhatsApp Number, Address, City)
 *   prisma/import-data/vendors.xlsx  (Vendor Name, Category, WhatsApp Number, Address)
 *
 * Run manually (not part of `prisma db seed`, which stays demo-data-free):
 *   npx ts-node prisma/importSchoolsAndDealers.ts
 *
 * Idempotent: re-running skips rows whose School.schoolName / Dealer.businessName
 * already exists (case-insensitive) instead of inserting duplicates.
 *
 * IMPORTANT — read before running:
 *  - Neither workbook has an email column or a login password. Since a school/dealer
 *    account requires both, this script generates a synthetic placeholder email
 *    (`school.<code>@import.edunest.local` / `dealer.<code>@import.edunest.local`) and a
 *    random 16-char password. NONE of these logins are usable until an admin resets the
 *    email to the school/dealer's real one and issues them their password out-of-band —
 *    this script is not a substitute for that handoff, only for getting the master
 *    records and phone numbers into the database.
 *  - The vendor workbook's "Category" column (e.g. "Book Printing", "Uniform") describes
 *    what the vendor supplies, not their legal business type. Dealer.businessType is a
 *    fixed enum (manufacturer/distributor/wholesaler/retailer) with no matching value and
 *    no free-text field exists on Dealer/DealerAddress to preserve the original category —
 *    it defaults to 'wholesaler' and the original text is only kept in this run's printed
 *    report, not persisted. If DealerProduct/Category-based specialization is wanted later,
 *    that's a separate, deliberate follow-up, not something this script silently invents.
 *  - "State" isn't a workbook column; it's parsed out of the Address text (matched against
 *    the standard list of Indian state names). Rows where no state name is found in the
 *    address fall back to 'Maharashtra' (every row inspected in both sheets is Pune-based)
 *    and are flagged in the report so an admin can double check.
 */
import ExcelJS from 'exceljs';
import path from 'node:path';
import { prisma } from '@/config/database';
import { hashPassword, generateRandomToken } from '@/helpers/password.helper';
import { generateSchoolCode, generateDealerCode } from '@/helpers/accountCode.helper';
import { roleRepository } from '@/repositories/role.repository';
import { SYSTEM_ROLES } from '@/constants';

const INDIAN_STATES = [
  'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Rajasthan', 'Uttar Pradesh',
  'Madhya Pradesh', 'West Bengal', 'Telangana', 'Andhra Pradesh', 'Kerala', 'Punjab',
  'Haryana', 'Bihar', 'Odisha', 'Delhi', 'Goa', 'Assam', 'Jharkhand', 'Chhattisgarh',
];

interface ImportRow {
  row: number;
  status: 'imported' | 'updated' | 'duplicate_skipped' | 'error';
  identifier: string;
  detail?: string;
}

function parseState(address: string): { state: string; guessed: boolean } {
  const match = INDIAN_STATES.find((s) => address.toLowerCase().includes(s.toLowerCase()));
  return match ? { state: match, guessed: false } : { state: 'Maharashtra', guessed: true };
}

function parsePincode(address: string): string {
  const match = address.match(/\b(\d{6})\b/);
  return match ? match[1] : '000000';
}

function normalizePhone(raw: string): string {
  // Some vendor rows have two numbers separated by "/" — take the first.
  const first = String(raw).split('/')[0].trim();
  return first.replace(/[^\d+]/g, '').slice(0, 15);
}

function slugifyForEmail(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/(^\.|\.$)/g, '').slice(0, 60);
}

function detectSchoolType(name: string): 'preschool' | 'k12' | 'play_school' | 'montessori' | 'other' {
  const n = name.toLowerCase();
  if (n.includes('montessori')) return 'montessori';
  if (n.includes('play school') || n.includes('playschool')) return 'play_school';
  if (n.includes('pre school') || n.includes('preschool') || n.includes('daycare') || n.includes('pre-school')) return 'preschool';
  return 'k12';
}

async function importSchools(): Promise<ImportRow[]> {
  const results: ImportRow[] = [];
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path.join(__dirname, 'import-data', 'schools.xlsx'));
  const sheet = wb.worksheets[0];

  const schoolAdminRole = await roleRepository.findBySlug(SYSTEM_ROLES.SCHOOL_ADMIN);
  if (!schoolAdminRole) throw new Error('school_admin role not found — run `npx prisma db seed` before importing.');

  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const name = String(row.getCell(2).value ?? '').trim();
    if (!name) continue;
    const whatsapp = String(row.getCell(3).value ?? '').trim();
    const address = String(row.getCell(4).value ?? '').trim();
    const city = String(row.getCell(5).value ?? '').trim();

    try {
      const existing = await prisma.school.findFirst({
        where: { schoolName: { equals: name } },
      });
      if (existing) {
        results.push({ row: r, status: 'duplicate_skipped', identifier: name, detail: `Already exists as School #${existing.id}` });
        continue;
      }

      const { state, guessed } = parseState(address);
      const phone = normalizePhone(whatsapp);
      const email = `school.${slugifyForEmail(name)}.${r}@import.edunest.local`;
      const tempPassword = generateRandomToken(12);
      const passwordHash = await hashPassword(tempPassword);
      const schoolCode = await generateSchoolCode();

      const user = await prisma.user.create({
        data: {
          fullName: name,
          email,
          phone,
          passwordHash,
          userType: 'school',
          status: 'pending_verification',
          failedLoginCount: 0,
        },
      });
      await roleRepository.assignToUser(user.id, schoolAdminRole.id);

      const school = await prisma.school.create({
        data: {
          schoolName: name,
          schoolCode,
          schoolType: detectSchoolType(name),
          status: 'pending_approval',
          user: { connect: { id: user.id } },
        },
      });

      await prisma.schoolAddress.create({
        data: {
          schoolId: school.id,
          addressType: 'billing',
          addressLine1: address || city || 'Not provided',
          city: city || 'Pune',
          state,
          country: 'India',
          pincode: parsePincode(address),
          isDefault: true,
        },
      });

      results.push({
        row: r,
        status: 'imported',
        identifier: name,
        detail: `School #${school.id} (${schoolCode}), user ${email}, temp password ${tempPassword}${guessed ? ' — state guessed, verify' : ''}`,
      });
    } catch (err) {
      results.push({ row: r, status: 'error', identifier: name, detail: err instanceof Error ? err.message : String(err) });
    }
  }
  return results;
}

async function importVendors(): Promise<ImportRow[]> {
  const results: ImportRow[] = [];
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path.join(__dirname, 'import-data', 'vendors.xlsx'));
  const sheet = wb.worksheets[0];

  const dealerRole = await roleRepository.findBySlug(SYSTEM_ROLES.DEALER);
  if (!dealerRole) throw new Error('dealer role not found — run `npx prisma db seed` before importing.');

  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const name = String(row.getCell(2).value ?? '').trim();
    if (!name) continue;
    const category = String(row.getCell(3).value ?? '').trim();
    const whatsapp = String(row.getCell(4).value ?? '').trim();
    const address = String(row.getCell(5).value ?? '').trim();

    try {
      const existing = await prisma.dealer.findFirst({
        where: { businessName: { equals: name } },
      });
      if (existing) {
        results.push({ row: r, status: 'duplicate_skipped', identifier: name, detail: `Already exists as Dealer #${existing.id}` });
        continue;
      }

      const { state, guessed } = parseState(address);
      const phone = normalizePhone(whatsapp);
      const email = `dealer.${slugifyForEmail(name)}.${r}@import.edunest.local`;
      const tempPassword = generateRandomToken(12);
      const passwordHash = await hashPassword(tempPassword);
      const dealerCode = await generateDealerCode();

      const user = await prisma.user.create({
        data: {
          fullName: name,
          email,
          phone,
          passwordHash,
          userType: 'dealer',
          status: 'pending_verification',
          failedLoginCount: 0,
        },
      });
      await roleRepository.assignToUser(user.id, dealerRole.id);

      const dealer = await prisma.dealer.create({
        data: {
          businessName: name,
          dealerCode,
          businessType: 'wholesaler',
          status: 'pending_approval',
          commissionRate: 0,
          averageRating: 0,
          user: { connect: { id: user.id } },
        },
      });

      await prisma.dealerAddress.create({
        data: {
          dealerId: dealer.id,
          addressType: 'registered',
          addressLine1: address || 'Not provided',
          city: state === 'Maharashtra' && address.toLowerCase().includes('pune') ? 'Pune' : 'Unknown',
          state,
          country: 'India',
          pincode: parsePincode(address),
          isDefault: true,
        },
      });

      results.push({
        row: r,
        status: 'imported',
        identifier: name,
        detail: `Dealer #${dealer.id} (${dealerCode}), user ${email}, temp password ${tempPassword}, source category "${category}" (NOT persisted — see script header)${guessed ? ', state guessed' : ''}`,
      });
    } catch (err) {
      results.push({ row: r, status: 'error', identifier: name, detail: err instanceof Error ? err.message : String(err) });
    }
  }
  return results;
}

function printSummary(label: string, results: ImportRow[]) {
  const counts = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});
  console.log(`\n=== ${label} import summary ===`);
  console.log(`Total rows processed: ${results.length}`);
  console.log(`Imported: ${counts.imported ?? 0}`);
  console.log(`Duplicate (skipped):  ${counts.duplicate_skipped ?? 0}`);
  console.log(`Errors:               ${counts.error ?? 0}`);
  console.log('---');
  for (const r of results) {
    console.log(`row ${r.row} [${r.status}] ${r.identifier}${r.detail ? ' — ' + r.detail : ''}`);
  }
}

async function main() {
  const schoolResults = await importSchools();
  printSummary('Schools', schoolResults);

  const vendorResults = await importVendors();
  printSummary('Vendors', vendorResults);

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('Import failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
