# SPEC: WP-03 - Visx Primitive Layer

**Date:** 2026-06-26
**Plan reference:** `docs/20260626-analytics-dashboard-plan.md` - WP-03
**Investigation reference:** `docs/20260626-cloud-agent-analytics-dashboard-investigation.md` - D-2, Appendix B

---

## Assumptions (confirmed or defaulted)

- All chart data elements receive `role="listitem"`, `tabIndex={0}`, `aria-label` with date + formatted value, and `onKeyDown` for Enter/Space to show tooltip (WCAG 2.1 AA - D-13).
- `ChartSVG` applies a `min-h-[200px]` Tailwind class on its wrapper to prevent the `@visx/responsive` `ParentSize` ResizeObserver from computing a zero-width rect on first paint (investigation §8 risk).
- All chart colors read from CSS variables via `useChartTokens()` at render time. No hardcoded hex values anywhere in chart code. Two tokens (`success`, `warning`) are hex because shadcn/ui default theme does not expose them as CSS variables.
- `figure` + `figcaption` wrappers are added at the consumer level (WP-05 through WP-08), not inside chart components.
- Components follow `function ComponentName(` declaration style per ARCHITECTURE.md §4.3. No arrow-function component definitions. No `React.memo`.
- Derived values in components use `useDeepComputed` (for primitives, objects, arrays) and never bare `useComputed` except for JSX-returning computeds.

---

## 1. Context

Implements investigation decision D-2 (Visx as the charting library) and plan WP-03.

This WP builds two layers:
1. **Primitive layer** (`src/components/charts/primitives/`) - typed wrappers over `@visx/*` packages that provide scale utilities, axis, grid, tooltip state, and annotation. No section-specific logic.
2. **Concrete chart layer** (`src/components/charts/`) - five chart components composed from primitives. Each chart is self-contained and accepts typed props. After this WP, WP-05 through WP-08 assemble charts from this layer without touching `@visx/*` directly.

No existing files are modified in this WP. The directory `src/components/charts/` is created from scratch.

**Visx packages required** (from plan WP-03):
`@visx/scale`, `@visx/shape`, `@visx/axis`, `@visx/grid`, `@visx/tooltip`, `@visx/heatmap`, `@visx/responsive`, `@visx/group`, `@visx/gradient`, `@visx/annotation`

---

## 2. Data model

All interfaces are shape-only. No implementation bodies.

