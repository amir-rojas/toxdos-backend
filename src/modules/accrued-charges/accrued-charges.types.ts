export interface AccruedCharge {
  accrual_id: number
  pawn_id: number
  accrual_date: string        // ISO date YYYY-MM-DD
  interest_amount: string     // NUMERIC as string
  custody_amount: string      // NUMERIC as string
  is_collected: boolean
  payment_id: number | null
}

export interface AccrualResult {
  date: string                // date the job ran
  processed: number           // active+renewed pawns found
  inserted: number            // rows inserted
  skipped: number             // already existed (idempotent)
}
