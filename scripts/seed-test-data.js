const { Pool } = require('pg')
const bcrypt = require('bcrypt')

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgre',
  database: 'pawn-db',
})

async function seed() {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // ── 1. Cajero de prueba ───────────────────────────────────────────────────
    const passwordHash = await bcrypt.hash('cajero123', 10)
    const existing = await client.query(`SELECT user_id, full_name FROM users WHERE email = 'maria@pawnshop.com'`)
    let cashier
    if (existing.rows.length > 0) {
      cashier = existing.rows[0]
      console.log(`✓ Cajera ya existe: ${cashier.full_name} (id=${cashier.user_id})`)
    } else {
      const userResult = await client.query(`
        INSERT INTO users (full_name, email, password_hash, role, is_active)
        VALUES ('María González', 'maria@pawnshop.com', $1, 'cashier', true)
        RETURNING user_id, full_name
      `, [passwordHash])
      cashier = userResult.rows[0]
      console.log(`✓ Cajera creada: ${cashier.full_name} (id=${cashier.user_id})`)
    }
    console.log(`✓ Cajera creada: ${cashier.full_name} (id=${cashier.user_id})`)

    // ── 2. Obtener admin existente ────────────────────────────────────────────
    const adminResult = await client.query(`SELECT user_id, full_name FROM users WHERE role = 'admin' LIMIT 1`)
    const admin = adminResult.rows[0]
    console.log(`✓ Admin encontrado: ${admin.full_name} (id=${admin.user_id})`)

    // ── 3. Sesión del cajero (cerrada, de ayer) ───────────────────────────────
    const sessionCashierResult = await client.query(`
      INSERT INTO cash_sessions (user_id, opening_amount, closing_amount, expected_amount, status, opened_at, closed_at)
      VALUES ($1, 500.00, 1250.00, 1250.00, 'closed', NOW() - INTERVAL '1 day', NOW() - INTERVAL '20 hours')
      RETURNING session_id
    `, [cashier.user_id])
    const sessionCashier = sessionCashierResult.rows[0]
    console.log(`✓ Sesión cajera creada (id=${sessionCashier.session_id})`)

    // ── 4. Sesión del admin (cerrada, de hoy) ─────────────────────────────────
    const sessionAdminResult = await client.query(`
      INSERT INTO cash_sessions (user_id, opening_amount, closing_amount, expected_amount, status, opened_at, closed_at)
      VALUES ($1, 800.00, 2100.00, 2100.00, 'closed', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '1 hour')
      RETURNING session_id
    `, [admin.user_id])
    const sessionAdmin = sessionAdminResult.rows[0]
    console.log(`✓ Sesión admin creada (id=${sessionAdmin.session_id})`)

    // ── 5. Movimientos del cajero ─────────────────────────────────────────────
    const movCashier = [
      ['in',  'cash_deposit',      500.00, null, null],
      ['in',  'interest_payment',  150.00, 'payment', 1],
      ['in',  'interest_payment',   80.00, 'payment', 2],
      ['in',  'redemption',        320.00, 'payment', 3],
      ['out', 'operating_expense',  45.00, 'expense', 1],
      ['out', 'loan',              200.00, 'pawn',    1],
      ['in',  'sale',              155.00, 'sale',    1],
    ]
    for (const [type, category, amount, refType, refId] of movCashier) {
      await client.query(`
        INSERT INTO movements (session_id, user_id, movement_type, category, amount, reference_type, reference_id, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - INTERVAL '22 hours' + (random() * INTERVAL '2 hours'))
      `, [sessionCashier.session_id, cashier.user_id, type, category, amount, refType, refId])
    }
    console.log(`✓ ${movCashier.length} movimientos de cajera insertados`)

    // ── 6. Movimientos del admin ──────────────────────────────────────────────
    const movAdmin = [
      ['in',  'cash_deposit',      800.00, null, null],
      ['in',  'interest_payment',  200.00, 'payment', 4],
      ['in',  'custody_payment',    60.00, 'payment', 5],
      ['out', 'operating_expense',  90.00, 'expense', 2],
      ['out', 'operating_expense',  35.00, 'expense', 3],
      ['in',  'sale',              450.00, 'sale',    2],
      ['out', 'loan',              350.00, 'pawn',    2],
      ['in',  'redemption',        420.00, 'payment', 6],
    ]
    for (const [type, category, amount, refType, refId] of movAdmin) {
      await client.query(`
        INSERT INTO movements (session_id, user_id, movement_type, category, amount, reference_type, reference_id, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - INTERVAL '2 hours' + (random() * INTERVAL '1 hour'))
      `, [sessionAdmin.session_id, admin.user_id, type, category, amount, refType, refId])
    }
    console.log(`✓ ${movAdmin.length} movimientos de admin insertados`)

    // ── 7. Gastos de prueba ───────────────────────────────────────────────────
    const gastos = [
      [sessionCashier.session_id, cashier.user_id, 'Limpieza y materiales', 45.00],
      [sessionAdmin.session_id,   admin.user_id,   'Papelería y bolígrafos', 35.00],
      [sessionAdmin.session_id,   admin.user_id,   'Servicio de internet',   90.00],
    ]
    for (const [sid, uid, concept, amount] of gastos) {
      await client.query(`
        INSERT INTO expenses (session_id, user_id, concept, amount)
        VALUES ($1, $2, $3, $4)
      `, [sid, uid, concept, amount])
    }
    console.log(`✓ ${gastos.length} gastos de prueba insertados`)

    await client.query('COMMIT')
    console.log('\n✅ Seed completado exitosamente.')
    console.log('\nCredenciales cajera de prueba:')
    console.log('  Email:    maria@pawnshop.com')
    console.log('  Password: cajero123')

  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌ Error:', err.message)
    throw err
  } finally {
    client.release()
    await pool.end()
  }
}

seed()
