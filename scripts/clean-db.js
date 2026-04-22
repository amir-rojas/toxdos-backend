const { Pool } = require('pg')

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgre',
  database: 'pawn-db',
})

async function clean() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    await client.query(`
      TRUNCATE TABLE
        movements,
        expenses,
        payments,
        sales,
        accrued_charges,
        pawns,
        items,
        categories,
        customers,
        cash_sessions
      RESTART IDENTITY CASCADE
    `)

    const users = await client.query(`SELECT user_id, full_name, email, role FROM users ORDER BY user_id`)

    await client.query('COMMIT')

    console.log('✅ Base de datos limpiada. Tablas vaciadas y secuencias reiniciadas.')
    console.log('\nUsuarios conservados:')
    users.rows.forEach(u => console.log(`  [${u.user_id}] ${u.full_name} <${u.email}> (${u.role})`))
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Error:', err.message)
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

clean()
