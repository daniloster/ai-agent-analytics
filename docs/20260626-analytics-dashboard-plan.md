# Plan: Cloud Agent Analytics Dashboard

**Date:** 2026-06-26
**Source:** `docs/20260626-cloud-agent-analytics-dashboard-investigation.md`
**Status:** In Progress

This plan decomposes the investigation into independently deliverable working packages (WPs). Each WP produces a tested, shippable increment. WPs are sequenced by dependency - a WP cannot start until every WP listed in its "Depends on" column is marked done.

Each WP is a candidate for a dedicated SPEC. The tracking table at the bottom records which WPs have been converted to a spec.

---

## WP-01: Project Scaffold & Infrastructure

**What it delivers:** A runnable Vite + React + TypeScript project that satisfies every ARCHITECTURE.md mandate and can serve as the base for every subsequent WP. Includes `react-router-dom` installation and a placeholder `src/app/router.tsx` that `App.tsx` renders via `<RouterProvider>`.

**Deliverables:**
- `vite.config.ts` with `@vitejs/plugin-react` wired to `lib/babel-signals-transformer` (per ARCHITECTURE.md Section 10.2)
- `tsconfig.json` in strict mode (`"strict": true`, zero `any`)
- ESLint config with React + TypeScript rules
- Tailwind CSS + `tailwind.config.ts` with shadcn/ui preset
- `components.json` for shadcn/ui CLI
- `src/hooks/useSignals.ts` - thin wrapper over `@preact/signals-react/runtime`
- Vitest config (`vitest.config.ts`) - does NOT apply the babel-signals-transformer
- `vitest.setup.ts` - mocks `@preact/signals-react/runtime` for component tests
- Directory skeleton: `src/components/charts/`, `src/components/sections/`, `src/components/kpis/`, `src/lib/mock/`, `src/hooks/`, `src/types/`
- Basic `App.tsx` rendering a static placeholder page (confirms Vite + HMR + signals all work)
- `npm run dev`, `npm run build`, `npm run test`, `npx tsc --noEmit` all pass clean

**Key decisions already resolved:**
- Vite is the bundler (ARCHITECTURE.md)
- Babel plugin wired via `@vitejs/plugin-react`, not Metro (ARCHITECTURE.md Section 10.2)
- Vitest does NOT run the transformer - components tested must handle signals manually or via the mock
- Tailwind dark mode via CSS variables (shadcn/ui convention) so chart tokens work automatically

**Effort:** Small
**Depends on:** -

---

## WP-02: TypeScript API Types & Mock Data Layer

**What it delivers:** A complete MSW + Faker.js mock API that returns realistic, correlated data for all seven endpoints. After this WP, the entire UI can be built without a real backend.

**Deliverables:**
- `src/types/api.ts` - TypeScript interfaces for every API response shape (all 7 endpoints, all 49 KPIs)
- `src/lib/mock/seed.ts` - deterministic Faker.js seed derived from the current date-range query params (same params = same data on every 30s refetch)
- `src/lib/mock/generators/` - one generator file per endpoint:
  - `overview.ts` - KPI-01 through KPI-14 + time-series shape
  - `teams.ts` - KPI-15 through KPI-25 per team, correlated (e.g., Data Team has low adoption + low quality consistently)
  - `reliability.ts` - KPI-26 through KPI-35 with realistic error distributions
  - `billing.ts` - KPI-36 through KPI-45, 6-month invoice history, anomaly days
  - `timeseries.ts` - daily run/token/cost/quality arrays for chart rendering
  - `org.ts` - team list, org config (seat count, budget, billing model)
- `src/lib/mock/handlers.ts` - MSW request handlers for all 7 endpoints
- `src/lib/mock/browser.ts` - MSW browser worker setup
- `src/main.tsx` updated to start the MSW worker in development
- Generator unit tests asserting shape and type safety

**Key decisions already resolved:**
- MSW intercepts at the fetch layer - zero coupling to UI code
- Faker seeded with `hashString(from + to + team_id)` - prevents polling flicker
- Correlated data: teams that have high cost consistently have matching patterns across all team KPIs
- All dates in UTC; no timezone conversion in v1

