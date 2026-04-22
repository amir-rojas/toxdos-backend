// TODO: configure test runner + real test DB before filling in these stubs
// Each test MUST clean up its inserted rows

describe('CustomersRepository', () => {
  describe('create', () => {
    it.todo('inserts a customer and returns the created record')
    it.todo('throws ConflictError (23505) when id_number is already taken')
  })

  describe('findById', () => {
    it.todo('returns the customer by ID')
    it.todo('returns null for a non-existent ID')
  })

  describe('findAll', () => {
    it.todo('returns all customers ordered by full_name ASC')
    it.todo('returns empty array when no customers exist')
    it.todo('filters by id_number when search matches (case-insensitive, contains)')
    it.todo('filters by full_name when search matches (case-insensitive, contains)')
    it.todo('returns empty array when search has no match')
  })

  describe('update', () => {
    it.todo('updates only the fields provided, leaves others unchanged')
    it.todo('throws ConflictError (23505) when new id_number is already taken')
  })
})
