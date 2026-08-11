import { BaseRepository } from './base.repository';
import type { Dealer, Prisma, DealerBusinessType, DealerStatus } from '@prisma/client';

const publicInclude = {
  dealerAddresses: { where: { isDefault: true }, take: 1 },
  logoFile: { select: { filePath: true } },
} satisfies Prisma.DealerInclude;

export class DealerRepository extends BaseRepository {
  findByUserId(userId: bigint): Promise<Dealer | null> {
    return this.db.dealer.findFirst({ where: { userId } });
  }

  findById(id: bigint): Promise<Dealer | null> {
    return this.db.dealer.findUnique({ where: { id } });
  }

  /** Looks a dealer up by their WhatsApp-registered phone number (via the owning User row) —
   * the only way to identify a dealer now that there is no login portal for them. */
  findByPhone(phone: string): Promise<Dealer | null> {
    return this.db.dealer.findFirst({ where: { user: { phone }, deletedAt: null } });
  }

  findByIdWithDetail(id: bigint) {
    return this.db.dealer.findFirst({
      where: { id, deletedAt: null },
      include: { dealerAddresses: true, logoFile: { select: { filePath: true } } },
    });
  }

  findByCode(dealerCode: string): Promise<Dealer | null> {
    return this.db.dealer.findFirst({ where: { dealerCode } });
  }

  create(data: Prisma.DealerCreateInput): Promise<Dealer> {
    return this.db.dealer.create({ data });
  }

  update(id: bigint, data: Prisma.DealerUpdateInput): Promise<Dealer> {
    return this.db.dealer.update({ where: { id }, data });
  }

  /** Public marketplace directory — active, non-deleted dealers only. */
  async listActive(skip: number, take: number, businessType?: DealerBusinessType) {
    const where: Prisma.DealerWhereInput = {
      status: 'active',
      deletedAt: null,
      ...(businessType ? { businessType } : {}),
    };
    const [items, total] = await Promise.all([
      this.db.dealer.findMany({ where, include: publicInclude, orderBy: { averageRating: 'desc' }, skip, take }),
      this.db.dealer.count({ where }),
    ]);
    return { items, total };
  }

  /** Admin Dealers Management — list, filterable by status and business-name/code search, paginated. */
  async list(filters: { status?: DealerStatus; search?: string; skip: number; take: number }) {
    const where: Prisma.DealerWhereInput = {
      deletedAt: null,
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.search
        ? { OR: [{ businessName: { contains: filters.search } }, { dealerCode: { contains: filters.search } }] }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.db.dealer.findMany({ where, orderBy: { createdAt: 'desc' }, skip: filters.skip, take: filters.take }),
      this.db.dealer.count({ where }),
    ]);
    return { items, total };
  }
}

export const dealerRepository = new DealerRepository();
