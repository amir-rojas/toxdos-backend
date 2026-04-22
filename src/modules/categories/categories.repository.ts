import { pool } from '../../config/db'
import { ConflictError } from '../../shared/errors'
import type { Category } from './categories.types'

interface PgError extends Error { code?: string }

export async function findAll(): Promise<Category[]> {
  const result = await pool.query<Category>(
    `SELECT * FROM categories ORDER BY name ASC`
  )
  return result.rows
}

export async function create(name: string): Promise<Category> {
  try {
    const result = await pool.query<Category>(
      `INSERT INTO categories (name) VALUES ($1) RETURNING *`,
      [name]
    )
    return result.rows[0]
  } catch (err) {
    if ((err as PgError).code === '23505') {
      throw new ConflictError('A category with this name already exists', 'CATEGORY_DUPLICATE_NAME')
    }
    throw err
  }
}
