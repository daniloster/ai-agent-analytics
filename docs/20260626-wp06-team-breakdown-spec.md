# SPEC: WP-06 - Section 2 Team Breakdown

**Date:** 2026-06-26
**Status:** Ready
**Working Package:** WP-06
**Depends on:** WP-02, WP-03, WP-04, WP-05 (KpiCard)

---

## Assumptions (confirmed or defaulted)

- `TeamTable` is a new dedicated component using shadcn/ui `<Table>`.
- Sorting state (key + direction) is a local signal within `TeamTable` - not exported to `filterSignals.ts`.
- `KpiCard` is imported from WP-05 (`src/components/kpis/KpiCard.tsx`); not redefined here.
- Churn badge appears on a team row when `churn_signal_count > 0`.
- When `teamId.value` is set (team filter active): section re-fetches for that team only and renders a single-team detail view instead of the org-wide table + charts.
- Failed run rate color thresholds: amber when `> 1.5x orgAvgFailedRunRate`; red when `> 2x orgAvgFailedRunRate`.
- Null `avg_quality_score` in a team row: shown as "-" and sorts to the end in both ascending and descending order.
- TanStack Query key: `['teams', filterQueryParams.value]`.

---

## 1. Context

Implements WP-06 from `docs/20260626-analytics-dashboard-plan.md`. Corresponds to Investigation Appendix A §Section 2 (KPI-15 through KPI-25).

**Files created:**
- `src/components/kpis/TeamTable.tsx` - sortable data table organism
- `src/components/sections/TeamBreakdown.tsx` - section organism

**Existing files consumed (not modified):**
- `src/types/api.ts` (WP-02) - `TeamMetrics`, `TeamsResponse`
- `src/components/charts/BarChart.tsx` (WP-03)
- `src/components/charts/Sparkline.tsx` (WP-03)
- `src/components/charts/primitives/Annotation.tsx` (WP-03) - "lower is better" label
- `src/components/layout/Section.tsx` (WP-04)
- `src/lib/filters/filterSignals.ts` (WP-04) - `filterQueryParams`, `teamId`
- `src/components/kpis/KpiCard.tsx` (WP-05)
- `src/lib/kpi/formatters.ts` (WP-05) - `formatCurrency`, `formatPercent`, `formatNumber`

---

## 2. Data model

```ts
// src/components/kpis/TeamTable.tsx

interface TeamTableProps {
  teams: TeamMetrics[]          // from WP-02 TeamsResponse
  orgAvgFailedRunRate: number   // for color thresholds; 0-1 fraction
}

// Internal sort state (signals, not exported):
// sortKey = signal<SortKey>('runs')
// sortDir = signal<SortDirection>('desc')

type SortKey =
  | 'runs'
  | 'cost'
  | 'mau'
  | 'adoption_rate'
  | 'avg_quality_score'       // nullable - nulls always sort to end
  | 'failed_run_rate'
  | 'cost_per_quality_point'  // nullable - nulls always sort to end
  | 'wow_cost_change'

type SortDirection = 'asc' | 'desc'

// src/components/sections/TeamBreakdown.tsx
// No new types; consumes TeamsResponse from WP-02

// Single-team detail props (internal to TeamBreakdown, not exported):
interface TeamDetailViewProps {
  team: TeamMetrics
  orgAvgFailedRunRate: number
}
```

---

## 3. Component / module design

### New files

**`src/components/kpis/TeamTable.tsx`** (new)
- Organism-level component.
- shadcn/ui `<Table>` with columns (in order):
  1. Team (name, non-sortable)
  2. Runs (sortable)
  3. Cost (sortable, formatted via `formatCurrency`)
  4. Users (MAU / seat_count display; sortable by MAU)
  5. Adoption (progress bar 0-100%; sortable by adoption_rate)
  6. Quality (star display or "-" for null; sortable; nulls to end)
  7. Failed Rate (color-coded cell; sortable)
  8. WoW Trend (40px `<Sparkline>`; non-sortable)
  9. Churn (shadcn/ui `<Badge variant="destructive">` with count; non-sortable; hidden when count = 0)
