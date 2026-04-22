import type { Request, Response, NextFunction } from 'express'
import * as repository from './finances.repository'

export async function getSummary(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const summary = await repository.getSummary()
    res.status(200).json({ data: summary })
  } catch (err) {
    next(err)
  }
}
