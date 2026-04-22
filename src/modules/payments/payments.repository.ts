import { pool } from '../../config/db'
import type { PaginationParams } from '../../shared/pagination'
import type { Payment } from './payments.types'

export async function create(params: {
  pawnId: number
  sessionId: number
  userId: number
  interestAmount: number
  custodyAmount: number
  principalAmount: number
  paymentType: 'interest' | 'redemption' | 'partial'
  paymentMethod: 'cash' | 'transfer' | 'qr'
  movementCategory: 'interest_payment' | 'redemption'
  movementAmount: number
  isRedemption: boolean
  markAccruedCharges: boolean
}): Promise<Payment> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // 1. Insert payment
    const paymentResult = await client.query<Payment>(
      `INSERT INTO payments (pawn_id, session_id, interest_amount, custody_amount, principal_amount, payment_type, payment_method)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        params.pawnId,
        params.sessionId,
        params.interestAmount,
        params.custodyAmount,
        params.principalAmount,
        params.paymentType,
        params.paymentMethod,
      ]
    )
    const payment = paymentResult.rows[0]

    // 2. Insert primary movement (interest_payment or redemption)
    //    movementAmount = full total for redemption, interestAmount for other types
    if (params.movementAmount > 0) {
      await client.query(
        `INSERT INTO movements (session_id, user_id, movement_type, category, amount, reference_type, reference_id)
         VALUES ($1, $2, 'in', $3, $4, 'payment', $5)`,
        [params.sessionId, params.userId, params.movementCategory, params.movementAmount, payment.payment_id]
      )
    }

    // 3. Insert custody movement — only for non-redemption payments and when custody > 0
    //    Redemption uses a single combined movement (step 2 above covers the full total)
    if (!params.isRedemption && params.custodyAmount > 0) {
      await client.query(
        `INSERT INTO movements (session_id, user_id, movement_type, category, amount, reference_type, reference_id)
         VALUES ($1, $2, 'in', 'custody_payment', $3, 'payment', $4)`,
        [params.sessionId, params.userId, params.custodyAmount, payment.payment_id]
      )
    }

    // 4. On redemption: single movement for total, update pawn + all items
    if (params.isRedemption) {
      await client.query(
        `UPDATE pawns SET status = 'redeemed', updated_at = now() WHERE pawn_id = $1`,
        [params.pawnId]
      )
      await client.query(
        `UPDATE items SET status = 'redeemed', updated_at = now() WHERE pawn_id = $1`,
        [params.pawnId]
      )
    }

    // 5. Mark uncollected accrued charges as collected
    if (params.markAccruedCharges) {
      await client.query(
        `UPDATE accrued_charges
         SET is_collected = true, payment_id = $1
         WHERE pawn_id = $2 AND is_collected = false`,
        [payment.payment_id, params.pawnId]
      )
    }

    await client.query('COMMIT')
    return payment
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function findById(paymentId: number): Promise<Payment | null> {
  const result = await pool.query<Payment>(
    `SELECT * FROM payments WHERE payment_id = $1`,
    [paymentId]
  )
  return result.rows[0] ?? null
}

export async function findAll(
  filters: {
    pawnId?: number
    sessionId?: number
    userId?: number
    search?: string
    paymentType?: 'interest' | 'redemption' | 'partial'
    paymentMethod?: 'cash' | 'transfer' | 'qr'
    paidFrom?: string
    paidTo?: string
  },
  pagination: PaginationParams
): Promise<{ rows: Payment[]; total: number }> {
  const conditions: string[] = []
  const values: unknown[] = []
  let idx = 1

  const needsSessionJoin = filters.userId !== undefined

  if (filters.pawnId !== undefined) {
    conditions.push(`p.pawn_id = $${idx++}`)
    values.push(filters.pawnId)
  }
  if (filters.sessionId !== undefined) {
    conditions.push(`p.session_id = $${idx++}`)
    values.push(filters.sessionId)
  }
  if (filters.userId !== undefined) {
    conditions.push(`cs.user_id = $${idx++}`)
    values.push(filters.userId)
  }
  if (filters.search !== undefined) {
    conditions.push(`c.full_name ILIKE $${idx++}`)
    values.push(`%${filters.search}%`)
  }
  if (filters.paymentType !== undefined) {
    conditions.push(`p.payment_type = $${idx++}`)
    values.push(filters.paymentType)
  }
  if (filters.paymentMethod !== undefined) {
    conditions.push(`p.payment_method = $${idx++}`)
    values.push(filters.paymentMethod)
  }
  if (filters.paidFrom !== undefined) {
    conditions.push(`p.paid_at >= $${idx++}::date`)
    values.push(filters.paidFrom)
  }
  if (filters.paidTo !== undefined) {
    conditions.push(`p.paid_at < ($${idx++}::date + interval '1 day')`)
    values.push(filters.paidTo)
  }

  const sessionJoin = needsSessionJoin ? `JOIN cash_sessions cs ON cs.session_id = p.session_id` : ''
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const offset = (pagination.page - 1) * pagination.limit

  const [dataResult, countResult] = await Promise.all([
    pool.query<Payment>(
      `SELECT p.*,
              c.full_name AS customer_name
       FROM payments p
       LEFT JOIN pawns pw ON pw.pawn_id = p.pawn_id
       LEFT JOIN customers c  ON c.customer_id = pw.customer_id
       ${sessionJoin}
       ${where}
       ORDER BY p.paid_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, pagination.limit, offset]
    ),
    pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM payments p
       LEFT JOIN pawns pw ON pw.pawn_id = p.pawn_id
       LEFT JOIN customers c  ON c.customer_id = pw.customer_id
       ${sessionJoin}
       ${where}`,
      values
    ),
  ])

  return {
    rows: dataResult.rows,
    total: parseInt(countResult.rows[0].count, 10),
  }
}
