# TASKS: WP-07 - Section 3: Reliability

**SPEC:** `docs/20260626-wp07-reliability-spec.md`
**Date:** 2026-06-26

---

## Known SPEC discrepancies resolved before implementation

Read this section first. The SPEC data model differs from `src/types/api.ts` in several places.

| SPEC field | api.ts field | Resolution |
|---|---|---|
| `error_rate_delta` | `error_rate_prior` | Compute `computeDeltaPercent(error_rate, error_rate_prior)` then negate (decrease is good) |
| `timeout_rate_delta` | (absent) | No delta badge on Timeout Rate KpiCard |
| `failed_run_cost` | `cost_of_failed_runs` | Use `data.cost_of_failed_runs` |
| `failed_run_cost_pct` | (absent) | Show dollar value only; no percentage in `subValue` |
| `queue_wait_median_s` | `queue_wait_ms` | Show as `subValue` on P50 Duration card; `formatDuration(data.queue_wait_ms)` |
| `p50_duration_s` etc. | `p50_duration_ms` etc. | Pass ms directly to `formatDuration` |

The SPEC says `Heatmap` comes from WP-03 - it does not exist. WP-07 T-1 creates it.
The SPEC says IncidentTable uses Badge - Badge comes from WP-06 T-1. IncidentTable (T-3) depends on WP-06 T-1.
The SPEC claims 8 KpiCards but omits Queue Wait Time (KPI-29). Implementation matches AC #1: 8 cards.

---

## T-1: Heatmap chart wrapper

**Context**

Creates `src/components/charts/Heatmap.tsx` - a responsive calendar heatmap needed by the Reliability section (T-4). The SPEC lists this as coming from WP-03, but `Heatmap.tsx` does not exist; only the lower-level `HeatmapMark` exists (inside Visualization context). Heatmap bypasses Visualization entirely - the same pattern used by `DonutChart.tsx` which uses `@visx/shape Pie` directly.

Before starting, read:
- `src/components/charts/marks/HeatmapMark.tsx` - understand the grid-layout algorithm (numWeeks = ceil(length/7), week columns, cells), the color scale computation, and the aria-label pattern
- `src/components/charts/primitives/ParentSizeComputed.tsx` - the responsive width container that provides `ReadonlySignal<number>` to children
- `src/components/charts/DonutChart.tsx` - the pattern for a chart that bypasses Visualization: `useChartTokens()` + direct @visx rendering

**Requirements**

