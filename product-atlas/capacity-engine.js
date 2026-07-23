/*
 * ============================================================================
 * CAPACITY ATLAS — PRODUCT & MANUFACTURING · CORE ENGINE
 * ============================================================================
 * Pure, dependency-free capacity/finance math for a project- or product-based
 * business that CONTROLS its own schedule (jobs have a known start month and
 * duration; hours spread across that window). This is the deterministic-Gantt
 * model — the counterpart to the Service Atlas, which is probabilistic.
 *
 * Everything here is a pure function of `state`: no DOM, no globals, no I/O.
 * Wire these to any UI (the original Peak Atlas rendered them into an HTML
 * dashboard). Import as an ES module, or drop the file in a <script> tag and
 * read the functions off `window.CapacityEngine`.
 *
 * MODEL IN ONE PARAGRAPH
 *   Capacity  = billable hours your team can deliver per month (employees +
 *   contractors + ramped new hires), optionally filtered to one constraint
 *   skill (the bottleneck resource). Demand = committed hours from won jobs
 *   (100%) plus pipeline hours weighted by win probability. Compare the two to
 *   get utilization, then a verdict: SELL (under-booked), HOLD, or HIRE
 *   (over-committed). Cash layers in AR lag, retainage, and progress billing.
 * ============================================================================
 */

export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* ---------------------------------------------------------------------------
 * DEFAULT DATA — a generic product/manufacturing shop (swap for your own).
 * Skills are the production roles that form your capacity + the bottleneck.
 * ------------------------------------------------------------------------- */
