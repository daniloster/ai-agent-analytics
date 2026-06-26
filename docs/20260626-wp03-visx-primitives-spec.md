# SPEC: WP-03 - Visx Primitive Layer

**Date:** 2026-06-26
**Plan reference:** `docs/20260626-analytics-dashboard-plan.md` - WP-03
**Investigation reference:** `docs/20260626-cloud-agent-analytics-dashboard-investigation.md` - D-2, Appendix B

---

## Assumptions (confirmed or defaulted)

- **Compound component pattern.** `<Visualization>` is the root. All chart configuration (data, axes, scale computation) lives in a React context it provides. Marks (`Line`, `Area`, `Bar`, `Gauge`, `HeatmapMark`) and overlays (`SeriesTooltip`, `MouseTooltip`, `Annotation`) are children that consume that context. No mark or overlay receives data or scales as props.
- **`data` is always `ReadonlySignal<TData[]>`.** The signal reference is passed through context so marks subscribe directly; `Visualization` does not extract `.value` to pass as plain array.
- **`Visualization` owns token computation.** It calls `useChartTokens()` internally; no `tokens` prop is exposed on any consumer-facing component.
- **"Sparkline" is a usage pattern, not a component.** A sparkline is `<Visualization height={40}><Area .../></Visualization>` with both axes `hidden: true`. No separate `Sparkline` component is created.
- **Tooltip state is signals in context.** `activePoint: Signal<ActivePoint | null>` is written by marks on hover/focus and read by `SeriesTooltip`. `mousePosition: Signal<{x,y} | null>` is written by the SVG overlay surface and read by `MouseTooltip`.
- **`series` props are `string` at runtime.** TypeScript cannot fully infer `keyof TData` through JSX children generics. The implementation validates `series` keys against `Object.keys(data.value[0])` in development (`import.meta.env.DEV`) and throws descriptively. Production build strips the check.
- **`Gauge` reads `data.value[0][series]`.** For gauge use cases, `data` is a single-element array wrapping the KPI value object.
- **All chart data elements receive WCAG 2.1 AA attributes.** Every rendered `rect`, `circle`, or `path` data element: `role="listitem"`, `tabIndex={0}`, `aria-label`, `onKeyDown` Enter/Space to activate tooltip (WCAG D-13).
- **`ChartSVG` retains `min-h-[200px]`** to guard against `@visx/responsive` `ParentSize` zero-width first-paint (investigation §8 risk). For `Gauge` and `Heatmap`, `Visualization` accepts an explicit `height` prop that is forwarded to `ChartSVG`.
- **Components follow `function ComponentName(` declaration style** per ARCHITECTURE.md §4.3. No arrow-function component definitions. No `React.memo`.
- **Derived values in components use `useDeepComputed`** (primitives, objects, arrays); never bare `useComputed` except for JSX-returning computeds.

---

## 1. Context

Implements investigation decision D-2 (Visx as the charting library) and plan WP-03.

This WP builds three layers:

1. **Primitive layer** (`src/components/charts/primitives/`) - typed wrappers over `@visx/*` that provide scale utilities, axis, grid, and responsive SVG sizing. Used internally by `Visualization`; not imported directly by WP-05 through WP-08.
2. **Visualization root** (`src/components/charts/Visualization.tsx`) - the compound component. Owns the `VisualizationContext`, computes D3 scales from `axes` config, tracks mouse and tooltip state via signals.
3. **Mark and overlay layer** (`src/components/charts/marks/`, `overlays/`) - children of `Visualization` that read context to render data and handle interaction. After this WP, WP-05 through WP-08 compose charts from this layer without touching `@visx/*` or D3 directly.

No existing files are modified in this WP.

**Visx packages required:**
`@visx/scale`, `@visx/shape`, `@visx/axis`, `@visx/grid`, `@visx/heatmap`, `@visx/responsive`, `@visx/group`, `@visx/gradient`, `@visx/annotation`, `@visx/tooltip`, `@visx/event`

`@visx/event` provides `localPoint(svgElement, event)` which converts a DOM pointer event into coordinates relative to the SVG element's local coordinate space. Required for the centralized pointer event handler in `Visualization`.

