// Mock API handler — mirrors the Apps Script backend's routing & response shape.
// It computes dashboard/report payloads with the SAME calculation layer the
// real backend uses, so swapping mock → live is transparent to the UI.
import type {
  ApiResponse,
  DashboardData,
  NewAsset,
  NewClient,
  NewExpense,
  NewPayment,
  NewProject,
  NewVendor,
  NewVendorPayment,
  ProjectWithMetrics,
} from '~/types'
import {
  buildVendorDetail,
  computeDashboardKpis,
  expenseBreakdown,
  monthlyTrend,
  outstandingDue,
  projectsWithMetrics,
  projectVendorDue,
  recent,
  topClientsByRevenue,
  topProjectsByProfit,
  totalReceived,
} from '~/utils/calculations'
import {
  buildClientRevenueReport,
  buildMonthlyReport,
  buildProjectProfitReport,
  buildVendorDuesReport,
} from '~/utils/reports'
import { genId, loadDB, persist, type MockDB } from './mockData'

// A project auto-completes once the client has paid in full AND every vendor
// bill on it is settled. Only flips 'active' → 'completed' — anything the
// user has set manually (on_hold, cancelled, or completed/active themselves)
// is left alone, and the status field stays editable afterwards.
function autoCompleteIfSettled(db: MockDB, projectId: string): void {
  if (!projectId) return
  const project = db.projects.find((p) => p.id === projectId)
  if (!project || project.status !== 'active') return
  const payments = db.payments.filter((p) => p.project_id === projectId)
  const expenses = db.expenses.filter((e) => e.project_id === projectId)
  const due = outstandingDue(project.contract_value, totalReceived(payments))
  const vendorDue = projectVendorDue(projectId, expenses, db.vendorPayments)
  if (due <= 0 && vendorDue <= 0) project.status = 'completed'
}

function ok<T>(data: T): ApiResponse<T> {
  return { ok: true, data, error: null }
}
function fail<T>(message: string): ApiResponse<T> {
  return { ok: false, data: null, error: message }
}
function delay<T>(value: T, ms = 90): Promise<T> {
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
    kpis: computeDashboardKpis(db.projects, db.clients, db.payments, db.expenses, db.vendorPayments),
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
        return delay(ok(projectsWithMetrics(db.projects, db.clients, db.payments, db.expenses) as T))
      case 'project': {
        const project = db.projects.find((p) => p.id === params.id)
        if (!project) return delay(fail<T>('Project not found'))
        const [withMetrics] = projectsWithMetrics([project], db.clients, db.payments, db.expenses)
        const billIds = new Set(
          db.expenses.filter((e) => e.project_id === project.id).map((e) => e.id),
        )
        return delay(
          ok({
            project: withMetrics,
            payments: db.payments.filter((p) => p.project_id === project.id),
            expenses: db.expenses.filter((e) => e.project_id === project.id),
            vendorPayments: db.vendorPayments.filter((vp) => billIds.has(vp.bill_id)),
          } as T),
        )
      }
      case 'payments':
        return delay(ok(db.payments as T))
      case 'expenses':
        return delay(ok(db.expenses as T))
      case 'vendors':
        return delay(ok(db.vendors as T))
      case 'vendor': {
        const vendor = db.vendors.find((v) => v.id === params.id)
        if (!vendor) return delay(fail<T>('Vendor not found'))
        return delay(ok(buildVendorDetail(vendor, db.expenses, db.vendorPayments) as T))
      }
      case 'assets':
        return delay(ok(db.assets as T))
      case 'reports/monthly':
        return delay(ok(buildMonthlyReport(db.payments, db.expenses, 12) as T))
      case 'reports/project-profit':
        return delay(ok(buildProjectProfitReport(db.projects, db.clients, db.payments, db.expenses) as T))
      case 'reports/client-revenue':
        return delay(ok(buildClientRevenueReport(db.projects, db.clients, db.payments, db.expenses) as T))
      case 'reports/vendor-dues':
        return delay(ok(buildVendorDuesReport(db.vendors, db.expenses, db.vendorPayments) as T))
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
      autoCompleteIfSettled(db, p.project_id)
      persist()
      return delay(ok(row as T))
    }
    case 'expense': {
      const p = body as NewExpense
      if (p?.type === 'project' && !p.project_id) return delay(fail<T>('A project is required for a project expense'))
      if (!(p.amount > 0)) return delay(fail<T>('Amount must be greater than 0'))
      const row = { ...p, id: genId('e'), created_at: new Date().toISOString() }
      db.expenses.push(row)
      persist()
      return delay(ok(row as T))
    }
    case 'project-update': {
      const p = body as { id?: string } & Partial<NewProject>
      const row = db.projects.find((pr) => pr.id === p?.id)
      if (!row) return delay(fail<T>('Project not found'))
      if (p.client_id !== undefined) row.client_id = p.client_id
      if (p.project_name !== undefined) row.project_name = p.project_name
      if (p.contract_value !== undefined) row.contract_value = Number(p.contract_value) || 0
      if (p.start_date !== undefined) row.start_date = p.start_date
      if (p.status !== undefined) row.status = p.status
      persist()
      return delay(ok(row as T))
    }
    case 'expense-update': {
      const p = body as { id?: string } & Partial<NewExpense>
      const row = db.expenses.find((e) => e.id === p?.id)
      if (!row) return delay(fail<T>('Expense not found'))
      if (p.amount !== undefined) row.amount = Number(p.amount) || 0
      if (p.category !== undefined) row.category = p.category
      if (p.notes !== undefined) row.notes = p.notes
      if (p.expense_date !== undefined) row.expense_date = p.expense_date
      persist()
      return delay(ok(row as T))
    }
    case 'vendor': {
      const p = body as NewVendor
      if (!p?.name?.trim()) return delay(fail<T>('Vendor name is required'))
      const row = { ...p, id: genId('v'), created_at: new Date().toISOString() }
      db.vendors.push(row)
      persist()
      return delay(ok(row as T))
    }
    case 'vendor-payment': {
      const p = body as NewVendorPayment
      if (!p?.vendor_id) return delay(fail<T>('A vendor is required'))
      if (!(p.amount > 0)) return delay(fail<T>('Amount must be greater than 0'))
      const row = { ...p, id: genId('vp'), created_at: new Date().toISOString() }
      db.vendorPayments.push(row)
      const bill = db.expenses.find((e) => e.id === p.bill_id)
      if (bill?.project_id) autoCompleteIfSettled(db, bill.project_id)
      persist()
      return delay(ok(row as T))
    }
    case 'asset': {
      const p = body as NewAsset
      if (!p?.name?.trim()) return delay(fail<T>('Asset name is required'))
      const row = { ...p, id: genId('a'), created_at: new Date().toISOString() }
      db.assets.push(row)
      persist()
      return delay(ok(row as T))
    }
    default:
      return delay(fail<T>(`Unknown POST route: ${path}`))
  }
}
