# Bugfix Specification: Chart Components Composition Violation

**Timestamp:** 20260627120000
**Status:** Implemented

### 1. Requirements & Accessibility Evaluation

- **Business/User Impact:** `AreaChart`, `ColumnChart`, and `Sparkline` bundled data setup, axis configuration, `<Visualization>` rendering, mark composition, and tooltip logic into monolithic prop-based components. Consumers could not swap marks, add overlays, change axis configs, or mix multiple series without modifying the primitives. This blocked domain-specific chart composition and was a direct violation of the composition-first principle established in ARCHITECTURE.md §4.2.

- **Accessibility (a11y) Impact:** No regression. The `ariaLabel` previously passed to all-in-one components is now passed directly by consumers to `<Visualization>`, which renders it on the `<figure>` element. Chart keyboard navigation (focusable data points via `marks/Area` and `marks/Bar`) is unchanged. Screen reader landmark and label behavior is preserved.

---

### 2. Technical Specification

- **Root Cause:** `AreaChart`, `ColumnChart`, and `Sparkline` internally constructed data signals, defined axis configs, and rendered `<Visualization>`. The consumer had no composition surface - only a fixed set of props to influence what the primitive had already decided to render. The `Visualization` render-prop API was designed for consumers to compose marks and overlays freely; these three components bypassed that contract by wrapping it.

- **Compliance Check:**
  - ARCHITECTURE.md §4.2 - Composition Patterns: "Prefer composition over deep nesting." The refactoring corrects the violation by making `AreaChart`, `ColumnChart`, `SparklineChart` composable leaves inside a consumer-owned `<Visualization>`.
  - ARCHITECTURE.md §4.3 - Component Definition Style: All new/modified components use `function ComponentName(` declarations. Named exports only.
  - ARCHITECTURE.md §4.4 - Hoist pure functions: Axis config constants that do not close over component scope are defined at module level.
  - ARCHITECTURE.md §3.2 - Signal Architecture: `useDeepComputed` used in consumer sections to build data signals from React query state.
  - ARCHITECTURE.md §5.1 - Tests mandatory: Every modified/created file has a co-located test file updated or created.

---

### 3. Implementation Plan

#### Chart primitive changes

**`src/components/charts/AreaChart.tsx`** - Stripped `<Visualization>`. Now a thin composable wrapper around `marks/Area`. Exports `AreaChartProps` (alias for `AreaProps`) and `AreaChart`.

**`src/components/charts/ColumnChart.tsx`** - Stripped `<Visualization>`. Exports two composable marks:
- `ColumnChart` - renders `<Bar>` with forwarded props
- `ColumnTrendLine` - standalone overlay showing trend LinePath (was private, now exported)

**`src/components/charts/SparklineChart.tsx`** (renamed from `Sparkline.tsx`) - Stripped `<Visualization>`. Composable area mark with sparkline defaults (fillOpacity 0.15). Exports `SparklineChartProps` and `SparklineChart`. The name was updated from `Sparkline` to `SparklineChart` to maintain semantic consistency: `Sparkline` was too small-element-sounding for a component used inside a full Visualization context alongside chart-level peers.

**`src/components/charts/overlays/SeriesTooltip.tsx`** - The old render-prop `SeriesTooltip` (which was wired into `VIS_MARKS` but never used by any consumer) was deleted. A new `SeriesTooltip` was created from the extracted `AreaTooltip` logic (previously private inside `AreaChart`). Exports:
- `SeriesTooltipSeries` interface
- `SeriesTooltipProps` interface
- `SeriesTooltip` function component - reads `useVisualizationContext`, renders crosshair + per-series circles + date-keyed tooltip box for multiple series

**`src/components/charts/Visualization.tsx`** - Removed the old `SeriesTooltip` from the `VisMark` type and `VIS_MARKS` singleton. It was never used by any consumer via the `marks` argument.

**Deleted (unused):**
- `src/components/charts/overlays/MouseTooltip.tsx` - render-prop tooltip not referenced anywhere
- `src/components/charts/overlays/MouseTooltip.test.tsx`
- `src/components/charts/Sparkline.tsx` (superseded by `SparklineChart.tsx`)
- `src/components/charts/Sparkline.test.tsx` (superseded by `SparklineChart.test.tsx`)

#### Consumer section changes

**`src/components/sections/Overview.tsx`** - Three chart usages replaced with `<Visualization>` + composable marks:
1. Token usage: `tokenDataSig` + `<AreaChart series="input_tokens"/>` + `<AreaChart series="output_tokens"/>` + `<SeriesTooltip>`
2. Cost vs budget: `costDataSig` + per-series `<AreaChart>` + `<Annotation>` for budget line + `<SeriesTooltip>`
3. Quality score trend: `qualityDataSig` + single `<AreaChart>` + `<SeriesTooltip>`

**`src/components/sections/Billing.tsx`** - Two usages replaced:
1. Cumulative spend: `spendDataSig` + `<Visualization>` + per-series `<AreaChart>` + `<Annotation>` + `<SeriesTooltip>`
2. Invoice history: `invoiceDataSig` + `<Visualization>` + `<ColumnChart>` + `<ColumnTrendLine>`

**`src/components/sections/Reliability.tsx`** - One usage replaced: `errorDataSig` + `<Visualization>` + `<AreaChart>` + `<Annotation>` + `<SeriesTooltip>`

**`src/components/sections/TeamBreakdown.tsx`** - Three usages replaced:
1. Team cost sparkline: `sparklineDataSig` + `<Visualization axes={SPARKLINE_AXES}>` + `<SparklineChart>`
2. Quality score column chart: `qualityScoreDataSig` + `<Visualization>` + `<ColumnChart>`
3. Cost-per-quality-point column chart: `cpqDataSig` + `<Visualization>` + `<ColumnChart>` + `<Annotation>`

**`src/components/kpis/KpiCard.tsx`** - Added module-level `SPARKLINE_AXES`; `useDeepComputed` hook builds trend signal from `props.trend`; replaces old `<Sparkline data={...}/>` (wrong API) with `<Visualization>` + `<SparklineChart>` composed directly at the call site.

**`src/components/kpis/TeamTable.tsx`** - Added module-level `SPARKLINE_AXES`; extracted private `TeamRow` sub-component so `useDeepComputed` can be called as a hook (not inside a `.map()` callback); composes `<Visualization>` + `<SparklineChart>` per row.

#### Data shaping convention (unchanged contract, now consumer-owned)

All chart data signals follow the double-keying pattern:
```
{ [seriesId]: Array<{ date?: string, value: number, [seriesId]: number, ...rest }> }
```
- `d.value` - used by the y-axis scale domain accessor
- `d[seriesId]` - used by `Area`/`Bar` mark renderers
- `d.date` or `d.label` - used by the x-axis accessor

---

### 4. Verification & Testing Strategy

- **New/Updated Test Files:**
  - `AreaChart.test.tsx` - rewritten: renders within `VisualizationContext` via `renderWithVisualizationContext`; tests gradient stop-opacity, dashed stroke-dasharray, null return when innerWidth=0
  - `ColumnChart.test.tsx` - rewritten: `ColumnChart` renders rects, `ColumnTrendLine` renders path, both within mock context
  - `SparklineChart.test.tsx` (renamed from `Sparkline.test.tsx`) - renders `Area` with 0.15 fill default, custom fillOpacity forwarded, no throw on empty data
  - `overlays/SeriesTooltip.test.tsx` - rewritten: null when no activePoint; renders crosshair/rect/circles/text when activePoint set; `formatValue` callback applied; series labels visible

- **Regression Strategy:** `npm run test` - 392 tests across 59 files, all passing.
