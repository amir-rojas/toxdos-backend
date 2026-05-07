'use strict'
/**
 * seed-bolivia.js — Seed de producción con contexto boliviano
 *
 * Crea: usuarios (admin + cajero), categorías, clientes, sesiones,
 *       empeños, ítems, pagos, ventas, gastos y movimientos.
 *
 * Uso:
 *   DATABASE_URL=<supabase-session-pooler-url> node scripts/seed-bolivia.js
 */

require('dotenv/config')
const { Pool } = require('pg')
const bcrypt   = require('bcrypt')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

// ── Config ─────────────────────────────────────────────────────────────────────
const NUM_CUSTOMERS = 80
const NUM_SESSIONS  = 90    // ~3 meses de historial
const NUM_PAWNS     = 250
const BATCH         = 50

// ── Helpers ────────────────────────────────────────────────────────────────────
const rInt   = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const rFloat = (min, max, dp = 2) => parseFloat((Math.random() * (max - min) + min).toFixed(dp))
const pick   = arr => arr[rInt(0, arr.length - 1)]
const addDays = (date, n) => { const d = new Date(date); d.setDate(d.getDate() + n); return d }
const toDate  = d => d.toISOString().split('T')[0]
const chunks  = (arr, n) => { const r = []; for (let i = 0; i < arr.length; i += n) r.push(arr.slice(i, i + n)); return r }

function bv(rows) {
  const params = []
  const ph = rows.map(row => {
    const start = params.length
    row.forEach(v => params.push(v))
    return `(${row.map((_, i) => `$${start + i + 1}`).join(', ')})`
  }).join(', ')
  return { ph, params }
}

// ── Datos bolivianos ────────────────────────────────────────────────────────────
const NOMBRES_M = [
  'Juan', 'Carlos', 'Miguel', 'José', 'Luis', 'Pedro', 'Sergio', 'Óscar',
  'Rodrigo', 'Marco', 'Ramiro', 'Nelson', 'Héctor', 'Edwin', 'Freddy',
  'Rolando', 'Raúl', 'Álvaro', 'Gabriel', 'Diego', 'Roberto', 'Fernando',
  'Germán', 'Walter', 'Gustavo', 'Alejandro', 'Erick', 'Boris', 'Willy',
  'Jhonny', 'Richard', 'Rubén', 'Víctor', 'Marcelo', 'Iván', 'Wilson',
]

const NOMBRES_F = [
  'María', 'Ana', 'Carmen', 'Rosa', 'Isabel', 'Patricia', 'Mónica',
  'Sandra', 'Lucía', 'Carla', 'Verónica', 'Paola', 'Claudia', 'Cecilia',
  'Lorena', 'Roxana', 'Jenny', 'Nathaly', 'Elizabeth', 'Silvia', 'Marcela',
  'Daniela', 'Vanessa', 'Gladys', 'Sonia', 'Miriam', 'Graciela', 'Yolanda',
  'Beatriz', 'Florencia', 'Cinthia', 'Lourdes', 'Noemí', 'Viviana',
]

const APELLIDOS = [
  'Mamani', 'Quispe', 'Flores', 'López', 'García', 'Condori', 'Chávez',
  'Ramos', 'Vargas', 'Mendoza', 'Gutierrez', 'Herrera', 'Morales', 'Jiménez',
  'Rojas', 'Cruz', 'Fernández', 'Torres', 'Romero', 'Alvarado', 'Vásquez',
  'Apaza', 'Huanca', 'Callisaya', 'Limachi', 'Calle', 'Nina', 'Poma',
  'Soria', 'Torrico', 'Orellana', 'Zeballos', 'Serrudo', 'Alanoca', 'Colque',
  'Calisaya', 'Tito', 'Paye', 'Chura', 'Yujra', 'Catari', 'Copa', 'Laime',
  'Tarqui', 'Espinoza', 'Salazar', 'Medina', 'Aguilar', 'Ríos', 'Sandoval',
]

const ZONAS = [
  'Miraflores', 'Sopocachi', 'San Pedro', 'Villa Fátima', 'Obrajes',
  'Calacoto', 'Achumani', 'Irpavi', 'Pampahasi', 'Periférica',
  'Achachicala', 'Chasquipampa', 'Ciudadela', 'Temporal', 'San Antonio',
  'Villa Adela', 'El Tejar', 'Los Andes', 'Max Paredes', 'Cotahuma',
  'Ciudad Satélite', 'Alto Lima', 'Villa Dolores', '16 de Julio',
]

const PREFIJOS_CALLE = ['Av.', 'Calle', 'Pasaje', 'Av.', 'Calle', 'Calle']

function nombreCompleto() {
  const esMujer = Math.random() > 0.5
  const nombre  = esMujer ? pick(NOMBRES_F) : pick(NOMBRES_M)
  return `${nombre} ${pick(APELLIDOS)} ${pick(APELLIDOS)}`
}

