/**
 * =============================================================================
 * CINEASTA — Agency Profit Tracker · Google Apps Script Web App backend
 * =============================================================================
 *
 * Architecture:  PWA  →  Apps Script Web App (this file)  →  Google Sheets
 *
 * Deploy: Extensions → Apps Script → paste this file → Deploy → New deployment
 *         → type "Web app" → Execute as "Me" → Access "Anyone".
 *         Copy the /exec URL into the PWA env var NUXT_PUBLIC_API_BASE_URL.
 *
 * Routing is via the `path` query parameter so a single Web App serves every
 * endpoint, e.g.  …/exec?path=dashboard   …/exec?path=payment (POST).
 *
 * Business calculations below are a 1:1 mirror of app/utils/calculations.ts so
 * the client and server NEVER disagree on the numbers.
 * =============================================================================
 */

// ---- Configuration ----------------------------------------------------------
// Optional shared secret. If set, requests must include &token=THIS_VALUE.
// Leave '' to disable. Keep in sync with NUXT_PUBLIC_API_TOKEN on the frontend.
var SCRIPT_TOKEN = '';

// Passcode the owner types on the PWA login screen. Verified server-side; on
// success the backend hands back SCRIPT_TOKEN for subsequent requests, so the
// real password never ships inside the frontend bundle. Leave '' to allow any.
var SCRIPT_PASSWORD = '';

// Google Drive folder for uploaded receipts/attachments. Leave '' to auto-use
// (or create) a folder named "CINEASTA Receipts" in the script owner's Drive.
var DRIVE_FOLDER_ID = '';

var SHEETS = {
  Clients: ['id', 'name', 'phone', 'email', 'notes', 'created_at'],
  Projects: ['id', 'client_id', 'project_name', 'contract_value', 'start_date', 'status', 'created_at'],
  Payments: ['id', 'project_id', 'amount', 'payment_method', 'payment_date', 'notes', 'attachments', 'created_at'],
  Expenses: ['id', 'type', 'project_id', 'vendor_id', 'asset_id', 'category', 'amount', 'expense_date', 'notes', 'attachments', 'created_at'],
  Vendors: ['id', 'name', 'category', 'phone', 'email', 'notes', 'created_at'],
  VendorPayments: ['id', 'vendor_id', 'bill_id', 'amount', 'payment_method', 'payment_date', 'notes', 'attachments', 'created_at'],
  Assets: ['id', 'name', 'category', 'purchase_value', 'purchase_date', 'notes', 'created_at']
};

// Expense categories are free-form; this list is only reference documentation.
var EXPENSE_CATEGORIES = ['Directorial Team', 'DOP & Camera Unit', 'Light & Gear', 'Art / Set', 'Prop & Wardrobe', 'Costume & Makeup', 'Artist & Casting', 'Location & Studio Rental', 'Transportation', 'Catering & Meal', 'Production Crew', 'Generator & Fuel', 'Post Production', 'Sound & Music', 'Computer Graphics (CG)', 'Miscellaneous'];

// ---- HTTP entry points ------------------------------------------------------

function doGet(e) {
  return handle('GET', e);
}

function doPost(e) {
  return handle('POST', e);
}

function handle(method, e) {
  try {
    var params = (e && e.parameter) || {};
    var path = params.path || '';
    // The login route is exempt — it is how a client obtains the token.
    if (path !== 'login' && SCRIPT_TOKEN && params.token !== SCRIPT_TOKEN) {
      return json({ ok: false, data: null, error: 'Unauthorized' });
    }
    var body = {};
    if (method === 'POST' && e.postData && e.postData.contents) {
      try { body = JSON.parse(e.postData.contents); } catch (err) { body = {}; }
    }
    log_(method + ' ' + path);

    var data = route(method, path, params, body);
    return json({ ok: true, data: data, error: null });
  } catch (err) {
    log_('ERROR: ' + (err && err.message ? err.message : err));
    return json({ ok: false, data: null, error: String(err && err.message ? err.message : err) });
  }
}

