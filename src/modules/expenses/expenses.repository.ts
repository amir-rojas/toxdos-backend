import { pool } from '../../config/db'
import type { PaginationParams } from '../../shared/pagination'
import type { Expense } from './expenses.types'

export async function create(params: {
  sessionId: number
  userId: number
  concept: string
  amount: number
}): Promise<Expense> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const expenseResult = await client.query<Expense>(
      `INSERT INTO expenses (session_id, user_id, concept, amount)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [params.sessionId, params.userId, params.concept, params.amount]
    )
    const expense = expenseResult.rows[0]

    await client.query(
      `INSERT INTO movements (session_id, user_id, movement_type, category, amount, reference_type, reference_id)
       VALUES ($1, $2, 'out', 'operating_expense', $3, 'expense', $4)`,
      [params.sessionId, params.userId, params.amount, expense.expense_id]
    )

    await client.query('COMMIT')
    return expense
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function findById(expenseId: number): Promise<Expense | null> {
  const result = await pool.query<Expense>(
    `SELECT * FROM expenses WHERE expense_id = $1`,
    [expenseId]
  )
  return result.rows[0] ?? null
}

export async function findAll(
  filters: {
    sessionId?: number
    userId?: number
    dateFrom?: string
    dateTo?: string
  },
  pagination: PaginationParams
): Promise<{ rows: Expense[]; total: number }> {
  const conditions: string[] = []
  const values: unknown[] = []
  let idx = 1

  const needsJoin = filters.userId !== undefined

  if (filters.sessionId !== undefined) {
    conditions.push(`e.session_id = $${idx++}`)
    values.push(filters.sessionId)
  }
  if (filters.userId !== undefined) {
    conditions.push(`cs.user_id = $${idx++}`)
    values.push(filters.userId)
  }
  if (filters.dateFrom !== undefined) {
    conditions.push(`e.created_at >= $${idx++}`)
    values.push(filters.dateFrom)
  }
  if (filters.dateTo !== undefined) {
    conditions.push(`e.created_at < ($${idx++}::date + interval '1 day')`)
    values.push(filters.dateTo)
  }

  const join  = needsJoin ? `JOIN cash_sessions cs ON cs.session_id = e.session_id` : ''
  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const offset = (pagination.page - 1) * pagination.limit

  const [dataResult, countResult] = await Promise.all([
    pool.query<Expense>(
      `SELECT e.* FROM expenses e ${join} ${where} ORDER BY e.created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, pagination.limit, offset]
    ),
    pool.query<{ count: string }>(
      `SELECT COUNT(*) FROM expenses e ${join} ${where}`,
      values
    ),
  ])

  return {
    rows: dataResult.rows,
    total: parseInt(countResult.rows[0].count, 10),
  }
}