```ts
// src/components/charts/primitives/useChartTokens.ts
export interface ChartTokens {
  primary: string         // 'hsl(var(--primary))'
  primaryFaded: string    // 'hsl(var(--primary) / 0.2)'
  secondary: string       // 'hsl(var(--secondary))'
  muted: string           // 'hsl(var(--muted-foreground))'
  border: string          // 'hsl(var(--border))'
  background: string      // 'hsl(var(--background))'
  destructive: string     // 'hsl(var(--destructive))'
  success: string         // '#22c55e' - no shadcn/ui CSS var for this
  warning: string         // '#f59e0b' - no shadcn/ui CSS var for this
}

// src/components/charts/primitives/ChartSVG.tsx
export interface ChartSVGProps {
  children: (width: number, height: number) => React.ReactNode
  className?: string
  margin?: { top: number; right: number; bottom: number; left: number }
}
// Default margin: { top: 10, right: 10, bottom: 40, left: 48 }
// children receive innerWidth = width - margin.left - margin.right
//                  innerHeight = height - margin.top - margin.bottom

// src/components/charts/primitives/Axis.tsx
// AnyD3Scale is ScaleLinear | ScaleTime | ScaleBand | ScaleOrdinal from @visx/scale
export interface AxisProps {
  scale: AnyD3Scale
  orientation: 'bottom' | 'left' | 'right'
  label?: string
  tickFormat?: (value: unknown) => string
  numTicks?: number
  tokens: ChartTokens
}

// src/components/charts/primitives/Grid.tsx
export interface GridProps {
  xScale?: AnyD3Scale
  yScale?: AnyD3Scale
  width: number
  height: number
  tokens: ChartTokens
}

// src/components/charts/primitives/Annotation.tsx
export interface AnnotationProps {
  yScale: AnyD3Scale
  threshold: number       // value in yScale domain (e.g. 5 for 5% error rate)
  label: string
  width: number
  tokens: ChartTokens
  variant?: 'warning' | 'destructive'  // default 'warning'
}

// src/components/charts/primitives/useTooltipState.ts
export interface TooltipState<T> {
  tooltipOpen: boolean
  tooltipLeft: number
  tooltipTop: number
  tooltipData: T | null
  showTooltip: (args: { tooltipLeft: number; tooltipTop: number; tooltipData: T }) => void
  hideTooltip: () => void
}

// src/components/charts/Sparkline.tsx
export interface SparklineProps {
  data: Array<{ date: string; value: number }>
  width?: number          // default: 80
  height?: number         // default: 40
  color?: string          // default: tokens.primary
  tokens: ChartTokens
}

// src/components/charts/AreaChart.tsx
export interface AreaSeries {
  key: string
  label: string
  color?: string          // default: tokens.primary for first series, tokens.secondary for second
}

export interface AreaChartReferenceLine {
  y: number               // value in yScale domain
  label: string
  variant?: 'warning' | 'destructive'
}

export interface AreaChartProps {
  data: Array<{ date: string } & Record<string, number>>
  series: AreaSeries[]
  height?: number         // default: 240
  referenceLines?: AreaChartReferenceLine[]
  tokens: ChartTokens
}

// src/components/charts/BarChart.tsx
export interface BarSeries {
  key: string
  label: string
  color?: string
}

export interface BarChartProps {
  data: Array<{ label: string } & Record<string, number>>
  series: BarSeries[]
  orientation?: 'vertical' | 'horizontal'   // default: 'vertical'
  grouped?: boolean       // default: false; renders bars side-by-side per group
  stacked?: boolean       // default: false; renders @visx/shape BarStack
  height?: number         // default: 240
  sortBy?: string         // key to sort data by descending; omit for original order
  tokens: ChartTokens
}

// src/components/charts/DonutChart.tsx
export interface DonutSlice {
  label: string
  value: number
  color?: string
}

export interface DonutChartProps {
  data: DonutSlice[]
  centerLabel?: string    // large text in donut hole
  centerSubLabel?: string // small text below centerLabel
  height?: number         // default: 200; chart is always square (min(width, height))
  tokens: ChartTokens
}

// src/components/charts/Heatmap.tsx
export interface HeatmapCell {
  date: string            // 'YYYY-MM-DD'
  value: number           // 0-100 for 'availability'; raw cost for 'cost'
}

export interface HeatmapProps {
  data: HeatmapCell[]
  colorScale: 'availability' | 'cost'
  // 'availability': scaleSequential [0,100] -> green (#22c55e) to red (#ef4444)
  // 'cost': scaleSequential [0, max] -> background to destructive
  height?: number         // default: 80
  tokens: ChartTokens
}
```

---

## 3. Component / module design

### New files

**Primitives - `src/components/charts/primitives/`**

| File | Responsibility |
|------|---------------|
| `useChartTokens.ts` | Reads CSS custom properties from `document.documentElement` at render time; returns `ChartTokens`; pure hook, no signals |
| `useTooltipState.ts` | Generic typed wrapper over `@visx/tooltip` `useTooltip`; returns `TooltipState<T>` |
| `ChartSVG.tsx` | `@visx/responsive` `ParentSize` wrapper; subtracts margin; passes `(innerWidth, innerHeight)` to render prop children; adds `min-h-[200px]` on the outer div |
| `Axis.tsx` | Exports `AxisBottom` and `AxisLeft` as named `function` declarations; applies `tokens.muted` to tick labels and axis line |
| `Grid.tsx` | Exports `GridRows` and `GridColumns` as named `function` declarations; `tokens.border` for stroke color |
| `Annotation.tsx` | Horizontal reference line via `@visx/annotation` `Line`; callout label; color driven by `variant` prop mapped to `tokens.warning` or `tokens.destructive` |

**Concrete charts - `src/components/charts/`**

| File | Responsibility |
|------|---------------|
| `Sparkline.tsx` | 80x40 sparkline; `@visx/shape` `LinePath`; `scaleTime` x-axis; `scaleLinear` y-axis; hover tooltip via `useTooltipState`; no visible axis or grid |
| `AreaChart.tsx` | Multi-series area chart; `AreaClosed` + `LinePath` per series; `LinearGradient` fill; `ChartSVG` for responsive sizing; `AxisBottom` + `AxisLeft`; `GridRows`; optional `Annotation` reference lines; `<g role="list">` around data point circles |
| `BarChart.tsx` | Vertical/horizontal/grouped/stacked bar chart; `@visx/shape` `Bar` (simple/grouped) or `BarStack` (stacked); `scaleBand` for categorical axis; CSS `transition: width 0.3s ease` for animated mount; `<g role="list">` around bars |
| `DonutChart.tsx` | `@visx/shape` `Pie` + `Arc`; `innerRadius` = 60% of outer radius; CSS transition on arc `d` for mount animation; center label via SVG `text` elements; `<g role="list">` around arcs |
| `Heatmap.tsx` | `@visx/heatmap` `HeatmapRect`; cells sorted by date then arranged in weekly columns; `scaleSequential` color scale; `<g role="list">` around all cells; `TooltipWithBounds` |