function route(method, path, params, body) {
  if (method === 'GET') {
    switch (path) {
      case 'dashboard': return buildDashboard();
      case 'clients': return readAll('Clients');
      case 'projects': return projectsWithMetrics();
      case 'project': return projectDetail(params.id);
      case 'payments': return readAll('Payments');
      case 'expenses': return readAll('Expenses');
      case 'vendors': return readAll('Vendors');
      case 'vendor': return vendorDetail(params.id);
      case 'assets': return readAll('Assets');
      case 'reports/monthly': return buildMonthlyReport(12);
      case 'reports/project-profit': return buildProjectProfitReport();
      case 'reports/client-revenue': return buildClientRevenueReport();
      case 'reports/vendor-dues': return buildVendorDuesReport();
      default: throw new Error('Unknown GET route: ' + path);
    }
  }
  switch (path) {
    case 'login': return login(body);
    case 'upload': return handleUpload(body);
    case 'client': return createClient(body);
    case 'project': return createProject(body);
    case 'payment': return createPayment(body);
    case 'expense': return createExpense(body);
    case 'expense-update': return updateExpense(body);
    case 'project-update': return updateProject(body);
    case 'vendor': return createVendor(body);
    case 'vendor-payment': return createVendorPayment(body);
    case 'asset': return createAsset(body);
    default: throw new Error('Unknown POST route: ' + path);
  }
}

// ---- Sheet helpers ----------------------------------------------------------

function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }

function sheet_(name) {
  var sh = ss_().getSheetByName(name);
  if (!sh) {
    sh = ss_().insertSheet(name);
    sh.appendRow(SHEETS[name]);
  }
  return sh;
}

function readAll(name) {
  var sh = sheet_(name);
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0];
  var rows = [];
  for (var r = 1; r < values.length; r++) {
    var obj = {};
    for (var c = 0; c < headers.length; c++) obj[headers[c]] = values[r][c];
    if (obj.id === '' || obj.id === null || obj.id === undefined) continue;
    // attachments is stored as a JSON string; expose it as an array.
    if (obj.attachments !== undefined) {
      try { obj.attachments = obj.attachments ? JSON.parse(obj.attachments) : []; }
      catch (e) { obj.attachments = []; }
    }
    rows.push(obj);
  }
  return rows;
}

function appendRow_(name, obj) {
  var sh = sheet_(name);
  var row = SHEETS[name].map(function (key) {
    if (key === 'attachments') return JSON.stringify(obj.attachments || []);
    return obj[key] !== undefined ? obj[key] : '';
  });
  sh.appendRow(row);
  return obj;
}

function genId_(prefix) {
  return prefix + '_' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
}

function nowIso_() { return new Date().toISOString(); }
function today_() { return new Date().toISOString().slice(0, 10); }

function log_(msg) { Logger.log(msg); }

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ---- Calculation primitives (mirror of calculations.ts) ---------------------

function num_(v) { var n = typeof v === 'number' ? v : parseFloat(String(v)); return isFinite(n) ? n : 0; }
function safeDivide_(a, b) { if (!b) return 0; var r = a / b; return isFinite(r) ? r : 0; }
function round2_(v) { return Math.round((v + Number.EPSILON) * 100) / 100; }
function sumBy_(arr, sel) { var s = 0; for (var i = 0; i < arr.length; i++) s += num_(sel(arr[i])); return round2_(s); }

function monthKey_(d) {
  if (!d) return '';
  var dt = new Date(d);
  if (isNaN(dt.getTime())) return '';
  return dt.getFullYear() + '-' + ('0' + (dt.getMonth() + 1)).slice(-2);
}
function monthLabel_(key) {
  var p = key.split('-'); if (p.length < 2) return key;
  var dt = new Date(Number(p[0]), Number(p[1]) - 1, 1);
  return Utilities.formatDate(dt, Session.getScriptTimeZone(), 'MMM yy');
}

function computeMetrics_(project, payments, expenses) {
  var received = sumBy_(payments, function (p) { return p.amount; });
  var expense = sumBy_(expenses, function (x) { return x.amount; });
  var profit = round2_(received - expense);
  var contract = num_(project.contract_value);
  return {
    totalReceived: received,
    totalExpense: expense,
    outstandingDue: round2_(Math.max(0, contract - received)),
    currentProfit: profit,
    expectedProfit: round2_(contract - expense),
    profitMargin: round2_(safeDivide_(profit, received) * 100),
    collectionRate: round2_(safeDivide_(received, contract) * 100)
  };
}

function projectVendorDue_(projectId, expenses, vendorPayments) {
  var bills = expenses.filter(function (e) { return e.project_id === projectId && e.vendor_id; });
  var billIds = {};
  bills.forEach(function (b) { billIds[b.id] = true; });
  var billed = sumBy_(bills, function (b) { return b.amount; });
  var paid = sumBy_(vendorPayments.filter(function (vp) { return billIds[vp.bill_id]; }), function (vp) { return vp.amount; });
  return round2_(Math.max(0, billed - paid));
}

