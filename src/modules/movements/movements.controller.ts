import type { Request, Response, NextFunction } from 'express'
import { AppError, NotFoundError } from '../../shared/errors'
import { parsePagination, buildPaginatedResult } from '../../shared/pagination'
import { parseId } from '../../shared/parse-id'
import * as repository from './movements.repository'

function handleError(err: unknown, res: Response, next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message, code: err.code })
    return
  }
  next(err)
}

export async function getMovements(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sessionId    = req.query['session_id']    ? parseId(req.query['session_id']    as string, 'session_id') : undefined
    const movementType = req.query['movement_type'] as string | undefined
    const category     = req.query['category']      as string | undefined
    const dateFrom     = req.query['date_from']     as string | undefined
    const dateTo       = req.query['date_to']       as string | undefined
    const pagination   = parsePagination(req.query)

    // cashiers are always scoped to their own movements; admins can filter by a specific user
    const userId = req.user!.role === 'cashier'
      ? req.user!.user_id
      : req.query['user_id'] ? parseId(req.query['user_id'] as string, 'user_id') : undefined

    const { rows, total } = await repository.findAll(
      { sessionId, movementType, category, dateFrom, dateTo, userId },
      pagination
    )
    res.status(200).json(buildPaginatedResult(rows, total, pagination))
  } catch (err) {
    handleError(err, res, next)
  }
}

export async function getMovementById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const movementId = parseId(req.params['id'], 'movement_id')
    const movement = await repository.findById(movementId)
    if (!movement) {
      throw new NotFoundError('Movement not found', 'MOVEMENT_NOT_FOUND')
    }
    res.status(200).json({ data: movement })
  } catch (err) {
    handleError(err, res, next)
  }
}