function ciBoliviano() {
  return String(rInt(1000000, 9999999))
}

function telefonoBoliviano() {
  const prefijo = Math.random() > 0.4 ? '7' : '6'
  return `+591 ${prefijo}${rInt(1000000, 9999999)}`
}

function direccionBoliviana() {
  const zona   = pick(ZONAS)
  const calle  = pick(PREFIJOS_CALLE)
  const num    = rInt(100, 2999)
  return `${calle} ${num}, Zona ${zona}, La Paz`
}

// ── Categorías ─────────────────────────────────────────────────────────────────
const CATEGORY_NAMES = [
  'Celulares y Smartphones', 'Laptops y Computadoras', 'Tablets y Lectores',
  'Televisores y Monitores', 'Consolas y Videojuegos', 'Cámaras y Fotografía',
  'Audio y Parlantes', 'Electrodomésticos',
  'Joyería de Oro', 'Joyería de Plata', 'Relojes', 'Lentes y Óptica',
  'Herramientas Eléctricas', 'Herramientas Manuales', 'Equipos de Construcción',
  'Artículos Deportivos', 'Bicicletas', 'Instrumentos Musicales',
  'Ropa y Calzado', 'Bolsos y Carteras',
  'Artículos de Cocina', 'Muebles y Decoración',
  'Antigüedades y Arte', 'Coleccionables', 'Libros y Material Educativo',
  'Vehículos y Accesorios',
]