// Auto-completes an 'active' project once the client has paid in full AND
// every vendor bill on it is settled. Any other status (on_hold, cancelled,
// or a status the user already set by hand) is left untouched — status stays
// editable afterwards via project-update.
function autoCompleteIfSettled_(projectId) {
  if (!projectId) return;
  var sh = sheet_('Projects');
  var values = sh.getDataRange().getValues();
  var headers = values[0];
  var idCol = headers.indexOf('id');
  var statusCol = headers.indexOf('status');
  var contractCol = headers.indexOf('contract_value');
  for (var r = 1; r < values.length; r++) {
    if (String(values[r][idCol]) !== String(projectId)) continue;
    if (values[r][statusCol] !== 'active') return;
    var payments = readAll('Payments').filter(function (p) { return p.project_id === projectId; });
    var expenses = readAll('Expenses').filter(function (x) { return x.project_id === projectId; });
    var vendorPayments = readAll('VendorPayments');
    var received = sumBy_(payments, function (p) { return p.amount; });
    var due = round2_(Math.max(0, num_(values[r][contractCol]) - received));
    var vendorDue = projectVendorDue_(projectId, expenses, vendorPayments);
    if (due <= 0 && vendorDue <= 0) sh.getRange(r + 1, statusCol + 1).setValue('completed');
    return;
  }
}

function indexByProject_(rows) {
  var map = {};
  for (var i = 0; i < rows.length; i++) {
    var k = rows[i].project_id;
    (map[k] = map[k] || []).push(rows[i]);
  }
  return map;
}

// ---- Composite reads --------------------------------------------------------

function projectsWithMetrics() {
  var projects = readAll('Projects');
  var clients = readAll('Clients');
  var payments = readAll('Payments');
  var expenses = readAll('Expenses');
  var clientName = {};
  clients.forEach(function (c) { clientName[c.id] = c.name; });
  var payByP = indexByProject_(payments);
  var expByP = indexByProject_(expenses);
  return projects.map(function (p) {
    p.client_name = clientName[p.client_id] || '—';
    p.contract_value = num_(p.contract_value);
    p.metrics = computeMetrics_(p, payByP[p.id] || [], expByP[p.id] || []);
    return p;
  });
}

function projectDetail(id) {
  if (!id) throw new Error('Project id is required');
  var projects = readAll('Projects');
  var project = null;
  for (var i = 0; i < projects.length; i++) if (projects[i].id === id) { project = projects[i]; break; }
  if (!project) throw new Error('Project not found');
  var clients = readAll('Clients');
  var clientName = {};
  clients.forEach(function (c) { clientName[c.id] = c.name; });
  var payments = readAll('Payments').filter(function (p) { return p.project_id === id; });
  var expenses = readAll('Expenses').filter(function (x) { return x.project_id === id; });
  var billIds = {};
  expenses.forEach(function (e) { billIds[e.id] = true; });
  var vendorPayments = readAll('VendorPayments').filter(function (vp) { return billIds[vp.bill_id]; });
  project.client_name = clientName[project.client_id] || '—';
  project.contract_value = num_(project.contract_value);
  project.metrics = computeMetrics_(project, payments, expenses);
  return { project: project, payments: payments, expenses: expenses, vendorPayments: vendorPayments };
}

function buildDashboard() {
  var projects = readAll('Projects');
  var clients = readAll('Clients');
  var payments = readAll('Payments');
  var expenses = readAll('Expenses');
  var withMetrics = projectsWithMetrics();

  var vendorPayments = readAll('VendorPayments');
  var totalRevenue = sumBy_(payments, function (p) { return p.amount; });
  var totalExpense = sumBy_(expenses, function (x) { return x.amount; });
  var billedWithVendor = sumBy_(expenses.filter(function (x) { return x.vendor_id; }), function (x) { return x.amount; });
  var paidToVendors = sumBy_(vendorPayments, function (x) { return x.amount; });
  var payableDue = round2_(Math.max(0, billedWithVendor - paidToVendors));
  var totalContract = sumBy_(projects, function (p) { return p.contract_value; });
  var totalProjectProfit = sumBy_(withMetrics, function (p) { return p.metrics.currentProfit; });

  return {
    kpis: {
      totalRevenue: totalRevenue,
      totalExpense: totalExpense,
      netProfit: round2_(totalRevenue - totalExpense),
      outstandingDue: round2_(Math.max(0, totalContract - totalRevenue)),
      payableDue: payableDue,
      collectionRate: round2_(safeDivide_(totalRevenue, totalContract) * 100),
      averageProjectProfit: round2_(safeDivide_(totalProjectProfit, projects.length)),
      projectCount: projects.length,
      clientCount: clients.length
    },
    monthly: monthlyTrend_(payments, expenses, 6),
    expenseBreakdown: expenseBreakdown_(expenses),
    topProjectsByProfit: withMetrics.slice().sort(function (a, b) { return b.metrics.currentProfit - a.metrics.currentProfit; }).slice(0, 5).map(function (p) { return { id: p.id, name: p.project_name, value: p.metrics.currentProfit }; }),
    topClientsByRevenue: topClientsByRevenue_(withMetrics, clients),
    recentPayments: recent_(payments, 'payment_date', 5),
    recentExpenses: recent_(expenses, 'expense_date', 5)
  };
}

