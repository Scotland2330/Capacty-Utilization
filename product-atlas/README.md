# Capacity Atlas — Product & Manufacturing

For a project- or product-based business that **controls its own schedule**: fabrication shops, manufacturers, coatings/installation contractors, build-to-order production. Jobs have a known start month and duration; capacity is billable hours by production skill.

> **Origin note.** This is the generalized descendant of the original "Peak Coatings" Capacity Atlas. That original UI file was not recoverable from the working environment (uploads are ephemeral). What's here is the **faithfully reconstructed core engine** plus a starter UI. To restore the full original dashboard, either re-import the original HTML or extend the starter UI — the engine below already implements all its math.

## Files

| File | What it is |
|------|-----------|
| `capacity-engine.js` | **The engine.** Pure, dependency-free functions. No DOM, no I/O. This is the reusable core. |
| `index.html` | A starter dashboard that imports the engine and renders verdict, capacity-vs-demand, cash, backlog, and concentration. Open it in a browser. |

## The model

```
capacity(month)   = Σ employee hours + contractor hours + ramped new-hire hours   (optionally filtered to one skill)
committed(month)  = Σ won-job remaining hours / duration, over each job's active months
pipeline(month)   = Σ opportunity hours × win% / duration
utilization       = (committed + pipeline) / capacity
verdict           = HIRE if total-util > upperBound
                    SELL if committed-util < lowerBound
                    HOLD otherwise
```

Cash adds an **AR lag** (invoice → payment), **retainage** (held until completion), and **progress billing** (billed during the work). Backlog is months of committed work at current average capacity. Concentration flags any customer above a threshold share of the book.

## Core functions (`capacity-engine.js`)

| Function | Returns |
|----------|---------|
| `employeeMonthHours(emp, m, productiveHrs)` | billable hours one employee delivers in month `m`, net of PTO |
| `contractorMonthHours(c, m)` | contractor hours in month `m` within their engagement window |
| `hireMonthHours(h, m, productiveHrs)` | new-hire hours with a ramp (month 0 = `ramp`%, +25% month 1, 100% after) |
| `shiftedStartMo(job, scenario)` | a job's start month after a scenario's timeline shift |
| `compute(state, scenarioId, skillFilter)` | per-month capacity, committed, pipeline, utilization, sellable, overcommit, revenue, margin, and the SELL/HOLD/HIRE `action` |
| `computeCash(state, calc, scenarioId)` | 12-month billed / inflow / outflow / net / cumulative cash |
| `computeBacklog(state, calc)` | months of backlog + health (`thin` / `healthy` / `overloaded`) |
| `computeConcentration(state)` | customer share of committed value, with flags |
| `verdictFor(state, calc, month)` | `{ action, headline, detail }` for one month |
| `computeAll(state, skillFilter)` | baseline + every scenario, computed together |

Everything is a pure function of `state` (shape in `DEFAULT_DATA`). Swap the sample data for your own team, jobs, and pipeline.

## Usage

```js
import { DEFAULT_DATA, compute, computeCash, verdictFor } from './capacity-engine.js';

const state = structuredClone(DEFAULT_DATA);       // or your own data
const calc  = compute(state, 'baseline', 'none');  // whole shop
const cash  = computeCash(state, calc, 'baseline');
console.log(verdictFor(state, calc, /* May */ 4)); // { action:'HOLD', ... }
```

Or drop it in a `<script>` tag (no modules) and read the functions off `window.CapacityEngine`.

## Extending

- **Scenarios** are named recipes: which what-if hires to include + timeline shifts to apply. Add them to `state.scenarios` and pass the id to `compute`.
- **Constraint view:** pass a `skillFilter` (e.g. `'Fabrication'`) to see capacity/demand through your bottleneck resource only.
- The starter `index.html` is intentionally minimal — a faithful place to rebuild the full dashboard (charts, editable tables, scenario compare, PDF export) that the original had.
