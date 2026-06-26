# TASKS: WP-06 - Section 2 Team Breakdown

**SPEC:** `docs/20260626-wp06-team-breakdown-spec.md`
**Date:** 2026-06-26

---

## T-1: Table, Badge, and Progress UI components

**Context**

Creates three shadcn/ui-style primitive components required by `TeamTable` (T-3): a semantic HTML `<Table>` wrapper set, a `Badge` span for churn signals, and a `Progress` bar for seat adoption rate. None of these have Radix UI counterparts installed (only `@radix-ui/react-popover` and `@radix-ui/react-select` are in `package.json`) so all three are implemented as styled HTML elements using `cn()` from `src/lib/utils.ts`.

Read `src/components/ui/skeleton.tsx` and `src/components/ui/button.tsx` before implementing to understand the project's pattern for shadcn/ui components: named `function` declarations, `cn()` for className merging, spread of HTML element attributes.

**Requirements**

1. Create `src/components/ui/table.tsx` exporting: `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`.
2. `Table` must render a `<table>` with classes `w-full caption-bottom text-sm`; it must accept and forward `className` and `HTMLTableElement` attributes.
3. `TableHeader` must render a `<thead>` with class `[&_tr]:border-b`; `TableBody` must render a `<tbody>` with class `[&_tr:last-child]:border-0`.
4. `TableRow` must render a `<tr>` with classes `border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted`.
5. `TableHead` must render a `<th>` with classes `h-12 px-4 text-left align-middle font-medium text-muted-foreground`; it must accept and forward `HTMLTableCellElement` attributes.
6. `TableCell` must render a `<td>` with classes `p-4 align-middle`; it must accept and forward `HTMLTableCellElement` attributes.
7. `TableCaption` must render a `<caption>` with class `mt-4 text-sm text-muted-foreground`.
8. Create `src/components/ui/badge.tsx` exporting `BadgeProps` and `function Badge(props: BadgeProps): JSX.Element`.
9. `BadgeProps` must include `variant?: 'default' | 'secondary' | 'destructive'` and `className?: string` plus `React.HTMLAttributes<HTMLSpanElement>`.
10. `Badge` must render an inline `<span>` with base classes `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors`; variant `'default'` adds `bg-primary text-primary-foreground`; variant `'secondary'` adds `bg-secondary text-secondary-foreground`; variant `'destructive'` adds `bg-destructive text-destructive-foreground`; default variant is `'default'`.
11. Create `src/components/ui/progress.tsx` exporting `ProgressProps` and `function Progress(props: ProgressProps): JSX.Element`.
12. `ProgressProps` must include `value: number` (0-100), `className?: string`.
13. `Progress` must render a container `<div>` with classes `relative h-2 w-full overflow-hidden rounded-full bg-secondary` and an inner `<div>` with class `h-full bg-primary transition-all`; the inner div `style.width` must be `Math.min(100, Math.max(0, value)) + '%'`.
14. All seven `table.tsx` exports, `Badge`, and `Progress` must be `function` declarations per ARCHITECTURE.md §4.3.
15. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- All three components are pure HTML-based; no Radix UI primitive is needed. This matches how shadcn/ui distributes its Table, Badge, and Progress components when Radix is not installed.
- `Progress.value` is clamped with `Math.min/max` to prevent negative or >100% width: no runtime error, no visual breakage.
- `Badge` variant defaults to `'default'` (primary color) when the prop is absent; `TeamTable` always passes `variant="destructive"` for churn signals.
- `TableHead` and `TableCell` both use `HTMLTableCellElement` because `<th>` and `<td>` share the same DOM interface in TypeScript.

**Design**

