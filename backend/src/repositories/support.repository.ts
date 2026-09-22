import type { Prisma, SupportTicketStatus, SupportTicketPriority } from '@prisma/client';
import { BaseRepository } from './base.repository';

const include = {
  ticketReplies: {
    orderBy: { createdAt: 'asc' as const },
    include: { user: { select: { id: true, fullName: true, userType: true } } },
  },
  school: { select: { id: true, schoolName: true } },
  dealer: { select: { id: true, businessName: true } },
} satisfies Prisma.SupportTicketInclude;

export interface TicketListFilters {
  raisedBy?: bigint;
  assignedTo?: bigint;
  status?: SupportTicketStatus;
  priority?: SupportTicketPriority;
  skip: number;
  take: number;
}

export class SupportRepository extends BaseRepository {
  findById(id: bigint) {
    return this.db.supportTicket.findUnique({ where: { id }, include });
  }

  findByTicketNumber(ticketNumber: string) {
    return this.db.supportTicket.findFirst({ where: { ticketNumber } });
  }

  async list(filters: TicketListFilters) {
    const where: Prisma.SupportTicketWhereInput = {
      ...(filters.raisedBy ? { raisedBy: filters.raisedBy } : {}),
      ...(filters.assignedTo ? { assignedTo: filters.assignedTo } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.priority ? { priority: filters.priority } : {}),
    };
    const [items, total] = await Promise.all([
      this.db.supportTicket.findMany({ where, include, orderBy: { createdAt: 'desc' }, skip: filters.skip, take: filters.take }),
      this.db.supportTicket.count({ where }),
    ]);
    return { items, total };
  }

  create(data: {
    ticketNumber: string;
    raisedBy: bigint;
    schoolId?: bigint;
    dealerId?: bigint;
    subject: string;
    description: string;
    category: 'order' | 'payment' | 'product' | 'account' | 'technical' | 'other';
    priority: SupportTicketPriority;
  }) {
    return this.db.supportTicket.create({ data: { ...data, status: 'open' }, include });
  }

  update(
  id: bigint,
  data: Prisma.SupportTicketUncheckedUpdateInput
) {
  return this.db.supportTicket.update({
    where: { id },
    data,
    include,
  });
}

  addReply(data: { ticketId: bigint; authorId: bigint; message: string; isInternalNote: boolean }) {
    return this.db.ticketReply.create({ data });
  }

  addAttachment(attachableType: string, attachableId: bigint, fileId: bigint) {
    return this.db.attachment.create({ data: { attachableType, attachableId, fileId } });
  }

  listAttachments(attachableType: string, attachableId: bigint) {
    return this.db.attachment.findMany({ where: { attachableType, attachableId }, include: { uploadedFile: true } });
  }
}

export const supportRepository = new SupportRepository();
