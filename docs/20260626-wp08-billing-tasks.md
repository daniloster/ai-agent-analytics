# TASKS: WP-08 - Section 4: Billing & Financial

**SPEC:** `docs/20260626-wp08-billing-spec.md`
**Date:** 2026-06-26

---

## Known SPEC discrepancies resolved before implementation

Read this section first. The SPEC data model and referenced components differ from the actual codebase.

| SPEC field / claim | Actual state | Resolution |
|---|---|---|
| `failed_run_cost` | api.ts field is `cost_of_failed_runs` | Use `data.cost_of_failed_runs` |
| `failed_run_cost_pct` | Absent from `BillingResponse` in api.ts | Compute: `(cost_of_failed_runs / current_month_spend) * 100` |
| `quality_cost_efficiency`, `churn_risk_count`, `new_user_activation_cost` | In `OverviewResponse`, not `BillingResponse` | Add second `useQuery<OverviewResponse>` in Billing.tsx |
| `daily_actuals` | Absent from `BillingResponse` | Use `invoice_history` (6 monthly totals) as the actual series in the AreaChart |
| BarChart `trendLine` prop | `BarChart.tsx` is horizontal HTML divs; no SVG, no LinePath | Use `ColumnChart.tsx` (WP-06 T-2) with the `trendLine` extension from T-2 |
| Heatmap data type `{ date, uptime_pct }` | WP-07 T-1 used this specific field name; `cost_anomaly_days` has different fields | T-3 generalizes Heatmap before either section implements it |
| `computeProjectedAnnualSpend`, `computeCostPerSuccessfulRun` | `BillingResponse` already has pre-computed `projected_annual_spend` and `cost_per_successful_run` | Functions are still created per SPEC (tested, documented); Billing.tsx uses pre-computed values |

---

## T-1: Billing formula functions

**Context**

Implements SPEC §3 (modified files): adds three pure functions to `src/lib/kpi/formulas.ts`. These functions document the business logic even when `BillingResponse` already carries pre-computed equivalents. They also enable future client-side recomputation if the API response changes.

Before starting, read:
- `src/lib/kpi/formulas.ts` - existing pure functions to understand the file's style (guard clauses, no imports, all inputs as params)
- `src/lib/kpi/formulas.test.ts` - existing test style (describe block, straightforward assertions)

**Requirements**

1. Add `export function computeProjectedAnnualSpend(cost90d: number): number` to `src/lib/kpi/formulas.ts`; it must return `(cost90d / 90) * 365`.
2. `computeProjectedAnnualSpend(0)` must return `0`.
3. Add `export function computeTokenRateEfficiency(totalTokenCost: number, totalTokens: number): number` to `src/lib/kpi/formulas.ts`; it must return `totalTokenCost / (totalTokens / 1_000_000)`.
4. `computeTokenRateEfficiency` must return `0` when `totalTokens === 0` (guard against division by zero).
5. Add `export function computeCostPerSuccessfulRun(totalCost: number, successfulRunCount: number): number` to `src/lib/kpi/formulas.ts`; it must return `totalCost / successfulRunCount`.
6. `computeCostPerSuccessfulRun` must return `0` when `successfulRunCount === 0` (guard against division by zero).
7. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- All three functions are pure with no imports. Add them at the end of `formulas.ts` in alphabetical order (after `computeRetentionCost`).
- `computeProjectedAnnualSpend` has no zero-guard: `cost90d = 0` correctly returns `0` without a guard.
- `computeTokenRateEfficiency` divides by `totalTokens / 1_000_000`; the guard checks `totalTokens === 0` before the division.
- `computeCostPerSuccessfulRun` guards on `successfulRunCount === 0`.

**Design**

```ts
// src/lib/kpi/formulas.ts  (modified - append after computeRetentionCost)

export function computeProjectedAnnualSpend(cost90d: number): number
// Returns: (cost90d / 90) * 365

export function computeTokenRateEfficiency(totalTokenCost: number, totalTokens: number): number
// Guard: totalTokens === 0 -> return 0
// Returns: totalTokenCost / (totalTokens / 1_000_000)

export function computeCostPerSuccessfulRun(totalCost: number, successfulRunCount: number): number
// Guard: successfulRunCount === 0 -> return 0
// Returns: totalCost / successfulRunCount
```

**Acceptance criteria**

1. `computeProjectedAnnualSpend(38780)` returns approximately `157,300` (within 1 of `(38780 / 90) * 365`).
2. `computeProjectedAnnualSpend(0)` returns `0`.
3. `computeTokenRateEfficiency(3, 1_000_000)` returns `3.0`.
4. `computeTokenRateEfficiency(0, 0)` returns `0`.
5. `computeCostPerSuccessfulRun(14200, 11720)` returns approximately `1.212...`.
6. `computeCostPerSuccessfulRun(0, 0)` returns `0`.

**Test Plan**

- `src/lib/kpi/formulas.test.ts` (modified - add cases)
  - Scenario: `computeProjectedAnnualSpend(38780)` matches expected value.
  - Scenario: `computeProjectedAnnualSpend(0)` returns 0.
  - Scenario: `computeTokenRateEfficiency(3, 1_000_000)` returns 3.0.
  - Scenario: `computeTokenRateEfficiency(0, 0)` returns 0 (zero guard).
  - Scenario: `computeCostPerSuccessfulRun` with non-zero inputs returns correct quotient.
  - Scenario: `computeCostPerSuccessfulRun(0, 0)` returns 0 (zero guard).

**Files**

- `src/lib/kpi/formulas.ts` (modified) - three new billing formula functions
- `src/lib/kpi/formulas.test.ts` (modified) - six new test cases

---

## T-2: Chart component extensions - ColumnChart trendLine and AreaChart dashed series

**Context**

Implements two per-prop extensions required by the Billing section (T-6):

1. `ColumnChart.tsx` (WP-06 T-2): adds `trendLine?: boolean` so the invoice history chart can overlay a trend line across bar midpoints.
2. `AreaChart.tsx` and `Area.tsx` (WP-05 T-6): adds `dashed?: boolean` to `AreaChartSeries` so the projected-spend series renders with a dashed stroke distinct from the actual series.

