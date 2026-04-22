// Quick DB verification — checks connection and lists all tables
// Usage: node scripts/verify-db.js
require('dotenv').config()
const { Pool } = require('pg')

const EXPECTED_TABLES = [
  'users', 'customers', 'categories', 'cash_sessions',
  'pawns', 'items', 'payments', 'accrued_charges',
  'sales', 'expenses', 'movements'
]

const pool = new Pool(
  process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
      }
)

async function verify() {
  const client = await pool.connect()
  try {
    console.log('✅ Connection OK\n')

    const { rows } = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `)

    const found = rows.map(r => r.table_name)
    console.log('Tables in public schema:')
    EXPECTED_TABLES.forEach(t => {
      const ok = found.includes(t)
      console.log(`  ${ok ? '✅' : '❌'} ${t}`)
    })

    const extra = found.filter(t => !EXPECTED_TABLES.includes(t))
    if (extra.length) console.log(`\n  Extra tables: ${extra.join(', ')}`)

    const missing = EXPECTED_TABLES.filter(t => !found.includes(t))
    if (missing.length) {
      console.log(`\n❌ Missing tables: ${missing.join(', ')}`)
      process.exit(1)
    }

    console.log(`\n✅ All ${EXPECTED_TABLES.length} tables present — schema OK`)
  } finally {
    client.release()
    await pool.end()
  }
}

verify().catch(err => {
  console.error('❌ Error:', err.message)
  process.exit(1)
})
