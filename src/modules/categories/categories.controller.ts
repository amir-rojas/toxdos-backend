import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../../shared/errors'
import * as repository from './categories.repository'

function handleError(err: unknown, res: Response, next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message, code: err.code })
    return
  }
  next(err)
}

export async function getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categories = await repository.findAll()
    res.status(200).json({ data: categories })
  } catch (err) {
    handleError(err, res, next)
  }
}

export async function createCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name } = req.body as { name?: unknown }

    if (!name || typeof name !== 'string' || name.trim() === '') {
      res.status(400).json({ error: 'name is required', code: 'VALIDATION_ERROR' })
      return
    }

    const category = await repository.create(name.trim())
    res.status(201).json({ data: category })
  } catch (err) {
    handleError(err, res, next)
  }
}
