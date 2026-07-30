# History & Decisions — Capacity Atlas Lite

The full "why," in the order it was decided, so anyone can build from here.

## Why it exists
The owner wanted a **simpler tool for the growth stage** alongside the full Atlas — 4–7 inputs, one page, quick capacity calls — without changing the full tool. It grew into a small suite as staffing and compensation questions stacked up.

## Evolution of the model

### 1. Started case-load simple
First cut: number of managers, max cases/manager, current open cases, new cases/month, lifespan, comfort ceiling → utilization, headroom, and a SELL/HOLD/ADD verdict with a 12-month projection.

### 2. Pivoted to REVENUE-based (David's model)
Per meeting: capacity should be a **revenue ceiling per case manager (~$1M/yr)**, with **case counts derived** from revenue ÷ average case value (**$7,000**), average lifespan **12 months**. David owns the model. Verdict states became **SELL MORE / MAINTAIN / ADD CAPACITY**. New-case goal **25/week** (3 reps + James at 6 follow-up calls/day). Trainees count **0.5 FTE**.

### 3. The critical reconciliation (calculated vs actual)
$1M ÷ $7,000 = **~143 cases/manager** — but David estimates a manager realistically carries **80–100 (≈90)**. At 90 × $7,000 = **$630K/manager, not $1M**. Decision:
- Treat $1M as **active book value at a point in time** (with a 12-month lifespan it equals annual throughput; the workbook shows both).
- Show **calculated (143) vs David's actual (90) side by side**, use the **binding (lower)** number everywhere, and **flag** that the base price can't hit $1M at 90 cases (fix: price to ~$11,111/case, add managers, or lower the target).
- Effect: utilization jumped from ~54% ("sell more") to ~86% ("add capacity"). This reversal was the whole point of the correction, and it propagates to every downstream tab.

### 4. Compensation analysis
Built a **Profitability** tab: annual run-rate P&L comparing the **old comp model vs a new growth-incentive model**, at the intake each one actually drives (old ~12/wk salary vs new ~25/wk incentivized). Commission = % of new signed case value; MG&A = fixed + % of revenue. Headline = **Δ net profit** with an accretive/dilutive verdict.

**James — New Comp** tab: a visual (David notes James responds to visuals) showing James's pay old (flat salary) vs new (base + commission) with the crossover point and his +$/yr at the 25/wk goal.

### 5. Cash timing + comp optimizer (follow-ups)
- **Cash Timing**: commission is paid up front on signings but fees collect over the lifespan — early months bank far less than the run-rate P&L implies. 18-month cash view, flags if cash goes negative.
- **Comp Optimizer**: solves for the **highest commission rate the firm can afford** (stay accretive vs old / hold a target margin), with sensitivity table + chart.

### 6. Org & hiring triggers (from the org chart)
From the David J Griggs CPA org chart (CEO David; Josh + a new Account Executive on sales; James as Case Director over 4 case managers at 80–100 accounts; Denise Ops + Vanessa Strategy/HR as advisory contractors; **no dedicated admin**). Built four triggers, four drivers: **case managers** (caseload), **admins** (case-manager count — and they lift CM capacity 90→130), **account executives** (intake), **case directors** (span). Live status flags + a 12-month staffing plan. At current numbers it flags: hire admins (0→2) and AEs (1→3) now.

## Data-hygiene / caveats to respect
- Time logs are **not trustworthy yet** (sub-1-minute entries). Enforce a **15-minute minimum increment tied to compensation** before trusting any hours-based metric.
- Known reporting quirks (footnote, not signal): one-day overlap between growth and sales reports from date defaults; a date-selector bug selecting two days at once.
- Inputs can be entered manually now or synced via OAuth from a CRM/task manager later.
- **All comp and overhead figures are placeholders** — the structure is right; the levels need David's actuals (MG&A/marketing and collection rate matter most).

## Ownership
David owns the capacity/comp model and its calculations going forward. Denise (First Class Operations) owns operations. Vanessa owns strategy/HR. Josh runs sales.
