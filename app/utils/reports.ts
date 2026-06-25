// Report builders — thin compositions over the core calculation layer.
import type {
  Client,
  ClientRevenueReportRow,
  Expense,
  MonthlyReportRow,
  Payment,
  Project,
  ProjectProfitReportRow,
  VendorDuesReportRow,
} from '~/types'
import { monthlyTrend, num, projectsWithMetrics, round2 } from './calculations'

export function buildMonthlyReport(
  payments: Payment[],
  expenses: Expense[],
  monthsBack = 12,
): MonthlyReportRow[] {
  return monthlyTrend(payments, expenses, monthsBack).map((m) => ({
    month: m.month,
    label: m.label,
    revenue: m.revenue,
    expense: m.expense,
    profit: m.profit,
  }))
}

export function buildProjectProfitReport(
  projects: Project[],
  clients: Client[],
  payments: Payment[],
  expenses: Expense[],
): ProjectProfitReportRow[] {
  return projectsWithMetrics(projects, clients, payments, expenses)
    .map((p) => ({
      id: p.id,
      project: p.project_name,
      revenue: p.metrics.totalReceived,
      expense: p.metrics.totalExpense,
      profit: p.metrics.currentProfit,
      margin: p.metrics.profitMargin,
    }))
    .sort((a, b) => b.profit - a.profit)
}

export function buildClientRevenueReport(
  projects: Project[],
  clients: Client[],
  payments: Payment[],
  expenses: Expense[],
): ClientRevenueReportRow[] {
  const withMetrics = projectsWithMetrics(projects, clients, payments, expenses)
  const revenueByClient = new Map<string, number>()
  const countByClient = new Map<string, number>()

  for (const p of withMetrics) {
    revenueByClient.set(p.client_id, (revenueByClient.get(p.client_id) ?? 0) + p.metrics.totalReceived)
    countByClient.set(p.client_id, (countByClient.get(p.client_id) ?? 0) + 1)
  }

  return clients
    .map((c) => ({
      id: c.id,
      client: c.name,
      revenue: round2(revenueByClient.get(c.id) ?? 0),
      projectCount: countByClient.get(c.id) ?? 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
}

/** "Kar koto baki" — outstanding payables grouped by vendor (who we owe). */
export function buildVendorDuesReport(expenses: Expense[]): VendorDuesReportRow[] {
  const byVendor = new Map<string, { bill: number; paid: number; count: number }>()
  for (const e of expenses) {
    const vendor = (e.vendor && String(e.vendor).trim()) || (e.category && String(e.category).trim()) || 'Unknown'
    const agg = byVendor.get(vendor) ?? { bill: 0, paid: 0, count: 0 }
    agg.bill += num(e.total_bill)
    agg.paid += num(e.paid)
    agg.count += 1
    byVendor.set(vendor, agg)
  }
  return [...byVendor.entries()]
    .map(([vendor, a]) => ({
      vendor,
      totalBill: round2(a.bill),
      paid: round2(a.paid),
      due: round2(Math.max(0, a.bill - a.paid)),
      billCount: a.count,
    }))
    .sort((a, b) => b.due - a.due)
}
