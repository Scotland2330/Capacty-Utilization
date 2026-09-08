/*
 * ============================================================================
 * CAPACITY ATLAS — UNIFIED ENGINE  ·  Product · Service · Nonprofit
 * ============================================================================
 * ONE tool, three lenses. Every business asks the same question — "are we out
 * of capacity, and what do we do about it?" — but a product shop, a service
 * firm, and a nonprofit answer it against different outcomes:
 *
 *   Product    you CONTROL the schedule → hours vs. booked+likely work
 *   Service    an OUTSIDE party sets the clock → plan for the SURGE, not average
 *   Nonprofit  mission within means → TWO limits: what you can DELIVER and FUND
 *
 * Each mode is an adapter that turns a few editable levers + a realistic 12-month
 * base into a COMMON calc shape the UI renders. Pure functions, no DOM, no deps.
 *
 * Common calc shape returned by every mode.compute(levers):
 *   { unit, capacity[12], committed[12], likely[12], upper[12],
 *     secondary[12]|null, utilization[12], action[12] }
 *   action ∈ 'under' (do more) | 'match' (hold) | 'over' (constrained)
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
 * You control the schedule. Capacity = billable hours; demand = booked jobs
 * (100%) + pipeline weighted by win%. Bind on hours; verdict Sell/Hold/Hire.
 * =========================================================================== */
const PRODUCT = {
  key: 'product',
  vocab: {
    title: 'Product & Manufacturing',
    lens: 'You control the schedule — jobs have known start dates and durations. Capacity is billable hours; the risk is booking past what your team can deliver.',
    unit: 'hrs',
    under: 'Sell more', over: 'Hire', match: 'Hold',
    pill: { under: 'Sell', match: 'Hold', over: 'Hire' },
    demandName: 'Booked + pipeline', capacityName: 'Team capacity'
  },
  // Realistic seasonal base (busy spring/summer, December PTO dip).
  base: {
    capacity:  [820,820,940,900,900,860,860,820,780,820,820,600],
    committed: [560,600,820,860,640,300,300,120, 80, 60, 40, 20],
    pipeline:  [120,180,260,300,320,280,260,220,180,160,140,120]
  },
  fields: [
    { key: 'extraFTE',  label: 'Add / remove FTE',   min: -3, max: 6, step: 0.5, def: 0,   suffix: ' FTE' },
    { key: 'winPct',    label: 'Pipeline win rate',  min: 0,  max: 100, step: 5, def: 60,  suffix: '%' },
    { key: 'rate',      label: 'Billing rate',       min: 80, max: 300, step: 5, def: 150, prefix: '$', suffix: '/hr' },
    { key: 'cost',      label: 'Loaded cost',        min: 30, max: 150, step: 5, def: 65,  prefix: '$', suffix: '/hr' },
    { key: 'upper',     label: 'Hire above',         min: 70, max: 100, step: 1, def: 90,  suffix: '%' },
    { key: 'lower',     label: 'Sell below',         min: 40, max: 85, step: 1,  def: 70,  suffix: '%' }
  ],
  compute(L) {
    const perFTE = 150; // billable hrs/mo one FTE adds
    const capacity  = this.base.capacity.map(h => h + L.extraFTE * perFTE);
    const committed = this.base.committed.slice();
    const likely    = this.base.pipeline.map(h => h * (L.winPct / 100));
    const upper     = committed.map((c, i) => c + likely[i]);
    const utilization = upper.map((u, i) => capacity[i] > 0 ? u / capacity[i] : 0);
    const committedUtil = committed.map((c, i) => capacity[i] > 0 ? c / capacity[i] : 0);
    const action = utilization.map((u, i) =>
      u > L.upper / 100 ? 'over' : (committedUtil[i] < L.lower / 100 ? 'under' : 'match'));
    return { unit: 'hrs', capacity, committed, likely, upper, secondary: null, utilization, action, _L: L };
  },
  metrics(L, c) {
    const backlog = sum(c.committed) / (avg(c.capacity) || 1);
    const forecastRev = sum(c.upper) * L.rate;
    const cost = sum(c.upper) * L.cost;
    const sellable = c.capacity.map((cap, i) => Math.max(0, cap * L.upper / 100 - c.upper[i]));
    return [
      { label: 'Avg utilization',   value: fmt.pct(avg(c.utilization)), sub: 'booked + pipeline', tone: 'neutral' },
      { label: 'Backlog',           value: fmt.n1(backlog) + ' mo',     sub: backlog < 4 ? 'thin' : backlog > 6 ? 'overloaded' : 'healthy', tone: backlog < 4 || backlog > 6 ? 'warn' : 'good' },
      { label: 'Gross margin (yr)', value: fmt.usdk(forecastRev - cost),sub: fmt.pct((forecastRev - cost) / (forecastRev || 1)) + ' margin', tone: 'good' },
      { label: 'Sellable capacity', value: fmt.usdk(sum(sellable) * L.rate), sub: fmt.n(sum(sellable)) + ' open hrs/yr', tone: 'neutral' }
    ];
  },
  verdict(L, c, m) {
    const u = c.utilization[m];
    if (c.action[m] === 'over') {
      const over = c.upper[m] - c.capacity[m] * L.upper / 100;
      return { tone: 'bad', headline: 'Hire — you\'re over-committed',
        detail: `${MONTHS[m]} demand is ${fmt.pct(u)} of capacity. About ${fmt.n(Math.max(0, over))} hrs (~${(Math.max(0,over)/150).toFixed(1)} FTE) beyond the ${L.upper}% ceiling.` };
    }
    if (c.action[m] === 'under') {
      const open = Math.max(0, c.capacity[m] * L.upper / 100 - c.upper[m]);
      return { tone: 'good', headline: 'Sell more — capacity is open',
        detail: `${MONTHS[m]} booked work is below ${L.lower}%. ~${fmt.n(open)} sellable hrs ≈ ${fmt.usd(open * L.rate)} of capacity to fill.` };
    }
    return { tone: 'warn', headline: 'Hold — well matched', detail: `${MONTHS[m]} capacity is matched to demand at ${fmt.pct(u)} utilization.` };
  }
};

