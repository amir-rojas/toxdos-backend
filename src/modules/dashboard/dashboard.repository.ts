import { pool } from '../../config/db'
import type { DashboardSummary, OverduePawnRow, AvailableItemRow } from './dashboard.types'

export async function getSummary(sessionId?: number): Promise<DashboardSummary> {
  const sessionFilter = sessionId ? `AND session_id = ${sessionId}` : ''

  const [pawnsResult, paymentsResult, salesResult, overdueResult, availableResult] =
    await Promise.all([
      // Nuevos empeños hoy
      pool.query<{ count: string; total: string }>(
        `SELECT COUNT(*)              AS count,
                COALESCE(SUM(loan_amount), 0) AS total
         FROM pawns
         WHERE created_at::date = CURRENT_DATE
           ${sessionId ? '' : ''}`
      ),

      // Pagos recibidos hoy (session-aware)
      pool.query<{ total: string }>(
        `SELECT COALESCE(SUM(total::numeric), 0) AS total
         FROM payments
         WHERE paid_at::date = CURRENT_DATE
           ${sessionFilter}`
      ),

      // Ventas hoy (session-aware)
      pool.query<{ count: string; total: string }>(
        `SELECT COUNT(*)                      AS count,
                COALESCE(SUM(sale_price), 0)  AS total
         FROM sales
         WHERE sold_at::date = CURRENT_DATE
           ${sessionFilter}`
      ),

      // Empeños vencidos — max 5, más antiguos primero
      pool.query<OverduePawnRow>(
        `SELECT p.pawn_id,
                c.full_name                    AS customer_name,
                i.description                  AS first_item_description,
                p.loan_amount::float           AS loan_amount,
                p.due_date::text               AS due_date,
                (CURRENT_DATE - p.due_date)    AS days_overdue
         FROM pawns p
         JOIN customers c ON c.customer_id = p.customer_id
         LEFT JOIN LATERAL (
           SELECT description FROM items
           WHERE pawn_id = p.pawn_id
           ORDER BY item_id ASC LIMIT 1
         ) i ON TRUE
         WHERE p.status IN ('active', 'renewed')
           AND p.due_date < CURRENT_DATE
         ORDER BY p.due_date ASC
         LIMIT 5`
      ),

      // Artículos disponibles para venta — max 5, mayor valor primero
      pool.query<AvailableItemRow>(
        `SELECT item_id,
                pawn_id,
                description,
                brand,
                model,
                appraised_value::float AS appraised_value
         FROM items
         WHERE status = 'available_for_sale'
         ORDER BY appraised_value DESC
         LIMIT 5`
      ),
    ])

  return {
    today_pawns_count:    parseInt(pawnsResult.rows[0].count, 10),
    today_capital_out:    parseFloat(String(pawnsResult.rows[0].total)),
    today_payments_total: parseFloat(String(paymentsResult.rows[0].total)),
    today_sales_count:    parseInt(salesResult.rows[0].count, 10),
    today_sales_total:    parseFloat(String(salesResult.rows[0].total)),
    overdue_pawns:        overdueResult.rows,
    available_for_sale_items: availableResult.rows,
  }
}
