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
    storageKey: "mma-financials-v5",
    generated: "2026-11-12 - modelled from hellocashflow.com; graphs + teacher-roster model 2026-11-16",
    gstRate: 0.05,
    lessonsPerYear: 43,
    teachers: 6,            // including owner; from school-profile.md
    capacityPerTeacher: 30, // ASSUMPTION - editable; used by capacity verdict
    marginFloor: 0.10,      // ASSUMPTION - "profitable" verdict threshold
    mtdFractionPct: 50,     // ASSUMPTION - share of the current month's income received so far
  },
  tuition: {
    // Tier PRICES from school-profile.md (owner, 2026-11-12). Enrollment is
    // modelled per category below; tier student counts are derived.
    tiers: [
      { name: "L1 - 30 min/wk", monthly: 160 },
      { name: "L1 - 45 min/wk", monthly: 230 },
      { name: "L1 - 60 min/wk", monthly: 300 },
      { name: "L2 - 30 min/wk", monthly: 199 },
      { name: "L2 - 45 min/wk", monthly: 285 },
      { name: "L2 - 60 min/wk", monthly: 365 },
    ],
    registrationFee: 50,      // [LIVE] per new student, waived same day as free trial
    newStudentsPerYear: 30,   // [ASSUMPTION]
  },
  categories: [
    { name: "Piano & Keyboard" },
    { name: "Guitar" },
    { name: "Songwriting & Arranging" },
    { name: "Music Theory (RCM)" },
  ],
  roster: [
    // One row per teacher x category assignment. Names + levels from the live
    // teachers-staff page (verified 2026-11-12). Student counts ASSUMPTION -
    // editable in the "By teacher" view. lvl 1 = standard, 2 = master.
    { name: "Jerry Li", cat: 0, lvl: 2, s30: 5, s45: 4, s60: 3 },
    { name: "Ryan Miralles (owner)", cat: 0, lvl: 2, s30: 4, s45: 4, s60: 3 },
    { name: "Sara Penney", cat: 0, lvl: 1, s30: 6, s45: 5, s60: 3 },
    { name: "Angela Wang", cat: 0, lvl: 1, s30: 4, s45: 3, s60: 1 },
    { name: "Lyka Sorema", cat: 1, lvl: 1, s30: 5, s45: 4, s60: 2 },
    { name: "Paul Payne", cat: 1, lvl: 1, s30: 4, s45: 4, s60: 1 },
    { name: "Ryan Miralles (owner)", cat: 2, lvl: 2, s30: 3, s45: 6, s60: 4 },
    { name: "Jerry Li", cat: 3, lvl: 2, s30: 2, s45: 2, s60: 2 },
    { name: "Sara Penney", cat: 3, lvl: 1, s30: 1, s45: 1, s60: 1 },
    { name: "Angela Wang", cat: 3, lvl: 1, s30: 1, s45: 1, s60: 1 },
  ],
  expenses: [
    { name: "Teacher payroll", amount: 10320, note: "ASSUMPTION - 50% of tuition revenue to 5 employed teachers (benchmark 45-55%)" },
    { name: "Rent", amount: 2500, note: "ASSUMPTION - downtown Fort McMurray placeholder" },
    { name: "Billing discounts (blended bi-annual/annual)", amount: 620, note: "ASSUMPTION - ~3% of gross tuition, contra-revenue" },
    { name: "Admin software & payment processing", amount: 620, note: "ASSUMPTION - ~3% of revenue (Opus1, Stripe, GoCardless, site)" },
    { name: "Utilities", amount: 350, note: "ASSUMPTION" },
    { name: "Marketing", amount: 300, note: "ASSUMPTION - growth-phase benchmark is 10-15% of revenue" },
    { name: "Insurance", amount: 150, note: "ASSUMPTION" },
    { name: "Supplies & misc", amount: 200, note: "ASSUMPTION" },
    { name: "Bookkeeping & accounting", amount: 150, note: "ASSUMPTION" },
    { name: "Recitals & festivals", amount: 250, note: "ASSUMPTION - $3,000/yr amortized" },
  ],
  investments: [
    { name: "Instrument maintenance & tuning", amount: 1200, note: "ASSUMPTION - per year" },
  ],
  targets: {
    netMonthly: 4000,       // ASSUMPTION - owner target for the dashboard gap
  },
  widgets: {
    // The Business Plan page as placeable widgets: w = widget type, k = the
    // KPI metric for kpi widgets, size = S (1 col) / M (2 cols) / L (full).
    // Rearrange, resize, add and remove in customize mode; persisted.
    income: [
      { w: "income-overview", size: "M" },
      { w: "kpi", k: "income", size: "S" },
      { w: "kpi", k: "net", size: "S" },
      { w: "kpi", k: "students", size: "S" },
      { w: "revenue-category", size: "L" },
    ],
    expenses: [
      { w: "donut", size: "M" },
      { w: "kpi", k: "expenses", size: "S" },
      { w: "investments", size: "M" },
    ],
  },
  ops: {
    // Operational counts tracked outside the financial model. Enter this
    // month and last month; the card deltas compare the two. All editable.
    overdue: { count: 2, amount: 160, prevCount: 0, prevAmount: 0, nextCount: 2, nextAmount: 160 },
    activeStudentsPrev: 87,   // last month's active students (current is model-derived)
    onHoldThisMonth: { value: 3, prev: 2 },
    onHoldNextMonth: { value: 2 },   // shown as the On hold row's expected-next value
    newStudents: { value: 4, prev: 3 },
    lostStudents: { value: 3, prev: 1, next: 3 },  // merged: lost + memberships ending
  },
  priorYear: {
    // Prior-year comparison for the trend chart - modeled, not actuals.
    enabled: false,         // view toggle (persisted with edits)
    enrollmentPct: -20,     // ASSUMPTION - fewer students a year ago
    tuitionPct: 0,          // ASSUMPTION - same price levels
    expensePct: 10,         // ASSUMPTION - costs ran higher
  },
};

/* ---------- state ---------- */

let state = deepClone(DEFAULTS);
const scenario = { tuition: 0, enrollment: 0, expenses: 0, teachers: 0 }; // never persisted

function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }

