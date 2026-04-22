import { pool } from '../../config/db'
import type { PaginationParams } from '../../shared/pagination'
import type { Movement } from './movements.types'

export async function findById(movementId: number): Promise<Movement | null> {
  const result = await pool.query<Movement>(
    `SELECT * FROM movements WHERE movement_id = $1`,
    [movementId]
  )
  return result.rows[0] ?? null
}

export async function findAll(
  filters: {
    sessionId?: number
    movementType?: string
    category?: string
    userId?: number
    dateFrom?: string
    dateTo?: string
  },
  pagination: PaginationParams
): Promise<{ rows: Movement[]; total: number }> {
  const conditions: string[] = []
  const values: unknown[] = []
  let idx = 1

  const needsJoin = filters.userId !== undefined

  if (filters.sessionId !== undefined) {
    conditions.push(`m.session_id = $${idx++}`)
    values.push(filters.sessionId)
  }
  if (filters.movementType !== undefined) {
    conditions.push(`m.movement_type = $${idx++}`)
    values.push(filters.movementType)
  }
  if (filters.category !== undefined) {
    conditions.push(`m.category = $${idx++}`)
    values.push(filters.category)
  }
  if (filters.userId !== undefined) {
    conditions.push(`cs.user_id = $${idx++}`)
    values.push(filters.userId)
  }
  if (filters.dateFrom !== undefined) {
    conditions.push(`m.created_at >= $${idx++}`)
    values.push(filters.dateFrom)
  }
  if (filters.dateTo !== undefined) {
    conditions.push(`m.created_at < ($${idx++}::date + interval '1 day')`)
    values.push(filters.dateTo)
  }

  const join  = needsJoin ? `JOIN cash_sessions cs ON cs.session_id = m.session_id` : ''
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const offset = (pagination.page - 1) * pagination.limit

  const [dataResult, countResult] = await Promise.all([
    pool.query<Movement>(
      `SELECT m.* FROM movements m ${join} ${where} ORDER BY m.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, pagination.limit, offset]
    ),
    pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM movements m ${join} ${where}`,
      values
    ),
  ])

  return {
    rows: dataResult.rows,
    total: parseInt(countResult.rows[0].count, 10),
  }
}
