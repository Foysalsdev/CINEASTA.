// =============================================================================
// CINEASTA — Centralized business logic.
//
// This is the SINGLE source of truth for every financial calculation in the
// product. UI components and stores must call these functions; they must NOT
// compute money math inline. The same formulas are mirrored in the Apps Script
// backend (server/apps-script/Code.gs) so client and server never disagree.
//
// Every division is guarded against divide-by-zero.
// =============================================================================

import type {
  CategoryBreakdownPoint,
  Client,
  DashboardKpis,
  Expense,
  ExpenseCategory,
  MonthlyPoint,
  Payment,
  Project,
  ProjectMetrics,
  ProjectVendorLine,
  ProjectWithMetrics,
  RankedClient,
  RankedProject,
  Vendor,
  VendorDetail,
  VendorPayment,
  VendorSummary,
} from '~/types'

// --- Primitive helpers -----------------------------------------------------

/** Coerce anything (string from Sheets, null, NaN) into a safe finite number. */
export function num(value: unknown): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? ''))
  return Number.isFinite(n) ? n : 0
}

/** Divide safely — returns 0 instead of NaN/Infinity when denominator is 0. */
export function safeDivide(numerator: number, denominator: number): number {
  if (!denominator) return 0
  const result = numerator / denominator
  return Number.isFinite(result) ? result : 0
}

/** Round to 2 decimals to avoid floating-point money drift. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function sumBy<T>(items: T[], selector: (item: T) => number): number {
  return round2(items.reduce((acc, item) => acc + num(selector(item)), 0))
}

/** Extract YYYY-MM from an ISO-ish date string. */
export function monthKey(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function monthLabel(key: string): string {
  const [y, m] = key.split('-')
  if (!y || !m) return key
  const d = new Date(Number(y), Number(m) - 1, 1)
  return d.toLocaleString('en-US', { month: 'short', year: '2-digit' })
}

// =============================================================================
// PROJECT-LEVEL CALCULATIONS  (definitions taken verbatim from the brief)
// =============================================================================

/** Total Received = Sum(Payments) for the project. */
export function totalReceived(payments: Payment[]): number {
  return sumBy(payments, (p) => p.amount)
}

/** Total Expense (cost) = Sum of expense amounts. */
export function totalExpense(expenses: Expense[]): number {
  return sumBy(expenses, (e) => e.amount)
}

/** Outstanding Due = Contract Value - Total Received (never negative). */
export function outstandingDue(contractValue: number, received: number): number {
  return round2(Math.max(0, num(contractValue) - received))
}

/** Current Profit = Total Received - Total Expense. */
export function currentProfit(received: number, expense: number): number {
  return round2(received - expense)
}

/** Expected Profit = Contract Value - Total Expense. */
export function expectedProfit(contractValue: number, expense: number): number {
  return round2(num(contractValue) - expense)
}

/** Profit Margin = (Current Profit / Total Received) * 100. */
export function profitMargin(profit: number, received: number): number {
  return round2(safeDivide(profit, received) * 100)
}

/** Collection Rate = (Total Received / Contract Value) * 100. */
export function collectionRate(received: number, contractValue: number): number {
  return round2(safeDivide(received, num(contractValue)) * 100)
}

/** Compute the full metric set for one project from its payments + expenses. */
export function computeProjectMetrics(
  project: Project,
  payments: Payment[],
  expenses: Expense[],
): ProjectMetrics {
  const received = totalReceived(payments)
  const expense = totalExpense(expenses)
  const profit = currentProfit(received, expense)
  return {
    totalReceived: received,
    totalExpense: expense,
    outstandingDue: outstandingDue(project.contract_value, received),
    currentProfit: profit,
    expectedProfit: expectedProfit(project.contract_value, expense),
    profitMargin: profitMargin(profit, received),
    collectionRate: collectionRate(received, project.contract_value),
  }
}

// =============================================================================
// JOIN HELPERS
// =============================================================================

function groupByProject<T extends { project_id: string }>(
  items: T[],
): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const list = map.get(item.project_id)
    if (list) list.push(item)
    else map.set(item.project_id, [item])
  }
  return map
}

/** Attach client name + full metrics to every project. */
export function projectsWithMetrics(
  projects: Project[],
  clients: Client[],
  payments: Payment[],
  expenses: Expense[],
): ProjectWithMetrics[] {
  const clientName = new Map(clients.map((c) => [c.id, c.name]))
  const paymentsByProject = groupByProject(payments)
  const expensesByProject = groupByProject(expenses)

  return projects.map((project) => ({
    ...project,
    client_name: clientName.get(project.client_id) ?? '—',
    metrics: computeProjectMetrics(
      project,
      paymentsByProject.get(project.id) ?? [],
      expensesByProject.get(project.id) ?? [],
    ),
  }))
}

