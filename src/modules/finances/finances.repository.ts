import { pool } from '../../config/db'
import type { FinancesSummary } from './finances.types'

const DAILY_INTEREST_EXPR = `
  CASE p.interest_type
    WHEN 'daily'   THEN p.loan_amount * p.interest_rate / 100
    WHEN 'monthly' THEN p.loan_amount * p.interest_rate / 100 / 30
  END`

const DAILY_CUSTODY_EXPR = `
  CASE p.interest_type
    WHEN 'daily'   THEN p.loan_amount * p.custody_rate / 100
    WHEN 'monthly' THEN p.loan_amount * p.custody_rate / 100 / 30
  END`

export async function getSummary(): Promise<FinancesSummary> {
  const [activeResult, riskResult, historicalResult] = await Promise.all([
    // Active pawns: today interest/custody, monthly projection, portfolio stats
    pool.query<{
      today_interest: string
      today_custody: string
      monthly_projection: string
      average_interest_rate: string
      active_pawns_count: string
      total_deployed_capital: string
    }>(
      `SELECT
         ROUND(SUM(${DAILY_INTEREST_EXPR}), 2)           AS today_interest,
         ROUND(SUM(${DAILY_CUSTODY_EXPR}), 2)             AS today_custody,
         ROUND(SUM(
           (p.loan_amount * p.interest_rate / 100)
           + (p.loan_amount * p.custody_rate / 100)
         ), 2)                                            AS monthly_projection,
         ROUND(AVG(p.interest_rate), 2)                  AS average_interest_rate,
         COUNT(*)                                         AS active_pawns_count,
         ROUND(SUM(p.loan_amount), 2)                    AS total_deployed_capital
       FROM pawns p
       WHERE p.status IN ('active', 'renewed')`
    ),

    // Capital at risk: active/renewed pawns past due date
    pool.query<{ capital_at_risk: string; overdue_count: string }>(
      `SELECT
         ROUND(SUM(loan_amount), 2) AS capital_at_risk,
         COUNT(*)                   AS overdue_count
       FROM pawns
       WHERE status IN ('active', 'renewed')
         AND due_date < CURRENT_DATE`
    ),

    // Historical redemption rate
    pool.query<{ redeemed: string; forfeited: string }>(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'redeemed') AS redeemed,
         COUNT(*) FILTER (WHERE status = 'forfeited') AS forfeited
       FROM pawns
       WHERE status IN ('redeemed', 'forfeited')`
    ),
  ])

  const active = activeResult.rows[0]
  const risk = riskResult.rows[0]
  const hist = historicalResult.rows[0]

  const redeemed = parseInt(hist.redeemed, 10)
  const forfeited = parseInt(hist.forfeited, 10)
  const total = redeemed + forfeited
  const redemption_rate = total > 0 ? redeemed / total : 0

  return {
    today_interest:        parseFloat(active.today_interest ?? '0'),
    today_custody:         parseFloat(active.today_custody ?? '0'),
    monthly_projection:    parseFloat(active.monthly_projection ?? '0'),
    average_interest_rate: parseFloat(active.average_interest_rate ?? '0'),
    active_pawns_count:    parseInt(active.active_pawns_count, 10),
    total_deployed_capital: parseFloat(active.total_deployed_capital ?? '0'),
    capital_at_risk:       parseFloat(risk.capital_at_risk ?? '0'),
    overdue_pawns_count:   parseInt(risk.overdue_count, 10),
    redemption_rate,
  }
}
