# Bugfix Specification: Cost/Quality Point Card - Delta, Dynamic Label, and Tooltip
**Timestamp:** 2026-06-27T18:00:00
**Status:** Approved for Implementation

### 1. Requirements & Accessibility Evaluation
- **Business/User Impact:** The Cost/Quality Point card has no delta, so users cannot see whether cost efficiency is improving or degrading. The tooltip exposes internal formula property names ("rated_run_count * avg_quality_score") instead of human language.
- **Accessibility (a11y) Impact:** No ARIA changes. `deltaLabel` renders as visible text per existing pattern.

### 2. Technical Specification
- **Root Cause:**
  - `OverviewResponse` has `cost_per_quality_point` but no `cost_per_quality_point_prior`.
  - The card call site omits `delta`, `deltaLabel`, and has a developer-facing `formulaTooltip`.
- **Delta semantics:** Lower cost per quality point = better efficiency. Cost going DOWN = green = "improving efficiency". Same inversion as Retention Cost: pass `-computeDeltaPercent(current, prior)`.
- **Dynamic deltaLabel:** `costPerQualityPoint <= prior` → "improving efficiency"; else → "degrading efficiency".
- **Tooltip improvement:**
  - `formulaTooltip`: "How much you spend per unit of quality delivered. Calculated as total cost divided by the volume of quality-rated outputs. Lower means better value."
  - `exampleTooltip`: "e.g. $0.42 per quality point"
- **Compliance Check:** Follows `_prior` naming convention. Additive change. No architectural violation.

### 3. Implementation Plan
- **Proposed Changes:**
  - `src/types/api.ts` - Add `cost_per_quality_point_prior: number | null` to `OverviewResponse`.
  - `src/lib/mock/generators/overview.ts` - Generate `costPerQualityPointPrior` (null when `!hasQualityData`); include in return.
  - `src/components/sections/Overview.tsx` - Cost/Quality Point `KpiCard`:
    - Add negated `delta` using `d.cost_per_quality_point_prior`
    - Add dynamic `deltaLabel`
    - Improve `formulaTooltip` and `exampleTooltip`
- **File Name & Structural Hygiene Re-evaluation:** No rename needed.

### 4. Verification & Testing Strategy
- **New Test Scenarios:**
  - `Overview.test.tsx`: "improving efficiency" or "degrading efficiency" appears for the Cost/Quality card after data loads (assert at least one efficiency label is present, since Retention Cost also uses these labels).
- **Regression Strategy:** `npm run test`