// =============================================================================
// DASHBOARD KPIs
// =============================================================================

export function computeDashboardKpis(
  projects: Project[],
  clients: Client[],
  payments: Payment[],
  expenses: Expense[],
  vendorPayments: VendorPayment[] = [],
): DashboardKpis {
  const totalRevenue = totalReceived(payments)
  const totalExp = totalExpense(expenses)
  const netProfit = round2(totalRevenue - totalExp)
  const totalContract = sumBy(projects, (p) => p.contract_value)
  const outstanding = round2(Math.max(0, totalContract - totalRevenue))

  const withMetrics = projectsWithMetrics(projects, clients, payments, expenses)
  const totalProjectProfit = sumBy(withMetrics, (p) => p.metrics.currentProfit)

  return {
    totalRevenue,
    totalExpense: totalExp,
    netProfit,
    outstandingDue: outstanding,
    payableDue: vendorPayableDue(expenses, vendorPayments),
    collectionRate: round2(safeDivide(totalRevenue, totalContract) * 100),
    averageProjectProfit: round2(safeDivide(totalProjectProfit, projects.length)),
    projectCount: projects.length,
    clientCount: clients.length,
  }
}

// =============================================================================
// MONTHLY TRENDS  (revenue / expense / profit)
// =============================================================================

export function monthlyTrend(
  payments: Payment[],
  expenses: Expense[],
  monthsBack = 6,
): MonthlyPoint[] {
  const revenueByMonth = new Map<string, number>()
  const expenseByMonth = new Map<string, number>()

  for (const p of payments) {
    const key = monthKey(p.payment_date)
    if (key) revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + num(p.amount))
  }
  for (const e of expenses) {
    const key = monthKey(e.expense_date)
    if (key) expenseByMonth.set(key, (expenseByMonth.get(key) ?? 0) + num(e.amount))
  }

  // Build a continuous window ending at the current month so the chart never
  // shows gaps even in months with no activity.
  const keys: string[] = []
  const now = new Date()
  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  return keys.map((key) => {
    const revenue = round2(revenueByMonth.get(key) ?? 0)
    const expense = round2(expenseByMonth.get(key) ?? 0)
    return { month: key, label: monthLabel(key), revenue, expense, profit: round2(revenue - expense) }
  })
}

// =============================================================================
// EXPENSE BREAKDOWN BY CATEGORY
// =============================================================================

export function expenseBreakdown(expenses: Expense[]): CategoryBreakdownPoint[] {
  const totals = new Map<ExpenseCategory, number>()
  for (const e of expenses) {
    // Free-form categories: group by whatever was entered, blanks → Uncategorized.
    const cat = (e.category && String(e.category).trim()) || 'Uncategorized'
    totals.set(cat, (totals.get(cat) ?? 0) + num(e.amount))
  }
  const grandTotal = round2([...totals.values()].reduce((a, b) => a + b, 0))

  return [...totals.entries()]
    .map(([category, amount]) => ({
      category,
      amount: round2(amount),
      percent: round2(safeDivide(amount, grandTotal) * 100),
    }))
    .sort((a, b) => b.amount - a.amount)
}

// =============================================================================
// RANKINGS
// =============================================================================

export function topProjectsByProfit(
  projects: ProjectWithMetrics[],
  limit = 5,
): RankedProject[] {
  return [...projects]
    .sort((a, b) => b.metrics.currentProfit - a.metrics.currentProfit)
    .slice(0, limit)
    .map((p) => ({ id: p.id, name: p.project_name, value: p.metrics.currentProfit }))
}

