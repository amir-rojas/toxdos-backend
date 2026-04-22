import { Pool } from 'pg'

// In production (Render + Supabase), DATABASE_URL is set and requires SSL.
// In local dev, individual vars are used and SSL is not needed.
const connectionConfig = process.env['DATABASE_URL']
  ? {
      connectionString: process.env['DATABASE_URL'],
      ssl: { rejectUnauthorized: false },
    }
  : {
      host: process.env['DB_HOST'],
      port: Number(process.env['DB_PORT']),
      user: process.env['DB_USER'],
      password: process.env['DB_PASSWORD'],
      database: process.env['DB_NAME'],
    }

export const pool = new Pool(connectionConfig)

export async function connectDB(): Promise<void> {
  const client = await pool.connect()
  client.release()
  console.log('Database connected successfully')
}
