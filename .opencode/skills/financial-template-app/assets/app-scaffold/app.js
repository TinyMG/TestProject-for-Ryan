/* Miralles Music Academy - Financial Model (scaffold)
 * Runs are filled from research-brief.md + school-profile.md.
 * Rules:
 *   - Every displayed number comes from this model. No numbers in HTML.
 *   - All money CAD, tax-exclusive (GST 5% is collected on tuition, remitted).
 *   - Owner edits persist in localStorage under meta.storageKey.
 *   - What-if levers are temporary and never persisted.
 */

const DEFAULTS = {
  meta: {
    school: "Miralles Music Academy",
    subtitle: "Local financial model - edits save automatically in this browser",
    storageKey: "mma-financials-v1",
    generated: "",          // each run sets: date + sample URL it was modelled from
    gstRate: 0.05,
    lessonsPerYear: 43,
    teachers: 6,            // including owner; from school-profile.md
  },
  tuition: {
    tiers: [
      { name: "L1 - 30 min/wk", monthly: 160, students: 12 },
      { name: "L1 - 45 min/wk", monthly: 230, students: 18 },
      { name: "L1 - 60 min/wk", monthly: 300, students: 10 },
      { name: "L2 - 30 min/wk", monthly: 199, students: 14 },
      { name: "L2 - 45 min/wk", monthly: 285, students: 20 },
      { name: "L2 - 60 min/wk", monthly: 365, students: 16 },
    ],
    registrationFee: 50,      // [LIVE] annual, per new student
    newStudentsPerYear: 20,   // [ASSUMPTION]
  },
  expenses: [
    { name: "Teacher payroll", amount: 11000, note: "ASSUMPTION - confirm arrangement" },
    { name: "Rent", amount: 2000, note: "ASSUMPTION" },
    { name: "Utilities", amount: 400, note: "ASSUMPTION" },
    { name: "Insurance", amount: 150, note: "ASSUMPTION" },
    { name: "Marketing", amount: 500, note: "ASSUMPTION" },
    { name: "Billing & software (Opus1, Stripe, GoCardless)", amount: 600, note: "ASSUMPTION" },
    { name: "Materials, prizes & recitals", amount: 300, note: "ASSUMPTION" },
    { name: "Accounting & admin", amount: 150, note: "ASSUMPTION" },
  ],
  investments: [
    { name: "Studio equipment refresh", amount: 1500, note: "ASSUMPTION" },
    { name: "Recital venue & festival fees", amount: 1200, note: "ASSUMPTION" },
    { name: "Marketing campaign", amount: 800, note: "ASSUMPTION" },
  ],
};

/* ---------- state ---------- */

let state = deepClone(DEFAULTS);
const scenario = { tuition: 0, enrollment: 0, expenses: 0 }; // never persisted

function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }

function load() {
  try {
    const raw = localStorage.getItem(state.meta.storageKey || DEFAULTS.meta.storageKey);
    if (raw) state = deepMerge(deepClone(DEFAULTS), JSON.parse(raw));
  } catch (err) {
    console.error("Could not read saved edits; using defaults.", err);
  }
}

function deepMerge(base, saved) {
  for (const key of Object.keys(saved)) {
    if (saved[key] && typeof saved[key] === "object" && !Array.isArray(saved[key])
        && base[key] && typeof base[key] === "object" && !Array.isArray(base[key])) {
      deepMerge(base[key], saved[key]);
    } else {
      base[key] = saved[key];
    }
  }
  return base;
}

function save() {
  try { localStorage.setItem(state.meta.storageKey, JSON.stringify(state)); }
  catch (err) { console.error("Could not save edits.", err); }
}

/* ---------- model paths (inputs bind via data-path) ---------- */

function getPath(path) {
  return path.split(".").reduce((obj, key) => (obj == null ? undefined : obj[key]), state);
}
function setPath(path, value) {
  const keys = path.split(".");
  const last = keys.pop();
  const target = keys.reduce((obj, key) => obj[key], state);
  const num = Number(value);
  target[last] = Number.isNaN(num) ? value : num;
  save();
  renderAll();
}

/* ---------- calculations (single source of truth) ---------- */

