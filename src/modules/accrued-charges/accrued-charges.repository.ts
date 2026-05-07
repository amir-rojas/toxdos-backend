import { pool } from '../../config/db'
import type { PoolClient } from 'pg'
import type { PaginationParams } from '../../shared/pagination'
import type { AccruedCharge } from './accrued-charges.types'

export async function insertCollectedBlocks(
  client: PoolClient,
  pawnId: number,
  paymentId: number,
  monthsPaid: number,
  interestPerBlock: number,
  custodyPerBlock: number,
  dueDate: string
): Promise<void> {
  await client.query(
    `INSERT INTO accrued_charges (pawn_id, accrual_date, interest_amount, custody_amount, is_collected, payment_id)
     SELECT
       $1,
       ($6::date + ((gs.n - 1) * INTERVAL '1 month'))::date,
       $4,
       $5,
       TRUE,
       $2
     FROM generate_series(1, $3::int) AS gs(n)`,
    [pawnId, paymentId, monthsPaid, interestPerBlock, custodyPerBlock, dueDate]
  )
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