---

## 2. Data model

All interfaces are shape-only. No implementation bodies.

```ts
// src/components/charts/primitives/useChartTokens.ts
export interface ChartTokens {
  primary: string        // 'hsl(var(--primary))'
  primaryFaded: string   // 'hsl(var(--primary) / 0.2)'
  secondary: string      // 'hsl(var(--secondary))'
  muted: string          // 'hsl(var(--muted-foreground))'
  border: string         // 'hsl(var(--border))'
  background: string     // 'hsl(var(--background))'
  destructive: string    // 'hsl(var(--destructive))'
  success: string        // '#22c55e' - no shadcn/ui CSS var
  warning: string        // '#f59e0b' - no shadcn/ui CSS var
}

// ---------------------------------------------------------------
// Axis configuration - declares a D3 scale for Visualization to compute
// ---------------------------------------------------------------

export interface AxisConfig {
  id: string                                              // referenced by marks via axis="id"
  type: 'time' | 'linear' | 'band'                       // determines scale constructor
  position: 'bottom' | 'left' | 'right'
  accessor: (d: Record<string, unknown>) => number | string | Date  // maps datum to domain value
  domain?: [number, number] | 'auto'  // 'auto' = computed from data; default 'auto'
  label?: string
  tickFormat?: (v: unknown) => string
  numTicks?: number
  hidden?: boolean  // true = compute scale, render no axis labels or ticks
}

// ---------------------------------------------------------------
// Visualization root props
// ---------------------------------------------------------------

export interface VisualizationProps<TData extends Record<string, unknown>> {
  data: ReadonlySignal<TData[]>
  axes: AxisConfig[] | ((data: TData[]) => AxisConfig[])  // function form for dynamic domains
  height?: number       // fixed height for Gauge/Heatmap; omit for responsive height
  className?: string
  ariaLabel?: string    // applied to wrapping <figure>; required when chart has no visible title
  children: React.ReactNode
}

// ---------------------------------------------------------------
// Context shared with all mark and overlay children
// ---------------------------------------------------------------

export interface ActivePoint {
  series: string
  axis: string
  datum: Record<string, unknown>
  x: number  // SVG pixel position (already includes margin offset)
  y: number
}

export interface VisualizationContextValue {
  dataSignal: ReadonlySignal<Record<string, unknown>[]>  // raw signal; marks subscribe directly
  innerWidth: number
  innerHeight: number
  tokens: ChartTokens
  scales: Record<string, AnyD3Scale>   // keyed by AxisConfig.id
  baseScale: AnyD3Scale | null         // shorthand: the scale at position 'bottom'
  // activePoint is set via two paths (see interaction diagram):
  //   continuous series (Line/Area): Visualization SVG onPointerMove + bisect
  //   discrete series (Bar/HeatmapMark): per-element onPointerEnter
  activePoint: Signal<ActivePoint | null>
  mousePosition: Signal<{ x: number; y: number } | null>  // SVG local coords; MouseTooltip reads
}

// Design note - ParentSize zero-width guard:
// @visx/responsive ParentSize fires its ResizeObserver asynchronously. On first paint,
// innerWidth and innerHeight may be 0 before the observer measurement arrives.
// Every mark component MUST short-circuit and return null when innerWidth === 0.
// The min-h-[200px] on ChartSVG's wrapper prevents a zero-height measurement,
// but width still depends on the container being laid out before the observer fires.

// ---------------------------------------------------------------
// Mark component props - all read data and scales from context
// ---------------------------------------------------------------

export interface LineProps {
  series: string       // key in TData; y-values mapped via scales[axis]
  axis: string         // AxisConfig.id for the y-scale
  color?: string       // default: tokens.primary
  strokeWidth?: number // default: 2
}

export interface AreaProps extends LineProps {
  fillOpacity?: number // default: 0.2; bottom opacity of LinearGradient fill
}

export interface BarProps {
  series: string
  axis: string
  grouped?: boolean    // default: false
  stacked?: boolean    // default: false; stacks multiple Bar siblings sharing same axis
  color?: string       // default: tokens.primary
  sortBy?: 'asc' | 'desc'  // sort bars by value before render
}

export interface GaugeProps {
  series: string                  // key in TData; reads data.value[0][series]
  domain?: [number, number]       // default: [0, 100]
  criticalThreshold?: number      // default: 90; above this uses tokens.destructive stroke
  label?: string                  // text rendered inside the arc
}

export interface HeatmapMarkProps {
  series: string    // key in TData for the cell value
  dateKey: string   // key in TData for 'YYYY-MM-DD'
  colorScale: 'availability' | 'cost'
  // 'availability': scaleSequential [0,100] green (#22c55e) -> red (#ef4444)
  // 'cost':         scaleSequential [0, max] tokens.background -> tokens.destructive
}

// ---------------------------------------------------------------
// Overlay component props
// ---------------------------------------------------------------

// Render prop: children receives the hovered datum when series/axis match activePoint
export interface SeriesTooltipProps<TData extends Record<string, unknown>> {
  series: string
  axis: string
  children: (point: { datum: TData; x: number; y: number }) => React.ReactNode
}

// Follows mouse within the SVG surface; children is static JSX or a render prop
export interface MouseTooltipProps {
  children: React.ReactNode | ((pos: { x: number; y: number }) => React.ReactNode)
}

// Horizontal reference line at a threshold value in the y-axis domain
export interface AnnotationProps {
  axis: string               // which scale to map value -> pixel y
  value: number              // threshold in axis domain units
  label: string
  variant?: 'warning' | 'destructive'  // default: 'warning'; maps to tokens.warning / tokens.destructive
}
```

