import { pool } from '../../config/db'
import type { PaginationParams } from '../../shared/pagination'
import type { Sale, SaleEnriched } from './sales.types'

export async function create(params: {
  itemId: number
  sessionId: number
  userId: number
  buyerCustomerId: number | null
  salePrice: number
  paymentMethod: 'cash' | 'transfer' | 'qr'
}): Promise<Sale> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const saleResult = await client.query<Sale>(
      `INSERT INTO sales (item_id, session_id, buyer_customer_id, sale_price, payment_method)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [params.itemId, params.sessionId, params.buyerCustomerId, params.salePrice, params.paymentMethod]
    )
    const sale = saleResult.rows[0]

    // Update item status to 'sold'
    await client.query(
      `UPDATE items SET status = 'sold', updated_at = now() WHERE item_id = $1`,
      [params.itemId]
    )

    // Insert movement (cash in)
    await client.query(
      `INSERT INTO movements (session_id, user_id, movement_type, category, amount, reference_type, reference_id)
       VALUES ($1, $2, 'in', 'sale', $3, 'sale', $4)`,
      [params.sessionId, params.userId, params.salePrice, sale.sale_id]
    )

    await client.query('COMMIT')
    return sale
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function findById(saleId: number): Promise<SaleEnriched | null> {
  const result = await pool.query<SaleEnriched>(
    `SELECT s.*,
            i.description AS item_description,
            i.model       AS item_model,
            c.full_name   AS buyer_name
     FROM sales s
     JOIN items i ON i.item_id = s.item_id
     LEFT JOIN customers c ON c.customer_id = s.buyer_customer_id
     WHERE s.sale_id = $1`,
    [saleId]
  )
  return result.rows[0] ?? null
}

export async function findAll(
  filters: {
    sessionId?: number
    userId?: number
  },
  pagination: PaginationParams
): Promise<{ rows: SaleEnriched[]; total: number }> {
  const conditions: string[] = []
  const values: unknown[] = []
  let idx = 1

  const needsSessionJoin = filters.userId !== undefined

  if (filters.sessionId !== undefined) {
    conditions.push(`s.session_id = $${idx++}`)
    values.push(filters.sessionId)
  }
  if (filters.userId !== undefined) {
    conditions.push(`cs.user_id = $${idx++}`)
    values.push(filters.userId)
  }

  const sessionJoin = needsSessionJoin
    ? `JOIN cash_sessions cs ON cs.session_id = s.session_id`
    : ''
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const offset = (pagination.page - 1) * pagination.limit

  const [dataResult, countResult] = await Promise.all([
    pool.query<SaleEnriched>(
      `SELECT s.*,
              i.description AS item_description,
              i.model       AS item_model,
              c.full_name   AS buyer_name
       FROM sales s
       JOIN items i ON i.item_id = s.item_id
       LEFT JOIN customers c ON c.customer_id = s.buyer_customer_id
       ${sessionJoin}
       ${where}
       ORDER BY s.sold_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, pagination.limit, offset]
    ),
    pool.query<{ count: string }>(
      `SELECT COUNT(*)
       FROM sales s
       JOIN items i ON i.item_id = s.item_id
       LEFT JOIN customers c ON c.customer_id = s.buyer_customer_id
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