// Artículos realistas para el mercado boliviano
const ITEMS_BY_CAT = {
  'Celulares y Smartphones': [
    ['Samsung Galaxy A14', 'Samsung'],
    ['Samsung Galaxy A34', 'Samsung'],
    ['Samsung Galaxy A54', 'Samsung'],
    ['Samsung Galaxy A24', 'Samsung'],
    ['Samsung Galaxy S21 FE', 'Samsung'],
    ['Xiaomi Redmi Note 12', 'Xiaomi'],
    ['Xiaomi Redmi Note 13', 'Xiaomi'],
    ['Xiaomi Redmi 12C', 'Xiaomi'],
    ['Xiaomi Redmi 13C', 'Xiaomi'],
    ['Motorola Moto G54', 'Motorola'],
    ['Motorola Moto G84', 'Motorola'],
    ['Motorola Moto G23', 'Motorola'],
    ['iPhone 11', 'Apple'],
    ['iPhone 12', 'Apple'],
    ['iPhone XR', 'Apple'],
    ['Huawei Y9s', 'Huawei'],
    ['Tecno Spark 10', 'Tecno'],
  ],
  'Laptops y Computadoras': [
    ['HP Pavilion 15', 'HP'],
    ['HP Laptop 15s', 'HP'],
    ['HP 240 G8', 'HP'],
    ['Dell Inspiron 15', 'Dell'],
    ['Dell Latitude 3420', 'Dell'],
    ['Lenovo IdeaPad 3', 'Lenovo'],
    ['Lenovo IdeaPad Slim 5', 'Lenovo'],
    ['ASUS VivoBook 15', 'ASUS'],
    ['Acer Aspire 5', 'Acer'],
    ['MacBook Air M1', 'Apple'],
    ['PC de escritorio ensamblado', 'Sin marca'],
  ],
  'Tablets y Lectores': [
    ['Samsung Galaxy Tab A8', 'Samsung'],
    ['Samsung Galaxy Tab A7 Lite', 'Samsung'],
    ['iPad 9na generación', 'Apple'],
    ['Lenovo Tab M10', 'Lenovo'],
    ['Huawei MatePad T10', 'Huawei'],
    ['Amazon Fire HD 8', 'Amazon'],
  ],
  'Televisores y Monitores': [
    ['Smart TV 32" LED', 'TCL'],
    ['Smart TV 40" LED', 'TCL'],
    ['Smart TV 43" 4K', 'Hisense'],
    ['Smart TV 32" Full HD', 'Samsung'],
    ['Smart TV 40" Full HD', 'LG'],
    ['Monitor LED 21.5"', 'AOC'],
    ['Monitor LED 24"', 'LG'],
    ['TV 29" convencional', 'Sin marca'],
  ],
  'Consolas y Videojuegos': [
    ['PlayStation 4 Slim', 'Sony'],
    ['PlayStation 4 Pro', 'Sony'],
    ['Nintendo Switch', 'Nintendo'],
    ['Nintendo Switch Lite', 'Nintendo'],
    ['Xbox One S', 'Microsoft'],
    ['PlayStation 5 Digital', 'Sony'],
  ],
  'Cámaras y Fotografía': [
    ['Cámara digital compacta', 'Canon'],
    ['Cámara semiprofesional EOS', 'Canon'],
    ['Cámara réflex D3500', 'Nikon'],
    ['Cámara bridge', 'Sony'],
    ['Videocámara HD', 'Sony'],
    ['Cámara de acción Hero 7', 'GoPro'],
  ],
  'Audio y Parlantes': [
    ['Parlante bluetooth portátil', 'JBL'],
    ['Parlante Clip 3', 'JBL'],
    ['Parlante Flip 5', 'JBL'],
    ['Auriculares inalámbricos WH-CH520', 'Sony'],
    ['Auriculares Tune 510BT', 'JBL'],
    ['Auriculares básicos', 'Sin marca'],
    ['Equipo de sonido minicomponente', 'LG'],
    ['Parlante bluetooth pequeño', 'Sony'],
  ],
  'Electrodomésticos': [
    ['Licuadora 3 velocidades', 'Oster'],
    ['Licuadora de vaso', 'Black+Decker'],
    ['Microondas 20L', 'LG'],
    ['Microondas 23L', 'Samsung'],
    ['Plancha a vapor', 'Philips'],
    ['Ventilador de pie', 'Sin marca'],
    ['Cafetera eléctrica', 'Imaco'],
    ['Sandwichera eléctrica', 'Imaco'],
    ['Arrocera 1.8L', 'Imaco'],
    ['Freidora de aire 3.5L', 'Sin marca'],
  ],
  'Joyería de Oro': [
    ['Anillo solitario de oro 18k', 'Sin marca'],
    ['Anillo de oro 18k con brillante', 'Sin marca'],
    ['Anillo de oro 14k liso', 'Sin marca'],
    ['Cadena de oro 14k tejido bismark', 'Sin marca'],
    ['Cadena de oro 18k tejido cartier', 'Sin marca'],
    ['Cadena de oro 18k fígaro', 'Sin marca'],
    ['Pulsera de oro 18k esclava', 'Sin marca'],
    ['Pulsera de oro 14k tejido', 'Sin marca'],
    ['Arete de oro 18k argolla', 'Sin marca'],
    ['Par de aretes de oro 18k con piedra', 'Sin marca'],
    ['Colgante de oro 18k virgen', 'Sin marca'],
    ['Colgante de oro 18k cristo', 'Sin marca'],
    ['Gargantilla de oro 18k', 'Sin marca'],
    ['Dije de oro 18k', 'Sin marca'],
    ['Anillo de compromiso oro 18k', 'Sin marca'],
  ],
  'Joyería de Plata': [
    ['Collar de plata 925', 'Sin marca'],
    ['Pulsera de plata 925', 'Sin marca'],
    ['Anillo de plata 925', 'Sin marca'],
    ['Par de aretes de plata 925', 'Sin marca'],
    ['Cadena de plata 925', 'Sin marca'],
    ['Colgante de plata con turquesa', 'Sin marca'],
  ],
  'Relojes': [
    ['Reloj de pulsera Casio Edifice', 'Casio'],
    ['Reloj de pulsera G-Shock', 'Casio'],
    ['Reloj digital Casio', 'Casio'],
    ['Reloj de pulsera Seiko 5', 'Seiko'],
    ['Reloj de pulsera Citizen Eco-Drive', 'Citizen'],
    ['Smartwatch Galaxy Watch 4', 'Samsung'],
    ['Smartwatch Watch GT3', 'Huawei'],
    ['Reloj de pared', 'Sin marca'],
  ],
  'Lentes y Óptica': [
    ['Anteojos con graduación montura metálica', 'Sin marca'],
    ['Anteojos con graduación montura acetato', 'Sin marca'],
    ['Lentes de sol polarizados', 'Ray-Ban'],
    ['Lentes de sol deportivos', 'Sin marca'],
    ['Binoculares 8x40', 'Sin marca'],
  ],
  'Herramientas Eléctricas': [
    ['Taladro percutor GSB 13 RE', 'Bosch'],
    ['Amoladora angular 4.5"', 'Bosch'],
    ['Amoladora DWE4011 4.5"', 'DeWalt'],
    ['Taladro percutor 650W', 'Black+Decker'],
    ['Sierra caladora 500W', 'Skil'],
    ['Atornillador inalámbrico 12V', 'Bosch'],
    ['Lijadora orbital', 'Black+Decker'],
  ],
  'Herramientas Manuales': [
    ['Caja de herramientas 130 piezas', 'Stanley'],
    ['Set de llaves mixtas', 'Stanley'],
    ['Alicate multiusos', 'Sin marca'],
    ['Nivel de burbuja 60cm', 'Sin marca'],
    ['Llave francesa 10"', 'Sin marca'],
    ['Destornilladores juego x6', 'Stanley'],
  ],
  'Equipos de Construcción': [
    ['Mezcladora de concreto 160L', 'Sin marca'],
    ['Compresora de aire 24L', 'Sin marca'],
    ['Generador eléctrico 2200W', 'Sin marca'],
    ['Vibrador para concreto', 'Sin marca'],
    ['Soldadora eléctrica 200A', 'Sin marca'],
  ],
  'Artículos Deportivos': [
    ['Mancuernas hexagonales 10kg par', 'Sin marca'],
    ['Mancuernas hexagonales 15kg par', 'Sin marca'],
    ['Casco de ciclismo', 'Sin marca'],
    ['Balón de fútbol No. 5', 'Adidas'],
    ['Raqueta de tenis', 'Wilson'],
    ['Colchoneta de yoga', 'Sin marca'],
    ['Rodilleras y coderas set', 'Sin marca'],
  ],
  'Bicicletas': [
    ['Bicicleta de montaña aro 26"', 'Sin marca'],
    ['Bicicleta de montaña aro 29"', 'Sin marca'],
    ['Bicicleta urbana aro 28"', 'Sin marca'],
    ['Bicicleta BMX aro 20"', 'Sin marca'],
    ['Bicicleta para niño aro 20"', 'Sin marca'],
    ['Bicicleta plegable', 'Sin marca'],
  ],
  'Instrumentos Musicales': [
    ['Guitarra acústica 6 cuerdas', 'Yamaha'],
    ['Guitarra electroacústica', 'Yamaha'],
    ['Guitarra eléctrica Stratocaster', 'Fender'],
    ['Teclado 61 teclas', 'Casio'],
    ['Teclado 76 teclas CTK', 'Casio'],
    ['Charango boliviano artesanal', 'Sin marca'],
    ['Zampoña artesanal', 'Sin marca'],
    ['Quena de caña', 'Sin marca'],
  ],
  'Ropa y Calzado': [
    ['Zapatillas urbanas', 'Nike'],
    ['Zapatillas running', 'Adidas'],
    ['Zapatillas training', 'Puma'],
    ['Botas de cuero', 'Sin marca'],
    ['Campera deportiva', 'Under Armour'],
    ['Ropa deportiva conjunto', 'Nike'],
  ],
  'Bolsos y Carteras': [
    ['Mochila escolar 35L', 'Sin marca'],
    ['Mochila de viaje 45L', 'Sin marca'],
    ['Bolso de mano cuero sintético', 'Sin marca'],
    ['Cartera de cuero dama', 'Sin marca'],
    ['Maletín de negocios', 'Sin marca'],
  ],
  'Artículos de Cocina': [
    ['Juego de ollas 8 piezas aluminio', 'Sin marca'],
    ['Juego de ollas acero inoxidable', 'Sin marca'],
    ['Sartén antiadherente 28cm', 'Sin marca'],
    ['Procesador de alimentos', 'Oster'],
    ['Cuchillería juego x6', 'Sin marca'],
  ],
  'Muebles y Decoración': [
    ['Cuadro decorativo canvas', 'Sin marca'],
    ['Espejo decorativo con marco', 'Sin marca'],
    ['Lámpara de mesa LED', 'Sin marca'],
    ['Alfombra decorativa', 'Sin marca'],
    ['Reloj de pared decorativo', 'Sin marca'],
  ],
  'Antigüedades y Arte': [
    ['Figura de cerámica andina', 'Sin marca'],
    ['Monedas antiguas bolivianas lote', 'Sin marca'],
    ['Cuadro antiguo al óleo', 'Sin marca'],
    ['Objeto de plata colonial', 'Sin marca'],
    ['Textil andino antiguo', 'Sin marca'],
  ],
  'Coleccionables': [
    ['Figura coleccionable', 'Sin marca'],
    ['Tarjetas de fútbol selección Bolivia', 'Sin marca'],
    ['Álbum de figuritas FIFA', 'Sin marca'],
    ['Monedas de colección', 'Sin marca'],
  ],
  'Libros y Material Educativo': [
    ['Libros de texto universitarios lote', 'Sin marca'],
    ['Enciclopedia temática', 'Sin marca'],
    ['Material de dibujo técnico set', 'Sin marca'],
    ['Libros de preparatoria lote', 'Sin marca'],
  ],
  'Vehículos y Accesorios': [
    ['Casco de moto certificado', 'Sin marca'],
    ['Autorradio con bluetooth', 'Pioneer'],
    ['GPS vehicular', 'Garmin'],
    ['Repuestos de moto lote', 'Sin marca'],
    ['Llantas aro 13" par', 'Sin marca'],
    ['Kit de herramientas para auto', 'Sin marca'],
  ],
}

