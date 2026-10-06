/*
 * ============================================================================
 * CAPACITY ATLAS — UNIFIED ENGINE  ·  Product · Service · Nonprofit
 * ============================================================================
 * ONE tool, three lenses. Product/Service also separate PROJECT work (one-time,
 * finite) from RECURRING / MRR work (retainers — a steady capacity floor and
 * predictable monthly revenue), and carry a forward PROJECTION (MRR growth +
 * churn + project trend → utilization, revenue, and the month you must hire).
 *
 * Pure functions, no DOM, no deps. Loads as a classic <script> (works via
 * file:// and when hosted) and is require()-able in Node.
 *
 * Common calc shape from mode.compute(levers):
 *   { unit, capacity[], recurring[]|null, projectDemand[], committed[], likely[],
 *     upper[], secondary[]|null, utilization[], action[], rev|null }
 *   action ∈ 'under' | 'match' | 'over'
 * Modes with recurring also expose: projFields[], project(levers, horizon).
 * ============================================================================
 */

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const sum = a => a.reduce((s, v) => s + v, 0);
const avg = a => sum(a) / a.length;
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const fmt = {
  n: v => Math.round(v).toLocaleString(),
  n1: v => v.toFixed(1),
  usd: v => '$' + Math.round(v).toLocaleString(),
  usdk: v => '$' + Math.round(v / 1000) + 'k',
  pct: v => Math.round(v * 100) + '%'
};

/* ===========================================================================
 * MODE 1 — PRODUCT & MANUFACTURING  (deterministic)
 * =========================================================================== */
