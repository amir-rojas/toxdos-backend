// TODO: configure test runner before filling in these stubs
// All repository calls MUST be mocked

describe('CustomersService', () => {
  describe('createCustomer', () => {
    it.todo('creates a customer successfully and returns it')
    it.todo('propagates ConflictError when id_number already exists')
  })

  describe('getCustomers', () => {
    it.todo('returns all customers when no filter is provided')
    it.todo('returns customers filtered by id_number')
    it.todo('returns empty array when no customers match')
  })

  describe('getCustomerById', () => {
    it.todo('returns the customer when found')
    it.todo('throws NotFoundError when customer does not exist')
  })

  describe('updateCustomer', () => {
    it.todo('updates the customer and returns updated record')
    it.todo('throws NotFoundError when customer does not exist')
    it.todo('propagates ConflictError when new id_number already belongs to another customer')
  })
})
