# Capacity Atlas

**One tool, three lenses.** A single web app that answers *"are we out of capacity, and what should we do about it?"* — and reframes the question by the outcome each kind of business optimizes for.

Open **[`index.html`](index.html)** in a browser (or host it — it's a static, dependency-free page) and switch modes:

| Mode | The lens | Binds on | Verdict language |
|------|----------|----------|------------------|
| **Product & Manufacturing** | You *control* the schedule — jobs have known dates + durations. | Billable **hours** vs. booked + weighted pipeline | Sell more · Hold · **Hire** |
| **Service Businesses** | An *outside party* sets the clock; demand arrives in bursts. | The **P90 surge**, not the average | Sell more · Hold · **Add capacity** |
| **Nonprofit** | Success is *people served*, not profit. | **Two** limits: what you can **deliver** and what you can **fund** | Serve more · **Grow capacity / Raise funds** |

Each mode has editable assumptions, a month-by-month capacity-vs-demand table, a verdict, signature KPIs, and a chart tuned to its lens. State saves to your browser (`localStorage`); **Reset this mode** restores the sample.

## Files

| File | What it is |
|------|-----------|
| `index.html` | The unified 3-mode app (UI). |
| `capacity-atlas.js` | The engine — a shared core plus one adapter per mode. Pure functions, no dependencies. Loads as a plain script (works via `file://` and when hosted) and also `require()`-able in Node for tests. |

## Architecture

Every mode is an adapter exposing `compute(levers)`, `metrics()`, and `verdict()`, all returning a **common calc shape** the UI renders generically. That's why one screen serves three very different businesses: the shared layer handles capacity/utilization/verdict; each adapter supplies the vocabulary, the demand model (deterministic hours / probabilistic surge / dual delivery-and-funding), and the signature metrics.

## Publishing it publicly

The app is static — no build, no server. To put it online with **GitHub Pages**:

1. Merge this branch to `main` (or set Pages to serve this branch).
2. Repo **Settings → Pages → Build and deployment → Source: Deploy from a branch**, pick the branch and `/ (root)`.
3. Make the repo **public** if you want it openly accessible (Settings → General → Danger Zone → Change visibility).

It'll serve at `https://scotland2330.github.io/<repo>/`. Because the engine loads as a classic `<script>` (not an ES module), it also works by simply double-clicking `index.html` locally.

## Also in this repo (deeper builds & history)

The unified tool above is the quick 3-lens view. The folders hold the fuller standalone versions and the growth-stage spreadsheet, each with its own `CLAUDE.md` + `HISTORY.md`:

- [`product-atlas/`](product-atlas/) — full deterministic engine (`capacity-engine.js`) + starter dashboard.
- [`service-atlas/`](service-atlas/) — the complete probabilistic (tax-resolution-derived) tool.
- [`lite/`](lite/) — **Capacity Atlas Lite**, the Excel suite (capacity, org & hiring, comp profitability, cash timing, comp optimizer).