1. Create `src/components/charts/Heatmap.tsx` exporting `HeatmapProps` and `function Heatmap(props: HeatmapProps): JSX.Element`.
2. `HeatmapProps` must include: `data: Array<{ date: string; uptime_pct: number }>`, `colorScale: 'availability' | 'cost'`, `height?: number`, `ariaLabel?: string`.
3. `Heatmap` must use `ParentSizeComputed` from `src/components/charts/primitives/ParentSizeComputed.tsx` with `heightOverride={height ?? 120}` to measure container width.
4. `Heatmap` must define a non-exported inner `function HeatmapCanvas(...)` component that accepts `data`, `colorScale`, `width: ReadonlySignal<number>`, `height: number`, and `tokens` as props; it reads `width.value` inside its render to subscribe reactively to width changes.
5. The outer `Heatmap` must render `<figure role="img" aria-label={ariaLabel ?? 'Availability heatmap'}>` as its root, with `<ParentSizeComputed>` inside it; the render prop passes `widthSig` and `heightSig` to `<HeatmapCanvas>`.
6. `HeatmapCanvas` must return `null` when `width.value === 0` or `data.length === 0`.
7. `HeatmapCanvas` must compute: `numWeeks = Math.ceil(data.length / 7)`, `cellWidth = width.value / numWeeks`, `cellHeight = height / 7`.
8. `HeatmapCanvas` must render `<svg width={width.value} height={height}>` containing `<HeatmapRect>` from `@visx/heatmap`.
9. The `HeatmapRect` must receive: `data` organized as an array of week columns (each week has an array of day records), `xScale=(weekIndex) => weekIndex * cellWidth`, `yScale=(dayIndex) => dayIndex * cellHeight`, `binWidth={cellWidth}`, `binHeight={cellHeight}`, `gap={2}`.
10. Each `<rect>` rendered from `HeatmapRect` must have `tabIndex={0}`, `role="listitem"`, and `aria-label` set to `"${datum.date}: ${datum.uptime_pct}% uptime"` when `colorScale === 'availability'`.
11. For `colorScale === 'availability'`: fill color is computed via `scaleSequential(interpolateRgb('#ef4444', '#22c55e')).domain([0, 100])` applied to `datum.uptime_pct` (0-100 range - red at 0, green at 100).
12. For `colorScale === 'cost'`: fill color is computed via `scaleSequential(interpolateRgb(tokens.background, tokens.destructive)).domain([0, maxValue])` where `maxValue = Math.max(...data.map(d => d.uptime_pct), 1)`.
13. `useChartTokens` is imported from `src/components/charts/primitives/useChartTokens` and called inside the outer `Heatmap` function (not inside `HeatmapCanvas`); `tokens` is passed down as a prop to `HeatmapCanvas`.
14. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- `HeatmapCanvas` is a separate inner component (not a render prop or arrow function) so the Babel signals transformer can inject `useSignals()` and make `width.value` reads reactive. Reading a `ReadonlySignal<number>.value` inside a render prop callback that is NOT a React component function does not get the transformer and is not reactive.
- Bypasses Visualization: `HeatmapMark` requires a `VisualizationContext` (from `Visualization`) which provides innerWidth/innerHeight via context. Building that context just for a heatmap would require dummy axes. The standalone approach (ParentSizeComputed + @visx/heatmap directly) is cleaner and follows the DonutChart precedent.
- `data` contains ISO date strings. The grid organizes by insertion order (day 0 = data[0], day 1 = data[1], etc.). No date-arithmetic ordering is performed; the caller (Reliability.tsx) controls sort order.
- Week column assembly: for each week `w`, `column.days = data.slice(w * 7, w * 7 + 7)`. The last week may have fewer than 7 days (partial week at period end).

**Design**

```tsx
// src/components/charts/Heatmap.tsx  (new file)
import { HeatmapRect } from '@visx/heatmap'
import { scaleSequential } from 'd3-scale'
import { interpolateRgb } from 'd3-interpolate'
import type { ReadonlySignal } from '@preact/signals-react'
import { ParentSizeComputed } from './primitives/ParentSizeComputed'
import { useChartTokens, type ChartTokens } from './primitives/useChartTokens'

export interface HeatmapProps {
  data: Array<{ date: string; uptime_pct: number }>
  colorScale: 'availability' | 'cost'
  height?: number
  ariaLabel?: string
}

interface HeatmapCanvasProps {
  data: Array<{ date: string; uptime_pct: number }>
  colorScale: 'availability' | 'cost'
  width: ReadonlySignal<number>
  height: number
  tokens: ChartTokens
}

// Inner component — Babel transformer injects useSignals() here so width.value is reactive.
function HeatmapCanvas({ data, colorScale, width, height, tokens }: HeatmapCanvasProps): JSX.Element | null
// Guard: if (width.value === 0 || data.length === 0) return null
// Compute numWeeks, cellWidth, cellHeight
// Build weeks: Array<{ weekIndex, days: Array<{date, uptime_pct}> }>
// Build getColor from scaleSequential
// Render <svg><HeatmapRect ... /></svg>

export function Heatmap({ data, colorScale, height = 120, ariaLabel }: HeatmapProps): JSX.Element
// const tokens = useChartTokens()
// return (
//   <figure role="img" aria-label={ariaLabel ?? 'Availability heatmap'}>
//     <ParentSizeComputed heightOverride={height}>
//       {(widthSig) => (
//         <HeatmapCanvas data={data} colorScale={colorScale} width={widthSig} height={height} tokens={tokens} />
//       )}
//     </ParentSizeComputed>
//   </figure>
// )
```