const PRODUCT = {
  key: 'product',
  vocab: {
    title: 'Product & Manufacturing',
    lens: 'You control the schedule — jobs have known start dates and durations. Capacity is billable hours; the risk is booking past what your team can deliver. Retainers form a recurring floor beneath the project work.',
    unit: 'hrs', capacityName: 'Team capacity',
    under: 'Sell more', over: 'Hire', match: 'Hold',
    pill: { under: 'Sell', match: 'Hold', over: 'Hire' },
    recNoun: 'Retainer', projNoun: 'Project'
  },
  base: {
    capacity:  [820,820,940,900,900,860,860,820,780,820,820,600],
    committed: [560,600,820,860,640,300,300,120, 80, 60, 40, 20], // PROJECT work only
    pipeline:  [120,180,260,300,320,280,260,220,180,160,140,120]
  },
  fields: [
    { key: 'extraFTE',    label: 'Add / remove FTE',    min: -3, max: 6, step: 0.5, def: 0,   suffix: ' FTE' },
    { key: 'winPct',      label: 'Pipeline win rate',   min: 0,  max: 100, step: 5, def: 60,  suffix: '%' },
    { key: 'rate',        label: 'Project rate',        min: 80, max: 300, step: 5, def: 150, prefix: '$', suffix: '/hr' },
    { key: 'cost',        label: 'Loaded cost',         min: 30, max: 150, step: 5, def: 65,  prefix: '$', suffix: '/hr' },
    { key: 'recClients',  label: 'Retainer clients',    min: 0,  max: 40, step: 1,  def: 6,   suffix: '' },
    { key: 'recHrs',      label: 'Hrs / retainer · mo', min: 0,  max: 120, step: 5, def: 40,  suffix: '' },
    { key: 'recFee',      label: 'Retainer fee / mo',   min: 0,  max: 30000, step: 500, def: 6000, prefix: '$' },
    { key: 'upper',       label: 'Hire above',          min: 70, max: 100, step: 1, def: 90,  suffix: '%' },
    { key: 'lower',       label: 'Sell below',          min: 40, max: 85, step: 1,  def: 70,  suffix: '%' }
  ],
  projFields: [
    { key: 'netNew',    label: 'Net-new retainers / mo', min: -2, max: 6, step: 0.5, def: 1,  suffix: '' },
    { key: 'churn',     label: 'Monthly retainer churn', min: 0,  max: 15, step: 0.5, def: 2, suffix: '%' },
    { key: 'projGrowth',label: 'Project growth / yr',    min: -30,max: 100, step: 5, def: 15, suffix: '%' }
  ],
  compute(L) {
    const recurring = MONTHS.map(() => L.recClients * L.recHrs);
    const projectDemand = this.base.committed.slice();
    const capacity  = this.base.capacity.map(h => h + L.extraFTE * 150);
    const committed = projectDemand.map((c, i) => c + recurring[i]);        // recurring floor + project
    const likely    = this.base.pipeline.map(h => h * (L.winPct / 100));
    const upper     = committed.map((c, i) => c + likely[i]);
    const utilization   = upper.map((u, i) => capacity[i] > 0 ? u / capacity[i] : 0);
    const committedUtil = committed.map((c, i) => capacity[i] > 0 ? c / capacity[i] : 0);
    const action = utilization.map((u, i) =>
      u > L.upper / 100 ? 'over' : (committedUtil[i] < L.lower / 100 ? 'under' : 'match'));
    const mrr = L.recClients * L.recFee;
    const recYr = mrr * 12;
    const projYr = sum(projectDemand.map((p, i) => p + likely[i])) * L.rate;
    const rev = { mrr, recYr, projYr, totalYr: recYr + projYr };
    return { unit: 'hrs', capacity, recurring, projectDemand, committed, likely, upper, secondary: null, utilization, action, rev, _L: L };
  },
  metrics(L, c) {
    const backlog = sum(c.projectDemand) / (avg(c.capacity) || 1);
    const monthlyTeamCost = avg(c.capacity) * L.cost;
    const coverage = monthlyTeamCost > 0 ? c.rev.mrr / monthlyTeamCost : 0;
    return [
      { label: 'Avg utilization', value: fmt.pct(avg(c.utilization)), sub: 'recurring + project', tone: 'neutral' },
      { label: 'MRR',             value: fmt.usdk(c.rev.mrr) + '/mo',  sub: fmt.pct(c.rev.recYr / (c.rev.totalYr || 1)) + ' of revenue', tone: 'good' },
      { label: 'Recurring covers',value: fmt.pct(coverage),            sub: 'of monthly team cost', tone: coverage >= 1 ? 'good' : 'warn' },
      { label: 'Project backlog', value: fmt.n1(backlog) + ' mo',      sub: backlog < 4 ? 'thin' : backlog > 6 ? 'heavy' : 'healthy', tone: backlog < 4 || backlog > 6 ? 'warn' : 'good' }
    ];
  },
  verdict(L, c, m) {
    const u = c.utilization[m];
    if (c.action[m] === 'over') {
      const over = c.upper[m] - c.capacity[m] * L.upper / 100;
      return { tone: 'bad', headline: 'Hire — you\'re over-committed',
        detail: `${MONTHS[m]}: recurring + project is ${fmt.pct(u)} of capacity — ~${fmt.n(Math.max(0, over))} hrs (~${(Math.max(0,over)/150).toFixed(1)} FTE) past the ${L.upper}% ceiling. Retainers alone lock ${fmt.pct(c.recurring[m]/c.capacity[m])}.` };
    }
    if (c.action[m] === 'under') {
      const open = Math.max(0, c.capacity[m] * L.upper / 100 - c.upper[m]);
      return { tone: 'good', headline: 'Sell more — capacity is open',
        detail: `${MONTHS[m]}: booked work is below ${L.lower}%. ~${fmt.n(open)} sellable hrs ≈ ${fmt.usd(open * L.rate)} of project capacity above the recurring floor.` };
    }
    return { tone: 'warn', headline: 'Hold — well matched', detail: `${MONTHS[m]}: capacity matched to demand at ${fmt.pct(u)}. Recurring floor is ${fmt.pct(c.recurring[m]/c.capacity[m])} of capacity.` };
  },
  project(L, horizon) {
    horizon = horizon || 24;
    const c = this.compute(L);
    const cap = avg(c.capacity);
    const baseProj = avg(c.projectDemand.map((p, i) => p + c.likely[i]));
    let clients = L.recClients;
    const o = { horizon, unit: 'hrs', cap, months: [], clients: [], mrr: [], recurring: [], project: [], demand: [], utilization: [], revenue: [], hireMonth: null, upper: L.upper };
    for (let m = 1; m <= horizon; m++) {
      clients = Math.max(0, clients * (1 - L.churn / 100) + L.netNew);
      const mrr = clients * L.recFee;
      const recLoad = clients * L.recHrs;
      const projLoad = baseProj * Math.pow(1 + L.projGrowth / 100, m / 12);
      const demand = recLoad + projLoad;
      const util = cap > 0 ? demand / cap : 0;
      const revenue = mrr + projLoad * L.rate;
      if (util > L.upper / 100 && o.hireMonth === null) o.hireMonth = m;
      o.months.push(m); o.clients.push(clients); o.mrr.push(mrr);
      o.recurring.push(recLoad); o.project.push(projLoad); o.demand.push(demand);
      o.utilization.push(util); o.revenue.push(revenue);
    }
    return o;
  }
};