/* ===========================================================================
 * MODE 2 — SERVICE  (probabilistic)
 * You do NOT control the timeline — an outside party (regulator, court,
 * insurer, client approval) sets the pace. Demand is a distribution; the risk
 * is DEADLINE CLUSTERING. Bind on the P90 surge, not the average.
 * =========================================================================== */
const SERVICE = {
  key: 'service',
  vocab: {
    title: 'Service Businesses',
    lens: 'An outside party sets the clock, so demand arrives in bursts. The average rarely overloads you — the surge does. Capacity is planned against the P90 (bad-luck) case.',
    unit: 'cases',
    under: 'Sell more', over: 'Add capacity', match: 'Hold',
    pill: { under: 'Sell', match: 'Hold', over: 'Add cap' },
    demandName: 'Active caseload', capacityName: 'Team caseload capacity'
  },
  base: {
    // Expected active cases, and a per-month surge multiplier: deadline
    // clustering peaks near the Apr & Oct filing/response crunches.
    expected:  [300,320,360,380,300,260,280,340,360,300,280,260],
    surgeMult: [1.15,1.20,1.35,1.50,1.25,1.10,1.15,1.30,1.45,1.50,1.25,1.15]
  },
  fields: [
    { key: 'workers',   label: 'Case workers',        min: 1,  max: 12, step: 1,  def: 4,   suffix: ' ppl' },
    { key: 'perWorker', label: 'Cases / worker',      min: 40, max: 130, step: 5, def: 90,  suffix: '' },
    { key: 'intakeMult',label: 'Intake vs plan',      min: 50, max: 200, step: 5, def: 100, suffix: '%' },
    { key: 'delay',     label: 'External-delay stretch', min: 80, max: 200, step: 5, def: 100, suffix: '%' },
    { key: 'feePerCase',label: 'Fee / case',          min: 1500, max: 12000, step: 250, def: 5000, prefix: '$' },
    { key: 'upper',     label: 'Add above',           min: 70, max: 100, step: 1, def: 90,  suffix: '%' }
  ],
  compute(L) {
    const capHrs = L.workers * L.perWorker;
    const capacity  = MONTHS.map(() => capHrs);
    const committed = this.base.expected.map(e => e * (L.intakeMult / 100));           // expected caseload
    // Surge band = expected × surge multiplier, further stretched by external delay.
    const upper     = committed.map((e, i) => e * (1 + (this.base.surgeMult[i] - 1) * (L.delay / 100)));
    const likely    = upper.map((u, i) => Math.max(0, u - committed[i]));               // surge headroom band
    const utilization = committed.map((e, i) => capacity[i] > 0 ? e / capacity[i] : 0); // expected util
    const secondary   = upper.map((u, i) => capacity[i] > 0 ? u / capacity[i] : 0);     // SURGE util (the binding one)
    const action = secondary.map((s, i) =>
      s > 1 ? 'over' : (utilization[i] < (L.upper - 25) / 100 ? 'under' : 'match'));
    return { unit: 'cases', capacity, committed, likely, upper, secondary, utilization, action, _L: L };
  },
  metrics(L, c) {
    const monthsOver = c.secondary.filter(s => s > 1).length;
    const worstHead = Math.min(...c.capacity.map((cap, i) => cap - c.upper[i]));
    return [
      { label: 'Avg caseload util',  value: fmt.pct(avg(c.utilization)), sub: 'on expected demand', tone: 'neutral' },
      { label: 'Surge months over',  value: monthsOver + ' / 12',        sub: 'P90 exceeds capacity', tone: monthsOver > 0 ? 'bad' : 'good' },
      { label: 'Worst surge headroom', value: fmt.n(worstHead) + ' cases', sub: worstHead < 0 ? 'short at peak' : 'spare at peak', tone: worstHead < 0 ? 'bad' : 'good' },
      { label: 'Active book value',  value: fmt.usdk(avg(c.committed) * L.feePerCase), sub: 'avg caseload × fee', tone: 'neutral' }
    ];
  },
  verdict(L, c, m) {
    const s = c.secondary[m], u = c.utilization[m];
    if (c.action[m] === 'over') {
      const short = c.upper[m] - c.capacity[m];
      return { tone: 'bad', headline: 'Add capacity — the surge exceeds you',
        detail: `In ${MONTHS[m]} the P90 surge is ${fmt.pct(s)} of capacity (expected only ${fmt.pct(u)}). ~${fmt.n(Math.max(0, short))} cases beyond capacity if deadlines cluster.` };
    }
    if (c.action[m] === 'under') {
      return { tone: 'good', headline: 'Sell more — even the surge fits',
        detail: `In ${MONTHS[m]} expected load is ${fmt.pct(u)} and the surge still clears. Room to take on intake.` };
    }
    return { tone: 'warn', headline: 'Hold — watch the surge', detail: `${MONTHS[m]} expected ${fmt.pct(u)}, surge ${fmt.pct(s)}. Matched, but the burst is close.` };
  }
};

