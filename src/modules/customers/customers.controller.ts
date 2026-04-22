import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../../shared/errors'
import { parsePagination, buildPaginatedResult } from '../../shared/pagination'
import { parseId } from '../../shared/parse-id'
import * as service from './customers.service'
import type { CreateCustomerDto, UpdateCustomerDto } from './customers.types'

function handleError(err: unknown, res: Response, next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message, code: err.code })
    return
  }
  next(err)
}

export async function createCustomer(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { full_name, id_number, phone, address } = req.body as Partial<CreateCustomerDto>

    if (!full_name || typeof full_name !== 'string' || full_name.trim() === '') {
      res.status(400).json({ error: 'full_name is required', code: 'VALIDATION_ERROR' })
      return
    }
    if (!id_number || typeof id_number !== 'string' || id_number.trim() === '') {
      res.status(400).json({ error: 'id_number is required', code: 'VALIDATION_ERROR' })
      return
    }

    const customer = await service.createCustomer({ full_name, id_number, phone, address })
    res.status(201).json({ data: customer })
  } catch (err) {
    handleError(err, res, next)
  }
}

export async function getCustomers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const search = req.query['search'] as string | undefined

    // Search path (combobox): returns plain array, no pagination
    if (search) {
      const customers = await service.getCustomers({ search })
      res.status(200).json({ data: customers })
      return
    }

    // Full list path: paginated
    const pagination = parsePagination(req.query)
    const { rows, total } = await service.getCustomers(undefined, pagination)
    res.status(200).json(buildPaginatedResult(rows, total, pagination))
  } catch (err) {
    handleError(err, res, next)
  }
}

export async function getCustomerById(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const customerId = parseId(req.params['id'], 'customer_id')
    const customer = await service.getCustomerById(customerId)
    res.status(200).json({ data: customer })
  } catch (err) {
    handleError(err, res, next)
  }
}

export async function updateCustomer(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const customerId = parseId(req.params['id'], 'customer_id')
    const { full_name, id_number, phone, address } = req.body as Partial<UpdateCustomerDto>

    const hasFields =
      full_name !== undefined ||
      id_number !== undefined ||
      phone !== undefined ||
      address !== undefined

    if (!hasFields) {
      res
        .status(400)
        .json({ error: 'At least one field is required to update', code: 'VALIDATION_ERROR' })
      return
    }

    if (full_name !== undefined && (typeof full_name !== 'string' || full_name.trim() === '')) {
      res.status(400).json({ error: 'full_name must be a non-empty string', code: 'VALIDATION_ERROR' })
      return
    }
    if (id_number !== undefined && (typeof id_number !== 'string' || id_number.trim() === '')) {
      res.status(400).json({ error: 'id_number must be a non-empty string', code: 'VALIDATION_ERROR' })
      return
    }

    const dto: UpdateCustomerDto = {}
    if (full_name !== undefined) dto.full_name = full_name
    if (id_number !== undefined) dto.id_number = id_number
    if (phone     !== undefined) dto.phone     = phone
    if (address   !== undefined) dto.address   = address

    const customer = await service.updateCustomer(customerId, dto)
    res.status(200).json({ data: customer })
  } catch (err) {
    handleError(err, res, next)
  }
}