function monthlyTrend_(payments, expenses, monthsBack) {
  var rev = {}, exp = {};
  payments.forEach(function (p) { var k = monthKey_(p.payment_date); if (k) rev[k] = (rev[k] || 0) + num_(p.amount); });
  expenses.forEach(function (x) { var k = monthKey_(x.expense_date); if (k) exp[k] = (exp[k] || 0) + num_(x.amount); });
  var keys = [], now = new Date();
  for (var i = monthsBack - 1; i >= 0; i--) {
    var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2));
  }
  return keys.map(function (k) {
    var r = round2_(rev[k] || 0), e = round2_(exp[k] || 0);
    return { month: k, label: monthLabel_(k), revenue: r, expense: e, profit: round2_(r - e) };
  });
}

function expenseBreakdown_(expenses) {
  var totals = {};
  expenses.forEach(function (x) {
    var cat = (x.category && String(x.category).trim()) || 'Uncategorized';
    totals[cat] = (totals[cat] || 0) + num_(x.amount);
  });
  var grand = 0; Object.keys(totals).forEach(function (k) { grand += totals[k]; });
  return Object.keys(totals).map(function (cat) {
    return { category: cat, amount: round2_(totals[cat]), percent: round2_(safeDivide_(totals[cat], grand) * 100) };
  }).sort(function (a, b) { return b.amount - a.amount; });
}

function topClientsByRevenue_(withMetrics, clients) {
  var rev = {}, cnt = {};
  withMetrics.forEach(function (p) {
    rev[p.client_id] = (rev[p.client_id] || 0) + p.metrics.totalReceived;
    cnt[p.client_id] = (cnt[p.client_id] || 0) + 1;
  });
  return clients.map(function (c) {
    return { id: c.id, name: c.name, revenue: round2_(rev[c.id] || 0), projectCount: cnt[c.id] || 0 };
  }).sort(function (a, b) { return b.revenue - a.revenue; }).slice(0, 5);
}

function recent_(rows, dateField, limit) {
  return rows.slice().sort(function (a, b) {
    return new Date(b[dateField] || b.created_at).getTime() - new Date(a[dateField] || a.created_at).getTime();
  }).slice(0, limit);
}

// ---- Reports ----------------------------------------------------------------

function buildMonthlyReport(monthsBack) {
  return monthlyTrend_(readAll('Payments'), readAll('Expenses'), monthsBack);
}

function buildProjectProfitReport() {
  return projectsWithMetrics().map(function (p) {
    return { id: p.id, project: p.project_name, revenue: p.metrics.totalReceived, expense: p.metrics.totalExpense, profit: p.metrics.currentProfit, margin: p.metrics.profitMargin };
  }).sort(function (a, b) { return b.profit - a.profit; });
}

function buildClientRevenueReport() {
  var withMetrics = projectsWithMetrics();
  var clients = readAll('Clients');
  var rev = {}, cnt = {};
  withMetrics.forEach(function (p) {
    rev[p.client_id] = (rev[p.client_id] || 0) + p.metrics.totalReceived;
    cnt[p.client_id] = (cnt[p.client_id] || 0) + 1;
  });
  return clients.map(function (c) {
    return { id: c.id, client: c.name, revenue: round2_(rev[c.id] || 0), projectCount: cnt[c.id] || 0 };
  }).sort(function (a, b) { return b.revenue - a.revenue; });
}