**Endpoint catalog (from Appendix C of investigation):**

| Endpoint | KPIs served |
|----------|-------------|
| `GET /api/analytics/overview` | KPI-01 to KPI-14 |
| `GET /api/analytics/teams` | KPI-15 to KPI-25 |
| `GET /api/analytics/reliability` | KPI-26 to KPI-35 |
| `GET /api/analytics/billing` | KPI-36 to KPI-45 |
| `GET /api/analytics/timeseries` | Daily arrays for charts |
| `GET /api/org/teams` | Team selector dropdown |
| `GET /api/org/config` | Seat count, budget, billing model |

Query params for all analytics endpoints: `from`, `to`, `team_id` (optional).

**Effort:** Medium
**Depends on:** WP-01

---

## WP-03: Visx Primitive Layer

**What it delivers:** A reusable internal chart library built on `@visx/*` primitives. This is the foundation that makes every subsequent chart WP fast. Getting this right pays compounding returns.

**Deliverables:**
- `src/components/charts/primitives/useChartTokens.ts` - reads `hsl(var(--primary))`, `hsl(var(--border))`, etc. from CSS variables at render time; dark mode is automatic
- `src/components/charts/primitives/useTooltipState.ts` - typed wrapper over `@visx/tooltip` `useTooltip` hook
- `src/components/charts/primitives/ChartSVG.tsx` - `<ParentSize>` wrapper with margin normalization and `min-h-[200px]` guard (prevents 0-width first-paint issue)
- `src/components/charts/primitives/Axis.tsx` - typed `<AxisBottom>` and `<AxisLeft>` wrappers using chart tokens for tick/label colors
- `src/components/charts/primitives/Grid.tsx` - typed `<GridRows>` and `<GridColumns>` with CSS variable stroke
- `src/components/charts/primitives/Annotation.tsx` - threshold reference line + callout label (used for budget lines, error rate thresholds)
- First five concrete charts (built from primitives, each with full ARIA):
  - `src/components/charts/Sparkline.tsx` - 80px no-axis sparkline with hover tooltip
  - `src/components/charts/AreaChart.tsx` - single or dual-axis area + optional line overlay
  - `src/components/charts/BarChart.tsx` - vertical or horizontal, sortable, animated width on mount
  - `src/components/charts/DonutChart.tsx` - donut with animated arc transitions and center label
  - `src/components/charts/Heatmap.tsx` - `@visx/heatmap` `<HeatmapRect>` with `scaleSequential` color scale, keyboard-navigable cells
- Unit tests for every scale used (D3 scales are pure functions; test input/output without rendering)
- Storybook stories or Vitest visual snapshots for each chart component

**Key decisions already resolved:**
- All chart data elements get `role`, `tabIndex={0}`, `aria-label`, `onKeyDown` for keyboard navigation (WCAG 2.1 AA target, D-13)
- Charts wrapped in `<figure>` + `<figcaption>` at the consumer level (not inside the chart primitive)
- Color tokens come from CSS variables - never hardcoded hex values
- `@visx/responsive` `<ParentSize>` used for all responsive sizing (not Recharts `ResponsiveContainer`)
- The primitive layer is the investment that drops per-chart cost from ~150 lines (chart 1) to ~40 lines (chart 5+)

**Visx packages required:**
`@visx/scale`, `@visx/shape`, `@visx/axis`, `@visx/grid`, `@visx/tooltip`, `@visx/heatmap`, `@visx/responsive`, `@visx/group`, `@visx/gradient`, `@visx/annotation`

**Effort:** Large
**Depends on:** WP-01

---

## WP-04: Dashboard Shell & Filter Bar

**What it delivers:** The page frame that all four sections live inside, plus `src/app/router.tsx` defining the `/` route using `DashboardLayout`. After this WP, a developer can add a section component and it will appear in the correct scroll position with the correct filter context. WP-11 adds the `/understanding` route to the same router file.