export const DEFAULT_DATA = {
  assumptions: {
    productiveHrs: 140,      // billable hours per FTE per month after admin/setup
    loadedCost: 65,          // fully-loaded internal cost per billable hour
    billingRate: 150,        // effective rate customers pay per hour
    targetUtil: 80,          // planning target utilization (%)
    lowerBound: 70,          // below committed-util → SELL MORE (%)
    upperBound: 90,          // above total-util → HIRE (%)
    constraintSkill: 'Fabrication', // bottleneck resource, or 'none'
    arDays: 60,              // avg days invoice → payment
    retainagePct: 10,        // % held until job completion
    progressBillingPct: 90,  // % billed during the work (vs. at completion)
    openingCash: 250000,     // starting cash for the projection
    backlogHealthyMin: 4,    // healthy backlog floor (months)
    backlogHealthyMax: 6,    // healthy backlog ceiling (months)
    concentrationThreshold: 25 // flag any customer above this % of book
  },
  // Billable production team. pto[] is hours of planned time-off per month.
  employees: [
    { id: 1, name: 'Line Lead A',  skill: 'Fabrication', fte: 1.0, cost: 55, billable: 90, pto: [0,0,0,0,0,80,0,0,0,0,0,40] },
    { id: 2, name: 'Fabricator 1', skill: 'Fabrication', fte: 1.0, cost: 45, billable: 92, pto: [0,0,0,0,40,0,0,0,0,0,0,40] },
    { id: 3, name: 'Fabricator 2', skill: 'Fabrication', fte: 1.0, cost: 45, billable: 92, pto: [0,0,0,0,0,0,80,0,0,0,0,40] },
    { id: 4, name: 'Assembler 1',  skill: 'Assembly',    fte: 1.0, cost: 42, billable: 90, pto: [0,0,0,0,0,0,0,0,40,0,0,40] },
    { id: 5, name: 'Finisher 1',   skill: 'Finishing',   fte: 1.0, cost: 40, billable: 88, pto: [0,0,0,40,0,0,0,0,0,0,0,40] },
    { id: 6, name: 'QA Tech',      skill: 'QA',          fte: 1.0, cost: 48, billable: 80, pto: [0,0,0,0,0,0,0,0,0,0,0,40] },
    { id: 7, name: 'Engineer',     skill: 'Engineering', fte: 0.5, cost: 60, billable: 60, pto: [0,0,0,0,0,0,0,0,0,0,0,40] }
  ],
  // Flexible/1099 capacity with a defined engagement window.
  contractors: [
    { id: 1, name: 'Overflow Fab Shop', skill: 'Fabrication', hrs: 120, cost: 70, startMo: 2, endMo: 6, notes: 'Spring rush overflow' }
  ],
  // What-if hires. `ramp` is first-month efficiency %; +25% month 2; 100% after.
  hires: [
    { id: 1, role: 'Fabricator III', skill: 'Fabrication', fte: 1.0, cost: 45, billable: 92, startMo: 3, ramp: 50, notes: 'Backfill summer load' }
  ],
  // Won work being delivered. Hours count 100% against capacity.
  scheduled: [
    { id: 1, jobNum: 'J-2401', customer: 'Meridian OEM',   project: 'Enclosure Run A', status: 'In Progress', skill: 'Fabrication', contract: 240000, totalHrs: 1380, used: 420, startMo: 0, duration: 5, margin: 42 },
    { id: 2, jobNum: 'J-2402', customer: 'Harbor Systems', project: 'Bracket Batch',   status: 'In Progress', skill: 'Fabrication', contract: 145000, totalHrs: 880,  used: 320, startMo: 0, duration: 3, margin: 46 },
    { id: 3, jobNum: 'J-2403', customer: 'Apex Devices',   project: 'Assembly Cell',   status: 'Scheduled',   skill: 'Assembly',    contract: 95000,  totalHrs: 560,  used: 0,   startMo: 2, duration: 3, margin: 48 },
    { id: 4, jobNum: 'J-2404', customer: 'Northwind Co',   project: 'Finish Line Job', status: 'Scheduled',   skill: 'Finishing',   contract: 78000,  totalHrs: 460,  used: 0,   startMo: 2, duration: 2, margin: 44 },
    { id: 5, jobNum: 'J-2405', customer: 'Cascade Mfg',    project: 'Frame Program',   status: 'Scheduled',   skill: 'Fabrication', contract: 165000, totalHrs: 950,  used: 0,   startMo: 3, duration: 4, margin: 40 }
  ],
  // Open opportunities, weighted by win probability.
  pipeline: [
    { id: 1, name: 'Riverbend Retrofit', customer: 'Riverbend Ind', stage: 'Proposed',     skill: 'Fabrication', revenue: 120000, hours: 720,  win: 50, startMo: 2, duration: 4, margin: 42 },
    { id: 2, name: 'Delta Assembly Run', customer: 'Delta Corp',    stage: 'Verbal Yes',   skill: 'Assembly',    revenue: 65000,  hours: 380,  win: 75, startMo: 1, duration: 2, margin: 50 },
    { id: 3, name: 'Summit Large Frame', customer: 'Summit LLC',    stage: 'Early Stage',  skill: 'Fabrication', revenue: 240000, hours: 1400, win: 20, startMo: 4, duration: 6, margin: 40 }
  ],
  // Named what-if recipes: which hires to include + timeline shifts to apply.
  scenarios: [
    { id: 'sc1', name: 'Hire Fabricator Mar', hireIds: [1], shifts: [], color: '#f89400' },
    { id: 'sc2', name: 'Push Cascade 30 days', hireIds: [], shifts: [{ jobId: 5, monthShift: 1 }], color: '#7a4ea8' }
  ]
};

/* ===========================================================================
 * CAPACITY PRIMITIVES — hours one resource contributes in month `m`.
 * =========================================================================== */

/** Billable hours an employee delivers in month m, net of planned PTO. */
export function employeeMonthHours(emp, m, productiveHrs) {
  const base = (emp.fte || 0) * productiveHrs * ((emp.billable || 0) / 100);
  const pto = (emp.pto && emp.pto[m]) || 0;
  const ptoEffect = pto * ((emp.billable || 0) / 100);
  return Math.max(0, base - ptoEffect);
}

/** Contractor hours in month m — flat `hrs` while inside [startMo, endMo]. */
export function contractorMonthHours(c, m) {
  const start = c.startMo || 0;
  const end = (c.endMo !== undefined && c.endMo !== null) ? c.endMo : 11;
  return (m >= start && m <= end) ? (c.hrs || 0) : 0;
}

