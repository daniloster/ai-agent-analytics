# Bugfix Specification: Quality Score Trend Chart

**Timestamp:** 20260627200000
**Status:** Approved for Implementation

### 1. Requirements & Accessibility Evaluation

- **Business/User Impact:** The Quality Score Trend chart currently shows daily timeseries data for a single area series scoped to the selected filter period. It must instead show the last 6 months of monthly-aggregated data from the last day of the selected period, with two series: an Area for average quality score and a Bar for rating volume.
- **Accessibility (a11y) Impact:** The new Bar series will carry `tabIndex=0`, `role="listitem"`, and `aria-label` per bar (already enforced by the existing Bar mark). DataLabels text nodes have `pointerEvents="none"` so they do not interfere with keyboard navigation. The chart figure retains its `aria-label` attribute. Legend items use color+text (not color alone).

### 2. Technical Specification

- **Root Cause:** Three independent failures:
  1. The chart reads `ts.points` from the filter-period timeseries (max 30 days) instead of a dedicated 6-month window; no monthly aggregation occurs.
  2. Only a single `AreaChart` series is rendered; the Rating Volume bar series and its hidden y-axis are absent.
  3. The Area mark has no `centered` prop, so when used over a band x-scale (required for the Bar mark), line points land at band left edges instead of centers. The axis domain for quality is also forced to start at 0 by `buildScale`.

- **Compliance Check:**
  - All new files are co-located with their test files (ARCHITECTURE.md §5.1).
  - New utility `aggregateQualityMonthly` extracted to `src/utils/` with a test file (ARCHITECTURE.md §2.3).
  - Component function declarations used (ARCHITECTURE.md §4.3).
  - Pure helpers hoisted outside components (ARCHITECTURE.md §4.4).
  - No `useState` - signals and `useDeepComputed` used for all mutable state (ARCHITECTURE.md §3.1).

### 3. Implementation Plan

- **Proposed Changes:**
  - `src/types/api.ts` - add `rated_run_count: number` to `TimeseriesPoint`
  - `src/lib/mock/generators/timeseries.ts` - generate `rated_run_count` per point
  - `src/utils/aggregateQualityMonthly.ts` (new) - pure function: groups daily points into monthly buckets (up to 5 complete months + partial + "Now")
  - `src/utils/aggregateQualityMonthly.test.ts` (new) - unit tests
  - `src/components/charts/marks/Area.tsx` - add `centered?: boolean` prop (offsets x by `bandwidth/2` on band scale); add `defined` to skip null values
  - `src/components/charts/marks/Area.test.tsx` - add test for `centered`
  - `src/components/charts/overlays/DataLabels.tsx` (new) - SVG text labels at each non-null data point
  - `src/components/charts/overlays/DataLabels.test.tsx` (new)
  - `src/components/sections/Overview.tsx` - add 6-month quality trend query; compute monthly data; new axes (band x, linear quality-y left, linear volume-y right hidden); render Area+DataLabels+Bar; update legend/title/subtitle
  - `src/components/sections/Overview.test.tsx` - add `rated_run_count` to TIMESERIES fixture; add quality trend tests

- **File Name & Structural Hygiene Re-evaluation:** No renames required. `DataLabels` fits naturally in `src/components/charts/overlays/`. The utility belongs in `src/utils/`.

### 4. Verification & Testing Strategy

- **New Test Scenarios:**
  - `aggregateQualityMonthly` - groups daily points correctly, handles partial month end, "Now" point, null quality months
  - `DataLabels` - renders text labels at correct positions, skips nulls, respects `centered`
  - `Area` centered prop - x positions offset by bandwidth/2 when base scale is band
  - `Overview` - quality trend figure renders with correct subtitle "6-month trajectory", legend shows "Avg Quality Score" and "Rating Volume"

- **Regression Strategy:** `npm run test`
