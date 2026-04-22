import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../../shared/errors'
import { parsePagination, buildPaginatedResult } from '../../shared/pagination'
import { parseId } from '../../shared/parse-id'
import * as service from './pawns.service'
import type { CreateItemDto, CreatePawnDto } from './pawns.types'

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

function handleError(err: unknown, res: Response, next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message, code: err.code })
    return
  }
  next(err)
}

export async function createPawn(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as Partial<CreatePawnDto>

    if (!body.customer_id || typeof body.customer_id !== 'number') {
      res.status(400).json({ error: 'customer_id is required and must be a number', code: 'VALIDATION_ERROR' })
      return
    }
    if (!body.loan_amount || typeof body.loan_amount !== 'number' || body.loan_amount <= 0) {
      res.status(400).json({ error: 'loan_amount is required and must be > 0', code: 'VALIDATION_ERROR' })
      return
    }
    if (!body.interest_rate || typeof body.interest_rate !== 'number' || body.interest_rate <= 0) {
      res.status(400).json({ error: 'interest_rate is required and must be > 0', code: 'VALIDATION_ERROR' })
      return
    }
    if (!body.interest_type || !['daily', 'monthly'].includes(body.interest_type)) {
      res.status(400).json({ error: 'interest_type must be "daily" or "monthly"', code: 'VALIDATION_ERROR' })
      return
    }
    if (!body.start_date || !ISO_DATE_REGEX.test(body.start_date)) {
      res.status(400).json({ error: 'start_date is required in YYYY-MM-DD format', code: 'VALIDATION_ERROR' })
      return
    }
    if (!body.due_date || !ISO_DATE_REGEX.test(body.due_date)) {
      res.status(400).json({ error: 'due_date is required in YYYY-MM-DD format', code: 'VALIDATION_ERROR' })
      return
    }
    if (body.due_date <= body.start_date) {
      res.status(400).json({ error: 'due_date must be after start_date', code: 'VALIDATION_ERROR' })
      return
    }
    if (body.custody_rate !== undefined && (typeof body.custody_rate !== 'number' || body.custody_rate < 0)) {
      res.status(400).json({ error: 'custody_rate must be >= 0', code: 'VALIDATION_ERROR' })
      return
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      res.status(400).json({ error: 'At least one item is required', code: 'VALIDATION_ERROR' })
      return
    }

    for (let i = 0; i < body.items.length; i++) {
      const item = body.items[i] as Partial<CreateItemDto>
      if (!item.description || typeof item.description !== 'string' || item.description.trim() === '') {
        res.status(400).json({ error: `items[${i}].description is required`, code: 'VALIDATION_ERROR' })
        return
      }
      if (!item.appraised_value || typeof item.appraised_value !== 'number' || item.appraised_value <= 0) {
        res.status(400).json({ error: `items[${i}].appraised_value must be > 0`, code: 'VALIDATION_ERROR' })
        return
      }
    }

    const pawn = await service.createPawn(body as CreatePawnDto, req.user!)
    res.status(201).json({ data: pawn })
  } catch (err) {
    handleError(err, res, next)
  }
}

export async function getPawns(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status      = req.query['status']      as string | undefined
    const customerId  = req.query['customer_id'] ? parseId(req.query['customer_id'] as string, 'customer_id') : undefined
    const search      = req.query['search']       as string | undefined
    const overdue     = req.query['overdue'] === 'true'
    const dueDateFrom = req.query['due_date_from'] as string | undefined
    const dueDateTo   = req.query['due_date_to']   as string | undefined
    const pagination  = parsePagination(req.query)
    const { rows, total } = await service.getPawns(
      req.user!,
      { status, customerId, search, overdue: overdue || undefined, dueDateFrom, dueDateTo },
      pagination
    )
    res.status(200).json(buildPaginatedResult(rows, total, pagination))
  } catch (err) {
    handleError(err, res, next)
  }
}

export async function getPawnById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const pawnId = parseId(req.params['id'], 'pawn_id')
    const pawn = await service.getPawnById(pawnId, req.user!)
    res.status(200).json({ data: pawn })
  } catch (err) {
    handleError(err, res, next)
  }
}

export async function getPawnDebt(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const pawnId = parseId(req.params['id'], 'pawn_id')
    const debt = await service.getPawnDebt(pawnId, req.user!)
    res.status(200).json({ data: debt })
  } catch (err) {
    handleError(err, res, next)
  }
}

export async function forfeitPawn(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const pawnId = parseId(req.params['id'], 'pawn_id')
    const pawn = await service.forfeitPawn(pawnId, req.user!)
    res.status(200).json({ data: pawn })
  } catch (err) {
    handleError(err, res, next)
  }
}
