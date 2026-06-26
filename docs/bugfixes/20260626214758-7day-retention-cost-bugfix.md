# Bugfix Specification: "7 Days Retention Cost" label and 7-day retained user denominator
**Timestamp:** 20260626214758
**Status:** Approved for Implementation

### 1. Requirements & Accessibility Evaluation
- **Business/User Impact:** The KPI currently labelled "Retention Cost" divides total cost by MAU (all monthly active users). This is NOT a retention metric - it is a cost-per-user metric. Retention requires a fixed re-engagement window. The user-facing bug is: (a) wrong label - should be "7 Days Retention Cost"; (b) wrong denominator - should be the count of users retained over the last 7 days of the selected range, not total MAU. This makes the number misleading: with MAU=340 the value is ~$41.76/user, but with 7-day retained users it would correctly reflect how much was spent to keep recently-active users engaged.
- **Accessibility (a11y) Impact:** The KpiCard's `formulaTooltip` (shown via Popover to screen readers via `aria-describedby`) currently reads "Total cost / MAU - cost to retain each active user." After fix it should read "Total cost / users retained in the last 7 days of the period." The button remains keyboard accessible with no structural change.

### 2. Technical Specification
- **Root Cause:** `OverviewResponse` lacks a `retained_users_7d` field. `Overview.tsx` calls `computeRetentionCost(d.total_cost, d.mau)` which uses MAU (full-period active users) as the divisor. The function name implies retention but the semantics are wrong. The formula should divide by retained users over a fixed 7-day look-back window ending at `period.to`.
- **Compliance Check:** All changes are confined to existing files (no new files). Function signature change is internal only (single call site). No new abstractions. Tests are updated in-place. Complies with ARCHITECTURE.md (no class components, named exports, strict TS) and CLAUDE.md (no docstrings, no unsolicited features, fix only what is broken).

### 3. Implementation Plan
- **Proposed Changes:**
  - `src/types/api.ts` - Add `retained_users_7d: number` to `OverviewResponse`. Keep existing `retention_cost` field (it pre-existed and is in the API contract; removing it is out of scope).
  - `src/lib/kpi/formulas.ts` - Rename parameter `mau` to `retainedUsers` in `computeRetentionCost` to correctly describe the denominator's meaning.
  - `src/lib/kpi/formulas.test.ts` - Update test description from "totalCost / mau" to "totalCost / retainedUsers".
  - `src/lib/mock/generators/overview.ts` - Generate `retained_users_7d` as a realistic fraction of MAU (7-day retention rate 20-70%). Update the `retention_cost` pre-computed field to use `retained_users_7d` for consistency. Return `retained_users_7d` in the response object.
  - `src/lib/mock/generators/overview.test.ts` - Add assertion `typeof result.retained_users_7d === 'number'`.
  - `src/components/sections/Overview.tsx` - Change `computeRetentionCost(d.total_cost, d.mau)` to `computeRetentionCost(d.total_cost, d.retained_users_7d)`. Change `label` to `"7 Days Retention Cost"`. Update `formulaTooltip` and `exampleTooltip`.
  - `src/components/sections/Overview.test.tsx` - Add `retained_users_7d: 142` to the `OVERVIEW` mock object.
- **File Name & Structural Hygiene Re-evaluation:** No files need renaming. The function `computeRetentionCost` is still a correct name since it computes retention cost; only the parameter's meaning changes.

### 4. Verification & Testing Strategy
- **New Test Scenarios:**
  - `formulas.test.ts`: Update existing "returns totalCost / mau" description to "returns totalCost / retainedUsers" (description fix, not logic change).
  - `generators/overview.test.ts`: Add `expect(typeof result.retained_users_7d).toBe('number')` and assert `retained_users_7d <= result.mau` (7-day retained users cannot exceed full-period MAU).
  - `Overview.test.tsx`: Add a test asserting the rendered KpiCard label contains "7 Days Retention Cost" text.
- **Regression Strategy:** `npm run test -- --run`