function vendorSummary_(vendorId, expenses, vendorPayments) {
  var bills = expenses.filter(function (e) { return e.vendor_id === vendorId; });
  var pays = vendorPayments.filter(function (vp) { return vp.vendor_id === vendorId; });
  var totalBilled = sumBy_(bills, function (e) { return e.amount; });
  var totalPaid = sumBy_(pays, function (vp) { return vp.amount; });
  return { totalBilled: totalBilled, totalPaid: totalPaid, due: round2_(totalBilled - totalPaid), billCount: bills.length, paymentCount: pays.length, bills: bills, payments: pays };
}

function vendorDetail(id) {
  if (!id) throw new Error('Vendor id is required');
  var vendors = readAll('Vendors');
  var vendor = null;
  for (var i = 0; i < vendors.length; i++) if (vendors[i].id === id) { vendor = vendors[i]; break; }
  if (!vendor) throw new Error('Vendor not found');
  var allExp = readAll('Expenses');
  var allVp = readAll('VendorPayments');
  var s = vendorSummary_(id, allExp, allVp);
  var pays = s.payments;
  var bills = s.bills.map(function (b) {
    var paid = sumBy_(pays.filter(function (vp) { return vp.bill_id === b.id; }), function (vp) { return vp.amount; });
    b.paid = paid;
    b.due = round2_(Math.max(0, num_(b.amount) - paid));
    return b;
  });
  return { vendor: vendor, bills: bills, payments: pays, summary: { totalBilled: s.totalBilled, totalPaid: s.totalPaid, due: s.due, billCount: s.billCount, paymentCount: s.paymentCount } };
}

function buildVendorDuesReport() {
  var vendors = readAll('Vendors');
  var expenses = readAll('Expenses');
  var vendorPayments = readAll('VendorPayments');
  return vendors.map(function (v) {
    var s = vendorSummary_(v.id, expenses, vendorPayments);
    return { id: v.id, vendor: v.name, totalBill: s.totalBilled, paid: s.totalPaid, due: s.due, billCount: s.billCount };
  }).filter(function (r) { return r.totalBill > 0 || r.paid > 0; })
    .sort(function (x, y) { return y.due - x.due; });
}

// ---- Create operations (with validation) ------------------------------------

function requireText_(v, field) {
  if (v === undefined || v === null || String(v).trim() === '') throw new Error(field + ' is required');
  return String(v).trim();
}
function requirePositive_(v, field) {
  var n = num_(v);
  if (!(n > 0)) throw new Error(field + ' must be greater than 0');
  return n;
}

function login(body) {
  if (SCRIPT_PASSWORD && String(body.password || '') !== SCRIPT_PASSWORD) {
    throw new Error('Incorrect passcode');
  }
  return { token: SCRIPT_TOKEN };
}

function createClient(body) {
  var row = {
    id: genId_('c'),
    name: requireText_(body.name, 'Client name'),
    phone: body.phone || '',
    email: body.email || '',
    notes: body.notes || '',
    created_at: nowIso_()
  };
  return appendRow_('Clients', row);
}

function createProject(body) {
  requireText_(body.client_id, 'Client');
  var row = {
    id: genId_('p'),
    client_id: body.client_id,
    project_name: requireText_(body.project_name, 'Project name'),
    contract_value: num_(body.contract_value),
    start_date: body.start_date || today_(),
    status: body.status || 'active',
    created_at: nowIso_()
  };
  return appendRow_('Projects', row);
}

function createPayment(body) {
  requireText_(body.project_id, 'Project');
  var row = {
    id: genId_('pay'),
    project_id: body.project_id,
    amount: requirePositive_(body.amount, 'Amount'),
    payment_method: body.payment_method || 'other',
    payment_date: body.payment_date || today_(),
    notes: body.notes || '',
    attachments: body.attachments || [],
    created_at: nowIso_()
  };
  var saved = appendRow_('Payments', row);
  autoCompleteIfSettled_(body.project_id);
  return saved;
}

function createExpense(body) {
  var type = body.type || 'project';
  if (type === 'project') requireText_(body.project_id, 'Project');
  var row = {
    id: genId_('e'),
    type: type,
    project_id: body.project_id || '',
    vendor_id: body.vendor_id || '',
    asset_id: body.asset_id || '',
    category: (body.category && String(body.category).trim()) || 'Uncategorized',
    amount: requirePositive_(body.amount, 'Amount'),
    expense_date: body.expense_date || today_(),
    notes: body.notes || '',
    attachments: body.attachments || [],
    created_at: nowIso_()
  };
  return appendRow_('Expenses', row);
}

function createVendor(body) {
  var row = {
    id: genId_('v'),
    name: requireText_(body.name, 'Vendor name'),
    category: body.category || '',
    phone: body.phone || '',
    email: body.email || '',
    notes: body.notes || '',
    created_at: nowIso_()
  };
  return appendRow_('Vendors', row);
}

