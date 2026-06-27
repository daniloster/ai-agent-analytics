# Bugfix Specification: Success Rate Card - Missing Dynamic Delta Label
**Timestamp:** 2026-06-27T16:00:00
**Status:** Approved for Implementation

### 1. Requirements & Accessibility Evaluation
- **Business/User Impact:** The Success Rate KpiCard shows a delta percentage but no contextual label. Users cannot tell at a glance whether the change demands attention to errors or to request volume. The label should read "watch errors" when success rate dropped (negative delta) and "watch requests count" when it improved (positive delta).
- **Accessibility (a11y) Impact:** `deltaLabel` renders as visible text. No ARIA changes needed.

### 2. Technical Specification
- **Root Cause:** The Success Rate `KpiCard` call site in `Overview.tsx` omits `deltaLabel`. No data gap - `success_rate` and `success_rate_prior` are both present on `OverviewResponse`.
- **Logic:** `computeDeltaPercent(success_rate, success_rate_prior)` is the raw delta. If delta < 0 → "watch errors"; if delta >= 0 → "watch requests count". When `d` is null the prop is `undefined`.
- **Compliance Check:** Single-prop addition at the call site. No new files, no type changes, no architectural impact.

### 3. Implementation Plan
- **Proposed Changes:**
  - `src/components/sections/Overview.tsx` - Add `deltaLabel` to Success Rate `KpiCard` based on sign of `computeDeltaPercent(d.success_rate, d.success_rate_prior)`.
- **File Name & Structural Hygiene Re-evaluation:** No rename needed.

### 4. Verification & Testing Strategy
- **New Test Scenarios:**
  - `Overview.test.tsx`: when `success_rate > success_rate_prior`, "watch requests count" is rendered.
  - `Overview.test.tsx`: when `success_rate < success_rate_prior`, "watch errors" is rendered.
- **Regression Strategy:** `npm run test`