---

## 3. Component / module design

### New files

**Primitive layer - `src/components/charts/primitives/`** (internal to WP-03; not imported by consumers)

| File | Responsibility |
|------|---------------|
| `useChartTokens.ts` | Reads CSS custom properties from `document.documentElement` at render time; returns `ChartTokens`; pure hook, no signals |
| `ChartSVG.tsx` | `@visx/responsive` `ParentSize` wrapper; subtracts margin; passes `(innerWidth, innerHeight)` to render-prop children; adds `min-h-[200px]` on outer div; forwards optional fixed `height` |
| `Axis.tsx` | Exports `AxisBottom`, `AxisLeft`, `AxisRight` as named `function` declarations; applies `tokens.muted` to tick labels; used by `Visualization` for rendered axes |
| `Grid.tsx` | Exports `GridRows`, `GridColumns`; `tokens.border` stroke; used by `Visualization` |

**Visualization root - `src/components/charts/`**

| File | Responsibility |
|------|---------------|
| `Visualization.tsx` | Compound component root; wraps `ChartSVG`; calls `useChartTokens()`; computes D3 scales from `axes` prop; tracks `activePoint` and `mousePosition` signals; provides `VisualizationContext` |
| `VisualizationContext.ts` | `VisualizationContext` React context definition; `useVisualizationContext()` hook (throws if called outside `<Visualization>`) |

**Mark layer - `src/components/charts/marks/`**

| File | Responsibility |
|------|---------------|
| `Line.tsx` | `@visx/shape` `LinePath` using `scales[axis]` and `baseScale` from context |
| `Area.tsx` | `@visx/shape` `AreaClosed` + `LinearGradient`; renders data-point circles for keyboard/hover interaction; writes `activePoint` signal on pointer/focus events |
| `Bar.tsx` | `@visx/shape` `Bar` (simple/grouped) or `BarStack` (stacked); `scaleBand` for categorical axis; writes `activePoint` on interaction |
| `Gauge.tsx` | `@visx/shape` `Pie` arc, `startAngle=-Math.PI/2`, `endAngle=Math.PI/2` (180° semicircle); reads `data.value[0][series]`; color switches to `tokens.destructive` when value exceeds `criticalThreshold` |
| `HeatmapMark.tsx` | `@visx/heatmap` `HeatmapRect`; data chunked into 7-day columns; `scaleSequential` per `colorScale` prop; writes `activePoint` on interaction |

**Overlay layer - `src/components/charts/overlays/`**

