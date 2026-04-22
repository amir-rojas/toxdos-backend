import { Pool } from 'pg'

export const pool = new Pool({
  host: process.env['DB_HOST'],
  port: Number(process.env['DB_PORT']),
  user: process.env['DB_USER'],
  password: process.env['DB_PASSWORD'],
  database: process.env['DB_NAME'],
})

export async function connectDB(): Promise<void> {
  const client = await pool.connect()
  client.release()
  console.log('Database connected successfully')
}