These are grouped because they are both "existing chart component extensions" that must be done before T-6 (Billing) and touch few files each.

Before starting, read:
- `src/components/charts/ColumnChart.tsx` (WP-06 T-2) - current `ColumnChartProps`, data signal key (`"bars"`), and children callback structure
- `src/components/charts/VisualizationContext.tsx` - the context object shape; specifically `dataSignal`, `scales`, `tokens` fields
- `src/components/charts/Visualization.tsx` - verify `scales` is `ReadonlySignal<Record<string, AnyD3Scale>>`
- `src/components/charts/marks/Line.tsx` - line rendering via `<LinePath>` from `@visx/shape`
- `src/components/charts/AreaChart.tsx` - `AreaChartSeries` interface and where `<Area>` marks are rendered
- `src/components/charts/marks/Area.tsx` - `AreaProps` interface (extends `LineProps`) and the `<AreaClosed>` render call

**Requirements**

1. Add `trendLine?: boolean` to `ColumnChartProps` in `src/components/charts/ColumnChart.tsx`.
2. Add a non-exported inner `function ColumnTrendLine({ series, axis }: { series: string; axis: string }): JSX.Element | null` inside `ColumnChart.tsx`.
3. `ColumnTrendLine` must call `useVisualizationContext()` from `src/components/charts/VisualizationContext.tsx` and import `LinePath` from `@visx/shape`.
4. `ColumnTrendLine` must read `dataSignal.value[series]` as `ColumnChartBar[]`, `scales.value[axis]` as the y-scale, and `scales.value['x']` as the band scale.
5. `ColumnTrendLine` must cast the band scale to `{ (v: unknown): number | undefined; bandwidth(): number }` to call `bandwidth()`; the x position of each point must be `(xBandScale(bar.label) ?? 0) + xBandScale.bandwidth() / 2` (center of each band).
6. `ColumnTrendLine` must return `null` when `dataSignal.value[series]` is empty or when either scale is absent.
7. `ColumnTrendLine` must render `<LinePath>` with `stroke={tokens.muted}`, `strokeWidth={2}`, `fill="none"`.
8. When `props.trendLine === true`, `ColumnChart` must render `<ColumnTrendLine series="bars" axis="y" />` as a sibling of `<Bar>` inside the Visualization children callback.
9. `ColumnTrendLine` is only rendered when `trendLine={true}`; no `<ColumnTrendLine>` element appears in the DOM when the prop is absent or false.
10. Add `dashed?: boolean` to `AreaChartSeries` in `src/components/charts/AreaChart.tsx`.
11. In `AreaChart.tsx`, pass `dashed={s.dashed}` to each `<Area>` mark: `<Area key={s.id} series={s.id} axis="y" color={s.color} dashed={s.dashed} />`.
12. Add `dashed?: boolean` to `AreaProps` in `src/components/charts/marks/Area.tsx`.
13. When `props.dashed === true`, the `<AreaClosed>` element in `Area.tsx` must render with `strokeDasharray="4 2"`.
14. When `props.dashed` is absent or false, `<AreaClosed>` renders with no `strokeDasharray` attribute (existing behavior unchanged).
15. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- `ColumnTrendLine` uses `useVisualizationContext()` because it must be rendered inside a `Visualization` context (the ColumnChart's Visualization provider). It cannot use props directly because it needs access to the built scales (the band scale is built inside Visualization, not exposed in props).
- The band scale for x is registered with axis id `'x'` in ColumnChart's `useMemo` axes definition. `scales.value['x']` retrieves it. Cast to access `bandwidth()`: TypeScript types it as `AnyD3Scale` which is a union; the cast is safe because ColumnChart always uses `type: 'band'` for its x-axis.
- `ColumnTrendLine` is NOT hoisted outside ColumnChart (per ARCHITECTURE §4.4 rule: hoist only when the function does not close over component scope). `ColumnTrendLine` calls `useVisualizationContext()` which is a hook - it must be a component function, not a module-level function.
- `dashed?: boolean` on `AreaProps` is passed through `AreaChartSeries.dashed` → `<Area dashed>` → `<AreaClosed strokeDasharray="4 2">`. The `AreaClosed` element from `@visx/shape` accepts `strokeDasharray` as an SVG prop.
- Existing `AreaChart` tests must not break: `dashed` defaults to `undefined` which is falsy, so `strokeDasharray` is absent from existing render calls.

**Design**

```tsx
// src/components/charts/ColumnChart.tsx  (modified)
import { LinePath } from '@visx/shape'
import { useVisualizationContext } from './VisualizationContext'

// Add to ColumnChartProps:
//   trendLine?: boolean

// New inner component (not exported):
function ColumnTrendLine({ series, axis }: { series: string; axis: string }): JSX.Element | null
// const { dataSignal, scales, tokens } = useVisualizationContext()
// const data = dataSignal.value[series] as ColumnChartBar[]
// const yScale = scales.value[axis]
// const xBandScale = scales.value['x'] as { (v: unknown): number | undefined; bandwidth(): number }
// if (!yScale || !xBandScale || data.length === 0) return null
// const bw = xBandScale.bandwidth()
// return <LinePath data={data} x={(d) => (xBandScale(d.label) ?? 0) + bw / 2} y={(d) => yScale(d.value)} stroke={tokens.muted} strokeWidth={2} fill="none" />

// In ColumnChart children callback, add after Bar:
//   {props.trendLine && <ColumnTrendLine series="bars" axis="y" />}
```

```tsx
// src/components/charts/AreaChart.tsx  (modified)

export interface AreaChartSeries {
  id: string
  label: string
  data: Array<{ date: string; value: number }>
  color?: string
  dashed?: boolean   // NEW
}

// In the Area render: add dashed={s.dashed}
// <Area key={s.id} series={s.id} axis="y" color={s.color} dashed={s.dashed} />
```

```tsx
// src/components/charts/marks/Area.tsx  (modified)

export interface AreaProps<...> extends LineProps<...> {
  fillOpacity?: number
  dashed?: boolean   // NEW
}

// In <AreaClosed>: add strokeDasharray={props.dashed ? '4 2' : undefined}
```

**Acceptance criteria**

1. `<ColumnChart bars={[{label:'A',value:10},{label:'B',value:20}]} trendLine={true} />` renders a `<path>` element from `LinePath` (the trend line) alongside the bar rects.
2. `<ColumnChart bars={[...]} />` (no `trendLine` prop) renders no additional `<path>` from `LinePath`.
3. The trend line's `stroke` attribute matches `tokens.muted` color.
4. The trend line x positions are centered on each bar column (not at the left edge).
5. `<AreaChart series={[{ id:'s1', label:'Actual', data:[...], dashed: false }, { id:'s2', label:'Projected', data:[...], dashed: true }]} />` renders two `<path>` elements; the projected series path has `stroke-dasharray="4 2"`.
6. An `AreaChart` series with `dashed: false` (or no `dashed` prop) renders without `stroke-dasharray`.

**Test Plan**

- `src/components/charts/ColumnChart.test.tsx` (modified - add cases)
  - Scenario: `trendLine={true}` renders a LinePath `<path>` element.
  - Scenario: no `trendLine` prop renders no LinePath path.
  - Scenario: trend line x positions are between the leftmost and rightmost bar positions (centred).

- `src/components/charts/AreaChart.test.tsx` (modified - add cases)
  - Scenario: series with `dashed: true` produces a path with `stroke-dasharray="4 2"`.
  - Scenario: series without `dashed` prop produces a path with no `stroke-dasharray`.

- `src/components/charts/marks/Area.test.tsx` (modified - add cases)
  - Scenario: `<Area dashed={true} .../>` renders `<AreaClosed>` with `strokeDasharray="4 2"`.
  - Scenario: `<Area dashed={false} .../>` renders no `strokeDasharray`.

**Files**

- `src/components/charts/ColumnChart.tsx` (modified) - adds `trendLine` prop and inner `ColumnTrendLine` component
- `src/components/charts/ColumnChart.test.tsx` (modified) - trend line rendering and positioning tests
- `src/components/charts/AreaChart.tsx` (modified) - adds `dashed` to `AreaChartSeries`
- `src/components/charts/marks/Area.tsx` (modified) - adds `dashed` prop and `strokeDasharray` rendering
- `src/components/charts/AreaChart.test.tsx` (modified) - dashed vs solid series tests
- `src/components/charts/marks/Area.test.tsx` (modified) - `strokeDasharray` rendering tests

---

## T-3: Generalize Heatmap data interface

**Context**

WP-07 T-1 designed `src/components/charts/Heatmap.tsx` with `data: Array<{ date: string; uptime_pct: number }>`. WP-08's billing cost anomaly heatmap needs `{ date, daily_cost, is_anomaly, avg_daily_cost }` - different field names and an `isAnomaly` boolean for color logic. This task generalizes the Heatmap interface to `{ date: string; value: number } & Record<string, unknown>` before either consumer (Reliability or Billing) is implemented.

**If WP-07 T-1 has not yet been implemented:** implement `src/components/charts/Heatmap.tsx` with the generic interface specified here instead of the `uptime_pct`-specific interface from WP-07 T-1. Mark WP-07 T-1 as superseded.

**If WP-07 T-1 has already been implemented:** modify `Heatmap.tsx` to use the generic interface. Also update `src/components/sections/Reliability.tsx` (WP-07 T-4) data mapping as described in Requirement 7.

Before starting, read:
- `src/components/charts/Heatmap.tsx` (WP-07 T-1, if it exists) - current `HeatmapProps` and `HeatmapCanvas` implementation to identify what changes
- `src/components/sections/Reliability.tsx` (WP-07 T-4, if it exists) - find the `availability_by_day` data mapping to update

**Requirements**

1. `HeatmapProps.data` type must be changed from `Array<{ date: string; uptime_pct: number }>` to `Array<{ date: string; value: number } & Record<string, unknown>>`.
2. Add `getAriaLabel?: (datum: { date: string; value: number } & Record<string, unknown>) => string` to `HeatmapProps`.
3. The default aria-label (when `getAriaLabel` is absent) must be `"${datum.date}: ${datum.value}"` for `colorScale === 'cost'` and `"${datum.date}: ${datum.value}% uptime"` for `colorScale === 'availability'`.
4. When `getAriaLabel` is provided, each rect's `aria-label` must use its return value instead of the default.
5. For `colorScale === 'availability'`: fill color is computed via `scaleSequential(interpolateRgb('#ef4444', '#22c55e')).domain([0, 100])` applied to `datum.value` (unchanged from WP-07 T-1, except field name is now `value` not `uptime_pct`).
6. For `colorScale === 'cost'`: fill color must be `Boolean(datum.isAnomaly) ? tokens.destructive : tokens.muted` (anomaly cells are red; normal cells are muted gray). Do NOT use a scaleSequential gradient for the cost variant.
7. If `src/components/sections/Reliability.tsx` exists and currently passes `data={data.availability_by_day}` directly to `<Heatmap>`: change it to `data={data.availability_by_day.map(d => ({ date: d.date, value: d.uptime_pct }))}` to match the new generic interface.
8. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- `{ date: string; value: number } & Record<string, unknown>` allows callers to attach extra fields (e.g. `isAnomaly`, `avgDailyCost`) that `getAriaLabel` can access via the datum. TypeScript accepts `{ date, value, isAnomaly }` as assignable to this intersection type.
- `colorScale === 'cost'` switches to binary coloring (`destructive` vs `muted`) instead of a gradient because `is_anomaly` is already a boolean classification. Using a gradient on `daily_cost` magnitude would be less readable and require knowing the max cost domain upfront.
- The WP-07 T-1 task file specified `uptime_pct` as the field name. This task supersedes that field-name choice; the logic (scaleSequential, range, domain) is unchanged.
- `getAriaLabel` defaults: availability variant appends "% uptime" because the value is a percentage. Cost variant just shows the dollar value as a number. Both defaults keep the aria-label readable without requiring all callers to pass the prop.

**Design**

```tsx
// src/components/charts/Heatmap.tsx  (modified or new)

export interface HeatmapProps {
  data: Array<{ date: string; value: number } & Record<string, unknown>>
  colorScale: 'availability' | 'cost'
  height?: number
  ariaLabel?: string
  getAriaLabel?: (datum: { date: string; value: number } & Record<string, unknown>) => string
}

// HeatmapCanvas change: datum.value replaces datum.uptime_pct throughout
// cost color logic: Boolean(datum.isAnomaly) ? tokens.destructive : tokens.muted
// aria-label per rect:
//   getAriaLabel ? getAriaLabel(datum)
//   : colorScale === 'availability' ? `${datum.date}: ${datum.value}% uptime`
//   : `${datum.date}: ${datum.value}`
```

**Acceptance criteria**

1. `<Heatmap data={[{ date: '2024-01-01', value: 100 }]} colorScale="availability" />` renders a rect with `aria-label` containing `"% uptime"`.
2. `<Heatmap data={[{ date: '2024-01-01', value: 50, isAnomaly: false }]} colorScale="cost" />` renders a rect whose fill matches `tokens.muted`.
3. `<Heatmap data={[{ date: '2024-01-01', value: 80, isAnomaly: true }]} colorScale="cost" />` renders a rect whose fill matches `tokens.destructive`.
4. A custom `getAriaLabel` overrides the default: `getAriaLabel={(d) => 'custom'}` renders a rect with `aria-label="custom"`.
5. The old `uptime_pct` field name no longer appears in `HeatmapProps` TypeScript types.

**Test Plan**

- `src/components/charts/Heatmap.test.tsx` (new or modified)
  - Scenario: `colorScale="availability"` with `value=100` renders a rect with `aria-label` containing `"% uptime"`.
  - Scenario: `colorScale="cost"` with `isAnomaly=false` renders a rect filled with muted color.
  - Scenario: `colorScale="cost"` with `isAnomaly=true` renders a rect filled with destructive color.
  - Scenario: custom `getAriaLabel` overrides default aria-label.
  - Scenario: empty data renders without throwing.

**Files**

- `src/components/charts/Heatmap.tsx` (modified or new) - generalized data type, `getAriaLabel` prop, binary cost coloring
- `src/components/charts/Heatmap.test.tsx` (new or modified) - generic data, cost coloring, and custom aria-label tests
- `src/components/sections/Reliability.tsx` (modified, if exists) - updates availability_by_day mapping to use `value` field

---

## T-4: GaugeChart component

**Context**

Creates `src/components/charts/GaugeChart.tsx` - a 180-degree semicircle progress arc for Budget Utilization (KPI-38). The SPEC defines it as a NEW chart type distinct from DonutChart; a `Gauge` mark (in `marks/Gauge.tsx`) already exists inside the Visualization system, but GaugeChart is a standalone wrapper that bypasses Visualization - the same pattern used by `DonutChart.tsx` which uses `@visx/shape Pie` directly.

Before starting, read:
- `src/components/charts/marks/Gauge.tsx` - understand the semicircle arc geometry (`startAngle=-PI/2, endAngle=PI/2`, `cx = width/2`, `cy = height` as the flat-edge center, threshold logic)
- `src/components/charts/DonutChart.tsx` - the wrapper pattern: fixed `size` prop, direct `Pie` rendering, `useChartTokens()` call
- `src/components/charts/primitives/ParentSizeComputed.tsx` - responsive width container providing `ReadonlySignal<number>` to children

**Requirements**

1. Create `src/components/charts/GaugeChart.tsx` exporting `GaugeChartProps` and `function GaugeChart(props: GaugeChartProps): JSX.Element`.
2. `GaugeChartProps` must include: `value: number` (0-100), `label: string`, `subLabel?: string`, `tokens: ChartTokens`, `height?: number`.
3. `GaugeChart` must use `ParentSizeComputed` with `heightOverride={height ?? 160}` to measure responsive width; it must pass `widthSig` and `height` to an inner `GaugeCanvas` component.
4. Define a non-exported inner `function GaugeCanvas(...)` that accepts `value`, `label`, `subLabel`, `tokens`, `width: ReadonlySignal<number>`, and `height: number`; it must read `width.value` inside its render body so the Babel signals transformer injects `useSignals()` and the component re-renders when the container width changes.
5. `GaugeCanvas` must return `null` when `width.value === 0`.
6. `GaugeCanvas` must compute: `const cx = width.value / 2`, `const cy = height` (flat-edge bottom), `const outerRadius = Math.min(cx, cy) * 0.85`, `const innerRadius = outerRadius * 0.65`.
7. `GaugeCanvas` must render an SVG with `width={width.value}` and `height={height}`.
8. Inside the SVG, render `<Pie>` from `@visx/shape` with `data={[value, Math.max(0, 100 - value)]}`, `pieValue={(d) => d}`, `startAngle={-Math.PI / 2}`, `endAngle={Math.PI / 2}`, `top={cy}`, `left={cx}`, `pieSort={null}`, `pieSortValues={null}`.
9. The `<Pie>` must render two arcs: `i === 0` (foreground, value arc) uses `fill={value > 90 ? tokens.destructive : tokens.primary}`; `i === 1` (background arc) uses `fill={tokens.muted}`.
10. Inside the SVG, below the `<Pie>`, render a `<text>` for `label` at `x={cx}`, `y={cy}`, `dy="-0.5em"`, `textAnchor="middle"`, `fontWeight="bold"`, `fill={tokens.primary}`.
11. When `subLabel` is provided, render a second `<text>` at `x={cx}`, `y={cy}`, `dy="1.2em"`, `textAnchor="middle"`, `fontSize={12}`, `fill={tokens.muted}`.
12. The outer `GaugeChart` must render `<figure aria-label={label}>` wrapping `<ParentSizeComputed>`.
13. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- `tokens` is passed as a prop (not obtained via `useChartTokens()` inside `GaugeChart`) because the SPEC explicitly defines it in `GaugeChartProps`. This makes the component testable without mocking the hook and lets the Billing section determine the token source. The caller (`Billing.tsx`) calls `useChartTokens()` and passes the result.
- `GaugeCanvas` as a separate inner component: same reason as in `Heatmap.tsx` (WP-07 T-1) - reading `width.value` in a render prop callback does not get the Babel signals transform, so the component must be a real function component.
- Semicircle geometry: `cy = height` places the circle center at the bottom of the SVG; `startAngle=-PI/2, endAngle=PI/2` draws the top semicircle from left to right. The foreground arc fills clockwise from `-PI/2` to the angle corresponding to `value / 100`.
- The `Pie` from `@visx/shape` handles arc interpolation; passing `[value, 100 - value]` with `startAngle` and `endAngle` constrains the pie to a semicircle.

**Design**

```tsx
// src/components/charts/GaugeChart.tsx  (new file)
import { Pie } from '@visx/shape'
import type { ReadonlySignal } from '@preact/signals-react'
import { ParentSizeComputed } from './primitives/ParentSizeComputed'
import type { ChartTokens } from './primitives/useChartTokens'

export interface GaugeChartProps {
  value: number          // 0-100
  label: string          // center label, e.g. "65.3%"
  subLabel?: string      // sub-label, e.g. "of $15,000 budget"
  tokens: ChartTokens
  height?: number        // defaults to 160
}

interface GaugeCanvasProps {
  value: number
  label: string
  subLabel?: string
  tokens: ChartTokens
  width: ReadonlySignal<number>
  height: number
}

// Inner component — Babel transformer injects useSignals() here for reactive width.
function GaugeCanvas({ value, label, subLabel, tokens, width, height }: GaugeCanvasProps): JSX.Element | null
// Guard: if (width.value === 0) return null
// const cx = width.value / 2
// const cy = height
// const outerRadius = Math.min(cx, cy) * 0.85
// const innerRadius = outerRadius * 0.65
// const progressColor = value > 90 ? tokens.destructive : tokens.primary
// return <svg ...><Pie data={[value, max(0, 100-value)]} startAngle={-PI/2} endAngle={PI/2} top={cy} left={cx} ...>
//   {({arcs, path}) => arcs.map((arc, i) => <path key={i} d={path(arc)} fill={i===0 ? progressColor : tokens.muted} />)}
// </Pie>
// <text x={cx} y={cy} dy="-0.5em" textAnchor="middle" fontWeight="bold" fill={tokens.primary}>{label}</text>
// {subLabel && <text x={cx} y={cy} dy="1.2em" ...>{subLabel}</text>}
// </svg>

export function GaugeChart({ value, label, subLabel, tokens, height = 160 }: GaugeChartProps): JSX.Element
// return (
//   <figure aria-label={label}>
//     <ParentSizeComputed heightOverride={height}>
//       {(widthSig) => (
//         <GaugeCanvas value={value} label={label} subLabel={subLabel} tokens={tokens} width={widthSig} height={height} />
//       )}
//     </ParentSizeComputed>
//   </figure>
// )
```

**Acceptance criteria**

1. `<GaugeChart value={65} label="65%" tokens={tokens} />` renders an SVG with two `<path>` arc elements.
2. When `value={91}`, the foreground arc's `fill` attribute equals `tokens.destructive`.
3. When `value={89}`, the foreground arc's `fill` attribute equals `tokens.primary`.
4. When `value={90}`, the foreground arc's `fill` attribute equals `tokens.primary` (boundary is exclusive - only `> 90` triggers destructive).
5. The `<text>` element containing `"65%"` is rendered inside the SVG.
6. When `subLabel` is provided, a second `<text>` element with the subLabel content is rendered.
7. When `subLabel` is absent, only one `<text>` label element is rendered.
8. The `<figure>` element has `aria-label` set to the `label` prop.

**Test Plan**

- `src/components/charts/GaugeChart.test.tsx` (new)
  - Scenario: renders two path elements (foreground + background arcs).
  - Scenario: `value=91` gives foreground arc fill = `tokens.destructive`.
  - Scenario: `value=89` gives foreground arc fill = `tokens.primary`.
  - Scenario: boundary `value=90` gives primary (not destructive).
  - Scenario: label text is rendered.
  - Scenario: `subLabel` renders a second text element.
  - Scenario: absent `subLabel` renders only one text element.
  - Scenario: `value=0` does not throw (zero value edge case).

**Files**

- `src/components/charts/GaugeChart.tsx` (new) - semicircle budget utilization gauge using ParentSizeComputed + @visx/shape Pie
- `src/components/charts/GaugeChart.test.tsx` (new) - arc coloring, threshold boundary, label, and edge case tests

---

## T-5: ChargebackTable component

**Context**

Implements SPEC §3 `src/components/kpis/ChargebackTable.tsx` - a team cost allocation table with a totals row in `<tfoot>`. It uses the `Table` family and `Badge` from WP-06 T-1; that task must be complete before starting this one. Follow the same import pattern as `IncidentTable.tsx` (WP-07 T-3).

Before starting, read:
- `src/components/ui/table.tsx` (WP-06 T-1) - all exported components: `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`
- `src/components/kpis/IncidentTable.tsx` (WP-07 T-3) - pattern for table construction, inline sort, and column rendering

**Requirements**

1. Create `src/components/kpis/ChargebackTable.tsx` exporting `ChargebackRow`, `ChargebackTableProps`, and `function ChargebackTable(props: ChargebackTableProps): JSX.Element`.
2. `ChargebackRow` must include: `team_id: string`, `team_name: string`, `seat_cost_prorated: number`, `token_cost: number`, `total: number`, `percentage: number`.
3. `ChargebackTableProps` must include: `rows: ChargebackRow[]`.
4. `ChargebackTable` must sort rows descending by `total` using `[...props.rows].sort((a, b) => b.total - a.total)` inline (no `useMemo`; same justification as IncidentTable).
5. Columns must be in this order: "Team" | "Seat Cost" | "Token Cost" | "Total" | "% of Org".
6. The "Team" cell must display `row.team_name` as plain text.
7. The "Seat Cost" cell must display `formatCurrency(row.seat_cost_prorated)`.
8. The "Token Cost" cell must display `formatCurrency(row.token_cost)`.
9. The "Total" cell must display `formatCurrency(row.total)`.
10. The "% of Org" cell must display `formatPercent(row.percentage, 1)`.
11. The table must include a `<tfoot>` row with the label "Organization Total" in the first cell and summed values for Seat Cost, Token Cost, Total, and the literal "100.0%" for the percentage column.
12. The "Organization Total" totals row must be the LAST rendered row (below all sorted team rows).
13. The total row cells must use `className="font-bold"` to distinguish them visually.
14. The table must render using `<Table>`, `<TableHeader>`, `<TableBody>`, `<TableRow>`, `<TableHead>`, `<TableCell>` from `src/components/ui/table.tsx`.
15. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- `<tfoot>` for the totals row: using `<tfoot>` rather than appending a fake data row to the sorted array is semantically correct HTML. Accessibility tools read `<tfoot>` as a summary row. `Table.tsx` renders `<table>` which allows `<tfoot>` as a direct child.
- Inline sort (no `useMemo`): `ChargebackTable` receives a static array of typically 3-10 rows. Re-sorting on every render has negligible cost.
- `formatPercent` from `src/lib/kpi/formatters.ts`: `formatPercent(row.percentage, 1)` formats as `"XX.X%"`. The totals row always shows `"100.0%"` as a literal string (no computed percentage).
- Sums: compute `sumSeat`, `sumToken`, `sumTotal` with `props.rows.reduce(...)` above the return statement (not in JSX). These sums must NOT use the sorted array - sum the original `props.rows` to avoid floating-point drift from sort mutation. Actually since we use `[...props.rows].sort(...)` (copy), the original is unaffected; summing either is equivalent. Sum `props.rows` for clarity.

**Design**

```tsx
// src/components/kpis/ChargebackTable.tsx  (new file)
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table'
import { formatCurrency, formatPercent } from '../../lib/kpi/formatters'

export interface ChargebackRow {
  team_id: string
  team_name: string
  seat_cost_prorated: number
  token_cost: number
  total: number
  percentage: number
}

export interface ChargebackTableProps {
  rows: ChargebackRow[]
}

export function ChargebackTable({ rows }: ChargebackTableProps): JSX.Element
// sorted = [...rows].sort((a, b) => b.total - a.total)
// sumSeat = rows.reduce((s, r) => s + r.seat_cost_prorated, 0)
// sumToken = rows.reduce((s, r) => s + r.token_cost, 0)
// sumTotal = rows.reduce((s, r) => s + r.total, 0)
// return (
//   <Table>
//     <TableHeader><TableRow>5 x <TableHead /></TableRow></TableHeader>
//     <TableBody>
//       {sorted.map(r => <TableRow key={r.team_id}><TableCell>{r.team_name}</TableCell>...</TableRow>)}
//     </TableBody>
//     <tfoot>
//       <TableRow>
//         <TableCell className="font-bold">Organization Total</TableCell>
//         <TableCell className="font-bold">{formatCurrency(sumSeat)}</TableCell>
//         <TableCell className="font-bold">{formatCurrency(sumToken)}</TableCell>
//         <TableCell className="font-bold">{formatCurrency(sumTotal)}</TableCell>
//         <TableCell className="font-bold">100.0%</TableCell>
//       </TableRow>
//     </tfoot>
//   </Table>
// )
```

**Acceptance criteria**

1. Given rows A (total=5000), B (total=8000), C (total=3000): rendered row order is B, A, C (descending by total).
2. The last rendered row contains "Organization Total" in the first cell.
3. Currency cells display `"$"` prefix.
4. "% of Org" cells display `"%"` suffix.
5. The totals row shows `formatCurrency(sumSeat)` in the Seat Cost column.
6. The totals row percentage column shows `"100.0%"` literally.
7. Single-row input renders one team row plus the totals row (2 rows total in the table body + tfoot).

**Test Plan**

- `src/components/kpis/ChargebackTable.test.tsx` (new)
  - Scenario: rows sorted descending by `total`.
  - Scenario: "Organization Total" row is the last rendered row.
  - Scenario: Seat Cost cells contain `"$"`.
  - Scenario: % of Org cells contain `"%"`.
  - Scenario: totals row shows summed seat and token costs.
  - Scenario: totals row shows `"100.0%"`.
  - Scenario: single-row input does not throw.

**Files**

- `src/components/kpis/ChargebackTable.tsx` (new) - descending-sorted chargeback table with Organization Total tfoot
- `src/components/kpis/ChargebackTable.test.tsx` (new) - sort, totals row, currency, percentage, and edge case tests

---

## T-6: Billing section organism

**Context**

Implements SPEC §3 `src/components/sections/Billing.tsx` - the section organism that fetches `BillingResponse` (and `OverviewResponse` for the quality block) and renders the full six-row billing layout. Follow the same two-query pattern used in `src/components/sections/Overview.tsx` (WP-05 T-8) which uses multiple `useQuery` calls within one section component.

Before starting, read:
- `src/components/sections/Overview.tsx` - multiple `useQuery` calls in one section, `buildQueryParams` hoisted outside component, Section/KpiCard/chart imports and layout pattern
- `src/types/api.ts` - `BillingResponse` and `OverviewResponse` interfaces; note which fields exist (some SPEC fields are absent - see the discrepancy table at the top of this file)
- `src/components/charts/GaugeChart.tsx` (T-4) - `GaugeChartProps`
- `src/components/kpis/ChargebackTable.tsx` (T-5) - `ChargebackTableProps`
- `src/components/charts/ColumnChart.tsx` (T-2 modified) - `trendLine` prop
- `src/components/charts/AreaChart.tsx` (T-2 modified) - `dashed` on `AreaChartSeries`
- `src/components/charts/Heatmap.tsx` (T-3 modified) - generic data type and `getAriaLabel`
- `src/lib/kpi/formatters.ts` - `formatCurrency`, `formatPercent`
- `src/lib/filters/filterSignals.ts` - `filterQueryParams` signal
- `src/components/charts/primitives/useChartTokens.ts` - `useChartTokens()` for `GaugeChart.tokens`

**Requirements**

1. Create `src/components/sections/Billing.tsx` exporting `function Billing(): JSX.Element`.
2. `Billing` must use `useQuery<BillingResponse>` with `queryKey: ['billing', filterQueryParams.value]` and `queryFn` fetching `/api/analytics/billing?from=...&to=...`.
3. `Billing` must use a second `useQuery<OverviewResponse>` with `queryKey: ['overview', filterQueryParams.value]` and `queryFn` fetching `/api/analytics/overview?from=...&to=...` (same queryFn as `Overview.tsx`; TanStack Query deduplicates the in-flight request).
4. The shared `buildQueryParams` helper must be hoisted outside the component body per ARCHITECTURE.md §4.4.
5. All rendering must be inside `<Section id="billing" labelledBy="billing-heading">` with `<h2 id="billing-heading">Billing & Financial</h2>`.
6. **Loading state**: when either query `isLoading`, render Skeleton placeholders (4 `<Skeleton className="h-10 w-full" />` for KpiCard rows, 2 `<Skeleton className="h-48 w-full" />` for chart rows).
7. **Row 1** (4-column grid): KpiCard for Current Month Spend | KpiCard for Projected Month-End | GaugeChart for Budget Utilization | KpiCard for Projected Annual Spend.
8. The Current Month Spend KpiCard must pass `value={formatCurrency(billing.current_month_spend)}` and `subValue={"of " + formatCurrency(billing.monthly_budget) + " budget"}`.
9. The Projected Month-End KpiCard must pass `value={formatCurrency(billing.projected_month_end)}` and `subValue={"Day " + billing.days_elapsed + " of " + billing.days_in_month}`.
10. The GaugeChart must receive `value={billing.budget_utilization}`, `label={formatPercent(billing.budget_utilization, 1)}`, `subLabel={"of " + formatCurrency(billing.monthly_budget) + " budget"}`, and `tokens={useChartTokens()}` result.
11. The Projected Annual Spend KpiCard must pass `value={formatCurrency(billing.projected_annual_spend)}`.
12. **Row 2** (2-column grid): two `<figure>` elements: "Cumulative Spend vs Budget" AreaChart and "Invoice History" ColumnChart.
13. The AreaChart must receive two series: `actualSeries` (id `"actual"`, not dashed, data from `invoice_history.map(h => ({ date: h.month + '-01', value: h.total_billed }))`) and `projectedSeries` (id `"projected"`, `dashed: true`, data with two points: last invoice month → projected month-end); and `referenceLine={{ value: billing.monthly_budget, label: 'Budget' }}`.
14. The ColumnChart (invoice history) must receive `bars={invoice_history.map(h => ({ label: h.month, value: h.total_billed }))}` and `trendLine={true}`.
15. **Row 3** (2-column grid): DonutChart for team cost allocation and ChargebackTable.
16. The DonutChart must receive `slices={billing.cost_by_team.map(t => ({ label: t.team_name, value: t.total }))}`.
17. The ChargebackTable must receive `rows={billing.cost_by_team}`.
18. **Row 4** (full width): `<figure>` with Heatmap for cost anomaly calendar.
19. The Heatmap must receive `colorScale="cost"`, `data={billing.cost_anomaly_days.map(d => ({ date: d.date, value: d.daily_cost, isAnomaly: d.is_anomaly, avgDailyCost: d.avg_daily_cost }))}`, and `getAriaLabel={(d) => \`${d.date}: $${d.value.toFixed(0)} (avg $${Number(d.avgDailyCost).toFixed(0)})\`}`.
20. **Row 5** (3-column grid): KpiCards for Cost per Successful Run, Token Rate Efficiency, Cost of Failed Runs.
21. The Cost per Successful Run KpiCard must pass `value={formatCurrency(billing.cost_per_successful_run)}`.
22. The Token Rate Efficiency KpiCard must compute `discount = ((billing.token_rate_list - billing.token_rate_actual) / billing.token_rate_list) * 100` and pass `value={formatCurrency(billing.token_rate_actual) + "/1M"}` and `subValue={formatPercent(discount, 1) + " below list (" + formatCurrency(billing.token_rate_list) + "/1M)"}`.
23. The Cost of Failed Runs KpiCard must pass `value={formatCurrency(billing.cost_of_failed_runs)}` and `subValue={formatPercent((billing.cost_of_failed_runs / billing.current_month_spend) * 100, 1) + " of monthly spend"}`.
24. **Row 6** (3-column grid): KpiCards for Quality-Cost Efficiency, User Churn Risk, New User Activation Cost (from the overview query).
25. The Quality-Cost Efficiency KpiCard must pass `insufficientData={overview.quality_cost_efficiency === null}` and `value={overview.quality_cost_efficiency !== null ? overview.quality_cost_efficiency.toFixed(2) : undefined}`.
26. The Churn Risk KpiCard must pass `value={String(overview.churn_risk_count)}`.
27. The New User Activation Cost KpiCard must pass `insufficientData={overview.new_user_activation_cost === null}` and `value={overview.new_user_activation_cost !== null ? formatCurrency(overview.new_user_activation_cost) : undefined}`.
28. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- Two `useQuery` calls (billing + overview): the overview query is needed for KPI-46/47/48 which exist in `OverviewResponse` but not `BillingResponse`. TanStack Query deduplicates requests when the same queryKey is used by multiple components, so the overview data is effectively free if the Overview section is already mounted.
- `projectedSeries` two-point construction: `last = invoice_history[invoice_history.length - 1]`, then `[{ date: last.month + '-01', value: last.total_billed }, { date: currentMonthStart, value: billing.projected_month_end }]` where `currentMonthStart` is derived from `billing.period.to` (first of that month). This gives a minimal projected line from last period to end-of-month projection.
- `failed_run_cost_pct` absent from api.ts: compute inline as `(cost_of_failed_runs / current_month_spend) * 100`. Guard against `current_month_spend === 0` with `billing.current_month_spend > 0 ? ... : '0.0%'`.
- `useChartTokens()` called once in `Billing` body and stored in `const tokens = useChartTokens()` then passed to `<GaugeChart tokens={tokens} />`. GaugeChart requires the tokens prop explicitly.
- `buildQueryParams` function: identical to the one in `Overview.tsx` (both fetch from the same filter params shape). Per ARCHITECTURE §2.3: "if the same logic appears in two modules, extract it into `src/utils/`." Since this would be the second usage, extract to `src/utils/buildQueryParams.ts` as part of this task. Import in both `Overview.tsx` and `Billing.tsx`.

**Design**

```tsx
// src/utils/buildQueryParams.ts  (new file)
// Extract the shared function from Overview.tsx

export function buildQueryParams(params: { from: string; to: string; team_id?: string }): string
// const sp = new URLSearchParams({ from: params.from, to: params.to })
// if (params.team_id) sp.set('team_id', params.team_id)
// return sp.toString()
```

```tsx
// src/components/sections/Billing.tsx  (new file)
import { useQuery } from '@tanstack/react-query'
import { filterQueryParams } from '../../lib/filters/filterSignals'
import { Section } from '../layout/Section'
import { KpiCard } from '../kpis/KpiCard'
import { GaugeChart } from '../charts/GaugeChart'
import { AreaChart } from '../charts/AreaChart'
import { ColumnChart } from '../charts/ColumnChart'
import { DonutChart } from '../charts/DonutChart'
import { Heatmap } from '../charts/Heatmap'
import { ChargebackTable } from '../kpis/ChargebackTable'
import { Skeleton } from '../ui/skeleton'
import { useChartTokens } from '../charts/primitives/useChartTokens'
import { formatCurrency, formatPercent } from '../../lib/kpi/formatters'
import { buildQueryParams } from '../../utils/buildQueryParams'
import type { BillingResponse, OverviewResponse } from '../../types/api'

export function Billing(): JSX.Element
// const params = filterQueryParams.value
// const billingQuery = useQuery<BillingResponse>({ queryKey: ['billing', params], queryFn: ... })
// const overviewQuery = useQuery<OverviewResponse>({ queryKey: ['overview', params], queryFn: ... })
// const tokens = useChartTokens()
// const billing = billingQuery.data
// const overview = overviewQuery.data
// const isLoading = billingQuery.isLoading || overviewQuery.isLoading
// return <Section id="billing" labelledBy="billing-heading"> ... 6 rows ... </Section>
```

Also modify `src/components/sections/Overview.tsx` to import `buildQueryParams` from `src/utils/buildQueryParams.ts` (remove local definition).

**Acceptance criteria**

1. GaugeChart is present in the DOM (not a KpiCard) for Budget Utilization.
2. When `budget_utilization=91`, the GaugeChart foreground arc has the destructive color token fill.
3. The AreaChart for projected spend is present; it has two series elements (actual + projected).
4. The projected series has `stroke-dasharray="4 2"` on its path.
5. The AreaChart has an annotation line (reference line at `monthly_budget`).
6. The ColumnChart (invoice history) renders 6 bar elements and a trend line path.
7. The cost anomaly Heatmap renders `cost_anomaly_days.length` rect elements.
8. A rect for an anomaly day has fill matching `tokens.destructive`.
9. Each Heatmap cell has an `aria-label` containing the date and daily cost amount.
10. ChargebackTable renders with the "Organization Total" row last.
11. When `overview.quality_cost_efficiency` is `null`, the Quality-Cost Efficiency KpiCard shows "Insufficient data".
12. When `overview.new_user_activation_cost` is `null`, the New User Activation Cost KpiCard shows "Insufficient data".
13. `buildQueryParams` is no longer defined locally in `Overview.tsx` (it imports from `src/utils/buildQueryParams.ts`).

**Test Plan**

- `src/utils/buildQueryParams.test.ts` (new)
  - Scenario: `buildQueryParams({ from: '2024-01-01', to: '2024-01-31' })` produces correct query string.
  - Scenario: `team_id` is included in the query string when provided.
  - Scenario: `team_id` is absent when `undefined`.

- `src/components/sections/Billing.test.tsx` (new)
  - Scenario: GaugeChart present in DOM.
  - Scenario: invoice history ColumnChart renders 6 bars.
  - Scenario: cost anomaly Heatmap cell count equals `cost_anomaly_days.length`.
  - Scenario: anomaly cell has destructive fill.
  - Scenario: `quality_cost_efficiency = null` shows "Insufficient data" KpiCard.
  - Scenario: `new_user_activation_cost = null` shows "Insufficient data" KpiCard.
  - Scenario: loading state shows Skeleton, no KpiCards.

**Files**

- `src/utils/buildQueryParams.ts` (new) - shared query string builder extracted from Overview.tsx
- `src/utils/buildQueryParams.test.ts` (new) - query param serialization and team_id tests
- `src/components/sections/Billing.tsx` (new) - six-row billing section with two queries
- `src/components/sections/Billing.test.tsx` (new) - GaugeChart, charts, heatmap, quality block, and loading tests
- `src/components/sections/Overview.tsx` (modified) - imports `buildQueryParams` from utils instead of local definition

---

## Implementation order table

| Done | Priority | Task | Depends on | Effort |
|------|----------|------|------------|--------|
| [x]  | 1        | T-1: Billing formula functions | - | Small |
| [x]  | 2        | T-2: ColumnChart trendLine + AreaChart dashed | WP-06 T-2, WP-05 T-6 | Medium |
| [x]  | 3        | T-3: Heatmap data generalization | WP-07 T-1 | Small |
| [ ]  | 4        | T-4: GaugeChart component | - | Medium |
| [ ]  | 5        | T-5: ChargebackTable | WP-06 T-1 | Small |
| [ ]  | 6        | T-6: Billing section | T-1, T-2, T-3, T-4, T-5, WP-05 T-5, WP-06 T-1 | Large |
