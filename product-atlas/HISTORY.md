# History & Decisions — Product & Manufacturing Atlas

The context to build from. Written so a fresh Claude Code session (or a new teammate) can pick up with the full "why."

## Lineage
This project began as **"Peak Industrial Coatings — Capacity Atlas v4.1"**, a full single-file HTML dashboard for a project-based coatings/sealants company. It was the *original* tool and the reference design for the whole family. The owner's intent: generalize it into a reusable tool for **product-based businesses and manufacturing**.

## What happened to the original
The original Peak HTML was uploaded into a working session but **never committed**, and the ephemeral environment was later recycled — so the original file was lost. Before that, its model was fully analyzed. This repo therefore ships a **faithful reconstruction of the engine** (`capacity-engine.js`) rather than a copy of the original UI. The math matches the original; the full original dashboard chrome (SVG charts, editable tables per tab, scenario-compare chips, JSON import/export, PDF export) was not reconstructed.

**To restore the full app:** either re-import the original Peak HTML if a copy resurfaces, or build a new dashboard UI on top of the engine (recommended — cleaner and already de-branded).

## Design decisions carried over from the original
- **Deterministic scheduling.** Jobs carry `startMo` + `duration`; remaining hours (`totalHrs − used`) spread evenly across the window. This is the defining assumption and the reason this tool is *separate* from the Service Atlas.
- **Constraint / bottleneck view.** A `skillFilter` lets you see capacity and demand through one binding resource (e.g. Fabrication) instead of aggregate hours — "where am I really bound?"
- **Pipeline weighting.** Opportunities count at `hours × win%`, so likely work pressures capacity proportionally.
- **Cash realism.** Progress billing (bill during the work), retainage (held to completion), and AR lag (invoice→cash) — because a healthy P&L can still starve for cash.
- **Scenarios** are named recipes = which what-if hires to include + timeline shifts to apply. Baseline is implicit.
- **Verdict thresholds:** `lowerBound` (below → SELL), `upperBound` (above → HIRE). Defaults 70 / 90.

## Reconstruction notes (validated)
The engine was run headless and produces a sane arc on the sample data: SELL in slow months, HIRE where committed+pipeline exceed the 90% ceiling, HOLD between; cash trough, backlog ~4.4 months "healthy", and customer-concentration flags the top customer above 25%. No NaNs.

## Open threads / next steps
1. Rebuild the full dashboard UI on the engine (charts + editable tables + scenario compare).
2. Decide whether to keep the coatings sample palette (green/orange) or fully neutralize branding.
3. Consider sharing a common core with the Service Atlas if the two ever merge — today they are deliberately separate engines.

## Family context
Two siblings came out of the same engagement: a **Service** Atlas (probabilistic, for businesses that don't control their timeline) and a **Lite** Excel tool (revenue-based, growth-stage). This product tool is the deterministic original of the three.
