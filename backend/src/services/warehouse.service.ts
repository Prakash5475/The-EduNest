import { warehouseRepository } from '@/repositories/warehouse.repository';
import { normalizePagination, buildPaginationMeta } from '@/helpers/pagination.helper';
import { ApiError } from '@/utils/ApiError';

interface UpsertInput {
  name: string;
  location?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export class WarehouseService {
  async create(input: UpsertInput) {
    const existing = await warehouseRepository.findByName(input.name);
    if (existing) throw ApiError.conflict('A warehouse with this name already exists');
    return warehouseRepository.create(input);
  }

  async update(id: bigint, input: Partial<UpsertInput>) {
    const warehouse = await warehouseRepository.findById(id);
    if (!warehouse) throw ApiError.notFound('Warehouse not found');
    if (input.name && input.name !== warehouse.name) {
      const clash = await warehouseRepository.findByName(input.name);
      if (clash) throw ApiError.conflict('A warehouse with this name already exists');
    }
    return warehouseRepository.update(id, input);
  }

  async setActive(id: bigint, isActive: boolean) {
    const warehouse = await warehouseRepository.findById(id);
    if (!warehouse) throw ApiError.notFound('Warehouse not found');
    if (!isActive) {
      const rows = await warehouseRepository.countInventoryRows(id);
      if (rows > 0) {
        throw ApiError.badRequest('This warehouse still has inventory assigned to it — reassign that stock before deactivating');
      }
    }
    return warehouseRepository.update(id, { isActive });
  }

  async getById(id: bigint) {
    const warehouse = await warehouseRepository.findById(id);
    if (!warehouse) throw ApiError.notFound('Warehouse not found');
    const stock = await warehouseRepository.stockSummary(id);
    return { ...warehouse, stock };
  }

  async list(filters: { isActive?: boolean; page?: number; limit?: number }) {
    const { page, limit, skip, take } = normalizePagination(filters.page, filters.limit);
    const { items, total } = await warehouseRepository.list({ isActive: filters.isActive, skip, take });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }
}

export const warehouseService = new WarehouseService();
