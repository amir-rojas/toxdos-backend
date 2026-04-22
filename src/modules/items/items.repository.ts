import { pool } from '../../config/db'
import type { PaginationParams } from '../../shared/pagination'
import type { Item } from './items.types'

export async function findById(itemId: number): Promise<Item | null> {
  const result = await pool.query<Item>(
    `SELECT * FROM items WHERE item_id = $1`,
    [itemId]
  )
  return result.rows[0] ?? null
}

export async function findAll(
  filters: { status?: string; pawnId?: number } | undefined,
  pagination: PaginationParams
): Promise<{ rows: Item[]; total: number }> {
  const conditions: string[] = []
  const values: unknown[] = []
  let idx = 1

  if (filters?.status) {
    conditions.push(`status = $${idx++}`)
    values.push(filters.status)
  }
  if (filters?.pawnId) {
    conditions.push(`pawn_id = $${idx++}`)
    values.push(filters.pawnId)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const offset = (pagination.page - 1) * pagination.limit

  const [dataResult, countResult] = await Promise.all([
    pool.query<Item>(
      `SELECT * FROM items ${where} ORDER BY item_id ASC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, pagination.limit, offset]
    ),
    pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM items ${where}`,
      values
    ),
  ])

  return {
    rows: dataResult.rows,
    total: parseInt(countResult.rows[0].count, 10),
  }
}
