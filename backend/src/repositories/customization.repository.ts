import type { Prisma, CustomizationRequestStatus } from '@prisma/client';
import { BaseRepository } from './base.repository';

const include = {
  customizationFiles: { orderBy: { displayOrder: 'asc' as const } },
  customizationStatusHistory: { orderBy: { createdAt: 'asc' as const } },
  product: {
    include: { productImages: { orderBy: { displayOrder: 'asc' as const }, take: 1 } },
  },
} satisfies Prisma.CustomizationRequestInclude;

export interface CustomizationListFilters {
  schoolId?: bigint;
  productId?: bigint;
  status?: CustomizationRequestStatus;
  skip: number;
  take: number;
}

export class CustomizationRepository extends BaseRepository {
  findById(id: bigint) {
    return this.db.customizationRequest.findFirst({ where: { id, deletedAt: null }, include });
  }

  async list(filters: CustomizationListFilters) {
    const where: Prisma.CustomizationRequestWhereInput = {
      deletedAt: null,
      ...(filters.schoolId ? { schoolId: filters.schoolId } : {}),
      ...(filters.productId ? { productId: filters.productId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
    };

    const [items, total] = await Promise.all([
      this.db.customizationRequest.findMany({
        where,
        include,
        orderBy: { createdAt: 'desc' },
        skip: filters.skip,
        take: filters.take,
      }),
      this.db.customizationRequest.count({ where }),
    ]);

    return { items, total };
  }

  create(data: {
    schoolId: bigint;
    productId: bigint;
    quantity: number;
    schoolName?: string;
    customText?: string;
    color?: string;
    size?: string;
    material?: string;
    brandingRequirements?: string;
    printingRequirements?: string;
    specialInstructions?: string;
    files: Array<{ fileId: bigint; fileType: 'logo' | 'artwork' | 'reference'; displayOrder: number }>;
  }) {
    return this.db.customizationRequest.create({
      data: {
        schoolId: data.schoolId,
        productId: data.productId,
        quantity: data.quantity,
        schoolName: data.schoolName,
        customText: data.customText,
        color: data.color,
        size: data.size,
        material: data.material,
        brandingRequirements: data.brandingRequirements,
        printingRequirements: data.printingRequirements,
        specialInstructions: data.specialInstructions,
        status: 'pending_review',
        ...(data.files.length ? { customizationFiles: { createMany: { data: data.files } } } : {}),
        customizationStatusHistory: { create: { status: 'pending_review' } },
      },
      include,
    });
  }

update(
  id: bigint,
  data: Prisma.CustomizationRequestUncheckedUpdateInput
) {
  return this.db.customizationRequest.update({
    where: { id },
    data,
    include,
  });
}
  replaceFiles(
    id: bigint,
    files: Array<{ fileId: bigint; fileType: 'logo' | 'artwork' | 'reference'; displayOrder: number }>,
  ) {
    return this.db.$transaction([
      this.db.customizationFile.deleteMany({ where: { customizationRequestId: id } }),
      ...(files.length
        ? [
            this.db.customizationFile.createMany({
              data: files.map((f) => ({ ...f, customizationRequestId: id })),
            }),
          ]
        : []),
    ]);
  }

  addStatusHistory(id: bigint, status: string, changedBy?: bigint, note?: string) {
    return this.db.customizationStatusHistory.create({
      data: { customizationRequestId: id, status, changedBy, note },
    });
  }
}

export const customizationRepository = new CustomizationRepository();
