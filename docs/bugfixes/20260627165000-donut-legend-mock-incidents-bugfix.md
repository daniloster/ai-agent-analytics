# Bugfix Specification: DonutLegend Component, Mock Incidents, Availability Consistency
**Timestamp:** 20260627165000
**Status:** Approved for Implementation

### 1. Requirements & Accessibility Evaluation
- **Business/User Impact:** (1) MTTR card shows "No incidents" and availability footer shows "-" because the mock generates 0-3 incidents (often 0). Fix: always generate 1-3 resolved incidents. (2) The inline legend div in Reliability.tsx is duplicated logic not reusable. Extract to a `DonutLegend` component and use it in Reliability and Billing. (3) Billing "Cost by team" donut has no legend - add one using DonutLegend.
- **Accessibility (a11y) Impact:** DonutLegend renders a `<ul role="list">` with `<li>` items. Color swatches are `aria-hidden`. Title and detail are plain text. Screen readers get a structured list of legend entries.

### 2. Technical Specification
- **Root Cause:** (1) `faker.number.int({ min: 0, max: 3 })` generates 0 incidents ~25% of the time; combined with `faker.datatype.boolean()` for resolved status, MTTR is null in many seeds. (2) Legend is inline JSX in Reliability.tsx; Billing has no legend at all. (3) Billing DonutChart slices have no `color` prop, so they use generic fallback colors that don't match any legend.
- **Compliance Check:** New `DonutLegend` is a named-export functional component in `src/components/charts/`. No class components, no `any`. Billing additions import `teamColor` (existing) and `formatNumber` (existing). Complies with ARCHITECTURE.md and CLAUDE.md.

### 3. Implementation Plan
- **`src/lib/mock/generators/reliability.ts`**: Change `{ min: 0, max: 3 }` to `{ min: 1, max: 3 }`. Force first incident to be resolved (`resolved = true` for `i === 0`), guaranteeing `mttr_minutes` is always non-null.
- **`src/components/charts/DonutLegend.tsx`** (new): `DonutLegendItem { color, title, renderDetail: () => ReactNode }`. `DonutLegend` renders `<ul>` with color swatch + title + `renderDetail()` per item.
- **`src/components/sections/Reliability.tsx`**: Import `DonutLegend`. Replace `<div className="flex flex-col gap-3 flex-1">...</div>` with `<DonutLegend items={d.error_type_breakdown.map(...)} />`.
- **`src/components/sections/Billing.tsx`**: Import `DonutLegend`, `teamColor`, `formatNumber`. Add `color: teamColor(t.team_id, i)` to DonutChart slices. Wrap DonutChart + DonutLegend in `flex items-center gap-8`.
- **File Name & Structural Hygiene:** `DonutLegend.tsx` sits in `src/components/charts/` alongside `DonutChart.tsx`. No renames needed.

### 4. Verification & Testing Strategy
- **New Test Scenarios:** `DonutLegend.test.tsx`: renders list items, applies color to swatches, calls renderDetail, empty array renders no items.
- **Regression Strategy:** `npm run test`
