// TODO: configure test runner + supertest before filling in these stubs
// Service calls MUST be mocked in these tests

describe('POST /api/cash-sessions', () => {
  it.todo('returns 201 with created session on success')
  it.todo('returns 400 for missing opening_amount')
  it.todo('returns 400 for negative opening_amount')
  it.todo('returns 400 for non-numeric opening_amount')
  it.todo('returns 409 when service throws ConflictError (SESSION_ALREADY_OPEN)')
  it.todo('returns 401 without auth token')
})

describe('POST /api/cash-sessions/:id/close', () => {
  it.todo('returns 200 with closed session on success')
  it.todo('returns 400 for missing closing_amount')
  it.todo('returns 400 for negative closing_amount')
  it.todo('returns 400 when service throws BadRequestError (SESSION_ALREADY_CLOSED)')
  it.todo('returns 403 when service throws ForbiddenError')
  it.todo('returns 404 when service throws NotFoundError')
  it.todo('returns 401 without auth token')
})

describe('GET /api/cash-sessions/current', () => {
  it.todo('returns 200 with current open session')
  it.todo('returns 404 when service throws NotFoundError (no open session)')
  it.todo('returns 401 without auth token')
})

describe('GET /api/cash-sessions/:id', () => {
  it.todo('returns 200 with session for owner')
  it.todo('returns 200 with session for admin')
  it.todo('returns 403 when service throws ForbiddenError (unauthorized cashier)')
  it.todo('returns 404 when service throws NotFoundError')
  it.todo('returns 401 without auth token')
})

describe('GET /api/cash-sessions', () => {
  it.todo('returns 200 with all sessions for admin role')
  it.todo('returns 403 for cashier role (authorize middleware)')
  it.todo('returns 401 without auth token')
})
