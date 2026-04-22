import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../../shared/errors'
import { parsePagination, buildPaginatedResult } from '../../shared/pagination'
import { parseId } from '../../shared/parse-id'
import * as service from './sales.service'
import type { CreateSaleDto } from './sales.types'

const VALID_PAYMENT_METHODS = ['cash', 'transfer', 'qr'] as const

function handleError(err: unknown, res: Response, next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message, code: err.code })
    return
  }
  next(err)
}

export async function createSale(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as Partial<CreateSaleDto>

    if (!body.item_id || typeof body.item_id !== 'number') {
      res.status(400).json({ error: 'item_id is required and must be a number', code: 'VALIDATION_ERROR' })
      return
    }
    if (!body.sale_price || typeof body.sale_price !== 'number' || body.sale_price <= 0) {
      res.status(400).json({ error: 'sale_price must be > 0', code: 'VALIDATION_ERROR' })
      return
    }
    if (body.payment_method && !VALID_PAYMENT_METHODS.includes(body.payment_method as typeof VALID_PAYMENT_METHODS[number])) {
      res.status(400).json({ error: 'payment_method must be "cash", "transfer", or "qr"', code: 'VALIDATION_ERROR' })
      return
    }

    const sale = await service.createSale(body as CreateSaleDto, req.user!)
    res.status(201).json({ data: sale })
  } catch (err) {
    handleError(err, res, next)
  }
}

export async function getSales(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sessionId = req.query['session_id'] ? parseId(req.query['session_id'] as string, 'session_id') : undefined
    const pagination = parsePagination(req.query)
    const { rows, total } = await service.getSales(req.user!, { sessionId }, pagination)
    res.status(200).json(buildPaginatedResult(rows, total, pagination))
  } catch (err) {
    handleError(err, res, next)
  }
}

export async function getSaleById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const saleId = parseId(req.params['id'], 'sale_id')
    const sale = await service.getSaleById(saleId)
    res.status(200).json({ data: sale })
  } catch (err) {
    handleError(err, res, next)
  }
}