| File | Responsibility |
|------|---------------|
| `SeriesTooltip.tsx` | Reads `activePoint` signal from context; renders children render-prop when `activePoint.value?.series === props.series`; for continuous series, `activePoint` is resolved via bisect at the SVG level so the tooltip tracks the nearest datum even when the pointer is between rendered data elements; uses `@visx/tooltip` `TooltipWithBounds` for boundary-safe positioning |
| `MouseTooltip.tsx` | Reads `mousePosition` signal from context; renders children at current mouse coordinates using `TooltipWithBounds` |
| `Annotation.tsx` | Horizontal reference line; maps `value` through `scales[axis]` to pixel y; renders `@visx/annotation` `Line` + callout label; color from `variant` -> `tokens` |

### Public API (signatures only)

```ts
// Visualization.tsx
export function Visualization<TData extends Record<string, unknown>>(
  props: VisualizationProps<TData>
): JSX.Element

// VisualizationContext.ts
export function useVisualizationContext(): VisualizationContextValue  // throws outside Visualization

// marks/Line.tsx
export function Line(props: LineProps): JSX.Element

// marks/Area.tsx
export function Area(props: AreaProps): JSX.Element

// marks/Bar.tsx
export function Bar(props: BarProps): JSX.Element

// marks/Gauge.tsx
export function Gauge(props: GaugeProps): JSX.Element

// marks/HeatmapMark.tsx
export function HeatmapMark(props: HeatmapMarkProps): JSX.Element

// overlays/SeriesTooltip.tsx
export function SeriesTooltip<TData extends Record<string, unknown>>(
  props: SeriesTooltipProps<TData>
): JSX.Element

// overlays/MouseTooltip.tsx
export function MouseTooltip(props: MouseTooltipProps): JSX.Element

// overlays/Annotation.tsx
export function Annotation(props: AnnotationProps): JSX.Element

// primitives/useChartTokens.ts
export function useChartTokens(): ChartTokens
```

---

## 4. Interaction diagram

### Context provision flow

```
<Visualization data={signal} axes={axes} ariaLabel="...">
  |
  +-- calls useChartTokens()                        -> ChartTokens
  +-- reads data.value (subscribes via signals)     -> TData[]
  +-- resolves axes (array or function)             -> AxisConfig[]
  +-- computes D3 scales per AxisConfig             -> Record<string, AnyD3Scale>
  +-- wraps ChartSVG (ParentSize)                   -> innerWidth, innerHeight
  +-- creates activePoint = useSignal(null)
  +-- creates mousePosition = useSignal(null)
  +-- provides VisualizationContext to children
        { dataSignal, innerWidth, innerHeight, tokens, scales, baseScale,
          activePoint, mousePosition }
  |
  +-- renders <svg onMouseMove={...} onMouseLeave={...}>
  |     (updates mousePosition signal on every mouse move within SVG)
  |
  +-- renders children inside <Group left={margin.left} top={margin.top}>
```

### Mark interaction -> tooltip: two paths

**Path A - continuous series (Line, Area):**
```
SVG surface onPointerMove fires (registered by Visualization)
  --> localPoint(svgRef, event)            // @visx/event: DOM coords -> SVG local coords
  --> mousePosition.value = { x, y }       // updates MouseTooltip
  --> x0 = baseScale.invert(x)             // pixel x -> domain value (date or number)
  --> index = bisector(data.value, x0)     // d3-array bisect finds nearest datum index
  --> datum = data.value[index]
  --> activePoint.value = {
        series: <whichever mark matches>,  // resolved per mounted marks
        axis: 'y',
        datum,
        x: baseScale(accessor(datum)),
        y: scales['y'](datum[series]),
      }

SeriesTooltip reads activePoint via useSignals():
  --> activePoint.value?.series === props.series
  --> TooltipWithBounds rendered at (activePoint.value.x, activePoint.value.y)
  --> children({ datum, x, y }) called with nearest datum

SVG onPointerLeave:
  --> activePoint.value = null
  --> mousePosition.value = null
```

**Path B - discrete series (Bar, HeatmapMark):**
```
Individual bar rect / heatmap cell onPointerEnter fires
  --> activePoint.value = { series, axis, datum, x: rectCx, y: rectCy }

onPointerLeave on same element:
  --> activePoint.value = null
```

