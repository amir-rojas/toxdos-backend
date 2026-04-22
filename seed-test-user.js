require('dotenv/config')
const { Pool } = require('pg')
const bcrypt = require('bcrypt')

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})

async function seed() {
  const passwordHash = await bcrypt.hash('admin123', 10)

  const result = await pool.query(
    `INSERT INTO users (full_name, email, password_hash, role, is_active)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT DO NOTHING
     RETURNING user_id, full_name, email, role`,
    ['Admin Test', 'admin@pawnshop.com', passwordHash, 'admin', true]
  )

  if (result.rows[0]) {
    console.log('Usuario creado:', result.rows[0])
  } else {
    console.log('El usuario ya existía: admin@pawnshop.com')
  }

  await pool.end()
}

seed().catch(e => { console.error(e.message); pool.end() })