**Acceptance criteria**

1. `<Heatmap data={[]} colorScale="availability" />` renders a `<figure>` element without throwing.
2. `<Heatmap data={thirtyDayData} colorScale="availability" />` (30 entries) renders `<rect>` elements (one per data point).
3. Each `<rect>` element has an `aria-label` matching `"${d.date}: ${d.uptime_pct}% uptime"`.
4. The number of `<rect>` elements equals `data.length`.
5. A cell with `uptime_pct = 100` has a fill color that is visually green (closer to `#22c55e` than `#ef4444`); a cell with `uptime_pct = 0` has a fill color visually red.
6. The `figure` element has `aria-label={ariaLabel}` when the prop is provided.

**Test Plan**

- `src/components/charts/Heatmap.test.tsx` (new)
  - Scenario: empty data renders figure without throwing.
  - Scenario: 30-entry data renders 30 rect elements.
  - Scenario: each rect has the correct `aria-label` format.
  - Scenario: `ariaLabel` prop is forwarded to the figure.

**Files**

- `src/components/charts/Heatmap.tsx` (new) - responsive calendar heatmap using ParentSizeComputed + @visx/heatmap directly
- `src/components/charts/Heatmap.test.tsx` (new) - rect count, aria-label format, and empty-guard tests

---

## T-2: `computeErrorRateSeverity` formula and KpiCard `statusDot` prop

**Context**

Implements SPEC §3 (modified files): adds `computeErrorRateSeverity` to `src/lib/kpi/formulas.ts`, then extends `KpiCard` with a `statusDot` prop so the Error Rate card can display a colored status indicator. Both changes are small and tightly coupled (the severity type flows from the formula to the card prop), so they belong in one task.

Before starting, read:
- `src/lib/kpi/formulas.ts` - existing formula functions to understand the file's pattern (pure functions, no imports needed)
- `src/lib/kpi/formulas.test.ts` - existing test style to match
- `src/components/kpis/KpiCard.tsx` - current `KpiCardProps` interface and `CardHeader` JSX to find the injection point for the dot

**Requirements**

1. Add `export type ErrorRateSeverity = 'good' | 'warning' | 'critical'` to `src/lib/kpi/formulas.ts` above `computeErrorRateSeverity`.
2. Add `export function computeErrorRateSeverity(errorRate: number): ErrorRateSeverity` to `src/lib/kpi/formulas.ts`; it must return `'good'` when `errorRate < 0.02`, `'warning'` when `0.02 <= errorRate < 0.05`, `'critical'` when `errorRate >= 0.05`.
3. The boundary at `0.02` must be inclusive on the warning side: `computeErrorRateSeverity(0.02)` returns `'warning'`.
4. The boundary at `0.05` must be inclusive on the critical side: `computeErrorRateSeverity(0.05)` returns `'critical'`.
5. Add `statusDot?: 'good' | 'warning' | 'critical'` to `KpiCardProps` in `src/components/kpis/KpiCard.tsx`.
6. When `props.statusDot` is present, `KpiCard` must render a `<span>` with classes `h-2 w-2 rounded-full` and the appropriate color class (`bg-emerald-500` for `'good'`, `bg-amber-500` for `'warning'`, `bg-red-500` for `'critical'`) immediately before the label `<span>` inside the CardHeader flex row.
7. The status dot `<span>` must have `aria-hidden="true"`.
8. When `props.statusDot` is absent, no dot element is rendered (no empty span).
9. The color class map must be hoisted outside the `KpiCard` function body per ARCHITECTURE.md §4.4 (it depends only on its argument, not on props or signals).
10. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- `ErrorRateSeverity` is defined in `formulas.ts` (not in `src/types/`) because it is directly derived from the business logic. `KpiCard` reuses the same literal union type structurally - TypeScript structurally matches it without an import, keeping the UI component independent of the business layer. The `statusDot` prop is typed as `'good' | 'warning' | 'critical'` inline in `KpiCardProps`.
- Color class map as a module-level const: `const STATUS_DOT_COLORS: Record<'good' | 'warning' | 'critical', string> = { good: 'bg-emerald-500', warning: 'bg-amber-500', critical: 'bg-red-500' }`. Hoisted because it has no closure over component scope.
- `aria-hidden="true"` on the dot: the colored circle is a visual-only redundant indicator. The card's label and value convey the same information in text. Adding aria-hidden prevents screen readers from announcing the dot.