const eff = {
  students: (t) => Math.max(0, Math.round(t.students * (1 + scenario.enrollment / 100))),
  monthly: (t) => t.monthly * (1 + scenario.tuition / 100),
  expense: (x) => x.amount * (1 + scenario.expenses / 100),
};

function calc() {
  const rows = state.tuition.tiers.map((t) => ({
    name: t.name, students: eff.students(t), monthly: eff.monthly(t),
    revenue: eff.students(t) * eff.monthly(t),
  }));
  const studentCount = rows.reduce((s, r) => s + r.students, 0);
  const tuitionRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const regRevenue = state.tuition.registrationFee * state.tuition.newStudentsPerYear / 12; // monthly share
  const expenseTotal = state.expenses.reduce((s, x) => s + eff.expense(x), 0);
  const revenue = tuitionRevenue + regRevenue;
  const net = revenue - expenseTotal;
  const margin = revenue > 0 ? net / revenue : 0;
  const revPerStudent = studentCount > 0 ? tuitionRevenue / studentCount : 0;
  const breakEvenStudents = revPerStudent > 0 ? Math.ceil(expenseTotal / revPerStudent) : Infinity;
  return {
    rows, studentCount, tuitionRevenue, regRevenue, expenseTotal,
    revenue, net, margin, revPerStudent, breakEvenStudents,
    perTeacher: state.meta.teachers > 0 ? studentCount / state.meta.teachers : Infinity,
    investmentTotal: state.investments.reduce((s, x) => s + x.amount, 0),
  };
}

/* ---------- formatting ---------- */

function fmt(n) {
  return "$" + Math.round(n).toLocaleString("en-CA");
}
function fmtSigned(n) {
  return (n >= 0 ? "+" : "") + fmt(n);
}
function fmtPct(n) {
  return Math.round(n * 100) + "%";
}

/* ---------- rendering ---------- */

function input(path, value, opts) {
  const extra = opts && opts.step ? ' step="' + opts.step + '"' : "";
  return '<input type="number" data-path="' + path + '" value="' + value + '" aria-label="' + path + '"' + extra + ">";
}

function kpi(label, value, delta) {
  return '<div class="kpi"><div class="k-label">' + label + "</div>" +
    '<div class="k-value">' + value + "</div>" +
    (delta ? '<div class="k-delta">' + delta + "</div>" : "") + "</div>";
}

function renderHeader() {
  document.getElementById("school-name").textContent = state.meta.school;
  document.getElementById("school-sub").textContent = state.meta.subtitle;
  document.getElementById("generated-pill").textContent =
    state.meta.generated ? "generated: " + state.meta.generated : "generated: (run sets this)";
  document.getElementById("generated-pill").title = state.meta.generated || "";
}

function renderPlan() {
  const c = calc();
  document.getElementById("plan-kpis").innerHTML =
    kpi("Monthly tuition revenue", fmt(c.tuitionRevenue)) +
    kpi("Monthly expenses", fmt(c.expenseTotal)) +
    kpi("Monthly net", fmt(c.net), "margin " + fmtPct(c.margin));

  let rows = state.tuition.tiers.map((t, i) => {
    const r = c.rows[i];
    return "<tr><td>" + t.name + "</td>" +
      "<td>" + input("tuition.tiers." + i + ".students", t.students) + "</td>" +
      "<td>" + input("tuition.tiers." + i + ".monthly", t.monthly) + "</td>" +
      "<td>" + fmt(r.revenue) + "</td></tr>";
  }).join("");
  rows += '<tr class="total"><td>Total</td><td>' + c.studentCount + " students</td><td></td><td>" +
    fmt(c.tuitionRevenue) + "</td></tr>";
  document.getElementById("tier-table").innerHTML =
    "<table><thead><tr><th>Tier</th><th>Students</th><th>Monthly tuition</th><th>Monthly revenue</th></tr></thead><tbody>" +
    rows + "</tbody></table>";

  const regMonthly = c.regRevenue;
  let pl = "<tr><td>Tuition revenue</td><td>" + fmt(c.tuitionRevenue) + "</td></tr>" +
    "<tr><td>Registration fees (monthly share of annual)</td><td>" + fmt(regMonthly) + "</td></tr>" +
    '<tr class="subtotal"><td>Total revenue</td><td>' + fmt(c.revenue) + "</td></tr>";
  state.expenses.forEach((x, i) => {
    pl += "<tr><td>" + x.name + '<span class="note-flag">' + x.note + "</span></td><td>" +
      input("expenses." + i + ".amount", x.amount) + "</td></tr>";
  });
  pl += '<tr class="total"><td>Net per month</td><td class="' + (c.net >= 0 ? "pos" : "neg") + '">' +
    fmt(c.net) + " (" + fmtPct(c.margin) + ")</td></tr>";
  document.getElementById("pl-table").innerHTML =
    "<table><thead><tr><th>Line</th><th>Per month</th></tr></thead><tbody>" + pl + "</tbody></table>";

  let inv = state.investments.map((x, i) =>
    "<tr><td>" + x.name + '<span class="note-flag">' + x.note + "</span></td><td>" +
    input("investments." + i + ".amount", x.amount) + "</td></tr>").join("");
  inv += '<tr class="total"><td>Total</td><td>' + fmt(c.investmentTotal) + "</td></tr>";
  document.getElementById("invest-table").innerHTML =
    "<table><thead><tr><th>Item</th><th>Amount</th></tr></thead><tbody>" + inv + "</tbody></table>";
}

