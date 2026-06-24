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

var SHEETS = {
  Clients: ['id', 'name', 'phone', 'email', 'notes', 'created_at'],
  Projects: ['id', 'client_id', 'project_name', 'contract_value', 'start_date', 'status', 'created_at'],
  Payments: ['id', 'project_id', 'amount', 'payment_method', 'payment_date', 'notes', 'created_at'],
  Expenses: ['id', 'project_id', 'category', 'amount', 'expense_date', 'notes', 'created_at']
};

var EXPENSE_CATEGORIES = ['Salary', 'Marketing', 'Software', 'Hosting', 'Freelancer', 'Transport', 'Office', 'Other'];

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
    if (SCRIPT_TOKEN && params.token !== SCRIPT_TOKEN) {
      return json({ ok: false, data: null, error: 'Unauthorized' });
    }
    var path = params.path || '';
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
      case 'reports/monthly': return buildMonthlyReport(12);
      case 'reports/project-profit': return buildProjectProfitReport();
      case 'reports/client-revenue': return buildClientRevenueReport();
      default: throw new Error('Unknown GET route: ' + path);
    }
  }
  switch (path) {
    case 'client': return createClient(body);
    case 'project': return createProject(body);
    case 'payment': return createPayment(body);
    case 'expense': return createExpense(body);
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
    rows.push(obj);
  }
  return rows;
}

function appendRow_(name, obj) {
  var sh = sheet_(name);
  var row = SHEETS[name].map(function (key) { return obj[key] !== undefined ? obj[key] : ''; });
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
  project.client_name = clientName[project.client_id] || '—';
  project.contract_value = num_(project.contract_value);
  project.metrics = computeMetrics_(project, payments, expenses);
  return { project: project, payments: payments, expenses: expenses };
}

function buildDashboard() {
  var projects = readAll('Projects');
  var clients = readAll('Clients');
  var payments = readAll('Payments');
  var expenses = readAll('Expenses');
  var withMetrics = projectsWithMetrics();

  var totalRevenue = sumBy_(payments, function (p) { return p.amount; });
  var totalExpense = sumBy_(expenses, function (x) { return x.amount; });
  var totalContract = sumBy_(projects, function (p) { return p.contract_value; });
  var totalProjectProfit = sumBy_(withMetrics, function (p) { return p.metrics.currentProfit; });

  return {
    kpis: {
      totalRevenue: totalRevenue,
      totalExpense: totalExpense,
      netProfit: round2_(totalRevenue - totalExpense),
      outstandingDue: round2_(Math.max(0, totalContract - totalRevenue)),
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
    var cat = EXPENSE_CATEGORIES.indexOf(x.category) >= 0 ? x.category : 'Other';
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
    created_at: nowIso_()
  };
  return appendRow_('Payments', row);
}

function createExpense(body) {
  requireText_(body.project_id, 'Project');
  var category = EXPENSE_CATEGORIES.indexOf(body.category) >= 0 ? body.category : 'Other';
  var row = {
    id: genId_('e'),
    project_id: body.project_id,
    category: category,
    amount: requirePositive_(body.amount, 'Amount'),
    expense_date: body.expense_date || today_(),
    notes: body.notes || '',
    created_at: nowIso_()
  };
  return appendRow_('Expenses', row);
}

// ---- One-time setup helper --------------------------------------------------
// Run from the Apps Script editor once to create the four sheets with headers
// (and a couple of demo rows) in the bound spreadsheet.
function setupSheets() {
  Object.keys(SHEETS).forEach(function (name) { sheet_(name); });
  log_('Sheets ready: ' + Object.keys(SHEETS).join(', '));
}