/* ===========================================================================
 * MODE 2 — SERVICE  (probabilistic)
 * =========================================================================== */
const SERVICE = {
  key: 'service',
  vocab: {
    title: 'Service Businesses',
    lens: 'An outside party sets the clock, so project demand arrives in bursts — plan against the P90 surge, not the average. Retainer clients add a steady recurring caseload floor and predictable MRR beneath the project spikes.',
    unit: 'cases', capacityName: 'Team caseload capacity',
    under: 'Sell more', over: 'Add capacity', match: 'Hold',
    pill: { under: 'Sell', match: 'Hold', over: 'Add cap' },
    recNoun: 'Retainer', projNoun: 'Project'
  },
  base: {
    expected:  [300,320,360,380,300,260,280,340,360,300,280,260], // PROJECT caseload
    surgeMult: [1.15,1.20,1.35,1.50,1.25,1.10,1.15,1.30,1.45,1.50,1.25,1.15]
  },
  fields: [
    { key: 'workers',    label: 'Case workers',        min: 1,  max: 12, step: 1,  def: 4,   suffix: ' ppl' },
    { key: 'perWorker',  label: 'Cases / worker',      min: 40, max: 130, step: 5, def: 90,  suffix: '' },
    { key: 'intakeMult', label: 'Project intake vs plan', min: 50, max: 200, step: 5, def: 100, suffix: '%' },
    { key: 'delay',      label: 'External-delay stretch', min: 80, max: 200, step: 5, def: 100, suffix: '%' },
    { key: 'feePerCase', label: 'Project fee / case',  min: 1500, max: 12000, step: 250, def: 5000, prefix: '$' },
    { key: 'recClients', label: 'Retainer clients',    min: 0,  max: 80, step: 1,  def: 15,  suffix: '' },
    { key: 'recCases',   label: 'Cases / retainer',    min: 0,  max: 10, step: 1,  def: 3,   suffix: '' },
    { key: 'recFee',     label: 'Retainer fee / mo',   min: 0,  max: 5000, step: 100, def: 800, prefix: '$' },
    { key: 'upper',      label: 'Add above',           min: 70, max: 100, step: 1, def: 90,  suffix: '%' }
  ],
  projFields: [
    { key: 'netNew',    label: 'Net-new retainers / mo', min: -2, max: 8, step: 0.5, def: 2,  suffix: '' },
    { key: 'churn',     label: 'Monthly retainer churn', min: 0,  max: 15, step: 0.5, def: 3, suffix: '%' },
    { key: 'projGrowth',label: 'Project growth / yr',    min: -30,max: 100, step: 5, def: 20, suffix: '%' }
  ],
  compute(L) {
    const capHrs = L.workers * L.perWorker;
    const capacity  = MONTHS.map(() => capHrs);
    const recurring = MONTHS.map(() => L.recClients * L.recCases);
    const projectDemand = this.base.expected.map(e => e * (L.intakeMult / 100));
    const committed = projectDemand.map((e, i) => e + recurring[i]);                  // recurring + expected project
    const projSurge = projectDemand.map((e, i) => e * (1 + (this.base.surgeMult[i] - 1) * (L.delay / 100)));
    const upper     = projSurge.map((s, i) => s + recurring[i]);                       // surge on project + steady retainers
    const likely    = upper.map((u, i) => Math.max(0, u - committed[i]));
    const utilization = committed.map((e, i) => capacity[i] > 0 ? e / capacity[i] : 0);
    const secondary   = upper.map((u, i) => capacity[i] > 0 ? u / capacity[i] : 0);    // SURGE util (binding)
    const action = secondary.map((s, i) =>
      s > 1 ? 'over' : (utilization[i] < (L.upper - 25) / 100 ? 'under' : 'match'));
    const mrr = L.recClients * L.recFee;
    const recYr = mrr * 12;
    const projYr = avg(projectDemand) * L.feePerCase;
    const rev = { mrr, recYr, projYr, totalYr: recYr + projYr };
    return { unit: 'cases', capacity, recurring, projectDemand, committed, likely, upper, secondary, utilization, action, rev, _L: L };
  },
  metrics(L, c) {
    const monthsOver = c.secondary.filter(s => s > 1).length;
    return [
      { label: 'Avg caseload util', value: fmt.pct(avg(c.utilization)), sub: 'recurring + expected', tone: 'neutral' },
      { label: 'MRR',               value: fmt.usdk(c.rev.mrr) + '/mo',  sub: fmt.pct(c.rev.recYr / (c.rev.totalYr || 1)) + ' of revenue', tone: 'good' },
      { label: 'Surge months over', value: monthsOver + ' / 12',        sub: 'P90 exceeds capacity', tone: monthsOver > 0 ? 'bad' : 'good' },
      { label: 'Recurring floor',   value: fmt.n(c.recurring[0]) + ' cases', sub: fmt.pct(c.recurring[0]/(c.capacity[0]||1)) + ' of capacity', tone: 'neutral' }
    ];
  },
  verdict(L, c, m) {
    const s = c.secondary[m], u = c.utilization[m];
    if (c.action[m] === 'over') {
      const short = c.upper[m] - c.capacity[m];
      return { tone: 'bad', headline: 'Add capacity — the surge exceeds you',
        detail: `${MONTHS[m]}: P90 surge is ${fmt.pct(s)} of capacity (expected only ${fmt.pct(u)}). ~${fmt.n(Math.max(0, short))} cases past capacity if deadlines cluster — on top of a ${fmt.n(c.recurring[m])}-case retainer floor.` };
    }
    if (c.action[m] === 'under') {
      return { tone: 'good', headline: 'Sell more — even the surge fits',
        detail: `${MONTHS[m]}: expected load ${fmt.pct(u)} and the surge still clears. Room for project intake above the recurring floor.` };
    }
    return { tone: 'warn', headline: 'Hold — watch the surge', detail: `${MONTHS[m]}: expected ${fmt.pct(u)}, surge ${fmt.pct(s)}. Matched, but the burst is close.` };
  },
  project(L, horizon) {
    horizon = horizon || 24;
    const c = this.compute(L);
    const cap = avg(c.capacity);
    const baseProj = avg(c.projectDemand);
    let clients = L.recClients;
    const o = { horizon, unit: 'cases', cap, months: [], clients: [], mrr: [], recurring: [], project: [], demand: [], utilization: [], revenue: [], hireMonth: null, upper: L.upper };
    for (let m = 1; m <= horizon; m++) {
      clients = Math.max(0, clients * (1 - L.churn / 100) + L.netNew);
      const mrr = clients * L.recFee;
      const recLoad = clients * L.recCases;
      const projLoad = baseProj * Math.pow(1 + L.projGrowth / 100, m / 12);
      const demand = recLoad + projLoad;
      const util = cap > 0 ? demand / cap : 0;
      const revenue = mrr + projLoad * (L.feePerCase / 6); // recognize project fee over ~6 mo
      if (util > L.upper / 100 && o.hireMonth === null) o.hireMonth = m;
      o.months.push(m); o.clients.push(clients); o.mrr.push(mrr);
      o.recurring.push(recLoad); o.project.push(projLoad); o.demand.push(demand);
      o.utilization.push(util); o.revenue.push(revenue);
    }
    return o;
  }
};

