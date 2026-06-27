# Bugfix Specification: Quality Score Card - Delta, Delta Label, and Subtext
**Timestamp:** 2026-06-27T17:00:00
**Status:** Approved for Implementation

### 1. Requirements & Accessibility Evaluation
- **Business/User Impact:** The Quality Score card has no delta, so users cannot see whether quality improved or declined. The star subtext says "rated runs" instead of the more descriptive "human-rated runs". Three gaps: (1) no prior-period score to compute delta; (2) `DeltaBadge` cannot show a 1-decimal absolute point change (only percent or integer); (3) `starRatingSubtext` wording is imprecise.
- **Accessibility (a11y) Impact:** No ARIA changes needed. `deltaLabel` and `starRatingSubtext` are visible text; existing patterns cover them.

### 2. Technical Specification
- **Root Cause:**
  - `OverviewResponse` has no `avg_quality_score_prior` field.
  - `DeltaBadge`/`KpiCardProps` `deltaFormat` only supports `'percent' | 'number'`. A +0.2 point change passed as `delta=0.2` with `deltaFormat='number'` would display as "0" (formatNumber rounds to integers).
  - `starRatingSubtext` string literal says "rated runs" not "human-rated runs".
- **New `deltaFormat: 'decimal'`:** Renders `Math.abs(delta).toFixed(1)` - matches the wireframe "+0.2" style.
- **Delta semantics:** Higher quality score is better; positive delta = green. No inversion needed.
- **Compliance Check:** `avg_quality_score_prior` follows the `_prior` convention. `'decimal'` is an additive enum value. No architectural violation.

### 3. Implementation Plan
- **Proposed Changes:**
  - `src/types/api.ts` - Add `avg_quality_score_prior: number | null` to `OverviewResponse`.
  - `src/lib/mock/generators/overview.ts` - Generate `avgQualityScorePrior` (null when `!hasQualityData`, else random 1-5); include in return.
  - `src/components/kpis/KpiCard.tsx` - Add `'decimal'` to `deltaFormat` union; `DeltaBadge` uses `Math.abs(delta).toFixed(1)` when `deltaFormat === 'decimal'`.
  - `src/components/sections/Overview.tsx` - Quality Score `KpiCard`:
    - Add `delta={d && d.avg_quality_score !== null && d.avg_quality_score_prior !== null ? d.avg_quality_score - d.avg_quality_score_prior : undefined}`
    - Add `deltaFormat="decimal"`
    - Add `deltaLabel="vs previous period"`
    - Change `starRatingSubtext` to use "human-rated runs".
- **File Name & Structural Hygiene Re-evaluation:** No rename needed.

### 4. Verification & Testing Strategy
- **New Test Scenarios:**
  - `KpiCard.test.tsx`: `deltaFormat="decimal"` with `delta=0.2` renders "0.2" (not "0.2%" or "0").
  - `KpiCard.test.tsx`: `deltaFormat="decimal"` with `delta=-0.3` renders "-0.3".
  - `Overview.test.tsx`: "vs previous period" label appears on the Quality Score card.
  - `Overview.test.tsx`: "human-rated runs" text appears in the subtext.
- **Regression Strategy:** `npm run test`
