export interface FinancesSummary {
  // Hoy
  today_interest: number
  today_custody: number

  // Proyecciones
  monthly_projection: number
  capital_at_risk: number
  overdue_pawns_count: number

  // Salud del portafolio
  redemption_rate: number       // 0..1
  average_interest_rate: number // porcentaje
  active_pawns_count: number
  total_deployed_capital: number
}