**Deliverables:**
- `src/components/layout/DashboardLayout.tsx` - full-width sticky header + section nav + scrollable body
- `src/components/layout/SectionNav.tsx` - sticky navigation bar with four anchor links; active item tracks scroll position via IntersectionObserver
- `src/components/filters/FilterBar.tsx` - date range selector + team selector; lives in the sticky header
- `src/components/filters/DateRangePicker.tsx` - "Last 7 days / 30 days / 90 days / Custom" using shadcn/ui Calendar
- `src/components/filters/TeamSelector.tsx` - shadcn/ui Select populated from `GET /api/org/teams`; "All teams" default
- `src/lib/filters/filterSignals.ts` - Preact signals for `dateRange` and `teamId`; computed signal `filterQueryParams` serializes to URL search params
- URL param sync: reading/writing `?from=...&to=...&team=...` on every filter change; survives page refresh and back-button navigation (D-10)
- `src/components/layout/Section.tsx` - scroll-anchor wrapper with `id`, `aria-labelledby`, and lazy-mount via IntersectionObserver (replaces with `<SectionSkeleton>` until in-view)
- TanStack Query client setup with `refetchInterval: 30_000` and `staleTime: 25_000`
- Integration test: change date range -> URL updates -> refresh -> signals re-hydrate from URL

**Key decisions already resolved:**
- URL search params are the filter state store (D-10) - paste URL to CTO, they see the same view
- Preact signals (`filterSignals.ts`) hold the in-memory state; URL is the persistence layer
- Sections below the fold use IntersectionObserver to defer chart mounting (performance mitigation for 15+ SVG instances, per Challenges section)
- TanStack Query is configured once at the root; each section query uses the computed `filterQueryParams` signal as its query key

**Effort:** Medium
**Depends on:** WP-01, WP-02

---

## WP-05: Section 1 - Overview

**What it delivers:** The top section of the dashboard with all 14 executive KPIs visible and wired to mock data. A CTO can open the page and read the org health at a glance.

**KPIs implemented:** KPI-01 through KPI-14 (Total Runs, Active Users, Seat Adoption, Token Consumption, Total Cost, Retention Cost, Success Rate, Avg Run Duration, Avg Quality Score, Cost per Quality Point, Output Acceptance Rate, Cost per Accepted Output, MoM Usage Growth, User Activation Rate)

**Deliverables:**
- `src/components/kpis/KpiCard.tsx` - shared card: metric value, delta badge (green/red), sparkline slot, info tooltip with formula + example (used across all four sections)
- `src/components/sections/Overview.tsx` - section container, TanStack Query hook for `/api/analytics/overview`
- Row 1: four KPI cards (KPI-01, KPI-02, KPI-03, KPI-05)
- Row 2: four KPI cards (KPI-06, KPI-07, KPI-09, KPI-10)
- `<AreaChart>` - Token consumption: input vs. output split over time (KPI-04)
- `<AreaChart>` - Cost vs. budget line with dashed projected continuation (KPI-05, KPI-37)
- KPI-03: donut showing used vs. unused seats (uses `<DonutChart>`)
- KPI-14: mini funnel visualization (seats provisioned -> activated -> MAU) using `<BarChart>` horizontal
- KPI-49: quality score trend - `<AreaChart>` with 30-day moving average + `<LinearGradient>` fill
- All KPI cards showing "Insufficient data" when rated run count < 10 (KPI-09, KPI-10, KPI-12)
- Unit tests for KpiCard component; integration test confirming filter change updates all KPI values

**Effort:** Large
**Depends on:** WP-02, WP-03, WP-04

---

## WP-06: Section 2 - Team Breakdown

**What it delivers:** The team comparison section with sortable team table and per-team charts. A team lead can filter to their team and see their metrics in detail.

**KPIs implemented:** KPI-15 through KPI-25 (Runs per Team, Cost per Team, Cost per User per Team, Team Adoption Rate, Avg Runs per User per Team, Quality Score per Team, Failed Run Rate per Team, Cost per Quality Point per Team, Top Use Cases per Team, Churn Signals per Team, Team-Level Cost Trend)

