export interface Movement {
  movement_id: number
  session_id: number
  user_id: number
  movement_type: 'in' | 'out'
  category:
    | 'loan'
    | 'interest_payment'
    | 'custody_payment'
    | 'redemption'
    | 'sale'
    | 'operating_expense'
    | 'cash_withdrawal'
    | 'cash_deposit'
  amount: string              // NUMERIC as string
  reference_type: 'payment' | 'pawn' | 'sale' | 'expense' | null
  reference_id: number | null
  notes: string | null
  created_at: string
}
