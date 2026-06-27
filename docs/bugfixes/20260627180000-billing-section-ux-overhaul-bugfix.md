# Bugfix Specification: Billing Section UX Overhaul
**Timestamp:** 20260627180000
**Status:** Approved for Implementation

### 1. Requirements & Accessibility Evaluation
- **Business/User Impact:** 15 distinct improvements to the Billing section: KPI card renames/removals, delta/trend wiring, chart improvements, ChargebackTable visual upgrade, and anomaly calendar redesign.
- **Accessibility (a11y) Impact:** AnomalyDayBox uses `title` attribute + `role="listitem"` pattern mirroring AvailabilityDayBox. ChargebackTable retains table semantics. All KpiCard deltas keep existing ARIA-compatible badge markup.

### 2. Technical Specification
- **Root Cause:** Billing section launched with placeholder KPIs and no trend/delta wiring; several cards duplicated Overview data; GaugeChart replaced by standard KpiCard; Heatmap replaced by custom day-box grid.
- **Compliance Check:** All components remain functional, named exports, signals-react state, TypeScript strict, no `any`. Complies with ARCHITECTURE.md and CLAUDE.md.

### 3. Implementation Plan

**`src/types/api.ts`** - BillingResponse: add 10 new fields
- `current_month_spend_prior`, `cost_per_successful_run_prior`, `cost_per_successful_run_trend`,
  `token_rate_actual_prior`, `token_rate_trend`, `cost_of_failed_runs_prior`, `cost_of_failed_runs_trend`,
  `new_user_activation_cost`, `new_user_activation_cost_prior`, `new_user_activation_cost_trend`

**`src/components/kpis/KpiCard.tsx`** - add `'currency'` to `deltaFormat` type; update DeltaBadge

**`src/lib/mock/generators/billing.ts`** - generate all new fields; fix anomaly distribution (80% normal, 15% yellow, 5% red); update `is_anomaly` to overspend-only (> avg * 1.2)

**`src/components/sections/Billing.tsx`** - full redesign:
1. Drop `overviewQuery` (all data now in BillingResponse)
2. Drop `GaugeChart`, `Heatmap` imports
3. Add `computeDeltaPercent` import
4. Row 1 (4 KpiCards): Period Spend (WoW), Budget Utilization (KpiCard, budget-remaining delta), Projected Annual Spend (sparkline + vs-budget delta), New User Activation Cost (trend + WoW)
5. Row 2 (3 KpiCards): Cost per Successful Run (trend + WoW), Token Rate Efficiency (trend + WoW), Cost of Failed Runs (trend + WoW)
6. Row 3: Charts - Cumulative spend vs budget (annotation already present) + Invoice history (remove ColumnTrendLine, add SeriesTooltip, numTicks: 3 on y)
7. Row 4: Cost by team DonutChart + ChargebackTable wrapped in card
8. Row 5: AnomalyDayBox calendar (inline component: green/yellow/red, `title` tooltip, footer alert count)

**`src/components/kpis/ChargebackTable.tsx`** - add `Progress` + `teamColor` per row in `% of Org` cell

**File Hygiene:** No renames needed.

### 4. Verification & Testing Strategy
- **New Test Scenarios:**
  - KpiCard.test.tsx: 2 new tests for `deltaFormat="currency"`
  - billing.test.ts (generator): tests for new fields presence and trend arrays non-empty
  - Billing.test.tsx: remove GaugeChart/Heatmap/overview-related tests; add anomaly day-box count test; update new_user_activation_cost null test to use BillingResponse
- **Regression Strategy:** `npm run test` + `npx tsc --noEmit`
