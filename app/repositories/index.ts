// Repository pattern — the ONLY place that knows about API route names.
// Stores depend on these typed methods, not on raw paths/transport. Swapping
// the data source (mock ↔ Apps Script ↔ future Supabase) happens here + useApi.
import type {
  Client,
  ClientRevenueReportRow,
  DashboardData,
  Expense,
  MonthlyReportRow,
  NewClient,
  NewExpense,
  NewPayment,
  NewProject,
  Payment,
  Project,
  ProjectProfitReportRow,
  ProjectWithMetrics,
} from '~/types'

export interface ProjectDetail {
  project: ProjectWithMetrics
  payments: Payment[]
  expenses: Expense[]
}

export function useRepositories() {
  const api = useApi()

  return {
    isMock: api.isMock,

    auth: {
      // Returns the API token to use for subsequent requests on success.
      login: (password: string) => api.post<{ token: string }>('login', { password }),
    },

    dashboard: {
      get: () => api.get<DashboardData>('dashboard'),
    },

    clients: {
      list: () => api.get<Client[]>('clients'),
      create: (payload: NewClient) => api.post<Client>('client', payload),
    },

    projects: {
      list: () => api.get<ProjectWithMetrics[]>('projects'),
      get: (id: string) => api.get<ProjectDetail>('project', { id }),
      create: (payload: NewProject) => api.post<Project>('project', payload),
    },

    payments: {
      list: () => api.get<Payment[]>('payments'),
      create: (payload: NewPayment) => api.post<Payment>('payment', payload),
    },

    expenses: {
      list: () => api.get<Expense[]>('expenses'),
      create: (payload: NewExpense) => api.post<Expense>('expense', payload),
    },

    reports: {
      monthly: () => api.get<MonthlyReportRow[]>('reports/monthly'),
      projectProfit: () => api.get<ProjectProfitReportRow[]>('reports/project-profit'),
      clientRevenue: () => api.get<ClientRevenueReportRow[]>('reports/client-revenue'),
    },
  }
}
