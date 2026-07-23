# Capacity Atlas

Three tools that answer one question — **when does this business run out of capacity, and what should it do about it?** — for three different kinds of business.

| # | Project | Folder | Form | Core idea |
|---|---------|--------|------|-----------|
| 1 | **Product & Manufacturing** | [`product-atlas/`](product-atlas/) | Web (HTML + JS engine) | You **control** the schedule. Deterministic Gantt: jobs have known start + duration; capacity is billable hours by skill. |
| 2 | **Service Businesses** | [`service-atlas/`](service-atlas/) | Web (single-file HTML) | You **don't control** the timeline. Probabilistic: cases move through stages with uncertain external waits; caseload + surge + hours. |
| 3 | **Capacity Atlas Lite** | [`lite/`](lite/) | Excel workbook | Growth-stage simplicity: revenue-based capacity, hiring triggers, comp-model profitability, cash timing. |

Open [`index.html`](index.html) for a hub that links all three.

## The shared decision

Every tool reduces to the same verdict, expressed in the language of each business:

- **SELL MORE** — you have slack; go fill it.
- **HOLD / MAINTAIN** — capacity is matched to demand.
- **HIRE / ADD CAPACITY** — you're over-committed; add people (or, in the service model, add admins or slow intake).

## Where each model diverges

The **product** model assumes *you* decide when work happens, so demand is a deterministic schedule of hours. The **service** model assumes an outside party (a regulator, a client's legal process, an insurer) sets the clock, so demand is a *probability distribution* and the real risk is **deadline clustering** (the P90 surge band), not average overload. The **Lite** model strips both down to a revenue ceiling per worker for a business that's still small enough not to need the full engine.

## Project status

- **Service Atlas** and **Lite** are complete, working tools (generalized / packaged from the versions built in development).
- **Product Atlas** ships with a complete, validated **core engine** (`product-atlas/capacity-engine.js`) and a starter UI. Its original full UI (the Peak Coatings build) was not recoverable from the working environment; the engine reproduces that model faithfully and the UI can be extended or the original re-imported. See [`product-atlas/README.md`](product-atlas/README.md).

## Conventions

- All web tools are **self-contained** and run by opening the HTML in a browser — no server, no build step. State persists in `localStorage`.
- Sample data in each tool is an illustrative example; replace it with your own.
