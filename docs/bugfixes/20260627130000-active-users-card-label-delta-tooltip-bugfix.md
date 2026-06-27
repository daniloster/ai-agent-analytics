# Bugfix Specification: Active Users Card - Label, Delta, and Tooltip Corrections
**Timestamp:** 2026-06-27T13:00:00
**Status:** Approved for Implementation

### 1. Requirements & Accessibility Evaluation
- **Business/User Impact:** The "Monthly Active Users" KPI card has four problems: (1) the label "Monthly Active Users" implies a fixed monthly window, breaking when the selected period is a week or quarter; (2) the subValue "DAU: N" shows a different metric (daily) instead of period-over-period context; (3) no delta/trend comparison against a prior window; (4) the tooltip says "this month" (hardcoded) and uses the "MAU" abbreviation. All four misrepresent the data to the user.
- **Accessibility (a11y) Impact:** No ARIA changes needed. The existing `aria-label` on the info button ("More information") is sufficient. The delta badge already has screen-reader-accessible text via its visible content.

### 2. Technical Specification
- **Root Cause:**
  - `OverviewResponse` in `src/types/api.ts` has `mau` but no `mau_prior` field, so period-over-period delta cannot be computed.
  - `src/components/sections/Overview.tsx` renders the card with `label="Monthly Active Users"`, `subValue={\`DAU: ...\`}`, and no `delta`/`deltaLabel` props.
  - `formulaTooltip` hard-codes "this month" and `exampleTooltip` uses the "MAU" abbreviation.
- **Compliance Check:** Changes are additive (new field on existing interface, new prop at call site). No architectural violation. Follows existing `_prior` naming pattern (`total_runs_prior`, `total_cost_prior`, `success_rate_prior`).

### 3. Implementation Plan
- **Proposed Changes:**
  - `src/types/api.ts` - Add `mau_prior: number` to `OverviewResponse` after `mau`.
  - `src/lib/mock/generators/overview.ts` - Generate `mauPrior` (same range as `mau`) and include in return object.
  - `src/components/sections/Overview.tsx` - On the Active Users KpiCard:
    - Change `label` to `"Active Users"`
    - Remove `subValue` prop
    - Add `delta={d ? computeDeltaPercent(d.mau, d.mau_prior) : undefined}`
    - Add `deltaLabel="vs previous period"`
    - Change `formulaTooltip` to `"Unique users who ran at least one request this period."`
    - Change `exampleTooltip` to `"e.g. 340 users"`
  - `src/components/sections/Overview.test.tsx` - Add `mau_prior` to `OVERVIEW` mock; add tests for new label text, delta label text, and tooltip text.
- **File Name & Structural Hygiene Re-evaluation:** No rename needed. The field rename from "MAU" to "Active Users" is UI-only; the underlying API field `mau` is unchanged.

### 4. Verification & Testing Strategy
- **New Test Scenarios:**
  - Assert card is labelled "Active Users" (not "Monthly Active Users").
  - Assert "vs previous period" text is present after data loads.
  - Assert "DAU:" text is absent.
  - Assert tooltip text contains "this period" (not "this month").
- **Regression Strategy:** `npm run test`
