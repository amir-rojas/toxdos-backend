import type { Request, Response, NextFunction, RequestHandler } from 'express'
import type { UserRole } from '../../modules/auth/auth.types'

export function authorize(role: UserRole): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    if (req.user.role !== role) {
      res.status(403).json({ error: 'Insufficient permissions' })
      return
    }

    next()
  }
}
