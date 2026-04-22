'use strict'
const { Pool } = require('pg')
const { faker } = require('@faker-js/faker')

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'postgre',
  database: 'pawn-db',
})

// ── Config ─────────────────────────────────────────────────────────────────────
const ADMIN_ID   = 1
const CASHIER_ID = 4
const NUM_CUSTOMERS = 500
const NUM_SESSIONS  = 180   // ~6 months of history
const NUM_PAWNS     = 3000
const BATCH         = 100

// ── Helpers ────────────────────────────────────────────────────────────────────
const rInt   = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const rFloat = (min, max, dp = 2) => parseFloat((Math.random() * (max - min) + min).toFixed(dp))
const pick   = arr => arr[rInt(0, arr.length - 1)]
const addDays = (date, n) => { const d = new Date(date); d.setDate(d.getDate() + n); return d }
const toDate  = d => d.toISOString().split('T')[0]
const chunks  = (arr, n) => { const r = []; for (let i = 0; i < arr.length; i += n) r.push(arr.slice(i, i + n)); return r }

// Build multi-row VALUES clause + flat params array
function bv(rows) {
  const params = []
  const ph = rows.map(row => {
    const start = params.length
    row.forEach(v => params.push(v))
    return `(${row.map((_, i) => `$${start + i + 1}`).join(', ')})`
  }).join(', ')
  return { ph, params }
}

// ── Reference data ─────────────────────────────────────────────────────────────
const CATEGORY_NAMES = [
  'Joyería y Relojes', 'Electrónica', 'Herramientas',
  'Instrumentos Musicales', 'Artículos Deportivos', 'Consolas y Videojuegos',
  'Cámaras y Óptica', 'Electrodomésticos', 'Antigüedades',
  'Ropa y Accesorios', 'Vehículos y Accesorios', 'Libros y Coleccionables',
]

const ITEMS_BY_CAT = {
  'Joyería y Relojes':        [['Anillo de oro 18k','Sin marca'],['Reloj de pulsera','Casio'],['Collar de plata','Sin marca'],['Reloj de pulsera','Seiko'],['Pulsera de oro','Pandora'],['Cadena de oro 14k','Sin marca'],['Reloj cronógrafo','Tissot']],
  'Electrónica':               [['Smartphone','Samsung'],['Smartphone','Apple'],['Laptop','Dell'],['Laptop','HP'],['Tablet','Samsung'],['Auriculares bluetooth','Sony'],['Parlante bluetooth','JBL'],['Smartwatch','Apple'],['Monitor LCD','LG']],
  'Herramientas':              [['Taladro eléctrico','Bosch'],['Amoladora angular','DeWalt'],['Set de herramientas','Stanley'],['Sierra circular','Bosch'],['Lijadora orbital','Black&Decker']],
  'Instrumentos Musicales':   [['Guitarra eléctrica','Fender'],['Guitarra acústica','Yamaha'],['Bajo eléctrico','Ibanez'],['Teclado musical','Roland'],['Batería electrónica','Roland']],
  'Artículos Deportivos':     [['Bicicleta de ruta','Trek'],['Bicicleta de montaña','Giant'],['Pesas y mancuernas','Sin marca'],['Patines en línea','Rollerblade'],['Raqueta de tenis','Wilson']],
  'Consolas y Videojuegos':   [['Consola PlayStation 5','Sony'],['Consola Xbox Series X','Microsoft'],['Nintendo Switch','Nintendo'],['PlayStation 4','Sony'],['Juegos variados','Sin marca']],
  'Cámaras y Óptica':         [['Cámara DSLR','Canon'],['Cámara mirrorless','Sony'],['Lente fotográfico','Sigma'],['Drone','DJI'],['Cámara de acción','GoPro']],
  'Electrodomésticos':        [['Microondas','LG'],['Cafetera','Nespresso'],['Licuadora','Oster'],['Aspiradora','Philips'],['Plancha a vapor','Rowenta']],
  'Antigüedades':             [['Figura de colección','Sin marca'],['Monedas antiguas','Sin marca'],['Cuadro decorativo','Sin marca'],['Reloj de pared antiguo','Sin marca']],
  'Ropa y Accesorios':        [['Campera de cuero','Sin marca'],['Cartera de cuero','Louis Vuitton'],['Gafas de sol','Ray-Ban'],['Cinturón de cuero','Gucci']],
  'Vehículos y Accesorios':   [['Casco de moto','Shoei'],['Autorradio','Pioneer'],['GPS vehicular','Garmin']],
  'Libros y Coleccionables':  [['Colección de libros','Sin marca'],['Revista coleccionable','Sin marca'],['Figura de anime','Sin marca']],
}