function load() {
  try {
    const raw = localStorage.getItem(state.meta.storageKey || DEFAULTS.meta.storageKey);
    if (raw) {
      const saved = JSON.parse(raw);
      // migrate the pre-widget KPI layout to widget entries
      if (saved.layout && !saved.widgets) {
        const mk = (keys) => (keys || []).map((k) => ({ w: "kpi", k: k, size: "S" }));
        saved.widgets = {
          income: [{ w: "income-overview", size: "M" }].concat(
            mk(saved.layout.income), [{ w: "revenue-category", size: "L" }]),
          expenses: [{ w: "donut", size: "M" }].concat(
            mk(saved.layout.expenses), [{ w: "investments", size: "M" }]),
        };
        delete saved.layout;
      }
      if (saved.widgets) {
        // v2 size semantics: chart widgets need height (S was too cramped)
        (saved.widgets.income || []).concat(saved.widgets.expenses || []).forEach((e) => {
          if (e.w === "income-overview" && e.size === "S") e.size = "M";
          if (e.w === "donut" && e.size === "S") e.size = "M";
          if (e.w === "ops-cards" && e.size === "L") e.size = "XL";
        });
      }
      state = deepMerge(deepClone(DEFAULTS), saved);
    }
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
  monthly: (t) => t.monthly * (1 + scenario.tuition / 100),
  expense: (x) => x.amount * (1 + scenario.expenses / 100),
};

function calc() {
  // The teacher roster is the source of truth: each row assigns a teacher to
  // a category at a level (1 = standard L1, 2 = master L2) with student
  // counts by class length. Tier rows, category totals and teacher totals
  // are all partitions of the same roster - they always agree.
  const enrollF = 1 + scenario.enrollment / 100;
  const rows = state.tuition.tiers.map((t, i) => {
    const lvl = i >= 3 ? 2 : 1, dur = i % 3;
    let students = 0, revenue = 0;
    state.roster.forEach((r0) => {
      if (Number(r0.lvl) !== lvl) return;
      const s = [r0.s30, r0.s45, r0.s60][dur] * enrollF;
      students += s;
      revenue += s * eff.monthly(t);
    });
    return { name: t.name, students: students, monthly: eff.monthly(t), revenue: revenue };
  });
  const cats = state.categories.map((cat, ci) => {
    let students = 0, revenue = 0;
    const cells = [0, 1, 2].map((dur) => {
      let s = 0, rev = 0;
      state.roster.forEach((r0) => {
        if (Number(r0.cat) !== ci) return;
        const n0 = [r0.s30, r0.s45, r0.s60][dur] * enrollF;
        s += n0;
        rev += n0 * eff.monthly(state.tuition.tiers[(Number(r0.lvl) - 1) * 3 + dur]);
      });
      students += s;
      revenue += rev;
      return { students: s, revenue: rev };
    });
    return { name: cat.name, cells: cells, students: students, revenue: revenue };
  });
  const teachers = (() => {
    const map = new Map();
    state.roster.forEach((r0) => {
      if (!map.has(r0.name)) map.set(r0.name, { name: r0.name, students: 0, revenue: 0, cats: [] });
      const e = map.get(r0.name);
      let rev = 0, st = 0;
      [0, 1, 2].forEach((dur) => {
        const n0 = [r0.s30, r0.s45, r0.s60][dur] * enrollF;
        st += n0;
        rev += n0 * eff.monthly(state.tuition.tiers[(Number(r0.lvl) - 1) * 3 + dur]);
      });
      e.students += st;
      e.revenue += rev;
      e.cats.push({ cat: Number(r0.cat), lvl: Number(r0.lvl), students: st, revenue: rev });
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  })();
  const studentCount = rows.reduce((s, r) => s + r.students, 0);
  const tuitionRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const regRevenue = state.tuition.registrationFee * state.tuition.newStudentsPerYear / 12; // monthly share
  const expenseTotal = state.expenses.reduce((s, x) => s + eff.expense(x), 0);
  const revenue = tuitionRevenue + regRevenue;
  const net = revenue - expenseTotal;
  const margin = revenue > 0 ? net / revenue : 0;
  const revPerStudent = studentCount > 0 ? tuitionRevenue / studentCount : 0;
  const breakEvenStudents = revPerStudent > 0 ? Math.ceil(expenseTotal / revPerStudent) : Infinity;
  const teacherCount = Math.max(1, state.meta.teachers + scenario.teachers);
  const perTeacher = studentCount / teacherCount;
  const capacityPerTeacher = state.meta.capacityPerTeacher;
  const seatCapacity = teacherCount * capacityPerTeacher;
  const verdicts = {
    cashPositive: net >= 0,
    profitable: margin >= state.meta.marginFloor,
    capacitySafe: perTeacher <= capacityPerTeacher,
  };
  const targetGap = net - state.targets.netMonthly;
  return {
    rows, cats, teachers, studentCount, tuitionRevenue, regRevenue, expenseTotal,
    revenue, net, margin, revPerStudent, breakEvenStudents,
    teacherCount, perTeacher, capacityPerTeacher, seatCapacity,
    verdicts, targetGap,
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

/* ---------- charts (hand-rolled SVG: no CDN, offline, live-updating) ---------- */

const CHART = { W: 860, colors: {} };
function refreshChartColors() {
  const s = getComputedStyle(document.documentElement);
  const v = (n) => s.getPropertyValue(n).trim();
  CHART.colors = {
    income: v("--c-income"), expense: v("--c-expense"), net: v("--c-net"),
    blue: v("--c-blue"), grid: v("--c-grid"), text: v("--c-text"), ink: v("--c-ink"),
  };
}
function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem("mma-theme", t); } catch (err) { /* private mode */ }
  refreshChartColors();
}

function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }
function svgOpen(h) { return '<svg viewBox="0 0 ' + CHART.W + " " + h + '" role="img" style="width:100%;height:auto;display:block">'; }

// Chart 2: where a dollar of revenue goes (donut sized to its own card, center = net)
function renderSplitChart(c) {
  const payroll = state.expenses.find((x) => x.name.indexOf("Teacher payroll") === 0);
  const payrollAmt = payroll ? eff.expense(payroll) : 0;
  const otherAmt = Math.max(0, c.expenseTotal - payrollAmt);
  const netShown = Math.max(0, c.net);
  const segs = [
    { label: "Teacher payroll", value: payrollAmt, color: CHART.colors.net },
    { label: "Other expenses", value: otherAmt, color: CHART.colors.expense },
    { label: "Net (what you keep)", value: netShown, color: CHART.colors.income },
  ];
  const W = 460, H = 210, cx = 105, cy = 105, r = 62, sw = 26;
  const total = segs.reduce((s2, x) => s2 + x.value, 0) || 1;
  let s = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" style="width:100%;height:auto;display:block">';
  let acc = 0;
  segs.forEach((g) => {
    const pct = (g.value / total) * 100;
    if (pct > 0.4) {
      s += '<circle class="donut-seg" cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + g.color + '" stroke-width="' + sw + '" pathLength="100" stroke-dasharray="' + pct + " " + (100 - pct) + '" stroke-dashoffset="' + (-acc) + '" transform="rotate(-90 ' + cx + " " + cy + ')"><title>' +
        esc(g.label + ": " + fmt(g.value) + "/mo (" + fmtPct(g.value / c.revenue) + " of revenue)") + "</title></circle>";
    }
    acc += pct;
  });
  if (c.net < 0) {
    s += '<text x="' + cx + '" y="' + (cy - 4) + '" text-anchor="middle" font-size="11" fill="' + CHART.colors.expense + '">deficit</text>';
    s += '<text x="' + cx + '" y="' + (cy + 16) + '" text-anchor="middle" font-size="15" font-weight="700" fill="' + CHART.colors.expense + '">' + fmt(-c.net) + "</text>";
  } else {
    s += '<text x="' + cx + '" y="' + (cy - 4) + '" text-anchor="middle" font-size="11" fill="' + CHART.colors.text + '">net / mo</text>';
    s += '<text x="' + cx + '" y="' + (cy + 16) + '" text-anchor="middle" font-size="15" font-weight="750" fill="' + CHART.colors.ink + '">' + fmt(c.net) + "</text>";
  }
  segs.forEach((g, i) => {
    const y = 52 + i * 48;
    s += '<circle cx="216" cy="' + (y - 5) + '" r="5" fill="' + g.color + '"/>';
    s += '<text x="230" y="' + y + '" font-size="13" font-weight="650" fill="' + CHART.colors.ink + '">' + esc(g.label) + "</text>";
    s += '<text x="230" y="' + (y + 17) + '" font-size="12" fill="' + CHART.colors.text + '">' +
      esc(fmt(g.value) + " · " + fmtPct(g.value / c.revenue) + " of revenue") + "</text>";
  });
  return s + "</svg>";
}

function pcInput(path, value, label) {
  return '<label>' + label + ' <input type="number" data-path="' + path + '" value="' + value + '" aria-label="' + label + '"> %</label>';
}

// Net under the prior-year assumption set (computed from base, ignores what-if levers)
function priorYearNet() {
  const saved = { tuition: scenario.tuition, enrollment: scenario.enrollment, expenses: scenario.expenses };
  scenario.tuition = state.priorYear.tuitionPct;
  scenario.enrollment = state.priorYear.enrollmentPct;
  scenario.expenses = state.priorYear.expensePct;
  const c = calc();
  scenario.tuition = saved.tuition;
  scenario.enrollment = saved.enrollment;
  scenario.expenses = saved.expenses;
  return c.net;
}

// Chart 3: cumulative net through the year; optional prior-year (est.) comparison
function renderTrendChart(c) {
  const padL = 64, padR = 16, padT = 12, padB = 24;
  const h = 190, plotW = CHART.W - padL - padR, plotH = h - padT - padB;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const pyOn = !!(state.priorYear && state.priorYear.enabled);
  const pyNet = pyOn ? priorYearNet() : null;
  const cum = (n) => months.map((m, i) => n * (i + 1));
  const curCum = cum(c.net);
  const pyCum = pyOn ? cum(pyNet) : null;
  const all = pyOn ? curCum.concat(pyCum) : curCum;
  const hi = Math.max.apply(null, [0].concat(all)) || 1;
  const lo = Math.min.apply(null, [0].concat(all));
  const span = hi - lo || 1;
  const y = (v) => padT + plotH - ((v - lo) / span) * plotH;
  const x = (i) => padL + (i / 11) * plotW;
  let s = svgOpen(h);
  [lo, lo + span / 2, hi].forEach((v) => {
    const isZero = Math.abs(v) < 1e-9 && lo < 0;
    s += '<line x1="' + padL + '" y1="' + y(v) + '" x2="' + (CHART.W - padR) + '" y2="' + y(v) + '" stroke="' +
      (isZero ? CHART.colors.text : CHART.colors.grid) + '"' + (isZero ? ' stroke-dasharray="4 4"' : "") + "/>";
    s += '<text x="' + (padL - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end" font-size="11" fill="' + CHART.colors.text + '">' + fmt(v) + "</text>";
  });
  // current-year series (solid, area)
  let area = "M " + x(0) + " " + y(0);
  curCum.forEach((v, i) => { area += " L " + x(i) + " " + y(v); });
  s += '<path d="' + area + " L " + x(11) + " " + y(0) + ' Z" fill="' + CHART.colors.net + '" opacity="0.12"/>';
  s += '<path d="' + area + '" fill="none" stroke="' + CHART.colors.net + '" stroke-width="2.5"/>';
  curCum.forEach((v, i) => {
    s += '<circle cx="' + x(i) + '" cy="' + y(v) + '" r="3.5" fill="' + CHART.colors.net + '"><title>' +
      esc("This year, by end of " + months[i] + ": " + fmt(v) + " cumulative net (" + (i + 1) + " × " + fmt(c.net) + ")") + "</title></circle>";
  });
  // prior-year series (dashed estimate)
  if (pyOn) {
    let line = "";
    pyCum.forEach((v, i) => { line += (i === 0 ? "M " : " L ") + x(i) + " " + y(v); });
    s += '<path d="' + line + '" fill="none" stroke="' + CHART.colors.text + '" stroke-width="2" stroke-dasharray="6 5"/>';
    pyCum.forEach((v, i) => {
      s += '<circle cx="' + x(i) + '" cy="' + y(v) + '" r="3" fill="' + CHART.colors.text + '"><title>' +
        esc("Prior year (est.), by end of " + months[i] + ": " + fmt(v) + " cumulative net (" + fmt(pyNet) + "/mo)") + "</title></circle>";
    });
    s += '<rect x="' + (CHART.W - padR - 190) + '" y="' + (padT - 8) + '" width="10" height="10" rx="2" fill="' + CHART.colors.net + '"/>';
    s += '<text x="' + (CHART.W - padR - 176) + '" y="' + (padT + 1) + '" font-size="11" fill="' + CHART.colors.ink + '">this year (model)</text>';
    s += '<rect x="' + (CHART.W - padR - 190) + '" y="' + (padT + 10) + '" width="10" height="10" rx="2" fill="' + CHART.colors.text + '"/>';
    s += '<text x="' + (CHART.W - padR - 176) + '" y="' + (padT + 19) + '" font-size="11" fill="' + CHART.colors.ink + '">previous year (est.)</text>';
  }
  months.forEach((m, i) => {
    if (i % 2 === 0) s += '<text x="' + x(i) + '" y="' + (h - 8) + '" text-anchor="middle" font-size="11" fill="' + CHART.colors.text + '">' + m + "</text>";
  });
  return s + "</svg>";
}

// Chart 4: net income vs enrollment change (-50%..+50%), with break-even + current markers
function netAtEnrollmentDelta(d) {
  const saved = scenario.enrollment;
  scenario.enrollment = d;
  const net = calc().net;
  scenario.enrollment = saved;
  return net;
}
function studentsAtEnrollmentDelta(d) {
  return state.tuition.tiers.reduce((s2, t) => s2 + Math.max(0, Math.round(t.students * (1 + d / 100))), 0);
}
function renderSensitivityChart(c) {
  const padL = 60, padR = 20, padT = 14, padB = 26;
  const h = 200, plotW = CHART.W - padL - padR, plotH = h - padT - padB;
  const deltas = [-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50];
  const nets = deltas.map(netAtEnrollmentDelta);
  const lo = Math.min(0, Math.min.apply(null, nets)), hi = Math.max(0, Math.max.apply(null, nets));
  const span = hi - lo || 1;
  const x = (d) => padL + ((d + 50) / 100) * plotW;
  const y = (v) => padT + plotH - ((v - lo) / span) * plotH;
  let s = svgOpen(h);
  // zero-net line + label
  s += '<line x1="' + padL + '" y1="' + y(0) + '" x2="' + (CHART.W - padR) + '" y2="' + y(0) + '" stroke="' + CHART.colors.grid + '"/>';
  s += '<text x="' + (padL - 8) + '" y="' + (y(0) + 4) + '" text-anchor="end" font-size="11" fill="' + CHART.colors.text + '">' + fmt(0) + "</text>";
  // break-even vertical marker (enrollment delta where net crosses zero, at current non-enrollment levers)
  const baseStudents = studentsAtEnrollmentDelta(0);
  const beStudents = c.studentCount > 0 && c.revPerStudent > 0 ? Math.ceil(c.expenseTotal / c.revPerStudent) : Infinity;
  if (Number.isFinite(beStudents) && baseStudents > 0) {
    const beDelta = Math.max(-50, Math.min(50, (beStudents / baseStudents - 1) * 100));
    s += '<line x1="' + x(beDelta) + '" y1="' + padT + '" x2="' + x(beDelta) + '" y2="' + (h - padB) + '" stroke="' + CHART.colors.expense + '" stroke-dasharray="5 4"/>';
    s += '<text x="' + x(beDelta) + '" y="' + (padT + 12) + '" text-anchor="middle" font-size="11" fill="' + CHART.colors.expense + '">break-even ' + beStudents + " st (" + Math.round(beDelta) + "%)</text>";
  }
  // curve
  let path = "";
  deltas.forEach((d, i) => { path += (i === 0 ? "M " : " L ") + x(d) + " " + y(nets[i]); });
  s += '<path d="' + path + '" fill="none" stroke="' + CHART.colors.net + '" stroke-width="2.5"/>';
  deltas.forEach((d, i) => {
    const st = studentsAtEnrollmentDelta(d);
    s += '<circle cx="' + x(d) + '" cy="' + y(nets[i]) + '" r="4" fill="' + (nets[i] >= 0 ? CHART.colors.net : CHART.colors.expense) + '"><title>' +
      esc("enrollment " + (d > 0 ? "+" : "") + d + "% → " + st + " students → net " + fmt(nets[i]) + "/mo") + "</title></circle>";
  });
  // current marker (moves with the enrollment lever)
  const curD = scenario.enrollment;
  s += '<circle cx="' + x(curD) + '" cy="' + y(c.net) + '" r="7" fill="none" stroke="' + CHART.colors.ink + '" stroke-width="2.5"><title>' +
    esc("current: " + c.studentCount + " students → net " + fmt(c.net) + "/mo") + "</title></circle>";
  // x labels
  [-50, -25, 0, 25, 50].forEach((d) => {
    s += '<text x="' + x(d) + '" y="' + (h - 10) + '" text-anchor="middle" font-size="11" fill="' + CHART.colors.text + '">' + (d > 0 ? "+" : "") + d + "%</text>";
  });
  return s + "</svg>";
}

// Chart 5: income overview - trailing-N-month smooth line, current month drawn month-to-date
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const INCOME_RANGES = { "1M": 1, "3M": 3, "6M": 6, "1Y": 12 };
let incomeRange = "6M";
try { incomeRange = localStorage.getItem("mma-income-range") || "6M"; } catch (err) { /* private mode */ }
let incomeSelWin = Math.max(0, (INCOME_RANGES[incomeRange] || 6) - 2); // selected slot; default = last complete month
let incomeSelDay = 0; // selected day in 1M view; 0 = today

function monthNow() { return new Date().getMonth(); }
function incomeWindow(n) {
  const cur = monthNow();
  const out = [];
  for (let k = 0; k < n; k++) out.push((cur - (n - 1) + k + 12) % 12);
  return out;
}
function incomeForMonth(c, absM) {
  const cur = monthNow();
  const mtd = Math.max(0, Math.min(100, state.meta.mtdFractionPct)) / 100;
  return absM === cur ? c.revenue * mtd : c.revenue;
}
function fmtCompact(n) {
  if (n >= 1000) {
    const k = n / 1000;
    return "$" + (k >= 10 ? Math.round(k) : Math.round(k * 10) / 10) + "K";
  }
  return "$" + Math.round(n);
}
function fmtSignedPct(p) { return (p >= 0 ? "+" : "") + Math.round(p * 100) + "%"; }
function incomeDetail(c, k, n) {
  const win = incomeWindow(n);
  const cur = monthNow();
  const absM = win[k];
  const v = incomeForMonth(c, absM);
  const priorAbs = (absM - 1 + 12) % 12;
  const prior = incomeForMonth(c, priorAbs);
  const pct = prior > 0 ? (v - prior) / prior : null;
  return {
    label: MONTHS[absM] + (absM === cur ? " income (month-to-date)" : " income"),
    value: fmt(v),
    deltaText: pct === null ? "" : (pct >= 0 ? "↗ +" : "↘ ") + Math.round(pct * 100) + "% vs. " + MONTHS[priorAbs],
    deltaCls: pct === null || pct >= 0 ? "pos" : "neg",
    partial: absM === cur && state.meta.mtdFractionPct !== 100,
  };
}
function mtdEstimate(c) {
  return c.revenue * Math.max(0, Math.min(100, state.meta.mtdFractionPct)) / 100;
}
function incomeDetailDay(c, day) {
  const cur = monthNow();
  const today = new Date().getDate();
  const days = new Date(new Date().getFullYear(), cur + 1, 0).getDate();
  const est = mtdEstimate(c);
  const v = day <= today ? est * day / today : est + (c.revenue - est) * (day - today) / (days - today);
  return {
    label: MONTHS[cur] + " " + day + (day < today ? "" : day === today ? " (today)" : " (projected)"),
    value: fmt(v),
    note: Math.round(v / c.revenue * 100) + "% of the month" +
      (day === today && state.meta.mtdFractionPct !== 100 ? " · month-to-date estimate" : ""),
  };
}
function smoothPath(pts) {
  if (pts.length < 3) return "M " + pts.map((p) => p[0] + " " + p[1]).join(" L ");
  let d = "M " + pts[0][0] + " " + pts[0][1];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += " C " + c1x + " " + c1y + " " + c2x + " " + c2y + " " + p2[0] + " " + p2[1];
  }
  return d;
}
function renderIncomeChart(c) {
  const blue = CHART.colors.blue;
  const padL = 78, padR = 24, padT = 16, padB = 30;
  const h = 230, plotW = CHART.W - padL - padR, plotH = h - padT - padB;
  const n = INCOME_RANGES[incomeRange];
  let s = svgOpen(h);
  // rotated y-axis title + dotted gridlines with compact dollar labels (shared)
  s += '<text x="16" y="' + (padT + plotH / 2) + '" text-anchor="middle" font-size="11" fill="' + CHART.colors.text + '" transform="rotate(-90 16 ' + (padT + plotH / 2) + ')">Income collected</text>';
  function grid(lo, hi) {
    const span = (hi - lo) || 1;
    [0, 1 / 3, 2 / 3, 1].forEach((f) => {
      const v = lo + span * f;
      s += '<line x1="' + padL + '" y1="' + (padT + plotH - span2y(f)) + '" x2="' + (CHART.W - padR) + '" y2="' + (padT + plotH - span2y(f)) + '" stroke="' + CHART.colors.grid + '" stroke-dasharray="2 4"/>';
      s += '<text x="' + (padL - 8) + '" y="' + (padT + plotH - span2y(f) + 4) + '" text-anchor="end" font-size="11" fill="' + CHART.colors.text + '">' + fmtCompact(v) + "</text>";
    });
    function span2y(f) { return span * f / (hi - lo) * plotH; }
  }
  if (n === 1) {
    // Day view: cumulative collected this month (solid to today, dashed projection to month end)
    const cur = monthNow();
    const days = new Date(new Date().getFullYear(), cur + 1, 0).getDate();
    const today = Math.min(new Date().getDate(), days);
    const est = mtdEstimate(c);
    const x = (d) => padL + (d - 1) / (days - 1) * plotW;
    const y = (v) => padT + plotH - (v / (c.revenue * 1.06)) * plotH;
    grid(0, c.revenue * 1.06);
    // hit zones per day
    for (let d = 1; d <= days; d++) {
      const w = plotW / days;
      const det = incomeDetailDay(c, d);
      s += '<rect x="' + (x(d) - w / 2) + '" y="' + padT + '" width="' + w + '" height="' + plotH + '" fill="transparent" data-i="' + d + '" style="cursor:pointer"><title>' +
        esc(det.label + ": " + det.value + " · " + det.note) + "</title></rect>";
    }
    const vAt = (d) => incomeDayValue(c, d);
    let solid = "";
    for (let d = 1; d <= today; d++) solid += (d === 1 ? "M " : " L ") + x(d) + " " + y(vAt(d));
    s += '<path d="' + solid + '" fill="none" stroke="' + blue + '" stroke-width="2.5" pointer-events="none"/>';
    let dashed = "";
    for (let d = today; d <= days; d++) dashed += (d === today ? "M " : " L ") + x(d) + " " + y(vAt(d));
    s += '<path d="' + dashed + '" fill="none" stroke="' + blue + '" stroke-width="2" stroke-dasharray="5 5" opacity="0.55" pointer-events="none"/>';
    s += '<line x1="' + x(today) + '" y1="' + padT + '" x2="' + x(today) + '" y2="' + (padT + plotH) + '" stroke="' + CHART.colors.ink + '" opacity="0.18" pointer-events="none"/>';
    s += '<circle cx="' + x(today) + '" cy="' + y(est) + '" r="5" fill="' + blue + '" pointer-events="none"><title>' +
      esc(incomeDetailDay(c, today).label + ": " + incomeDetailDay(c, today).value + " · " + incomeDetailDay(c, today).note) + "</title></circle>";
    s += '<text x="' + x(1) + '" y="' + (h - 8) + '" text-anchor="start" font-size="11" fill="' + CHART.colors.text + '">' + MONTHS[cur] + " 1</text>";
    s += '<text x="' + (CHART.W / 2) + '" y="' + (h - 8) + '" text-anchor="middle" font-size="11" fill="' + CHART.colors.text + '">Day of month</text>';
    s += '<text x="' + x(days) + '" y="' + (h - 8) + '" text-anchor="end" font-size="11" fill="' + CHART.colors.text + '">' + MONTHS[cur] + " " + days + "</text>";
    return s + "</svg>";
  }
  // Month views (3M / 6M / 1Y)
  const win = incomeWindow(n);
  const cur = monthNow();
  const vals = win.map((m) => incomeForMonth(c, m));
  const lo = Math.min.apply(null, vals) * 0.9;
  const hi = Math.max.apply(null, vals) * 1.06 || 1;
  const span = (hi - lo) || 1;
  const y = (v) => padT + plotH - ((v - lo) / span) * plotH;
  const x = (k) => padL + (k / (n - 1)) * plotW;
  grid(lo, hi);
  win.forEach((m, k) => {
    const wHalf = plotW / (n * 2);
    const det = incomeDetail(c, k, n);
    s += '<rect x="' + Math.max(padL, x(k) - wHalf) + '" y="' + padT + '" width="' + (wHalf * 2) + '" height="' + plotH + '" fill="transparent" data-i="' + k + '" style="cursor:pointer"><title>' +
      esc(det.label + ": " + det.value + (det.deltaText ? " — " + det.deltaText : "")) + "</title></rect>";
  });
  s += '<line x1="' + x(n - 1) + '" y1="' + padT + '" x2="' + x(n - 1) + '" y2="' + (padT + plotH) + '" stroke="' + CHART.colors.ink + '" opacity="0.18" pointer-events="none"/>';
  const pts = vals.map((v, k) => [x(k), y(v)]);
  s += '<path d="' + smoothPath(pts) + '" fill="none" stroke="' + blue + '" stroke-width="2.5" pointer-events="none"/>';
  s += '<circle cx="' + x(n - 1) + '" cy="' + y(vals[n - 1]) + '" r="5" fill="' + blue + '" pointer-events="none"><title>' +
    esc(incomeDetail(c, n - 1, n).label + ": " + incomeDetail(c, n - 1, n).value) + "</title></circle>";
  s += '<text x="' + x(0) + '" y="' + (h - 8) + '" text-anchor="start" font-size="11" fill="' + CHART.colors.text + '">' + MONTHS[win[0]] + "</text>";
  s += '<text x="' + (CHART.W / 2) + '" y="' + (h - 8) + '" text-anchor="middle" font-size="11" fill="' + CHART.colors.text + '">Month</text>';
  s += '<text x="' + x(n - 1) + '" y="' + (h - 8) + '" text-anchor="end" font-size="11" fill="' + CHART.colors.text + '">' + MONTHS[win[n - 1]] + " MTD</text>";
  return s + "</svg>";
}
function renderIncomeHeadline(c) {
  const n = INCOME_RANGES[incomeRange];
  let d;
  if (n === 1) {
    const day = Math.min(incomeSelDay || new Date().getDate(), new Date(new Date().getFullYear(), monthNow() + 1, 0).getDate());
    const dd = incomeDetailDay(c, day);
    const isToday = day === new Date().getDate();
    d = {
      label: isToday ? MONTHS[monthNow()] + " income (month-to-date)" : dd.label + " income",
      value: dd.value,
      deltaText: "",
      deltaCls: "pos",
      partial: isToday && state.meta.mtdFractionPct !== 100,
      note: dd.note,
    };
  } else {
    d = incomeDetail(c, Math.min(incomeSelWin, n - 1), n);
  }
  let s = '<div class="io-label">' + esc(d.label) + "</div>" +
    '<div class="io-big">' + d.value + "</div>";
  if (d.deltaText) s += '<div class="io-delta ' + d.deltaCls + '">' + esc(d.deltaText) + "</div>";
  if (d.partial) s += '<div class="io-note">partial month — not a like-for-like drop</div>';
  if (d.note && !d.deltaText) s += '<div class="io-note">' + esc(d.note) + "</div>";
  const cur = monthNow();
  s += '<div class="io-legend"><span class="bar"></span><span class="io-legend-label">Income collected</span>' +
    '<span class="io-legend-value">' + fmtCompact(incomeForMonth(c, cur)) + "</span></div>";
  return s;
}
function renderIncomeFoot() {
  const cur = monthNow();
  const day = new Date().getDate();
  return '<span class="io-info">ⓘ ' + MONTHS[cur] + " includes only " + MONTHS[cur] + " 1–" + day +
    '.</span> <label class="inline-toggle">MTD estimate: <input type="number" data-path="meta.mtdFractionPct" value="' +
    state.meta.mtdFractionPct + '" aria-label="month-to-date fraction"> % of a full month received.</label>';
}

// Chart 6: revenue by category (with duration drill-down) / by teacher
let selectedCat = null; // null = overview; index = expanded category
let catView = "category"; // "category" | "teacher"
const DUR_LABELS = ["30 min", "45 min", "1 hr"];

function catBarDelta(revenueFull, studentsFull, n) {
  if (n === 1) {
    const days = new Date(new Date().getFullYear(), monthNow() + 1, 0).getDate();
    const pace = Math.min(new Date().getDate(), days) / days;
    const frac = Math.max(0, Math.min(100, state.meta.mtdFractionPct)) / 100;
    const gap = frac - pace;
    const d = deltaOf(revenueFull * frac, revenueFull * pace, true);
    const sd = studentsFull * gap; // students gained/lost at the same pace gap
    let st = "";
    if (Math.abs(sd) >= 0.05) {
      const word = sd > 0 ? "gained" : "lost";
      st = Math.abs(sd) < 0.95 ? "<1 st " + word : (sd > 0 ? "+" : "−") + Math.round(Math.abs(sd)) + " st " + word;
    }
    d.students = st;
    return d;
  }
  const d = deltaOf(revenueFull, revenueFull, true); // uniform model: last two complete months agree
  d.students = "";
  return d;
}

function renderCategoryChart(c) {
  const padL = 170, padR = 130, padT = 6;
  let list, mode;
  if (catView === "teacher") {
    list = c.teachers.map((t0) => ({ name: t0.name, students: t0.students, revenue: t0.revenue, tip: t0.cats.map((x) => state.categories[x.cat].name + " L" + x.lvl).join(" + ") }));
    mode = "teacher";
  } else if (selectedCat === null) {
    list = c.cats.map((x) => ({ name: x.name, students: x.students, revenue: x.revenue, tip: "click to break down by class length" }));
    mode = "overview";
  } else {
    const cat = c.cats[selectedCat];
    list = cat.cells.map((cell, d) => ({ name: DUR_LABELS[d], students: cell.students, revenue: cell.revenue, tip: "" }));
    mode = "expanded";
  }
  const n = INCOME_RANGES[incomeRange];
  const rowH = 44, h = padT + list.length * rowH + 6;
  const max = Math.max.apply(null, list.map((x) => x.revenue).concat([1]));
  const barsW = CHART.W - padL - padR;
  let s = svgOpen(h);
  list.forEach((item, i) => {
    const y = padT + i * rowH;
    const w = Math.max(2, (item.revenue / max) * barsW);
    const clickable = mode === "overview";
    const d0 = catBarDelta(item.revenue, item.students, n);
    const deltaColor = d0.cls === "pos" ? CHART.colors.income : (d0.cls === "neg" ? CHART.colors.expense : CHART.colors.text);
    const deltaFull = d0.text + (d0.students ? " · " + d0.students : "");
    s += '<text x="' + (padL - 8) + '" y="' + (y + rowH / 2 + 4) + '" text-anchor="end" font-size="11" fill="' + CHART.colors.ink + '">' + esc(item.name) + "</text>";
    s += '<rect x="' + padL + '" y="' + (y + 8) + '" width="' + w + '" height="' + (rowH - 18) + '" rx="4" fill="' + CHART.colors.net + '"' +
      (clickable ? ' data-cat="' + i + '" style="cursor:pointer"' : "") + "><title>" +
      esc(Math.round(item.students) + " students · " + fmt(item.revenue) + "/mo" +
        (d0.cls !== "flat" ? " · " + deltaFull + " vs last period" : "") +
        (item.tip ? " — " + item.tip : "")) + "</title></rect>";
    s += '<text x="' + (padL + w + 8) + '" y="' + (y + rowH / 2 - 2) + '" font-size="11" fill="' + CHART.colors.text + '">' +
      fmt(item.revenue) + " · " + Math.round(item.students) + " st</text>";
    s += '<text x="' + (padL + w + 8) + '" y="' + (y + rowH / 2 + 12) + '" font-size="10" font-weight="650" fill="' + deltaColor + '">' + esc(deltaFull) + "</text>";
  });
  return s + "</svg>";
}
function renderCatCap() {
  if (catView === "teacher") {
    return 'Revenue by teacher <span class="cap-hint">· each teacher\'s students and share of tuition revenue; edit the roster below</span>';
  }
  if (selectedCat === null) {
    return 'Revenue by category <span class="cap-hint">· click a category to break it down by class length</span>';
  }
  return '<button class="ghost mini" data-action="back" type="button">← All categories</button> ' +
    '<span class="chart-cap-inline">' + esc(state.categories[selectedCat].name) + ' — by class length</span>';
}
function renderCatEditor(c) {
  if (catView !== "category" || selectedCat === null) return "";
  return '<div class="cat-editor"><span class="cat-editor-title">Enrollment is set per teacher — switch to “By teacher” to edit who teaches how many students.</span></div>';
}
function renderTeacherEditor(c) {
  if (catView !== "teacher") return "";
  let rows = state.roster.map((r0, i) => {
    const st = [r0.s30, r0.s45, r0.s60].reduce((a, b) => a + Number(b), 0);
    return "<tr><td>" + esc(r0.name) + "</td><td>" + esc(state.categories[Number(r0.cat)] ? state.categories[Number(r0.cat)].name : "?") + "</td>" +
      "<td>" + input("roster." + i + ".lvl", r0.lvl) + "</td>" +
      "<td>" + input("roster." + i + ".s30", r0.s30) + "</td>" +
      "<td>" + input("roster." + i + ".s45", r0.s45) + "</td>" +
      "<td>" + input("roster." + i + ".s60", r0.s60) + "</td>" +
      "<td>" + st + "</td></tr>";
  }).join("");
  return '<div class="tablewrap roster-table"><table><thead><tr><th>Teacher</th><th>Category</th><th>Level (1/2)</th><th>30 min st</th><th>45 min st</th><th>1 hr st</th><th>Students</th></tr></thead><tbody>' +
    rows + "</tbody></table></div>";
}

/* ---------- KPI cards: icons, sparklines, deltas (ref: studio dashboards) ---------- */

const ICONS = {
  money: '<svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="1.5" y="4" width="13" height="8.5" rx="2"/><circle cx="8" cy="8.2" r="2"/></svg>',
  receipt: '<svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 1.8h8v12.4l-2.2-1.6-1.8 1.6-1.8-1.6L4 14.2z"/><path d="M6.2 5.2h3.6M6.2 7.8h3.6"/></svg>',
  wallet: '<svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="1.5" y="3.5" width="13" height="9.5" rx="2"/><path d="M10.2 8.2h4.3"/></svg>',
  target: '<svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="6"/><circle cx="8" cy="8" r="2.8"/></svg>',
  users: '<svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="5.5" cy="5.5" r="2.2"/><path d="M2 13.2c0-2 1.6-3.2 3.5-3.2S9 11.2 9 13.2"/><circle cx="11.3" cy="5.8" r="1.9"/><path d="M10.4 13.2c.2-1.7 1.3-2.8 2.8-2.8 1.1 0 2.2.7 2.7 2"/></svg>',
  note: '<svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12l4-4 3 3 5-6"/><path d="M10.5 5H14v3.5"/></svg>',
  warn: '<svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8" cy="8" r="6"/><path d="M8 4.6v4"/><path d="M8 11.2v.01"/></svg>',
  pause: '<svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="8" cy="8" r="6"/><path d="M6.6 5.6v4.8M9.4 5.6v4.8"/></svg>',
  userplus: '<svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="5.5" cy="5.5" r="2.2"/><path d="M2 13.2c0-2 1.6-3.2 3.5-3.2S9 11.2 9 13.2"/><path d="M11.5 4.5v4M9.5 6.5h4"/></svg>',
  userminus: '<svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="5.5" cy="5.5" r="2.2"/><path d="M2 13.2c0-2 1.6-3.2 3.5-3.2S9 11.2 9 13.2"/><path d="M9.5 6.5h4"/></svg>',
  exit: '<svg viewBox="0 0 16 16" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 4l4 4 3-3 5 6"/><path d="M10.5 11H14v-3.5"/></svg>',
};
function icon(name) { return ICONS[name] || ""; }
function kSub(s) { return ' <span class="k-sub">' + s + "</span>"; }

function spark(points, w, h) {
  const hi = Math.max.apply(null, points), lo = Math.min.apply(null, points);
  const span = (hi - lo) || 1;
  const step = points.length > 1 ? w / (points.length - 1) : 0;
  const pts = points.map((v, i) =>
    (i * step).toFixed(1) + "," + (h - 3 - ((v - lo) / span) * (h - 6)).toFixed(1));
  const last = pts[pts.length - 1].split(",");
  return '<svg viewBox="0 0 ' + w + " " + h + '" style="width:' + w + "px;height:" + h +
    'px;display:block"><polyline points="' + pts.join(" ") + '" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.75" stroke-linecap="round" stroke-linejoin="round"/><circle cx="' + last[0] + '" cy="' + last[1] + '" r="2.2" fill="currentColor"/></svg>';
}

function deltaOf(a, b, money, invert) {
  if (!isFinite(a) || !isFinite(b) || Math.abs(a - b) < 1e-9) {
    return { text: "• +0 (+0%)", cls: "flat" };
  }
  let pct;
  if (b === 0) {
    pct = 1; // from zero: treat as +100% (reference-dashboard convention)
  } else {
    pct = a / b - 1;
  }
  const d = a - b;
  const abs = money ? fmtSigned(d) : (d > 0 ? "+" : "−") + Math.round(Math.abs(d));
  const good = invert ? d < 0 : d > 0;
  return { text: (d > 0 ? "▲ " : "▼ ") + abs + " (" + fmtSignedPct(pct) + ")", cls: good ? "pos" : "neg" };
}

function metricMonth(metric, c, m) {
  if (metric === "income") return incomeForMonth(c, m);
  if (metric === "expenses") return c.expenseTotal;
  if (metric === "net") return incomeForMonth(c, m) - c.expenseTotal;
  if (metric === "breakeven") return c.breakEvenStudents;
  if (metric === "perTeacher") return c.perTeacher;
  if (metric === "students") return c.studentCount;
  return state.meta.lessonsPerYear;
}
function incomeDayValue(c, d) {
  const days = new Date(new Date().getFullYear(), monthNow() + 1, 0).getDate();
  const today = Math.min(new Date().getDate(), days);
  const est = mtdEstimate(c);
  return d <= today ? est * d / today : est + (c.revenue - est) * (d - today) / (days - today);
}
function metricSeries(metric, c, n) {
  if (n === 1) {
    const days = new Date(new Date().getFullYear(), monthNow() + 1, 0).getDate();
    const out = [];
    for (let d = 1; d <= days; d++) {
      if (metric === "income") out.push(incomeDayValue(c, d));
      else if (metric === "expenses") out.push(c.expenseTotal * d / days);
      else if (metric === "net") out.push(incomeDayValue(c, d) - c.expenseTotal * d / days);
      else out.push(metricMonth(metric, c, monthNow()));
    }
    return out;
  }
  return incomeWindow(n).map((m) => metricMonth(metric, c, m));
}
function metricDelta(metric, c, n) {
  const def = KPI_DEFS[metric];
  if (def && def.ops) {
    const p = opsPair(metric);
    return deltaOf(p[1], p[0], def.money, !def.goodUp);
  }
  const money = metric === "income" || metric === "expenses" || metric === "net";
  if (n === 1) {
    if (metric !== "income" && metric !== "net") return { text: "• +0 (+0%)", cls: "flat" };
    const days = new Date(new Date().getFullYear(), monthNow() + 1, 0).getDate();
    const pace = Math.min(new Date().getDate(), days) / days;
    const est = mtdEstimate(c);
    const base = c.revenue * pace;
    return deltaOf(est, base, true); // current MTD vs last month's same-fraction pace
  }
  const prev1 = metricMonth(metric, c, (monthNow() - 1 + 12) % 12);
  const prev2 = metricMonth(metric, c, (monthNow() - 2 + 12) % 12);
  return deltaOf(prev1, prev2, money);
}

function kpiCard(o) {
  return '<div class="kpi ' + (o.cardCls || "") + '"><div class="k-top"><div class="k-label">' + o.label +
    '</div><span class="k-icon">' + o.icon + "</span></div>" +
    '<div class="k-value">' + o.value + "</div>" +
    '<div class="k-foot"><span class="k-spark">' + spark(o.sparkPoints, 92, 26) + '</span>' +
    '<span class="k-delta ' + o.delta.cls + '">' + o.delta.text + "</span></div></div>";
}

// Studio operations KPIs (owner-entered counts; deltas vs entered last month)
function renderOps(c) {
  const o = state.ops;
  const activeNow = Math.round(c.studentCount);
  const spark2 = (prev, cur) => spark([prev, cur], 92, 26);
  return kpiCard({ label: "Overdue invoices", icon: icon("warn"),
      cardCls: o.overdue.amount > 0 ? "kpi-alert" : "",
      value: fmt(o.overdue.amount) + kSub(o.overdue.count + " invoices"),
      delta: deltaOf(o.overdue.amount, o.overdue.prevAmount, true, true),
      sparkPoints: [o.overdue.prevAmount, o.overdue.amount] }) +
    kpiCard({ label: "Active students", icon: icon("users"),
      value: activeNow + kSub("expected " + activeExpected(c) + " next mo"),
      delta: deltaOf(activeNow, o.activeStudentsPrev, false),
      sparkPoints: [o.activeStudentsPrev, activeNow] }) +
    kpiCard({ label: "On hold (this month)", icon: icon("pause"),
      value: String(o.onHoldThisMonth.value),
      delta: deltaOf(o.onHoldThisMonth.value, o.onHoldThisMonth.prev, false, true),
      sparkPoints: [o.onHoldThisMonth.prev, o.onHoldThisMonth.value] }) +
    kpiCard({ label: "On hold (next month)", icon: icon("pause"),
      value: String(o.onHoldNextMonth.value),
      delta: deltaOf(o.onHoldNextMonth.value, o.onHoldNextMonth.prev, false, true),
      sparkPoints: [o.onHoldNextMonth.prev, o.onHoldNextMonth.value] }) +
    kpiCard({ label: "New students gained", icon: icon("userplus"),
      value: String(o.newStudents.value),
      delta: deltaOf(o.newStudents.value, o.newStudents.prev, false),
      sparkPoints: [o.newStudents.prev, o.newStudents.value] }) +
    kpiCard({ label: "Lost / ended students", icon: icon("userminus"),
      value: String(o.lostStudents.value),
      delta: deltaOf(o.lostStudents.value, o.lostStudents.prev, false, true),
      sparkPoints: [o.lostStudents.prev, o.lostStudents.value] });
}
function activeExpected(c) {
  const o = state.ops;
  return Math.round(c.studentCount) + Number(o.newStudents.value) - Number(o.lostStudents.value);
}
function renderOpsEditor(c) {
  const o = state.ops;
  function row(label, aPath, aVal, bPath, bVal, nextCell) {
    return "<tr><td>" + label + "</td><td>" + input(aPath, aVal) + "</td><td>" + input(bPath, bVal) +
      "</td><td>" + (nextCell || "") + "</td></tr>";
  }
  return '<div class="tablewrap roster-table"><table><thead><tr><th>Metric</th><th>This month</th><th>Last month</th><th>Expected next month</th></tr></thead><tbody>' +
    row("Overdue invoices ($)", "ops.overdue.amount", o.overdue.amount, "ops.overdue.prevAmount", o.overdue.prevAmount,
      input("ops.overdue.nextAmount", o.overdue.nextAmount)) +
    row("Overdue invoices (count)", "ops.overdue.count", o.overdue.count, "ops.overdue.prevCount", o.overdue.prevCount,
      input("ops.overdue.nextCount", o.overdue.nextCount)) +
    "<tr><td>Active students (current comes from the model)</td><td>" + Math.round(c.studentCount) + "</td><td>" +
    input("ops.activeStudentsPrev", o.activeStudentsPrev) + "</td><td><strong>" + activeExpected(c) +
    '</strong> <span class="note-flag">+ new − lost/ended</span></td></tr>' +
    row("On hold", "ops.onHoldThisMonth.value", o.onHoldThisMonth.value, "ops.onHoldThisMonth.prev", o.onHoldThisMonth.prev,
      input("ops.onHoldNextMonth.value", o.onHoldNextMonth.value)) +
    row("New students gained", "ops.newStudents.value", o.newStudents.value, "ops.newStudents.prev", o.newStudents.prev,
      (Math.round(state.tuition.newStudentsPerYear / 12 * 10) / 10) + ' <span class="note-flag">model: ' + state.tuition.newStudentsPerYear + "/yr</span>") +
    row("Lost / ended students", "ops.lostStudents.value", o.lostStudents.value, "ops.lostStudents.prev", o.lostStudents.prev,
      input("ops.lostStudents.next", o.lostStudents.next)) +
    "</tbody></table></div>";
}

/* ---------- widget system (Business Plan page) ---------- */

const KPI_DEFS = {
  income:      { label: "Monthly tuition revenue", icon: "money", money: true, goodUp: true, cat: "income", vis: "line" },
  expenses:    { label: "Monthly expenses", icon: "receipt", money: true, goodUp: false, cat: "expenses", vis: "line" },
  net:         { label: "Monthly net", icon: "wallet", money: true, goodUp: true, cat: "profit", vis: "line", sub: (c) => fmtPct(c.margin) + " margin" },
  students:    { label: "Active students", icon: "users", money: false, goodUp: true, cat: "ops", vis: "line", sub: () => "roster total" },
  breakeven:   { label: "Break-even enrollment", icon: "target", money: false, goodUp: false, cat: "profit", vis: "other", sub: (c) => "now " + Math.round(c.studentCount) },
  perTeacher:  { label: "Students per teacher", icon: "users", money: false, goodUp: true, cat: "ops", vis: "other", sub: (c) => "capacity " + c.capacityPerTeacher },
  lessons:     { label: "Lessons per student / yr", icon: "note", money: false, goodUp: true, cat: "other", vis: "other", sub: () => "flat monthly fee model" },
  newStudents: { label: "New students gained", icon: "userplus", money: false, goodUp: true, cat: "ops", vis: "line", ops: true },
  lostStudents:{ label: "Lost / ended students", icon: "userminus", money: false, goodUp: false, cat: "ops", vis: "line", ops: true },
  overdue:     { label: "Overdue invoices ($)", icon: "warn", money: true, goodUp: false, cat: "income", vis: "other", ops: true, alert: true,
                 sub: () => state.ops.overdue.count + " invoices" },
  holds:       { label: "On hold (next month)", icon: "pause", money: false, goodUp: false, cat: "ops", vis: "other", ops: true },
};
function kpiValue(key, c) {
  switch (key) {
    case "income": return c.tuitionRevenue;
    case "expenses": return c.expenseTotal;
    case "net": return c.net;
    case "students": return c.studentCount;
    case "breakeven": return c.breakEvenStudents;
    case "perTeacher": return c.perTeacher;
    case "lessons": return state.meta.lessonsPerYear;
    case "newStudents": return Number(state.ops.newStudents.value);
    case "lostStudents": return Number(state.ops.lostStudents.value);
    case "overdue": return Number(state.ops.overdue.amount);
    case "holds": return Number(state.ops.onHoldNextMonth.value);
  }
}
function opsPair(key) {
  const o = state.ops;
  if (key === "newStudents") return [Number(o.newStudents.prev), Number(o.newStudents.value)];
  if (key === "lostStudents") return [Number(o.lostStudents.prev), Number(o.lostStudents.value)];
  if (key === "overdue") return [Number(o.overdue.prevAmount), Number(o.overdue.amount)];
  if (key === "holds") return [0, Number(o.onHoldNextMonth.value)];
  return [0, 0];
}
let expandedKey = null, suppressClick = false, addMenuOpen = null, addInsertPos = "end";
let dragIdx = null;
let customizeMode = false;

// KPI series: model metrics use the range window; ops metrics have 2 points
function kpiSeries(key, c, n) {
  const def = KPI_DEFS[key];
  if (def.ops) {
    const p = opsPair(key);
    return { points: p, labels: ["Last month", "This month"] };
  }
  let labels;
  if (n === 1) {
    const days = new Date(new Date().getFullYear(), monthNow() + 1, 0).getDate();
    labels = [];
    for (let d = 1; d <= days; d++) labels.push(MONTHS[monthNow()] + " " + d);
  } else {
    labels = incomeWindow(n).map((m) => MONTHS[m]);
  }
  return { points: metricSeries(key, c, n), labels: labels };
}
// Large detail chart for an expanded KPI card
function bigLine(points, labels, money) {
  const padL = 64, padR = 20, padT = 14, padB = 28;
  const W = CHART.W, h = 250, plotW = W - padL - padR, plotH = h - padT - padB;
  const hi = Math.max.apply(null, points) * 1.08 || 1;
  const lo = Math.min(0, Math.min.apply(null, points));
  const span = (hi - lo) || 1;
  const y = (v) => padT + plotH - ((v - lo) / span) * plotH;
  const x = (i) => padL + (points.length === 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  let s = svgOpen(h);
  [0, 1 / 3, 2 / 3, 1].forEach((f) => {
    const v = lo + span * f;
    s += '<line x1="' + padL + '" y1="' + y(v) + '" x2="' + (W - padR) + '" y2="' + y(v) + '" stroke="' + CHART.colors.grid + '" stroke-dasharray="2 4"/>';
    s += '<text x="' + (padL - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end" font-size="11" fill="' + CHART.colors.text + '">' +
      (money ? fmtCompact(v) : Math.round(v)) + "</text>";
  });
  let path = "", dots = "";
  points.forEach((v, i) => {
    path += (i === 0 ? "M " : " L ") + x(i) + " " + y(v);
    dots += '<circle cx="' + x(i) + '" cy="' + y(v) + '" r="3.5" fill="' + CHART.colors.blue + '" pointer-events="none"><title>' +
      esc(labels[i] + ": " + (money ? fmt(v) : Math.round(v))) + "</title></circle>";
  });
  s += '<path d="' + path + " L " + x(points.length - 1) + " " + y(lo) + ' Z" fill="' + CHART.colors.blue + '" opacity="0.10" pointer-events="none"/>';
  s += '<path d="' + path + '" fill="none" stroke="' + CHART.colors.blue + '" stroke-width="2.5" pointer-events="none"/>';
  s += dots;
  const tickIdx = points.length > 8 ? [0, Math.floor((points.length - 1) / 2), points.length - 1] : labels.map((l, i) => i);
  tickIdx.forEach((i) => {
    s += '<text x="' + x(i) + '" y="' + (h - 8) + '" text-anchor="middle" font-size="10" fill="' + CHART.colors.text + '">' + esc(labels[i]) + "</text>";
  });
  return s + "</svg>";
}
function kpiExtra(key, c) {
  function list(rows) {
    return '<div class="k-extra">' + rows.map((r) =>
      '<div class="kx-row"><span>' + esc(r[0]) + "</span><span>" + r[1] + "</span></div>").join("") + "</div>";
  }
  if (key === "income") {
    return list(c.cats.map((x) => [x.name, fmt(x.revenue) + " · " + Math.round(x.students) + " st"]));
  }
  if (key === "expenses") {
    return list(state.expenses.map((x) => [x.name, fmt(eff.expense(x))]));
  }
  if (key === "students") {
    return list(c.cats.map((x) => [x.name, Math.round(x.students) + " students"]));
  }
  return "";
}
function kpiDetail(key, c, n) {
  const s = kpiSeries(key, c, n);
  return bigLine(s.points, s.labels, KPI_DEFS[key].money);
}
// KPI card inner content (no card shell - the widget provides it)
function kpiCardInner(key, c, n, compact) {
  const def = KPI_DEFS[key];
  const val = kpiValue(key, c);
  const valueHtml = (def.money ? fmt(val) : (key === "perTeacher" ? val.toFixed(1) : Math.round(val))) +
    (def.sub ? kSub(def.sub(c)) : "");
  const s = kpiSeries(key, c, n);
  const d = metricDelta(key, c, n);
  return '<div class="k-top"><div class="k-label">' + esc(def.label) + '</div><span class="k-icon">' + icon(def.icon) + "</span></div>" +
    '<div class="k-value">' + valueHtml + "</div>" +
    (compact ? "" : '<div class="k-foot"><span class="k-spark">' + spark(s.points, 92, 26) + '</span>') +
    (compact ? "" : '<span class="k-delta ' + d.cls + '">' + d.text + "</span></div>");
}
function kpiExpandedInner(key, c, n) {
  const def = KPI_DEFS[key];
  const val = kpiValue(key, c);
  const valueHtml = (def.money ? fmt(val) : (key === "perTeacher" ? val.toFixed(1) : Math.round(val))) +
    (def.sub ? kSub(def.sub(c)) : "");
  return '<div class="k-top"><div class="k-label">' + esc(def.label) + " — detail</div>" +
    '<span class="k-actions"><button class="k-act k-act-txt" data-shrink="' + key + '" type="button">▾ shrink</button></span></div>' +
    '<div class="k-value">' + valueHtml + "</div>" +
    kpiDetail(key, c, n) +
    '<div class="k-foot"><span class="k-spark">' + spark(kpiSeries(key, c, n).points, 92, 26) + '</span>' +
    '<span class="k-delta ' + metricDelta(key, c, n).cls + '">' + metricDelta(key, c, n).text + "</span></div>" +
    kpiExtra(key, c);
}
function previewCardHtml(key, c, n) {
  const def = KPI_DEFS[key];
  const val = kpiValue(key, c);
  const valueHtml = (def.money ? fmt(val) : (key === "perTeacher" ? val.toFixed(1) : Math.round(val))) +
    (def.sub ? kSub(def.sub(c)) : "");
  const s = kpiSeries(key, c, n);
  const d = metricDelta(key, c, n);
  return '<div class="kpi preview-card" data-addw="kpi" data-addk="' + key + '">' +
    '<div class="k-top"><div class="k-label">' + esc(def.label) + '</div><span class="k-icon">' + icon(def.icon) + "</span></div>" +
    '<div class="k-value">' + valueHtml + "</div>" +
    '<div class="k-foot"><span class="k-spark">' + spark(s.points, 92, 26) + '</span>' +
    '<span class="k-delta ' + d.cls + '">' + d.text + "</span></div>" +
    '<div class="preview-add">+ add to board</div></div>';
}
function vt(fn) {
  if (document.startViewTransition) document.startViewTransition(fn);
  else fn();
}

// ---- widget registry ----
const WIDGET_DEFS = {
  "income-overview":  { label: "Income overview", size: "M", cat: "income", vis: "line",
                        sizes: ["M", "L", "XL"] },
  "revenue-category": { label: "Revenue by category", size: "M", cat: "income", vis: "bar",
                        sizes: ["M", "L", "XL"] },
  "donut":            { label: "Where a dollar of revenue goes", size: "M", cat: "expenses", vis: "doughnut",
                        sizes: ["M", "L"] },
  "ops-cards":        { label: "Studio operations KPIs", size: "XL", cat: "ops", vis: "other",
                        sizes: ["XL"] },
  "ops-editor":       { label: "Studio operations editor", size: "L", cat: "ops", vis: "table",
                        sizes: ["L", "XL"] },
  "investments":      { label: "One-time / annual investments", size: "M", cat: "expenses", vis: "table",
                        sizes: ["M", "L"] },
  "kpi":              { label: "KPI card", size: "S", cat: undefined, vis: undefined,
                        sizes: ["XS", "S", "M", "L"] },
};
const SIZE_CYCLE_BASE = ["XS", "S", "M", "L", "XL"];
const SIZE_RANK = { S: 1, M: 2, L: 3 };
function investmentsHtml(c) {
  let inv = state.investments.map((x, i) =>
    "<tr><td>" + x.name + '<span class="note-flag">' + x.note + "</span></td><td>" +
    input("investments." + i + ".amount", x.amount) + "</td></tr>").join("");
  inv += '<tr class="total"><td>Total</td><td>' + fmt(c.investmentTotal) + "</td></tr>";
  return '<div class="chart-cap">One-time / annual investments</div><p class="hint">Amounts are editable assumptions.</p>' +
    '<div class="tablewrap"><table><thead><tr><th>Item</th><th>Amount</th></tr></thead><tbody>' + inv + "</tbody></table></div>";
}
function widgetBody(entry, c, n, preview) {
  switch (entry.w) {
    case "income-overview":
      return '<div class="io-head"><div><div class="chart-cap">Income overview</div>' +
        '<div class="io-sub">Miralles Music Academy · CAD</div></div>' +
        '<div class="mini-seg" role="tablist" aria-label="Comparison window for all metrics">' +
        ["1M", "3M", "6M", "1Y"].map((r) => '<button type="button" data-range="' + r + '"' +
          (incomeRange === r ? ' class="active"' : "") + ">" + r + "</button>").join("") + "</div></div>" +
        renderIncomeHeadline(c) + renderIncomeChart(c) + renderIncomeFoot();
    case "revenue-category":
      return '<div class="cat-head"><div class="chart-cap" id="cat-cap"></div>' +
        '<div class="mini-seg" role="tablist" aria-label="Revenue breakdown view">' +
        '<button type="button" data-v="category"' + (catView === "category" ? ' class="active"' : "") + ">By category</button>" +
        '<button type="button" data-v="teacher"' + (catView === "teacher" ? ' class="active"' : "") + ">By teacher</button></div></div>" +
        renderCatCap() + renderCategoryChart(c) + renderCatEditor(c) + renderTeacherEditor(c);
    case "donut":
      return '<div class="chart-cap">Where a dollar of revenue goes</div>' + renderSplitChart(c);
    case "ops-cards":
      return '<div class="cards ops-grid">' + renderOps(c) + "</div>";
    case "ops-editor":
      return '<p class="hint">Counts you track in your studio system, not in this model. Enter this month and last month - the red/green deltas compare the two. Active students this month comes from the model.</p>' +
        renderOpsEditor(c);
    case "investments":
      return investmentsHtml(c);
    case "kpi":
      if (preview) return kpiCardInner(entry.k, c, n);
      return expandedKey === entry.k ? kpiExpandedInner(entry.k, c, n) : kpiCardInner(entry.k, c, n);
  }
  return "";
}
function widgetHtml(entry, idx, c, n, view) {
  const expanded = entry.w === "kpi" && expandedKey === entry.k;
  const sizeCls = expanded ? "L" : entry.size;
  const body = widgetBody(entry, c, n);
  const chrome = customizeMode ?
    '<div class="w-chrome"><button class="w-act" data-wsize="' + idx + '" type="button" title="Cycle size">⤢ ' + entry.size + "</button>" +
    '<button class="w-act w-x" data-wremove="' + idx + '" type="button" title="Remove widget">✕</button></div>' : "";
  const vtName = customizeMode ? "" : ' style="view-transition-name: wt-' + view + "-" + idx + '"';
  const kpiExpand = entry.w === "kpi" && !customizeMode ? ' data-expand="' + entry.k + '"' : "";
  const alertCls = entry.w === "kpi" && entry.k === "overdue" && kpiValue("overdue", c) > 0 ? " alert" : "";
  return '<div class="widget size-' + sizeCls + (customizeMode ? " customizing" : "") + alertCls +
    '" data-idx="' + idx + '"' + kpiExpand + (customizeMode ? ' draggable="true"' : "") + vtName + ">" +
    chrome + '<div class="w-body">' + body + "</div></div>";
}
function renderBoard(view, c, n) {
  const list = state.widgets[view] || [];
  let html = "";
  if (customizeMode) {
    html += '<div class="widget add-strip" data-pos="start"><button class="w-add" data-addpos="start" type="button" title="Add a widget at the top">+</button></div>';
  }
  html += list.map((e, i) => widgetHtml(e, i, c, n, view)).join("");
  return html;
}
let FILTERS = { shape: "all", cat: "all", vis: "all" };
function widgetPickerItems() {
  const items = [];
  Object.keys(WIDGET_DEFS).forEach((wid) => {
    if (wid === "kpi") return; // kpi widgets are listed per metric below
    const def = WIDGET_DEFS[wid];
    if (FILTERS.shape !== "all" && def.size !== FILTERS.shape) return;
    if (FILTERS.cat !== "all" && def.cat !== FILTERS.cat) return;
    if (FILTERS.vis !== "all" && def.vis !== FILTERS.vis) return;
    items.push({ w: wid, label: def.label, size: def.size, cat: def.cat, vis: def.vis });
  });
  Object.keys(KPI_DEFS).forEach((k) => {
    const def = KPI_DEFS[k];
    if (FILTERS.shape !== "all" && "S" !== FILTERS.shape) return;
    if (FILTERS.cat !== "all" && def.cat !== FILTERS.cat) return;
    if (FILTERS.vis !== "all" && def.vis !== FILTERS.vis) return;
    items.push({ w: "kpi", k: k, label: def.label, size: "S", cat: def.cat, vis: def.vis, kpi: k });
  });
  return items;
}
function visLabel(vis) {
  return { line: "line graph", bar: "bar graph", chart: "chart", pie: "pie chart", doughnut: "doughnut chart", table: "table", list: "list", other: "other" }[vis] || vis;
}
function catLabel(cat) {
  return { income: "income", expenses: "expenses", profit: "profit", ops: "studio operations", other: "other" }[cat] || cat;
}
function filterChips() {
  function row(label, key, opts) {
    return '<div class="filter-row"><span class="filter-label">' + label + ':</span>' +
      opts.map((o) => '<button class="flt-chip' + (FILTERS[key] === o[0] ? " active" : "") +
        '" data-fkey="' + key + '" data-fval="' + o[0] + '" type="button">' + o[1] + "</button>").join("") + "</div>";
  }
  return row("Shape", "shape", [["all", "All"], ["S", "Small"], ["M", "Medium"], ["L", "Full width"]]) +
    row("Category", "cat", [["all", "All"], ["income", "Income"], ["expenses", "Expenses"], ["profit", "Profit"], ["ops", "Studio operations"], ["other", "Other"]]) +
    row("Visual", "vis", [["all", "All"], ["line", "Line graphs"], ["bar", "Bar graphs"], ["chart", "Charts"], ["pie", "Pie charts"], ["doughnut", "Doughnut charts"], ["table", "Tables"], ["list", "Lists"], ["other", "Other"]]);
}
let sizeFilter = "all";
function shapeGlyph(size) {
  const rank = { S: 1, M: 2, L: 3 }[size] || 1;
  let bars = "";
  for (let i = 0; i < 3; i++) {
    bars += '<span class="sg-bar' + (i < rank ? " on" : "") + '"></span>';
  }
  return '<span class="shape-glyph" title="' + size + ' widget">' + bars + "</span>";
}
function renderAddModal(c, n) {
  const view = addMenuOpen;
  const modal = document.getElementById("add-modal");
  if (!view) { modal.classList.remove("open"); modal.innerHTML = ""; return; }
  const items = widgetPickerItems();
  // match the picker's columns to the real board so previews render at true size
  const boardEl = document.getElementById("board-" + view);
  const boardW = boardEl ? Math.round(boardEl.getBoundingClientRect().width) : 1124;
  modal.classList.add("open");
  modal.innerHTML = '<div class="add-modal" style="width:' + (boardW + 55) + 'px"><div class="io-head">' +
    '<div class="chart-cap">Add a widget</div>' +
    '<button class="k-act" data-closemodal="1" type="button">&#10005; close</button></div>' +
    filterChips() +
    '<p class="hint">Full-size previews on a board-sized grid - pick one and it lands at the ' +
    (addInsertPos === "start" ? "top" : "bottom") + ' of the board just like this.</p>' +
    '<div class="add-grid">' +
    (items.length ? items.map((it) => {
      const tags = '<div class="pv-tags">' + esc(catLabel(it.cat) + " \u00B7 " + visLabel(it.vis)) + "</div>";
      const entry = { w: it.w, k: it.k };
      return '<div class="widget preview size-' + it.size + '" data-addw="' + it.w + '"' +
        (it.k ? ' data-addk="' + it.k + '"' : "") + '>' +
        widgetBody(entry, c, n, true).replace(/\sid=\"[^\"]*\"/g, "") +
        '<div class="preview-add">+ add to board</div></div>';
    }).join("") : '<span class="add-empty">No widgets match those filters.</span>') +
    "</div></div>";
}
/* ---------- rendering ---------- */

function input(path, value, opts) {
  const extra = opts && opts.step ? ' step="' + opts.step + '"' : "";
  return '<input type="number" data-path="' + path + '" value="' + value + '" aria-label="' + path + '"' + extra + ">";
}

function renderHeader() {
  document.getElementById("school-name").textContent = state.meta.school;
  document.getElementById("school-sub").textContent = state.meta.subtitle;
  document.getElementById("generated-pill").textContent =
    state.meta.generated ? "generated: " + state.meta.generated : "generated: (run sets this)";
  document.getElementById("generated-pill").title = state.meta.generated || "";
}

let bpView = "income";
try { bpView = localStorage.getItem("mma-bp-view") || "income"; } catch (err) { /* private mode */ }

function renderPlan() {
  const c = calc();
  const n = INCOME_RANGES[incomeRange];
  document.getElementById("board-income").innerHTML = renderBoard("income", c, n);
  document.getElementById("board-expenses").innerHTML = renderBoard("expenses", c, n);
  const modal = document.getElementById("add-modal");
  if (addMenuOpen) renderAddModal(c, n);
  else modal.classList.remove("open");
}

function renderBudget() {
  const c = calc();
  const pyToggle = document.getElementById("py-toggle");
  const pyControls = document.getElementById("prior-controls");
  pyToggle.checked = !!state.priorYear.enabled;
  pyControls.style.display = state.priorYear.enabled ? "flex" : "none";
  pyControls.innerHTML =
    pcInput("priorYear.enrollmentPct", state.priorYear.enrollmentPct, "Enrollment vs. now") +
    pcInput("priorYear.tuitionPct", state.priorYear.tuitionPct, "Tuition vs. now") +
    pcInput("priorYear.expensePct", state.priorYear.expensePct, "Expenses vs. now");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const head = "<thead><tr><th>Line</th>" + months.map((m) => "<th>" + m + "</th>").join("") +
    "<th>Base</th><th>Year</th></tr></thead>";

  let body = "";
  c.rows.forEach((r, i) => {
    body += "<tr><td>Income - " + r.name + "</td>" +
      months.map(() => "<td>" + fmt(r.revenue) + "</td>").join("") +
      "<td>" + (Math.round(r.students * 10) / 10) + " st.</td>" +
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
  document.getElementById("chart-trend").innerHTML = renderTrendChart(c);
}

function verdict(label, ok, whenTrue, whenFalse) {
  return '<div class="kpi verdict-' + (ok ? "pos" : "neg") + '"><div class="k-label">' + label + "</div>" +
    '<div class="k-value ' + (ok ? "pos" : "neg") + '">' + (ok ? whenTrue : whenFalse) + "</div></div>";
}

function renderDashboard() {
  const c = calc();
  const base = calcBase(); // scenario-free numbers for the banner/lever notes
  const n = INCOME_RANGES[incomeRange];

  // Health-check verdicts (adapted from the sample's Financial Health Check)
  const direction = (scenario.tuition || scenario.enrollment || scenario.expenses || scenario.teachers)
    ? "scenario active - see banner below" : "at base model";
  document.getElementById("verdicts").innerHTML =
    verdict("Cash position", c.verdicts.cashPositive, "Cash positive", "Cash negative") +
    verdict("Profitable (margin &ge; " + fmtPct(state.meta.marginFloor) + ")",
      c.verdicts.profitable, "Profitable", "Margin too thin") +
    verdict("Capacity-safe (&le; " + c.capacityPerTeacher + " st/teacher)", c.verdicts.capacitySafe,
      "Room to grow", "At or over capacity") +
    kpiCard({ label: "Direction", icon: icon("arrow"), value: direction,
      delta: { text: "net " + fmtSigned(c.net) + "/mo", cls: c.net >= 0 ? "pos" : "neg" },
      sparkPoints: metricSeries("net", c, n) });

  document.getElementById("dash-kpis").innerHTML =
    kpiCard({ label: "Monthly revenue", icon: icon("money"), value: fmt(c.revenue),
      delta: metricDelta("income", c, n), sparkPoints: metricSeries("income", c, n) }) +
    kpiCard({ label: "Monthly expenses", icon: icon("receipt"), value: fmt(c.expenseTotal),
      delta: metricDelta("expenses", c, n), sparkPoints: metricSeries("expenses", c, n) }) +
    kpiCard({ label: "Monthly net (what you keep)", icon: icon("wallet"), value: fmt(c.net) + kSub(fmtPct(c.margin) + " margin"),
      delta: metricDelta("net", c, n), sparkPoints: metricSeries("net", c, n) }) +
    kpiCard({ label: "Break-even enrollment", icon: icon("target"),
      value: (isFinite(c.breakEvenStudents) ? c.breakEvenStudents : "–") + " st" +
        kSub("now " + Math.round(c.studentCount) + " · headroom " +
          (isFinite(c.breakEvenStudents) ? Math.max(0, Math.round(c.studentCount - c.breakEvenStudents)) : "–")),
      delta: metricDelta("breakeven", c, n), sparkPoints: metricSeries("breakeven", c, n) }) +
    kpiCard({ label: "Students per teacher", icon: icon("users"), value: c.perTeacher.toFixed(1) + kSub("capacity " + c.capacityPerTeacher),
      delta: metricDelta("perTeacher", c, n), sparkPoints: metricSeries("perTeacher", c, n) }) +
    kpiCard({ label: "Lessons per student / year", icon: icon("note"), value: state.meta.lessonsPerYear + kSub("flat monthly fee model"),
      delta: metricDelta("lessons", c, n), sparkPoints: metricSeries("lessons", c, n) });

  // Scenario verdict banner: safe / tight / wait (adapted from Scenario Calculator)
  const anyLever = scenario.tuition !== 0 || scenario.enrollment !== 0 ||
    scenario.expenses !== 0 || scenario.teachers !== 0;
  let banner = "";
  if (anyLever) {
    const cls = c.net >= state.targets.netMonthly ? "ok" : (c.net >= 0 ? "warn" : "stop");
    const word = cls === "ok" ? "SAFE" : (cls === "warn" ? "TIGHT" : "WAIT");
    const meaning = cls === "ok"
      ? "net meets or beats your target (" + fmt(state.targets.netMonthly) + "/mo)"
      : (cls === "warn" ? "positive net, but below your target - go in with eyes open"
        : "negative net - this path loses money");
    banner = '<div class="banner ' + cls + '"><strong>' + word + "</strong> - " + meaning +
      ". Net: " + fmt(c.net) + "/mo (" + fmtSigned(c.net - base.net) + " vs. base).</div>";
  }
  document.getElementById("scenario-banner").innerHTML = banner;

  document.getElementById("levers").innerHTML =
    lever("Tuition change", "tuition", "%") +
    lever("Enrollment change", "enrollment", "%") +
    lever("Expense change", "expenses", "%") +
    lever("Teachers (+/-)", "teachers", "");

  let tgt = "<tr><th>Target</th><th>Value</th><th>Current</th><th>Gap</th></tr>";
  tgt += "<tr><td>Net per month</td><td>" +
    input("targets.netMonthly", state.targets.netMonthly) + "</td><td>" + fmt(c.net) +
    '</td><td class="' + (c.targetGap >= 0 ? "pos" : "neg") + '">' +
    fmtSigned(c.targetGap) + "</td></tr>";
  tgt += "<tr><td>Total seat capacity (teachers &times; per-teacher)</td><td>" +
    c.seatCapacity + "</td><td>" + c.studentCount +
    '</td><td class="' + (c.seatCapacity - c.studentCount >= 0 ? "pos" : "neg") + '">' +
    (c.seatCapacity - c.studentCount) + " seats</td></tr>";
  document.getElementById("targets-table").innerHTML =
    '<div class="tablewrap"><table>' + tgt + "</table></div>";

  let cap = "<tr><th>Metric</th><th>Value</th></tr>";
  cap += "<tr><td>Active students</td><td>" + c.studentCount + "</td></tr>";
  cap += "<tr><td>Teachers (incl. owner; profile " + state.meta.teachers + ")</td><td>" +
    c.teacherCount + "</td></tr>";
  cap += "<tr><td>Per-teacher capacity per week (editable)</td><td>" +
    input("meta.capacityPerTeacher", state.meta.capacityPerTeacher) + "</td></tr>";
  cap += "<tr><td>Students per teacher per week</td><td>" + c.perTeacher.toFixed(1) + "</td></tr>";
  cap += "<tr><td>Break-even enrollment</td><td>" +
    (c.studentCount === 0 ? "-" : c.breakEvenStudents + " students") + "</td></tr>";
  cap += "<tr><td>Enrollment headroom to break-even</td><td>" +
    (c.studentCount === 0 ? "-" :
      Math.max(0, c.studentCount - c.breakEvenStudents) + " students") + "</td></tr>";
  cap += "<tr><td>Seat headroom to full capacity</td><td>" +
    Math.max(0, c.seatCapacity - c.studentCount) + " students</td></tr>";
  document.getElementById("capacity-table").innerHTML =
    '<div class="tablewrap"><table>' + cap + "</table></div>";
  document.getElementById("chart-sensitivity").innerHTML = renderSensitivityChart(c);
}

function lever(label, key, unit) {
  const value = scenario[key];
  let note = "";
  if (value !== 0 && key === "teachers") {
    const c = calc();
    note = c.perTeacher.toFixed(1) + " st/teacher; capacity " + c.seatCapacity + " seats" +
      " (net unchanged - payroll is a share of tuition)";
  } else if (value !== 0) {
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
  scenario.tuition = 0; scenario.enrollment = 0; scenario.expenses = 0; scenario.teachers = 0;
  const b = calc();
  scenario.tuition = saved.tuition;
  scenario.enrollment = saved.enrollment;
  scenario.expenses = saved.expenses;
  scenario.teachers = saved.teachers;
  return b;
}

function renderAll() {
  renderHeader();
  renderPlan();
  renderBudget();
  renderDashboard();
}

/* ---------- wiring ---------- */

function wireTabs() {
  document.querySelectorAll("[data-tab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-tab]").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("tab-" + btn.dataset.tab).classList.add("active");
      window.scrollTo(0, 0);
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
  document.getElementById("bp-view").addEventListener("click", (ev) => {
    const b = ev.target.closest("button[data-v]");
    if (!b || b.dataset.v === bpView) return;
    bpView = b.dataset.v;
    try { localStorage.setItem("mma-bp-view", bpView); } catch (err) { /* private mode */ }
    document.querySelectorAll("#bp-view button").forEach((x) => x.classList.toggle("active", x === b));
    document.getElementById("bp-income").classList.toggle("active", bpView === "income");
    document.getElementById("bp-expenses").classList.toggle("active", bpView === "expenses");
  });
  document.querySelectorAll("#bp-view button").forEach((b) => b.classList.toggle("active", b.dataset.v === bpView));
  document.getElementById("bp-income").classList.toggle("active", bpView === "income");
  document.getElementById("bp-expenses").classList.toggle("active", bpView === "expenses");
  // widget board handlers (Business Plan page)
  ["board-income", "board-expenses"].forEach((bid) => {
    const view = bid === "board-income" ? "income" : "expenses";
    const board = document.getElementById(bid);
    board.addEventListener("click", (ev) => {
      const range = ev.target.closest("[data-range]");
      if (range && range.dataset.range !== incomeRange) {
        incomeRange = range.dataset.range;
        try { localStorage.setItem("mma-income-range", incomeRange); } catch (err) { /* private mode */ }
        renderAll();
        return;
      }
      const cv = ev.target.closest("[data-v]");
      if (cv) {
        if (cv.dataset.v !== catView) { catView = cv.dataset.v; renderAll(); }
        return;
      }
      if (!customizeMode) {
        const shrink = ev.target.closest("[data-shrink]");
        if (shrink) { vt(() => { expandedKey = null; renderAll(); }); return; }
        const exp = ev.target.closest("[data-expand]");
        if (exp) { vt(() => { expandedKey = exp.dataset.expand; renderAll(); }); return; }
        return;
      }
      const addPos = ev.target.closest("[data-addpos]");
      if (addPos) {
        addMenuOpen = view;
        addInsertPos = addPos.dataset.addpos;
        FILTERS = { shape: "all", cat: "all", vis: "all" };
        renderAll();
        return;
      }
      const wsize = ev.target.closest("[data-wsize]");
      if (wsize) {
        const entry = state.widgets[view][Number(wsize.dataset.wsize)];
        const set = WIDGET_DEFS[entry.w].sizes;
        entry.size = set[(set.indexOf(entry.size) + 1) % set.length] || set[0];
        save();
        renderAll();
        return;
      }
      const wremove = ev.target.closest("[data-wremove]");
      if (wremove) {
        state.widgets[view].splice(Number(wremove.dataset.wremove), 1);
        save();
        vt(() => renderAll());
        return;
      }
    });
    board.addEventListener("dragstart", (ev) => {
      const w = ev.target.closest(".widget[data-idx]");
      if (!w || !customizeMode) return;
      suppressClick = true;
      dragIdx = Number(w.dataset.idx);
      w.classList.add("dragging");
      try { ev.dataTransfer.setData("text/plain", String(dragIdx)); } catch (err) { /* old engines */ }
      ev.dataTransfer.effectAllowed = "move";
    });
    board.addEventListener("dragover", (ev) => {
      if (!customizeMode || dragIdx === null) return;
      const over = ev.target.closest(".widget[data-idx]");
      if (over && Number(over.dataset.idx) !== dragIdx) {
        ev.preventDefault();
        ev.dataTransfer.dropEffect = "move";
        const rect = over.getBoundingClientRect();
        const before = ev.clientX < rect.left + rect.width / 2;
        over.classList.toggle("drop-before", before);
        over.classList.toggle("drop-after", !before);
      }
      const empty = ev.target.closest(".widget.empty");
      if (empty) { ev.preventDefault(); ev.dataTransfer.dropEffect = "move"; }
    });
    board.addEventListener("drop", (ev) => {
      if (!customizeMode || dragIdx === null) return;
      ev.preventDefault();
      const list = state.widgets[view];
      const empty = ev.target.closest(".widget.empty");
      const overWidget = ev.target.closest(".widget[data-idx]");
      if (empty) {
        const moved = list.splice(dragIdx, 1)[0];
        moved.size = empty.dataset.slotsize;
        list.push(moved);
      } else if (overWidget) {
        const over = Number(overWidget.dataset.idx);
        if (over === dragIdx) return;
        const moved = list.splice(dragIdx, 1)[0];
        const adj = over > dragIdx ? over - 1 : over;
        list.splice(adj + (overWidget.classList.contains("drop-after") ? 1 : 0), 0, moved);
      } else { return; }
      save();
      vt(() => renderAll());
    });
    board.addEventListener("dragend", () => {
      suppressClick = false;
      dragIdx = null;
      document.querySelectorAll(".dragging, .drop-before, .drop-after").forEach((el) =>
        el.classList.remove("dragging", "drop-before", "drop-after"));
    });
  });
  document.getElementById("customize-btn").addEventListener("click", () => {
    customizeMode = !customizeMode;
    const b = document.getElementById("customize-btn");
    b.textContent = customizeMode ? "✓ Done" : "✎ Customize";
    renderAll();
  });
  const addModal = document.getElementById("add-modal");
  function closeAddModal() {
    addMenuOpen = null;
    addModal.classList.remove("open");
    addModal.innerHTML = "";
  }
  addModal.addEventListener("click", (ev) => {
    if (ev.target === addModal) { closeAddModal(); renderAll(); return; }
    if (ev.target.closest("[data-closemodal]")) { closeAddModal(); renderAll(); return; }
    const fchip = ev.target.closest("[data-fkey]");
    if (fchip) {
      FILTERS[fchip.dataset.fkey] = fchip.dataset.fval;
      renderAll();
      return;
    }
    const item = ev.target.closest("[data-addw]");
    if (!item) return;
    const view = addMenuOpen;
    const entry = { w: item.dataset.addw, size: item.dataset.fixedsize || "S" };
    if (item.dataset.addk) entry.k = item.dataset.addk;
    if (item.dataset.fixedsize) entry.size = item.dataset.fixedsize;
    if (addInsertPos === "start") state.widgets[view].unshift(entry);
    else state.widgets[view].push(entry);
    save();
    closeAddModal();
    vt(() => renderAll());
  });
  document.addEventListener("keydown", (ev) => {
    if (ev.key === "Escape" && addMenuOpen) { closeAddModal(); renderAll(); }
  });
  document.getElementById("reset-btn").addEventListener("click", () => {
    if (!confirm("Discard all saved edits and restore this run's defaults?")) return;
    localStorage.removeItem(DEFAULTS.meta.storageKey);
    state = deepClone(DEFAULTS);
    scenario.tuition = 0; scenario.enrollment = 0; scenario.expenses = 0; scenario.teachers = 0;
    save();
    renderAll();
  });
}

/* ---------- init ---------- */

let savedTheme = "light";
try { savedTheme = localStorage.getItem("mma-theme") || "light"; } catch (err) { /* private mode */ }
applyTheme(savedTheme);
load();
wireTabs();
wireInputs();
renderAll();
