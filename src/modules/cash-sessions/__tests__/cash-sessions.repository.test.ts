// TODO: configure test runner + real test DB before filling in these stubs
// Each test MUST clean up its inserted rows

describe('CashSessionsRepository', () => {
  describe('create', () => {
    it.todo('inserts a row and returns the created CashSession')
    it.todo('throws ConflictError (23505) when user already has an open session')
  })

  describe('findById', () => {
    it.todo('returns the session by ID')
    it.todo('returns null for a non-existent ID')
  })

  describe('findOpenByUserId', () => {
    it.todo('returns the open session for the user')
    it.todo('returns null when no open session exists for the user')
  })

  describe('findAll', () => {
    it.todo('returns all sessions ordered by opened_at DESC')
    it.todo('returns empty array when no sessions exist')
  })

  describe('closeSession', () => {
    it.todo('updates status, closing_amount, expected_amount, closed_at and returns updated row')
    it.todo('DB correctly computes difference as closing_amount - expected_amount')
    it.todo('does NOT include difference in the UPDATE SET clause (GENERATED column)')
  })

  describe('computeExpectedAmount', () => {
    it.todo('returns opening_amount when no movements exist for the session')
    it.todo('correctly sums in movements and subtracts out movements')
    it.todo('returns opening_amount + inflows when no outflows exist')
    it.todo('returns opening_amount - outflows when no inflows exist')
  })
})
