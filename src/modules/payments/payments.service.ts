import { findOpenByUserId } from '../cash-sessions/cash-sessions.repository'
import { findById as findPawnById, findDebt } from '../pawns/pawns.repository'
import { BadRequestError, NotFoundError, UnprocessableError } from '../../shared/errors'
import type { PaginationParams } from '../../shared/pagination'
import type { UserProfile } from '../auth/auth.types'
import * as repository from './payments.repository'
import type { CreatePaymentDto, Payment, PaymentForVoucher } from './payments.types'

export async function createPayment(
  dto: CreatePaymentDto,
  requestingUser: UserProfile
): Promise<Payment> {
  // BR-1: require open session
  const session = await findOpenByUserId(requestingUser.user_id)
  if (!session) {
    throw new UnprocessableError(
      'No open cash session. Open a session before registering a payment.',
      'NO_OPEN_SESSION'
    )
  }

  // BR-2: pawn must exist
  const pawn = await findPawnById(dto.pawn_id)
  if (!pawn) {
    throw new NotFoundError('Pawn not found', 'PAWN_NOT_FOUND')
  }

  // BR-3: pawn must be active or renewed
  if (pawn.status !== 'active' && pawn.status !== 'renewed') {
    throw new BadRequestError(
      'Pawn is not active and cannot receive payments',
      'PAWN_NOT_PAYABLE'
    )
  }

  // BR-4: validate months_paid against blocks_due
  const debt = await findDebt(dto.pawn_id)
  if (!debt) {
    throw new NotFoundError('Pawn debt information not found', 'PAWN_NOT_FOUND')
  }
  if (dto.months_paid > debt.blocks_due) {
    throw new BadRequestError(
      `months_paid (${dto.months_paid}) exceeds blocks due (${debt.blocks_due})`,
      'MONTHS_PAID_EXCEEDS_BLOCKS_DUE'
    )
  }

  // BR-5: redemptions always charge all overdue blocks — ignore user-supplied months_paid
  const monthsPaid = dto.payment_type === 'redemption' ? debt.blocks_due : dto.months_paid

  const interestAmount  = debt.interest_per_block * monthsPaid
  const custodyAmount   = debt.custody_per_block  * monthsPaid
  const principalAmount = dto.principal_amount ?? 0

  const movementCategory: 'interest_payment' | 'redemption' =
    dto.payment_type === 'redemption' ? 'redemption' : 'interest_payment'

  const isRedemption = dto.payment_type === 'redemption'

  // Redemption: single movement with full total; interest-only: split into separate movements
  const movementAmount = isRedemption
    ? interestAmount + custodyAmount + principalAmount
    : interestAmount

  return repository.create({
    pawnId:        dto.pawn_id,
    sessionId:     session.session_id,
    userId:        requestingUser.user_id,
    interestAmount,
    custodyAmount,
    principalAmount,
    monthsPaid,
    dueDate:       pawn.due_date,
    paymentType:   dto.payment_type,
    paymentMethod: dto.payment_method ?? 'cash',
    movementCategory,
    movementAmount,
    isRedemption,
  })
}

export async function getPayments(
  requestingUser: UserProfile,
  filters: {
    pawnId?: number
    sessionId?: number
    search?: string
    paymentType?: 'interest' | 'redemption' | 'partial'
    paymentMethod?: 'cash' | 'transfer' | 'qr'
    paidFrom?: string
    paidTo?: string
  },
  pagination: PaginationParams
): Promise<{ rows: Payment[]; total: number; stats: { collected_today: string; count_today: number } }> {
  const repoFilters: Parameters<typeof repository.findAll>[0] = {
    pawnId:        filters.pawnId,
    sessionId:     filters.sessionId,
    search:        filters.search,
    paymentType:   filters.paymentType,
    paymentMethod: filters.paymentMethod,
    paidFrom:      filters.paidFrom,
    paidTo:        filters.paidTo,
  }

  if (requestingUser.role === 'cashier') {
    repoFilters.userId = requestingUser.user_id
  }

  return repository.findAll(repoFilters, pagination)
}

export async function getPaymentById(paymentId: number): Promise<Payment> {
  const payment = await repository.findById(paymentId)
  if (!payment) {
    throw new NotFoundError('Payment not found', 'PAYMENT_NOT_FOUND')
  }
  return payment
}

export async function getPaymentForVoucher(paymentId: number): Promise<PaymentForVoucher> {
  const payment = await repository.findForVoucher(paymentId)
  if (!payment) {
    throw new NotFoundError('Payment not found', 'PAYMENT_NOT_FOUND')
  }
  if (payment.payment_type !== 'interest') {
    throw new BadRequestError('Voucher is only available for interest payments', 'INVALID_PAYMENT_TYPE')
  }
  return payment
}