**Design**

```ts
// src/lib/kpi/formulas.ts  (modified - append to existing file)

export type ErrorRateSeverity = 'good' | 'warning' | 'critical'

export function computeErrorRateSeverity(errorRate: number): ErrorRateSeverity
// errorRate < 0.02  -> 'good'
// errorRate < 0.05  -> 'warning'
// errorRate >= 0.05 -> 'critical'
```

```tsx
// src/components/kpis/KpiCard.tsx  (modified)

// Module-level constant (hoisted per ARCHITECTURE §4.4)
const STATUS_DOT_COLORS: Record<'good' | 'warning' | 'critical', string> = {
  good: 'bg-emerald-500',
  warning: 'bg-amber-500',
  critical: 'bg-red-500',
}

// KpiCardProps change: add
//   statusDot?: 'good' | 'warning' | 'critical'

// CardHeader flex row change:
// <div className="flex items-center gap-2">
//   {props.statusDot && (
//     <span className={`h-2 w-2 rounded-full ${STATUS_DOT_COLORS[props.statusDot]}`} aria-hidden="true" />
//   )}
//   <span className="text-sm font-medium text-muted-foreground">{props.label}</span>
// </div>
```

**Acceptance criteria**

1. `computeErrorRateSeverity(0.01)` returns `'good'`.
2. `computeErrorRateSeverity(0.02)` returns `'warning'` (inclusive lower boundary).
3. `computeErrorRateSeverity(0.03)` returns `'warning'`.
4. `computeErrorRateSeverity(0.05)` returns `'critical'` (inclusive lower boundary).
5. `computeErrorRateSeverity(0.06)` returns `'critical'`.
6. `<KpiCard statusDot="critical" label="Error Rate" value="6.2%" .../>` renders a `<span>` with class `bg-red-500`.
7. `<KpiCard statusDot="warning" label="Error Rate" value="3.1%" .../>` renders a `<span>` with class `bg-amber-500`.
8. `<KpiCard statusDot="good" label="Error Rate" value="1.0%" .../>` renders a `<span>` with class `bg-emerald-500`.
9. `<KpiCard label="Cost" value="$100" .../>` (no `statusDot` prop) renders no dot span in the header.
10. The dot span has `aria-hidden="true"`.

**Test Plan**

- `src/lib/kpi/formulas.test.ts` (modified - add cases)
  - Scenario: `computeErrorRateSeverity` returns correct severity for values 0.01, 0.02, 0.03, 0.05, 0.06.
  - Scenario: boundary at 0.02 is inclusive on the warning side.
  - Scenario: boundary at 0.05 is inclusive on the critical side.

- `src/components/kpis/KpiCard.test.tsx` (modified - add cases)
  - Scenario: `statusDot="critical"` renders a span with `bg-red-500`.
  - Scenario: `statusDot="good"` renders a span with `bg-emerald-500`.
  - Scenario: no `statusDot` prop renders no dot element.
  - Scenario: dot span has `aria-hidden="true"`.

**Files**

- `src/lib/kpi/formulas.ts` (modified) - adds `ErrorRateSeverity` type and `computeErrorRateSeverity`
- `src/lib/kpi/formulas.test.ts` (modified) - adds boundary and value tests for `computeErrorRateSeverity`
- `src/components/kpis/KpiCard.tsx` (modified) - adds `statusDot` prop and colored dot rendering in CardHeader
- `src/components/kpis/KpiCard.test.tsx` (modified) - adds statusDot rendering tests

---

## T-3: IncidentTable component

**Context**

Implements SPEC §3 `src/components/kpis/IncidentTable.tsx` - a sortable table of incidents displayed at the bottom of the Reliability section when `incidents.length > 0`. It uses the Table and Badge components from WP-06 T-1; that task must be complete before starting this one.

