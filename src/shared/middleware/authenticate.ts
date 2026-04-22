import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { findById } from '../../modules/auth/auth.repository'
import type { JwtPayload } from '../../modules/auth/auth.types'

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers['authorization']

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' })
    return
  }

  const token = authHeader.slice(7)

  try {
    const secret = process.env['JWT_SECRET'] as string
    const payload = jwt.verify(token, secret, { algorithms: ['HS256'] }) as unknown as JwtPayload

    const user = await findById(payload.sub)

    if (!user) {
      res.status(401).json({ error: 'User not found' })
      return
    }

    if (!user.is_active) {
      res.status(403).json({ error: 'Account is inactive' })
      return
    }

    req.user = { user_id: user.user_id, full_name: user.full_name, email: user.email, role: user.role }
    next()
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' })
      return
    }
    res.status(401).json({ error: 'Invalid token' })
  }
}
