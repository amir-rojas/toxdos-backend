import type { Request, Response, NextFunction } from 'express'
import { AppError, NotFoundError } from '../../shared/errors'
import { parsePagination, buildPaginatedResult } from '../../shared/pagination'
import { parseId } from '../../shared/parse-id'
import * as repository from './items.repository'

function handleError(err: unknown, res: Response, next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message, code: err.code })
    return
  }
  next(err)
}

export async function getItems(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status     = req.query['status']   as string | undefined
    const pawnId     = req.query['pawn_id']  ? parseId(req.query['pawn_id'] as string, 'pawn_id') : undefined
    const pagination = parsePagination(req.query)
    const { rows, total } = await repository.findAll({ status, pawnId }, pagination)
    res.status(200).json(buildPaginatedResult(rows, total, pagination))
  } catch (err) {
    handleError(err, res, next)
  }
}

export async function getItemById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const itemId = parseId(req.params['id'], 'item_id')
    const item = await repository.findById(itemId)
    if (!item) {
      throw new NotFoundError('Item not found', 'ITEM_NOT_FOUND')
    }
    res.status(200).json({ data: item })
  } catch (err) {
    handleError(err, res, next)
  }
}