/* ===========================================================================
 * MODE 3 — NONPROFIT  (mission within means)
 * The outcome isn't profit — it's people served. TWO ceilings at once:
 *   delivery capacity (staff + volunteers) AND funded capacity (budget ÷ cost).
 * Served = min(need, deliver, fund). Verdict names the BINDING limit:
 *   Serve more · Grow capacity (staff) · Raise funds (money).
 * =========================================================================== */
const NONPROFIT = {
  key: 'nonprofit',
  vocab: {
    title: 'Nonprofit',
    lens: 'Success is people served, not profit — and you face two limits at once: how many you can deliver (staff + volunteers) and how many you can fund. The binding one sets the play.',
    unit: 'people',
    under: 'Serve more', over: 'Grow capacity / Raise funds', match: 'Hold',
    pill: { under: 'Serve', match: 'Hold', over: 'Grow / Fund' },
    demandName: 'Need (people seeking service)', capacityName: 'Delivery capacity'
  },
  base: {
    need: [180,185,190,200,210,215,220,225,220,215,210,205] // beneficiaries seeking service / month (rising)
  },
  fields: [
    { key: 'staff',      label: 'Program staff (FTE)', min: 1,  max: 20, step: 1,   def: 5,    suffix: ' FTE' },
    { key: 'perStaff',   label: 'Served / staff · mo', min: 10, max: 60, step: 2,   def: 30,   suffix: '' },
    { key: 'volunteers', label: 'Volunteers (FTE-eq)', min: 0,  max: 20, step: 1,   def: 3,    suffix: '' },
    { key: 'budget',     label: 'Monthly program $',   min: 20000, max: 300000, step: 5000, def: 90000, prefix: '$' },
    { key: 'costPer',    label: 'Cost / beneficiary',  min: 100, max: 2000, step: 50, def: 450, prefix: '$' },
    { key: 'reserves',   label: 'Cash reserves',       min: 0, max: 1000000, step: 25000, def: 250000, prefix: '$' }
  ],
  compute(L) {
    const perVol = 0.4; // a volunteer FTE-equivalent serves 40% of a staff load
    const deliverCap = L.staff * L.perStaff + L.volunteers * (L.perStaff * perVol);
    const fundedCap  = L.costPer > 0 ? L.budget / L.costPer : 0;
    const capacity   = MONTHS.map(() => deliverCap);                 // primary = delivery
    const committed  = this.base.need.map(n => Math.min(n, deliverCap, fundedCap)); // actually served
    const upper      = this.base.need.slice();                        // the need (demand)
    const likely     = upper.map((n, i) => Math.max(0, n - committed[i])); // UNMET need band
    const utilization= committed.map(s => deliverCap > 0 ? s / deliverCap : 0);      // delivery util
    const secondary  = MONTHS.map(() => deliverCap > 0 ? fundedCap / deliverCap : 0);// funding coverage of delivery
    const action = this.base.need.map((n, i) => {
      const binding = Math.min(deliverCap, fundedCap);
      if (n > binding) return 'over';                    // unmet need — constrained
      if (binding > n * 1.15) return 'under';            // slack on both — outreach
      return 'match';
    });
    return { unit: 'people', capacity, committed, likely, upper, secondary, utilization, action,
             _L: L, _deliverCap: deliverCap, _fundedCap: fundedCap };
  },
  metrics(L, c) {
    const unmet = sum(c.likely);
    const netBurn = L.budget - avg(c.committed) * L.costPer; // >0 = surplus, <0 = drawdown
    const runway = netBurn >= 0 ? Infinity : L.reserves / -netBurn;
    const progEff = 0.82; // illustrative program-expense ratio
    return [
      { label: 'Unmet need (yr)',   value: fmt.n(unmet) + ' ppl', sub: unmet > 0 ? 'turned away / waitlisted' : 'all need met', tone: unmet > 0 ? 'bad' : 'good' },
      { label: 'Binding limit',     value: c._fundedCap < c._deliverCap ? 'Funding' : 'Delivery', sub: `deliver ${fmt.n(c._deliverCap)} · fund ${fmt.n(c._fundedCap)}`, tone: 'warn' },
      { label: 'Funding runway',    value: runway === Infinity ? 'Surplus' : fmt.n1(runway) + ' mo', sub: runway === Infinity ? 'budget covers service' : 'reserves at current draw', tone: runway !== Infinity && runway < 6 ? 'bad' : 'good' },
      { label: 'Cost / beneficiary',value: fmt.usd(L.costPer), sub: fmt.pct(progEff) + ' to program', tone: 'neutral' }
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
        detail: `${MONTHS[m]}: capacity and funding both clear the need with ~${fmt.n(Math.max(0, slack))} people of headroom. Room to reach more of the community.` };
    }
    return { tone: 'warn', headline: 'Hold — matched to need', detail: `${MONTHS[m]}: serving ${fmt.n(served)} of ${fmt.n(need)} — delivery and funding are both near the need.` };
  }
};

const MODES = { product: PRODUCT, service: SERVICE, nonprofit: NONPROFIT };
const MODE_ORDER = ['product', 'service', 'nonprofit'];

// Non-module global (drop-in <script>).
if (typeof window !== 'undefined') window.CapacityAtlas = { MONTHS, MODES, MODE_ORDER, fmt };
if (typeof module !== 'undefined' && module.exports) module.exports = { MONTHS, MODES, MODE_ORDER, fmt };