/**
 * New-hire hours in month m, applying a ramp:
 *   month 0 in seat = `ramp`%, month 1 = min(100, ramp+25)%, month 2+ = 100%.
 */
export function hireMonthHours(h, m, productiveHrs) {
  const start = h.startMo || 0;
  if (m < start) return 0;
  const monthsIn = m - start;
  let efficiency;
  if (monthsIn === 0) efficiency = (h.ramp || 50) / 100;
  else if (monthsIn === 1) efficiency = Math.min(1, ((h.ramp || 50) + 25) / 100);
  else efficiency = 1;
  const base = (h.fte || 0) * productiveHrs * ((h.billable || 0) / 100);
  return base * efficiency;
}

/* ===========================================================================
 * SCENARIO HELPERS
 * =========================================================================== */

/** Look up a scenario by id; null means the implicit baseline. */
export function getScenario(state, scenarioId) {
  if (!scenarioId || scenarioId === 'baseline') return null;
  return (state.scenarios || []).find(s => s.id === scenarioId) || null;
}

/** A job's start month after applying a scenario's timeline shift (clamped). */
export function shiftedStartMo(job, scenario) {
  if (!scenario || !scenario.shifts) return job.startMo || 0;
  const override = scenario.shifts.find(s => s.jobId === job.id);
  if (!override) return job.startMo || 0;
  return Math.max(0, Math.min(11, (job.startMo || 0) + (override.monthShift || 0)));
}

/* ===========================================================================
 * CORE COMPUTE — capacity vs. demand for one scenario, over 12 months.
 *   scenarioId : 'baseline' | a scenario id
 *   skillFilter: undefined/'none' for whole shop, or a skill to view the
 *                binding constraint resource in isolation.
 * Returns per-month arrays plus a SELL/HOLD/HIRE action for each month.
 * =========================================================================== */