**Deliverables:**
- `src/components/sections/TeamBreakdown.tsx` - section container, TanStack Query hook for `/api/analytics/teams`
- `src/components/kpis/TeamTable.tsx` - shadcn/ui `<Table>` with columns: Team, Runs, Cost, Users, Adoption (progress bar), Quality (stars), Failed Rate (color-coded), WoW Trend (sparkline), Churn Warning (badge); sortable on every numeric column
- `<BarChart>` - Runs per team, sorted descending (KPI-15)
- `<BarChart>` grouped - Token cost per team + cost per user overlay (KPI-16, KPI-17)
- `<BarChart>` - Quality score per team, sorted by score (KPI-20)
- `<BarChart>` with `@visx/shape` `<BarStack>` - Top use cases per team (KPI-23)
- `<BarChart>` sorted ascending - Cost per quality point per team (KPI-22, "lower is better" annotated)
- Churn warning badge (KPI-24) on team rows with churn signal count > 0
- Team filter: when `teamId` signal is set to a specific team, the section re-fetches for that team only and collapses the table to a single-team detail view
- Unit tests for TeamTable sorting; integration test: selecting a team from the filter scopes all data

**Effort:** Large
**Depends on:** WP-02, WP-03, WP-04

---

## WP-07: Section 3 - Reliability

**What it delivers:** The reliability section with platform health KPIs, trend charts, and the availability heatmap. An SRE can detect incidents and track error trends.

**KPIs implemented:** KPI-26 through KPI-35 (Overall Error Rate, Timeout Rate, P50/P95/P99 Run Duration, Queue Wait Time, Error Type Breakdown, Retry Rate, Platform Availability, Error Trend, MTTR, Cost of Failed Runs)

**Deliverables:**
- `src/components/sections/Reliability.tsx` - section container, TanStack Query hook for `/api/analytics/reliability`
- Row 1: four KPI cards - Error Rate (with amber/red threshold indicator), Timeout Rate, P50/P95/P99 (three cards), Queue Wait (KPI-26, KPI-27, KPI-28, KPI-29)
- `<AreaChart>` with reference line - Error rate 7-day moving average + 5% threshold line via `<Annotation>` (KPI-26, KPI-33)
- `<DonutChart>` - Error type breakdown: context overflow / tool failure / rate limit / infrastructure (KPI-30)
- `<Heatmap>` - Platform availability calendar: 31-cell grid, green/amber/red by uptime %, full keyboard navigation, `aria-label` per cell with date + uptime% (KPI-32)
- Two KPI cards: Retry Rate (KPI-31), MTTR (KPI-34)
- KPI card: Cost of Failed Runs in both dollar value and percentage of total spend (KPI-35)
- Incident log table (shadcn/ui `<Table>`): detected_at, resolved_at, MTTR, error_type - shown when MTTR data exists
- Unit tests: scale domain assertions for error rate line chart; heatmap color scale correctness

**Effort:** Medium
**Depends on:** WP-02, WP-03, WP-04

---

## WP-08: Section 4 - Billing & Financial

**What it delivers:** The billing section with spend tracking, projections, cost allocation, and the cost anomaly calendar. A billing admin has everything needed for budget conversations and chargeback.

**KPIs implemented:** KPI-36 through KPI-45 + KPI-46 through KPI-49 embedded as cross-cutting quality/efficiency cards (Current Month Spend, Projected Spend, Budget Utilization, Cost per Successful Run, Token Rate Efficiency, Cost Allocation by Team, Invoice History, Projected Annual Spend, Cost Anomaly Days, Cost of Failed Runs, Quality-Cost Efficiency Score, User Churn Risk Count, New User Cost to Activate, Quality Score Trend)

