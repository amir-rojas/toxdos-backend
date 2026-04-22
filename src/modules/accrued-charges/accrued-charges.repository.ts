import { pool } from '../../config/db'
import type { PaginationParams } from '../../shared/pagination'
import type { AccruedCharge, AccrualResult } from './accrued-charges.types'

export async function runDailyAccrual(date: string): Promise<AccrualResult> {
  // Count active+renewed pawns first
  const countResult = await pool.query<{ count: string }>(
    `SELECT COUNT(*) AS count FROM pawns WHERE status IN ('active', 'renewed')`
  )
  const processed = parseInt(countResult.rows[0].count, 10)

  // Single INSERT...SELECT — idempotent via ON CONFLICT DO NOTHING
  // Calculates both interest_amount and custody_amount in one query
  const insertResult = await pool.query(
    `INSERT INTO accrued_charges (pawn_id, accrual_date, interest_amount, custody_amount)
     SELECT
       p.pawn_id,
       $1::date AS accrual_date,
       ROUND(
         CASE p.interest_type
           WHEN 'daily'   THEN p.loan_amount * p.interest_rate / 100
           WHEN 'monthly' THEN p.loan_amount * p.interest_rate / 100 / 30
         END,
         2
       ) AS interest_amount,
       ROUND(
         CASE p.interest_type
           WHEN 'daily'   THEN p.loan_amount * p.custody_rate / 100
           WHEN 'monthly' THEN p.loan_amount * p.custody_rate / 100 / 30
         END,
         2
       ) AS custody_amount
     FROM pawns p
     WHERE p.status IN ('active', 'renewed')
     ON CONFLICT (pawn_id, accrual_date) DO NOTHING`,
    [date]
  )

  const inserted = insertResult.rowCount ?? 0
  return {
    date,
    processed,
    inserted,
    skipped: processed - inserted,
  }
}

export async function findById(accrualId: number): Promise<AccruedCharge | null> {
  const result = await pool.query<AccruedCharge>(
    `SELECT * FROM accrued_charges WHERE accrual_id = $1`,
    [accrualId]
  )
  return result.rows[0] ?? null
}

export async function findAll(
  filters: {
    pawnId?: number
    isCollected?: boolean
  },
  pagination: PaginationParams
): Promise<{ rows: AccruedCharge[]; total: number }> {
  const conditions: string[] = []
  const values: unknown[] = []
  let idx = 1

  if (filters.pawnId !== undefined) {
    conditions.push(`pawn_id = $${idx++}`)
    values.push(filters.pawnId)
  }
  if (filters.isCollected !== undefined) {
    conditions.push(`is_collected = $${idx++}`)
    values.push(filters.isCollected)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const offset = (pagination.page - 1) * pagination.limit

  const [dataResult, countResult] = await Promise.all([
    pool.query<AccruedCharge>(
      `SELECT * FROM accrued_charges ${where} ORDER BY accrual_date DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, pagination.limit, offset]
    ),
    pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM accrued_charges ${where}`,
      values
    ),
  ])

  return {
    rows: dataResult.rows,
    total: parseInt(countResult.rows[0].count, 10),
  }
}