// Montos de préstamo realistas por categoría en bolivianos (Bs)
// Ajustados al mercado boliviano: casa de empeño pequeña/mediana
const LOAN_BY_CAT = {
  'Joyería de Oro':              { min: 500,  max: 6000 },
  'Joyería de Plata':            { min: 100,  max: 700  },
  'Relojes':                     { min: 200,  max: 1800 },
  'Celulares y Smartphones':     { min: 300,  max: 1400 },
  'Laptops y Computadoras':      { min: 600,  max: 2800 },
  'Tablets y Lectores':          { min: 150,  max: 700  },
  'Televisores y Monitores':     { min: 250,  max: 1600 },
  'Consolas y Videojuegos':      { min: 250,  max: 1100 },
  'Cámaras y Fotografía':        { min: 150,  max: 900  },
  'Audio y Parlantes':           { min: 80,   max: 450  },
  'Electrodomésticos':           { min: 70,   max: 350  },
  'Herramientas Eléctricas':     { min: 180,  max: 1100 },
  'Herramientas Manuales':       { min: 50,   max: 280  },
  'Equipos de Construcción':     { min: 500,  max: 2800 },
  'Artículos Deportivos':        { min: 50,   max: 320  },
  'Bicicletas':                  { min: 180,  max: 1100 },
  'Instrumentos Musicales':      { min: 100,  max: 550  },
  'Ropa y Calzado':              { min: 50,   max: 220  },
  'Bolsos y Carteras':           { min: 50,   max: 300  },
  'Artículos de Cocina':         { min: 50,   max: 250  },
  'Muebles y Decoración':        { min: 80,   max: 450  },
  'Antigüedades y Arte':         { min: 200,  max: 1800 },
  'Coleccionables':              { min: 50,   max: 350  },
  'Libros y Material Educativo': { min: 20,   max: 130  },
  'Vehículos y Accesorios':      { min: 100,  max: 750  },
  'Lentes y Óptica':             { min: 80,   max: 450  },
}

