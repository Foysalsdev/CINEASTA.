<div align="center">

# CINEASTA — Agency Profit Tracker

**Know your revenue, expenses, profit and dues at a glance.**

Nuxt 4 · Vue 3 · TypeScript · Tailwind · Pinia · PWA → Google Apps Script → Google Sheets

</div>

---

CINEASTA is a focused, fast finance app for agency owners. It is **not** an ERP,
CRM or project-management tool — it answers six questions and answers them well:

- How much revenue was collected?
- How much expense was spent?
- How much profit was earned?
- Which projects are profitable?
- Which clients still owe money?
- What is the monthly profit trend?

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000  (runs in MOCK mode by default)
npm run build        # production build
npm run preview      # serve the production build
```

With no backend configured the app runs on **built-in demo data** (persisted to
`localStorage`), so it is fully usable immediately and deploys to Vercel as-is.
To use real data, wire up the Google Sheets backend (see below).

## Architecture

```
┌────────────────────┐     HTTPS (JSON)      ┌─────────────────────┐      ┌───────────────┐
│   PWA (Nuxt 4)     │ ───────────────────▶ │ Apps Script Web App │ ──▶ │ Google Sheets │
│  Vue · Pinia · TW  │ ◀─────────────────── │  (single /exec URL) │ ◀── │  4 tabs (DB)  │
└────────────────────┘   { ok, data, error } └─────────────────────┘      └───────────────┘
```

**All business logic is centralized** in [`app/utils/calculations.ts`](app/utils/calculations.ts)
and mirrored in [`server/apps-script/Code.gs`](server/apps-script/Code.gs).
UI components never compute money math — they call the calculation layer.

### Data flow / layering

```
Pages / Components  →  Pinia Stores  →  Repositories  →  useApi (transport)  →  mock | Apps Script
                              ▲
                              └── all derived numbers come from utils/calculations.ts
```

## Folder structure

```
app/
  assets/css/main.css        # Tailwind layers + component classes
  components/
    charts/                  # LineChart, DonutChart, BarList (pure SVG)
    forms/                   # Client/Project/Payment/Expense forms + validation
    layout/                  # BottomNav, Fab, QuickAddSheet, ToastHost
    *.vue                    # KpiCard, SectionCard, StateBlock, AppModal, StatusBadge, BrandMark
  composables/
    useApi.ts                # transport: mock ↔ Apps Script
    useFormat.ts             # currency / date / percent formatting (no math)
  data/
    mockData.ts              # seed dataset + localStorage persistence
    mockApi.ts               # mock backend mirroring the real API shape
  pages/                     # index (dashboard), projects, projects/[id], payments, expenses, reports, clients
  repositories/index.ts      # repository pattern — the only place that knows route names
  stores/                    # Pinia: dashboard, projects, clients, payments, expenses, reports, ui
  types/index.ts             # domain + view-model + API types
  utils/
    calculations.ts          # ⭐ centralized business logic (divide-by-zero safe)
    reports.ts               # report builders (compose calculations)
    constants.ts             # categories, methods, statuses, colors
