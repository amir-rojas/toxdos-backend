import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../../shared/errors'
import { parsePagination, buildPaginatedResult } from '../../shared/pagination'
import { parseId } from '../../shared/parse-id'
import * as service from './payments.service'
import { buildVoucherHtml } from './payments.templates'
import type { CreatePaymentDto } from './payments.types'

const VALID_PAYMENT_TYPES  = ['interest', 'redemption', 'partial'] as const
const VALID_PAYMENT_METHODS = ['cash', 'transfer', 'qr'] as const

function handleError(err: unknown, res: Response, next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message, code: err.code })
    return
  }
  next(err)
}

export async function createPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as Partial<CreatePaymentDto>

    if (!body.pawn_id || typeof body.pawn_id !== 'number') {
      res.status(400).json({ error: 'pawn_id is required and must be a number', code: 'VALIDATION_ERROR' })
      return
    }
    if (!body.payment_type || !VALID_PAYMENT_TYPES.includes(body.payment_type as typeof VALID_PAYMENT_TYPES[number])) {
      res.status(400).json({ error: 'payment_type must be "interest", "redemption", or "partial"', code: 'VALIDATION_ERROR' })
      return
    }

    if (typeof body.months_paid !== 'number' || !Number.isInteger(body.months_paid) || body.months_paid < 1) {
      res.status(400).json({ error: 'months_paid is required and must be an integer >= 1', code: 'VALIDATION_ERROR' })
      return
    }

    const principalAmount = body.principal_amount ?? 0
    if (typeof principalAmount !== 'number' || principalAmount < 0) {
      res.status(400).json({ error: 'principal_amount must be >= 0', code: 'VALIDATION_ERROR' })
      return
    }

    if (body.payment_method && !VALID_PAYMENT_METHODS.includes(body.payment_method as typeof VALID_PAYMENT_METHODS[number])) {
      res.status(400).json({ error: 'payment_method must be "cash", "transfer", or "qr"', code: 'VALIDATION_ERROR' })
      return
    }

    const payment = await service.createPayment(body as CreatePaymentDto, req.user!)
    res.status(201).json({ data: payment })
  } catch (err) {
    handleError(err, res, next)
  }
}

export async function getPayments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const pawnId    = req.query['pawn_id']    ? parseId(req.query['pawn_id']    as string, 'pawn_id')    : undefined
    const sessionId = req.query['session_id'] ? parseId(req.query['session_id'] as string, 'session_id') : undefined

    const rawType   = req.query['payment_type']   as string | undefined
    const rawMethod = req.query['payment_method'] as string | undefined

    if (rawType && !VALID_PAYMENT_TYPES.includes(rawType as typeof VALID_PAYMENT_TYPES[number])) {
      res.status(400).json({ error: 'Invalid payment_type filter', code: 'VALIDATION_ERROR' })
      return
    }
    if (rawMethod && !VALID_PAYMENT_METHODS.includes(rawMethod as typeof VALID_PAYMENT_METHODS[number])) {
      res.status(400).json({ error: 'Invalid payment_method filter', code: 'VALIDATION_ERROR' })
      return
    }

    const search        = (req.query['search']     as string | undefined)?.trim() || undefined
    const paymentType   = rawType   as 'interest' | 'redemption' | 'partial' | undefined
    const paymentMethod = rawMethod as 'cash' | 'transfer' | 'qr' | undefined
    const paidFrom      = (req.query['paid_from']  as string | undefined) || undefined
    const paidTo        = (req.query['paid_to']    as string | undefined) || undefined

    const pagination = parsePagination(req.query)
    const { rows, total, stats } = await service.getPayments(
      req.user!,
      { pawnId, sessionId, search, paymentType, paymentMethod, paidFrom, paidTo },
      pagination
    )
    res.status(200).json({ ...buildPaginatedResult(rows, total, pagination), stats })
  } catch (err) {
    handleError(err, res, next)
  }
}

export async function getPaymentById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const paymentId = parseId(req.params['id'], 'payment_id')
    const payment = await service.getPaymentById(paymentId)
    res.status(200).json({ data: payment })
  } catch (err) {
    handleError(err, res, next)
  }
}

export async function getPaymentVoucher(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const paymentId = parseId(req.params['id'], 'payment_id')
    const payment = await service.getPaymentForVoucher(paymentId)
    const html = buildVoucherHtml({
      customerName:      payment.customer_name,
      customerIdNumber:  payment.customer_id_number,
      paidAt:            payment.paid_at,
      pawnDueDate:       payment.pawn_due_date,
      monthsPaid:        payment.months_paid,
    })
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.send(html)
  } catch (err) {
    handleError(err, res, next)
  }
}