**Path C - keyboard (all marks):**
```
Tab / Shift+Tab --> native focus on data element (tabIndex=0)
onFocus on element:
  --> same activePoint update as Path B (datum known from element props)
Escape / onBlur:
  --> activePoint.value = null
```

### Keyboard navigation contract (all marks)

```
Tab / Shift+Tab   --> native tabIndex flow through data elements
Enter / Space     --> activePoint.value = { ... } for focused element
Escape            --> activePoint.value = null
onFocus           --> same as Enter (for keyboard-driven tooltip)
onBlur            --> activePoint.value = null (for keyboard-driven tooltip)
Mouse hover       --> same as Enter (identical activePoint update path)
Mouse leave       --> activePoint.value = null
```

### Usage patterns (chart type -> composition)

**Sparkline** (WP-05, KPI trend indicator):
```tsx
const axes: AxisConfig[] = [
  { id: 'x', type: 'time', position: 'bottom', accessor: d => d.date, hidden: true },
  { id: 'y', type: 'linear', position: 'left', domain: 'auto', hidden: true },
]
<Visualization data={timeseriesSignal} axes={axes} height={40} ariaLabel="Trend">
  <Area series="value" axis="y" />
</Visualization>
```

**Area chart with reference line** (WP-07, error rate over time):
```tsx
<Visualization data={reliabilitySignal} axes={axes} ariaLabel="Error rate over time">
  <Area series="error_rate_pct" axis="y" />
  <Annotation axis="y" value={5} label="Critical threshold" variant="destructive" />
  <SeriesTooltip series="error_rate_pct" axis="y">
    {({ datum, x, y }) => <ErrorRateTooltipContent datum={datum} />}
  </SeriesTooltip>
</Visualization>
```

**Bar chart** (WP-06, team run volume):
```tsx
<Visualization data={teamsSignal} axes={axes} ariaLabel="Runs per team">
  <Bar series="total_runs" axis="y" sortBy="desc" />
  <SeriesTooltip series="total_runs" axis="y">
    {({ datum }) => <TeamTooltipContent datum={datum} />}
  </SeriesTooltip>
</Visualization>
```

**Dual-series line chart** (WP-05, accepted vs rejected outputs over time):
```tsx
<Visualization data={timeseriesSignal} axes={axes} ariaLabel="Output quality trend">
  <Area series="accepted" axis="y" color={tokens.success} />
  <Area series="rejected" axis="y" color={tokens.destructive} />
  <MouseTooltip>
    {({ x, y }) => <DualSeriesContent x={x} y={y} />}
  </MouseTooltip>
</Visualization>
```

**Gauge** (WP-08, budget utilization):
```tsx
<Visualization data={billingSignal} axes={[]} height={160} ariaLabel="Budget utilization">
  <Gauge series="budget_utilization_pct" domain={[0, 100]} criticalThreshold={90} label="Budget" />
  <MouseTooltip>
    {() => <span>{billingSignal.value[0].budget_utilization_pct}% used</span>}
  </MouseTooltip>
</Visualization>
```

**Heatmap** (WP-07, service availability):
```tsx
<Visualization data={reliabilitySignal} axes={[]} height={80} ariaLabel="Daily availability">
  <HeatmapMark series="uptime_pct" dateKey="date" colorScale="availability" />
  <SeriesTooltip series="uptime_pct" axis="">
    {({ datum }) => <span>{datum.date}: {datum.uptime_pct}% uptime</span>}
  </SeriesTooltip>
</Visualization>
```

---

## 5. Acceptance criteria

