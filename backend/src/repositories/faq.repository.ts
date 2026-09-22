import { BaseRepository } from './base.repository';

export class FaqRepository extends BaseRepository {
  listAll() {
    return this.db.faq.findMany({ where: { isActive: true }, orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }] });
  }
}

export const faqRepository = new FaqRepository();
