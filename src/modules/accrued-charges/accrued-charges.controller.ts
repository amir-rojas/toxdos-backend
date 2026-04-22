import type { Request, Response, NextFunction } from 'express'
import { AppError, NotFoundError } from '../../shared/errors'
import { parsePagination, buildPaginatedResult } from '../../shared/pagination'
import { parseId } from '../../shared/parse-id'
import * as repository from './accrued-charges.repository'

function handleError(err: unknown, res: Response, next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message, code: err.code })
    return
  }
  next(err)
}

export async function runAccrual(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0] as string
    const result = await repository.runDailyAccrual(today)
    res.status(200).json({ data: result })
  } catch (err) {
    handleError(err, res, next)
  }
}

export async function getAccruedCharges(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const pawnId      = req.query['pawn_id']      ? parseId(req.query['pawn_id']      as string, 'pawn_id') : undefined
    const isCollected = req.query['is_collected'] !== undefined
      ? req.query['is_collected'] === 'true'
      : undefined
    const pagination  = parsePagination(req.query)

    const { rows, total } = await repository.findAll({ pawnId, isCollected }, pagination)
    res.status(200).json(buildPaginatedResult(rows, total, pagination))
  } catch (err) {
    handleError(err, res, next)
  }
}

export async function getAccruedChargeById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const accrualId = parseId(req.params['id'], 'accrual_id')
    const accrual = await repository.findById(accrualId)
    if (!accrual) {
      throw new NotFoundError('Accrual not found', 'ACCRUAL_NOT_FOUND')
    }
    res.status(200).json({ data: accrual })
  } catch (err) {
    handleError(err, res, next)
  }
}