Before starting, read:
- `src/components/ui/table.tsx` (WP-06 T-1) - `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` component signatures
- `src/components/ui/badge.tsx` (WP-06 T-1) - `Badge` with `variant` prop

**Requirements**

1. Create `src/components/kpis/IncidentTable.tsx` exporting `IncidentRow`, `IncidentTableProps`, and `function IncidentTable(props: IncidentTableProps): JSX.Element`.
2. `IncidentRow` must include: `detected_at: string`, `resolved_at: string | null`, `mttr_minutes: number | null`, `error_type: string`.
3. `IncidentTableProps` must include: `incidents: IncidentRow[]`.
4. `IncidentTable` must render incidents sorted descending by `detected_at`; sort must be applied with `[...props.incidents].sort((a, b) => b.detected_at.localeCompare(a.detected_at))` inline (no `useMemo`, no signal - this is a pure props transformation with no reactive dependency).
5. The table must have columns in this order: "Detected At" | "Resolved At" | "MTTR" | "Error Type".
6. The "Detected At" cell must display `new Date(row.detected_at).toLocaleString()`.
7. The "Resolved At" cell must display `new Date(row.resolved_at).toLocaleString()` when `resolved_at` is not null, or a `<span className="text-amber-600">Unresolved</span>` when `resolved_at` is null.
8. The "MTTR" cell must display `"${row.mttr_minutes} min"` when `mttr_minutes` is not null, or `"-"` when null.
9. The "Error Type" cell must render `<Badge variant="secondary">{row.error_type}</Badge>`.
10. The table must render a `<TableCaption>` containing `"{n} incident{s}"` where `n = incidents.length` and the plural suffix `"s"` is omitted when `n === 1`.
11. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- `IncidentRow` is defined locally (not imported from `src/types/api.ts`) because the api.ts inline type lacks a name. The shapes are structurally identical so TypeScript accepts passing `data.incidents` as `IncidentRow[]` without casting.
- Sort with `localeCompare` on ISO date strings: ISO-8601 strings sort correctly lexicographically. No `Date` parsing needed for the comparator.
- Inline sort (no `useMemo`): `IncidentTable` has no signals and no reactive state. The sort runs on every render, which is acceptable for the typical incident count (single digits). Premature memoization would add noise with no benefit.
- `Badge variant="secondary"`: error type is informational, not destructive. The secondary (muted) variant matches the label style.

**Design**

```tsx
// src/components/kpis/IncidentTable.tsx  (new file)
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption } from '../ui/table'
import { Badge } from '../ui/badge'

export interface IncidentRow {
  detected_at: string
  resolved_at: string | null
  mttr_minutes: number | null
  error_type: string
}

export interface IncidentTableProps {
  incidents: IncidentRow[]
}

export function IncidentTable({ incidents }: IncidentTableProps): JSX.Element
// sorted = [...incidents].sort((a, b) => b.detected_at.localeCompare(a.detected_at))
// <Table>
//   <TableCaption>"{n} incident(s)"</TableCaption>
//   <TableHeader><TableRow>4 x <TableHead /></TableRow></TableHeader>
//   <TableBody>
//     {sorted.map((row, i) => (
//       <TableRow key={i}>
//         <TableCell>{new Date(row.detected_at).toLocaleString()}</TableCell>
//         <TableCell>{row.resolved_at ? new Date(row.resolved_at).toLocaleString() : <span className="text-amber-600">Unresolved</span>}</TableCell>
//         <TableCell>{row.mttr_minutes !== null ? `${row.mttr_minutes} min` : '-'}</TableCell>
//         <TableCell><Badge variant="secondary">{row.error_type}</Badge></TableCell>
//       </TableRow>
//     ))}
//   </TableBody>
// </Table>
```

**Acceptance criteria**

