# Bugfix Specification: Team Section - Table and Charts
**Timestamp:** 20260627220000
**Status:** Approved for Implementation

### 1. Requirements & Accessibility Evaluation
- **Business/User Impact:** The Team section table is missing key visual signals (WoW run trends, per-team color coding, star quality ratings, fixed failure thresholds) and is not wrapped in a card. Charts lack team-specific bar colors, value formatting, and the Quality Score chart should match the dual-series Overview pattern.
- **Accessibility (a11y) Impact:** Star ratings use `aria-hidden` on individual star glyphs with numeric score visible to screen readers. Progress bars get team `fill` color passed as style prop. Failure rate color is text-only (not color-as-only-signal since the percentage value is always shown). Churn Risk badge is a visible inline element under team name.

### 2. Technical Specification
- **Root Cause:** TeamTable was built with placeholder styling (relative failure-rate thresholds, single color progress, no WoW run indicator, Churn column instead of inline badge). TeamBreakdown charts use default colors and raw numeric values without currency/number formatting. Quality Score chart uses ColumnChart only; must be replaced with the dual-series (Area + ColumnChart) pattern from Overview.
- **Compliance Check:** All components use functional components + named exports. `useDeepComputed` for all derived values. `teamColors.ts` shared constant file justified because both `TeamTable` and `TeamBreakdown` need it. New files require co-located test files per ARCHITECTURE.md §5.1.

### 3. Implementation Plan
- **`src/types/api.ts`** - Add `wow_runs_change: number` and `mau_prior: number` to `TeamMetrics`
- **`src/lib/mock/generators/teams.ts`** - Generate `wow_runs_change` (some negative) and `mau_prior`
- **`src/lib/team/teamColors.ts`** (new) - TEAM_COLOR_MAP keyed by team_id
- **`src/components/charts/BarChart.tsx`** - Add `barHeight` + `formatValue` props; render value inside bar
- **`src/components/kpis/TeamTable.tsx`** - Remove Churn column; add dot/badge/WoW/users-prior/stars/fixed-thresholds/sparkline-width
- **`src/components/sections/TeamBreakdown.tsx`** - Card wrapper for table with header+pagination, team colors on BarCharts, dual-series quality chart
- **File Name & Structural Hygiene:** `teamColors.ts` is a new domain constant file; no renames needed.

### 4. Verification & Testing Strategy
- **New Test Scenarios:**
  - `teamColors.ts`: color lookup for known IDs, fallback for unknown
  - `BarChart`: formatValue rendered inside bar, barHeight applied
  - `TeamTable`: Churn Risk badge under name, WoW negative indicator, "was N" users, green/orange/red thresholds, stars for quality, max-width sparkline
  - `TeamBreakdown`: card header "Team Performance", "Showing N teams", BarChart figcaptions still 5
- **Regression Strategy:** `npm run test`
