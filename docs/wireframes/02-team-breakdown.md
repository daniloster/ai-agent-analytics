# Wireframe 02 - Team Breakdown (Section 2)

**KPIs:** KPI-15 through KPI-25
**Audience:** Engineering Managers, Team Leads
**Query:** GET /api/analytics/teams

---

## Full Section Layout (All Teams view)

```
▐ Team Breakdown                                   Jun 1 - Jun 30, 2026 · All Teams
────────────────────────────────────────────────────────────────────────────────────

TEAM TABLE (sortable - click any column header to sort)
┌────────────┬────────┬─────────┬───────┬────────────┬──────────┬──────────┬─────────────┐
│ Team     ↕ │ Runs ↕ │  Cost ↕ │Users ↕│ Adoption ↕ │Quality ↕ │Failures ↕│ WoW Trend   │
├────────────┼────────┼─────────┼───────┼────────────┼──────────┼──────────┼─────────────┤
│ Platform   │  3,200 │  $4,100 │   12  │ ████░ 80%  │ ★★★★☆   │   5.8%   │ ▂▃▄▅▅  +8%  │
│ Backend    │  2,100 │  $2,800 │   18  │ ███░░ 75%  │ ★★★☆☆   │   6.2%   │ ▃▄▅▆▇ +12%  │
│ Frontend   │  1,800 │  $2,300 │   14  │ █████ 87%  │ ★★★★★   │   4.1%   │ ▅▄▃▂▂  -5%  │
│ Data    ⚠  │    950 │  $1,200 │    8  │ ██░░░ 53%  │ ★★★★☆   │  11.2%   │ ▁▁▂▃▄ +34%  │
│            │        │         │       │  [red bg]  │          │ [amber]  │   [red]     │
├────────────┼────────┼─────────┼───────┼────────────┼──────────┼──────────┼─────────────┤
│ Org Total  │ 12,450 │ $14,200 │   87  │ ████░ 72%  │ ★★★★☆   │   5.8%   │             │
└────────────┴────────┴─────────┴───────┴────────────┴──────────┴──────────┴─────────────┘

  ⚠ Data Team: 3 churn signals detected (users active 4+ weeks ago, silent 2+ weeks)
  Column headers are clickable; sorted indicator shows ↑/↓ direction.

CHARTS ROW 1
┌────────────────────────────────────────┐ ┌────────────────────────────────────────┐
│ Runs per Team                      [?] │ │ Cost per Team                      [?] │
│                                        │ │                                        │
│ Platform  ████████████████████  3,200  │ │ Platform  ████████████████  $4,100     │
│ Backend   █████████████░░░░░░░  2,100  │ │ Backend   ██████████░░░░░░  $2,800     │
│ Frontend  ███████████░░░░░░░░░  1,800  │ │ Frontend  ████████░░░░░░░░  $2,300     │
│ Data      █████░░░░░░░░░░░░░░░    950  │ │ Data      ████░░░░░░░░░░░░  $1,200     │
│           0    1K   2K   3K   4K       │ │           $0   $1K  $2K  $3K  $4K      │
└────────────────────────────────────────┘ └────────────────────────────────────────┘

CHARTS ROW 2
┌────────────────────────────────────────┐ ┌────────────────────────────────────────┐
│ Quality Score per Team             [?] │ │ Cost per Quality Point per Team    [?] │
│ (sorted best to worst)                 │ │ (lower = better value)                 │
│                                        │ │                                        │
│ Frontend  ████████████████████  4.4    │ │ Frontend  █████░░░░░░░░░░░░  $0.28    │
│ Platform  ████████████████░░░░  4.2    │ │ Platform  ██████░░░░░░░░░░░  $0.34    │
│ Backend   ██████████████░░░░░░  3.9    │ │ Backend   ████████░░░░░░░░░  $0.41    │
│ Data      ████████████░░░░░░░░  3.6    │ │ Data      █████████████░░░░  $0.71 ↑  │
│           0.0  1.0  2.0  3.0  5.0      │ │           (lower is better - labeled)  │
└────────────────────────────────────────┘ └────────────────────────────────────────┘

CHARTS ROW 3
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ Top Use Cases by Team (stacked bar - % of runs per category)                     [?] │
│                                                                                      │
│ Platform  [████ UI gen][████ Refactor][███ Testing][██ Docs][█ Other]               │
│ Backend   [█████ API][████ Testing][███ Refactor][██ Migrations][█ Other]            │
│ Frontend  [████████ UI gen][████ Testing][██ Docs][█ Refactor][█ Other]              │
│ Data      [███████ Analysis][████ Pipeline][███ Testing][██ Docs][█ Other]           │
│                                                                                      │
│  ■ UI Gen  ■ Testing  ■ Refactor  ■ API/Analysis  ■ Docs  ■ Other                  │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Single-Team Filtered View (team_id = "data")

When a specific team is selected from the filter, the table collapses to detail cards:

```
▐ Team Breakdown                                  Jun 1 - Jun 30, 2026 · Data Team
────────────────────────────────────────────────────────────────────────────────────

┌──────────────────────────────────────────────────────────────────────────────────┐
│ ⚠ Data Team has 3 churn signals and a failure rate (11.2%) above the org         │
│ average (5.8%). Consider scheduling an enablement session.                       │
└──────────────────────────────────────────────────────────────────────────────────┘

ROW 1 (4 KPI cards for this team)
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│ Runs (Data)      [?]│ │ Cost (Data)      [?]│ │ Adoption (Data)  [?]│ │ Quality (Data)   [?]│
│                     │ │                     │ │                     │ │                     │
│ 950                 │ │ $1,200              │ │ 53%                 │ │ 3.6 / 5.0  ★★★☆☆  │
│ ↓ -12.0% vs prior   │ │ ↑ +34.0% WoW [red]  │ │ 8 of 15 seats       │ │ ↓ -0.4 vs org avg   │
│ ▅▅▄▄▃▃▂▂▁▁          │ │ ▁▁▂▂▃▄▅▆▇█          │ │ [████░░░░░░]        │ │ ▅▅▄▄▄▃▃▃▂▂          │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘ └─────────────────────┘

ROW 2 (churn signal detail + use case breakdown)
┌──────────────────────────────────────────┐ ┌──────────────────────────────────────┐
│ Churn Signals (3 users at risk)      [?] │ │ Top Use Cases - Data Team        [?] │
│                                          │ │                                      │
│  User A  ████████████ active 6w ago      │ │ Analysis  ████████████████  38%     │
│          ░░░░░░░░░░░░ silent 2w                                                   │
│                                          │ │ Pipeline  ████████████  28%         │
│  User B  █████████████ active 5w ago     │ │ Testing   ████████  22%             │
│          ░░░░░░░░░░░░ silent 2w           │ │ Docs      █████  12%                │
│                                          │ │                                      │
│  User C  ██████████ active 4w ago        │ │ (No UI gen tasks - expected for      │
│          ░░░░░░░░░░░░ silent 3w           │ │  a data engineering team)            │
│                                          │ │                                      │
│  [3 seats at renewal risk]               │ │                                      │
└──────────────────────────────────────────┘ └──────────────────────────────────────┘
```

---

## Churn Warning Badge (table cell)

```
┌──────┐
│ ⚠  3 │  <- amber badge showing churn signal count
└──────┘
  Hover tooltip: "3 users were active for 4+ weeks but went silent in the last 2 weeks."
```

---

## Column Sort States

```
│ Runs ↓ │  <- sorted descending (current)
│ Cost ↕  │  <- unsorted (clickable)
│ Adoption ↑│  <- sorted ascending
```
