import { PrismaClient, ProductStatus, UserStatus, UserUserType } from '@prisma/client';
import bcrypt from 'bcrypt';
import { SYSTEM_ROLES } from '../src/constants';
import { importCatalogueImages } from './importCatalogue';

const prisma = new PrismaClient();

const SYSTEM_ROLE_SEEDS = [
  { name: 'Super Admin', slug: SYSTEM_ROLES.SUPER_ADMIN, description: 'Full system access', isSystem: true },
  { name: 'School Admin', slug: SYSTEM_ROLES.SCHOOL_ADMIN, description: 'Manages a school account', isSystem: true },
  { name: 'Dealer', slug: SYSTEM_ROLES.DEALER, description: 'Dealer/reseller account', isSystem: true },
  { name: 'Staff', slug: SYSTEM_ROLES.STAFF, description: 'Internal EduNest staff', isSystem: true },
];

// Phase 1 foundation permissions only — module-specific permissions
// (products.*, orders.*, dealers.*, schools.*) are seeded by their
// respective phases.
const FOUNDATION_PERMISSIONS = [
  { name: 'users.read', module: 'users', description: 'View user accounts' },
  { name: 'users.update', module: 'users', description: 'Update user accounts' },
  { name: 'roles.manage', module: 'roles', description: 'Manage roles and permissions' },
];

// Phase 3 (Checkout) — operational config, not mock business data: the
// Delivery Method selector needs at least one real option to compute
// shipping_amount from. Admins can add/edit more via the Settings module.

const COMPANY_GST_SETTINGS = [
  { key: 'company_legal_name', value: 'MADHAV TIRUPATI JAYBHAYE' },
  { key: 'company_trade_name', value: 'The EduNest' },
  { key: 'company_gstin', value: '27CIEP38036K1ZY' },
  { key: 'company_constitution', value: 'Proprietorship' },
  { key: 'company_gst_registration_type', value: 'Regular' },
  { key: 'company_gst_registration_date', value: '2026-01-07' },
  { key: 'company_gst_address_line1', value: 'Floor No: Office No 101, Building No./Flat No.: Guru Krupa Sewa Aashram Road' },
  { key: 'company_gst_address_line2', value: 'Name of Premises/Building: Momin Apartments, Road/Street: Wagholi Awhadi Road' },
  { key: 'company_gst_locality', value: 'Wagholi' },
  { key: 'company_gst_city', value: 'Pune' },
  { key: 'company_gst_district', value: 'Pune' },
  { key: 'company_gst_state', value: 'Maharashtra' },
  { key: 'company_gst_pincode', value: '412207' },
];

const SHIPPING_METHOD_SEEDS = [
  { name: 'Standard', rate: 0, estimatedDaysMin: 5, estimatedDaysMax: 8, isActive: true },
  { name: 'Express', rate: 499, estimatedDaysMin: 2, estimatedDaysMax: 3, isActive: true },
  { name: 'Bulk Freight', rate: 1499, estimatedDaysMin: 10, estimatedDaysMax: 15, isActive: true },
];

const CATALOG_CATEGORY_SEEDS = [
  { name: 'Uniforms & Clothing', slug: 'uniforms-clothing' },
  { name: 'School Accessories', slug: 'school-accessories' },
  { name: 'Printing & Documents', slug: 'printing-documents' },
  { name: 'Academic Books', slug: 'academic-books' },
  { name: 'Learning Materials', slug: 'learning-materials' },
  { name: 'Awards & Recognition', slug: 'awards-recognition' },
];

