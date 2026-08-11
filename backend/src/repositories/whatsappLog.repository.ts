import type { Prisma, WhatsappMessageLog, WhatsappMessageStatus } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class WhatsappLogRepository extends BaseRepository {
  create(data: Prisma.WhatsappMessageLogCreateInput): Promise<WhatsappMessageLog> {
    return this.db.whatsappMessageLog.create({ data });
  }

  findById(id: bigint): Promise<WhatsappMessageLog | null> {
    return this.db.whatsappMessageLog.findUnique({ where: { id } });
  }

  /** For inbound delivery-status webhook callbacks (sent/delivered/read/failed) from Meta. */
  findByProviderMessageId(providerMessageId: string): Promise<WhatsappMessageLog | null> {
    return this.db.whatsappMessageLog.findFirst({ where: { providerMessageId } });
  }

  async updateStatus(
    id: bigint,
    data: Partial<{
      status: WhatsappMessageStatus;
      providerName: string;
      providerMessageId: string;
      providerResponse: Prisma.InputJsonValue;
      errorMessage: string;
      retryCount: number;
      sentAt: Date;
      deliveredAt: Date;
      readAt: Date;
      failedAt: Date;
    }>,
  ) {
    return this.db.whatsappMessageLog.update({ where: { id }, data });
  }

  async list(skip: number, take: number, status?: WhatsappMessageStatus) {
    const where: Prisma.WhatsappMessageLogWhereInput = status ? { status } : {};
    const [items, total] = await Promise.all([
      this.db.whatsappMessageLog.findMany({
        where,
        include: { user: { select: { id: true, fullName: true, userType: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.db.whatsappMessageLog.count({ where }),
    ]);
    return { items, total };
  }
}

export const whatsappLogRepository = new WhatsappLogRepository();