1. `<Visualization data={signal} axes={axes}><Area series="value" axis="y" /></Visualization>` renders an SVG with an `AreaClosed` path; no console errors when `signal.value` is an empty array.
2. `<Area>` renders exactly one `LinearGradient` def per `Area` instance; two `<Area>` siblings produce two gradient defs with distinct IDs.
3. Hovering a data-point circle inside `<Area>` sets `activePoint.value` to an object with matching `series`, `axis`, and `datum` keys; `<SeriesTooltip>` with the same `series` renders its children function with that data.
4. `<Bar series="runs" axis="y" sortBy="desc" />` renders `rect` elements in descending order by `datum.runs`; the tallest bar appears first (leftmost in vertical orientation).
5. `<Gauge series="pct" domain={[0, 100]} criticalThreshold={90} />` with `data.value[0].pct = 95` renders an arc stroke colored `tokens.destructive`; with `pct = 50` the stroke is `tokens.primary`.
6. `<HeatmapMark>` given 31 data points renders 31 `rect` elements; each has `tabIndex={0}`; first cell `aria-label` contains the earliest date; last cell contains the latest date.
7. Every rendered `rect`, `circle`, and `path` data element inside any mark has `tabIndex={0}` and is reachable sequentially via Tab key (verified by DOM attribute check in tests).
8. Pressing Enter on a focused `<Area>` data circle sets `activePoint.value` identically to hovering that circle with a mouse.
9. `<Annotation axis="y" value={5} label="Threshold" variant="destructive" />` renders an SVG line at the pixel y-coordinate corresponding to value 5 on the `"y"` scale; the line stroke is `tokens.destructive`.
10. `useVisualizationContext()` called outside a `<Visualization>` tree throws with a descriptive error message.
11. `useChartTokens()` returns an object with all 9 keys; all values except `success` and `warning` contain the substring `hsl(var(--`.
12. Changing `data.value` (signal update) causes marks to re-render with new data; the `scales` in context are recomputed when `domain: 'auto'` axes are present.
13. `<Visualization data={signal} axes={fn}>` where `axes` is a function: the function receives the current `data.value` array and returns `AxisConfig[]`; the result is recomputed when `data.value` changes.
14. `ChartSVG` wrapper div has class `min-h-[200px]`; passing `height={80}` to `Visualization` forwards it to `ChartSVG` and constrains height.
15. Pure D3 scale assertion (no render): `scaleLinear({ domain: [0, 100], range: [200, 0] })(50) === 100`.
16. Moving the pointer to the midpoint between two adjacent `<Area>` data points sets `activePoint.value.datum` to the nearer of the two data points (bisect nearest-point behavior; verified by mocking `localPoint` and checking signal value).
17. Every mark component (`Line`, `Area`, `Bar`, `Gauge`, `HeatmapMark`) returns `null` when `innerWidth === 0` from context - no SVG paths, rects, or arcs are rendered before `ParentSize` fires its first measurement.

---

## 6. Out of scope

- `figure` + `figcaption` wrappers - consumer responsibility (WP-05 through WP-08)
- `@axe-core/react` integration - WP-09
- `DonutChart` (multi-slice pie) - no KPI in this dashboard requires it; dropped from scope
- `BrushChart` (time-series zoom) - v2 feature
- Dark/light mode toggle - handled by shadcn/ui CSS variable switching; charts respond automatically via `useChartTokens`
- Export-to-PNG or SVG - v2

---

## Test plan

