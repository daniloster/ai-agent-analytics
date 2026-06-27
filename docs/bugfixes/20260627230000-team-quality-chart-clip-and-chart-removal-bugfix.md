# Bugfix Specification: Team Quality Chart Label Clip + Chart Removal
**Timestamp:** 20260627230000
**Status:** Approved for Implementation

### 1. Requirements & Accessibility Evaluation
- **Business/User Impact:** (1) DataLabel "5.0" for the highest Platform column is clipped at the top of the "Quality score per team" chart because `quality_y` domain ceiling equals the max data value (5), leaving zero pixel headroom for the SVG text rendered 8px above the point. (2) "Use cases by team" and "Cost per quality point" charts add visual noise without actionable insight for this view and should be removed.
- **Accessibility (a11y) Impact:** Label clip only affects sighted users; no ARIA impact. Removing charts removes aria-label figures from the DOM - no regression since screen-reader users lose redundant content, not primary data already in TeamTable.

### 2. Technical Specification
- **Root Cause (issue 1):** `buildTeamQualityAxes` in `TeamBreakdown.tsx` hard-codes `domain: [paddedMin, 5]`. When the highest quality score equals or approaches 5.0, the DataLabel SVG `<text>` element (`y = yScale(5.0) - 8`) renders above the SVG clip boundary. Fix: compute `paddedMax = Math.min(5.5, maxQ + 0.5)` so there is at least 0.5 units of vertical headroom regardless of data values. Same latent issue exists in `buildQualityTrendAxes` in `Overview.tsx`; fix both for consistency.
- **Root Cause (issue 2):** Both figures are present in the org-wide view; user explicitly asks for their removal.
- **Compliance Check:** Pure helper functions stay outside component body per ARCHITECTURE.md §4.4. No new files needed. Test updates for figcaption count and quality axis domain.

### 3. Implementation Plan
- **`src/components/sections/TeamBreakdown.tsx`**
  - `buildTeamQualityAxes`: derive `maxQ`, set `paddedMax = Math.min(5.5, maxQ + 0.5)`, use `[paddedMin, paddedMax]` as domain
  - Remove `nonNullQuality`, `avgCostPerQualityPoint`, `cpqDataSig` computed values
  - Remove "Use cases by team" and "Cost per quality point" `<figure>` blocks
  - Remove `BAND_AXES` constant (only used by removed cpq chart)
  - Remove `Annotation` import (only used by removed cpq chart)
- **`src/components/sections/Overview.tsx`**
  - `buildQualityTrendAxes`: same `paddedMax` fix for consistency
- **File Name & Structural Hygiene:** No renames needed.

### 4. Verification & Testing Strategy
- **New Test Scenarios:**
  - `TeamBreakdown.test.tsx`: figcaption count changes 5 → 3; verify "Use cases by team" and "Cost per quality point" headings absent
  - `Overview.tsx`: no test change needed (quality trend axes not tested by content)
- **Regression Strategy:** `npm run test`
