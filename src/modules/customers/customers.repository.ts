import { pool } from '../../config/db'
import { BadRequestError, ConflictError } from '../../shared/errors'
import type { PaginationParams } from '../../shared/pagination'
import type { CreateCustomerDto, Customer, UpdateCustomerDto } from './customers.types'

interface PgError extends Error {
  code?: string
}

function handlePgError(err: unknown): never {
  if ((err as PgError).code === '23505') {
    throw new ConflictError('A customer with this ID number already exists', 'CUSTOMER_DUPLICATE_ID')
  }
  throw err
}

export async function create(dto: CreateCustomerDto): Promise<Customer> {
  try {
    const result = await pool.query<Customer>(
      `INSERT INTO customers (full_name, id_number, phone, address)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [dto.full_name, dto.id_number, dto.phone ?? null, dto.address ?? null]
    )
    return result.rows[0]
  } catch (err) {
    handlePgError(err)
  }
}

export async function findById(customerId: number): Promise<Customer | null> {
  const result = await pool.query<Customer>(
    `SELECT * FROM customers WHERE customer_id = $1`,
    [customerId]
  )
  return result.rows[0] ?? null
}

export async function findAll(
  filters: { search?: string } | undefined,
  pagination?: PaginationParams
): Promise<Customer[] | { rows: Customer[]; total: number }> {
  // Search path: used by combobox — keeps hardcoded LIMIT 10, no pagination
  if (filters?.search) {
    const result = await pool.query<Customer>(
      `SELECT * FROM customers
       WHERE id_number ILIKE $1 OR full_name ILIKE $1
       ORDER BY full_name ASC
       LIMIT 10`,
      [`%${filters.search}%`]
    )
    return result.rows
  }

  // Full list path: paginated
  if (pagination) {
    const offset = (pagination.page - 1) * pagination.limit
    const [dataResult, countResult] = await Promise.all([
      pool.query<Customer>(
        `SELECT * FROM customers ORDER BY full_name ASC LIMIT $1 OFFSET $2`,
        [pagination.limit, offset]
      ),
      pool.query<{ count: string }>(`SELECT COUNT(*) FROM customers`),
    ])
    return {
      rows: dataResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
    }
  }

  // Fallback: no pagination provided (legacy, returns all)
  const result = await pool.query<Customer>(
    `SELECT * FROM customers ORDER BY full_name ASC`
  )
  return result.rows
}

export async function update(customerId: number, dto: UpdateCustomerDto): Promise<Customer> {
  const updates: string[] = []
  const values: unknown[] = []
  let idx = 1

  if (dto.full_name !== undefined) { updates.push(`full_name = $${idx++}`); values.push(dto.full_name) }
  if (dto.id_number !== undefined) { updates.push(`id_number = $${idx++}`); values.push(dto.id_number) }
  if (dto.phone     !== undefined) { updates.push(`phone = $${idx++}`);     values.push(dto.phone) }
  if (dto.address   !== undefined) { updates.push(`address = $${idx++}`);   values.push(dto.address) }

  if (updates.length === 0) {
    throw new BadRequestError('At least one field is required to update', 'VALIDATION_ERROR')
  }

  values.push(customerId)

  try {
    const result = await pool.query<Customer>(
      `UPDATE customers SET ${updates.join(', ')} WHERE customer_id = $${idx} RETURNING *`,
      values
    )
    return result.rows[0]
  } catch (err) {
    handlePgError(err)
  }
}
