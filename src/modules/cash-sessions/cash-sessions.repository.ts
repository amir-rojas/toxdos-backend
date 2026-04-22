import { pool } from '../../config/db'
import { ConflictError } from '../../shared/errors'
import type { PaginationParams } from '../../shared/pagination'
import type { CashSession } from './cash-sessions.types'

interface PgError extends Error {
  code?: string
}

export async function create(userId: number, openingAmount: number): Promise<CashSession> {
  try {
    const result = await pool.query<CashSession>(
      `INSERT INTO cash_sessions (user_id, opening_amount)
       VALUES ($1, $2)
       RETURNING *`,
      [userId, openingAmount]
    )
    return result.rows[0]
  } catch (err) {
    if ((err as PgError).code === '23505') {
      throw new ConflictError('User already has an open cash session', 'SESSION_ALREADY_OPEN')
    }
    throw err
  }
}

export async function findById(sessionId: number): Promise<CashSession | null> {
  const result = await pool.query<CashSession>(
    `SELECT * FROM cash_sessions WHERE session_id = $1`,
    [sessionId]
  )
  return result.rows[0] ?? null
}

export async function findOpenByUserId(userId: number): Promise<CashSession | null> {
  const result = await pool.query<CashSession>(
    `SELECT * FROM cash_sessions WHERE user_id = $1 AND status = 'open'`,
    [userId]
  )
  return result.rows[0] ?? null
}

export async function findAll(
  pagination: PaginationParams
): Promise<{ rows: CashSession[]; total: number }> {
  const offset = (pagination.page - 1) * pagination.limit

  const [dataResult, countResult] = await Promise.all([
    pool.query<CashSession>(
      `SELECT cs.*, u.full_name AS cashier_name
       FROM cash_sessions cs
       JOIN users u ON u.user_id = cs.user_id
       ORDER BY cs.opened_at DESC
       LIMIT $1 OFFSET $2`,
      [pagination.limit, offset]
    ),
    pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM cash_sessions`
    ),
  ])

  return {
    rows: dataResult.rows,
    total: parseInt(countResult.rows[0].count, 10),
  }
}

export async function computeExpectedAmount(
  sessionId: number,
  openingAmount: number
): Promise<number> {
  const result = await pool.query<{ expected_amount: string }>(
    `SELECT
       $2::numeric
       + COALESCE(SUM(CASE WHEN movement_type = 'in'  THEN amount ELSE 0 END), 0)
       - COALESCE(SUM(CASE WHEN movement_type = 'out' THEN amount ELSE 0 END), 0)
       AS expected_amount
     FROM movements
     WHERE session_id = $1`,
    [sessionId, openingAmount]
  )
  return parseFloat(result.rows[0].expected_amount)
}

export async function closeSession(
  sessionId: number,
  closingAmount: number,
  expectedAmount: number
): Promise<CashSession> {
  const result = await pool.query<CashSession>(
    `UPDATE cash_sessions
     SET closing_amount  = $1,
         expected_amount = $2,
         status          = 'closed',
         closed_at       = now()
     WHERE session_id = $3
     RETURNING *`,
    [closingAmount, expectedAmount, sessionId]
  )
  return result.rows[0]
}
