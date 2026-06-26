# Wireframe 01 - Overview (Section 1)

**KPIs:** KPI-01 through KPI-14 + KPI-49
**Audience:** CTO, VP Engineering
**Query:** GET /api/analytics/overview + GET /api/analytics/timeseries

---

## Full Section Layout

```
▐ Overview                                        Jun 1 - Jun 30, 2026 · All Teams
──────────────────────────────────────────────────────────────────────────────────

ROW 1 - Core Volume & Cost (4 KPI cards)
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│ Total Runs       [?]│ │ Active Users     [?]│ │ Seat Adoption    [?]│ │ Total Cost       [?]│
│                     │ │                     │ │                     │ │                     │
│ 12,450              │ │ 87                  │ │ 72.5%               │ │ $14,200             │
│ ↑ +18.4% vs prior   │ │ DAU avg: 34         │ │ 87 of 120 seats     │ │ ↑ +12.0% MoM        │
│                     │ │ ↑ +6 users MoM      │ │                     │ │                     │
│ ▁▂▃▄▄▅▆▇█▇          │ │ ▂▂▃▃▄▅▆▇▇▇          │ │ [██████████░░░░]    │ │ ▁▂▃▄▅▅▆▇▇█          │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘ └─────────────────────┘

ROW 2 - Efficiency & Quality (4 KPI cards)
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│ Retention Cost   [?]│ │ Success Rate     [?]│ │ Avg Quality      [?]│ │ Cost / Quality   [?]│
│                     │ │                     │ │ Score               │ │ Point               │
│ $163 / user / mo    │ │ 94.2%     [● green] │ │ 4.1 / 5.0  ★★★★☆   │ │ $0.42               │
│ ↓ -4.1% MoM (good)  │ │ ↑ +0.9pp vs prior   │ │ 8,200 rated runs    │ │ ↓ -8.7% MoM (good)  │
│                     │ │                     │ │ ↑ +0.2 vs prior     │ │                     │
│ ▇▆▆▅▄▄▃▃▃▂          │ │ ▅▆▆▇▆▇▇▇▇█          │ │ ▄▄▅▅▅▆▆▇▇▇          │ │ ▇▆▆▅▅▄▄▃▃▃          │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘ └─────────────────────┘

ROW 3 - Acceptance & Activation (4 KPI cards)
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│ Acceptance Rate  [?]│ │ Cost / Accepted  [?]│ │ MoM Usage        [?]│ │ Activation Rate  [?]│
│                     │ │ Output              │ │ Growth              │ │                     │
│ 71.4%               │ │ $1.60               │ │ +18.4%   [↑ green] │ │ 68%                 │
│ ↑ +3.2pp vs prior   │ │ ↓ -11.1% MoM (good) │ │ 12,450 vs 10,515   │ │ 15 of 22 new seats  │
│                     │ │                     │ │                     │ │ activated in 7 days │
│ ▄▄▅▅▅▆▆▇▇█          │ │ ▇▆▅▅▄▃▃▂▂▂          │ │ ▁▂▃▃▄▄▅▆▇█          │ │ ░░░░▓▓▓▓▓▓▓▓▓▓▓     │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘ └─────────────────────┘

ROW 4 - Time-Series Charts (2 full-width-half charts)
┌────────────────────────────────────────────┐ ┌────────────────────────────────────────────┐
│ Token Consumption                      [?] │ │ Cumulative Spend vs Budget             [?] │
│ Input tokens vs output tokens              │ │ Actual, projected, and budget line          │
│                                            │ │                                            │
│ 80M ┤                              ╭──     │ │  $15K ┤ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ← budget  │
│ 60M ┤                     ╭───────╯   \    │ │  $12K ┤                        ╭╌╌╌╌╌╌ ← proj.  │
│ 40M ┤            ╭────────╯            \   │ │   $9K ┤               ╭───────╯               │
│ 20M ┤   ╭────────╯                      ╲  │ │   $6K ┤      ╭───────╯                        │
│  0  ┤───╯                               -- │ │   $3K ┤─────╯                                 │
│     └────────────────────────────────────  │ │    $0 └────────────────────────────────────   │
│      Jun 1  Jun 8  Jun 15  Jun 22  Jun 30  │ │       Jun 1  Jun 8  Jun 15  Jun 22  Jun 30    │
│  ━━ Output   ── Input                      │ │  ━━ Actual   ╌╌ Projected   ── Budget         │
└────────────────────────────────────────────┘ └────────────────────────────────────────────┘

ROW 5 - Quality Trend (full width)
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ Quality Score Trend (30-day moving average)                                      [?] │
│ Org-wide rated run quality over time                                                 │
│                                                                                      │
│  5.0 ┤                                                                               │
│  4.5 ┤                                                      ╭─────────               │
│  4.1 ┤ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌──╯         ← current avg  │
│  4.0 ┤                                           ╭─────────╯                         │
│  3.5 ┤           ╭────────────────────────────────╯                                  │
│  3.0 ┤─══════════╯                                                                   │
│      └──────────────────────────────────────────────────────────────────────────     │
│       Jan      Feb      Mar      Apr      May      Jun                               │
│  ▓ 30d moving avg   ── 4.1 current   (8,200 rated runs this period)                 │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## KPI Card - Seat Adoption (donut variant)

```
┌─────────────────────────────────────┐
│ Seat Adoption                   [?] │
│                                     │
│    ╭───────╮                        │
│   ╱         ╲   72.5%               │
│  │  87/120   │  87 of 120 seats     │
│   ╲         ╱   active this month   │
│    ╰───────╯                        │
│                                     │
│  ■ Active (72.5%)  □ Unused (27.5%) │
└─────────────────────────────────────┘
```

---

## KPI Card - Activation Rate (funnel variant)

```
┌─────────────────────────────────────┐
│ User Activation Rate            [?] │
│                                     │
│  22 seats provisioned               │
│  ████████████████████  100%         │
│                                     │
│  15 activated within 7 days         │
│  █████████████████░░░░░  68%        │
│                                     │
│  12 still active after 30 days      │
│  ██████████████░░░░░░░░  55%        │
│                                     │
│  ↑ +4pp vs prior cohort             │
└─────────────────────────────────────┘
```

---

## "Insufficient Data" State (quality KPIs)

When rated_run_count < 10:

```
┌─────────────────────┐
│ Avg Quality Score [?]│
│                     │
│  Insufficient data  │
│                     │
│  Need 10+ rated     │
│  runs. Currently:   │
│  7 rated runs.      │
│                     │
│  ░░░░░░░░░░░░░░░░   │
└─────────────────────┘
```

---

## Tooltip - Formula Popup (on [?] click)

```
                    ┌────────────────────────────────────────────┐
                    │ Cost per Quality Point                  [x] │
                    │ ─────────────────────────────────────────── │
                    │ Formula:                                     │
                    │   total_cost / (rated_runs * avg_quality)   │
                    │                                             │
                    │ Example:                                     │
                    │   $14,200 / (8,200 * 4.1) = $0.422          │
                    │                                             │
                    │ Interpretation:                             │
                    │   Lower is better. Cost to produce one      │
                    │   unit of user-perceived quality.           │
                    └────────────────────────────────────────────┘
```
