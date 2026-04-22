import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../../shared/errors'
import { parsePagination, buildPaginatedResult } from '../../shared/pagination'
import { parseId } from '../../shared/parse-id'
import * as service from './cash-sessions.service'
import type { CloseSessionDto, OpenSessionDto } from './cash-sessions.types'

function handleError(err: unknown, res: Response, next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message, code: err.code })
    return
  }
  next(err)
}

export async function openSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { opening_amount } = req.body as Partial<OpenSessionDto>

    if (opening_amount === undefined || opening_amount === null) {
      res.status(400).json({ error: 'opening_amount is required', code: 'VALIDATION_ERROR' })
      return
    }
    if (typeof opening_amount !== 'number') {
      res.status(400).json({ error: 'opening_amount must be a number', code: 'VALIDATION_ERROR' })
      return
    }
    if (opening_amount < 0) {
      res.status(400).json({ error: 'opening_amount must be >= 0', code: 'VALIDATION_ERROR' })
      return
    }

    const session = await service.openSession(req.user!.user_id, { opening_amount })
    res.status(201).json({ data: session })
  } catch (err) {
    handleError(err, res, next)
  }
}

export async function closeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sessionId = parseId(req.params['id'], 'session_id')
    const { closing_amount } = req.body as Partial<CloseSessionDto>

    if (closing_amount === undefined || closing_amount === null) {
      res.status(400).json({ error: 'closing_amount is required', code: 'VALIDATION_ERROR' })
      return
    }
    if (typeof closing_amount !== 'number') {
      res.status(400).json({ error: 'closing_amount must be a number', code: 'VALIDATION_ERROR' })
      return
    }
    if (closing_amount < 0) {
      res.status(400).json({ error: 'closing_amount must be >= 0', code: 'VALIDATION_ERROR' })
      return
    }

    const session = await service.closeSession(sessionId, { closing_amount }, req.user!)
    res.status(200).json({ data: session })
  } catch (err) {
    handleError(err, res, next)
  }
}

export async function getCurrentSession(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session = await service.getCurrentSession(req.user!.user_id)
    res.status(200).json({ data: session })
  } catch (err) {
    handleError(err, res, next)
  }
}

export async function getSessionById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sessionId = parseId(req.params['id'], 'session_id')
    const session = await service.getSessionById(sessionId, req.user!)
    res.status(200).json({ data: session })
  } catch (err) {
    handleError(err, res, next)
  }
}

export async function getAllSessions(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const pagination = parsePagination(req.query)
    const { rows, total } = await service.getAllSessions(pagination)
    res.status(200).json(buildPaginatedResult(rows, total, pagination))
  } catch (err) {
    handleError(err, res, next)
  }
}