const CATALOG_PRODUCT_SEEDS = [
  {
    name: 'Student T-Shirt',
    sku: 'EDU-UNI-001',
    slug: 'student-t-shirt',
    categorySlug: 'uniforms-clothing',
    basePrice: 600,
    description: 'Comfortable student T-shirt made with child-friendly materials for school use.',
  },
  {
    name: 'Student Lower (Pant / Skirt)',
    sku: 'EDU-UNI-002',
    slug: 'student-lower-pant-skirt',
    categorySlug: 'uniforms-clothing',
    basePrice: 600,
    description: 'Student lower wear available as pant or skirt for school uniform requirements.',
  },
  {
    name: 'Student Track Pant',
    sku: 'EDU-UNI-003',
    slug: 'student-track-pant',
    categorySlug: 'uniforms-clothing',
    basePrice: 600,
    description: 'Comfortable student track pant suitable for school activities and sports.',
  },
  {
    name: 'Student Hooded Jacket',
    sku: 'EDU-UNI-004',
    slug: 'student-hooded-jacket',
    categorySlug: 'uniforms-clothing',
    basePrice: 1100,
    description: 'Student hooded jacket designed for comfortable school wear.',
  },
  {
    name: 'Apron (Student / Maid)',
    sku: 'EDU-UNI-005',
    slug: 'apron-student-maid',
    categorySlug: 'uniforms-clothing',
    basePrice: 600,
    description: 'Practical apron suitable for students or school support staff.',
  },
  {
    name: 'Staff T-Shirt',
    sku: 'EDU-UNI-006',
    slug: 'staff-t-shirt',
    categorySlug: 'uniforms-clothing',
    basePrice: 999,
    description: 'Professional staff T-shirt suitable for school staff and team members.',
  },
  {
    name: 'Staff Waistcoat',
    sku: 'EDU-UNI-007',
    slug: 'staff-waistcoat',
    categorySlug: 'uniforms-clothing',
    basePrice: 1099,
    description: 'Professional waistcoat designed for school staff.',
  },
  {
    name: 'School Bag',
    sku: 'EDU-ACC-001',
    slug: 'school-bag',
    categorySlug: 'school-accessories',
    basePrice: 660,
    description: 'Durable school bag designed for everyday student use.',
  },
  {
    name: 'School Socks',
    sku: 'EDU-ACC-002',
    slug: 'school-socks',
    categorySlug: 'school-accessories',
    basePrice: 120,
    description: 'Comfortable school socks suitable for daily school uniform use.',
  },
  {
    name: 'School Diary',
    sku: 'EDU-ACC-003',
    slug: 'school-diary',
    categorySlug: 'school-accessories',
    basePrice: 180,
    description: 'School diary for student notes, communication and daily records.',
  },
  {
    name: 'Student ID Card',
    sku: 'EDU-ACC-004',
    slug: 'student-id-card',
    categorySlug: 'school-accessories',
    basePrice: 160,
    description: "Student identity card designed to match the school's professional identity.",
  },
  {
    name: 'Report Card',
    sku: 'EDU-PRT-001',
    slug: 'report-card',
    categorySlug: 'printing-documents',
    basePrice: 60,
    description: 'Professionally designed report card for school student records.',
  },
  {
    name: 'Certificate',
    sku: 'EDU-PRT-002',
    slug: 'certificate',
    categorySlug: 'printing-documents',
    basePrice: 30,
    description: 'School certificate for recognition and student achievements.',
  },
  {
    name: 'Book Set - Playgroup',
    sku: 'EDU-BK-001',
    slug: 'book-set-playgroup',
    categorySlug: 'academic-books',
    basePrice: 1599,
    description: 'Structured Playgroup book set designed for foundational learning.',
  },
  {
    name: 'Book Set - Nursery',
    sku: 'EDU-BK-002',
    slug: 'book-set-nursery',
    categorySlug: 'academic-books',
    basePrice: 1799,
    description: 'Structured Nursery book set supporting age-appropriate learning.',
  },
  {
    name: 'Book Set - Junior KG',
    sku: 'EDU-BK-003',
    slug: 'book-set-junior-kg',
    categorySlug: 'academic-books',
    basePrice: 1999,
    description: 'Junior KG academic book set designed for progressive classroom learning.',
  },
  {
    name: 'Book Set - Senior KG',
    sku: 'EDU-BK-004',
    slug: 'book-set-senior-kg',
    categorySlug: 'academic-books',
    basePrice: 2199,
    description: 'Senior KG academic book set designed for progressive foundational learning.',
  },
  {
    name: 'Activity Sheets',
    sku: 'EDU-LRN-001',
    slug: 'activity-sheets',
    categorySlug: 'learning-materials',
    basePrice: 200,
    description: 'Engaging activity sheets designed to support cognitive, creative and fine-motor development.',
  },
  {
    name: 'Printed Notebooks',
    sku: 'EDU-LRN-002',
    slug: 'printed-notebooks',
    categorySlug: 'learning-materials',
    basePrice: 160,
    description: 'Pre-printed notebooks designed to reinforce classroom learning and regular practice.',
  },
];

const ADMIN_EMAIL = 'admin@localhost.dev';
const ADMIN_PASSWORD = 'Admin@123';

