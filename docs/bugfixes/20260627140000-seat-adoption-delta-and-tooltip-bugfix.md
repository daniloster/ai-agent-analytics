# Bugfix Specification: Seat Adoption Card - Delta, Delta Label, and Tooltip
**Timestamp:** 2026-06-27T14:00:00
**Status:** Approved for Implementation

### 1. Requirements & Accessibility Evaluation
- **Business/User Impact:** The Seat Adoption card has no delta or context label, and its tooltip uses internal property names ("MAU / seat_count"). Users cannot see how seat usage changed vs. the prior period, nor how many seats are currently active out of the total provisioned. The tooltip reads as developer debug text rather than product copy.
- **Accessibility (a11y) Impact:** The `DeltaBadge` renders a visible badge with `+`/`-` prefix and color. No ARIA changes needed - the existing pattern is sufficient. `deltaLabel` text is visible and readable.

### 2. Technical Specification
- **Root Cause:**
  - `DeltaBadge` only knows how to format deltas as percentages (`formatPercent`). An absolute people-count delta (e.g. "+40 users") cannot be rendered without a `deltaFormat` discriminator.
  - The Seat Adoption `KpiCard` in `Overview.tsx` has no `delta`, `deltaLabel`, `formulaTooltip`/`exampleTooltip` improvements.
- **Compliance Check:** Adding an optional `deltaFormat` prop to `KpiCardProps` and `DeltaBadge` is additive and backwards-compatible. All existing call sites default to `'percent'`. No architectural violation.

### 3. Implementation Plan
- **Proposed Changes:**
  - `src/components/kpis/KpiCard.tsx`
    - Add `deltaFormat?: 'percent' | 'number'` to `KpiCardProps` and `DeltaBadge` props.
    - In `DeltaBadge`: when `deltaFormat === 'number'` use `formatNumber(Math.abs(delta))`, otherwise use `formatPercent(Math.abs(delta), 1)` (existing default).
  - `src/components/sections/Overview.tsx` - Seat Adoption `KpiCard`:
    - Add `delta={d ? d.mau - d.mau_prior : undefined}`
    - Add `deltaFormat="number"`
    - Add `deltaLabel={d ? \`${formatNumber(d.mau)} / ${formatNumber(d.seat_count)} seats\` : undefined}`
    - Change `formulaTooltip` to `"Percentage of provisioned seats used by active users this period - shows how much of your licensed capacity is being utilized."`
    - Change `exampleTooltip` to `"e.g. 85.0% (340 of 400 seats)"`
- **File Name & Structural Hygiene Re-evaluation:** No rename needed.

### 4. Verification & Testing Strategy
- **New Test Scenarios:**
  - `KpiCard.test.tsx`: `deltaFormat="number"` with delta=40 renders "40" (not "40.0%").
  - `KpiCard.test.tsx`: `deltaFormat` omitted still renders percentage (regression guard).
  - `Overview.test.tsx`: Seat Adoption card renders `"{N} / {M} seats"` pattern after data loads.
- **Regression Strategy:** `npm run test`