### Public API (signatures only)

```ts
// primitives/useChartTokens.ts
export function useChartTokens(): ChartTokens

// primitives/useTooltipState.ts
export function useTooltipState<T>(): TooltipState<T>

// primitives/ChartSVG.tsx
export function ChartSVG(props: ChartSVGProps): JSX.Element

// primitives/Axis.tsx
export function AxisBottom(props: AxisProps): JSX.Element
export function AxisLeft(props: AxisProps): JSX.Element

// primitives/Grid.tsx
export function GridRows(props: GridProps): JSX.Element
export function GridColumns(props: GridProps): JSX.Element

// primitives/Annotation.tsx
export function Annotation(props: AnnotationProps): JSX.Element

// charts
export function Sparkline(props: SparklineProps): JSX.Element
export function AreaChart(props: AreaChartProps): JSX.Element
export function BarChart(props: BarChartProps): JSX.Element
export function DonutChart(props: DonutChartProps): JSX.Element
export function Heatmap(props: HeatmapProps): JSX.Element
```

---

## 4. Interaction diagram

### AreaChart data flow

```
Consumer:
  <figure aria-label="Token consumption over time">
    <figcaption>Token Consumption</figcaption>
    <AreaChart data={data} series={series} referenceLines={refLines} tokens={tokens} />
  </figure>

AreaChart:
  --> ChartSVG
      --> ParentSize (ResizeObserver, fires when container has non-zero width)
          --> computes innerWidth = width - margin.left - margin.right
          --> computes innerHeight = height - margin.top - margin.bottom
          --> xScale = scaleTime({ domain: [minDate, maxDate], range: [0, innerWidth] })
          --> yScale = scaleLinear({ domain: [0, maxValue * 1.1], range: [innerHeight, 0] })
          --> <GridRows yScale height={innerWidth} tokens={tokens} />
          --> <AxisBottom scale={xScale} tokens={tokens} />
          --> <AxisLeft scale={yScale} tokens={tokens} />
          --> for each series:
                <LinearGradient id={`grad-${series.key}`} from={color} to={color} toOpacity={0} />
                <AreaClosed data={data} yScale={yScale} x={d => xScale(d.date)} y={d => yScale(d[series.key])}
                            fill={`url(#grad-${series.key})`} />
                <LinePath data={data} x={d => xScale(d.date)} y={d => yScale(d[series.key])}
                          stroke={color} />
          --> for each referenceLines:
                <Annotation yScale={yScale} threshold={line.y} label={line.label}
                            variant={line.variant} width={innerWidth} tokens={tokens} />
          --> <g role="list" aria-label="{series[0].label} data points">
                {data.map((d, i) => (
                  <circle key={i}
                    role="listitem"
                    tabIndex={0}
                    aria-label={`${formatDate(d.date)}: ${formatValue(d[primaryKey])}`}
                    cx={xScale(d.date)}
                    cy={yScale(d[primaryKey])}
                    r={4}
                    onMouseEnter={e => showTooltip({ tooltipLeft: cx, tooltipTop: cy, tooltipData: d })}
                    onMouseLeave={hideTooltip}
                    onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && showTooltip(...)}
                    onKeyUp={e => e.key === 'Escape' && hideTooltip()}
                  />
                ))}
              </g>
          --> tooltipOpen && <TooltipWithBounds left={tooltipLeft} top={tooltipTop}>
                               {formatDate(tooltipData.date)}: {formatValue(tooltipData[key])}
                             </TooltipWithBounds>