function renderBudget() {
  const c = calc();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const head = "<thead><tr><th>Line</th>" + months.map((m) => "<th>" + m + "</th>").join("") +
    "<th>Base</th><th>Year</th></tr></thead>";

  let body = "";
  c.rows.forEach((r, i) => {
    body += "<tr><td>Income - " + r.name + "</td>" +
      months.map(() => "<td>" + fmt(r.revenue) + "</td>").join("") +
      "<td>" + input("tuition.tiers." + i + ".students", state.tuition.tiers[i].students) + " st.</td>" +
      "<td>" + fmt(r.revenue * 12) + "</td></tr>";
  });
  body += "<tr><td>Income - registration fees (amortized)</td>" +
    months.map(() => "<td>" + fmt(c.regRevenue) + "</td>").join("") +
    "<td>" + input("tuition.newStudentsPerYear", state.tuition.newStudentsPerYear) + " /yr</td>" +
    "<td>" + fmt(c.regRevenue * 12) + "</td></tr>";
  body += '<tr class="subtotal"><td>Total income</td>' +
    months.map(() => "<td>" + fmt(c.revenue) + "</td>").join("") +
    "<td></td><td>" + fmt(c.revenue * 12) + "</td></tr>";

  state.expenses.forEach((x, i) => {
    const m = eff.expense(x);
    body += "<tr><td>Expense - " + x.name + '<span class="note-flag">' + x.note + "</span></td>" +
      months.map(() => "<td>" + fmt(m) + "</td>").join("") +
      "<td>" + input("expenses." + i + ".amount", x.amount) + "</td>" +
      "<td>" + fmt(m * 12) + "</td></tr>";
  });
  body += '<tr class="subtotal"><td>Total expenses</td>' +
    months.map(() => "<td>" + fmt(c.expenseTotal) + "</td>").join("") +
    "<td></td><td>" + fmt(c.expenseTotal * 12) + "</td></tr>";
  body += '<tr class="total"><td>Net</td>' +
    months.map(() => '<td class="' + (c.net >= 0 ? "pos" : "neg") + '">' + fmt(c.net) + "</td>").join("") +
    "<td></td><td class=\"" + (c.net >= 0 ? "pos" : "neg") + '">' + fmt(c.net * 12) + "</td></tr>";

  document.getElementById("budget-table").innerHTML =
    "<table>" + head + "<tbody>" + body + "</tbody></table>";
}

