// In-memory demo dataset used when NUXT_PUBLIC_API_BASE_URL is not configured.
// Mutations persist to localStorage so the demo behaves like a real app across
// reloads. This lets CINEASTA deploy to Vercel and be fully usable before the
// Google Sheets / Apps Script backend is connected.
import type {
  Client,
  Expense,
  ExpenseCategory,
  Payment,
  PaymentMethod,
  Project,
  ProjectStatus,
} from '~/types'

const STORAGE_KEY = 'cineasta:mockdb:v2'

export interface MockDB {
  clients: Client[]
  projects: Project[]
  payments: Payment[]
  expenses: Expense[]
}

function iso(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().slice(0, 10)
}

function seed(): MockDB {
  const clients: Client[] = [
    { id: 'c1', name: 'Aurora Studios', phone: '+8801711000001', email: 'hello@aurora.co', notes: 'Retainer client', created_at: iso(200) },
    { id: 'c2', name: 'Nebula Foods', phone: '+8801711000002', email: 'mkt@nebula.com', notes: 'Quarterly campaigns', created_at: iso(170) },
    { id: 'c3', name: 'Orbit Tech', phone: '+8801711000003', email: 'ceo@orbit.io', notes: '', created_at: iso(120) },
    { id: 'c4', name: 'Lumen Realty', phone: '+8801711000004', email: 'info@lumen.com', notes: 'Pays slowly', created_at: iso(90) },
  ]

  const projects: Project[] = [
    { id: 'p1', client_id: 'c1', project_name: 'Brand Film 2026', contract_value: 450000, start_date: iso(150), status: 'active', created_at: iso(150) },
    { id: 'p2', client_id: 'c1', project_name: 'Social Reels Pack', contract_value: 120000, start_date: iso(80), status: 'completed', created_at: iso(80) },
    { id: 'p3', client_id: 'c2', project_name: 'Ramadan Campaign', contract_value: 300000, start_date: iso(110), status: 'completed', created_at: iso(110) },
    { id: 'p4', client_id: 'c3', project_name: 'Product Launch Video', contract_value: 220000, start_date: iso(60), status: 'active', created_at: iso(60) },
    { id: 'p5', client_id: 'c4', project_name: 'Property Walkthroughs', contract_value: 180000, start_date: iso(45), status: 'on_hold', created_at: iso(45) },
  ]

  const pay = (id: string, project_id: string, amount: number, method: PaymentMethod, daysAgo: number): Payment => ({
    id, project_id, amount, payment_method: method, payment_date: iso(daysAgo), notes: '', created_at: iso(daysAgo),
  })
  const payments: Payment[] = [
    pay('pay1', 'p1', 200000, 'bank', 140),
    pay('pay2', 'p1', 150000, 'bank', 60),
    pay('pay3', 'p2', 120000, 'bkash', 70),
    pay('pay4', 'p3', 300000, 'bank', 95),
    pay('pay5', 'p4', 100000, 'bank', 50),
    pay('pay6', 'p4', 60000, 'cash', 15),
    pay('pay7', 'p5', 40000, 'nagad', 30),
  ]

  const exp = (id: string, project_id: string, category: ExpenseCategory, amount: number, daysAgo: number): Expense => ({
    id, project_id, category, amount, expense_date: iso(daysAgo), notes: '', created_at: iso(daysAgo),
  })
  const expenses: Expense[] = [
    exp('e1', 'p1', 'DOP & Camera Unit', 80000, 130),
    exp('e2', 'p1', 'Light & Gear', 42000, 120),
    exp('e3', 'p1', 'Transportation', 19000, 55),
    exp('e4', 'p2', 'Directorial Team', 40000, 72),
    exp('e5', 'p3', 'Artist & Casting', 60000, 100),
    exp('e6', 'p3', 'Catering & Meal', 28000, 96),
    exp('e7', 'p4', 'Location & Studio Rental', 35000, 48),
    exp('e8', 'p4', 'Post Production', 25000, 20),
    exp('e9', 'p5', 'Prop & Wardrobe', 17000, 25),
    exp('e10', 'p5', 'Generator & Fuel', 9000, 10),
  ]

  return { clients, projects, payments, expenses }
}

let cache: MockDB | null = null

export function loadDB(): MockDB {
  if (cache) return cache
  if (import.meta.client) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        cache = JSON.parse(raw) as MockDB
        return cache
      }
    } catch {
      /* ignore corrupt storage */
    }
  }
  cache = seed()
  persist()
  return cache
}

export function persist(): void {
  if (import.meta.client && cache) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
    } catch {
      /* storage full / unavailable — keep in-memory copy */
    }
  }
}

export function resetDB(): MockDB {
  cache = seed()
  persist()
  return cache
}

export function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export type { ProjectStatus }