async function hashAdminPassword(): Promise<string> {
  return bcrypt.hash(ADMIN_PASSWORD, Number(process.env.BCRYPT_SALT_ROUNDS ?? 12));
}

async function main(): Promise<void> {
  console.log('🌱 Seeding roles...');
  const roles = await Promise.all(
    SYSTEM_ROLE_SEEDS.map((role) =>
      prisma.role.upsert({
        where: { slug: role.slug },
        update: { name: role.name, description: role.description, isSystem: role.isSystem },
        create: role,
      }),
    ),
  );

  console.log('🌱 Seeding permissions...');
  const permissions = await Promise.all(
    FOUNDATION_PERMISSIONS.map((perm) =>
      prisma.permission.upsert({
        where: { name: perm.name },
        update: { module: perm.module, description: perm.description },
        create: perm,
      }),
    ),
  );

  const superAdmin = roles.find((r) => r.slug === SYSTEM_ROLES.SUPER_ADMIN)!;
  console.log('🌱 Seeding local admin account...');
  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      fullName: 'EduNest Administrator',
      passwordHash: await hashAdminPassword(),
      userType: UserUserType.admin,
      status: UserStatus.active,
      failedLoginCount: 0,
      lockedUntil: null,
    },
    create: {
      fullName: 'EduNest Administrator',
      email: ADMIN_EMAIL,
      passwordHash: await hashAdminPassword(),
      userType: UserUserType.admin,
      status: UserStatus.active,
      failedLoginCount: 0,
      emailVerifiedAt: new Date(),
    },
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: superAdmin.id } },
    update: {},
    create: { userId: admin.id, roleId: superAdmin.id },
  });

  console.log('🌱 Granting all foundation permissions to Super Admin...');
  await Promise.all(
    permissions.map((perm) =>
      prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: superAdmin.id, permissionId: perm.id } },
        update: {},
        create: { roleId: superAdmin.id, permissionId: perm.id },
      }),
    ),
  );

  console.log('🌱 Seeding company GST profile...');
  await Promise.all(
    COMPANY_GST_SETTINGS.map((setting) =>
      prisma.applicationSetting.upsert({
        where: { settingKey: setting.key },
        update: { settingValue: setting.value, valueType: 'string' },
        create: { settingKey: setting.key, settingValue: setting.value, valueType: 'string' },
      }),
    ),
  );

  console.log('🌱 Seeding shipping methods...');
  await Promise.all(
    SHIPPING_METHOD_SEEDS.map((method) =>
      prisma.shippingMethod.upsert({
        where: { name: method.name },
        update: {
          rate: method.rate,
          estimatedDaysMin: method.estimatedDaysMin,
          estimatedDaysMax: method.estimatedDaysMax,
          isActive: method.isActive,
        },
        create: method,
      }),
    ),
  );

  console.log('🌱 Seeding catalog categories and products...');
  const categories = await Promise.all(
    CATALOG_CATEGORY_SEEDS.map((category, index) =>
      prisma.category.upsert({
        where: { slug: category.slug },
        update: { name: category.name, isActive: true, displayOrder: index },
        create: { ...category, displayOrder: index, isActive: true },
      }),
    ),
  );
  const categoryBySlug = new Map(categories.map((category) => [category.slug, category]));
  const brand = await prisma.brand.upsert({
    where: { slug: 'edunest' },
    update: { name: 'EduNest', isActive: true },
    create: { name: 'EduNest', slug: 'edunest', isActive: true },
  });
  await Promise.all(
    CATALOG_PRODUCT_SEEDS.map((product) => {
      const category = categoryBySlug.get(product.categorySlug);
      if (!category) throw new Error(`Missing catalog category: ${product.categorySlug}`);
      const { categorySlug, ...productData } = product;
      return prisma.product.upsert({
        where: { sku: product.sku },
        update: {
          ...productData,
          categoryId: category.id,
          brandId: brand.id,
          shortDescription: product.description,
          minOrderQty: 1,
          status: ProductStatus.active,
          deletedAt: null,
        },
        create: {
          ...productData,
          categoryId: category.id,
          brandId: brand.id,
          shortDescription: product.description,
          minOrderQty: 1,
          status: ProductStatus.active,
        },
      });
    }),
  );

  const catalogueImport = await importCatalogueImages();
  console.log(`🌱 Imported ${catalogueImport.images} catalogue images for ${catalogueImport.products} products...`);

  console.log('✅ Seed complete');
}

main()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
