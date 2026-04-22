import type { Item } from '../items/items.types'

export interface Pawn {
  pawn_id: number
  customer_id: number
  customer_name: string        // JOIN customers.full_name
  customer_id_number: string   // JOIN customers.id_number
  user_id: number
  loan_amount: string          // NUMERIC as string
  interest_rate: string        // NUMERIC as string
  custody_rate: string         // NUMERIC as string
  interest_type: 'daily' | 'monthly'
  start_date: string           // ISO date YYYY-MM-DD
  due_date: string             // ISO date YYYY-MM-DD
  status: 'active' | 'renewed' | 'redeemed' | 'forfeited'
  first_item_description: string | null  // primer ítem por item_id ASC
  items_count: number                    // total de ítems del empeño
  created_at: string
  updated_at: string
}

export interface PawnWithItems extends Pawn {
  items: Item[]
}

export interface CreateItemDto {
  description: string          // REQUIRED, non-empty
  appraised_value: number      // REQUIRED, > 0
  category_id?: number
  brand?: string
  model?: string
  serial_number?: string
  photo_url?: string
}

export interface CreatePawnDto {
  customer_id: number
  loan_amount: number          // > 0
  interest_rate: number        // > 0
  custody_rate?: number        // >= 0, defaults to 0
  interest_type: 'daily' | 'monthly'
  start_date: string           // YYYY-MM-DD
  due_date: string             // YYYY-MM-DD, must be > start_date
  items: CreateItemDto[]       // min 1
}
