import { pool } from '../../config/db'
import type { UserProfile, UserRecord } from './auth.types'

export async function findByEmail(email: string): Promise<UserRecord | null> {
  const result = await pool.query<UserRecord>(
    `SELECT user_id, full_name, email, password_hash, role, is_active, created_at
     FROM users
     WHERE LOWER(email) = LOWER($1)`,
    [email]
  )
  return result.rows[0] ?? null
}

export interface UserLookup extends UserProfile {
  is_active: boolean
}

export async function findAllActive(): Promise<UserLookup[]> {
  const result = await pool.query<UserLookup>(
    `SELECT user_id, full_name, email, role, is_active
     FROM users
     WHERE is_active = true
     ORDER BY full_name ASC`
  )
  return result.rows
}

export async function findById(id: number): Promise<UserLookup | null> {
  const result = await pool.query<UserLookup>(
    `SELECT user_id, full_name, email, role, is_active
     FROM users
     WHERE user_id = $1`,
    [id]
  )
  return result.rows[0] ?? null
}