// Custodia por tamaño físico del artículo (% mensual sobre capital)
const CUSTODY_BY_CAT = {
  'Joyería de Oro':              { min: 0.5, max: 1.5 },
  'Joyería de Plata':            { min: 0.5, max: 1.5 },
  'Relojes':                     { min: 0.5, max: 1.5 },
  'Lentes y Óptica':             { min: 0.5, max: 1.0 },
  'Coleccionables':              { min: 0.5, max: 1.0 },
  'Libros y Material Educativo': { min: 0.5, max: 1.0 },
  'Celulares y Smartphones':     { min: 1.0, max: 2.5 },
  'Tablets y Lectores':          { min: 1.0, max: 2.5 },
  'Audio y Parlantes':           { min: 1.0, max: 2.5 },
  'Cámaras y Fotografía':        { min: 1.0, max: 2.5 },
  'Instrumentos Musicales':      { min: 1.5, max: 3.0 },
  'Ropa y Calzado':              { min: 1.0, max: 2.0 },
  'Bolsos y Carteras':           { min: 1.0, max: 2.0 },
  'Artículos de Cocina':         { min: 1.0, max: 2.5 },
  'Artículos Deportivos':        { min: 1.5, max: 3.0 },
  'Herramientas Manuales':       { min: 1.0, max: 2.5 },
  'Antigüedades y Arte':         { min: 1.0, max: 2.5 },
  'Laptops y Computadoras':      { min: 2.0, max: 4.0 },
  'Televisores y Monitores':     { min: 2.5, max: 5.0 },
  'Consolas y Videojuegos':      { min: 2.0, max: 3.5 },
  'Electrodomésticos':           { min: 2.5, max: 5.0 },
  'Herramientas Eléctricas':     { min: 2.0, max: 4.0 },
  'Bicicletas':                  { min: 3.0, max: 6.0 },
  'Muebles y Decoración':        { min: 3.0, max: 6.0 },
  'Equipos de Construcción':     { min: 5.0, max: 10.0 },
  'Vehículos y Accesorios':      { min: 5.0, max: 10.0 },
}

function custodyRateForCat(catName) {
  const range = CUSTODY_BY_CAT[catName] ?? { min: 1.0, max: 3.0 }
  return rFloat(range.min, range.max)
}

function loanAmountForCat(catName) {
  const range = LOAN_BY_CAT[catName] ?? { min: 100, max: 2500 }
  return rFloat(range.min, range.max)
}

const EXPENSE_CONCEPTS = [
  'Limpieza y materiales', 'Papelería y útiles de oficina',
  'Servicio de internet', 'Luz eléctrica', 'Alquiler del local',
  'Servicio de seguridad', 'Mantenimiento general', 'Publicidad en redes',
  'Suministros de caja', 'Agua potable', 'Reparación menor',
  'Transporte y movilidad', 'Impuesto municipal', 'Envío de paquetes',
  'Recarga de extinguidor', 'Material de embalaje',
]

