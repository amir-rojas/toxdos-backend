# Toxdos — Backend

API REST para sistema POS de casa de empeños. Gestiona empeños, pagos, ventas, gastos, caja, clientes y finanzas.

## Stack

- **Node.js** + **Express 5** + **TypeScript**
- **PostgreSQL** (via `pg`)
- **JWT** — autenticación stateless
- **bcrypt** — hash de contraseñas
- **dotenv** — variables de entorno
- **helmet** + **cors** — seguridad HTTP

## Arquitectura

Screaming Architecture — cada dominio tiene su propio módulo:

```
src/
├── app.ts                        # Entry point, middlewares, rutas
├── config/db.ts                  # Pool de conexión PostgreSQL
├── shared/                       # Middlewares y utilidades transversales
└── modules/
    ├── auth/                     # Login, JWT
    ├── customers/                # Clientes
    ├── pawns/                    # Empeños
    ├── items/                    # Artículos empeñados
    ├── categories/               # Categorías de artículos
    ├── payments/                 # Pagos de interés
    ├── sales/                    # Ventas de artículos
    ├── expenses/                 # Gastos operativos
    ├── cash-sessions/            # Sesiones de caja
    ├── movements/                # Movimientos de caja
    ├── accrued-charges/          # Cargos devengados
    ├── finances/                 # Dashboard financiero
    └── dashboard/                # Métricas operativas
```

Cada módulo sigue la cadena: `router → controller → service → repository` (SQL solo en repository).

## Requisitos

- Node.js >= 20
- npm >= 10
- PostgreSQL >= 14

## Configuración local

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/amir-rojas/toxdos-backend.git
   cd toxdos-backend
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Crear el archivo de variables de entorno:
   ```bash
   cp .env.example .env
   ```

4. Completar `.env` con los valores de tu base de datos local.

5. Iniciar en modo desarrollo:
   ```bash
   npm run dev
   ```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo con hot-reload (ts-node-dev) |
| `npm run build` | Compilar TypeScript a `dist/` |
| `npm start` | Ejecutar build compilado |

## Variables de entorno

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PORT` | Puerto del servidor | `3000` |
| `JWT_SECRET` | Secreto para firmar tokens (mín. 32 chars) | `una-clave-secreta-larga` |
| `DB_HOST` | Host de PostgreSQL | `localhost` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_USER` | Usuario de PostgreSQL | `postgres` |
| `DB_PASSWORD` | Contraseña de PostgreSQL | `postgres` |
| `DB_NAME` | Nombre de la base de datos | `pawnshop` |
| `ALLOWED_ORIGINS` | Orígenes permitidos para CORS (separados por coma) | `http://localhost:5173` |

## Endpoints

| Módulo | Prefijo |
|--------|---------|
| Auth | `/auth` |
| Caja | `/api/cash-sessions` |
| Clientes | `/api/customers` |
| Empeños | `/api/pawns` |
| Artículos | `/api/items` |
| Categorías | `/api/categories` |
| Pagos | `/api/payments` |
| Ventas | `/api/sales` |
| Gastos | `/api/expenses` |
| Movimientos | `/api/movements` |
| Cargos devengados | `/api/accrued-charges` |
| Finanzas | `/api/finances` |
| Dashboard | `/api/dashboard` |
| Health check | `/health` |

## Scripts de utilidad

```bash
# Seed usuario admin inicial
node seed-test-user.js

# Seed datos de prueba
node scripts/seed-test-data.js

# Seed masivo (carga de datos para pruebas de rendimiento)
node scripts/seed-massive.js

# Limpiar base de datos
node scripts/clean-db.js
```

## Deploy

El backend se despliega en **Render**. Configurar todas las variables de entorno del servidor apuntando a la base de datos en **Supabase**.
