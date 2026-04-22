// TODO: configure test runner + supertest before filling in these stubs
// Service calls MUST be mocked

describe('POST /api/customers', () => {
  it.todo('returns 201 with created customer')
  it.todo('returns 400 for missing full_name')
  it.todo('returns 400 for missing id_number')
  it.todo('returns 409 when service throws ConflictError (CUSTOMER_DUPLICATE_ID)')
  it.todo('returns 401 without auth token')
})

describe('GET /api/customers', () => {
  it.todo('returns 200 with all customers')
  it.todo('returns 200 with filtered result when ?search= is provided (matches id_number or full_name)')
  it.todo('returns 401 without auth token')
})

describe('GET /api/customers/:id', () => {
  it.todo('returns 200 with customer data')
  it.todo('returns 404 when service throws NotFoundError')
  it.todo('returns 401 without auth token')
})

describe('PUT /api/customers/:id', () => {
  it.todo('returns 200 with updated customer')
  it.todo('returns 400 for empty body (no fields)')
  it.todo('returns 400 for empty string full_name')
  it.todo('returns 404 when service throws NotFoundError')
  it.todo('returns 409 when service throws ConflictError (CUSTOMER_DUPLICATE_ID)')
  it.todo('returns 401 without auth token')
})
