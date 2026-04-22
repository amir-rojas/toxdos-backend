import { findOpenByUserId } from '../cash-sessions/cash-sessions.repository'
import { NotFoundError, UnprocessableError } from '../../shared/errors'
import type { PaginationParams } from '../../shared/pagination'
import type { UserProfile } from '../auth/auth.types'
import * as repository from './expenses.repository'
import type { CreateExpenseDto, Expense } from './expenses.types'

export async function createExpense(
  dto: CreateExpenseDto,
  requestingUser: UserProfile
): Promise<Expense> {
  const session = await findOpenByUserId(requestingUser.user_id)
  if (!session) {
    throw new UnprocessableError(
      'No open cash session. Open a session before registering an expense.',
      'NO_OPEN_SESSION'
    )
  }

  return repository.create({
    sessionId: session.session_id,
    userId:    requestingUser.user_id,
    concept:   dto.concept,
    amount:    dto.amount,
  })
}

export async function getExpenses(
  requestingUser: UserProfile,
  filters: { sessionId?: number; dateFrom?: string; dateTo?: string },
  pagination: PaginationParams
): Promise<{ rows: Expense[]; total: number }> {
  return repository.findAll(
    {
      sessionId: filters.sessionId,
      userId: requestingUser.role === 'cashier' ? requestingUser.user_id : undefined,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    },
    pagination
  )
}

export async function getExpenseById(expenseId: number): Promise<Expense> {
  const expense = await repository.findById(expenseId)
  if (!expense) {
    throw new NotFoundError('Expense not found', 'EXPENSE_NOT_FOUND')
  }
  return expense
}