server/apps-script/          # Google Apps Script backend + setup guide
public/icons/                # PWA icons generated from the CINEASTA logo
```

## Screen map

**Bottom nav = 5 tabs only** (never an ERP): **Home · Projects · Finance · Reports · More**.

| Route            | Screen           | Highlights                                                        |
| ---------------- | ---------------- | ----------------------------------------------------------------- |
| `/login`         | Passcode login   | branded lock screen; financials are private behind a passcode      |
| `/`              | Dashboard        | KPI cards (incl. receivable & payable due), trend, donut, rankings, quick-add |
| `/projects`      | Projects         | searchable list with received/cost/profit, per-row Details + PDF actions |
| `/projects/[id]` | Project detail   | summary grid + Overview / Payments / Expenses tabs, scoped quick-add |
| `/projects/[id]/statement` | Statement | branded, printable statement → Print / Save as PDF (works on iPhone) |
| `/finance`       | Finance          | sub-tabs: **Payments · Expenses · Vendors** (no separate nav items) |
| `/vendors/[id]`  | Vendor detail    | tabs: **Bills · Payments · Summary** + Pay vendor                  |
| `/more`          | More             | Assets, Bulk Entry (Expenses/Payments/Vendor Payments/CSV), Lock   |
| `/assets`        | Assets           | equipment registry (under More)                                   |

### Single expense system

One unified Expense with a **type**: `Project Expense · Internal Expense ·
Asset Purchase · Maintenance`. No separate modules for Vendor Bills, Vendor
Payments, Internal Expense or Asset Maintenance — they live inside Finance /
Vendors / More. **Vendor dues** are computed at vendor level (Σ bills − Σ vendor
payments = due, "kar koto baki").
| `/payments`      | Payments         | all payments, total received                                      |
| `/expenses`      | Expenses         | all expenses, total spent                                         |
| `/reports`       | Reports          | Monthly · Project Profit · Client Revenue tables                  |
| `/clients`       | Clients          | client directory                                                  |

Mobile-first: fixed **bottom navigation** (5 tabs) + a thumb-reachable **FAB**
opening a Quick-Add sheet. Every list has explicit loading, empty and error states.

## Business calculations

| Metric            | Formula                                        | Notes                    |
| ----------------- | ---------------------------------------------- | ------------------------ |
| Total Received    | `Σ payments.amount`                            |                          |
| Total Expense     | `Σ expenses.amount`                            |                          |
| Outstanding Due   | `max(0, contract_value − received)`            | never negative           |
| Current Profit    | `received − expense`                           |                          |
| Expected Profit   | `contract_value − expense`                     |                          |
| Profit Margin     | `(current_profit / received) × 100`            | divide-by-zero → 0       |
| Collection Rate   | `(received / contract_value) × 100`            | divide-by-zero → 0       |
| Avg Project Profit| `Σ current_profit / project_count`             | divide-by-zero → 0       |

## Database schema (Google Sheets)

See [`server/apps-script/README.md`](server/apps-script/README.md) for the exact
column layout, deployment steps and the full endpoint table.

## Login / security

The app is a private, auth-gated SPA (`ssr: false`) — every route is behind a
passcode (`/login`). In **mock/demo mode** the passcode is `cineasta`
(override with `NUXT_PUBLIC_APP_PASSCODE`). In **live mode** the passcode is
verified server-side by Apps Script (`SCRIPT_PASSWORD`); on success the backend
returns the API token, so the real password never ships in the client bundle.
Multi-user accounts are deferred to Phase 3.

## PWA

Installable on Android, iPhone and desktop. Manifest + maskable icons (generated
from the logo), offline app-shell via Workbox, and `NetworkFirst` caching of the
Apps Script API so the dashboard opens instantly and stays usable offline.

## Deploy to Vercel

1. Import the repo into Vercel (framework auto-detected as Nuxt).
2. (Optional) set `NUXT_PUBLIC_API_BASE_URL` / `NUXT_PUBLIC_API_TOKEN` to use
   live Google Sheets data. Without them, the app ships with demo data.

## Roadmap

- **Phase 1 (done):** 5-tab nav, Dashboard, Projects, Finance (Payments/Expenses/Vendors),
  single Expense system with types, vendor dues, Assets, Reports (incl. Dues), PWA, login.
- **Phase 2 (next):** Attachments / receipts → Google Drive on every transaction;
  Bulk Entry (Bulk Expenses / Payments / Vendor Payments) + CSV import; cash-flow view;
  recurring expenses.
- **Phase 3:** Advanced accounting, tax reports, multi-user, **Supabase** migration.

The repository pattern + transport layer mean swapping Sheets → Supabase is a
change in `useApi.ts` and the repositories only — stores, UI and calculations
stay untouched.
