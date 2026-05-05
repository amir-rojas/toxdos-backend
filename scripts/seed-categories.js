/**
 * seed-categories.js
 * Inserts pawn shop categories into any DB (local or Supabase).
 * Safe to run multiple times: ON CONFLICT DO NOTHING.
 *
 * Usage:
 *   DATABASE_URL=<url> node scripts/seed-categories.js
 *   node scripts/seed-categories.js  (uses local .env)
 */

import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg

const CATEGORIES = [
  // ── Electrónica ────────────────────────────────────────────────────────────
  'Celulares y Smartphones',
  'Laptops y Computadoras',
  'Tablets y Lectores',
  'Televisores y Monitores',
  'Consolas y Videojuegos',
  'Cámaras y Fotografía',
  'Audio y Parlantes',
  'Electrodomésticos',

  // ── Joyería y Valor ────────────────────────────────────────────────────────
  'Joyería de Oro',
  'Joyería de Plata',
  'Relojes',
  'Lentes y Óptica',

  // ── Herramientas ───────────────────────────────────────────────────────────
  'Herramientas Eléctricas',
  'Herramientas Manuales',
  'Equipos de Construcción',

  // ── Deporte y Ocio ─────────────────────────────────────────────────────────
  'Artículos Deportivos',
  'Bicicletas',
  'Instrumentos Musicales',

  // ── Ropa y Accesorios ──────────────────────────────────────────────────────
  'Ropa y Calzado',
  'Bolsos y Carteras',

  // ── Hogar ──────────────────────────────────────────────────────────────────
  'Artículos de Cocina',
  'Muebles y Decoración',

  // ── Otros ──────────────────────────────────────────────────────────────────
  'Antigüedades y Arte',
  'Coleccionables',
  'Libros y Material Educativo',
  'Vehículos y Accesorios',
]

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
  })

  const client = await pool.connect()
  try {
    let inserted = 0
    let skipped = 0

    for (const name of CATEGORIES) {
      const res = await client.query(
        `INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
        [name]
      )
      if (res.rowCount > 0) inserted++
      else skipped++
    }

    console.log(`✓ Categorías: ${inserted} insertadas, ${skipped} ya existían`)
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
