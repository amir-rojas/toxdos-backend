export interface OverduePawnRow {
  pawn_id: number
  customer_name: string
  first_item_description: string
  loan_amount: number
  due_date: string
  days_overdue: number
}

export interface AvailableItemRow {
  item_id: number
  pawn_id: number
  description: string
  brand: string | null
  model: string | null
  appraised_value: number
}

export interface DashboardSummary {
  // Pulso del día
  today_pawns_count: number
  today_capital_out: number
  today_payments_total: number
  today_sales_count: number
  today_sales_total: number

  // Centro de tareas
  overdue_pawns: OverduePawnRow[]
  available_for_sale_items: AvailableItemRow[]
}
