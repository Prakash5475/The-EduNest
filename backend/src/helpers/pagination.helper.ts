import { PAGINATION_DEFAULTS } from '@/constants';
import type { PaginationMeta } from '@/types';

export interface NormalizedPagination {
  page: number;
  limit: number;
  skip: number;
  take: number;
}

export function normalizePagination(page?: number | string, limit?: number | string): NormalizedPagination {
  const parsedPage = Math.max(1, Number(page) || PAGINATION_DEFAULTS.PAGE);
  const parsedLimit = Math.min(
    PAGINATION_DEFAULTS.MAX_LIMIT,
    Math.max(1, Number(limit) || PAGINATION_DEFAULTS.LIMIT),
  );
  return {
    page: parsedPage,
    limit: parsedLimit,
    skip: (parsedPage - 1) * parsedLimit,
    take: parsedLimit,
  };
}

export function buildPaginationMeta(page: number, limit: number, total: number): PaginationMeta {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}
