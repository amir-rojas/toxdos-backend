import { findOpenByUserId } from '../cash-sessions/cash-sessions.repository'
import { findById as findCustomerById } from '../customers/customers.repository'
import { BadRequestError, ForbiddenError, NotFoundError, UnprocessableError } from '../../shared/errors'
import type { PaginationParams } from '../../shared/pagination'
import type { UserProfile } from '../auth/auth.types'
import * as repository from './pawns.repository'
import type { CreatePawnDto, Pawn, PawnWithItems } from './pawns.types'

export async function createPawn(
  dto: CreatePawnDto,
  requestingUser: UserProfile
): Promise<PawnWithItems> {
  // BR-1: require open session
  const session = await findOpenByUserId(requestingUser.user_id)
  if (!session) {
    throw new UnprocessableError(
      'No open cash session. Open a session before creating a pawn.',
      'NO_OPEN_SESSION'
    )
  }

  // BR-customer: verify customer exists
  const customer = await findCustomerById(dto.customer_id)
  if (!customer) {
    throw new NotFoundError('Customer not found', 'CUSTOMER_NOT_FOUND')
  }

  return repository.createPawn(dto, requestingUser.user_id, session.session_id)
}

export async function getPawns(
  requestingUser: UserProfile,
  filters: { status?: string; customerId?: number; search?: string; overdue?: boolean; dueDateFrom?: string; dueDateTo?: string },
  pagination: PaginationParams
): Promise<{ rows: Pawn[]; total: number }> {
  const repoFilters: { userId?: number; status?: string; customerId?: number; search?: string; overdue?: boolean; dueDateFrom?: string; dueDateTo?: string } = {
    status: filters.status,
    customerId: filters.customerId,
    search: filters.search,
    overdue: filters.overdue,
    dueDateFrom: filters.dueDateFrom,
    dueDateTo: filters.dueDateTo,
  }

  // Cashiers see only their own pawns
  if (requestingUser.role === 'cashier') {
    repoFilters.userId = requestingUser.user_id
  }

  return repository.findAll(repoFilters, pagination)
}

export async function getPawnDebt(
  pawnId: number,
  requestingUser: UserProfile
): Promise<{ interest_amount: number; custody_amount: number; loan_amount: number }> {
  const pawn = await repository.findById(pawnId)
  if (!pawn) {
    throw new NotFoundError('Pawn not found', 'PAWN_NOT_FOUND')
  }
  if (requestingUser.role !== 'admin' && pawn.user_id !== requestingUser.user_id) {
    throw new ForbiddenError('You do not have permission to view this pawn', 'FORBIDDEN')
  }
  const debt = await repository.findDebt(pawnId)
  if (!debt) {
    throw new NotFoundError('Pawn not found', 'PAWN_NOT_FOUND')
  }
  return debt
}

export async function getPawnById(
  pawnId: number,
  requestingUser: UserProfile
): Promise<PawnWithItems> {
  const pawn = await repository.findWithItems(pawnId)
  if (!pawn) {
    throw new NotFoundError('Pawn not found', 'PAWN_NOT_FOUND')
  }

  if (requestingUser.role !== 'admin' && pawn.user_id !== requestingUser.user_id) {
    throw new ForbiddenError('You do not have permission to view this pawn', 'FORBIDDEN')
  }

  return pawn
}

export async function forfeitPawn(
  pawnId: number,
  requestingUser: UserProfile
): Promise<PawnWithItems> {
  if (requestingUser.role !== 'admin') {
    throw new ForbiddenError('Only admins can forfeit pawns', 'FORBIDDEN')
  }

  const pawn = await repository.findById(pawnId)
  if (!pawn) {
    throw new NotFoundError('Pawn not found', 'PAWN_NOT_FOUND')
  }

  if (pawn.status !== 'active') {
    throw new BadRequestError(
      `Pawn cannot be forfeited: current status is '${pawn.status}'`,
      'INVALID_PAWN_STATUS'
    )
  }

  const today = new Date().toISOString().slice(0, 10)
  if (pawn.due_date >= today) {
    throw new BadRequestError(
      'Pawn cannot be forfeited before its due date',
      'PAWN_NOT_OVERDUE'
    )
  }

  return repository.forfeit(pawnId)
}