1. Given incidents with `detected_at` values `"2024-01-03"`, `"2024-01-01"`, `"2024-01-02"`, the rendered rows appear in order: Jan 3, Jan 2, Jan 1 (descending).
2. A row with `resolved_at = null` shows `"Unresolved"` with `text-amber-600` class in the Resolved At cell.
3. A row with `resolved_at = "2024-01-03T12:00:00Z"` shows a formatted date string (not `"Unresolved"`) in the Resolved At cell.
4. A row with `mttr_minutes = null` shows `"-"` in the MTTR cell.
5. A row with `mttr_minutes = 42` shows `"42 min"` in the MTTR cell.
6. The Error Type cell renders a `<Badge>` element containing the error type string.
7. The `<TableCaption>` shows `"1 incident"` (no "s") when `incidents.length === 1`.
8. The `<TableCaption>` shows `"3 incidents"` when `incidents.length === 3`.

**Test Plan**

- `src/components/kpis/IncidentTable.test.tsx` (new)
  - Scenario: rows render sorted descending by `detected_at`.
  - Scenario: `resolved_at = null` shows "Unresolved" in amber.
  - Scenario: `resolved_at` not null shows a formatted date.
  - Scenario: `mttr_minutes = null` shows "-".
  - Scenario: `mttr_minutes = 42` shows "42 min".
  - Scenario: Error Type column renders a Badge with the correct text.
  - Scenario: caption shows singular "1 incident" vs. plural "3 incidents".

**Files**

- `src/components/kpis/IncidentTable.tsx` (new) - descending-sorted incident log with amber unresolved state and Badge error types
- `src/components/kpis/IncidentTable.test.tsx` (new) - sort, null state, plural caption, and Badge tests

---

## T-4: Reliability section organism

**Context**

Implements SPEC §3 `src/components/sections/Reliability.tsx` - the section organism that fetches `ReliabilityResponse` and renders 8 KpiCards, 2 chart rows, and an optional IncidentTable. Follow the same structure as `src/components/sections/Overview.tsx` (WP-05 T-8) for the query, loading skeleton, and Section wrapper pattern.

Before starting, read:
- `src/components/sections/Overview.tsx` - the query pattern (`useQuery`, `filterQueryParams.value`, typed `useQuery<T>`, Skeleton fallback), the Section wrapper usage, and the figure/figcaption chart layout
- `src/types/api.ts` - `ReliabilityResponse` interface (field names used throughout this component)
- `src/components/kpis/KpiCard.tsx` (T-2) - `KpiCardProps` including `statusDot`
- `src/components/charts/AreaChart.tsx` - `AreaChartProps` and `AreaChartSeries` interfaces
- `src/components/charts/DonutChart.tsx` - `DonutChartSlice` and `DonutChartProps`
- `src/components/charts/Heatmap.tsx` (T-1) - `HeatmapProps`
- `src/components/kpis/IncidentTable.tsx` (T-3) - `IncidentTableProps`
- `src/lib/kpi/formulas.ts` (T-2) - `computeErrorRateSeverity`, `computeDeltaPercent`
- `src/lib/kpi/formatters.ts` - `formatCurrency`, `formatPercent`, `formatDuration`, `formatNumber`
- `src/lib/filters/filterSignals.ts` - `filterQueryParams` signal

**Requirements**