**Deliverables:**
- `src/components/sections/Billing.tsx` - section container, TanStack Query hook for `/api/analytics/billing`
- Row 1: four KPI cards - Current Month Spend with progress bar, Projected Month-End, Budget Utilization gauge, Projected Annual Spend (KPI-36, KPI-37, KPI-38, KPI-43)
- Gauge chart: budget utilization as a 180-degree arc (custom `<Pie>` with `startAngle`/`endAngle`) (KPI-38)
- `<AreaChart>` - cumulative month-to-date spend + dashed projected line to month end + flat budget line via `<Annotation>` (KPI-36, KPI-37, KPI-38)
- `<BarChart>` + `<LinePath>` in same SVG - Invoice history bar chart with trend line overlay (KPI-42)
- `<DonutChart>` - Cost allocation by team with percentage labels; formatted for chargeback table below (KPI-41)
- Chargeback data table (shadcn/ui `<Table>`): Team, Seat Cost (prorated), Token Cost, Total, % of Org - sorted by cost descending (KPI-41)
- `<Heatmap>` - Cost anomaly calendar: 31-cell row, anomaly cells use `--destructive` CSS token; tooltip shows date + actual cost + avg daily cost (KPI-44)
- KPI cards: Cost per Successful Run (KPI-39), Token Rate Efficiency with list vs. actual rate comparison (KPI-40), Cost of Failed Runs cross-reference (KPI-45)
- Cross-cutting quality block: Quality-Cost Efficiency Score (KPI-46), User Churn Risk Count (KPI-47), New User Cost to Activate (KPI-48)
- Unit tests: projection formula correctness; anomaly detection threshold logic

**Effort:** Large
**Depends on:** WP-02, WP-03, WP-04, WP-05 (reuses KpiCard)

---

## WP-09: Accessibility & Quality Pass

**What it delivers:** WCAG 2.1 AA compliance across the full dashboard. Every chart is keyboard-navigable and screen-reader-legible.

**Deliverables:**
- Every chart component wrapped in `<figure>` with `<figcaption>` describing what the chart shows (at the section level where charts are used)
- Every SVG data element (bar, arc, heatmap cell, sparkline point) has `role="listitem"`, `tabIndex={0}`, `aria-label` with date + value, `onKeyDown` for Enter/Space to show tooltip
- `<g role="list" aria-label="...">` wrapper around all data element groups
- Skip-to-content link at the top of `DashboardLayout.tsx` (keyboard users bypass sticky nav)
- Color contrast check: all chart colors verified against WCAG AA 4.5:1 ratio in both light and dark mode
- "Insufficient data" states use `role="status"` and are announced to screen readers
- Keyboard navigation test: Tab through filter bar -> section nav -> first KPI card data points in Overview - no focus trap, no skipped elements
- Axe-core integration in Vitest: `@axe-core/react` assertion on each section component render

**Key notes:**
- This WP audits and fixes, not adds. Most ARIA work should already be in WP-03 through WP-08.
- Any chart that cannot be made keyboard-navigable must be documented as a known limitation with a rationale.

**Effort:** Medium
**Depends on:** WP-05, WP-06, WP-07, WP-08

---

## WP-10: Test Coverage & CI Baseline

**What it delivers:** A complete test suite covering all critical paths. `npm run test` is the green gate before any commit.

**Deliverables:**
- D3 scale unit tests: one test file per chart primitive asserting domain, range, and output for known inputs (`src/components/charts/primitives/*.test.ts`)
- KPI formula unit tests: each KPI formula (retention cost, cost per quality point, projection formula, etc.) as a pure function unit test (`src/lib/kpi/*.test.ts`)
- Component tests (Vitest + React Testing Library):
  - `KpiCard`: renders metric, delta, sparkline; shows "Insufficient data" when flagged
  - `TeamTable`: sorts correctly on each numeric column; shows churn badge when count > 0
  - `FilterBar`: date range change updates signal; team change updates signal
  - `SectionNav`: active item updates on scroll (mock IntersectionObserver)