export function compute(state, scenarioId, skillFilter) {
  const a = state.assumptions;
  const months = MONTHS.map((_, i) => i);
  const scenario = getScenario(state, scenarioId);
  const filterActive = skillFilter && skillFilter !== 'none';
  const ok = (item) => !filterActive || item.skill === skillFilter;

  const activeHires = scenario
    ? state.hires.filter(h => scenario.hireIds.includes(h.id))
    : [];

  // --- CAPACITY (hours) ---
  const capByMonth = months.map(m => {
    let t = state.employees.filter(ok).reduce((s, e) => s + employeeMonthHours(e, m, a.productiveHrs), 0);
    t += state.contractors.filter(ok).reduce((s, c) => s + contractorMonthHours(c, m), 0);
    t += activeHires.filter(ok).reduce((s, h) => s + hireMonthHours(h, m, a.productiveHrs), 0);
    return t;
  });

  // --- COMMITTED demand (won jobs, remaining hours spread over duration) ---
  const committedByMonth = months.map(m =>
    state.scheduled.filter(ok).reduce((s, j) => {
      const start = shiftedStartMo(j, scenario), dur = j.duration || 1;
      if (m >= start && m < start + dur) {
        return s + Math.max(0, (j.totalHrs || 0) - (j.used || 0)) / dur;
      }
      return s;
    }, 0)
  );

  // --- PIPELINE demand (weighted by win probability) ---
  const pipelineByMonth = months.map(m =>
    state.pipeline.filter(ok).reduce((s, p) => {
      const start = shiftedStartMo(p, scenario), dur = p.duration || 1;
      if (m >= start && m < start + dur) return s + (p.hours || 0) * ((p.win || 0) / 100) / dur;
      return s;
    }, 0)
  );

  // --- Revenue & margin always use the WHOLE book (unfiltered) ---
  const schedRevByMonth = months.map(m =>
    state.scheduled.reduce((s, j) => {
      const start = shiftedStartMo(j, scenario), dur = j.duration || 1;
      return (m >= start && m < start + dur) ? s + (j.contract || 0) / dur : s;
    }, 0)
  );
  const pipeRevByMonth = months.map(m =>
    state.pipeline.reduce((s, p) => {
      const start = shiftedStartMo(p, scenario), dur = p.duration || 1;
      return (m >= start && m < start + dur) ? s + (p.revenue || 0) * ((p.win || 0) / 100) / dur : s;
    }, 0)
  );
  const allCommittedHrs = months.map(m =>
    state.scheduled.reduce((s, j) => {
      const start = shiftedStartMo(j, scenario), dur = j.duration || 1;
      return (m >= start && m < start + dur) ? s + Math.max(0, (j.totalHrs || 0) - (j.used || 0)) / dur : s;
    }, 0)
  );
  const allPipeHrs = months.map(m =>
    state.pipeline.reduce((s, p) => {
      const start = shiftedStartMo(p, scenario), dur = p.duration || 1;
      return (m >= start && m < start + dur) ? s + (p.hours || 0) * ((p.win || 0) / 100) / dur : s;
    }, 0)
  );

  // --- Derived metrics ---
  const committedUtil = months.map(m => capByMonth[m] > 0 ? committedByMonth[m] / capByMonth[m] : 0);
  const totalUtil     = months.map(m => capByMonth[m] > 0 ? (committedByMonth[m] + pipelineByMonth[m]) / capByMonth[m] : 0);
  const availableHrs  = months.map(m => capByMonth[m] - committedByMonth[m] - pipelineByMonth[m]);
  const sellableHrs   = months.map(m => Math.max(0, capByMonth[m] * (a.upperBound / 100) - committedByMonth[m] - pipelineByMonth[m]));
  const overcommitHrs = months.map(m => Math.max(0, committedByMonth[m] + pipelineByMonth[m] - capByMonth[m] * (a.upperBound / 100)));
  const sellableRev   = sellableHrs.map(h => h * a.billingRate);
  const fteGap        = overcommitHrs.map(h => a.productiveHrs > 0 ? h / a.productiveHrs : 0);
  const totalForecast = months.map(m => schedRevByMonth[m] + pipeRevByMonth[m]);
  const directCost    = months.map(m => (allCommittedHrs[m] + allPipeHrs[m]) * a.loadedCost);
  const grossMargin   = months.map(m => totalForecast[m] - directCost[m]);

  // --- VERDICT per month ---
  const action = months.map(m => {
    if (totalUtil[m] > a.upperBound / 100) return 'HIRE';   // over-committed
    if (committedUtil[m] < a.lowerBound / 100) return 'SELL'; // idle capacity
    return 'HOLD';
  });

  return {
    months, capByMonth, committedByMonth, pipelineByMonth,
    committedUtil, totalUtil, availableHrs, sellableHrs, overcommitHrs,
    sellableRev, fteGap, schedRevByMonth, pipeRevByMonth, totalForecast,
    directCost, grossMargin, action,
    scenarioId: scenarioId || 'baseline', skillFilter: skillFilter || 'none'
  };
}

/* ===========================================================================
 * CASH FLOW — inflow with AR lag + retainage + progress billing; outflow =
 * direct cost delivered that month. Returns 12-month net + cumulative cash.
 * =========================================================================== */
export function computeCash(state, calc, scenarioId) {
  const a = state.assumptions;
  const scenario = getScenario(state, scenarioId);
  const arLag = Math.round((a.arDays || 60) / 30);        // months invoice → cash
  const retainage = (a.retainagePct || 0) / 100;
  const progress = (a.progressBillingPct || 90) / 100;

  const billed = new Array(12).fill(0);                    // billed during work
  const retainRelease = new Array(12).fill(0);             // held-back, at job end

  state.scheduled.forEach(j => {
    const start = shiftedStartMo(j, scenario), dur = j.duration || 1;
    const monthly = (j.contract || 0) / dur;
    for (let m = start; m < start + dur && m < 12; m++) billed[m] += monthly * progress;
    const rel = start + dur;
    if (rel < 12) retainRelease[rel] += (j.contract || 0) * retainage;
  });
  state.pipeline.forEach(p => {
    const start = shiftedStartMo(p, scenario), dur = p.duration || 1;
    const win = (p.win || 0) / 100;
    const monthly = (p.revenue || 0) * win / dur;
    for (let m = start; m < start + dur && m < 12; m++) billed[m] += monthly * progress;
  });

  // Inflow: shift billings forward by the AR lag, add retainage releases.
  const inflow = new Array(12).fill(0);
  for (let m = 0; m < 12; m++) {
    const target = m + arLag;
    if (target < 12) inflow[target] += billed[m];
    inflow[m] += retainRelease[m];
  }

  const outflow = calc.directCost.slice();                 // cost delivered/month
  const net = new Array(12).fill(0);
  const cumulative = new Array(12).fill(0);
  let cash = a.openingCash || 0;
  for (let m = 0; m < 12; m++) {
    net[m] = inflow[m] - outflow[m];
    cash += net[m];
    cumulative[m] = cash;
  }
  return { billed, retainRelease, inflow, outflow, net, cumulative, arLag };
}