1. Create `src/components/sections/Reliability.tsx` exporting `function Reliability(): JSX.Element`.
2. `Reliability` must use `useQuery<ReliabilityResponse>` with `queryKey: ['reliability', filterQueryParams.value]`, `queryFn` calling `/api/analytics/reliability?from=...&to=...` (using the same `buildQueryParams` helper pattern as `Overview.tsx`), and `refetchInterval: 30_000`.
3. The `buildQueryParams` function must be hoisted outside the component body (it takes only a params object, no closure over component scope) per ARCHITECTURE.md §4.4.
4. All rendering must be inside `<Section id="reliability" labelledBy="reliability-heading">` with `<h2 id="reliability-heading">Reliability</h2>`.
5. **Loading state** (when `query.isLoading`): render 8 `<Skeleton className="h-10 w-full" />` elements and 2 `<Skeleton className="h-48 w-full" />` elements.
6. **Row 1** (4-column grid): KpiCards for Error Rate, Timeout Rate, P50 Duration, P95 Duration.
7. **Row 2** (4-column grid): KpiCards for P99 Duration, Retry Rate, MTTR, Cost of Failed Runs.
8. The Error Rate KpiCard must pass `statusDot={computeErrorRateSeverity(data.error_rate)}` and `delta={-computeDeltaPercent(data.error_rate, data.error_rate_prior)}` (negated: rate decrease = green badge).
9. The Timeout Rate KpiCard must show `formatPercent(data.timeout_rate * 100)` as its value; no `delta` prop (no prior value in `ReliabilityResponse`).
10. The P50 Duration KpiCard must show `formatDuration(data.p50_duration_ms)` as its value and `formatDuration(data.queue_wait_ms)` as its `subValue` prefixed with `"Queue wait: "`.
11. The P95 Duration KpiCard must show `formatDuration(data.p95_duration_ms)`.
12. The P99 Duration KpiCard must show `formatDuration(data.p99_duration_ms)`.
13. The Retry Rate KpiCard must show `formatPercent(data.retry_rate * 100)`.
14. The MTTR KpiCard must show `"No incidents"` as its value when `data.mttr_minutes === null`, or `"${data.mttr_minutes} min"` otherwise.
15. The Cost of Failed Runs KpiCard must show `formatCurrency(data.cost_of_failed_runs)` as its value; no `subValue` percentage (field absent from `ReliabilityResponse`).
16. **Chart row** (2-column grid): an AreaChart figure (error trend, with reference line at 0.05) and a DonutChart figure (error type breakdown).
17. The AreaChart must receive `series={[{ id: 'error_rate', label: 'Error Rate (7d avg)', data: data.error_trend_7d.map(p => ({ date: p.date, value: p.error_rate })) }]}` and `referenceLine={{ value: 0.05, label: '5% threshold' }}`.
18. The DonutChart must receive `slices={data.error_type_breakdown.map(e => ({ label: e.type, value: e.count }))}`.
19. **Availability row** (heatmap figure, then conditional IncidentTable): the Heatmap figure must show `platform_availability` as a percentage in its `<figcaption>`: `"Platform availability - {formatPercent(data.platform_availability * 100)}"`.
20. The Heatmap must receive `data={data.availability_by_day}` and `colorScale="availability"` and `ariaLabel="Platform availability calendar"`.
21. `<IncidentTable incidents={data.incidents} />` must be rendered when `data.incidents.length > 0`; it must not appear in the DOM when `data.incidents` is empty.
22. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- Two 4-column grid rows for 8 KpiCards: Row 1 = Error Rate, Timeout Rate, P50, P95; Row 2 = P99, Retry Rate, MTTR, Cost of Failed Runs. This satisfies AC #1 (8 total) while using 4-column grids matching Overview's layout.
- Error rate delta negation: `delta={-computeDeltaPercent(data.error_rate, data.error_rate_prior)}`. Error rate decreasing is good (green badge). Same negation pattern used for `total_cost` in `Overview.tsx`.
- Queue Wait Time as P50 `subValue`: `ReliabilityResponse` has `queue_wait_ms` but AC #1 lists no "Queue Wait Time" KpiCard. Surfacing it as `subValue` on P50 Duration avoids losing the data without adding a 9th card.
- `failed_run_cost_pct` is absent from `ReliabilityResponse`. AC #9 specifies a subValue showing percentage. Since the field does not exist, `subValue` is omitted from Cost of Failed Runs. Tests verify dollar amount only.
- `refetchInterval: 30_000`: Reliability data is live (error rates change in near real-time). This matches the SPEC interaction diagram.
- `platform_availability` is a number in 0-1 range (e.g., 0.997 = 99.7%). Multiply by 100 for `formatPercent`.

**Design**

