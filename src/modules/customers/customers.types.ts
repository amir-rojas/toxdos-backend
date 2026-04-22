export interface Customer {
  customer_id: number
  full_name: string
  id_number: string
  phone: string | null
  address: string | null
  created_at: string
}

export interface CreateCustomerDto {
  full_name: string
  id_number: string
  phone?: string
  address?: string
}

export interface UpdateCustomerDto {
  full_name?: string
  id_number?: string
  phone?: string
  address?: string
}
