# Bugfix Specification: AreaChart Cumulative Data, Axis Density, Legend, Crosshair, Projected Series
**Timestamp:** 20260626224522
**Status:** Approved for Implementation

---

### 1. Requirements & Accessibility Evaluation

- **Business/User Impact:** "Token usage over time" and "Cost vs. budget" charts have four distinct problems: (1) daily (non-cumulative) data makes the fills look like jagged closed mountain shapes rather than smooth upward ramps; (2) too many axis tick labels pollute both axes; (3) "Cost vs. budget" has no legend (Actual / Projected / Budget items); (4) no crosshair/tooltip on hover and no budget-utilisation annotation.
- **Accessibility (a11y) Impact:** Adding an SVG crosshair is visual-only - the invisible circle elements in Area.tsx already handle keyboard navigation and ARIA. The legend items use semantic `<span>` elements with text labels. No ARIA regressions. The budget reference line label already uses a `<text>` element readable by assistive technology.

---

### 2. Technical Specification

**Root Cause (4 issues):**

1. **Jagged "closed" appearance** - `Overview.tsx` passes daily `p.cost` and daily `p.input_tokens`/`p.output_tokens` values. `AreaClosed` draws from the line to y=0 each day, producing mountain shapes. Fix: accumulate a running sum before building the series arrays. Cumulative monotone data produces an upward-ramp fill that matches the wireframe.

2. **Too many axis ticks** - `AREA_CHART_AXES` in `AreaChart.tsx` does not set `numTicks`. visx defaults to ~10 ticks per axis. Fix: set `numTicks: 5` on the x-axis and `numTicks: 4` on the y-axis via the `AxisConfig.numTicks` field (already in the type).

3. **Missing Cost vs. Budget legend** - The figure header for "Cost vs. budget" in `Overview.tsx` has no legend. Wireframe shows: Actual (solid blue line icon), Projected (dashed gray line icon), Budget (solid red line icon). Fix: add a legend `<div>` in the figure header, conditionally rendering "Projected" item only when a projected series exists.

4. **No crosshair, no annotation, hardcoded warning variant** - `AreaChart.tsx` renders no tooltip or crosshair. `referenceLine` is hardcoded to `variant="warning"` (amber). For the budget line, `variant="destructive"` (red) is correct. Fix: add `variant` field to `referenceLine` prop; add an `AreaCrosshair` SVG mark inside `AreaChart`; compute and include the budget-utilisation percentage in the reference line label.

**Projected series derivation:**
- Determine "today" as `new Date().toISOString().slice(0, 10)`.
- Points with `date <= todayStr` are actual; points after are projected.
- Projected cost = last actual cumulative + daily average burn rate per future day.
- Projected series uses `dashed: true` and `fillOpacity: 0.05` (barely visible fill, wireframe matches).
- If the filter range ends on or before today, no projected series is emitted.

**`AreaCrosshair` (new SVG component inside `AreaChart.tsx`):**
- Reads `activePoint`, `baseScale`, `baseAxisAccessor`, `scales`, `innerHeight` from `VisualizationContext`.
- Recomputes `x` from `datum` via `baseScale` (avoids the SVG-outer vs inner coords inconsistency between `handlePointerMove` and circle hover paths).
- Draws a vertical `<line>` and a `<circle>` at the active data point for each series whose datum key is present.
- `pointerEvents="none"` so it never blocks hover on underlying circles.

**Compliance Check:** All changes are to existing files (no new files). `AreaChart.tsx` and `Overview.tsx` changes respect named exports, functional components, zero `any`, signal ownership. `AreaCrosshair` uses `useVisualizationContext()` exactly like `Area` and `Annotation`. ARCHITECTURE.md rules not violated.

---

### 3. Implementation Plan

**`src/components/charts/AreaChart.tsx`**
- Add `numTicks: 5` to x axis config, `numTicks: 4` to y axis config.
- Add `variant?: 'warning' | 'destructive'` to `referenceLine` prop type.
- Add `fillOpacity?: number` to `AreaChartSeries` interface.
- Pass `fillOpacity` through to `<Area>` mark.
- Pass `referenceLine.variant` to `<Annotation>` (default `'destructive'`).
- Add `AreaCrosshair` component (SVG-native: vertical line + circle per active series).
- Include `<AreaCrosshair series={series} />` inside the Visualization render.

**`src/components/sections/Overview.tsx`**
- `tokenSeries`: accumulate running sums for `input_tokens` and `output_tokens`.
- `costSeries`: accumulate running sum; split into actual (up to today) + projected (after today, dashed, fillOpacity: 0.05); derive projected values from daily average.
- Compute `budgetPct = d && orgConfig ? (d.total_cost / orgConfig.monthly_budget) * 100 : null`.
- Update `referenceLine` label to include budget and pct (e.g. `"$15k budget"`), `variant: "destructive"`.
- Add legend to Cost vs. Budget figure header: Actual (solid blue), Projected (dashed gray - only when projectedCostData.length > 1), Budget (solid red).

**File Name & Structural Hygiene:** No renames needed.

---

### 4. Verification & Testing Strategy

- **`AreaChart.test.tsx`**: Add test that `fillOpacity: 0.05` series does not render a `<linearGradient>` with high from-opacity (or verify gradient `stop-opacity` is 0.05). Add test that `referenceLine` with `variant: 'destructive'` renders without throwing.
- **`Overview.tsx` smoke test**: Manually verify cumulative shape in browser (data ramps upward monotonically).
- **Regression Strategy:** `npm run test`