```tsx
// src/components/sections/Reliability.tsx  (new file)
import { useQuery } from '@tanstack/react-query'
import { filterQueryParams } from '../../lib/filters/filterSignals'
import { Section } from '../layout/Section'
import { KpiCard } from '../kpis/KpiCard'
import { AreaChart } from '../charts/AreaChart'
import { DonutChart } from '../charts/DonutChart'
import { Heatmap } from '../charts/Heatmap'
import { IncidentTable } from '../kpis/IncidentTable'
import { Skeleton } from '../ui/skeleton'
import { computeErrorRateSeverity, computeDeltaPercent } from '../../lib/kpi/formulas'
import { formatCurrency, formatPercent, formatDuration } from '../../lib/kpi/formatters'
import type { ReliabilityResponse } from '../../types/api'

// Hoisted - no closure over component scope.
function buildQueryParams(params: { from: string; to: string; team_id?: string }): string

export function Reliability(): JSX.Element
// const params = filterQueryParams.value
// const query = useQuery<ReliabilityResponse>({
//   queryKey: ['reliability', params],
//   queryFn: () => fetch('/api/analytics/reliability?' + buildQueryParams(params)).then(r => r.json()),
//   refetchInterval: 30_000,
// })
// const d = query.data
// <Section id="reliability" labelledBy="reliability-heading">
//   <h2 id="reliability-heading">Reliability</h2>
//   {query.isLoading ? <skeletons> : (
//     <>
//       {/* Row 1: 4 KpiCards */}
//       {/* Row 2: 4 KpiCards */}
//       {/* Chart row: AreaChart + DonutChart */}
//       {/* Availability row: Heatmap + conditional IncidentTable */}
//     </>
//   )}
// </Section>
```

**Acceptance criteria**

1. When the query returns data, exactly 8 KpiCard elements are present in the DOM.
2. The Error Rate KpiCard renders a status dot; when `error_rate = 0.06` the dot has class `bg-red-500`.
3. The error trend AreaChart contains a `<line>` element (the reference line from Annotation at y=0.05).
4. The DonutChart renders exactly as many `<path>` arcs as `error_type_breakdown.length` (typically 4).
5. The Heatmap figure `<figcaption>` contains `"Platform availability -"` and the formatted percentage.
6. The Heatmap renders one `<rect>` per entry in `availability_by_day`.
7. When `incidents.length === 0`, no IncidentTable is in the DOM.
8. When `incidents.length > 0`, an IncidentTable is in the DOM.
9. The MTTR KpiCard shows `"No incidents"` when `mttr_minutes` is null.
10. While `query.isLoading` is true, Skeleton elements are present and no KpiCard is rendered.

**Test Plan**

- `src/components/sections/Reliability.test.tsx` (new)
  - Scenario: query success renders 8 KpiCards.
  - Scenario: Error Rate card has red status dot when `error_rate >= 0.05`.
  - Scenario: Error Rate card has green status dot when `error_rate < 0.02`.
  - Scenario: AreaChart is present in the DOM.
  - Scenario: DonutChart is present in the DOM.
  - Scenario: `incidents = []` renders no IncidentTable.
  - Scenario: `incidents` with entries renders IncidentTable.
  - Scenario: MTTR KpiCard shows "No incidents" when `mttr_minutes` is null.
  - Scenario: loading state renders Skeleton elements, no KpiCards.

**Files**

- `src/components/sections/Reliability.tsx` (new) - section organism fetching ReliabilityResponse with 8 KpiCards, 2 charts, heatmap, and conditional incident log
- `src/components/sections/Reliability.test.tsx` (new) - KpiCard count, status dot, chart presence, incident toggle, MTTR null state, and loading state tests

---

## Implementation order table

| Done | Priority | Task | Depends on | Effort |
|------|----------|------|------------|--------|
| [ ]  | 1        | T-1: Heatmap chart wrapper | - | Medium |
| [ ]  | 2        | T-2: computeErrorRateSeverity + statusDot | - | Small |
| [ ]  | 3        | T-3: IncidentTable component | WP-06 T-1, T-2 | Small |
| [ ]  | 4        | T-4: Reliability section | T-1, T-2, T-3, WP-05 T-4, WP-05 T-5 | Large |
