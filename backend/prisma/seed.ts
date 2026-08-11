import { PrismaClient } from '@prisma/client';
import { SYSTEM_ROLES } from '../src/constants';

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
const SHIPPING_METHOD_SEEDS = [
  { name: 'Standard', rate: 0, estimatedDaysMin: 5, estimatedDaysMax: 8, isActive: true },
  { name: 'Express', rate: 499, estimatedDaysMin: 2, estimatedDaysMax: 3, isActive: true },
  { name: 'Bulk Freight', rate: 1499, estimatedDaysMin: 10, estimatedDaysMax: 15, isActive: true },
];

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