- MSW handler tests: each handler returns the correct shape; required fields are present
- Integration test: filter bar change -> TanStack Query refetch -> section re-renders with new data
- `tsc --noEmit` runs in CI with zero errors
- Coverage threshold: 80% line coverage on `src/lib/` and `src/components/kpis/`

**Effort:** Medium
**Depends on:** WP-05, WP-06, WP-07, WP-08

---

## WP-11: /understanding Route

**What it delivers:** A permanent, publicly accessible `/understanding` route that renders the full project rationale as a rich, navigable documentation page. Built last so the content reflects the actual final implementation - not just the original plan.

**Content rendered:**
- Problem statement and why this dashboard exists
- Billing model premise (hybrid token + seat) - explicitly labeled for evaluators
- Full KPI Catalog: all 49 KPIs with id, label, formula, example, why it matters, data requirements, and visualization type - rendered as individual cards grouped by dashboard section
- Key Decisions log: D-1 through D-15 with options considered, chosen direction, rationale, and reversibility
- Technology choices: Visx vs. alternatives, Preact Signals, MSW + Faker, TanStack Query, react-fast-compare, URL state
- In scope vs. out of scope for v1
- Glossary of all domain terms

**Key decisions already resolved:**
- Content is static constants (hardcoded in data files from the investigation); no API fetch, no polling
- Own layout: fixed sidebar with anchor links + scrollable content; does NOT reuse DashboardLayout
- Adds the `/understanding` route to the existing `src/app/router.tsx` (created in WP-04)
- All 49 KPI formula strings must match exactly what is in the investigation and in `src/lib/kpi/formulas.ts`
- A "Back to Dashboard" link in the sidebar navigates to `/`
- A link to `/understanding` is added to the DashboardLayout header as a secondary nav item

**Deliverables:**
- `src/app/router.tsx` (modified) - adds the `/understanding` route
- `src/routes/understanding/UnderstandingPage.tsx` - page layout + sidebar
- `src/routes/understanding/components/UnderstandingSidebar.tsx` - fixed sidebar with anchor nav
- `src/routes/understanding/components/KpiEntryCard.tsx` - renders one KPI definition
- `src/routes/understanding/components/DecisionTable.tsx` - renders D-1 through D-15
- `src/routes/understanding/data/kpis.ts` - all 49 KpiEntry constants
- `src/routes/understanding/data/decisions.ts` - all 15 DecisionEntry constants
- `src/routes/understanding/data/techStack.ts` - TechDecision constants
- `src/routes/understanding/data/scope.ts` - in-scope and out-of-scope constants
- Unit tests: 49 KPI entries verified; 15 decisions verified; page renders without errors

**Effort:** Medium
**Depends on:** WP-01 through WP-10

---

## Working Package Tracking Table

| Spec? | WP | Title | Depends on | Effort |
|-------|----|-------|------------|--------|
| [x] | WP-01 | Project Scaffold & Infrastructure | - | Small |
| [x] | WP-02 | TypeScript API Types & Mock Data Layer | WP-01 | Medium |
| [x] | WP-03 | Visx Primitive Layer | WP-01 | Large |
| [x] | WP-04 | Dashboard Shell & Filter Bar | WP-01, WP-02 | Medium |
| [x] | WP-05 | Section 1 - Overview | WP-02, WP-03, WP-04 | Large |
| [x] | WP-06 | Section 2 - Team Breakdown | WP-02, WP-03, WP-04 | Large |
| [x] | WP-07 | Section 3 - Reliability | WP-02, WP-03, WP-04 | Medium |
| [x] | WP-08 | Section 4 - Billing & Financial | WP-02, WP-03, WP-04, WP-05 | Large |
| [x] | WP-09 | Accessibility & Quality Pass | WP-05, WP-06, WP-07, WP-08 | Medium |
| [x] | WP-10 | Test Coverage & CI Baseline | WP-05, WP-06, WP-07, WP-08 | Medium |
| [x] | WP-11 | /understanding Route | WP-01 through WP-10 | Medium |

**Spec column:** check [ x ] when a working package has been converted to a SPEC document in `docs/`.
