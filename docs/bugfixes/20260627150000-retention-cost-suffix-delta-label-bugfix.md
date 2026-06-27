# Bugfix Specification: Retention Cost Card - /user Suffix, Delta, and Dynamic Label
**Timestamp:** 2026-06-27T15:00:00
**Status:** Approved for Implementation

### 1. Requirements & Accessibility Evaluation
- **Business/User Impact:** The Retention Cost card is missing three elements visible in the wireframe and screenshot: (1) a `/user` unit suffix rendered in smaller muted text after the dollar value; (2) a period-over-period percentage delta with inverted color semantics (cost reduction = green); (3) a dynamic contextual label - "improving efficiency" when cost dropped, "degrading efficiency" when it rose.
- **Accessibility (a11y) Impact:** The `valueSuffix` span is purely decorative/contextual and needs no ARIA. The `deltaLabel` text is visible. No ARIA changes required beyond existing patterns.

### 2. Technical Specification
- **Root Cause:**
  - `KpiCard` has no `valueSuffix` prop - `/user` cannot be rendered as a styled inline suffix.
  - `OverviewResponse` has `retention_cost` but no `retention_cost_prior`, so a period delta cannot be computed.
  - The Retention Cost KpiCard call site has no `delta` or `deltaLabel` props.
- **Delta color semantics:** Lower retention cost = better efficiency = green. This is the same inversion as `Total Cost` card: pass `-computeDeltaPercent(current, prior)` so cost reduction renders as a positive (green) badge.
- **Dynamic deltaLabel:** `retentionCost <= retentionCostPrior` → "improving efficiency"; otherwise → "degrading efficiency".
- **Compliance Check:** `valueSuffix` is a purely additive optional prop. `retention_cost_prior` follows the existing `_prior` naming convention. No architectural violation.

### 3. Implementation Plan
- **Proposed Changes:**
  - `src/types/api.ts` - Add `retention_cost_prior: number` to `OverviewResponse`.
  - `src/lib/mock/generators/overview.ts` - Generate `retentionCostPrior` from `totalCostPrior / retained_users_7d`; include in return object.
  - `src/components/kpis/KpiCard.tsx` - Add `valueSuffix?: string` to `KpiCardProps`; render as `<span className="text-[16px] font-medium text-muted-foreground ml-0.5">` inline after the value text.
  - `src/components/sections/Overview.tsx` - Retention Cost KpiCard:
    - Add `valueSuffix="/user"`
    - Add `delta={d && retentionCost !== null && d.retention_cost_prior > 0 ? -computeDeltaPercent(retentionCost, d.retention_cost_prior) : undefined}`
    - Add dynamic `deltaLabel` based on cost direction
- **File Name & Structural Hygiene Re-evaluation:** No rename needed.

### 4. Verification & Testing Strategy
- **New Test Scenarios:**
  - `KpiCard.test.tsx`: `valueSuffix="/user"` renders a span with "/user" text.
  - `KpiCard.test.tsx`: no `valueSuffix` renders no suffix span.
  - `Overview.test.tsx`: after data loads, "improving efficiency" or "/user" text is present.
- **Regression Strategy:** `npm run test`
