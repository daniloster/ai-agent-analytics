# Bugfix Specification: Billing Chart - Projection Spike & Stale Signal
**Timestamp:** 20260627193000
**Status:** Approved for Implementation

### 1. Requirements & Accessibility Evaluation
- **Business/User Impact:** The "Cumulative spend vs budget" chart in Billing & Financial shows: (1) stale data that does not update when the date filter changes; (2) a massive vertical spike at the rightmost month caused by the projected series endpoint landing on the same date as the last actual invoice; (3) the projected value itself is inflated to 10-30x the real monthly spend because `daysElapsed` is computed from `fromDate.getUTCDate()` (always 1 when from = first of month) instead of `toDate.getUTCDate()` (days elapsed in the current month).
- **Accessibility (a11y) Impact:** No new a11y concerns. Existing `aria-label="Cumulative spend vs budget"` on the figure is correct.

### 2. Technical Specification
- **Root Cause 1 (stale signal):** `spendDataSig` and `invoiceDataSig` in `Billing.tsx` use `useDeepComputed`, which only tracks `@preact/signals` signal dependencies. `spendSeries` and `billing` are derived from TanStack Query React state - not signals. The computed freezes at its first evaluated value and never updates when filter changes cause new data to load.
- **Root Cause 2 (projection spike):** `generateBilling` computes `daysElapsed = clamp(fromDate.getUTCDate(), 1, daysInMonth)`. For any filter starting on the 1st of the month, `daysElapsed = 1`, so `projected_month_end = currentMonthSpend / 1 * daysInMonth`, which multiplies the spend by 30x. Should use `toDate.getUTCDate()` (end of range = how far into the current month we are).
- **Root Cause 3 (vertical spike visual):** `buildInvoiceHistory` generates 6 months ending at the SAME month as `from`. This means `last.month` equals `from`'s month, so `currentMonthStart = period.to.slice(0,7) + "-01"` lands at the same date as the projected series start, creating a vertical line at that x position. Fix: generate 6 months ending at the PREVIOUS month (i goes from 6 down to 1).
- **Compliance Check:** `useLiveSignal` is the correct hook for bridging React state to signals per `ARCHITECTURE.md` and existing usage in `Visualization.tsx:362`.

### 3. Implementation Plan
- **`src/lib/mock/generators/billing.ts`:**
  - Compute `daysInMonth` and `daysElapsed` from `toDate` (not `fromDate`).
  - Fix `buildInvoiceHistory` loop: `for (let i = 6; i >= 1; i--)` so history ends at the month prior to `from`'s month.
- **`src/components/sections/Billing.tsx`:**
  - Replace `useDeepComputed` import with `useLiveSignal`.
  - Replace `spendDataSig = useDeepComputed(...)` with synchronous data computation + `useLiveSignal`.
  - Replace `invoiceDataSig = useDeepComputed(...)` with `useLiveSignal`.
- **`src/lib/mock/generators/billing.test.ts`:**
  - Add test: last invoice_history month is prior to `from`'s month.
  - Add test: `projected_month_end` is proportional to `days_elapsed / days_in_month`.
- **`src/components/sections/Billing.test.tsx`:**
  - Update BILLING fixture: last invoice_history entry should be May 2026 (not June) to match the corrected generator.
  - Add test: cumulative spend chart renders SVG paths.

### 4. Verification & Testing Strategy
- **New Test Scenarios:**
  - `invoice_history last month is strictly before from date's month` - verifies no overlap with current month.
  - `projected_month_end is reasonable (not > 2x monthly_budget)` - catches the 30x inflation bug.
  - `cumulative spend chart renders SVG paths when data is loaded` - verifies chart renders.
- **Regression Strategy:**
  ```bash
  npm run test
  ```
