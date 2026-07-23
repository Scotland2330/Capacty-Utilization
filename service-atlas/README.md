# Capacity Atlas — Service Businesses

For a service business that **does not control its own timeline** — where an outside party (a regulator, a court, an insurer, a client's approval chain, a lab) sets the pace. Work sits waiting, then arrives in bursts with hard deadlines. Capacity planning here is about **case-load, deadline surges, and hours**, not a schedule you draw.

> Generalized from the tax-resolution build. The bundled sample data models a tax-resolution firm (the IRS is the uncontrolled party) because it's a vivid worked example — but the engine fits any service business with external timeline dependencies. Swap the case types and stages for your own.

## Run it

Open `index.html` in a browser. Self-contained, no build step; state saves to `localStorage`. Use **Reset** to restore the sample.

## Why it's different from the Product Atlas

The product model spreads a job's hours evenly across a start-plus-duration window *you* choose. A service business can't do that — the external party's response time is a **probability distribution**, not a date. So every engagement walks a **stage lifecycle** (intake → your work → waiting on the external party → response burst → resolution), each stage carrying effort hours, who's working (you vs. waiting), and a **min / expected / max** dwell time.

From that the engine derives two things a deterministic model can't:

- **Expected demand** as a smooth probability curve, plus a **P90 "surge band"** — the bad-luck case where external responses cluster and deadlines collide. The real risk isn't average overload; it's the surge.
- **Three balanced constraints**, surfaced per month with an **Auto** view that flags whichever binds:
  - **Case-load** — open cases vs. how many a worker can actively carry.
  - **Surge** — P90 hours vs. capacity.
  - **Hours** — expected hours vs. capacity.

Billing is **flat-fee or monthly-retainer** per service line (decoupled from delivery time), with a realized-$/hour row that shows margin eroding as engagements age.

## Tabs

`Dashboard` · `Assumptions` · `Team & Capacity` · `Case Types & Stages` (the engine) · `Active Caseload` · `Intake Pipeline` · `External-Timeline & Intake Scenarios` · `Guide`.

## Making it your own

1. **Case Types & Stages** — rename to your service lines; set each stage's hours, actor (you vs. external wait), and min/expected/max months. Wide spreads on the waiting stages are what create surge risk.
2. **Billing** — flat fee (collected over N months) or monthly retainer, per service line.
3. **Team, Caseload, Pipeline** — your people, current open engagements, and expected new intake.
4. **Scenarios** — stretch external processing time, scale intake, or add capacity, then overlay on the dashboard.

A low-fidelity layout wireframe lives at [`../docs/service-atlas-wireframe.svg`](../docs/service-atlas-wireframe.svg).