const PAY_METHODS = ['cash', 'cash', 'cash', 'qr', 'transfer']
const INT_TYPES   = ['monthly', 'monthly', 'monthly', 'monthly', 'daily']
const STATUS_DIST = [
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
    // ── 0. Usuarios ────────────────────────────────────────────────────────────
    process.stdout.write('0/8 Usuarios... ')
    const adminHash   = await bcrypt.hash('admin123', 10)
    const cajeroHash  = await bcrypt.hash('cajero123', 10)

    const existingRes = await client.query(
      `SELECT user_id, email, role FROM users WHERE email = ANY($1)`,
      [['admin@pawnshop.com', 'cajero@pawnshop.com']]
    )
    const existingByEmail = Object.fromEntries(existingRes.rows.map(u => [u.email, u]))

    const toInsert = []
    if (!existingByEmail['admin@pawnshop.com'])  toInsert.push(['Benjo Admin',  'admin@pawnshop.com',  adminHash,  'admin',   true])
    if (!existingByEmail['cajero@pawnshop.com']) toInsert.push(['María Cajero', 'cajero@pawnshop.com', cajeroHash, 'cashier', true])

    let usersRows = existingRes.rows
    if (toInsert.length > 0) {
      const { ph, params } = bv(toInsert)
      const ins = await client.query(
        `INSERT INTO users (full_name, email, password_hash, role, is_active) VALUES ${ph} RETURNING user_id, email, role`,
        params
      )
      usersRows = [...usersRows, ...ins.rows]
    }
    const usersRes = { rows: usersRows }

    const adminRow  = usersRes.rows.find(u => u.role === 'admin')
    const cajeroRow = usersRes.rows.find(u => u.role === 'cashier')
    const ADMIN_ID   = adminRow.user_id
    const CASHIER_ID = cajeroRow.user_id
    console.log(`✓ (admin id=${ADMIN_ID}, cajero id=${CASHIER_ID})`)

    // ── 1. Categorías ──────────────────────────────────────────────────────────
    process.stdout.write('1/8 Categorías... ')
    const catRows = CATEGORY_NAMES.map(n => [n])
    const { ph: catPh, params: catP } = bv(catRows)
    const catRes = await client.query(
      `INSERT INTO categories (name) VALUES ${catPh}
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING category_id, name`,
      catP
    )
    const catByName = Object.fromEntries(catRes.rows.map(r => [r.name, r.category_id]))
    console.log(`✓ ${catRes.rowCount}`)

    // ── 2. Clientes ────────────────────────────────────────────────────────────
    process.stdout.write('2/8 Clientes... ')
    const customerRows = Array.from({ length: NUM_CUSTOMERS }, () => [
      nombreCompleto(),
      ciBoliviano(),
      telefonoBoliviano(),
      direccionBoliviana(),
    ])
    const customerIds = []
    for (const batch of chunks(customerRows, BATCH)) {
      const { ph, params } = bv(batch)
      const r = await client.query(
        `INSERT INTO customers (full_name, id_number, phone, address) VALUES ${ph} RETURNING customer_id`,
        params
      )
      customerIds.push(...r.rows.map(x => x.customer_id))
    }
    console.log(`✓ ${customerIds.length}`)

    // ── 3. Sesiones ────────────────────────────────────────────────────────────
    process.stdout.write('3/8 Sesiones... ')
    const sessionRows = []
    let diasAgregados = 0
    let diaOffset = NUM_SESSIONS * -1
    while (diasAgregados < NUM_SESSIONS) {
      const d = addDays(today, diaOffset)
      diaOffset++
      if (d.getDay() === 0) continue  // domingo — día libre

      const uid    = diasAgregados % 3 === 0 ? ADMIN_ID : CASHIER_ID
      const openAt = new Date(d); openAt.setHours(rInt(8, 9), rInt(0, 30), 0, 0)
      const closeAt = new Date(d); closeAt.setHours(rInt(17, 18), rInt(30, 59), 0, 0)
      const opening = rFloat(500, 2000)  // apertura de caja en Bs — más realista para Bolivia
      sessionRows.push([uid, opening, opening, opening, 'closed', openAt, closeAt])
      diasAgregados++
    }

    const sessionInfos = []
    for (const batch of chunks(sessionRows, BATCH)) {
      const { ph, params } = bv(batch)
      const r = await client.query(
        `INSERT INTO cash_sessions (user_id, opening_amount, closing_amount, expected_amount, status, opened_at, closed_at)
         VALUES ${ph} RETURNING session_id, user_id, opened_at`,
        params
      )
      sessionInfos.push(...r.rows)
    }
    console.log(`✓ ${sessionInfos.length}`)

    // ── 4. Empeños + Ítems ─────────────────────────────────────────────────────
    console.log('4/8 Empeños + ítems...')
    const allPawnMeta = []
    const allItemMeta = []
    let pawnCount = 0
    let itemCount = 0

    const pawnAlloc = sessionInfos.map(() => 0)
    for (let p = 0; p < NUM_PAWNS; p++) pawnAlloc[p % sessionInfos.length]++

    for (let si = 0; si < sessionInfos.length; si++) {
      const sess = sessionInfos[si]
      const n = pawnAlloc[si]
      if (n === 0) continue

      const sessDate = new Date(sess.opened_at)
      const pawnRows = []
      const pawnMeta = []

      for (let p = 0; p < n; p++) {
        const status     = pick(STATUS_DIST)
        const intType    = pick(INT_TYPES)
        const mainCat    = pick(CATEGORY_NAMES)
        // Préstamo ajustado por categoría — más realista que un rango único
        const loan       = loanAmountForCat(mainCat)
        // Bolivia: interés máximo legal 3% mensual
        const rate       = intType === 'monthly' ? rFloat(1, 3) : rFloat(0.03, 0.1)
        const custody    = custodyRateForCat(mainCat)
        const customerId = pick(customerIds)

        let startDate, dueDate
        if (status === 'active' || status === 'renewed') {
          startDate = addDays(today, -rInt(1, 45))
          dueDate   = addDays(today, rInt(5, 30))
        } else {
          startDate = addDays(sessDate, -rInt(30, 90))
          dueDate   = addDays(startDate, rInt(15, 45))
        }
        if (dueDate <= startDate) dueDate = addDays(startDate, 15)

        pawnRows.push([customerId, sess.user_id, loan, rate, custody, intType, toDate(startDate), toDate(dueDate), status])
        pawnMeta.push({ status, loan, rate, custody, intType, sessDate, session_id: sess.session_id, user_id: sess.user_id, mainCat })
      }

      const { ph: pPh, params: pP } = bv(pawnRows)
      const pRes = await client.query(
        `INSERT INTO pawns (customer_id, user_id, loan_amount, interest_rate, custody_rate, interest_type, start_date, due_date, status)
         VALUES ${pPh} RETURNING pawn_id, status`,
        pP
      )
      pawnCount += pRes.rowCount

      const itemRows = []
      const itemMeta = []

      for (let i = 0; i < pRes.rows.length; i++) {
        const { pawn_id, status } = pRes.rows[i]
        const meta    = pawnMeta[i]
        const numItems = rInt(1, 2)
        const catName  = meta.mainCat
        const catId    = catByName[catName]
        const tpls     = ITEMS_BY_CAT[catName]

        for (let j = 0; j < numItems; j++) {
          const [desc, brand] = pick(tpls)
          const appraised     = rFloat(meta.loan * 1.4, meta.loan * 2.5)
          let itemStatus
          if (status === 'redeemed')       itemStatus = 'redeemed'
          else if (status === 'forfeited') itemStatus = Math.random() > 0.5 ? 'sold' : 'available_for_sale'
          else                             itemStatus = 'pawned'

          itemRows.push([pawn_id, catId, desc, brand, null, null, appraised, itemStatus, null])
          itemMeta.push({ pawn_id, itemStatus, appraised, session_id: meta.session_id, user_id: meta.user_id, sessDate: meta.sessDate })
        }

        allMovements.push([meta.session_id, meta.user_id, 'out', 'loan', meta.loan, 'pawn', pawn_id, meta.sessDate])
        allPawnMeta.push({ pawn_id, ...meta })
      }

      const { ph: iPh, params: iP } = bv(itemRows)
      const iRes = await client.query(
        `INSERT INTO items (pawn_id, category_id, description, brand, model, serial_number, appraised_value, status, photo_url)
         VALUES ${iPh} RETURNING item_id, status, appraised_value`,
        iP
      )
      itemCount += iRes.rowCount

      for (let k = 0; k < iRes.rows.length; k++) {
        allItemMeta.push({
          item_id: iRes.rows[k].item_id,
          status: iRes.rows[k].status,
          appraised: parseFloat(iRes.rows[k].appraised_value),
          ...itemMeta[k],
        })
      }

      if (pawnCount % 50 === 0 || pawnCount === NUM_PAWNS) {
        process.stdout.write(`\r  → ${pawnCount}/${NUM_PAWNS} empeños, ${itemCount} ítems`)
      }
    }
    console.log(`\n✓ ${pawnCount} empeños, ${itemCount} ítems`)

    // ── 5. Pagos ───────────────────────────────────────────────────────────────
    process.stdout.write('5/8 Pagos... ')
    const paymentRows = []
    const paymentMeta = []

    for (const pm of allPawnMeta) {
      if (pm.status === 'active') continue

      const intPerPeriod  = pm.intType === 'monthly'
        ? pm.loan * (pm.rate / 100)
        : pm.loan * (pm.rate / 100) * 30
      const custPerPeriod = pm.loan * (pm.custody / 100)

      const numInt = pm.status === 'redeemed' ? rInt(1, 3)
        : pm.status === 'forfeited' ? rInt(0, 1)
        : rInt(1, 2)

      const laterIdx    = Math.min(sessionInfos.findIndex(s => s.session_id === pm.session_id) + rInt(1, 8), sessionInfos.length - 1)
      const paySession  = sessionInfos[laterIdx] || sessionInfos[sessionInfos.length - 1]

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
         VALUES ${ph} RETURNING payment_id`,
        params
      )
      for (let i = 0; i < r.rows.length; i++) {
        const m   = batchMeta[i]
        const cat = m.isRedemption ? 'redemption' : 'interest_payment'
        allMovements.push([m.session_id, m.user_id, 'in', cat, m.amount, 'payment', r.rows[i].payment_id, m.sessDate])
      }
      paymentCount += r.rowCount
    }
    console.log(`✓ ${paymentCount}`)

    // ── 6. Ventas ──────────────────────────────────────────────────────────────
    process.stdout.write('6/8 Ventas... ')
    const soldItems = allItemMeta.filter(i => i.status === 'sold')
    const saleRows  = []
    const saleMeta  = []

    for (const item of soldItems) {
      const salePrice  = rFloat(item.appraised * 0.4, item.appraised * 0.75)
      const method     = pick(PAY_METHODS)
      const buyerChance = Math.random() > 0.5 ? pick(customerIds) : null
      saleRows.push([item.item_id, item.session_id, buyerChance, salePrice, method])
      saleMeta.push({ session_id: item.session_id, user_id: item.user_id, amount: salePrice, sessDate: item.sessDate })
    }

    let saleCount = 0
    for (const batch of chunks(saleRows, BATCH)) {
      const batchMeta = saleMeta.slice(saleCount, saleCount + batch.length)
      const { ph, params } = bv(batch)
      const r = await client.query(
        `INSERT INTO sales (item_id, session_id, buyer_customer_id, sale_price, payment_method)
         VALUES ${ph} RETURNING sale_id`,
        params
      )
      for (let i = 0; i < r.rows.length; i++) {
        const m = batchMeta[i]
        allMovements.push([m.session_id, m.user_id, 'in', 'sale', m.amount, 'sale', r.rows[i].sale_id, m.sessDate])
      }
      saleCount += r.rowCount
    }
    console.log(`✓ ${saleCount}`)

    // ── 7. Gastos ──────────────────────────────────────────────────────────────
    process.stdout.write('7/8 Gastos... ')
    const expenseRows = []
    const expenseMeta = []

    for (const sess of sessionInfos) {
      const n = rInt(0, 2)  // 0-2 gastos por sesión
      for (let e = 0; e < n; e++) {
        const concept = pick(EXPENSE_CONCEPTS)
        const amount  = rFloat(20, 380)  // Bs — rango ajustado para Bolivia
        expenseRows.push([sess.session_id, sess.user_id, concept, amount])
        expenseMeta.push({ session_id: sess.session_id, user_id: sess.user_id, amount, sessDate: new Date(sess.opened_at) })
      }
    }

    let expenseCount = 0
    for (const batch of chunks(expenseRows, BATCH)) {
      const batchMeta = expenseMeta.slice(expenseCount, expenseCount + batch.length)
      const { ph, params } = bv(batch)
      const r = await client.query(
        `INSERT INTO expenses (session_id, user_id, concept, amount) VALUES ${ph} RETURNING expense_id`,
        params
      )
      for (let i = 0; i < r.rows.length; i++) {
        const m = batchMeta[i]
        allMovements.push([m.session_id, m.user_id, 'out', 'operating_expense', m.amount, 'expense', r.rows[i].expense_id, m.sessDate])
      }
      expenseCount += r.rowCount
    }
    console.log(`✓ ${expenseCount}`)

    // ── 8. Movimientos ─────────────────────────────────────────────────────────
    process.stdout.write(`8/8 Movimientos (${allMovements.length})... `)
    let movementCount = 0
    for (const batch of chunks(allMovements, BATCH)) {
      const { ph, params } = bv(batch)
      await client.query(
        `INSERT INTO movements (session_id, user_id, movement_type, category, amount, reference_type, reference_id, created_at)
         VALUES ${ph}`,
        params
      )
      movementCount += batch.length
    }
    console.log(`✓ ${movementCount}`)

    // ── Resumen ────────────────────────────────────────────────────────────────
    console.log('\n✅ Seed boliviano completado.')
    console.log('─'.repeat(40))
    console.log(`  Usuarios:     2 (admin + cajero)`)
    console.log(`  Categorías:   ${catRes.rowCount}`)
    console.log(`  Clientes:     ${customerIds.length}`)
    console.log(`  Sesiones:     ${sessionInfos.length}`)
    console.log(`  Empeños:      ${pawnCount}`)
    console.log(`  Ítems:        ${itemCount}`)
    console.log(`  Pagos:        ${paymentCount}`)
    console.log(`  Ventas:       ${saleCount}`)
    console.log(`  Gastos:       ${expenseCount}`)
    console.log(`  Movimientos:  ${movementCount}`)
    console.log('─'.repeat(40))
    console.log('\nCredenciales:')
    console.log('  admin@pawnshop.com  / admin123')
    console.log('  cajero@pawnshop.com / cajero123')

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
