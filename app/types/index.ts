// =============================================================================
// Domain types — mirror the Google Sheets columns exactly.
// =============================================================================

export type ID = string

// A receipt / file attached to a financial transaction. In live mode `url`
// points at Google Drive; in demo mode it's a local data URL.
export interface Attachment {
  id: ID
  name: string
  url: string
  mime: string
  size: number
}

export type ProjectStatus = 'active' | 'completed' | 'on_hold' | 'cancelled'

export type PaymentMethod =
  | 'cash'
  | 'bank'
  | 'bkash'
  | 'nagad'
  | 'card'
  | 'cheque'
  | 'other'

// Expense categories are FREE-FORM (a production house has highly variable
// line items — DOP, Camera Van + Fuel, Props, Generator Oil, …). We keep the
// alias for readability but it is just a string; a suggestion list lives in
// constants.ts to power the typeahead.
export type ExpenseCategory = string

// --- Sheet: Clients --------------------------------------------------------
export interface Client {
  id: ID
  name: string
  phone: string
  email: string
  notes: string
  created_at: string
}

// --- Sheet: Projects -------------------------------------------------------
export interface Project {
  id: ID
  client_id: ID
  project_name: string
  contract_value: number
  start_date: string
  status: ProjectStatus
  created_at: string
}

// --- Sheet: Payments -------------------------------------------------------
export interface Payment {
  id: ID
  project_id: ID
  amount: number
  payment_method: PaymentMethod
  payment_date: string
  notes: string
  attachments?: Attachment[]
  created_at: string
}

// A single unified expense system. `type` distinguishes the real-world flavour;
// vendor & project are optional depending on type.
export type ExpenseType = 'project' | 'internal' | 'asset' | 'maintenance'

export interface Expense {
  id: ID
  type: ExpenseType
  project_id: ID // '' for internal / unassigned
  vendor_id: ID // '' if no vendor
  asset_id: ID // '' unless an Asset Purchase / Maintenance ties to an asset
  category: ExpenseCategory
  amount: number
  expense_date: string
  notes: string
  attachments?: Attachment[]
  created_at: string
}

// --- Sheet: Vendors --------------------------------------------------------
export interface Vendor {
  id: ID
  name: string
  category: string // vendor type: Camera, Light, Art, Transport…
  phone: string
  email: string
  notes: string
  created_at: string
}

// --- Sheet: VendorPayments (money paid TO a vendor, allocated per bill) -----
export interface VendorPayment {
  id: ID
  vendor_id: ID
  bill_id: ID // the expense/bill this payment is allocated to ('' = unallocated/advance)
  amount: number
  payment_method: PaymentMethod
  payment_date: string
  notes: string
  attachments?: Attachment[]
  created_at: string
}

// --- Sheet: Assets (under "More") ------------------------------------------
export interface Asset {
  id: ID
  name: string
  category: string
  purchase_value: number
  purchase_date: string
  notes: string
  created_at: string
}

// =============================================================================
// Derived / computed view models (output of the business-logic layer).
// =============================================================================

export interface ProjectMetrics {
  totalReceived: number
  totalExpense: number // project cost = Σ amount of this project's expenses
  outstandingDue: number // receivable due from client
  currentProfit: number
  expectedProfit: number
  profitMargin: number // percentage
  collectionRate: number // percentage of contract collected
}

export interface ProjectWithMetrics extends Project {
  client_name: string
  metrics: ProjectMetrics
}

export interface DashboardKpis {
  totalRevenue: number
  totalExpense: number
  netProfit: number
  outstandingDue: number // receivable (clients owe us)
  payableDue: number // payable (we owe vendors) — total "baki"
  collectionRate: number // percentage
  averageProjectProfit: number
  projectCount: number
  clientCount: number
}

export interface MonthlyPoint {
  month: string // YYYY-MM
  label: string // e.g. "Jun 25"
  revenue: number
  expense: number
  profit: number
}

export interface CategoryBreakdownPoint {
  category: ExpenseCategory
  amount: number
  percent: number
}

export interface RankedProject {
  id: ID
  name: string
  value: number
}

export interface RankedClient {
  id: ID
  name: string
  revenue: number
  projectCount: number
}

export interface DashboardData {
  kpis: DashboardKpis
  monthly: MonthlyPoint[]
  expenseBreakdown: CategoryBreakdownPoint[]
  topProjectsByProfit: RankedProject[]
  topClientsByRevenue: RankedClient[]
  recentPayments: Payment[]
  recentExpenses: Expense[]
}

// =============================================================================
// Reports
// =============================================================================

export interface MonthlyReportRow {
  month: string
  label: string
  revenue: number
  expense: number
  profit: number
}

export interface ProjectProfitReportRow {
  id: ID
  project: string
  revenue: number
  expense: number
  profit: number
  margin: number
}

export interface ClientRevenueReportRow {
  id: ID
  client: string
  revenue: number
  projectCount: number
}

// "Kar koto baki" — outstanding payables grouped by vendor.
export interface VendorDuesReportRow {
  id: ID
  vendor: string
  totalBill: number
  paid: number
  due: number
  billCount: number
}

export interface VendorSummary {
  totalBilled: number
  totalPaid: number
  due: number
  billCount: number
  paymentCount: number
}

// A vendor bill (expense) with its per-bill paid/due derived from allocations.
export interface VendorBillLine extends Expense {
  paid: number
  due: number
}

export interface VendorDetail {
  vendor: Vendor
  bills: VendorBillLine[]
  payments: VendorPayment[]
  summary: VendorSummary
}

// One vendor's engagement on a single project: a Total Bill (set once) plus the
// running payments made against it. due = totalBill − paid.
export interface ProjectVendorLine {
  vendor: Vendor
  billIds: ID[]
  primaryBillId: ID
  category: string
  totalBill: number
  paid: number
  due: number
  payments: VendorPayment[] // oldest first
}

// =============================================================================
// API envelope
// =============================================================================

export interface ApiResponse<T> {
  ok: boolean
  data: T | null
  error: string | null
}

// Payloads for create operations (server assigns id + created_at).
export type NewClient = Omit<Client, 'id' | 'created_at'>
export type NewProject = Omit<Project, 'id' | 'created_at'>
export type NewPayment = Omit<Payment, 'id' | 'created_at'>
export type NewExpense = Omit<Expense, 'id' | 'created_at'>
export type NewVendor = Omit<Vendor, 'id' | 'created_at'>
export type NewVendorPayment = Omit<VendorPayment, 'id' | 'created_at'>
export type NewAsset = Omit<Asset, 'id' | 'created_at'>
