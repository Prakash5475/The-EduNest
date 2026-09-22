import crypto from 'node:crypto';
import { supportRepository } from '@/repositories/support.repository';
import { schoolRepository } from '@/repositories/school.repository';
import { dealerRepository } from '@/repositories/dealer.repository';
import { notifyUser, notifyUsersWithRole } from '@/helpers/notification.helper';
import { ApiError } from '@/utils/ApiError';
import { normalizePagination, buildPaginationMeta } from '@/helpers/pagination.helper';
import type { AuthenticatedUser } from '@/types';
import type { SupportTicketStatus, SupportTicketPriority } from '@prisma/client';

async function generateTicketNumber(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = crypto.randomInt(100000, 999999);
    const candidate = `TKT-${datePart}-${randomPart}`;
    const existing = await supportRepository.findByTicketNumber(candidate);
    if (!existing) return candidate;
  }
  throw ApiError.internal('Could not generate a unique ticket number, please try again');
}

function isStaff(user: AuthenticatedUser): boolean {
  return user.roles?.some((r) => r === 'super_admin' || r === 'staff') ?? false;
}

export class SupportService {
  async create(
    user: AuthenticatedUser,
    input: {
      subject: string;
      description: string;
      category: 'order' | 'payment' | 'product' | 'account' | 'technical' | 'other';
      priority: SupportTicketPriority;
      fileIds?: bigint[];
    },
  ) {
    let schoolId: bigint | undefined;
    let dealerId: bigint | undefined;
    if (user.userType === 'school') {
      const school = await schoolRepository.findByUserId(BigInt(user.id));
      schoolId = school?.id;
    } else if (user.userType === 'dealer') {
      const dealer = await dealerRepository.findByUserId(BigInt(user.id));
      dealerId = dealer?.id;
    }

    const ticketNumber = await generateTicketNumber();
    const ticket = await supportRepository.create({
      ticketNumber,
      raisedBy: BigInt(user.id),
      schoolId,
      dealerId,
      subject: input.subject,
      description: input.description,
      category: input.category,
      priority: input.priority,
    });

    for (const fileId of input.fileIds ?? []) {
      await supportRepository.addAttachment('support_ticket', ticket.id, fileId);
    }

    await notifyUsersWithRole(['super_admin', 'staff'], {
      type: 'support_ticket_created',
      title: 'New support ticket',
      message: `${ticketNumber}: ${input.subject}`,
      referenceType: 'support_ticket',
      referenceId: ticket.id,
    });

    return ticket;
  }

  async listMine(user: AuthenticatedUser, filters: { status?: SupportTicketStatus; page?: number; limit?: number }) {
    const { page, limit, skip, take } = normalizePagination(filters.page, filters.limit);
    const { items, total } = await supportRepository.list({ raisedBy: BigInt(user.id), status: filters.status, skip, take });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async listForAdmin(filters: {
    status?: SupportTicketStatus;
    priority?: SupportTicketPriority;
    assignedTo?: bigint;
    page?: number;
    limit?: number;
  }) {
    const { page, limit, skip, take } = normalizePagination(filters.page, filters.limit);
    const { items, total } = await supportRepository.list({
      status: filters.status,
      priority: filters.priority,
      assignedTo: filters.assignedTo,
      skip,
      take,
    });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async getById(user: AuthenticatedUser, id: bigint) {
    const ticket = await supportRepository.findById(id);
    if (!ticket) throw ApiError.notFound('Ticket not found');
    if (!isStaff(user) && ticket.raisedBy !== BigInt(user.id) && ticket.assignedTo !== BigInt(user.id)) {
      throw ApiError.forbidden('You do not have access to this ticket');
    }
    return ticket;
  }

  async reply(user: AuthenticatedUser, ticketId: bigint, message: string, isInternalNote: boolean) {
    const ticket = await this.getById(user, ticketId);
    if (isInternalNote && !isStaff(user)) {
      throw ApiError.forbidden('Only staff can add internal notes');
    }

    const reply = await supportRepository.addReply({
      ticketId,
      authorId: BigInt(user.id),
      message,
      isInternalNote,
    });

    if (!isInternalNote) {
      if (isStaff(user) && ticket.raisedBy !== BigInt(user.id)) {
        await notifyUser({
          userId: ticket.raisedBy,
          type: 'support_ticket_reply',
          title: 'New reply on your ticket',
          message: `${ticket.ticketNumber}: you have a new reply`,
          referenceType: 'support_ticket',
          referenceId: ticket.id,
        });
      } else if (!isStaff(user)) {
        await notifyUsersWithRole(['super_admin', 'staff'], {
          type: 'support_ticket_reply',
          title: 'New reply on a ticket',
          message: `${ticket.ticketNumber} has a new reply`,
          referenceType: 'support_ticket',
          referenceId: ticket.id,
        });
      }
    }

    return reply;
  }

  async assign(ticketId: bigint, assignedTo: bigint) {
    const ticket = await supportRepository.update(ticketId, { assignedTo, status: 'in_progress' });
    await notifyUser({
      userId: assignedTo,
      type: 'support_ticket_assigned',
      title: 'Ticket assigned to you',
      message: `${ticket.ticketNumber}: ${ticket.subject}`,
      referenceType: 'support_ticket',
      referenceId: ticket.id,
    });
    return ticket;
  }

  async updateStatus(ticketId: bigint, status: SupportTicketStatus) {
    const data: { status: SupportTicketStatus; resolvedAt?: Date } = { status };
    if (status === 'resolved' || status === 'closed') data.resolvedAt = new Date();
    const ticket = await supportRepository.update(ticketId, data);
    if (status === 'resolved' || status === 'closed') {
      await notifyUser({
        userId: ticket.raisedBy,
        type: 'support_ticket_status',
        title: 'Ticket update',
        message: `${ticket.ticketNumber} was marked ${status}`,
        referenceType: 'support_ticket',
        referenceId: ticket.id,
      });
    }
    return ticket;
  }

  async updatePriority(ticketId: bigint, priority: SupportTicketPriority) {
    return supportRepository.update(ticketId, { priority });
  }
}

export const supportService = new SupportService();