export function topClientsByRevenue(
  projects: ProjectWithMetrics[],
  clients: Client[],
  limit = 5,
): RankedClient[] {
  const revenueByClient = new Map<string, number>()
  const projectsByClient = new Map<string, number>()

  for (const p of projects) {
    revenueByClient.set(p.client_id, (revenueByClient.get(p.client_id) ?? 0) + p.metrics.totalReceived)
    projectsByClient.set(p.client_id, (projectsByClient.get(p.client_id) ?? 0) + 1)
  }

  return clients
    .map((c) => ({
      id: c.id,
      name: c.name,
      revenue: round2(revenueByClient.get(c.id) ?? 0),
      projectCount: projectsByClient.get(c.id) ?? 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
}

// =============================================================================
// SORTING HELPER for "recent" activity
// =============================================================================

// =============================================================================
// VENDORS — bills (expenses with a vendor) vs payments made → due
// =============================================================================

/** Amount billed by a vendor = Σ amount of expenses linked to that vendor. */
export function vendorBilled(expenses: Expense[], vendorId: string): number {
  return sumBy(
    expenses.filter((e) => e.vendor_id === vendorId),
    (e) => e.amount,
  )
}

/** Amount paid to a vendor = Σ vendor payments for that vendor. */
export function vendorPaid(vendorPayments: VendorPayment[], vendorId: string): number {
  return sumBy(
    vendorPayments.filter((vp) => vp.vendor_id === vendorId),
    (vp) => vp.amount,
  )
}

export function buildVendorSummary(
  vendorId: string,
  expenses: Expense[],
  vendorPayments: VendorPayment[],
): VendorSummary {
  const bills = expenses.filter((e) => e.vendor_id === vendorId)
  const pays = vendorPayments.filter((vp) => vp.vendor_id === vendorId)
  const totalBilled = sumBy(bills, (e) => e.amount)
  const totalPaid = sumBy(pays, (vp) => vp.amount)
  return {
    totalBilled,
    totalPaid,
    due: round2(totalBilled - totalPaid), // negative = advance/credit to vendor
    billCount: bills.length,
    paymentCount: pays.length,
  }
}

/** Amount allocated to a single bill across vendor payments. */
export function billPaid(vendorPayments: VendorPayment[], billId: string): number {
  return sumBy(
    vendorPayments.filter((vp) => vp.bill_id === billId),
    (vp) => vp.amount,
  )
}

export function buildVendorDetail(
  vendor: Vendor,
  expenses: Expense[],
  vendorPayments: VendorPayment[],
): VendorDetail {
  const pays = vendorPayments.filter((vp) => vp.vendor_id === vendor.id)
  const bills = expenses
    .filter((e) => e.vendor_id === vendor.id)
    .map((b) => {
      const paid = billPaid(pays, b.id)
      return { ...b, paid, due: round2(Math.max(0, num(b.amount) - paid)) }
    })
  return {
    vendor,
    bills,
    payments: pays,
    summary: buildVendorSummary(vendor.id, expenses, vendorPayments),
  }
}

/**
 * Per-project vendor engagements. Each vendor on a project has a Total Bill
 * (Σ of that vendor's expense rows for the project) and a running set of
 * payments (vendor payments whose bill_id points at one of those rows).
 * due = Total Bill − Paid.
 */
export function buildProjectVendors(
  projectId: string,
  vendors: Vendor[],
  expenses: Expense[],
  vendorPayments: VendorPayment[],
): ProjectVendorLine[] {
  const vendorById = new Map(vendors.map((v) => [v.id, v]))
  const billsByVendor = new Map<string, Expense[]>()
  for (const e of expenses) {
    if (e.project_id !== projectId || !e.vendor_id) continue
    const list = billsByVendor.get(e.vendor_id)
    if (list) list.push(e)
    else billsByVendor.set(e.vendor_id, [e])
  }

  const lines: ProjectVendorLine[] = []
  for (const [vendorId, bills] of billsByVendor) {
    const billIds = bills.map((b) => b.id)
    const totalBill = sumBy(bills, (b) => b.amount)
    const payments = vendorPayments
      .filter((vp) => billIds.includes(vp.bill_id))
      .sort((a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime())
    const paid = sumBy(payments, (vp) => vp.amount)
    const vendor =
      vendorById.get(vendorId) ??
      ({ id: vendorId, name: 'Unknown vendor', category: '', phone: '', email: '', notes: '', created_at: '' } as Vendor)
    lines.push({
      vendor,
      billIds,
      primaryBillId: billIds[0] ?? '',
      category: vendor.category || '',
      totalBill,
      paid,
      due: round2(Math.max(0, totalBill - paid)),
      payments,
    })
  }
  return lines.sort((a, b) => b.due - a.due)
}

/** Total outstanding payables across all vendors (never negative overall). */
export function vendorPayableDue(
  expenses: Expense[],
  vendorPayments: VendorPayment[],
): number {
  const billedWithVendor = sumBy(
    expenses.filter((e) => e.vendor_id),
    (e) => e.amount,
  )
  const paid = sumBy(vendorPayments, (vp) => vp.amount)
  return round2(Math.max(0, billedWithVendor - paid))
}

export function recent<T extends { created_at: string }>(
  items: T[],
  dateField: keyof T,
  limit = 5,
): T[] {
  return [...items]
    .sort((a, b) => {
      const da = new Date(String((a as Record<string, unknown>)[dateField as string] ?? a.created_at)).getTime()
      const db = new Date(String((b as Record<string, unknown>)[dateField as string] ?? b.created_at)).getTime()
      return db - da
    })
    .slice(0, limit)
}