```

### Heatmap layout

```
Heatmap receives data: HeatmapCell[]
  --> sortBy(data, d => d.date)   // ascending date order
  --> chunk into rows of 7 (week columns)
  --> @visx/heatmap HeatmapRect:
        binData = rows
        bins = d => d             // individual cells
        colorScale = scaleSequential:
          'availability': domain [0,100] -> interpolateRgb('#ef4444', '#22c55e')
          'cost':         domain [0, max] -> interpolateRgb(tokens.background, tokens.destructive)
  --> each rendered rect:
        role="listitem"
        tabIndex={0}
        aria-label="{formatDate(cell.date)}: {formatCellValue(cell.value, colorScale)}"
        onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && showTooltip(cell)}
        onFocus={e => showTooltip(cell)}
        onBlur={hideTooltip}
  --> tooltipOpen && <TooltipWithBounds>{formatDate}: {value}</TooltipWithBounds>
```

### Keyboard navigation contract (all charts)

```
Tab          --> moves focus to next data element (native tabIndex flow)
Shift+Tab    --> moves focus to previous data element
Enter / Space --> showTooltip for focused element
Escape       --> hideTooltip
Mouse hover  --> showTooltip (same tooltip as keyboard)
Mouse leave  --> hideTooltip
```

---

## 5. Acceptance criteria

1. `Sparkline` renders an SVG `path` element when given 10 data points; no console errors on empty `data` array.
2. `AreaChart` with `series.length === 2` renders exactly two `AreaClosed` paths and two `LinearGradient` defs.
3. `BarChart` with `orientation="horizontal"` renders `rect` elements with `width` proportional to value and `height` proportional to `scaleBand` bandwidth.
4. `DonutChart` with 4 slices renders 4 `path` elements (arcs); the sum of arc sweep angles equals 360 degrees (2π radians).
5. `Heatmap` given 31 cells renders 31 `rect` elements; the first cell's `aria-label` contains the earliest date string; the last cell's `aria-label` contains the latest date string.
6. Every chart `rect`, `circle`, and `path` data element has `tabIndex={0}` and is reachable in sequence via Tab key (verified by checking DOM attribute in tests).
7. `useChartTokens()` return value has all eight keys; all values for tokens other than `success` and `warning` contain the substring `hsl(var(--` (proves CSS variable usage).
8. `ChartSVG` wrapper div has class `min-h-[200px]`; children receive `width > 0` and `height > 0` after mounting in a container with explicit dimensions.
9. Pure D3 scale assertion (no render): `scaleLinear({ domain: [0, 100], range: [200, 0] })(50) === 100`.
10. `BarChart` with `sortBy="value"` renders bars in descending order by value when no `orientation` is specified (leftmost bar = highest value).
11. `Annotation` rendered with `variant="destructive"` applies `tokens.destructive` as the line stroke color.
12. `DonutChart` with `centerLabel="72.5%"` renders a `text` element with that content inside the SVG.

---

## 6. Out of scope

- `figure` + `figcaption` wrappers - consumer responsibility (WP-05 through WP-08)
- `@axe-core/react` integration - WP-09
- `CohortChart` - mentioned in investigation as future enhancement; not referenced by any WP KPI list
- `BrushChart` (time-series zoom) - v2 feature
- Dark/light mode toggle - handled by shadcn/ui CSS variable switching; charts respond automatically via `useChartTokens`

---

## Test plan

| File | What it tests |
|------|---------------|
| `src/components/charts/primitives/useChartTokens.test.ts` (new) | All tokens present; non-success/warning tokens contain `hsl(var(--`; mock `getComputedStyle` to verify CSS variable reading |
| `src/components/charts/primitives/ChartSVG.test.ts` (new) | Wrapper div has `min-h-[200px]` class; children render function called with positive width/height |
| `src/components/charts/primitives/scales.test.ts` (new) | `scaleLinear` domain/range mapping; `scaleBand` bandwidth > 0 for non-empty domain; `scaleTime` maps ISO date string to correct pixel position |
| `src/components/charts/Sparkline.test.ts` (new) | Renders SVG `path`; handles empty `data` without throwing; hover shows tooltip |
| `src/components/charts/AreaChart.test.ts` (new) | Correct number of gradient defs and area paths for series count; data circles have `tabIndex=0`; Enter key on circle shows tooltip |
| `src/components/charts/BarChart.test.ts` (new) | Sorted descending renders bars in correct order; horizontal orientation produces correct `rect` dimensions; stacked mode renders `BarStack` |
| `src/components/charts/DonutChart.test.ts` (new) | N slices produce N `path` elements; `centerLabel` text present; arc angles sum to 2π |
| `src/components/charts/Heatmap.test.ts` (new) | 31 cells render 31 `rect` elements; each `rect` has `tabIndex=0`; `aria-label` contains date string; Enter key shows tooltip |
