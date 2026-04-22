export interface Sale {
  sale_id: number
  item_id: number
  session_id: number
  buyer_customer_id: number | null
  sale_price: string           // NUMERIC as string
  payment_method: 'cash' | 'transfer' | 'qr'
  sold_at: string
}

export interface SaleEnriched extends Sale {
  item_description: string
  item_model: string | null
  buyer_name: string | null
}

export interface CreateSaleDto {
  item_id: number
  sale_price: number                            // > 0
  payment_method?: 'cash' | 'transfer' | 'qr'  // defaults to 'cash'
  buyer_customer_id?: number
}
