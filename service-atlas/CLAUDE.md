# CLAUDE.md — Capacity Atlas: Service Businesses

Project memory for Claude Code. Read this first.

## What this is
A capacity-planning tool for a service business that **does NOT control its own timeline** — where an outside party (a regulator, a court, an insurer, a client's approval chain, a lab) sets the pace. Work waits, then arrives in bursts with hard deadlines. It answers: **can we take on more work, given expected load AND the risk that externally-driven deadlines cluster into a surge we can't staff?**

This is the **probabilistic** half of the Capacity Atlas family. The sibling `capacity-atlas-product` is the deterministic half (you control the schedule); do not merge their engines without intent.

## Run it
Open `index.html` in a browser. Single self-contained file, no build step, state in `localStorage`. **Reset** restores the sample.

## The model (this is the important part)
Instead of fixed start+duration, every engagement walks a **stage lifecycle**. Each stage has: effort hours, an **actor** (`firm` = you working, or `irs`/external = waiting), and a **min / expected / max** dwell in months. From that the engine derives, in closed form (normal-CDF stage-occupancy — no Monte Carlo):
- **Expected demand** per month (smooth), plus a **P90 surge band** — the bad-luck case where external responses cluster. *The surge, not the average, is the real risk.*
- **Three constraints**, with an **Auto** view flagging whichever binds each month:
  - **Case-load** — active cases vs. how many a worker can carry.
  - **Surge** — P90 hours vs. capacity.
  - **Hours** — expected hours vs. capacity.
- Billing is **flat-fee or monthly-retainer** per service line (decoupled from delivery time); a realized-$/hour row shows margin eroding as engagements age.

Key JS: `projectCase()` (walks one case's stages into monthly expected hours + surge variance via `normCdf`/`erf`), `compute()`, the verdict logic, and the render/scenario code. All in the single HTML file's `<script>`.

## Generalization status
Built originally for **tax resolution** (the IRS is the uncontrolled party). Header/title are rebranded to generic "Service Capacity Atlas," but the **sample data and some in-app copy still reference tax-resolution specifics** (case types like OIC, "IRS", etc.) as the worked example. To fully generalize: relabel the sample case types/stages and swap "IRS" → "external party / dependency" in tooltips and subtitles. The engine itself is already domain-agnostic — any service with external timeline dependencies fits.

## Conventions
- Self-contained single HTML, vanilla JS, no framework/build. 12-month horizon.
- Keep the probabilistic engine intact; the surge band is the differentiating feature.
- Match surrounding style; keep sample data realistic.

## Next steps
1. Full de-tax generalization pass (labels + sample data) if a neutral template is wanted.
2. Optionally add other service verticals as selectable sample datasets (legal, insurance claims, immigration, medical billing).
3. `docs/service-atlas-wireframe.svg` is a low-fidelity layout reference.