```tsx
// src/components/ui/table.tsx  (new file)
import { cn } from '../../lib/utils'

export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>): JSX.Element
// <table className={cn('w-full caption-bottom text-sm', className)} {...props} />

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>): JSX.Element
// <thead className={cn('[&_tr]:border-b', className)} {...props} />

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>): JSX.Element
// <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>): JSX.Element
// <tr className={cn('border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted', className)} {...props} />

export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>): JSX.Element
// <th className={cn('h-12 px-4 text-left align-middle font-medium text-muted-foreground', className)} {...props} />

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>): JSX.Element
// <td className={cn('p-4 align-middle', className)} {...props} />

export function TableCaption({ className, ...props }: React.HTMLAttributes<HTMLTableCaptionElement>): JSX.Element
// <caption className={cn('mt-4 text-sm text-muted-foreground', className)} {...props} />

// src/components/ui/badge.tsx  (new file)
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'destructive'
}

export function Badge({ variant = 'default', className, ...props }: BadgeProps): JSX.Element
// <span className={cn(baseClasses, variantClasses[variant], className)} {...props} />

// src/components/ui/progress.tsx  (new file)
export interface ProgressProps {
  value: number
  className?: string
}

export function Progress({ value, className }: ProgressProps): JSX.Element
// <div className={cn('relative h-2 w-full overflow-hidden rounded-full bg-secondary', className)}>
//   <div className="h-full bg-primary transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
// </div>
```

**Acceptance criteria**

1. `<Table><TableBody><TableRow><TableCell>hello</TableCell></TableRow></TableBody></Table>` renders `"hello"` inside a `<td>` inside a `<tr>` inside a `<tbody>` inside a `<table>`.
2. `<TableHead>Name</TableHead>` renders a `<th>` element containing `"Name"`.
3. `<Badge variant="destructive">3 signals</Badge>` renders a `<span>` with `bg-destructive` in its class list.
4. `<Badge>label</Badge>` (no variant) renders a `<span>` with `bg-primary` in its class list (default variant).
5. `<Progress value={68} />` renders an inner div with `width: 68%` in its inline style.
6. `<Progress value={110} />` clamps to `width: 100%` (no overflow beyond 100%).
7. `<Progress value={-5} />` clamps to `width: 0%` (no negative width).

**Test Plan**

- `src/components/ui/table.test.tsx` (new)
  - Scenario: full table structure renders correct HTML elements (`table`, `thead`, `tbody`, `tr`, `th`, `td`).
  - Scenario: `TableHead` renders a `th`; `TableCell` renders a `td`.
  - Scenario: `TableRow` has `border-b` class.

- `src/components/ui/badge.test.tsx` (new)
  - Scenario: `variant="destructive"` has `bg-destructive` class.
  - Scenario: default variant (no prop) has `bg-primary` class.

- `src/components/ui/progress.test.tsx` (new)
  - Scenario: `value={68}` renders inner div with `width: 68%`.
  - Scenario: `value={110}` clamps to `width: 100%`.
  - Scenario: `value={-5}` clamps to `width: 0%`.

**Files**

- `src/components/ui/table.tsx` (new) - Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption
- `src/components/ui/table.test.tsx` (new) - table structure and element type tests
- `src/components/ui/badge.tsx` (new) - variant-aware Badge span
- `src/components/ui/badge.test.tsx` (new) - variant class tests
- `src/components/ui/progress.tsx` (new) - clamped proportional fill bar
- `src/components/ui/progress.test.tsx` (new) - width clamping and rendering tests

---

## T-2: ColumnChart component

**Context**

Creates `src/components/charts/ColumnChart.tsx` - a Visualization-based vertical bar chart that supports an optional `Annotation` overlay. It is used in `TeamBreakdown` (T-4) for KPI-16/17 (cost per team), KPI-20 (quality per team), and KPI-22 (cost per quality point with "lower is better" annotation). The simple `BarChart.tsx` from WP-05 T-7 (horizontal HTML divs) cannot host Visualization overlays, so `ColumnChart` provides that capability.