- Sort behavior: clicking a sortable column header that is not currently active sets it as `sortKey` with `sortDir = 'desc'`. Clicking the active column toggles `sortDir`. Sort indicator (up/down chevron) shown on active column header.
- Sorted rows: `useDeepComputed(() => [...teams].sort(compareFn(sortKey.value, sortDir.value)))` - deep-computed because it returns a new array reference on every sort.
- Null handling in compareFn: nullable columns (`avg_quality_score`, `cost_per_quality_point`) - null values always pushed to array end regardless of sort direction.
- Failed rate cell: `className` conditionally applied - amber background at > 1.5x org avg, red background at > 2x org avg. Value displayed as formatted percent.
- Churn badge: `{team.churn_signal_count} churn signal{team.churn_signal_count !== 1 ? 's' : ''}` text. Only rendered when `churn_signal_count > 0`.
- Adoption progress bar: shadcn/ui `<Progress value={team.adoption_rate * 100} />`.

**`src/components/sections/TeamBreakdown.tsx`** (new)
- Organism-level component.
- `useQuery(['teams', filterQueryParams.value])` -> `/api/analytics/teams`
- Loading state: `<Skeleton>` placeholders for TeamTable rows and chart areas.
- View switching via `useDeepComputed(() => teamId.value)`:
  - When `teamId.value` is `undefined`: renders **org-wide view**
  - When `teamId.value` is a string: renders **single-team detail view**

**Org-wide view layout:**
1. `<TeamTable teams={data.teams} orgAvgFailedRunRate={data.org_avg_failed_run_rate} />`
2. `<figure>` horizontal `<BarChart>` - Runs per team (KPI-15), sorted descending by value
3. `<figure>` grouped `<BarChart>` - Cost per team + cost per user per team side-by-side bars (KPI-16, KPI-17)
4. `<figure>` `<BarChart>` sorted descending by quality score - Quality score per team (KPI-20)
5. `<figure>` stacked `<BarChart>` - Top use cases per team (KPI-23); one stacked bar per team, segments = task_category proportions
6. `<figure>` `<BarChart>` sorted ascending by cost_per_quality_point - Cost per quality point per team (KPI-22); `<Annotation>` label "lower is better" on the chart

**Single-team detail view layout:**
1. Row of 4 `<KpiCard>` components: Runs (KPI-15 for this team), Cost (KPI-16), Quality Score (KPI-20, insufficientData when null), Failed Rate (KPI-21)
2. `<figure>` horizontal `<BarChart>` - Use cases breakdown for this team (KPI-23 single-team)
3. `<figure>` `<Sparkline>` (80px) - WoW cost trend for this team (KPI-25)

### Public API

```ts
// src/components/kpis/TeamTable.tsx
export function TeamTable(props: TeamTableProps): JSX.Element

// src/components/sections/TeamBreakdown.tsx
export function TeamBreakdown(): JSX.Element
```

---

## 4. Interaction diagram

### Org-wide view data flow

```
TeamBreakdown mounts (inside Section lazy-mount from WP-04)
  --> useQuery(['teams', filterQueryParams.value])
  --> while loading: Skeleton placeholders for table rows and chart areas

On TeamsResponse received:
  --> data.teams passed to TeamTable as teams prop
  --> data.org_avg_failed_run_rate passed for color thresholds
  --> KPI-15 BarChart: data.teams mapped to [{label: team.name, value: team.run_count}] sorted desc
  --> KPI-16/17 grouped BarChart: [{label, costValue, costPerUserValue}] per team
  --> KPI-20 BarChart: sorted by avg_quality_score desc
  --> KPI-23 stacked BarChart: [{label, segments: [{category, proportion}]}] per team
  --> KPI-22 BarChart: sorted by cost_per_quality_point asc (nulls at end)
```

### Column sort interaction

```
User clicks "Cost" column header (currently inactive column)
  --> sortKey.value = 'cost', sortDir.value = 'desc'
  --> useDeepComputed(() => [...teams].sort(...)) returns new sorted array
  --> TeamTable rows re-render in cost-descending order
  --> "Cost" header shows downward chevron

User clicks "Cost" column header again (currently active, desc)
  --> sortDir.value = 'asc'
  --> array re-sorted ascending
  --> "Cost" header shows upward chevron
```

