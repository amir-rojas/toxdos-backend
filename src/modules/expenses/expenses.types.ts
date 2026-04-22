export interface Expense {
  expense_id: number
  session_id: number
  user_id: number
  concept: string
  amount: string       // NUMERIC as string
  created_at: string
}

export interface CreateExpenseDto {
  concept: string      // REQUIRED, non-empty
  amount: number       // REQUIRED, > 0
}