/* ===========================================================================
 * BACKLOG — months of committed work at current average capacity.
 * =========================================================================== */
export function computeBacklog(state, calc) {
  const avgCap = calc.capByMonth.reduce((s, v) => s + v, 0) / 12 || 1;
  const remaining = state.scheduled.reduce((s, j) => s + Math.max(0, (j.totalHrs || 0) - (j.used || 0)), 0);
  const months = remaining / avgCap;
  const a = state.assumptions;
  let health = 'healthy';
  if (months < a.backlogHealthyMin) health = 'thin';
  else if (months > a.backlogHealthyMax) health = 'overloaded';
  return { months, remaining, avgCap, health };
}

/* ===========================================================================
 * CUSTOMER CONCENTRATION — % of committed contract value per customer,
 * flagging any above the concentration threshold.
 * =========================================================================== */
export function computeConcentration(state) {
  const byCustomer = {};
  let total = 0;
  state.scheduled.forEach(j => {
    byCustomer[j.customer] = (byCustomer[j.customer] || 0) + (j.contract || 0);
    total += (j.contract || 0);
  });
  const thresh = state.assumptions.concentrationThreshold || 25;
  const rows = Object.entries(byCustomer)
    .map(([customer, value]) => ({ customer, value, pct: total > 0 ? (value / total) * 100 : 0 }))
    .sort((x, y) => y.value - x.value)
    .map(r => ({ ...r, flagged: r.pct > thresh }));
  return { total, rows };
}

/* ===========================================================================
 * VERDICT — human-readable decision for a given month of a computed scenario.
 * =========================================================================== */
export function verdictFor(state, calc, month) {
  const a = state.assumptions;
  const act = calc.action[month];
  const totalUtil = calc.totalUtil[month];
  if (act === 'HIRE') {
    return {
      action: 'HIRE',
      headline: 'Add capacity',
      detail: `Committed + pipeline in ${MONTHS[month]} exceeds the ${a.upperBound}% ceiling. ` +
              `Gap of ${Math.round(calc.overcommitHrs[month])} hrs ≈ ${calc.fteGap[month].toFixed(1)} FTE.`
    };
  }
  if (act === 'SELL') {
    return {
      action: 'SELL',
      headline: 'Sell more',
      detail: `Committed utilization in ${MONTHS[month]} is below ${a.lowerBound}%. ` +
              `${Math.round(calc.sellableHrs[month])} sellable hrs ≈ $${Math.round(calc.sellableRev[month]).toLocaleString()} of capacity.`
    };
  }
  return {
    action: 'HOLD',
    headline: 'Hold — well matched',
    detail: `Capacity is matched to demand in ${MONTHS[month]}. Total utilization ${(totalUtil * 100).toFixed(0)}%.`
  };
}

/* ===========================================================================
 * Convenience: compute baseline + every scenario at once.
 * =========================================================================== */
export function computeAll(state, skillFilter) {
  const ids = ['baseline', ...(state.scenarios || []).map(s => s.id)];
  return ids.map(id => compute(state, id, skillFilter));
}

// UMD-ish global for non-module usage (drop-in <script> tag).
if (typeof window !== 'undefined') {
  window.CapacityEngine = {
    MONTHS, DEFAULT_DATA, employeeMonthHours, contractorMonthHours, hireMonthHours,
    getScenario, shiftedStartMo, compute, computeCash, computeBacklog,
    computeConcentration, verdictFor, computeAll
  };
}
