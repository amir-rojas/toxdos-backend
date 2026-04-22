import 'dotenv/config'
import path from 'path'
import fs from 'fs'
import express, { type Request, type Response, type NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { connectDB } from './config/db'
import authRouter from './modules/auth/auth.router'
import cashSessionsRouter from './modules/cash-sessions/cash-sessions.router'
import customersRouter from './modules/customers/customers.router'
import categoriesRouter from './modules/categories/categories.router'
import itemsRouter from './modules/items/items.router'
import pawnsRouter from './modules/pawns/pawns.router'
import paymentsRouter from './modules/payments/payments.router'
import expensesRouter from './modules/expenses/expenses.router'
import salesRouter from './modules/sales/sales.router'
import movementsRouter from './modules/movements/movements.router'
import accruedChargesRouter from './modules/accrued-charges/accrued-charges.router'
import financesRouter from './modules/finances/finances.router'
import dashboardRouter from './modules/dashboard/dashboard.router'

// Fail fast: JWT_SECRET must be present and strong before anything starts
const jwtSecret = process.env['JWT_SECRET']
if (!jwtSecret) {
  console.error('FATAL: JWT_SECRET environment variable is required')
  process.exit(1)
}
if (jwtSecret.length < 32) {
  console.error('FATAL: JWT_SECRET must be at least 32 characters')
  process.exit(1)
}

const FRONTEND_DIST = path.join(__dirname, '../../pawn-pos-frontend/dist')
const serveFrontend = fs.existsSync(FRONTEND_DIST)

const app = express()

const corsOptions = {
  origin: process.env['ALLOWED_ORIGINS']?.split(',').map(o => o.trim()) ?? 'http://localhost:5173',
}

// cors must run before helmet so its headers aren't overridden
app.use(cors(corsOptions))
app.options('*', cors(corsOptions))  // explicit preflight for all routes
app.use(helmet())
app.use(express.json())

// Serve built frontend — only active when dist/ exists (demo/production mode)
if (serveFrontend) {
  app.use(express.static(FRONTEND_DIST))
}

app.get('/health', (_, res) => res.json({ status: 'ok' }))
app.use('/auth', authRouter)
app.use('/api/cash-sessions', cashSessionsRouter)
app.use('/api/customers', customersRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/items', itemsRouter)
app.use('/api/pawns', pawnsRouter)
app.use('/api/payments', paymentsRouter)
app.use('/api/expenses', expensesRouter)
app.use('/api/sales', salesRouter)
app.use('/api/movements', movementsRouter)
app.use('/api/accrued-charges', accruedChargesRouter)
app.use('/api/finances', financesRouter)
app.use('/api/dashboard', dashboardRouter)

// Global error handler — must be after all routes
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

// SPA fallback — must be last, only in demo/production mode
if (serveFrontend) {
  app.get('/{*path}', (_req: Request, res: Response) => {
    res.sendFile(path.join(FRONTEND_DIST, 'index.html'))
  })
}

const PORT = process.env['PORT'] ?? 3000

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
  })
  .catch((err: unknown) => {
    console.error('Failed to connect to database:', err)
    process.exit(1)
  })
