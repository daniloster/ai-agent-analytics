# Bugfix Specification: Reliability Section - KPI Cards, Error Breakdown, Availability Heatmap
**Timestamp:** 20260627162000
**Status:** Approved for Implementation

### 1. Requirements & Accessibility Evaluation
- **Business/User Impact:**
  - 8 KPI cards show no delta, no delta label, no sparkline trend - cards are unactionable.
  - Error rate trend area chart has no conditional color - misses the threshold-crossing signal.
  - Error type breakdown uses wrong categories, no donut center total, no legend.
  - Platform availability heatmap multiplies uptime_pct by 100 (already a % value), uses calendar layout instead of flex-wrapped day boxes, missing footer stats.
- **Accessibility (a11y) Impact:** Day boxes get `title` attributes for hover details. Legend items are semantically structured. Donut center text is `aria-hidden`. Footer stats use semantic `<dl>`.

### 2. Technical Specification
- **Root Cause:**
  1. Cards: `ReliabilityResponse` has no prior values or trend arrays for 7 of 8 KPIs (only error_rate_prior exists). KpiCard `delta` and `trend` props are not wired.
  2. Error trend color: AreaChart `color` prop not passed; hardcoded to default blue.
  3. Error type breakdown: wrong enum values in type + mock; DonutChart has no center text API; no custom legend rendered.
  4. Heatmap: `formatPercent(d.platform_availability * 100)` doubles the %; old `Heatmap` component does calendar grid layout not matching the day-box spec.
- **Compliance Check:** All changes are additions/modifications to existing files. New inline components follow functional component + named export rules. No class components, no `any` without comment, TypeScript strict. Complies with ARCHITECTURE.md and CLAUDE.md.

### 3. Implementation Plan
- **`src/types/api.ts`**: Add to `ReliabilityResponse`:
  - Prior fields: `timeout_rate_prior`, `p50_duration_ms_prior`, `p95_duration_ms_prior`, `p99_duration_ms_prior`, `retry_rate_prior`, `mttr_minutes_prior`, `cost_of_failed_runs_prior`
  - Trend fields: `timeout_rate_trend`, `p50_duration_trend`, `p95_duration_trend`, `p99_duration_trend`, `retry_rate_trend`, `mttr_trend`, `cost_of_failed_runs_trend`
  - Update `error_type_breakdown` union to: `'model_error' | 'timeout' | 'tool_call_failure' | 'rate_limit' | 'other'`
- **`src/lib/mock/generators/reliability.ts`**: Generate all new prior/trend fields; switch `buildErrorTypeBreakdown` to 5 new categories.
- **`src/components/charts/DonutChart.tsx`**: Add optional `centerLine1?: string` and `centerLine2?: string` props; render SVG text at center.
- **`src/components/sections/Reliability.tsx`**:
  - Wire `delta`, `deltaLabel`, `trend`, `trendColor` on all 8 KpiCards.
  - Compute `errorRateColor` from `d.error_rate > 0.05 ? '#ef4444' : '#2563eb'`; pass to AreaChart.
  - Replace error type breakdown `<DonutChart>` with flex layout: donut + legend list.
  - Replace `<Heatmap>` with inline `AvailabilityDayBox` component + flex-wrap container + footer.
  - Fix `platform_availability` title: `formatPercent(d.platform_availability)` (no *100).
- **File Name & Structural Hygiene:** No renames needed. New `AvailabilityDayBox` is a file-local function.

### 4. Verification & Testing Strategy
- **New Test Scenarios:**
  - Error rate AreaChart has `fill` color matching the threshold check.
  - Error type breakdown figure has title "Error Type Distribution".
  - Donut shows total error count text.
  - Availability section has day boxes (small divs with `title` attributes).
  - Footer shows "MTD Availability" text.
- **Regression Strategy:** `npm run test`
