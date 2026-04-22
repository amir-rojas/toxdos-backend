import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../../shared/errors'
import { parsePagination, buildPaginatedResult } from '../../shared/pagination'
import { parseId } from '../../shared/parse-id'
import * as service from './expenses.service'
import type { CreateExpenseDto } from './expenses.types'

function handleError(err: unknown, res: Response, next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message, code: err.code })
    return
  }
  next(err)
}

export async function createExpense(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { concept, amount } = req.body as Partial<CreateExpenseDto>

    if (!concept || typeof concept !== 'string' || concept.trim() === '') {
      res.status(400).json({ error: 'concept is required', code: 'VALIDATION_ERROR' })
      return
    }
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      res.status(400).json({ error: 'amount must be > 0', code: 'VALIDATION_ERROR' })
      return
    }

    const expense = await service.createExpense({ concept: concept.trim(), amount }, req.user!)
    res.status(201).json({ data: expense })
  } catch (err) {
    handleError(err, res, next)
  }
}

export async function getExpenses(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sessionId = req.query['session_id'] ? parseId(req.query['session_id'] as string, 'session_id') : undefined
    const dateFrom = req.query['date_from'] as string | undefined
    const dateTo   = req.query['date_to']   as string | undefined
    const pagination = parsePagination(req.query)
    const { rows, total } = await service.getExpenses(req.user!, { sessionId, dateFrom, dateTo }, pagination)
    res.status(200).json(buildPaginatedResult(rows, total, pagination))
  } catch (err) {
    handleError(err, res, next)
  }
}

export async function getExpenseById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const expenseId = parseId(req.params['id'], 'expense_id')
    const expense = await service.getExpenseById(expenseId)
    res.status(200).json({ data: expense })
  } catch (err) {
    handleError(err, res, next)
  }
}
