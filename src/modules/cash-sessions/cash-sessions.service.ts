import { NotFoundError, ForbiddenError, BadRequestError } from '../../shared/errors'
import type { PaginationParams } from '../../shared/pagination'
import type { UserProfile } from '../auth/auth.types'
import * as repository from './cash-sessions.repository'
import type { CashSession, OpenSessionDto, CloseSessionDto } from './cash-sessions.types'

export async function openSession(userId: number, dto: OpenSessionDto): Promise<CashSession> {
  // ConflictError from repository propagates as-is (BR-1)
  return repository.create(userId, dto.opening_amount)
}

export async function closeSession(
  sessionId: number,
  dto: CloseSessionDto,
  requestingUser: UserProfile
): Promise<CashSession> {
  const session = await repository.findById(sessionId)
  if (!session) {
    throw new NotFoundError('Cash session not found', 'SESSION_NOT_FOUND')
  }

  // BR-2: owner or admin
  if (session.user_id !== requestingUser.user_id && requestingUser.role !== 'admin') {
    throw new ForbiddenError('You do not have permission to close this session', 'FORBIDDEN')
  }

  // BR-3: must be open
  if (session.status !== 'open') {
    throw new BadRequestError('Cash session is already closed', 'SESSION_ALREADY_CLOSED')
  }

  // BR-4: compute expected_amount via repository
  const expectedAmount = await repository.computeExpectedAmount(
    sessionId,
    parseFloat(session.opening_amount)
  )

  return repository.closeSession(sessionId, dto.closing_amount, expectedAmount)
}

export async function getCurrentSession(userId: number): Promise<CashSession> {
  const session = await repository.findOpenByUserId(userId)
  if (!session) {
    throw new NotFoundError('No open cash session found', 'SESSION_NOT_FOUND')
  }
  return session
}

export async function getSessionById(
  sessionId: number,
  requestingUser: UserProfile
): Promise<CashSession> {
  const session = await repository.findById(sessionId)
  if (!session) {
    throw new NotFoundError('Cash session not found', 'SESSION_NOT_FOUND')
  }

  // BR-2: owner or admin
  if (session.user_id !== requestingUser.user_id && requestingUser.role !== 'admin') {
    throw new ForbiddenError('You do not have permission to view this session', 'FORBIDDEN')
  }

  return session
}

export async function getAllSessions(
  pagination: PaginationParams
): Promise<{ rows: CashSession[]; total: number }> {
  return repository.findAll(pagination)
}
