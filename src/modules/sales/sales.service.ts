import { findOpenByUserId } from '../cash-sessions/cash-sessions.repository'
import { findById as findItemById } from '../items/items.repository'
import { BadRequestError, NotFoundError, UnprocessableError } from '../../shared/errors'
import type { PaginationParams } from '../../shared/pagination'
import type { UserProfile } from '../auth/auth.types'
import * as repository from './sales.repository'
import type { CreateSaleDto, Sale } from './sales.types'

export async function createSale(
  dto: CreateSaleDto,
  requestingUser: UserProfile
): Promise<Sale> {
  const session = await findOpenByUserId(requestingUser.user_id)
  if (!session) {
    throw new UnprocessableError(
      'No open cash session. Open a session before registering a sale.',
      'NO_OPEN_SESSION'
    )
  }

  const item = await findItemById(dto.item_id)
  if (!item) {
    throw new NotFoundError('Item not found', 'ITEM_NOT_FOUND')
  }

  if (item.status !== 'available_for_sale') {
    throw new BadRequestError('Item is not available for sale', 'ITEM_NOT_FOR_SALE')
  }

  return repository.create({
    itemId:          dto.item_id,
    sessionId:       session.session_id,
    userId:          requestingUser.user_id,
    buyerCustomerId: dto.buyer_customer_id ?? null,
    salePrice:       dto.sale_price,
    paymentMethod:   dto.payment_method ?? 'cash',
  })
}

export async function getSales(
  requestingUser: UserProfile,
  filters: { sessionId?: number },
  pagination: PaginationParams
): Promise<{ rows: Sale[]; total: number }> {
  return repository.findAll(
    {
      sessionId: filters.sessionId,
      userId: requestingUser.role === 'cashier' ? requestingUser.user_id : undefined,
    },
    pagination
  )
}

export async function getSaleById(saleId: number): Promise<Sale> {
  const sale = await repository.findById(saleId)
  if (!sale) {
    throw new NotFoundError('Sale not found', 'SALE_NOT_FOUND')
  }
  return sale
}
