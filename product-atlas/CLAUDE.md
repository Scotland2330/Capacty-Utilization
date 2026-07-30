# CLAUDE.md — Capacity Atlas: Product & Manufacturing

Project memory for Claude Code. Read this first.

## What this is
A capacity-planning tool for a business that **controls its own schedule** — fabrication, manufacturing, coatings/installation, build-to-order. The question it answers every month: **do we have the capacity for our booked + likely work, and should we SELL more, HOLD, or HIRE?**

This is the **deterministic** half of the Capacity Atlas family (the Service Atlas is the probabilistic half — see that repo). Here, jobs have a known start month and duration, and hours spread evenly across that window.

## Architecture
- `capacity-engine.js` — **the core.** Pure, dependency-free functions. No DOM, no I/O. Everything is a pure function of a `state` object (shape in `DEFAULT_DATA`). This is the reusable heart; treat it as the source of truth.
- `index.html` — a **starter UI** that imports the engine and renders verdict, capacity-vs-demand grid, cash, backlog, and concentration. Open in a browser; no build step. Intentionally minimal — the place to rebuild the full dashboard.

## The model
```
capacity(m)    = Σ employee + contractor + ramped-hire hours   (optionally one skill)
committed(m)   = Σ won-job remaining hours / duration
pipeline(m)    = Σ opportunity hours × win% / duration
utilization    = (committed + pipeline) / capacity
verdict        = HIRE if total-util > upperBound; SELL if committed-util < lowerBound; else HOLD
```
Cash = progress billing + retainage + AR lag. Backlog = months of committed work at avg capacity. Concentration flags any customer over a threshold.

## Key functions (all in `capacity-engine.js`)
`compute(state, scenarioId, skillFilter)` · `computeCash` · `computeBacklog` · `computeConcentration` · `verdictFor` · `computeAll` · hour primitives `employeeMonthHours` / `contractorMonthHours` / `hireMonthHours` · `shiftedStartMo`.

## Conventions
- Self-contained, runs by opening HTML. No server, no framework, no build.
- Vanilla JS (ES modules). Keep the engine dependency-free and pure.
- 12-month horizon; month index 0 = January.
- Match the surrounding code style. Keep sample data realistic but illustrative.

## Status / next steps
- Engine is complete and validated (see `HISTORY.md`). The full original dashboard UI (charts, editable tables, scenario compare, PDF export) is **not** in this repo — the starter UI is a faithful base to rebuild it on, or import the original.
- When extending: build UI on top of the engine; don't fork the math into the view layer.

## Related
Sibling projects: `capacity-atlas-service` (probabilistic services) and `capacity-atlas-lite` (Excel growth-stage tool). Shared verdict language: SELL / HOLD / HIRE.
