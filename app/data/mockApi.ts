// Mock API handler — mirrors the Apps Script backend's routing & response shape.
// It computes dashboard/report payloads with the SAME calculation layer the
// real backend uses, so swapping mock → live is transparent to the UI.
import type {
  ApiResponse,
  DashboardData,
  NewClient,
  NewExpense,
  NewPayment,
  NewProject,
  ProjectWithMetrics,
} from '~/types'
import {
  computeDashboardKpis,
  expenseBreakdown,
  monthlyTrend,
  projectsWithMetrics,
  recent,
  topClientsByRevenue,
  topProjectsByProfit,
} from '~/utils/calculations'
import {
  buildClientRevenueReport,
  buildMonthlyReport,
  buildProjectProfitReport,
  buildVendorDuesReport,
} from '~/utils/reports'
import { genId, loadDB, persist } from './mockData'

function ok<T>(data: T): ApiResponse<T> {
  return { ok: true, data, error: null }
}
function fail<T>(message: string): ApiResponse<T> {
  return { ok: false, data: null, error: message }
}

// Simulate a little network latency so loading states are visible/testable.
function delay<T>(value: T, ms = 250): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

function buildDashboard(): DashboardData {
  const db = loadDB()
  const withMetrics: ProjectWithMetrics[] = projectsWithMetrics(
    db.projects,
    db.clients,
    db.payments,
    db.expenses,
  )
  return {
    kpis: computeDashboardKpis(db.projects, db.clients, db.payments, db.expenses),
    monthly: monthlyTrend(db.payments, db.expenses, 6),
    expenseBreakdown: expenseBreakdown(db.expenses),
    topProjectsByProfit: topProjectsByProfit(withMetrics, 5),
    topClientsByRevenue: topClientsByRevenue(withMetrics, db.clients, 5),
    recentPayments: recent(db.payments, 'payment_date', 5),
    recentExpenses: recent(db.expenses, 'expense_date', 5),
  }
}

export async function mockApi<T>(
  method: 'GET' | 'POST',
  path: string,
  params: Record<string, string> = {},
  body?: unknown,
): Promise<ApiResponse<T>> {
  const db = loadDB()

  if (method === 'GET') {
    switch (path) {
      case 'dashboard':
        return delay(ok(buildDashboard() as T))
      case 'clients':
        return delay(ok(db.clients as T))
      case 'projects':
        return delay(
          ok(projectsWithMetrics(db.projects, db.clients, db.payments, db.expenses) as T),
        )
      case 'project': {
        const project = db.projects.find((p) => p.id === params.id)
        if (!project) return delay(fail<T>('Project not found'))
        const [withMetrics] = projectsWithMetrics([project], db.clients, db.payments, db.expenses)
        return delay(
          ok({
            project: withMetrics,
            payments: db.payments.filter((p) => p.project_id === project.id),
            expenses: db.expenses.filter((e) => e.project_id === project.id),
          } as T),
        )
      }
      case 'payments':
        return delay(ok(db.payments as T))
      case 'expenses':
        return delay(ok(db.expenses as T))
      case 'reports/monthly':
        return delay(ok(buildMonthlyReport(db.payments, db.expenses, 12) as T))
      case 'reports/project-profit':
        return delay(
          ok(buildProjectProfitReport(db.projects, db.clients, db.payments, db.expenses) as T),
        )
      case 'reports/client-revenue':
        return delay(
          ok(buildClientRevenueReport(db.projects, db.clients, db.payments, db.expenses) as T),
        )
      case 'reports/vendor-dues':
        return delay(ok(buildVendorDuesReport(db.expenses) as T))
      default:
        return delay(fail<T>(`Unknown GET route: ${path}`))
    }
  }

  // ---- POST ----
  if (path === 'login') {
    const password = String((body as { password?: string })?.password ?? '')
    const expected = params.passcode ?? ''
    if (!expected || password === expected) return delay(ok({ token: 'mock-session' } as T), 350)
    return delay(fail<T>('Incorrect passcode'), 350)
  }

  switch (path) {
    case 'client': {
      const p = body as NewClient
      if (!p?.name?.trim()) return delay(fail<T>('Client name is required'))
      const row = { ...p, id: genId('c'), created_at: new Date().toISOString() }
      db.clients.push(row)
      persist()
      return delay(ok(row as T))
    }
    case 'project': {
      const p = body as NewProject
      if (!p?.project_name?.trim()) return delay(fail<T>('Project name is required'))
      if (!p?.client_id) return delay(fail<T>('A client is required'))
      const row = { ...p, id: genId('p'), created_at: new Date().toISOString() }
      db.projects.push(row)
      persist()
      return delay(ok(row as T))
    }
    case 'payment': {
      const p = body as NewPayment
      if (!p?.project_id) return delay(fail<T>('A project is required'))
      if (!(p.amount > 0)) return delay(fail<T>('Amount must be greater than 0'))
      const row = { ...p, id: genId('pay'), created_at: new Date().toISOString() }
      db.payments.push(row)
      persist()
      return delay(ok(row as T))
    }
    case 'expense': {
      const p = body as NewExpense
      if (!p?.project_id) return delay(fail<T>('A project is required'))
      if (!(p.total_bill > 0)) return delay(fail<T>('Total bill must be greater than 0'))
      const paid = Math.min(Math.max(0, p.paid || 0), p.total_bill)
      const row = { ...p, paid, id: genId('e'), created_at: new Date().toISOString() }
      db.expenses.push(row)
      persist()
      return delay(ok(row as T))
    }
    default:
      return delay(fail<T>(`Unknown POST route: ${path}`))
  }
}
