# Bugfix Specification: Cost Chart Stale Data + Signal Reactivity
**Timestamp:** 20260627190000
**Status:** Approved for Implementation

### 1. Requirements & Accessibility Evaluation
- **Business/User Impact:** The "Cost vs. budget" chart does not update when the date range filter changes. After switching filters, it shows stale data from the initial page load (wrong dates on x-axis, wrong scale on y-axis). The same issue affects the "Token usage over time" chart and the "Quality Score Trend" chart. Y-axis scaling is wrong because it is frozen at the initial data's domain.
- **Accessibility (a11y) Impact:** No new a11y concerns introduced. SVG `aria-label` attributes on the chart figures already describe each chart.

### 2. Technical Specification
- **Root Cause:** `@preact/signals-react` `useComputed` (and `useDeepComputed`) creates a lazy `computed` signal via `useMemo(() => computed(() => $compute.current()), [])`. The computed only re-evaluates when a tracked **signal** `.value` read inside its computation changes. `costSeries`, `tokenSeries`, and `qualityTrendQuery.data` are plain JS values derived from TanStack Query React state - they are NOT signals. So `costDataSig`, `tokenDataSig`, and `qualityTrendDataSig` all freeze at their first computed value (the initial page load's data) and never update when the filter signal changes and new data loads.
- **Evidence:** `Visualization.tsx:362` uses `useLiveSignal(props.axes)` for exactly this reason - comment says "Convert the axes prop to a stable signal so VisualizationInner can track it via useDeepComputed." The same bridge is needed for data computed from React state.
- **Secondary root cause:** `todayStr = new Date().toISOString().slice(0, 10)` is UTC-based. In UTC+ timezones this can produce "yesterday" as the cutoff, causing today's actual data to be placed in the projected series instead of actual.
- **Compliance Check:** `useLiveSignal` is already in `src/hooks/useLiveSignal.ts` and used in `Visualization.tsx`. Replacing `useDeepComputed` with `useLiveSignal` for React-state-derived data is the intended pattern per the existing architecture.

### 3. Implementation Plan
- **`src/components/sections/Overview.tsx`:**
  - Remove `useDeepComputed` import; add `useLiveSignal` import.
  - Fix `todayStr` to use local date components (`getFullYear/getMonth/getDate`).
  - Replace `tokenDataSig = useDeepComputed(...)` with `useLiveSignal(tokenData)` where `tokenData` is computed synchronously each render.
  - Replace `costDataSig = useDeepComputed(...)` with `useLiveSignal(costData)` where `costData` is computed synchronously each render.
  - Remove the intermediate `qualityMonthly` computed signal (was itself stale for the same reason).
  - Replace `qualityTrendDataSig = useDeepComputed(...)` with `useLiveSignal(...)` using an inline IIFE that calls `aggregateQualityMonthly` directly.
- **`src/components/sections/Overview.test.tsx`:**
  - Add test: cost vs budget chart renders SVG paths when timeseries data is present.
  - Add test: cost chart SVG path count increases after data has more points.
- **File System Hygiene Re-evaluation:** No renames required.

### 4. Verification & Testing Strategy
- **New Test Scenarios:**
  - `cost vs budget chart renders paths when timeseries data is present` - verifies that after data load, SVG path elements exist inside the cost figure.
  - `cumulative cost is computed from sum of daily costs` - verifies `costSeries` accumulation logic is correct.
- **Regression Strategy:**
  ```bash
  npm run test
  ```
