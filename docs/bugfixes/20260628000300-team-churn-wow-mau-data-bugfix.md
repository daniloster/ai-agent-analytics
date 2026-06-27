# Bugfix Specification: Churn Risk Teams Missing Negative WoW and Orange MAU Decline
**Timestamp:** 20260628000300
**Status:** Approved for Implementation

### 1. Requirements & Accessibility Evaluation
- **Business/User Impact:** Teams flagged with Churn Risk always have declining engagement by definition. Currently, the mock generator can produce a positive `wow_runs_change` for such teams (e.g., +15%), which passes through the table without the orange WoW warning. Similarly, `mau_prior` can be lower than `mau` for a churn team, implying user growth when the opposite is true. Both distort the signal-to-noise of the Churn Risk badge.
- **Accessibility (a11y) Impact:** The conditional `text-orange-500` vs `text-muted-foreground` on "was N" is a color-only signal - no additional ARIA annotation is needed here since it is purely a supplemental data point alongside numeric values. The existing test coverage confirms the `aria-current` pattern on the SectionNav is unchanged. No new ARIA roles or attributes are required.

### 2. Technical Specification
- **Root Cause:**
  1. `src/lib/mock/generators/teams.ts` line 122: `wowRunsChange` is drawn from `[-20, 20]` unconditionally. When `churnSignalCount > 0` the value can be positive, which fails the `wow_runs_change < 0` gate in `TeamRow` and suppresses the orange WoW subtext.
  2. `src/lib/mock/generators/teams.ts` line 123: `mauPrior = clamp(mau + rand(-4, +4), 0, seat_count)`. The random delta is symmetric, so churn teams can show user growth (`mau_prior < mau`), which is semantically incoherent and renders "was N" in `text-muted-foreground` instead of `text-orange-500`.
  3. `src/components/kpis/TeamTable.tsx` (HEAD, index eb13b54): "was N" span always carries `text-muted-foreground`. The working tree already contains a conditional `${mau_prior <= mau ? "text-muted-foreground" : "text-orange-500"}` fix that is uncommitted. This fix will be included in this commit.

- **Compliance Check:**
  - Generator is a pure function module - no React, no hooks, no side effects. The fix is a conditional reassignment inside `generateTeamMetrics`, consistent with existing patterns.
  - `TeamTable` is a named-export functional component. The working-tree display fix is already compliant; no new components or hooks needed.
  - Tests co-located: generator tests in `teams.test.ts`, display tests in `TeamTable.test.tsx`.

### 3. Implementation Plan
- **Proposed Changes:**
  - `src/lib/mock/generators/teams.ts`: When `churnSignalCount > 0`, constrain `wowRunsChange` to `[-20, -1]` and constrain the `mauPrior` delta to `[+1, +4]` (ensuring `mau_prior > mau`).
  - `src/components/kpis/TeamTable.tsx`: Commit the existing working-tree fixes: conditional orange/muted on "was N" span; WoW format `{Math.round(wow_runs_change)}%`; table indentation.
  - `src/components/kpis/TeamTable.test.tsx`: Add tests for orange vs muted "was N" coloring.
  - `src/lib/mock/generators/teams.test.ts`: Add invariant tests across 100 seeds for churn-correlated negative WoW and mau_prior >= mau.

- **File Name & Structural Hygiene Re-evaluation:** No renames required.

### 4. Verification & Testing Strategy
- **New Test Scenarios:**
  - Generator: over 100 seeds, every team with `churn_signal_count > 0` has `wow_runs_change < 0`.
  - Generator: over 100 seeds, every team with `churn_signal_count > 0` has `mau_prior >= mau`.
  - Display: `mau_prior > mau` → "was N" span carries `text-orange-500`.
  - Display: `mau_prior < mau` → "was N" span carries `text-muted-foreground`.

- **Regression Strategy:** `npm run test`
