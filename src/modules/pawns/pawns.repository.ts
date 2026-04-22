import { pool } from '../../config/db'
import type { Item } from '../items/items.types'
import type { PaginationParams } from '../../shared/pagination'
import type { CreatePawnDto, Pawn, PawnWithItems } from './pawns.types'

export async function createPawn(
  dto: CreatePawnDto,
  userId: number,
  sessionId: number
): Promise<PawnWithItems> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // 1. Insert pawn
    const pawnResult = await client.query<Pawn>(
      `INSERT INTO pawns (customer_id, user_id, loan_amount, interest_rate, custody_rate, interest_type, start_date, due_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [dto.customer_id, userId, dto.loan_amount, dto.interest_rate, dto.custody_rate ?? 0, dto.interest_type, dto.start_date, dto.due_date]
    )
    const pawn = pawnResult.rows[0]

    // 2. Insert items
    const items: Item[] = []
    for (const itemDto of dto.items) {
      const itemResult = await client.query<Item>(
        `INSERT INTO items (pawn_id, category_id, description, brand, model, serial_number, appraised_value, photo_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          pawn.pawn_id,
          itemDto.category_id ?? null,
          itemDto.description,
          itemDto.brand ?? null,
          itemDto.model ?? null,
          itemDto.serial_number ?? null,
          itemDto.appraised_value,
          itemDto.photo_url ?? null,
        ]
      )
      items.push(itemResult.rows[0])
    }

    // 3. Insert movement (loan: cash out)
    await client.query(
      `INSERT INTO movements (session_id, user_id, movement_type, category, amount, reference_type, reference_id)
       VALUES ($1, $2, 'out', 'loan', $3, 'pawn', $4)`,
      [sessionId, userId, dto.loan_amount, pawn.pawn_id]
    )

    await client.query('COMMIT')
    return { ...pawn, items }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function findAll(
  filters: {
    userId?: number
    status?: string
    customerId?: number
    search?: string
    overdue?: boolean
    dueDateFrom?: string
    dueDateTo?: string
  },
  pagination: PaginationParams
): Promise<{ rows: Pawn[]; total: number }> {
  const conditions: string[] = []
  const values: unknown[] = []
  let idx = 1

  if (filters.userId !== undefined) {
    conditions.push(`p.user_id = $${idx++}`)
    values.push(filters.userId)
  }
  if (filters.overdue) {
    conditions.push(`p.due_date < CURRENT_DATE AND p.status IN ('active', 'renewed')`)
  } else if (filters.status !== undefined) {
    conditions.push(`p.status = $${idx++}`)
    values.push(filters.status)
  }
  if (filters.customerId !== undefined) {
    conditions.push(`p.customer_id = $${idx++}`)
    values.push(filters.customerId)
  }
  if (filters.search !== undefined) {
    const p = `$${idx++}`
    conditions.push(`(
      c.full_name ILIKE ${p}
      OR EXISTS (
        SELECT 1 FROM items i
        WHERE i.pawn_id = p.pawn_id
          AND (i.description ILIKE ${p} OR i.brand ILIKE ${p} OR i.model ILIKE ${p} OR i.serial_number ILIKE ${p})
      )
    )`)
    values.push(`%${filters.search}%`)
  }
  if (filters.dueDateFrom !== undefined) {
    conditions.push(`p.due_date >= $${idx++}`)
    values.push(filters.dueDateFrom)
  }
  if (filters.dueDateTo !== undefined) {
    conditions.push(`p.due_date <= $${idx++}`)
    values.push(filters.dueDateTo)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const offset = (pagination.page - 1) * pagination.limit

  const [dataResult, countResult] = await Promise.all([
    pool.query<Pawn>(
      `SELECT p.*,
              c.full_name  AS customer_name,
              c.id_number  AS customer_id_number,
              (SELECT description FROM items WHERE pawn_id = p.pawn_id ORDER BY item_id ASC LIMIT 1) AS first_item_description,
              (SELECT COUNT(*) FROM items WHERE pawn_id = p.pawn_id)::int AS items_count
       FROM pawns p
       LEFT JOIN customers c ON c.customer_id = p.customer_id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, pagination.limit, offset]
    ),
    pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM pawns p LEFT JOIN customers c ON c.customer_id = p.customer_id ${where}`,
      values
    ),
  ])

  return {
    rows: dataResult.rows,
    total: parseInt(countResult.rows[0].count, 10),
  }
}

export async function findById(pawnId: number): Promise<Pawn | null> {
  const result = await pool.query<Pawn>(
    `SELECT * FROM pawns WHERE pawn_id = $1`,
    [pawnId]
  )
  return result.rows[0] ?? null
}

export async function findDebt(pawnId: number): Promise<{
  interest_amount: number
  custody_amount: number
  loan_amount: number
} | null> {
  // Lazy evaluation: generate any missing accrued_charges rows for this pawn
  // Starts from MAX(accrual_date) + 1 (not start_date) — skips already-existing rows entirely
  // ON CONFLICT DO NOTHING makes this idempotent; safe to call on every /debt request
  await pool.query(
    `INSERT INTO accrued_charges (pawn_id, accrual_date, interest_amount, custody_amount)
     SELECT
       p.pawn_id,
       d::date,
       ROUND(
         CASE p.interest_type
           WHEN 'daily'   THEN p.loan_amount * p.interest_rate / 100
           WHEN 'monthly' THEN p.loan_amount * p.interest_rate / 100 / 30
         END, 2
       ),
       ROUND(
         CASE p.interest_type
           WHEN 'daily'   THEN p.loan_amount * p.custody_rate / 100
           WHEN 'monthly' THEN p.loan_amount * p.custody_rate / 100 / 30
         END, 2
       )
     FROM pawns p
     CROSS JOIN generate_series(
       COALESCE(
         (SELECT (MAX(accrual_date) + 1)::date FROM accrued_charges WHERE pawn_id = $1),
         p.start_date
       ),
       current_date,
       '1 day'::interval
     ) AS d
     WHERE p.pawn_id = $1 AND p.status IN ('active', 'renewed')
     ON CONFLICT (pawn_id, accrual_date) DO NOTHING`,
    [pawnId]
  )

  // Now sum all uncollected charges (includes today)
  const result = await pool.query<{
    loan_amount: string
    interest_amount: string
    custody_amount: string
  }>(
    `SELECT
       p.loan_amount,
       COALESCE(SUM(ac.interest_amount), 0) AS interest_amount,
       COALESCE(SUM(ac.custody_amount),  0) AS custody_amount
     FROM pawns p
     LEFT JOIN accrued_charges ac
       ON ac.pawn_id = p.pawn_id AND ac.is_collected = false
     WHERE p.pawn_id = $1
     GROUP BY p.pawn_id, p.loan_amount`,
    [pawnId]
  )
  if (!result.rows[0]) return null
  const row = result.rows[0]
  return {
    interest_amount: parseFloat(row.interest_amount),
    custody_amount:  parseFloat(row.custody_amount),
    loan_amount:     parseFloat(row.loan_amount),
  }
}

export async function findWithItems(pawnId: number): Promise<PawnWithItems | null> {
  const pawnResult = await pool.query<Pawn>(
    `SELECT p.*,
            c.full_name  AS customer_name,
            c.id_number  AS customer_id_number
     FROM pawns p
     JOIN customers c ON c.customer_id = p.customer_id
     WHERE p.pawn_id = $1`,
    [pawnId]
  )
  const pawn = pawnResult.rows[0]
  if (!pawn) return null

  const itemsResult = await pool.query<Item>(
    `SELECT * FROM items WHERE pawn_id = $1 ORDER BY item_id ASC`,
    [pawnId]
  )
  return { ...pawn, items: itemsResult.rows }
}

export async function forfeit(pawnId: number): Promise<PawnWithItems> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const pawnResult = await client.query<Pawn>(
      `UPDATE pawns SET status = 'forfeited', updated_at = NOW()
       WHERE pawn_id = $1
       RETURNING *`,
      [pawnId]
    )
    const pawn = pawnResult.rows[0]

    const itemsResult = await client.query<Item>(
      `UPDATE items SET status = 'available_for_sale', updated_at = NOW()
       WHERE pawn_id = $1 AND status = 'pawned'
       RETURNING *`,
      [pawnId]
    )

    await client.query('COMMIT')
    return { ...pawn, items: itemsResult.rows }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