/* ===========================================================================
 * MODE 3 — NONPROFIT  (mission within means — no MRR/projection layer)
 * =========================================================================== */
const NONPROFIT = {
  key: 'nonprofit',
  vocab: {
    title: 'Nonprofit',
    lens: 'Success is people served, not profit — and you face two limits at once: how many you can deliver (staff + volunteers) and how many you can fund. The binding one sets the play.',
    unit: 'people', capacityName: 'Delivery capacity',
    under: 'Serve more', over: 'Grow capacity / Raise funds', match: 'Hold',
    pill: { under: 'Serve', match: 'Hold', over: 'Grow / Fund' },
    recNoun: '', projNoun: ''
  },
  base: { need: [180,185,190,200,210,215,220,225,220,215,210,205] },
  fields: [
    { key: 'staff',      label: 'Program staff (FTE)', min: 1,  max: 20, step: 1,   def: 5,    suffix: ' FTE' },
    { key: 'perStaff',   label: 'Served / staff · mo', min: 10, max: 60, step: 2,   def: 30,   suffix: '' },
    { key: 'volunteers', label: 'Volunteers (FTE-eq)', min: 0,  max: 20, step: 1,   def: 3,    suffix: '' },
    { key: 'budget',     label: 'Monthly program $',   min: 20000, max: 300000, step: 5000, def: 90000, prefix: '$' },
    { key: 'costPer',    label: 'Cost / beneficiary',  min: 100, max: 2000, step: 50, def: 450, prefix: '$' },
    { key: 'reserves',   label: 'Cash reserves',       min: 0, max: 1000000, step: 25000, def: 250000, prefix: '$' }
  ],
  compute(L) {
    const perVol = 0.4;
    const deliverCap = L.staff * L.perStaff + L.volunteers * (L.perStaff * perVol);
    const fundedCap  = L.costPer > 0 ? L.budget / L.costPer : 0;
    const capacity   = MONTHS.map(() => deliverCap);
    const committed  = this.base.need.map(n => Math.min(n, deliverCap, fundedCap));
    const upper      = this.base.need.slice();
    const likely     = upper.map((n, i) => Math.max(0, n - committed[i]));
    const utilization= committed.map(s => deliverCap > 0 ? s / deliverCap : 0);
    const secondary  = MONTHS.map(() => deliverCap > 0 ? fundedCap / deliverCap : 0);
    const action = this.base.need.map((n) => {
      const binding = Math.min(deliverCap, fundedCap);
      if (n > binding) return 'over';
      if (binding > n * 1.15) return 'under';
      return 'match';
    });
    return { unit: 'people', capacity, recurring: null, projectDemand: committed, committed, likely, upper, secondary, utilization, action, rev: null,
             _L: L, _deliverCap: deliverCap, _fundedCap: fundedCap };
  },
  metrics(L, c) {
    const unmet = sum(c.likely);
    const netBurn = L.budget - avg(c.committed) * L.costPer;
    const runway = netBurn >= 0 ? Infinity : L.reserves / -netBurn;
    return [
      { label: 'Unmet need (yr)',   value: fmt.n(unmet) + ' ppl', sub: unmet > 0 ? 'turned away / waitlisted' : 'all need met', tone: unmet > 0 ? 'bad' : 'good' },
      { label: 'Binding limit',     value: c._fundedCap < c._deliverCap ? 'Funding' : 'Delivery', sub: `deliver ${fmt.n(c._deliverCap)} · fund ${fmt.n(c._fundedCap)}`, tone: 'warn' },
      { label: 'Funding runway',    value: runway === Infinity ? 'Surplus' : fmt.n1(runway) + ' mo', sub: runway === Infinity ? 'budget covers service' : 'reserves at current draw', tone: runway !== Infinity && runway < 6 ? 'bad' : 'good' },
      { label: 'Cost / beneficiary',value: fmt.usd(L.costPer), sub: '82% to program', tone: 'neutral' }
    ];
  },
  verdict(L, c, m) {
    const need = c.upper[m], served = c.committed[m];
    if (c.action[m] === 'over') {
      const fundBinds = c._fundedCap < c._deliverCap;
      const gap = need - served;
      return { tone: 'bad',
        headline: fundBinds ? 'Raise funds — you can deliver more than you can pay for' : 'Grow capacity — more need than you can staff',
        detail: fundBinds
          ? `${MONTHS[m]}: ~${fmt.n(gap)} people unmet. Delivery could serve ${fmt.n(c._deliverCap)} but funding only covers ${fmt.n(c._fundedCap)}. Fund ${fmt.usd(gap * L.costPer)}/mo more to close it.`
          : `${MONTHS[m]}: ~${fmt.n(gap)} people unmet. Funding covers ${fmt.n(c._fundedCap)} but staff+volunteers only deliver ${fmt.n(c._deliverCap)}. Add ~${(gap / L.perStaff).toFixed(1)} staff-equivalents.` };
    }
    if (c.action[m] === 'under') {
      const slack = Math.min(c._deliverCap, c._fundedCap) - need;
      return { tone: 'good', headline: 'Serve more — outreach',
        detail: `${MONTHS[m]}: capacity and funding both clear the need with ~${fmt.n(Math.max(0, slack))} people of headroom.` };
    }
    return { tone: 'warn', headline: 'Hold — matched to need', detail: `${MONTHS[m]}: serving ${fmt.n(served)} of ${fmt.n(need)} — delivery and funding both near the need.` };
  }
};

const MODES = { product: PRODUCT, service: SERVICE, nonprofit: NONPROFIT };
const MODE_ORDER = ['product', 'service', 'nonprofit'];

if (typeof window !== 'undefined') window.CapacityAtlas = { MONTHS, MODES, MODE_ORDER, fmt };
if (typeof module !== 'undefined' && module.exports) module.exports = { MONTHS, MODES, MODE_ORDER, fmt };