Read `src/components/charts/Visualization.tsx` (the wrapping pattern), `src/components/charts/marks/Bar.tsx` (the Bar mark's `series`/`axis` props), `src/components/charts/primitives/scales.ts` (how `type: 'band'` builds its domain from data insertion order), and `src/components/charts/overlays/Annotation.tsx` (the `axis`/`value`/`label` props) before implementing.

Note: `Annotation` lives at `src/components/charts/overlays/Annotation.tsx`, not `primitives/` despite the SPEC's reference.

**Requirements**

1. Create `src/components/charts/ColumnChart.tsx` exporting `ColumnChartBar`, `ColumnChartProps`, and `function ColumnChart(props: ColumnChartProps): JSX.Element`.
2. `ColumnChartBar` must include: `label: string`, `value: number`, `color?: string`.
3. `ColumnChartProps` must include: `bars: ColumnChartBar[]`, `annotation?: { value: number; label: string }`, `height?: number`, `ariaLabel?: string`.
4. `ColumnChart` must convert `props.bars` to a Visualization-compatible `ReadonlySignal` using `useDeepComputed(() => ({ bars: props.bars }))` - the series key must be `"bars"`.
5. `ColumnChart` must define axes as `[{ id: 'x', type: 'band', position: 'bottom', accessor: (d) => (d as ColumnChartBar).label }, { id: 'y', type: 'linear', position: 'left', accessor: (d) => (d as ColumnChartBar).value, domain: 'auto' }]`.
6. The axes array must use `useMemo(fn, [])` (not hoisted as a module constant) because the `accessor` closures cast to `ColumnChartBar` which is a type in scope.
7. `ColumnChart` must render `<Bar series="bars" axis="y" />` inside the `Visualization` children callback.
8. When `props.annotation` is provided, `ColumnChart` must also render `<Annotation axis="y" value={props.annotation.value} label={props.annotation.label} variant="warning" />` inside the children callback.
9. `ColumnChart` must forward `height` and `ariaLabel` to `Visualization`.
10. When `props.bars` is empty, `ColumnChart` must render without throwing (Visualization and Bar mark handle empty data gracefully).
11. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- The Band scale in `buildScale` infers its domain from data insertion order: `[...new Set(data.map(d => String(accessor(d))))]`. This means the caller (TeamBreakdown) controls bar order by sorting the `bars` array before passing it to `ColumnChart`. `ColumnChart` does NOT have a `sortBy` prop; all ordering is the caller's responsibility.
- `useMemo(fn, [])` for axes (not a module-level const): the `accessor` function casts `d as ColumnChartBar` which works at runtime but TypeScript resolves the import at module level. This is fine as an identity-stable memo.
- The `Annotation` overlay works inside `Visualization`'s children render via `useVisualizationContext()`. It must be rendered as a sibling of `<Bar>` inside the same children callback to share the Visualization context.
- `color` on individual `ColumnChartBar` items is not forwarded to the Bar mark in this task (Bar mark takes a single `color` prop, not per-datum). All bars get the default `tokens.primary` color. Per-bar coloring is not required by WP-06.

**Design**

```tsx
// src/components/charts/ColumnChart.tsx  (new file)
import { useMemo } from 'react'
import { useDeepComputed } from '../../hooks/useDeepComputed'
import { Visualization } from './Visualization'
import { Bar } from './marks/Bar'
import { Annotation } from './overlays/Annotation'

export interface ColumnChartBar {
  label: string
  value: number
  color?: string
}

export interface ColumnChartProps {
  bars: ColumnChartBar[]
  annotation?: { value: number; label: string }
  height?: number
  ariaLabel?: string
}

export function ColumnChart({ bars, annotation, height, ariaLabel }: ColumnChartProps): JSX.Element
// const dataSig = useDeepComputed(() => ({ bars }))
// const axes = useMemo(() => [
//   { id: 'x', type: 'band' as const, position: 'bottom' as const, accessor: (d) => (d as ColumnChartBar).label },
//   { id: 'y', type: 'linear' as const, position: 'left' as const, accessor: (d) => (d as ColumnChartBar).value, domain: 'auto' as const },
// ], [])
// return (
//   <Visualization data={dataSig} axes={axes} height={height} ariaLabel={ariaLabel}>
//     {({ Bar: BarMark, Annotation: AnnotationMark }) => (
//       <>
//         <BarMark series="bars" axis="y" />
//         {annotation && <AnnotationMark axis="y" value={annotation.value} label={annotation.label} variant="warning" />}
//       </>
//     )}
//   </Visualization>
// )
```

**Acceptance criteria**

1. `<ColumnChart bars={[{ label: 'A', value: 10 }, { label: 'B', value: 20 }]} />` renders an SVG element in the DOM.
2. The SVG contains `<rect>` elements (bar marks) - one per bar entry.
3. When `annotation` is provided, the SVG contains a `<line>` element (Annotation's reference line).
4. When `annotation` is absent, no `<line>` element is rendered.
5. `<ColumnChart bars={[]} />` does not throw.
6. The `ariaLabel` prop is forwarded and appears on the `<figure>` rendered by Visualization.

**Test Plan**

- `src/components/charts/ColumnChart.test.tsx` (new)
  - Scenario: renders an SVG with rect elements when given non-empty bars.
  - Scenario: `annotation` prop renders a `<line>` element.
  - Scenario: no `annotation` prop renders no `<line>` element.
  - Scenario: empty `bars` array does not throw.
  - Scenario: `ariaLabel` appears on the figure.

**Files**

- `src/components/charts/ColumnChart.tsx` (new) - Visualization-based vertical bar chart with optional Annotation
- `src/components/charts/ColumnChart.test.tsx` (new) - rect rendering, annotation, and empty-guard tests

---

## T-3: TeamTable component

**Context**

Implements SPEC §3 `src/components/kpis/TeamTable.tsx` - the sortable data table that is the centerpiece of the org-wide view in `TeamBreakdown`. It renders one row per `TeamMetrics` entry with nine columns: Team name, Runs, Cost, Users (MAU/seat_count), Adoption (progress bar), Quality, Failed Rate (color-coded), WoW Trend (Sparkline), and Churn (Badge). Clicking sortable column headers cycles sort direction. Null quality scores and null cost_per_quality_point always sort to the end regardless of direction.

Before starting, read:
- `src/types/api.ts` - `TeamMetrics` interface (all field names used in this component)
- `src/components/ui/table.tsx` (T-1) - `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`
- `src/components/ui/badge.tsx` (T-1) - `Badge` with `variant="destructive"`
- `src/components/ui/progress.tsx` (T-1) - `Progress` with `value={0-100}`
- `src/components/charts/Sparkline.tsx` (WP-05 T-4) - `SparklineProps` interface
- `src/lib/kpi/formatters.ts` (WP-05 T-2) - `formatCurrency`, `formatPercent`, `formatNumber`
- `ARCHITECTURE.md §3.2` - signal subscription strategy (`useDeepComputed` for sorted array, `useSignal` for local state)

**Requirements**

1. Create `src/components/kpis/TeamTable.tsx` exporting `TeamTableProps` and `function TeamTable(props: TeamTableProps): JSX.Element`.
2. `TeamTableProps` must include: `teams: TeamMetrics[]`, `orgAvgFailedRunRate: number`.
3. `TeamTable` must define two local signals: `sortKey = useSignal<SortKey>('runs')` and `sortDir = useSignal<SortDirection>('desc')`.
4. `TeamTable` must compute sorted rows with `useDeepComputed(() => [...props.teams].sort(compareFn(sortKey.value, sortDir.value)))` per ARCHITECTURE.md §3.2 (deep equal suppresses re-render when sorted result is structurally identical).
5. The `compareFn` function must be hoisted outside the component (it has no closure over component-scope variables per ARCHITECTURE.md §4.4); its signature must be `function compareFn(key: SortKey, dir: SortDirection): (a: TeamMetrics, b: TeamMetrics) => number`.
6. The `compareFn` must push `null` values (for `avg_quality_score` and `cost_per_quality_point`) to the end of the sorted array regardless of `dir` value.
7. Clicking a `TableHead` that is NOT the current `sortKey` must set `sortKey.value` to that column's key and `sortDir.value` to `'desc'`.
8. Clicking a `TableHead` that IS the current `sortKey` must toggle `sortDir.value` between `'asc'` and `'desc'`.
9. The active sort column `TableHead` must render a sort direction indicator: a downward chevron (`▼`) when `sortDir.value === 'desc'` and upward (`▲`) when `sortDir.value === 'asc'`.
10. The "Team" column `TableHead` must not be clickable and must not change sort state.
11. The "WoW Trend" column `TableHead` must not be clickable and must not change sort state.
12. The "Churn" column `TableHead` must not be clickable and must not change sort state.
13. Each `TableRow` must render the Churn `Badge` ONLY when `team.churn_signal_count > 0`; the badge text must be `"{n} churn signal"` when `n === 1` and `"{n} churn signals"` when `n !== 1`.
14. The Failed Rate `TableCell` must apply class `bg-red-100 text-red-700` when `team.failed_run_rate > 2 * orgAvgFailedRunRate` and class `bg-amber-100 text-amber-700` when `team.failed_run_rate > 1.5 * orgAvgFailedRunRate` (but not `> 2x`); no color class when at or below `1.5x`.
15. The Adoption `TableCell` must render `<Progress value={team.adoption_rate * 100} />`.
16. The WoW Trend `TableCell` must render `<Sparkline data={team.cost_trend.map(p => ({ date: p.date, value: p.cost }))} height={40} />`.
17. The Quality `TableCell` must display `formatQuality(team.avg_quality_score)` when the score is not null and `"-"` when it is null.
18. The Users `TableCell` must display `formatNumber(team.mau) + " / " + formatNumber(team.seat_count)`.
19. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- `useDeepComputed` is required (not `useComputed`) because the sort produces a new array reference on every evaluation; deep equality prevents re-renders when the sorted order is identical to the previous render. Follow ARCHITECTURE.md §3.2.1 exactly.
- `compareFn` hoisted outside the component: it takes only `key` and `dir` as parameters, returns a comparator. No closure over props or signals.
- Null sort semantics: in the comparator, when either `a[key]` or `b[key]` is null: if both null, return 0; if only `a` is null, return `+1` (push a to end); if only `b` is null, return `-1` (push b to end). This is direction-independent.
- Failed rate color: `> 2x` takes precedence over `> 1.5x`. Check the higher threshold first in the conditional.
- The `TableHead` sort click handler must be inlined in JSX (it closes over `sortKey` and `sortDir` signals which are component-scoped). It cannot be hoisted.
- `formatQuality` is imported from `src/lib/kpi/formatters.ts`. If it doesn't exist in the formatters file yet, add it; otherwise import as-is.

**Design**

```tsx
// src/components/kpis/TeamTable.tsx  (new file)
import { useSignal } from '@preact/signals-react'
import { useDeepComputed } from '../../hooks/useDeepComputed'
import type { TeamMetrics } from '../../types/api'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Sparkline } from '../charts/Sparkline'
import { formatCurrency, formatPercent, formatNumber, formatQuality } from '../../lib/kpi/formatters'

type SortKey =
  | 'runs'
  | 'cost'
  | 'mau'
  | 'adoption_rate'
  | 'avg_quality_score'
  | 'failed_run_rate'
  | 'cost_per_quality_point'
  | 'wow_cost_change'

type SortDirection = 'asc' | 'desc'

export interface TeamTableProps {
  teams: TeamMetrics[]
  orgAvgFailedRunRate: number
}

// Hoisted - no component-scope variables.
function compareFn(key: SortKey, dir: SortDirection): (a: TeamMetrics, b: TeamMetrics) => number
// Null values: both null -> 0; a null -> +1; b null -> -1.
// Otherwise: dir === 'asc' ? a[key] - b[key] : b[key] - a[key]

export function TeamTable({ teams, orgAvgFailedRunRate }: TeamTableProps): JSX.Element
// const sortKey = useSignal<SortKey>('runs')
// const sortDir = useSignal<SortDirection>('desc')
// const sortedTeams = useDeepComputed(() => [...teams].sort(compareFn(sortKey.value, sortDir.value)))
// renders: <Table>...</Table> with 9 columns
//   sortable column header onClick: if key !== sortKey.value -> set key + desc; else toggle dir
//   per-row: Badge when churn_signal_count > 0; failed rate color thresholds; Progress; Sparkline
```

**Acceptance criteria**

1. `<TeamTable teams={[teamA, teamB]} orgAvgFailedRunRate={0.05} />` renders exactly 2 `<tr>` elements in `<tbody>`.
2. Clicking the "Runs" `TableHead` sets sort to `runs desc`; the "Runs" header shows `▼`; rows are in descending run count order.
3. Clicking "Runs" again toggles to `runs asc`; the header shows `▲`; rows are in ascending run count order.
4. A team with `churn_signal_count = 3` renders `<Badge variant="destructive">` with text `"3 churn signals"`.
5. A team with `churn_signal_count = 1` renders a badge with text `"1 churn signal"`.
6. A team with `churn_signal_count = 0` renders no Badge element in its row.
7. A team with `failed_run_rate = 0.12` and `orgAvgFailedRunRate = 0.058` (`> 2x`) has `bg-red-100` on its failed rate cell.
8. A team with `failed_run_rate = 0.09` and `orgAvgFailedRunRate = 0.058` (`> 1.5x` but not `> 2x`) has `bg-amber-100` on its failed rate cell.
9. A team with `failed_run_rate = 0.05` and `orgAvgFailedRunRate = 0.058` has neither `bg-red-100` nor `bg-amber-100` on its failed rate cell.
10. Sorting by `avg_quality_score desc` with teams A (score 4.4), B (score null), C (score 3.6): rendered order must be A, C, B (null last).
11. Sorting by `avg_quality_score asc` with same teams: rendered order must be C, A, B (null still last, ascending otherwise).
12. The Adoption column renders a `Progress` element for each row.
13. The WoW Trend column renders an SVG (Sparkline) for each row.

**Test Plan**

- `src/components/kpis/TeamTable.test.tsx` (new)
  - Scenario: renders correct number of rows for given teams array.
  - Scenario: "Runs" column sort descending - rows in descending run count, header shows `▼`.
  - Scenario: "Runs" column sort ascending (second click) - rows in ascending order, header shows `▲`.
  - Scenario: "Cost" column header click changes active sort column.
  - Scenario: churn badge visible with correct singular/plural text when count > 0.
  - Scenario: churn badge absent when count = 0.
  - Scenario: red cell when `failed_run_rate > 2x orgAvgFailedRunRate`.
  - Scenario: amber cell when `failed_run_rate > 1.5x` (not `> 2x`) orgAvgFailedRunRate.
  - Scenario: no color class when at or below `1.5x`.
  - Scenario: null `avg_quality_score` sorts to end in descending sort.
  - Scenario: null `avg_quality_score` sorts to end in ascending sort.
  - Scenario: adoption progress bar rendered per row.

**Files**

- `src/components/kpis/TeamTable.tsx` (new) - sortable nine-column team data table
- `src/components/kpis/TeamTable.test.tsx` (new) - sort, badge, color threshold, null handling, and progress bar tests

---

## T-4: TeamBreakdown organism

**Context**

Implements SPEC §3 `src/components/sections/TeamBreakdown.tsx` - the section organism that assembles the full team breakdown view. It makes one TanStack Query call, switches between org-wide view (TeamTable + five charts) and single-team detail view (four KpiCards + two charts) based on the `teamId` signal, and handles loading state via Skeleton placeholders.

Before starting, read:
- `src/types/api.ts` - `TeamMetrics`, `TeamsResponse` field names
- `src/components/sections/Overview.tsx` (WP-05 T-8, if implemented) or `src/components/layout/Section.tsx` (WP-04 T-3) - the `Section` component's `id` and `labelledBy` props
- `src/lib/filters/filterSignals.ts` (WP-04 T-2) - `filterQueryParams` and `teamId` signals
- `src/components/kpis/TeamTable.tsx` (T-3) - `TeamTableProps`
- `src/components/charts/BarChart.tsx` (WP-05 T-7) - `BarChartProps` (horizontal bar chart)
- `src/components/charts/ColumnChart.tsx` (T-2) - `ColumnChartProps`
- `src/components/charts/Sparkline.tsx` (WP-05 T-4) - `SparklineProps`
- `src/components/kpis/KpiCard.tsx` (WP-05 T-5) - `KpiCardProps`
- `src/lib/kpi/formatters.ts` (WP-05 T-2) - `formatCurrency`, `formatPercent`, `formatNumber`, `formatQuality`

**Requirements**

1. Create `src/components/sections/TeamBreakdown.tsx` exporting `function TeamBreakdown(): JSX.Element`.
2. `TeamBreakdown` must use `useQuery` with `queryKey: ['teams', filterQueryParams.value]` and `queryFn` that calls `fetch('/api/analytics/teams?' + new URLSearchParams({ from: params.from, to: params.to, ...(params.team_id ? { team_id: params.team_id } : {}) })).then(r => r.json())` typed as `TeamsResponse`, where `params = filterQueryParams.value`.
3. The `teamId` signal must be read via `useDeepComputed(() => teamId.value)` to determine which view to render; the signal is imported from `src/lib/filters/filterSignals.ts`.
4. All rendering must be inside `<Section id="teams" labelledBy="teams-heading">` from `src/components/layout/Section.tsx`; the section must contain `<h2 id="teams-heading">Teams</h2>`.
5. **Loading state** (when `query.isLoading`): render four `<Skeleton className="h-10 w-full" />` elements in place of the table and `<Skeleton className="h-48 w-full" />` elements in place of each chart area.
6. **Org-wide view** (when `currentTeamId === undefined`): render these six items in order:
   - `<TeamTable teams={data.teams} orgAvgFailedRunRate={data.org_avg_failed_run_rate} />`
   - `<figure>` + `<figcaption>Runs per team</figcaption>` + `<BarChart bars={sorted desc by runs: teams.map(t => ({label: t.team_name, value: t.runs}))} />`
   - `<figure>` + `<figcaption>Cost per team</figcaption>` + `<BarChart bars={sorted desc by cost: teams.map(t => ({label: t.team_name, value: t.cost}))} />`
   - `<figure>` + `<figcaption>Quality score per team</figcaption>` + `<ColumnChart bars={sorted desc by quality, nulls last: teams with non-null avg_quality_score.map(t => ({label: t.team_name, value: t.avg_quality_score}))} />`
   - `<figure>` + `<figcaption>Use cases by team</figcaption>` + inline stacked bar (see requirement 9)
   - `<figure>` + `<figcaption>Cost per quality point (lower is better)</figcaption>` + `<ColumnChart bars={sorted asc by cost_per_quality_point, nulls last} annotation={{value: avgCostPerQualityPoint, label: 'lower is better'}} />`
7. **Single-team detail view** (when `currentTeamId` is a string): render in order:
   - A row of 4 `KpiCard` components for the first team entry in `data.teams`: Runs (`formatNumber(team.runs)`), Cost (`formatCurrency(team.cost)`), Quality Score (`formatQuality(team.avg_quality_score)` or `insufficientData={true}` when null), Failed Rate (`formatPercent(team.failed_run_rate * 100)`)
   - `<figure>` + `<figcaption>Use cases</figcaption>` + inline stacked bar for this team's `top_use_cases`
   - `<figure>` + `<figcaption>Cost trend</figcaption>` + `<Sparkline data={team.cost_trend.map(p => ({date: p.date, value: p.cost}))} height={80} />`
8. KpiCard instances in the single-team view must have `formulaTooltip` and `exampleTooltip` props with descriptive strings (not empty strings).
9. The **inline stacked bar** for KPI-23 must render a `<div role="list">` with one `role="listitem"` per team (org-wide) or one `role="listitem"` for the single team. Each item must contain a flex row of colored `<div>` segments where each segment's `width` is `segment.percentage + '%'` and each segment must have an `aria-label` of `segment.category`. The segments must visually fill 100% of the bar width collectively.
10. The average cost per quality point for the KPI-22 annotation must be computed as `Math.round` of the mean of all non-null `cost_per_quality_point` values across teams. If all are null, omit the annotation prop.
11. `filterQueryParams` and `teamId` must be read as `.value` in the component body; the Babel signals transform (ARCHITECTURE.md §10.2) injects `useSignals()` automatically.
12. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- `useDeepComputed(() => teamId.value)` for current team ID: `teamId` is a global signal imported from `filterSignals.ts`. Reading `.value` in a `useDeepComputed` subscribes to it reactively.
- The query key includes `filterQueryParams.value` (which contains `team_id` when a team is selected). When the user picks a team from TeamSelector, `filterQueryParams.value.team_id` changes, the query key changes, and TanStack Query refetches - returning a single-team `TeamsResponse`.
- Org-wide KPI-16/17 combined into a single cost-per-team BarChart (KPI-16) with figcaption `"Cost per team"`. This keeps the five-chart count correct. KPI-17 (cost per user) is omitted from charts to avoid implementing grouped bar mode.
- KPI-22 annotation: compute average of non-null `cost_per_quality_point` values, pass as `annotation.value`. If no non-null values exist, pass no annotation. Use `Math.round` to get a clean reference number.
- For KPI-20 (quality per team ColumnChart), filter out teams where `avg_quality_score === null` before building bars; do not show a bar for null-quality teams.
- Inline stacked bars use CSS flex + `width: percentage%` - no visx dependency. This is a single-use visual pattern per CLAUDE.md.

**Design**

```tsx
// src/components/sections/TeamBreakdown.tsx  (new file)
import { useQuery } from '@tanstack/react-query'
import { useDeepComputed } from '../../hooks/useDeepComputed'
import { filterQueryParams, teamId } from '../../lib/filters/filterSignals'
import { Section } from '../layout/Section'
import { TeamTable } from '../kpis/TeamTable'
import { KpiCard } from '../kpis/KpiCard'
import { BarChart } from '../charts/BarChart'
import { ColumnChart } from '../charts/ColumnChart'
import { Sparkline } from '../charts/Sparkline'
import { Skeleton } from '../ui/skeleton'
import { formatCurrency, formatPercent, formatNumber, formatQuality } from '../../lib/kpi/formatters'
import type { TeamsResponse } from '../../types/api'

export function TeamBreakdown(): JSX.Element
// const query = useQuery({ queryKey: ['teams', filterQueryParams.value], queryFn: ... })
// const currentTeamId = useDeepComputed(() => teamId.value)
// <Section id="teams" labelledBy="teams-heading">
//   <h2 id="teams-heading">Teams</h2>
//   {query.isLoading ? <skeletons> : currentTeamId.value ? <single-team-view> : <org-wide-view>}
// </Section>
```

**Acceptance criteria**

1. When `teamId.value` is `undefined` and the query returns data, `TeamBreakdown` renders one `TeamTable` and exactly five `figure` elements.
2. When `teamId.value` is set to a team ID string and the query returns a single-team response, `TeamBreakdown` renders 4 `KpiCard` instances and NO `TeamTable`.
3. While the query is loading, Skeleton elements are visible and no `TeamTable` or `KpiCard` renders.
4. The KPI-15 BarChart renders bars in descending run count order (highest run count team first).
5. The KPI-23 stacked bar renders segments that collectively fill 100% of width for each team.
6. The KPI-22 ColumnChart includes an `<Annotation>` (a `<line>` element) labeled `"lower is better"` when at least one team has a non-null `cost_per_quality_point`.
7. The single-team view Quality KpiCard renders `insufficientData={true}` when the team's `avg_quality_score` is null.
8. Changing `filterQueryParams.value` (simulated by mutating `dateRange` signal) causes a new `fetch` call with updated query params.

**Test Plan**

- `src/components/sections/TeamBreakdown.test.tsx` (new)
  - Scenario: org-wide view renders `TeamTable` and five `figure` elements when `teamId` is undefined and query resolves.
  - Scenario: single-team view renders 4 KpiCards and no `TeamTable` when `teamId` is set.
  - Scenario: loading state renders Skeleton elements, no table or cards.
  - Scenario: KPI-22 ColumnChart has annotation (line element) when teams have non-null `cost_per_quality_point`.
  - Scenario: quality KpiCard shows `insufficientData` in single-team view when `avg_quality_score` is null.

**Files**

- `src/components/sections/TeamBreakdown.tsx` (new) - section organism with org-wide and single-team view switching
- `src/components/sections/TeamBreakdown.test.tsx` (new) - view switching, loading state, annotation, and filter reactivity tests

---

## Implementation order table

| Done | Priority | Task | Depends on | Effort |
|------|----------|------|------------|--------|
| [x]  | 1        | T-1: Table, Badge, Progress UI | - | Medium |
| [x]  | 2        | T-2: ColumnChart component | - | Medium |
| [ ]  | 3        | T-3: TeamTable component | T-1, WP-05 T-4, WP-05 T-2 | Large |
| [ ]  | 4        | T-4: TeamBreakdown organism | T-2, T-3, WP-05 T-4, WP-05 T-5, WP-05 T-7 | Large |
