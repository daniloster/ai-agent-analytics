# Wireframe 04 - Billing & Financial (Section 4)

**KPIs:** KPI-36 through KPI-49 (cross-cutting quality block included)
**Audience:** Billing Admin, Finance, CTO at renewal
**Query:** GET /api/analytics/billing

---

## Full Section Layout

```
▐ Billing & Financial                              Jun 1 - Jun 30, 2026 · All Teams
────────────────────────────────────────────────────────────────────────────────────

ROW 1 - Budget Status (4 KPI cards)
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│ Month-to-Date    [?]│ │ Projected Month  [?]│ │ Budget Utilization[?]│ │ Projected Annual [?]│
│ Spend               │ │ End                 │ │                     │ │ Spend               │
│ $9,800              │ │ $11,308             │ │ 65.3%               │ │ $157,300            │
│ Day 26 of 30        │ │ at current burn     │ │ [██████████░░░░░░]  │ │ based on 90d avg    │
│ [● green]           │ │ [● green < budget]  │ │ of $15,000 budget   │ │                     │
│ ▁▂▃▄▅▆▇▇▇▇          │ │ [$11,308 < $15,000] │ │ 4 days remaining    │ │ ↑ +14% vs last year │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘ └─────────────────────┘

ROW 2 - Budget Chart (full width)
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ Month-to-Date Spend vs Budget                                                    [?] │
│ Actual spend, projected trajectory, and monthly budget ceiling                       │
│                                                                                      │
│ $15K ┤ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ← BUDGET LINE  │
│ $12K ┤                                                  ╭╌╌╌╌╌╌╌╌╌╌ ← Projected    │
│ $11K ┤                                            ╭────╯  $11,308    (dashed)       │
│  $9K ┤                              ╭─────────────╯  ← today                        │
│  $6K ┤                  ╭───────────╯                                               │
│  $3K ┤       ╭──────────╯                                                           │
│   $0 └────────────────────────────────────────────────────────────────────────      │
│       Jun 1   Jun 5   Jun 10   Jun 15   Jun 20   Jun 25   Jun 30                   │
│       ↑ today (Jun 26)                                                               │
│  ━━ Actual spend   ╌╌ Projected (dashed past today)   ── Budget ceiling             │
│  Annotation: "On track - 4.7 days until month end, $5,200 headroom"                 │
└──────────────────────────────────────────────────────────────────────────────────────┘

ROW 3 - Invoice History + Cost Allocation
┌────────────────────────────────────────┐ ┌────────────────────────────────────────┐
│ Invoice History (last 6 months)    [?] │ │ Cost Allocation by Team            [?] │
│ Monthly totals with trend line         │ │ Jun 2026 · for chargeback              │
│                                        │ │                                        │
│ $15K ┤          ━━━━━━━━━━━━━━━ trend  │ │     ╭────────────────╮                 │
│ $12K ┤                     ████        │ │    ╱  Platform 28.9%  ╲                │
│ $10K ┤          ████  ████ ████        │ │   │  Frontend 16.2%   │                │
│  $8K ┤  ████   ████  ████ ████         │ │   │  Backend  19.7%   │                │
│  $6K ┤  ████   ████  ████ ████         │ │   │  Data      8.5%   │                │
│  $0  └──────────────────────────       │ │    ╲ Other    26.7%  ╱                 │
│       Jan  Feb  Mar  Apr  May  Jun     │ │     ╰────────────────╯                 │
│  ▓▓ Monthly invoice   ── Trend line   │ │  ■ Platform $4,100   ■ Backend $2,800  │
│                                        │ │  ■ Frontend $2,300   ■ Data   $1,200  │
└────────────────────────────────────────┘ └────────────────────────────────────────┘

ROW 4 - Chargeback Table (full width)
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ Cost Allocation Detail - June 2026 (for chargeback to cost centers)              [?] │
│ ────────────────────────────────────────────────────────────────────────────────     │
│ Team          Seat Cost (prorated)   Token Cost   Total     % of Org   MoM           │
│ Platform      $625 (12/120 seats)    $3,475        $4,100    28.9%     +8.2%         │
│ Backend       $938 (18/120 seats)    $1,862        $2,800    19.7%    +12.1%         │
│ Frontend      $729 (14/120 seats)    $1,571        $2,300    16.2%     -4.8%         │
│ Data          $417  (8/120 seats)      $783        $1,200     8.5%    +34.0% [red]   │
│ Unattributed  --                     $3,800        $3,800    26.7%     --            │
│ ────────────────────────────────────────────────────────────────────────────────     │
│ TOTAL         $2,709                 $11,491       $14,200   100.0%    +12.0%        │
│                                                                                      │
│ Seat cost prorated by team headcount as fraction of total licensed seats (120).      │
└──────────────────────────────────────────────────────────────────────────────────────┘

ROW 5 - Unit Economics + Cost Anomaly Calendar
┌────────────────────────────────────────┐ ┌────────────────────────────────────────┐
│ Unit Cost Metrics                  [?] │ │ Cost Anomaly Calendar - June       [?] │
│                                        │ │ Days where spend > 2x daily average    │
│ Cost / Successful Run               │ │                                        │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━     │ │  1  2  3  4  5  6  7  8  9 10 11 12  │
│ $1.15  ↓ -8% MoM [green]           │ │  ■  ■  ■  ■  ■  ■  ■  ■  ■  ■  ■  ▓  │
│                                        │ │ 13 14 15 16 17 18 19 20 21 22 23 24  │
│ Cost of Failed Runs                    │ │  ■  ■  ■  ■  ■  ■  ▓  ■  ■  ■  ■  ■  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━     │ │ 25 26                                  │
│ $680 (4.8%)  ↑ +$120 [amber]       │ │  ■  ■                                  │
│                                        │ │                                        │
│ Token Rate Efficiency                  │ │  ■ Normal   ▓ Anomaly (>2x avg)       │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━     │ │                                        │
│ $3.00/1M actual vs $4.00/1M list   │ │  Jun 12: $1,100 (avg: $430) [red]     │
│ 25% discount realized [green]       │ │  Jun 19: $890  (avg: $430) [amber]    │
└────────────────────────────────────────┘ └────────────────────────────────────────┘

ROW 6 - Cross-Cutting Quality Block
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│ Quality-Cost     [?]│ │ Churn Risk Count [?]│ │ New User Cost to [?]│
│ Efficiency Score    │ │                     │ │ Activate            │
│                     │ │ 7 users at risk     │ │                     │
│ 2.55                │ │ across 3 teams      │ │ $42 avg             │
│ ↑ +0.31 vs prior    │ │ [▲ amber - 5.8% of  │ │ (first 10 runs)     │
│ [higher is better]  │ │  active user base]  │ │ ↓ -$6 vs prior      │
│ ▂▃▃▄▄▅▆▆▇█          │ │                     │ │                     │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘
```

---

## Budget Gauge (KPI-38 visual detail)

```
┌──────────────────────────────────┐
│ Budget Utilization           [?] │
│                                  │
│  $0        $7.5K        $15K    │
│  |──────────────────────────|   │
│  [██████████████████░░░░░░░░]   │
│           65.3%                  │
│                                  │
│  $9,800 spent of $15,000         │
│  $5,200 remaining (Day 26/30)    │
│  Projected: $11,308 at month-end │
└──────────────────────────────────┘
```

---

## Cost Anomaly Calendar Cell - Tooltip

```
              ┌──────────────────────────────────┐
 Cell: ▓      │ June 12, 2026 - Anomaly Day      │
(Jun 12)      │ ─────────────────────────────    │
              │ Daily spend:   $1,100             │
              │ 30d avg/day:   $430               │
              │ Ratio:         2.56x avg          │
              │                                   │
              │ Possible cause: CI automation     │
              │ triggered 47 consecutive runs.    │
              └──────────────────────────────────┘
```
