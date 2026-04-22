import type { Request, Response, NextFunction } from 'express'
import * as repository from './dashboard.repository'

export async function getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sessionId = req.query['session_id']
      ? parseInt(req.query['session_id'] as string, 10)
      : undefined
    const summary = await repository.getSummary(sessionId)
    res.status(200).json({ data: summary })
  } catch (err) {
    next(err)
  }
}
