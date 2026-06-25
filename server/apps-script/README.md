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

| Sheet          | Columns (row 1)                                                              |
| -------------- | ---------------------------------------------------------------------------- |
| Clients        | `id, name, phone, email, notes, created_at`                                  |
| Projects       | `id, client_id, project_name, contract_value, start_date, status, created_at`|
| Payments       | `id, project_id, amount, payment_method, payment_date, notes, attachments, created_at` |
| Expenses       | `id, type, project_id, vendor_id, asset_id, category, amount, expense_date, notes, attachments, created_at` |
| Vendors        | `id, name, phone, email, notes, created_at`                                  |
| VendorPayments | `id, vendor_id, bill_id, amount, payment_method, payment_date, notes, attachments, created_at` |
| Assets         | `id, name, category, purchase_value, purchase_date, notes, created_at`       |

`Expenses.type` is one of `project · internal · asset · maintenance` (single
expense system). `vendor_id` / `asset_id` are optional links.

## 2. Add the script

1. In the sheet: **Extensions → Apps Script**.
2. Replace `Code.gs` with the contents of [`Code.gs`](./Code.gs).
3. (Optional) set `SCRIPT_TOKEN` to a random string for a shared-secret check,
   and `SCRIPT_PASSWORD` to the passcode the owner types on the login screen.
   On correct passcode the backend returns `SCRIPT_TOKEN`, so the real password
   never ships inside the frontend bundle.
4. (Optional) set `DRIVE_FOLDER_ID` to a Drive folder for receipts/attachments.
   If left blank, a folder named **CINEASTA Receipts** is created automatically.
   Uploaded files are shared as "anyone with the link can view" so they open
   from the app. Authorise the Drive scope on first `upload`.
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
| POST   | `login`                   | `{ token }` if the passcode matches `SCRIPT_PASSWORD` (token-exempt route) |
| POST   | `upload`                  | `{ id, name, url }` — saves a base64 file to Drive (receipts/attachments) |
| GET    | `dashboard`               | KPIs, monthly trend, breakdown, rankings, recent   |
| GET    | `clients`                 | `Client[]`                                          |
| GET    | `projects`                | `ProjectWithMetrics[]`                              |
| GET    | `project` (`&id=`)        | `{ project, payments[], expenses[] }`               |
| GET    | `payments`                | `Payment[]`                                         |
| GET    | `expenses`                | `Expense[]`                                         |
| GET    | `vendors`                 | `Vendor[]`                                          |
| GET    | `vendor` (`&id=`)         | `{ vendor, bills[], payments[], summary }`          |
| GET    | `assets`                  | `Asset[]`                                           |
| GET    | `reports/monthly`         | `MonthlyReportRow[]`                                |
| GET    | `reports/project-profit`  | `ProjectProfitReportRow[]`                          |
| GET    | `reports/client-revenue`  | `ClientRevenueReportRow[]`                          |
| GET    | `reports/vendor-dues`     | `VendorDuesReportRow[]` — "kar koto baki" per vendor |
| POST   | `client`                  | created `Client`                                    |
| POST   | `project`                 | created `Project`                                   |
| POST   | `payment`                 | created `Payment`                                   |
| POST   | `expense`                 | created `Expense` (with `type`)                     |
| POST   | `vendor`                  | created `Vendor`                                    |
| POST   | `vendor-payment`          | created `VendorPayment` (money paid to a vendor)    |
| POST   | `asset`                   | created `Asset`                                     |

All POST bodies are JSON sent with `Content-Type: text/plain` (avoids a CORS
preflight against Apps Script). Validation, logging and error handling are
built in; failures return `{ ok: false, data: null, error: "<message>" }`.

> The calculation functions in `Code.gs` are a 1:1 mirror of
> `app/utils/calculations.ts`, so the client and server always agree.
