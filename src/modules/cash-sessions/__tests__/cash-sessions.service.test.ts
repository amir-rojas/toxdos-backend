// TODO: configure test runner (Jest/Vitest) before filling in these stubs
// All repository calls MUST be mocked in these tests

describe('CashSessionsService', () => {
  describe('openSession', () => {
    it.todo('opens a session successfully and returns the created CashSession')
    it.todo('propagates ConflictError when user already has an open session')
  })

  describe('closeSession', () => {
    it.todo('closes a session successfully as the owner')
    it.todo('closes a session successfully as an admin (any session)')
    it.todo('throws NotFoundError when session does not exist')
    it.todo('throws ForbiddenError when cashier tries to close another user session')
    it.todo('throws BadRequestError when session is already closed')
    it.todo('calls computeExpectedAmount with correct sessionId and opening_amount')
    it.todo('passes correct arguments to repository.closeSession')
  })

  describe('getCurrentSession', () => {
    it.todo('returns the open session for the authenticated user')
    it.todo('throws NotFoundError when no open session exists')
  })

  describe('getSessionById', () => {
    it.todo('returns the session when requested by owner')
    it.todo('returns the session when requested by admin')
    it.todo('throws NotFoundError when session does not exist')
    it.todo('throws ForbiddenError when cashier requests another user session')
  })

  describe('getAllSessions', () => {
    it.todo('returns all sessions')
    it.todo('returns empty array when no sessions exist')
  })
})
