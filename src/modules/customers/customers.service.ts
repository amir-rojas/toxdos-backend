import { NotFoundError } from '../../shared/errors'
import type { PaginationParams } from '../../shared/pagination'
import * as repository from './customers.repository'
import type { CreateCustomerDto, Customer, UpdateCustomerDto } from './customers.types'

export async function createCustomer(dto: CreateCustomerDto): Promise<Customer> {
  return repository.create(dto)
}

export async function getCustomers(filters?: { search?: string }): Promise<Customer[]>
export async function getCustomers(
  filters: undefined,
  pagination: PaginationParams
): Promise<{ rows: Customer[]; total: number }>
export async function getCustomers(
  filters?: { search?: string },
  pagination?: PaginationParams
): Promise<Customer[] | { rows: Customer[]; total: number }> {
  return repository.findAll(filters, pagination) as Promise<Customer[] | { rows: Customer[]; total: number }>
}

export async function getCustomerById(customerId: number): Promise<Customer> {
  const customer = await repository.findById(customerId)
  if (!customer) {
    throw new NotFoundError('Customer not found', 'CUSTOMER_NOT_FOUND')
  }
  return customer
}

export async function updateCustomer(
  customerId: number,
  dto: UpdateCustomerDto
): Promise<Customer> {
  const existing = await repository.findById(customerId)
  if (!existing) {
    throw new NotFoundError('Customer not found', 'CUSTOMER_NOT_FOUND')
  }
  return repository.update(customerId, dto)
}