function renderDashboard() {
  const c = calc();
  const base = calcBase(); // scenario-free numbers for deltas
  document.getElementById("dash-kpis").innerHTML =
    kpi("Monthly revenue", fmt(c.revenue), delta(c.revenue, base.revenue)) +
    kpi("Monthly expenses", fmt(c.expenseTotal), delta(c.expenseTotal, base.expenseTotal)) +
    kpi("Monthly net", fmt(c.net), fmtPct(c.margin) + " margin") +
    kpi("Break-even enrollment", c.studentCount === 0 ? "-" :
      c.breakEvenStudents + " students",
      c.studentCount > 0 ? "now " + c.studentCount + ", headroom " +
        Math.max(0, c.studentCount - c.breakEvenStudents) : "") +
    kpi("Students per teacher", c.perTeacher.toFixed(1),
      state.meta.teachers + " teachers (profile)") +
    kpi("Lessons per student / year", state.meta.lessonsPerYear, "flat monthly fee model");

  document.getElementById("levers").innerHTML =
    lever("Tuition change", "tuition", "%") +
    lever("Enrollment change", "enrollment", "%") +
    lever("Expense change", "expenses", "%");

  let cap = "<tr><th>Metric</th><th>Value</th></tr>";
  cap += "<tr><td>Active students</td><td>" + c.studentCount + "</td></tr>";
  cap += "<tr><td>Teachers (incl. owner, profile)</td><td>" + state.meta.teachers + "</td></tr>";
  cap += "<tr><td>Students per teacher per week</td><td>" + c.perTeacher.toFixed(1) + "</td></tr>";
  cap += "<tr><td>Break-even enrollment</td><td>" +
    (c.studentCount === 0 ? "-" : c.breakEvenStudents + " students") + "</td></tr>";
  cap += "<tr><td>Enrollment headroom to break-even</td><td>" +
    (c.studentCount === 0 ? "-" :
      Math.max(0, c.studentCount - c.breakEvenStudents) + " students") + "</td></tr>";
  document.getElementById("capacity-table").innerHTML =
    '<div class="tablewrap"><table>' + cap + "</table></div>";
}

function lever(label, key, unit) {
  const value = scenario[key];
  let note = "";
  if (value !== 0) {
    const c = calc(); const b = calcBase();
    note = "Net: " + fmtSigned(c.net - b.net) + " /mo vs. base";
  }
  return '<div class="lever"><div class="l-head"><label>' + label + "</label>" +
    '<input type="number" data-lever="' + key + '" value="' + value + '" aria-label="' + label + '"> ' +
    "<span>" + unit + "</span></div><div class=\"l-note\">" + (note || "0 = use saved numbers") +
    "</div></div>";
}

function calcBase() {
  const saved = { ...scenario };
  scenario.tuition = 0; scenario.enrollment = 0; scenario.expenses = 0;
  const b = calc();
  scenario.tuition = saved.tuition;
  scenario.enrollment = saved.enrollment;
  scenario.expenses = saved.expenses;
  return b;
}

function delta(current, base) {
  if (base === 0) return "";
  const d = current - base;
  return d === 0 ? "" : "scenario: " + fmtSigned(d) + " vs. base";
}

function renderAll() {
  renderHeader();
  renderPlan();
  renderBudget();
  renderDashboard();
}

/* ---------- wiring ---------- */

function wireTabs() {
  document.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
    });
  });
}

function wireInputs() {
  document.addEventListener("input", (ev) => {
    const el = ev.target;
    if (el.dataset.path !== undefined) {
      setPath(el.dataset.path, el.value);
      // restore focus position after re-render
      const again = document.querySelector('input[data-path="' + el.dataset.path + '"]');
      if (again) { again.focus(); again.setSelectionRange(again.value.length, again.value.length); }
    } else if (el.dataset.lever !== undefined) {
      const v = Number(el.value);
      scenario[el.dataset.lever] = Number.isNaN(v) ? 0 : v;
      renderAll();
      const again = document.querySelector('input[data-lever="' + el.dataset.lever + '"]');
      if (again) again.focus();
    }
  });
  document.getElementById("reset-btn").addEventListener("click", () => {
    if (!confirm("Discard all saved edits and restore this run's defaults?")) return;
    localStorage.removeItem(DEFAULTS.meta.storageKey);
    state = deepClone(DEFAULTS);
    scenario.tuition = 0; scenario.enrollment = 0; scenario.expenses = 0;
    save();
    renderAll();
  });
}

/* ---------- init ---------- */

load();
wireTabs();
wireInputs();
renderAll();
