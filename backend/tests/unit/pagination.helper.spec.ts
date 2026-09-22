import { normalizePagination, buildPaginationMeta } from '@/helpers/pagination.helper';

describe('pagination.helper', () => {
  it('applies sane defaults', () => {
    const result = normalizePagination(undefined, undefined);
    expect(result).toEqual({ page: 1, limit: 20, skip: 0, take: 20 });
  });

  it('clamps the limit to the max allowed', () => {
    const result = normalizePagination(1, 1000);
    expect(result.limit).toBe(100);
  });

  it('computes correct pagination metadata', () => {
    const meta = buildPaginationMeta(2, 10, 25);
    expect(meta).toEqual({
      page: 2,
      limit: 10,
      total: 25,
      totalPages: 3,
      hasNextPage: true,
      hasPrevPage: true,
    });
  });
});
