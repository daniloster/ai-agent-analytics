# Bugfix Specification: AreaChart Axis Lines, Grid Color, Series Colors, Legend
**Timestamp:** 20260626222821
**Status:** Approved for Implementation

---

### 1. Requirements & Accessibility Evaluation

- **Business/User Impact:** "Token usage over time" and "Cost vs. budget" area charts show a visible vertical Y-axis line and tick marks that should not appear per the wireframe. Grid lines are too dark. Both token series render in the same blue color instead of two distinct colors (blue + teal). "Token usage over time" is missing the top-right series legend (colored dots + labels).
- **Accessibility (a11y) Impact:** Hiding axis lines/ticks with `hideAxisLine`/`hideTicks` is a visual-only change - tick labels (the numeric values) remain fully present in the SVG for screen readers. The legend added to the token chart uses role-neutral `<span>` elements with text labels, which are readable by assistive technology. No ARIA regressions.

---

### 2. Technical Specification

**Root Cause (4 issues):**

1. **Y-axis visible line/ticks** - `Axis.tsx` passes `stroke={tokens.muted}` and `tickStroke={tokens.muted}` to visx's `AxisLeft` and `AxisBottom` without `hideAxisLine`/`hideTicks`. Visx renders the axis domain line and tick marks at those colors. The wireframe shows floating labels only - no domain line, no tick marks.

2. **Grid lines wrong color/opacity** - `Grid.tsx` uses `stroke={tokens.border}` (#e4e4e7) at `strokeOpacity={0.5}`, producing a medium-gray grid. Wireframe specifies `stroke="#f4f4f5"` (the page background color, `tokens.background`) at full opacity - very light, barely visible separation lines. Additionally, `Visualization.tsx` renders `GridColumns` (vertical grid lines) which do not exist anywhere in the wireframes.

3. **Same color both series** - `Overview.tsx` builds `tokenSeries` without explicit `color` fields. `AreaChart` falls back to `tokens.primary` (#2563eb) for every series. Both "Input Tokens" and "Output Tokens" render blue. Wireframe: output_tokens = `#2563eb` (blue), input_tokens = `#0d9488` (teal).

4. **No legend** - `AreaChart` and `Overview.tsx` render no legend. Wireframe shows a `chart-legend` div at top-right of the chart header with 8px colored dots and 11px #71717a labels.

**Compliance Check:** All changes are to existing component files (no new files). `Axis.tsx` and `Grid.tsx` changes are global but safe - the wireframe shows this styling across all chart types. `Overview.tsx` changes are scoped to the token series data. No ARCHITECTURE.md rules violated.

---

### 3. Implementation Plan

**`src/components/charts/primitives/Axis.tsx`**
- `AxisLeft`: add `hideAxisLine={true}` `hideTicks={true}` - removes vertical domain line and tick marks while keeping floating labels.
- `AxisBottom`: add `hideAxisLine={true}` `hideTicks={true}` - removes horizontal domain line and tick marks while keeping floating labels.
- Keep existing `stroke`/`tickStroke` props (visx needs them even when hidden; avoids breaking the existing Axis test).

**`src/components/charts/primitives/Grid.tsx`**
- `GridRows`: change `stroke` from `tokens.border` to `tokens.background`; change `strokeOpacity` from `0.5` to `1`.
- Update `Grid.test.tsx` assertion from `tokens.border` to `tokens.background`.

**`src/components/charts/Visualization.tsx`**
- Remove the `GridColumns` render block (no vertical grid lines in any wireframe view).

**`src/components/sections/Overview.tsx`**
- Add `color: '#2563eb'` to `output_tokens` series, `color: '#0d9488'` to `input_tokens` series.
- Change token chart figure header `<div className="mb-4">` to `flex justify-between items-start` with title/subtitle on the left and a legend on the right (two items: 8px colored dot + label text, `text-[11px] text-muted-foreground`).

**File Name & Structural Hygiene:** No renames needed.

---

### 4. Verification & Testing Strategy

- **`Axis.test.tsx`**: Add assertions that `hideAxisLine` and `hideTicks` are `true` on `AxisLeft`.
- **`Grid.test.tsx`**: Update `GridRows` stroke assertion from `tokens.border` to `tokens.background`. Add `strokeOpacity: 1` assertion.
- **`AreaChart.test.tsx`**: Add test that two-series with explicit colors renders different stroke attributes.
- **`Visualization.test.tsx`**: Add test that `GridColumns` is NOT called.
- **Regression Strategy:** `npm run test`
