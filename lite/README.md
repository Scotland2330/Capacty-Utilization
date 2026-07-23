# Capacity Atlas Lite

A growth-stage workbook — the simple version for a business that isn't ready for the full Atlas. One decision, a handful of inputs, and the staffing/comp math that follows from it. Open **`Capacity-Lite.xlsx`** in Excel, Google Sheets, or Numbers. Every output is a live formula; edit the coloured input cells and everything recalculates.

**Cell colours:** 🟡 yellow = your data · 🔵 blue = model definitions · 🟠 gold = key results.

## Tabs

| Tab | What it answers |
|-----|-----------------|
| **Capacity Lite** | Revenue-based capacity. Reconciles the *calculated* cases-per-manager (revenue ÷ case value) against the owner's *actual* operational estimate, uses the **binding (lower)** one, and flags when the base price can't reach the revenue target. Verdict: **SELL MORE / MAINTAIN / ADD CAPACITY**, plus a 12-month projection. |
| **Org & Hiring** | When to add each kind of human. Four triggers, four drivers: **case managers** (caseload), **admins** (which also *lift* manager capacity), **account executives** (intake), **case directors** (span of control). Live status flags + a 12-month staffing plan. |
| **Profitability** | Annual run-rate P&L comparing the **old vs new compensation model** at the intake each one actually drives. Commission payouts + MG&A overhead → the bottom-line impact of switching. |
| **James — New Comp** | The change-management visual: James's pay under old (flat salary) vs new (base + growth commission), with the crossover point. Built to show *why the new model benefits him*. |
| **Cash Timing** | Commission is paid up front on signings, but fees collect over the engagement's life. 18-month cash view showing the ramp gap and whether cash goes negative. |
| **Comp Optimizer** | Solves for the **highest commission rate the firm can afford** while staying profitable / holding a margin floor, with a sensitivity table and chart. |

## How the tabs connect

`Capacity Lite` is the source of truth for the drivers (case value, lifespan, binding cases-per-manager, open cases, intake). `Org & Hiring`, `Profitability`, `Cash Timing`, and `Comp Optimizer` all link back to it, so changing one input flows through every tab.

## Note on the numbers

The comp and overhead figures are **placeholders** — the structure is right, the levels need real inputs (marketing/lead-gen in MG&A and the collection rate move the results most). The capacity ratios (cases per manager, per admin, AE throughput, management span) are likewise starting estimates to replace with actuals.
