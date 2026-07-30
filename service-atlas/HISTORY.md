# History & Decisions — Service Businesses Atlas

The context to build from.

## Origin
Commissioned as an adaptation of the product-based **Peak Coatings Capacity Atlas** for a **tax-resolution firm**, where the core problem is that **you don't control the timeline** — the IRS does. An Offer in Compromise can sit 6–24 months; a notice imposes a hard 30-day response window whenever it happens to arrive. That single fact broke the original tool's deterministic assumption and forced a different engine.

## The central reframe (the "why")
The product Atlas spreads a job's hours evenly across a start-plus-duration window *you* choose. A service firm can't: the external party's response time is a **probability distribution**, not a date. So:

| Product model (you control) | Service model (they control) |
|---|---|
| Fixed `startMo` + `duration`, even hours | Stage lifecycle with **min/expected/max** dwell per stage |
| Demand = deterministic schedule | Demand = **expected curve + P90 surge band** |
| Constraint = billable hours by skill | **Three** constraints: caseload, surge, hours |
| Pipeline = win% on bids | Consult close% + expected new-case inflow |
| Scenario lever = push a job's date | **Stretch the external party's processing time %** |
| Cash = progress billing + retainage | **Flat fee / retainer up front** → margin erodes as cases age |

## Key decisions
- **Surge is modeled in closed form** (normal-CDF stage occupancy + variance of deadline-driven "burst" stages), not Monte Carlo — fast, transparent, explainable. P90 is the default confidence.
- **Balanced constraints** were an explicit ask: model caseload, surge, and hours together and let the dashboard surface whichever binds ("Auto" view).
- **Billing supports both flat-fee and monthly-retainer** per case type (owner uses both).
- The demo data was tuned so the year shows a real SELL→HOLD→ADD arc and the surge band actually crosses capacity in peak months — otherwise the tool's whole point (surge binds before averages do) is invisible.

## Generalization intent
The owner ultimately wants this for **service businesses generally**, not just tax resolution. Done so far: neutral title/branding. Not yet done: relabel tax-specific sample data and "IRS" copy. The engine is already generic; only the example content is tax-flavored. Treat tax resolution as *one bundled example* of a service business with external timelines.

## Watch-outs carried from the meetings
- Time-tracking data isn't yet trustworthy (sub-minute entries); any hours-based metric should wait on a 15-minute-minimum policy tied to comp. (More relevant to the Lite tool, but noted.)
- Surge band is a **P90 estimate**, not a guarantee — good for planning, not a promise.

## Family context
Siblings: `capacity-atlas-product` (deterministic original) and `capacity-atlas-lite` (revenue-based Excel for the growth stage). Shared verdict language: SELL / HOLD / ADD CAPACITY.