| File | What it tests |
|------|---------------|
| `src/components/charts/primitives/useChartTokens.test.ts` (new) | All 9 tokens present; non-success/warning tokens contain `hsl(var(--`; mock `getComputedStyle` to verify CSS variable reading |
| `src/components/charts/primitives/ChartSVG.test.ts` (new) | Wrapper div has `min-h-[200px]` class; children render-prop called with positive width/height; `height` prop constrains output |
| `src/components/charts/primitives/scales.test.ts` (new) | `scaleLinear` domain/range mapping; `scaleBand` bandwidth > 0 for non-empty domain; `scaleTime` maps ISO date string to correct pixel position |
| `src/components/charts/VisualizationContext.test.ts` (new) | `useVisualizationContext()` outside tree throws; inside tree returns context value |
| `src/components/charts/Visualization.test.ts` (new) | Scales computed correctly for `type: 'linear'`, `type: 'time'`, `type: 'band'`; `domain: 'auto'` derived from data; `axes` as function receives data array; `mousePosition` signal updated on SVG `pointermove`; `activePoint` null on SVG `pointerleave`; bisect nearest-point: pointer at midpoint between datum[0] and datum[1] sets `activePoint.datum` to whichever is nearer; `activePoint` null when `innerWidth === 0` |
| `src/components/charts/marks/Area.test.ts` (new) | Renders `AreaClosed` path and `LinearGradient` def; data circles have `tabIndex=0`; hover sets `activePoint`; Enter key on circle sets `activePoint` identically; empty data renders without error |
| `src/components/charts/marks/Bar.test.ts` (new) | `sortBy="desc"` produces descending rect order; horizontal orientation rect dimensions proportional to value; stacked mode uses `BarStack`; each bar has `tabIndex=0` |
| `src/components/charts/marks/Gauge.test.ts` (new) | Arc rendered as semicircle; value above `criticalThreshold` uses `tokens.destructive`; value below uses `tokens.primary`; `label` text present in SVG |
| `src/components/charts/marks/HeatmapMark.test.ts` (new) | 31 input cells -> 31 `rect` elements; each has `tabIndex=0`; `aria-label` contains date; Enter key activates tooltip |
| `src/components/charts/overlays/SeriesTooltip.test.ts` (new) | Children not rendered when `activePoint` is null; rendered when `activePoint.series` matches `props.series`; not rendered when series does not match |
| `src/components/charts/overlays/Annotation.test.ts` (new) | `variant="destructive"` applies `tokens.destructive` stroke; pixel y-coordinate matches scale output for `value`; label text present |

---

## Proposed changes

### Components API and usage for visx abstraction

To build the components we should aim for a composition-based architecture leveraging the `children` property to enhance extensibility.

How?

```tsx
interface Axis {
  id: string; // like a expected literal inferred later on in the components
  // ... remaining relevant data to represent the axis min, max (they should accept auto I guess)
}
interface Series {
  id: string; // like a expected literal inferred later on in the components
  // ... remaining relevant data to represent the axis min, max (they should accept auto I guess)
}
interface VisualizationProps<
  TKey extends string = string,
  TSeries,
  TData extends Record<TKey, TSeries>,
> {
  data: ReadonlySignal<TData>;
  axes: Axis[] | ((data: ReadonlySignal<TData>) => Axis[]);
}

<Visualization data={data} axes={axes}>
  <Line series="id_of_series_matching_within_data" axis="id_of_axis" />
</Visualization>;
```

or

```tsx
<Visualization
  data={data}
  axes={axes}
  baseRenderer={renderFunctionOptionalToRenderEachBaseValue}
  baseValues={optionalFunctionToExtractAllBaseValues}
>
  {" "}
  {/* base relates to the opposite axis on the chart ie like the timestamps or descrite values*/}
  <Line series="id_of_series_matching_within_data_1" axis="id_of_axis_1" />
  <Line series="id_of_series_matching_within_data_2" axis="id_of_axis_2" />
</Visualization>
```

or

```tsx
<Visualization data={data} axes={axes}>
  <Bar series="id_of_series_matching_within_data" axis="id_of_axis" />
</Visualization>
```

or

```tsx
<Visualization data={data} axes={axes}>
  <Gauge series="id_of_series_matching_within_data" />
</Visualization>
```

Then, if I want to add a tooltip

```tsx
<Visualization data={data} axes={axes}>
  <Line series="id_of_series_matching_within_data" axis="id_of_axis" />
  <SeriesTooltip id="id_of_series_matching_within_data" axis="id_of_axis">
    {childrenAsFunction} {/* parsing the hovered point in the series */}
  </SeriesTooltip>
</Visualization>
```

or

```tsx
<Visualization data={data} axes={axes}>
  <Line series="id_of_series_matching_within_data" axis="id_of_axis" />
  <MouseTooltip>
    {/*
    render here any content TSX and this MouseTooltip will follow the mouse coordinates within the Visualization surface.
    */}
  </MouseTooltip>
</Visualization>
```

### Evaluate proposal

Please, evaluate the proposal and idea of composition, all data passed into Visualization should be shared via context (each Visualization retaining the main data into a context for children components - ie Compound Components).

Evaluate the suitability of the solution, what component we would need to build to comprehend all the features in this assignment. Always prefer composition based as the examples...
