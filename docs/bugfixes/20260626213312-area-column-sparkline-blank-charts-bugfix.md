# Bugfix Specification: Area/Column/Sparkline Charts Render Blank
**Timestamp:** 20260626213312
**Status:** Approved for Implementation

### 1. Requirements & Accessibility Evaluation
- **Business/User Impact:** Every AreaChart in Overview (Token usage, Cost vs budget, Quality score trend), Reliability (Error trend, Coverage heatmap animations), and Billing (Cumulative spend, Invoice history ColumnChart, Sparkline KPI cards) renders with correct axes and grid lines but no visible data. Users cannot read time-series trends, cost trajectories, or quality score history. The dashboard is effectively decorative only.
- **Accessibility (a11y) Impact:** The blank charts still render `role="listitem"` circles (one per data point) as focusable elements. Screen readers encounter those elements but their `aria-label` reads `"cost: undefined"` (literal "undefined") because `datum[series]` is `undefined`. The fix will make those labels carry real values (`"cost: 12345"`).

### 2. Technical Specification
- **Root Cause:** All Visualization marks (Area, Line, Bar) access the Y value as `d[props.series]`. This requires each data point object to have a key matching the series ID. However every chart wrapper that prepares data (`AreaChart`, `ColumnChart`, `Sparkline`) passes the raw data whose Y value is under the key `"value"`, not under the series ID. Example: AreaChart for series `input_tokens` stores `{date:'2026-06-01', value:500000}` but the Area mark reads `d["input_tokens"]` which is `undefined`. The y-axis scale domain is computed correctly via `accessor: (d) => d.value`, so axes appear correct; only marks are blank.
- **Compliance Check:** The fix keeps the mark convention (`d[series]` for Y) unchanged - that convention is correct per the architecture. Changes are limited to the 3 chart wrapper files that prepare data before passing it to Visualization. This complies with ARCHITECTURE.md (no new abstractions, modifications to existing files only) and CLAUDE.md (no added features, no over-engineering, fix only what is broken).

### 3. Implementation Plan
- **Proposed Changes:**
  - `src/components/charts/AreaChart.tsx` - when building the data signal, map each point to include `[s.id]: d.value` alongside the existing fields. The y-axis accessor `(d) => d.value` keeps working for scale domain computation.
  - `src/components/charts/ColumnChart.tsx` - when building the data signal, map each bar to include `bars: b.value` alongside existing fields. Both the Bar mark and the ColumnTrendLine (which reads `d.value` directly) remain correct.
  - `src/components/charts/Sparkline.tsx` - when building the data signal, map each point to include `trend: d.value` alongside existing fields.
- **File Name & Structural Hygiene Re-evaluation:** No renaming needed. The three files are already correctly named and located.

### 4. Verification & Testing Strategy
- **New Test Scenarios:**
  - `AreaChart.test.tsx`: assert single-series path has a non-empty, non-NaN `d` attribute (proves the path is actually drawn with real coordinates).
  - `ColumnChart.test.tsx`: assert at least one rect has a `height` attribute that is a valid finite number string (proves bars render with real heights).
  - `Sparkline.test.tsx`: assert the path has a non-empty `d` attribute (proves sparkline is drawn).
- **Regression Strategy:** `npm run test -- --run`