// Update editable fields of an existing expense (used to adjust a vendor's
// Total Bill on a project). Rewrites the matching row in place.
function updateExpense(body) {
  requireText_(body.id, 'Expense id');
  var sh = sheet_('Expenses');
  var values = sh.getDataRange().getValues();
  var headers = values[0];
  var idCol = headers.indexOf('id');
  for (var r = 1; r < values.length; r++) {
    if (String(values[r][idCol]) !== String(body.id)) continue;
    var editable = ['amount', 'category', 'notes', 'expense_date'];
    for (var k = 0; k < editable.length; k++) {
      var key = editable[k];
      if (body[key] === undefined) continue;
      var col = headers.indexOf(key);
      if (col < 0) continue;
      values[r][col] = key === 'amount' ? num_(body[key]) : body[key];
    }
    sh.getRange(r + 1, 1, 1, headers.length).setValues([values[r]]);
    var obj = {};
    for (var c = 0; c < headers.length; c++) obj[headers[c]] = values[r][c];
    return obj;
  }
  throw new Error('Expense not found');
}

// Update editable fields of an existing project — used for the status
// dropdown (and any other field) on the project detail page.
function updateProject(body) {
  requireText_(body.id, 'Project id');
  var sh = sheet_('Projects');
  var values = sh.getDataRange().getValues();
  var headers = values[0];
  var idCol = headers.indexOf('id');
  for (var r = 1; r < values.length; r++) {
    if (String(values[r][idCol]) !== String(body.id)) continue;
    var editable = ['client_id', 'project_name', 'contract_value', 'start_date', 'status'];
    for (var k = 0; k < editable.length; k++) {
      var key = editable[k];
      if (body[key] === undefined) continue;
      var col = headers.indexOf(key);
      if (col < 0) continue;
      values[r][col] = key === 'contract_value' ? num_(body[key]) : body[key];
    }
    sh.getRange(r + 1, 1, 1, headers.length).setValues([values[r]]);
    var obj = {};
    for (var c = 0; c < headers.length; c++) obj[headers[c]] = values[r][c];
    return obj;
  }
  throw new Error('Project not found');
}

function createVendorPayment(body) {
  requireText_(body.vendor_id, 'Vendor');
  var row = {
    id: genId_('vp'),
    vendor_id: body.vendor_id,
    bill_id: body.bill_id || '',
    amount: requirePositive_(body.amount, 'Amount'),
    payment_method: body.payment_method || 'other',
    payment_date: body.payment_date || today_(),
    notes: body.notes || '',
    attachments: body.attachments || [],
    created_at: nowIso_()
  };
  var saved = appendRow_('VendorPayments', row);
  if (row.bill_id) {
    var bills = readAll('Expenses').filter(function (e) { return e.id === row.bill_id; });
    if (bills[0] && bills[0].project_id) autoCompleteIfSettled_(bills[0].project_id);
  }
  return saved;
}

// ---- Receipt upload → Google Drive ------------------------------------------

function getReceiptsFolder_() {
  if (DRIVE_FOLDER_ID) return DriveApp.getFolderById(DRIVE_FOLDER_ID);
  var name = 'CINEASTA Receipts';
  var it = DriveApp.getFoldersByName(name);
  return it.hasNext() ? it.next() : DriveApp.createFolder(name);
}

function handleUpload(body) {
  if (!body || !body.data) throw new Error('No file data');
  var bytes = Utilities.base64Decode(body.data);
  var blob = Utilities.newBlob(bytes, body.mime || 'application/octet-stream', body.name || 'receipt');
  var file = getReceiptsFolder_().createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { id: file.getId(), name: file.getName(), url: file.getUrl() };
}

function createAsset(body) {
  var row = {
    id: genId_('a'),
    name: requireText_(body.name, 'Asset name'),
    category: body.category || '',
    purchase_value: num_(body.purchase_value),
    purchase_date: body.purchase_date || today_(),
    notes: body.notes || '',
    created_at: nowIso_()
  };
  return appendRow_('Assets', row);
}

// ---- One-time setup helper --------------------------------------------------
// Run from the Apps Script editor once to create the four sheets with headers
// (and a couple of demo rows) in the bound spreadsheet.
function setupSheets() {
  Object.keys(SHEETS).forEach(function (name) { sheet_(name); });
  log_('Sheets ready: ' + Object.keys(SHEETS).join(', '));
}
