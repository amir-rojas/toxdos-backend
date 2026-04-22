export interface PaginationParams {
  page: number   // 1-based
  limit: number
}

export interface PaginatedResult<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    total_pages: number
  }
}

/** Extrae y valida page/limit de los query params. Defaults: page=1, limit=20, max limit=100 */
export function parsePagination(query: Record<string, unknown>): PaginationParams {
  const page  = Math.max(1, parseInt(String(query['page']  ?? '1'))  || 1)
  const limit = Math.min(100, Math.max(1, parseInt(String(query['limit'] ?? '20')) || 20))
  return { page, limit }
}

export function buildPaginatedResult<T>(
  rows: T[],
  total: number,
  params: PaginationParams
): PaginatedResult<T> {
  return {
    data: rows,
    meta: {
      total,
      page:        params.page,
      limit:       params.limit,
      total_pages: Math.ceil(total / params.limit),
    },
  }
}
