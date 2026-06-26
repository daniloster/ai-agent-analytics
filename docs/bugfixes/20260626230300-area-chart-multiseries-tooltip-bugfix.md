# Bugfix Specification: AreaChart Multi-Series Tooltip
**Timestamp:** 20260626230300
**Status:** Approved for Implementation

---

### 1. Requirements & Accessibility Evaluation

- **Business/User Impact:** Hovering over an AreaChart with multiple series (e.g. "Token usage over time" with Input/Output, "Cost vs. budget" with Actual/Projected) shows no tooltip and only a crosshair line. Secondary series dots never appear because `activePoint.datum` only carries data from the first series. Users cannot read individual values at a given date from the chart.
- **Accessibility (a11y) Impact:** The SVG tooltip is rendered as `<rect>` + `<text>` elements with `pointerEvents="none"`. Screen readers already use the existing invisible `<circle>` elements with `role="listitem"` and `aria-label` for keyboard navigation - those are unchanged. No ARIA regressions.

---

### 2. Technical Specification

**Root Cause (2 issues):**

1. **`handlePointerMove` only reads the first series.** `Visualization.tsx` line 182: `const rawData = (Object.values(data.value)[0] ?? [])`. The bisect result uses only the first series' array, so `activePoint.datum` has fields `{ date, value, [firstSeriesId]: v }` but NOT the second series' keyed fields. In `AreaCrosshair`, `datum[s.id]` is `undefined` for every series beyond the first, so no dots and no tooltip values.

2. **`AreaCrosshair` has no tooltip text.** It only draws a vertical line and circles; there is no visual tooltip box with the date and series values.

**Fix:**

Replace `AreaCrosshair` in `AreaChart.tsx` with `AreaTooltip`, which:
- Gets the active date from `activePoint.datum['date']`.
- For **each series**, independently looks up its datum in `dataSignal.value[s.id]` by matching `d['date'] === activeDate`. This gives the series-specific value without depending on `handlePointerMove` carrying all series fields.
- Computes each series' y pixel position using `scales.value['y']`.
- Draws: a vertical crosshair `<line>`, a `<circle>` dot per series at its y, and an SVG tooltip `<rect>` + `<text>` showing date + one row per series with colored dot, label, and formatted value.
- Tooltip is positioned right of the crosshair when space permits, otherwise flipped left.
- `pointerEvents="none"` on the entire tooltip group prevents it from interfering with pointer tracking.

`formatValue?: (v: number) => string` added to `AreaChartSeries` so callers pass `formatTokens` / `formatCurrency` from the existing `formatters.ts`. Defaults to `toLocaleString` integers.

**Compliance Check:** Only `AreaChart.tsx` and `Overview.tsx` change. `AreaTooltip` uses `useVisualizationContext()` identically to `Area` and `Annotation`. Named exports, functional components, strict TypeScript, zero `any`. No ARCHITECTURE.md violations.

---

### 3. Implementation Plan

**`src/components/charts/AreaChart.tsx`**
- Add `formatValue?: (v: number) => string` to `AreaChartSeries`.
- Replace `AreaCrosshair` function with `AreaTooltip` function:
  - For each series: `dataSignal.value[s.id].find(d => d['date'] === date)?.[s.id]` → value.
  - Crosshair: `<line>` at x.
  - Dots: `<circle>` per series at (x, yFn(val)).
  - Tooltip box: `<rect>` + `<text>` for date header + rows for each series.
  - Position logic: flip left when `x + GAP + TOOLTIP_W > innerWidth`.
- Update `<AreaCrosshair series={series} />` call to `<AreaTooltip series={series} />`.

**`src/components/sections/Overview.tsx`**
- Import `formatTokens`, `formatCurrency` from `../../lib/kpi/formatters`.
- Add `formatValue: formatTokens` to each entry in `tokenSeries`.
- Add `formatValue: formatCurrency` to each entry in `costSeries`.

**File Name & Structural Hygiene:** No renames needed.

---

### 4. Verification & Testing Strategy

- **`src/components/charts/AreaChart.test.tsx`**: Add test that renders AreaChart with two-series data; after pointer move simulation, a `<text>` element containing the date string appears (tooltip header rendered). Use `buildMockContext` pattern if needed.
- **`src/components/charts/AreaChart.test.tsx`**: Add test that `formatValue` on a series controls the displayed string (tooltip shows the formatter's output, not raw integer).
- **Regression Strategy:** `npm run test`
