# CINEASTA Backend — Google Apps Script + Google Sheets

The backend is a single Apps Script Web App bound to one Google Sheet. It serves
every endpoint via a `path` query parameter and returns a uniform JSON envelope:

```json
{ "ok": true, "data": <payload>, "error": null }
```

## 1. Create the spreadsheet

1. Create a new Google Sheet named **CINEASTA Profit Tracker**.
2. Create four tabs (or let `setupSheets()` create them) with these exact
   header rows:

| Sheet    | Columns (row 1)                                                              |
| -------- | ---------------------------------------------------------------------------- |
| Clients  | `id, name, phone, email, notes, created_at`                                  |
| Projects | `id, client_id, project_name, contract_value, start_date, status, created_at`|
| Payments | `id, project_id, amount, payment_method, payment_date, notes, created_at`    |
| Expenses | `id, project_id, category, amount, expense_date, notes, created_at`          |

## 2. Add the script

1. In the sheet: **Extensions → Apps Script**.
2. Replace `Code.gs` with the contents of [`Code.gs`](./Code.gs).
3. (Optional) set `SCRIPT_TOKEN` to a random string for a shared-secret check.
4. Run `setupSheets()` once (authorize when prompted) to create the tabs.

## 3. Deploy as a Web App

1. **Deploy → New deployment → type: Web app**.
2. **Execute as:** Me. **Who has access:** Anyone.
3. Copy the deployment URL (ends in `/exec`).

## 4. Connect the PWA

Set the env var on Vercel (or `.env` locally):

```
NUXT_PUBLIC_API_BASE_URL=https://script.google.com/macros/s/XXXX/exec
NUXT_PUBLIC_API_TOKEN=<same as SCRIPT_TOKEN, or leave blank>
```

When `NUXT_PUBLIC_API_BASE_URL` is empty the frontend runs in **mock mode**
with built-in demo data — no backend required.

## Endpoints

| Method | `path`                    | Returns                                            |
| ------ | ------------------------- | -------------------------------------------------- |
| GET    | `dashboard`               | KPIs, monthly trend, breakdown, rankings, recent   |
| GET    | `clients`                 | `Client[]`                                          |
| GET    | `projects`                | `ProjectWithMetrics[]`                              |
| GET    | `project` (`&id=`)        | `{ project, payments[], expenses[] }`               |
| GET    | `payments`                | `Payment[]`                                         |
| GET    | `expenses`                | `Expense[]`                                         |
| GET    | `reports/monthly`         | `MonthlyReportRow[]`                                |
| GET    | `reports/project-profit`  | `ProjectProfitReportRow[]`                          |
| GET    | `reports/client-revenue`  | `ClientRevenueReportRow[]`                          |
| POST   | `client`                  | created `Client`                                    |
| POST   | `project`                 | created `Project`                                   |
| POST   | `payment`                 | created `Payment`                                   |
| POST   | `expense`                 | created `Expense`                                   |

All POST bodies are JSON sent with `Content-Type: text/plain` (avoids a CORS
preflight against Apps Script). Validation, logging and error handling are
built in; failures return `{ ok: false, data: null, error: "<message>" }`.

> The calculation functions in `Code.gs` are a 1:1 mirror of
> `app/utils/calculations.ts`, so the client and server always agree.