const EXPENSE_CONCEPTS = [
  'Limpieza y materiales', 'Papelería y útiles', 'Servicio de internet',
  'Electricidad', 'Alquiler del local', 'Servicio de seguridad',
  'Mantenimiento general', 'Publicidad', 'Suministros de caja',
  'Cafetería y consumibles', 'Reparaciones menores', 'Transporte y movilidad',
]

const PAY_METHODS    = ['cash', 'cash', 'cash', 'transfer', 'qr']
const INT_TYPES      = ['monthly', 'monthly', 'monthly', 'daily']
const STATUS_DIST    = [
  ...Array(40).fill('active'),
  ...Array(20).fill('renewed'),
  ...Array(25).fill('redeemed'),
  ...Array(15).fill('forfeited'),
]

// ── Seed ───────────────────────────────────────────────────────────────────────
async function seed() {
  const client = await pool.connect()
  const allMovements = []
  const today = new Date()

  try {
    // ── 1. Categories ──────────────────────────────────────────────────────────
    process.stdout.write('1/8 Categorías... ')
    const { ph: catPh, params: catP } = bv(CATEGORY_NAMES.map(n => [n]))
    const catRes = await client.query(
      `INSERT INTO categories (name) VALUES ${catPh} RETURNING category_id, name`, catP
    )
    const catByName = Object.fromEntries(catRes.rows.map(r => [r.name, r.category_id]))
    const catIds = catRes.rows.map(r => r.category_id)
    console.log(`✓ ${catRes.rowCount}`)

    // ── 2. Customers ───────────────────────────────────────────────────────────
    process.stdout.write('2/8 Clientes... ')
    const customerRows = Array.from({ length: NUM_CUSTOMERS }, () => [
      `${faker.person.firstName()} ${faker.person.lastName()}`,
      String(rInt(10000000, 99999999)),
      `+549 11 ${rInt(1000, 9999)}-${rInt(1000, 9999)}`,
      `${faker.location.streetAddress()}, Buenos Aires`,
    ])
    const customerIds = []
    for (const batch of chunks(customerRows, BATCH)) {
      const { ph, params } = bv(batch)
      const r = await client.query(
        `INSERT INTO customers (full_name, id_number, phone, address) VALUES ${ph} RETURNING customer_id`, params
      )
      customerIds.push(...r.rows.map(x => x.customer_id))
    }
    console.log(`✓ ${customerIds.length}`)

    // ── 3. Sessions ────────────────────────────────────────────────────────────
    process.stdout.write('3/8 Sesiones... ')
    const sessionRows = []
    for (let i = NUM_SESSIONS - 1; i >= 0; i--) {
      const d = addDays(today, -i)
      const uid = i % 2 === 0 ? ADMIN_ID : CASHIER_ID
      const openAt = new Date(d); openAt.setHours(rInt(8, 9), rInt(0, 30), 0, 0)
      const closeAt = new Date(d); closeAt.setHours(rInt(17, 19), rInt(30, 59), 0, 0)
      const opening = rFloat(500, 2000)
      sessionRows.push([uid, opening, opening, opening, 'closed', openAt, closeAt])
    }
    const sessionInfos = []
    for (const batch of chunks(sessionRows, BATCH)) {
      const { ph, params } = bv(batch)
      const r = await client.query(
        `INSERT INTO cash_sessions (user_id, opening_amount, closing_amount, expected_amount, status, opened_at, closed_at)
         VALUES ${ph} RETURNING session_id, user_id, opened_at`, params
      )
      sessionInfos.push(...r.rows)
    }
    console.log(`✓ ${sessionInfos.length}`)

    // ── 4. Pawns + Items ───────────────────────────────────────────────────────
    console.log('4/8 Empeños + ítems...')
    const allPawnMeta  = []  // { pawn_id, status, loan_amount, interest_rate, custody_rate, interest_type, session_id, user_id, session_date }
    const allItemMeta  = []  // { item_id, status, appraised_value, pawn_id, session_id, user_id, session_date }

    let pawnCount = 0
    let itemCount = 0

    // Distribute NUM_PAWNS across sessions
    const pawnAlloc = sessionInfos.map(() => 0)
    for (let p = 0; p < NUM_PAWNS; p++) pawnAlloc[p % sessionInfos.length]++

    for (let si = 0; si < sessionInfos.length; si++) {
      const sess = sessionInfos[si]
      const n = pawnAlloc[si]
      if (n === 0) continue

      const sessDate = new Date(sess.opened_at)

      // Build pawn rows
      const pawnRows = []
      const pawnMeta = []
      for (let p = 0; p < n; p++) {
        const status       = pick(STATUS_DIST)
        const intType      = pick(INT_TYPES)
        const loan         = rFloat(500, 15000)
        const rate         = intType === 'monthly' ? rFloat(3, 8) : rFloat(0.1, 0.3)
        const custody      = rFloat(0, 2)
        const customerId   = pick(customerIds)

        let startDate, dueDate
        if (status === 'active' || status === 'renewed') {
          startDate = addDays(sessDate, -rInt(1, 45))
          dueDate   = addDays(today, rInt(5, 30))
        } else {
          startDate = addDays(sessDate, -rInt(30, 180))
          dueDate   = addDays(startDate, rInt(15, 60))
        }

        pawnRows.push([customerId, sess.user_id, loan, rate, custody, intType, toDate(startDate), toDate(dueDate), status])
        pawnMeta.push({ status, loan, rate, custody, intType, sessDate, session_id: sess.session_id, user_id: sess.user_id })
      }

      const { ph: pPh, params: pP } = bv(pawnRows)
      const pRes = await client.query(
        `INSERT INTO pawns (customer_id, user_id, loan_amount, interest_rate, custody_rate, interest_type, start_date, due_date, status)
         VALUES ${pPh} RETURNING pawn_id, status`, pP
      )
      pawnCount += pRes.rowCount

      // Build item rows
      const itemRows = []
      const itemMeta = []
      for (let i = 0; i < pRes.rows.length; i++) {
        const { pawn_id, status } = pRes.rows[i]
        const meta  = pawnMeta[i]
        const numItems = rInt(1, 3)
        const catName  = pick(CATEGORY_NAMES)
        const catId    = catByName[catName]
        const tpls     = ITEMS_BY_CAT[catName]

        for (let j = 0; j < numItems; j++) {
          const [desc, brand] = pick(tpls)
          const appraised     = rFloat(meta.loan * 1.5, meta.loan * 3)
          let itemStatus
          if (status === 'redeemed')        itemStatus = 'redeemed'
          else if (status === 'forfeited')  itemStatus = Math.random() > 0.5 ? 'sold' : 'available_for_sale'
          else                              itemStatus = 'pawned'

          itemRows.push([pawn_id, catId, desc, brand, `Mod-${rInt(100, 999)}`, null, appraised, itemStatus, null])
          itemMeta.push({ pawn_id, itemStatus, appraised, session_id: meta.session_id, user_id: meta.user_id, sessDate: meta.sessDate })
        }

        // Collect loan movement (cash out) per pawn
        allMovements.push([meta.session_id, meta.user_id, 'out', 'loan', meta.loan, 'pawn', pawn_id, meta.sessDate])

        allPawnMeta.push({ pawn_id, ...meta })
      }

      const { ph: iPh, params: iP } = bv(itemRows)
      const iRes = await client.query(
        `INSERT INTO items (pawn_id, category_id, description, brand, model, serial_number, appraised_value, status, photo_url)
         VALUES ${iPh} RETURNING item_id, status, appraised_value`, iP
      )
      itemCount += iRes.rowCount

      for (let k = 0; k < iRes.rows.length; k++) {
        allItemMeta.push({ item_id: iRes.rows[k].item_id, status: iRes.rows[k].status, appraised: parseFloat(iRes.rows[k].appraised_value), ...itemMeta[k] })
      }

      if (pawnCount % 500 === 0 || pawnCount === NUM_PAWNS) {
        process.stdout.write(`\r  → ${pawnCount}/${NUM_PAWNS} empeños, ${itemCount} ítems`)
      }
    }
    console.log(`\n✓ ${pawnCount} empeños, ${itemCount} ítems`)

    // ── 5. Payments ────────────────────────────────────────────────────────────
    process.stdout.write('5/8 Pagos... ')
    const paymentRows  = []
    const paymentMeta  = []

    for (const pm of allPawnMeta) {
      if (pm.status === 'active') continue

      const intPerPeriod = pm.intType === 'monthly'
        ? pm.loan * (pm.rate / 100)
        : pm.loan * (pm.rate / 100) * 30
      const custPerPeriod = pm.loan * (pm.custody / 100)

      const numInt = pm.status === 'redeemed' ? rInt(1, 3)
        : pm.status === 'forfeited' ? rInt(0, 2)
        : rInt(1, 2)

      // Use a slightly later session for payments (realistic)
      const laterSession = sessionInfos[Math.min(sessionInfos.indexOf(sessionInfos.find(s => s.session_id === pm.session_id)) + rInt(1, 10), sessionInfos.length - 1)]
      const paySession   = laterSession || sessionInfos[sessionInfos.length - 1]

      for (let n = 0; n < numInt; n++) {
        const interest = rFloat(intPerPeriod * 0.9, intPerPeriod * 1.1)
        const custody  = rFloat(custPerPeriod * 0.9, custPerPeriod * 1.1)
        const method   = pick(PAY_METHODS)
        paymentRows.push([pm.pawn_id, paySession.session_id, interest, custody, 0, 'interest', method])
        paymentMeta.push({ session_id: paySession.session_id, user_id: paySession.user_id, amount: interest + custody, sessDate: new Date(paySession.opened_at), isRedemption: false })
      }

      if (pm.status === 'redeemed') {
        const interest = rFloat(intPerPeriod * 0.9, intPerPeriod * 1.1)
        const custody  = rFloat(custPerPeriod * 0.9, custPerPeriod * 1.1)
        const method   = pick(PAY_METHODS)
        paymentRows.push([pm.pawn_id, paySession.session_id, interest, custody, pm.loan, 'redemption', method])
        paymentMeta.push({ session_id: paySession.session_id, user_id: paySession.user_id, amount: interest + custody + pm.loan, sessDate: new Date(paySession.opened_at), isRedemption: true })
      }
    }

    let paymentCount = 0
    for (const batch of chunks(paymentRows, BATCH)) {
      const batchMeta = paymentMeta.slice(paymentCount, paymentCount + batch.length)
      const { ph, params } = bv(batch)
      const r = await client.query(
        `INSERT INTO payments (pawn_id, session_id, interest_amount, custody_amount, principal_amount, payment_type, payment_method)
         VALUES ${ph} RETURNING payment_id`, params
      )
      for (let i = 0; i < r.rows.length; i++) {
        const m   = batchMeta[i]
        const cat = m.isRedemption ? 'redemption' : 'interest_payment'
        allMovements.push([m.session_id, m.user_id, 'in', cat, m.amount, 'payment', r.rows[i].payment_id, m.sessDate])
      }
      paymentCount += r.rowCount
    }
    console.log(`✓ ${paymentCount}`)

    // ── 6. Sales ───────────────────────────────────────────────────────────────
    process.stdout.write('6/8 Ventas... ')
    const soldItems = allItemMeta.filter(i => i.status === 'sold')
    const saleRows  = []
    const saleMeta  = []

    for (const item of soldItems) {
      const salePrice   = rFloat(item.appraised * 0.5, item.appraised * 0.9)
      const method      = pick(PAY_METHODS)
      const buyerChance = Math.random() > 0.6 ? pick(customerIds) : null
      saleRows.push([item.item_id, item.session_id, buyerChance, salePrice, method])
      saleMeta.push({ session_id: item.session_id, user_id: item.user_id, amount: salePrice, sessDate: item.sessDate })
    }

    let saleCount = 0
    for (const batch of chunks(saleRows, BATCH)) {
      const batchMeta = saleMeta.slice(saleCount, saleCount + batch.length)
      const { ph, params } = bv(batch)
      const r = await client.query(
        `INSERT INTO sales (item_id, session_id, buyer_customer_id, sale_price, payment_method)
         VALUES ${ph} RETURNING sale_id`, params
      )
      for (let i = 0; i < r.rows.length; i++) {
        const m = batchMeta[i]
        allMovements.push([m.session_id, m.user_id, 'in', 'sale', m.amount, 'sale', r.rows[i].sale_id, m.sessDate])
      }
      saleCount += r.rowCount
    }
    console.log(`✓ ${saleCount}`)

    // ── 7. Expenses ────────────────────────────────────────────────────────────
    process.stdout.write('7/8 Gastos... ')
    const expenseRows = []
    const expenseMeta = []

    for (const sess of sessionInfos) {
      const n = rInt(1, 4)
      for (let e = 0; e < n; e++) {
        const concept = pick(EXPENSE_CONCEPTS)
        const amount  = rFloat(20, 500)
        expenseRows.push([sess.session_id, sess.user_id, concept, amount])
        expenseMeta.push({ session_id: sess.session_id, user_id: sess.user_id, amount, sessDate: new Date(sess.opened_at) })
      }
    }

    let expenseCount = 0
    for (const batch of chunks(expenseRows, BATCH)) {
      const batchMeta = expenseMeta.slice(expenseCount, expenseCount + batch.length)
      const { ph, params } = bv(batch)
      const r = await client.query(
        `INSERT INTO expenses (session_id, user_id, concept, amount) VALUES ${ph} RETURNING expense_id`, params
      )
      for (let i = 0; i < r.rows.length; i++) {
        const m = batchMeta[i]
        allMovements.push([m.session_id, m.user_id, 'out', 'operating_expense', m.amount, 'expense', r.rows[i].expense_id, m.sessDate])
      }
      expenseCount += r.rowCount
    }
    console.log(`✓ ${expenseCount}`)

    // ── 8. Movements ──────────────────────────────────────────────────────────
    process.stdout.write(`8/8 Movimientos (${allMovements.length})... `)
    let movementCount = 0
    for (const batch of chunks(allMovements, BATCH)) {
      const { ph, params } = bv(batch)
      await client.query(
        `INSERT INTO movements (session_id, user_id, movement_type, category, amount, reference_type, reference_id, created_at)
         VALUES ${ph}`, params
      )
      movementCount += batch.length
    }
    console.log(`✓ ${movementCount}`)

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log('\n✅ Seeder masivo completado.')
    console.log('─'.repeat(35))
    console.log(`  Categorías:   ${catRes.rowCount}`)
    console.log(`  Clientes:     ${customerIds.length}`)
    console.log(`  Sesiones:     ${sessionInfos.length}`)
    console.log(`  Empeños:      ${pawnCount}`)
    console.log(`  Ítems:        ${itemCount}`)
    console.log(`  Pagos:        ${paymentCount}`)
    console.log(`  Ventas:       ${saleCount}`)
    console.log(`  Gastos:       ${expenseCount}`)
    console.log(`  Movimientos:  ${movementCount}`)
    console.log('─'.repeat(35))

  } catch (err) {
    console.error('\n❌ Error:', err.message)
    console.error(err.stack)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

seed()