### Team filter scope change

```
User selects "Frontend Team" from TeamSelector (WP-04)
  --> teamId.value = 'team_frontend'
  --> filterQueryParams signal updates (team_id param added)
  --> TanStack Query key changes -> refetch against /api/analytics/teams?team_id=team_frontend
  --> MSW returns TeamsResponse with single TeamMetrics entry
  --> useDeepComputed(() => teamId.value) returns 'team_frontend'
  --> TeamBreakdown switches to single-team detail view
  --> Shows 4 KpiCards for this team + use cases chart + WoW sparkline

User selects "All Teams" (resets teamId to undefined)
  --> teamId.value = undefined
  --> filterQueryParams updates (team_id param removed)
  --> refetch -> full TeamsResponse with all teams
  --> TeamBreakdown switches back to org-wide view (TeamTable + all charts)
```

### Null quality score sort

```
compareFn called with sortKey = 'avg_quality_score', sortDir = 'desc'
  team A: avg_quality_score = 4.4
  team B: avg_quality_score = null
  team C: avg_quality_score = 3.6

Result order (nulls always last regardless of direction):
  desc: [A (4.4), C (3.6), B (null)]
  asc:  [C (3.6), A (4.4), B (null)]
```

---

## 5. Acceptance criteria

1. `TeamTable` renders one row per team in the `teams` prop array.
2. Clicking the "Runs" column header sorts all rows by `run_count` descending; clicking again sorts ascending; the active column header shows a sort direction indicator.
3. A team with `churn_signal_count = 3` renders a destructive badge with text "3 churn signals" in its row. A team with `churn_signal_count = 0` renders no badge.
4. A team with `failed_run_rate = 0.12` and `orgAvgFailedRunRate = 0.058` (`0.12 > 2 * 0.058`) renders the failed rate cell with red background styling.
5. A team with `failed_run_rate = 0.09` and `orgAvgFailedRunRate = 0.058` (`0.09 > 1.5 * 0.058` but not `> 2x`) renders the failed rate cell with amber background styling.
6. Sorting by `avg_quality_score` descending: teams with null quality score appear after all non-null teams. Sorting ascending: null teams also appear last.
7. The KPI-15 BarChart renders bars sorted by descending run count (highest-run team first).
8. The KPI-23 stacked BarChart renders one bar per team where all segment proportions sum to 100%.
9. The KPI-22 BarChart includes an annotation labeled "lower is better" visible in the chart area.
10. When `teamId.value` is set to a team ID string, `TeamBreakdown` renders 4 KpiCard components (Runs, Cost, Quality, Failed Rate) and does not render `TeamTable`.
11. When `teamId.value` is `undefined`, `TeamBreakdown` renders `TeamTable` and all five org-wide charts.
12. Changing `filterQueryParams` (date range change) triggers `useQuery` refetch; table and all charts update with new data.
13. The Adoption column renders a progress bar element for each team row, with width proportional to `adoption_rate`.

---

## 6. Out of scope

- User-level drill-down within a team (v2 feature)
- Exporting team data to CSV or PDF
- Multi-team selection (current design: all teams or exactly one team)
- Cross-team comparison charts beyond the five defined in the plan
- Axe-core automated accessibility assertions (WP-09)
- KPI-24 churn signal detail view (plan shows badge only, not a detail page)

---

## Test plan

| File | What it tests |
|------|---------------|
| `src/components/kpis/TeamTable.test.ts` (new) | renders correct number of rows for given teams array; "Runs" column sort descending then ascending; "Cost" column sort; churn badge visible when count > 0 with correct text; churn badge absent when count = 0; red cell when failed_run_rate > 2x org avg; amber cell when > 1.5x but not > 2x; null avg_quality_score sorts to end in both asc and desc; adoption progress bar rendered per row |
| `src/components/sections/TeamBreakdown.test.ts` (new) | org-wide view renders TeamTable and five BarCharts when teamId is undefined; single-team view renders 4 KpiCards and no TeamTable when teamId is set; loading state renders Skeleton placeholders; filter change (filterQueryParams update) triggers query refetch; KPI-22 chart renders with annotation present |
