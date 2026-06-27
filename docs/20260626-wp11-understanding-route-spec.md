# SPEC: WP-11 - /understanding Route

**Date:** 2026-06-27 (revised)
**Plan reference:** `docs/20260626-analytics-dashboard-plan.md` - WP-11
**Investigation reference:** `docs/20260626-cloud-agent-analytics-dashboard-investigation.md`
**Status:** Ready (revised to reflect actual implementation)

---

## Assumptions (confirmed or defaulted)

- No filter bar, no SectionNav, no TanStack Query polling - static documentation page.
- Own layout: fixed left sidebar (240px) + scrollable right content area; distinct from `DashboardLayout`.
- All content is hardcoded as TypeScript constants in `src/routes/understanding/data/`; no API fetch.
- KPI entries document what the dashboard actually renders, not the original 49-KPI plan. The catalog has 38 entries across 4 sections (overview, teams, reliability, billing); the planned `quality` subsection was folded into billing and overview during implementation.
- Several originally planned KPIs were not rendered as standalone metrics - they are either embedded (queue wait as a subValue, MoM growth as a delta badge) or omitted. The catalog reflects only what a user can visibly read.
- Formula strings document the actual `src/lib/kpi/formulas.ts` functions and the inline logic in section components, not the original investigation appendix verbatim.
- `src/app/router.tsx` (WP-04) is modified to add the `/understanding` route alongside the existing `/` route.
- A "Understanding" link is added to `DashboardLayout`'s header alongside the existing product name.
- 15 key decisions (D-1 through D-15) are documented; rationales reflect what was actually built.

---

## 1. Context

Implements **WP-11** from `docs/20260626-analytics-dashboard-plan.md`.

This is the final working package. It is ordered last because the page documents what was built, not what was planned. Deviations from the investigation are intentional product decisions; this spec captures them as ground truth.

**Files modified:**
- `src/app/router.tsx` - adds the `/understanding` route
- `src/components/layout/DashboardLayout.tsx` - adds "Understanding" nav link in the header

**Files created (all new):**
- `src/routes/understanding/UnderstandingPage.tsx`
- `src/routes/understanding/components/UnderstandingSidebar.tsx`
- `src/routes/understanding/components/KpiEntryCard.tsx`
- `src/routes/understanding/components/DecisionCard.tsx`
- `src/routes/understanding/data/kpis.ts`
- `src/routes/understanding/data/decisions.ts`
- `src/routes/understanding/data/techStack.ts`
- `src/routes/understanding/data/scope.ts`

**Depends on:** WP-01 through WP-10.

---

## 2. Data model

All types are co-located with their data files. No shared type imports outside this route.

```ts
// src/routes/understanding/data/kpis.ts

export type KpiSection = 'overview' | 'teams' | 'reliability' | 'billing'

export interface KpiEntry {
  id: string             // 'O-01', 'T-01', 'R-01', 'B-01' (section-prefixed)
  section: KpiSection
  label: string          // 'Total Runs'
  whatItMeasures: string
  formula: string        // human-readable formula string; reflects actual formulas.ts
  example: string        // 'e.g. 12,450 runs in the last 30 days'
  whyItMatters: string
  visualization: string  // 'KPI card with sparkline' | 'area chart' | 'column chart' | etc.
}

// 38 entries total:
// overview:    O-01 through O-11  (11 entries: 8 KPI cards + 3 charts)
// teams:       T-01 through T-05  (5 entries: table + 3 charts + single-team view)
// reliability: R-01 through R-11  (11 entries: 8 KPI cards + 3 visualizations)
// billing:     B-01 through B-11  (11 entries: 6 KPI cards + 5 charts/tables)

export const KPI_CATALOG: KpiEntry[]
```

```ts
// src/routes/understanding/data/decisions.ts

export interface DecisionEntry {
  id: string             // 'D-1'
  decision: string       // 'Dashboard layout pattern'
  options: string[]      // ['Single-page progressive', 'Multi-page with sidebar', ...]
  chosen: string         // 'Single-page progressive'
  rationale: string      // condensed rationale; reflects what was actually built
  reversible: boolean
}

// 15 entries: D-1 through D-15
// All status: Resolved (the page documents outcomes, not open questions)

export const KEY_DECISIONS: DecisionEntry[]
```

```ts
// src/routes/understanding/data/techStack.ts

export interface TechDecision {
  area: string        // 'Chart library'
  choice: string      // 'Visx + Visualization render-prop'
  ruledOut: string[]  // ['Recharts', 'Nivo', 'ECharts', 'Chart.js', 'Tremor']
  rationale: string
  packageRef?: string // '@visx/scale @visx/shape @visx/axis ...'
}

// Entries: Visx / Visualization abstraction, Preact Signals, TanStack Query,
// MSW + Faker.js, react-fast-compare, shadcn/ui, Vitest, URL search params

export const TECH_DECISIONS: TechDecision[]
```

```ts
// src/routes/understanding/data/scope.ts

export interface ScopeEntry {
  item: string
  rationale: string
}

export const IN_SCOPE: ScopeEntry[]
// Org-level dashboard, 38 KPI surfaces, mock API, Visx charts, responsive
// layout, WCAG 2.1 AA, tests, URL-persistent filter state

export const OUT_OF_SCOPE: ScopeEntry[]
// Live streaming, individual user drill-down (beyond team filter), alerting,
// auth/SSO, backend implementation, mobile layout, CSV/PDF export,
// benchmarking, KPIs requiring accept/discard tracking (not yet in product)
```

---

## 3. Component / module design

### `src/app/router.tsx` (modified)

Adds the `/understanding` route alongside the existing `/` route:

```ts
import { UnderstandingPage } from '../routes/understanding/UnderstandingPage'

export const router = createBrowserRouter([
  { path: '/', element: <DashboardRoute /> },
  { path: '/understanding', element: <UnderstandingPage /> },
])
```

---

### `src/components/layout/DashboardLayout.tsx` (modified)

Adds a secondary nav link to `/understanding` in the existing header, using `react-router-dom` `Link`:

```tsx
// in the header, next to the "AI Agent Analytics" product name span:
<Link to="/understanding" className="text-xs text-muted-foreground hover:text-foreground ml-auto">
  How this works
</Link>
```

---

### `src/routes/understanding/UnderstandingPage.tsx` (new)

```ts
export function UnderstandingPage(): JSX.Element
```

- Page layout: `<div className="flex min-h-screen bg-background">` with two children:
  - `<UnderstandingSidebar />` - fixed 240px left column
  - `<main id="main-content" tabIndex={-1} className="flex-1 ml-60 px-8 py-10 max-w-4xl">`
- Seven `<section>` elements with matching `id` attributes:

| `id` | Heading | Content source |
|------|---------|----------------|
| `about` | "About This Dashboard" | Problem statement, stakeholder table, why now |
| `premise` | "Billing Model Premise" | Hybrid token + seat model; labeled as a premise for evaluators |
| `kpis` | "KPI & Metric Catalog" | `KPI_CATALOG` grouped into 4 subsections; each entry as `<KpiEntryCard>` |
| `decisions` | "Key Technical Decisions" | `KEY_DECISIONS` as a list of `<DecisionCard>` components |
| `tech` | "Technology Choices" | `TECH_DECISIONS` rendered as a comparison list |
| `scope` | "Scope: v1" | Two columns: In Scope / Out of Scope |
| `glossary` | "Glossary" | `<dl>` definition list, ~22 terms from investigation glossary + implementation additions |

No `<QueryClientProvider>` - the page has no async data dependencies.

---

### `src/routes/understanding/components/UnderstandingSidebar.tsx` (new)

```ts
export function UnderstandingSidebar(): JSX.Element
```

- `<aside className="fixed top-0 left-0 h-screen w-60 border-r bg-card p-6 overflow-y-auto">`
- `<nav aria-label="Page navigation">` with seven anchor links
- Top of sidebar: `<Link to="/">Back to Dashboard</Link>` (react-router-dom)
- Active section tracked by `useSignal<string>('about')` - private to this component
- `useEffect` on mount: one `IntersectionObserver` (threshold 0.3) watching all seven `<section>` elements; fires `activeSection.value = entry.target.id` on intersection
- Active link styling: `font-medium text-foreground` + left border accent; inactive: `text-muted-foreground hover:text-foreground`
- Click handler: `e.preventDefault(); document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })`

---

### `src/routes/understanding/components/KpiEntryCard.tsx` (new)

```ts
export function KpiEntryCard({ kpi }: { kpi: KpiEntry }): JSX.Element
```

- shadcn/ui `<Card>` with compact header and content
- `<CardHeader>`:
  - `<Badge variant="outline">{kpi.id}</Badge>` + `<CardTitle className="text-sm">{kpi.label}</CardTitle>`
- `<CardContent>` fields (all rendered):
  - **What it measures:** `<p className="text-sm">`
  - **Formula:** `<code className="block bg-muted px-3 py-1.5 rounded text-xs font-mono mt-1">`
  - **Example:** `<p className="text-xs text-muted-foreground italic mt-1">`
  - **Why it matters:** `<p className="text-xs mt-1">`
  - **Visualization:** `<p className="text-xs text-muted-foreground mt-1">`

Cards are rendered in a responsive grid: `grid grid-cols-1 gap-4 lg:grid-cols-2`.

---

### `src/routes/understanding/components/DecisionCard.tsx` (new)

```ts
export function DecisionCard({ decision }: { decision: DecisionEntry }): JSX.Element
```

- shadcn/ui `<Card>` with an expandable rationale panel
- Collapsed state (default): shows `id`, `decision`, `options` (comma-joined), `chosen` + a `<Badge>Resolved</Badge>`
- `open` state tracked by `useSignal<boolean>(false)` - private to this component
- Toggle button: `<button aria-expanded={open.value}>` with chevron icon that rotates on open
- Expanded: additionally shows `rationale` in a `<p className="text-sm text-muted-foreground">` + **Reversible:** Yes/No
- Rendered as a vertical list (`<ul role="list">`) in `UnderstandingPage`; one `<li>` per `DecisionEntry`

Rationale: simpler than the original `<DecisionTable>` with shadcn Collapsible - same expand/collapse UX but as cards rather than table rows, which is more readable for long rationale text.

---

## 4. Interaction diagram

### Route navigation

```
User is at / (dashboard)
  --> clicks "How this works" in DashboardLayout header
  --> React Router <Link to="/understanding"> navigates
  --> URL becomes /understanding
  --> UnderstandingPage mounts (no QueryClient, no filter signals, no MSW calls)
  --> All 7 sections render immediately from static constants
  --> UnderstandingSidebar mounts, sets up IntersectionObserver on 7 section elements
  --> #about section is visible --> activeSection.value = 'about'
  --> "About" link receives active styling

User clicks "KPI & Metric Catalog" in sidebar
  --> click handler: getElementById('kpis')?.scrollIntoView({ behavior: 'smooth' })
  --> IntersectionObserver fires for #kpis (threshold 0.3)
  --> activeSection.value = 'kpis'

User clicks "Back to Dashboard" (Link at sidebar top)
  --> React Router navigates to /
  --> DashboardRoute mounts, initFiltersFromUrl() runs
  --> Default 30d date range, all teams loaded from URL params (or defaults)
```

### KPI Catalog rendering

```
UnderstandingPage renders #kpis:
  --> sections in order: overview, teams, reliability, billing
  --> For each section:
      <h3>Section heading</h3>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {group.map(kpi => <KpiEntryCard key={kpi.id} kpi={kpi} />)}
      </div>

KpiEntryCard for O-01 (Total Runs):
  --> <Badge>O-01</Badge> <CardTitle>Total Runs</CardTitle>
  --> What it measures: "Number of agent executions in the selected period."
  --> Formula: COUNT(runs WHERE org = org_id AND started_at IN period)
  --> Example: "e.g. 12,450 runs in the last 30 days"
  --> Why it matters: "The most basic health signal..."
  --> Visualization: "KPI card with delta badge vs prior period + sparkline trend"
```

### Decision expand / collapse

```
User views #decisions section
  --> 15 DecisionCard components rendered; all collapsed (rationale hidden)

User clicks D-2 card header ("Chart library - Visx + Visualization render-prop")
  --> open.value = true
  --> Card expands: rationale text visible, chevron rotates
  --> "Visx chosen over Recharts because this dashboard requires full keyboard/ARIA
       accessibility on chart data elements and heatmap visualizations that Recharts
       cannot produce. A Visualization render-prop abstraction (src/components/charts/
       Visualization.tsx) wraps Visx primitives so section components never call Visx
       directly..."
  --> Clicking again collapses
```

---

## 5. Acceptance criteria

1. Navigating to `/understanding` renders `UnderstandingPage` with no console errors.
2. The "How this works" link in `DashboardLayout` header navigates to `/understanding`.
3. The "Back to Dashboard" link in the sidebar navigates to `/` and the dashboard renders with default filter state.
4. The KPI Catalog section renders exactly 38 `KpiEntryCard` components (verifiable by `KPI_CATALOG.length === 38`).
5. KPI entries are grouped correctly: the `overview` group contains exactly 11 cards (O-01 through O-11).
6. The Decisions section renders exactly 15 `DecisionCard` components (D-1 through D-15).
7. All 15 decisions have a non-empty `chosen` string and a non-empty `rationale` string.
8. Clicking a `DecisionCard` header expands the rationale; clicking again collapses it.
9. Clicking "KPI & Metric Catalog" in the sidebar scrolls to `#kpis` and the "KPI & Metric Catalog" link receives active styling.
10. The sidebar `<aside>` is `position: fixed` and remains visible while the user scrolls through the longest section.
11. `npx tsc --noEmit` passes with zero errors after WP-11 is complete.
12. The `#premise` section explicitly names "hybrid token + seat model" and labels it as an assumption for evaluators.
13. The Glossary section (`#glossary`) contains all terms in a `<dl>` definition list with at least 20 entries.
14. The page renders to a visible state in under 200ms (no async data; confirmed by no loading skeletons in the rendered output).
15. Formula strings in `KPI_CATALOG` match the actual implementations in `src/lib/kpi/formulas.ts` for entries that have a corresponding pure function (spot-checked in the data test).

---

## 6. Out of scope

- Fetching KPI definitions from an API (static constants only).
- Rendering raw markdown files as part of the page.
- Editing or annotating definitions from the UI.
- Exporting to PDF (v2).
- Displaying live metrics on this page.
- A separate "Quality & Efficiency" section - those KPIs are embedded in their parent sections in the actual dashboard.
- Documenting KPIs that exist in the API type but are not rendered in the dashboard UI (acceptance rate, output acceptance rate, user activation rate, avg run duration, quality-cost efficiency score, churn risk count).

---

## Test plan

| File | What it tests |
|------|---------------|
| `src/routes/understanding/data/kpis.test.ts` (new) | `KPI_CATALOG.length === 38`; each entry has non-empty `id`, `label`, `formula`, `example`, `section`; no duplicate ids; all `section` values are one of the four valid literals; exactly 11 entries with `section === 'overview'`; exactly 11 with `section === 'reliability'`; exactly 11 with `section === 'billing'`; exactly 5 with `section === 'teams'` |
| `src/routes/understanding/data/decisions.test.ts` (new) | `KEY_DECISIONS.length === 15`; ids are 'D-1' through 'D-15' with no gaps; all entries have non-empty `chosen` and `rationale`; all `options` arrays have at least 2 items |
| `src/routes/understanding/components/KpiEntryCard.test.tsx` (new) | renders id badge; renders label; renders formula inside a `<code>` element; renders example and why-it-matters text; renders visualization description |
| `src/routes/understanding/components/DecisionCard.test.tsx` (new) | renders decision label and chosen value; rationale is hidden on initial render; clicking the card header toggles `aria-expanded` and shows rationale text; clicking again hides it |
| `src/routes/understanding/components/UnderstandingSidebar.test.tsx` (new) | renders 7 anchor links with correct text; "Back to Dashboard" Link points to `/`; clicking a link calls `scrollIntoView` on the target element |
| `src/routes/understanding/UnderstandingPage.test.tsx` (new) | renders without crashing inside `MemoryRouter`; 7 section elements with correct ids present; exactly 38 `KpiEntryCard` components rendered; exactly 15 `DecisionCard` components rendered; heading "About This Dashboard" present; heading "Billing Model Premise" present |

---

## Appendix A: KPI Catalog - Full Entries

Authoritative source for all 38 entries in `KPI_CATALOG`. Formulas reflect the actual component code and `src/lib/kpi/formulas.ts`. Examples use realistic values from the mock data ranges.

Each entry maps to a `KpiEntry` shape: `{ id, section, label, whatItMeasures, formula, example, whyItMatters, visualization }`.

---

### Section: Overview (O-01 through O-11)

The first 8 are KPI cards in two rows of four. The last 3 are full-width charts below the cards.

---

**O-01 - Total Runs**

- **What it measures:** Count of every AI agent execution that started in the selected period, regardless of outcome (success, error, or timeout).
- **Formula:** `COUNT(runs WHERE org = org_id AND started_at BETWEEN from AND to)`
- **Calculation components:**
  - Source field: `overview.total_runs`
  - Prior period: `overview.total_runs_prior` (same window length, shifted back)
  - Delta: `(total_runs - total_runs_prior) / total_runs_prior * 100` via `computeDeltaPercent()`
  - Trend sparkline: `timeseries.points[].runs` (daily counts)
- **Example:** 12,450 runs; +18.4% vs prior 30 days
- **Why it matters:** The most basic health signal. A flat or declining trend signals user disengagement before it appears in spend numbers.
- **Visualization:** KPI card with percentage delta badge (green = growth) + purple sparkline of daily run count.

---

**O-02 - Active Users**

- **What it measures:** Count of distinct users who triggered at least one run in the selected period (MAU equivalent).
- **Formula:** `COUNT(DISTINCT user_id WHERE org = org_id AND started_at IN period)`
- **Calculation components:**
  - Source field: `overview.mau`
  - Prior period: `overview.mau_prior`
  - Delta: percentage change in MAU
  - Trend sparkline: `timeseries.points[].dau` (daily active user count - approximation of engagement density)
- **Example:** 340 users; was 315 prior period (+7.9%)
- **Why it matters:** Run count can be inflated by a small number of power users. Active user count reveals the true breadth of adoption across the org.
- **Visualization:** KPI card with percentage delta + purple sparkline of DAU over time.

---

**O-03 - Seat Adoption**

- **What it measures:** Fraction of provisioned licensed seats actively used during the period.
- **Formula:** `mau / seat_count * 100`
- **Calculation components:**
  - `mau`: users with >= 1 run in period
  - `seat_count`: org's total licensed seats (from `OrgConfig`)
  - Delta format: absolute seat count change (`mau - mau_prior`) displayed as a number, not a percentage. Delta label shows e.g. "340 / 400 seats"
  - Trend sparkline: `timeseries.points[].dau / seat_count * 100` (daily adoption approximation)
- **Example:** 85.0% (340 of 400 seats); +25 users vs prior period
- **Why it matters:** Directly quantifies how much of the seat license cost is producing value. Low adoption = wasted license spend; candidates for seat reduction or targeted enablement.
- **Visualization:** KPI card with absolute seat-count delta + label showing "X / Y seats" + purple sparkline.

---

**O-04 - Total Cost**

- **What it measures:** Total API token consumption cost for the org in the selected period. Does not include seat license fees (those are fixed and tracked separately in billing).
- **Formula:** `SUM(run_cost WHERE org = org_id AND period)`
- **Calculation components:**
  - Source field: `overview.total_cost`
  - Prior: `overview.total_cost_prior`
  - Delta: inverted - a cost decrease is shown as positive (green). `-(computeDeltaPercent(total_cost, total_cost_prior))`
  - Trend sparkline: `timeseries.points[].cost` (daily spend)
- **Example:** $14,200; -3.1% vs prior period (improving)
- **Why it matters:** Headline spend number for finance and leadership. Paired with the Token Usage chart (O-09) to understand what is driving cost.
- **Visualization:** KPI card with inverted delta (lower cost = green) + purple sparkline of daily cost.

---

**O-05 - 7-Day Retention Cost**

- **What it measures:** Total period cost divided by the number of users who were active in the last 7 days of the selected period window. This measures the cost of keeping recently active users engaged.
- **Formula:** `total_cost / retained_users_7d`
  - `retained_users_7d` = `COUNT(DISTINCT user_id WHERE last_run_at >= (period_end - 7 days))`
  - Implemented as `computeRetentionCost(totalCost, retainedUsers)` in `src/lib/kpi/formulas.ts`
- **Calculation components:**
  - `total_cost`: full period spend
  - `retained_users_7d`: users with >= 1 run in the trailing 7 days of the period
  - Prior: `overview.retention_cost_prior` (for delta direction)
  - Delta: inverted (lower cost = green = "improving efficiency"); delta label reads "improving efficiency" or "degrading efficiency"
  - Trend sparkline: `timeseries.points[].cost / timeseries.points[].dau` (daily cost per DAU approximation)
- **Example:** $100.00 / user; down from $118.00 ("improving efficiency")
- **Why it matters:** Unit economics of retention. A 7-day trailing window catches users who might be drifting before they churn fully. Lower cost per retained user signals better value delivery per dollar spent. Note: deliberately uses a 7-day trailing window rather than the full MAU to avoid diluting the metric with users who ran once on day 1 and never returned.
- **Visualization:** KPI card with inverted delta + "improving / degrading efficiency" label + purple sparkline.

---

**O-06 - Agent Success Rate**

- **What it measures:** Percentage of agent runs that completed without a terminal error.
- **Formula:** `COUNT(runs WHERE status = 'success') / COUNT(runs) * 100`
- **Calculation components:**
  - Source field: `overview.success_rate` (percentage, 0-100)
  - Prior: `overview.success_rate_prior`
  - Delta: positive delta = improving (not inverted)
  - Status dot color: `computeErrorRateSeverity(error_rate)` in `src/lib/kpi/formulas.ts` - derived from the error rate (100 - success_rate): `good` < 2%, `warning` 2-5%, `critical` > 5%
  - Delta label: "watch requests count" when improving, "watch errors" when degrading
  - Trend sparkline: `timeseries.points[].error_rate` transformed to `100 - error_rate` (success rate per day)
- **Example:** 94.2%; status dot = green (error rate ~5.8%, amber threshold)
- **Why it matters:** Platform reliability headline. Sustained success rate below ~90% signals systemic platform issues requiring investigation.
- **Visualization:** KPI card with colored status dot (green/amber/red) + percentage delta + purple sparkline of daily success rate.

---

**O-07 - Quality Score**

- **What it measures:** Mean user-rated output quality (1-5 scale) across all rated runs in the period.
- **Formula:** `MEAN(quality_rating WHERE quality_rating IS NOT NULL)`
  - Shows `null` and "Insufficient data" badge when `rated_run_count < 10`
- **Calculation components:**
  - Source fields: `overview.avg_quality_score` (null if < 10 rated runs), `overview.rated_run_count`, `overview.avg_quality_score_prior`
  - Delta format: `decimal` - shows raw score difference (e.g. +0.3), not percentage
  - Delta label: "vs previous period"
  - Star rating: `starRating={avg_quality_score}` - visual star display below the numeric value
  - Subtext: "Based on N human-rated runs"
  - Insufficient data reason: "Fewer than 10 rated runs"
- **Example:** 4.1 / 5.0; based on 2,340 rated runs; +0.3 vs prior period
- **Why it matters:** The only direct measure of output usefulness from the user's perspective. Cost metrics alone are meaningless without a quality signal.
- **Visualization:** KPI card with `formatQuality()` value, star rating display, rated run count subtext, decimal delta.

---

**O-08 - Cost / Quality Point**

- **What it measures:** Dollar cost of producing one unit of user-perceived quality across the period.
- **Formula:** `total_cost / (rated_run_count * avg_quality_score)`
  - Implemented as `computeCostPerQualityPoint(totalCost, ratedRunCount, avgQualityScore)` in `src/lib/kpi/formulas.ts`
  - Returns `null` when `rated_run_count < 10` or `avg_quality_score === null`
- **Calculation components:**
  - `total_cost`: full period spend
  - `rated_run_count`: number of runs where the user provided a quality rating
  - `avg_quality_score`: mean rating (1-5)
  - Together: total spend / (volume of rated runs * average quality) = dollar cost of one "unit" of quality
  - Prior: `overview.cost_per_quality_point_prior`
  - Delta: inverted (lower = green = "improving efficiency")
  - Trend sparkline: filtered to days where `avg_quality_score !== null`, plotted as `daily_cost / daily_avg_quality_score`
- **Example:** $0.42 per quality point; down from $0.56 ("improving efficiency")
- **Why it matters:** Collapses cost and quality into a single comparable number. "After upgrading the model tier, cost per quality point went from $0.56 to $0.42" is a concrete ROI statement.
- **Visualization:** KPI card with inverted delta + "improving/degrading efficiency" label + purple sparkline (quality-days only).

---

**O-09 - Token Usage Over Time**

- **What it measures:** Daily input and output token consumption as two separate area series, revealing the cost composition and trend over the selected period.
- **Formula:** `SUM(input_tokens) per day` and `SUM(output_tokens) per day`
- **Calculation components:**
  - Source: `timeseries.points[].input_tokens` and `timeseries.points[].output_tokens`
  - Two series: teal (`#0d9488`) = input tokens, blue (`#2563eb`) = output tokens
  - Both formatted with `formatTokens()` (K / M / B suffixes)
  - X-axis: time scale, 5 ticks; Y-axis: linear, 4 ticks, auto-domain
- **Example:** Input: 1.8B tokens/30d; Output: 0.61B tokens/30d; tooltip shows each day's split
- **Why it matters:** Token consumption is the variable cost driver. The input/output split reveals whether cost growth is from longer prompts (context bloat) or longer responses (generation overhead) - two different optimization strategies.
- **Visualization:** Dual-series `<AreaChart>` inside `<Visualization>`; legend in card header with color swatches; `<SeriesTooltip>` on hover showing both values with `formatTokens`.

---

**O-10 - Cost vs. Budget**

- **What it measures:** Month-to-date cumulative spend as a solid area, projected continuation to month-end as a dashed area, and the monthly budget as a flat annotation line.
- **Formula:**
  - **Actual series:** Cumulative sum of `timeseries.points[].cost` for dates `<= today`
  - **Projected series:** `last_cumulative_cost + (cum_cost / days_actual) * remaining_days` extrapolated forward from today to period end - only rendered when future dates exist in the timeseries
  - **Budget annotation:** `orgConfig.monthly_budget` as a horizontal line
  - Budget % shown in subtitle: `(last_actual_cost / monthly_budget) * 100`
- **Calculation components:**
  - `timeseries.points[]` (date, cost per day)
  - `orgConfig.monthly_budget` (from `GET /api/org/config`)
  - Two series: `cost` (solid) + `cost_projected` (dashed, `fillOpacity: 0.05`)
  - Legend: solid line swatch = Actual, dashed line swatch = Projected, red line swatch = Budget
- **Example:** Day 26 cumulative: $9,800; projected month-end: $11,308; budget: $15,000 (65.3% utilized)
- **Why it matters:** Enables proactive budget management. If the projection crosses the budget line with 4 days remaining, intervention is still possible.
- **Visualization:** `<AreaChart>` for both series + `<Annotation axis="y" value={monthly_budget} variant="destructive" label="$XYk">` + `<SeriesTooltip>`.

---

**O-11 - Quality Score Trend**

- **What it measures:** 6-month monthly trajectory of average quality score (line + area) overlaid on the rating volume per month (columns), showing whether output quality is improving over time and whether the sample size is meaningful.
- **Formula:**
  - Separate query: `GET /api/analytics/timeseries?from=(6 months ago)&to=(period.to)` - always covers 6 full months regardless of the filter's date range
  - Aggregated by `aggregateQualityMonthly(points, periodTo)` in `src/utils/aggregateQualityMonthly.ts`: groups daily `avg_quality_score` and `rated_run_count` by calendar month, computes monthly mean quality and total rated volume
  - Y-axis is dynamically padded: `min = max(0, floor((minQ - 0.5) * 2) / 2)`, `max = min(5.5, maxQ + 0.5)` - avoids the axis forcing 0 as minimum, keeping the quality trend visible
- **Calculation components:**
  - Primary series `quality`: monthly avg quality score on left Y-axis (area)
  - Secondary series `volume`: monthly rated run count on right Y-axis (columns, hidden axis ticks)
  - Data labels: quality score to 1 decimal place shown above each month's area point
  - Colors: purple (`#7c3aed`) for quality line, translucent blue (`#2563eb55`) for volume columns
  - Legend: color swatches for "Avg Quality Score" and "Rating Volume"
- **Example:** Jan 3.7 (420 rated) | Feb 3.8 (510) | Mar 3.9 (680) | Apr 4.0 (730) | May 4.1 (820) | Jun 4.1 (840)
- **Why it matters:** Answers "is the org getting better at using the tool over time?" A rising quality trend shows users learning and improving prompts. The volume column confirms whether the monthly score is based on enough ratings to be statistically meaningful.
- **Visualization:** `<ColumnChart series="volume" axis="volume_y">` + `<AreaChart series="quality" axis="quality_y" centered>` + `<DataLabels series="quality" format={v => v.toFixed(1)} centered>` + `<SeriesTooltip matchKey="label">`.

---

### Section: Teams (T-01 through T-05)

Visible when no team filter is active (all-teams view). T-05 replaces the table and charts when a specific team is selected.

---

**T-01 - Team Breakdown Table**

- **What it measures:** Side-by-side comparison of all teams across 8 dimensions in a sortable table.
- **Columns and formulas:**

| Column | Formula / Source | Display |
|--------|-----------------|---------|
| Team | `team_name` + churn badge | Name + color dot; amber "Churn Risk" badge if `churn_signal_count > 0` |
| Runs | `COUNT(runs) GROUP BY team_id` | `formatNumber(runs)`; shows WoW run change as red "-X% WoW" if negative |
| Cost | `SUM(run_cost) GROUP BY team_id` | `formatCurrency(cost)` |
| Users | `COUNT(DISTINCT user_id) GROUP BY team_id` (MAU) | `formatNumber(mau)`; shows prior period "was N" below when changed |
| Adoption | `mau / seat_count * 100` | Progress bar + percentage text; bar colored with team color |
| Quality | `MEAN(quality_rating) GROUP BY team_id` | Star rating (1-5 stars filled) + numeric score; dash if insufficient data |
| Failure Rate | `COUNT(failed) / COUNT(runs)` | `formatPercent`; green < 5%, orange 5-10%, red > 10% |
| WoW Trend | `cost_trend[]` daily cost values | 40px `<Visualization>` sparkline with team color |

- **Sorting:** Any numeric column (runs, cost, mau, adoption_rate, avg_quality_score, failed_run_rate, wow_cost_change) clickable to sort asc/desc; active column shows triangle indicator.
- **Churn signal:** `churn_signal_count > 0` = users who had >= 5 runs/week for 4+ consecutive weeks but 0 runs in the last 2 weeks.
- **Example row:** Platform | 12,450 runs | $4,100 | 12 users (was 11) | 80% [====] | 4.2★ | 3.2% | sparkline
- **Visualization:** shadcn/ui `<Table>` + `<Progress>` for adoption + `<StarRating>` for quality + inline `<Visualization height={40}>` per row for cost trend.

---

**T-02 - Runs per Team**

- **What it measures:** Total agent run count for each team in the period, sorted descending.
- **Formula:** `COUNT(runs) GROUP BY team_id ORDER BY runs DESC`
- **Calculation components:**
  - Source: `teamsResponse.teams[].runs`
  - Sorted client-side before rendering: `[...data.teams].sort((a, b) => b.runs - a.runs)`
  - Bar color: `teamColor(team_id)` from `src/lib/team/teamColors.ts`
  - Footer: total run count across all teams
  - Value labels: `formatNumber(runs)`
- **Example:** Platform 12,450 | Backend 8,200 | Frontend 6,100 | Data 3,900 | Total 30,650 runs
- **Why it matters:** Identifies which teams are driving usage volume and which are underutilizing the tool.
- **Visualization:** `<BarChart>` (horizontal bars, `barHeight={28}`, team-colored, formatted labels, total in footer).

---

**T-03 - Cost per Team**

- **What it measures:** Total API spend per team in the period, sorted descending.
- **Formula:** `SUM(run_cost) GROUP BY team_id ORDER BY cost DESC`
- **Calculation components:**
  - Source: `teamsResponse.teams[].cost`
  - Sorted client-side: `[...data.teams].sort((a, b) => b.cost - a.cost)`
  - Bar color: `teamColor(team_id)`
  - Footer: total cost across all teams
  - Value labels: `formatCurrency(cost)`
- **Example:** Platform $4,100 | Backend $2,800 | Frontend $2,300 | Data $1,200 | Total $10,400
- **Why it matters:** Enables cost center chargeback and identifies teams consuming disproportionate budget relative to their run count.
- **Visualization:** `<BarChart>` (horizontal bars, `barHeight={28}`, team-colored, currency labels, total in footer).

---

**T-04 - Quality Score per Team**

- **What it measures:** Average user-rated output quality per team, with teams ordered by quality descending; overlaid with per-team rating volume to show statistical weight.
- **Formula:**
  - Quality: `MEAN(quality_rating) GROUP BY team_id` (null when `rated_run_count < 10`)
  - Volume: `rated_run_count GROUP BY team_id`
  - Only teams with `avg_quality_score !== null` are included; sorted by quality descending
  - Y-axis dynamically padded to data range (same logic as O-11): avoids forced 0-minimum
- **Calculation components:**
  - Source: `teamsResponse.teams[].avg_quality_score` + `.rated_run_count`
  - Two series on independent Y-axes: quality (left, area) + volume (right, columns, hidden ticks)
  - Data labels: `v.toFixed(1)` shown above each team's position
  - Colors: purple (`#7c3aed`) for quality, translucent blue (`#2563eb55`) for volume
- **Example:** Frontend 4.4 (1,200 rated) | Platform 4.2 (890) | Backend 3.9 (640) | Data - (insufficient)
- **Why it matters:** Quality differences between teams may reflect different use cases, prompt quality, or agent configuration. Identifies teams that need enablement (low quality) or that have best practices to share (high quality).
- **Visualization:** Same dual-series pattern as O-11: `<ColumnChart>` (volume) + `<AreaChart>` (quality) + `<DataLabels>` with `<SeriesTooltip matchKey="label">`.

---

**T-05 - Single-Team Drill-Down**

- **What it measures:** Detailed view of one team's metrics when a specific team is selected in the filter. Replaces the all-teams table and charts with a focused 4-card summary + use-case distribution + cost trend.
- **Triggered by:** `teamId` signal set to a specific team ID (from the TeamSelector filter).
- **KPI cards (4):**
  - **Runs:** `team.runs` - total runs for the selected team in the period
  - **Cost:** `team.cost` - total spend for the team
  - **Quality Score:** `team.avg_quality_score` (with "Insufficient data" when null / < 10 rated runs)
  - **Failed Rate:** `team.failed_run_rate` as a percentage
- **Use cases:**
  - Horizontal proportional stacked bar showing `team.top_use_cases[]` segments
  - Up to 6 categories: Code Generation, Code Review, Documentation, Debugging, Test Writing, Data Analysis
  - Each segment: `style={{ width: percentage + '%', background: COLORS[i] }}`
  - `aria-label={category}` on each segment for accessibility
- **Cost trend:**
  - 80px `<Visualization>` sparkline of `team.cost_trend[]` daily values
  - Color: `teamColor(team.team_id)`
- **Source:** `teams[0]` from the filtered API response (single team returned when `team_id` query param set)
- **Example:** Platform team | 12,450 runs | $4,100 | 4.2 / 5.0 | 3.2% failed | Code Gen 40% / Code Review 25% / Docs 20% / Debug 15%
- **Visualization:** 4-column KpiCard grid + `<figure>` use-case bar (colored divs, `role="list"`) + 80px `<Visualization>` sparkline.

---

### Section: Reliability (R-01 through R-11)

Eight KPI cards in two rows of four, then three visualizations below.

---

**R-01 - Error Rate**

- **What it measures:** Percentage of agent runs that terminated with a non-timeout error in the period.
- **Formula:** `COUNT(runs WHERE status = 'error') / COUNT(runs) * 100`
- **Calculation components:**
  - Source: `reliability.error_rate` (percentage, 0-100)
  - Prior: `reliability.error_rate_prior`
  - Delta: inverted (`-(computeDeltaPercent(error_rate, error_rate_prior))`)
  - Status dot: `computeErrorRateSeverity(error_rate)` - `good` (< 2%), `warning` (2-5%), `critical` (> 5%)
  - Trend sparkline: `reliability.error_trend_7d[].error_rate` (7-day rolling values)
  - Chart color: red (`#ef4444`) when `error_rate > 5`, blue (`#2563eb`) otherwise
- **Example:** 3.8%; amber status dot; -0.6% vs prior period (improving)
- **Why it matters:** Headline reliability metric. Anything above 5% is problematic for a production tool that engineers depend on daily.
- **Visualization:** KPI card with colored status dot, inverted delta, purple (or red) sparkline from `error_trend_7d`.

---

**R-02 - Timeout Rate**

- **What it measures:** Percentage of runs killed for exceeding the maximum allowed duration.
- **Formula:** `COUNT(runs WHERE status = 'timeout') / COUNT(runs) * 100`
- **Calculation components:**
  - Source: `reliability.timeout_rate`, `reliability.timeout_rate_prior`
  - Delta: inverted (lower rate = green)
  - Trend sparkline: `reliability.timeout_rate_trend[].value`
- **Example:** 1.2%; -0.3% vs prior (improving)
- **Why it matters:** Distinct from errors - timeouts indicate runs that are too complex or context windows too large, not infrastructure failures. Requires a different remediation (prompt engineering) than model errors (API reliability).
- **Visualization:** KPI card with inverted delta + purple sparkline.

---

**R-03 - P50 Duration (with Queue Wait)**

- **What it measures:** Median run duration (50th percentile) from agent start to completion, with median queue wait shown as a subValue.
- **Formula:**
  - P50: `PERCENTILE(completed_at - started_at, 50) WHERE status = 'success'`
  - Queue wait (subValue): `MEDIAN(agent_started_at - submitted_at)` - time from user submission to when the agent actually begins
- **Calculation components:**
  - Source: `reliability.p50_duration_ms` + `reliability.queue_wait_ms`
  - Both formatted with `formatDuration(ms)` which produces "Xs" (< 60s) or "Xm Ys" (>= 60s)
  - subValue: `"Queue wait: " + formatDuration(queue_wait_ms)`
  - Prior: `p50_duration_ms_prior`; delta inverted (shorter = green)
  - Trend sparkline: `reliability.p50_duration_trend[].value`
- **Example:** P50: 12s | Queue wait: 2.1s | -1s vs prior (improving)
- **Why it matters:** The typical user experience. Queue wait specifically flags capacity constraints - engineers waiting > 30s before their agent starts will stop using the tool. Queue wait is embedded as a subValue rather than a standalone card because it contextualizes the latency.
- **Visualization:** KPI card with P50 as main value, queue wait as subValue, inverted delta, purple sparkline from `p50_duration_trend`.

---

**R-04 - P95 Duration**

- **What it measures:** 95th percentile run duration - the slowest experience for 5% of runs.
- **Formula:** `PERCENTILE(completed_at - started_at, 95) WHERE status = 'success'`
- **Calculation components:**
  - Source: `reliability.p95_duration_ms`, `reliability.p95_duration_ms_prior`
  - Delta: inverted; trend from `p95_duration_trend`
  - P95 >= P50 always (generator enforces: `p95 = int({ min: p50, max: p50 * 4 })`)
- **Example:** 48s; +2s vs prior (degrading)
- **Why it matters:** Rising P95 without rising P50 indicates outlier runs (long contexts, complex tasks), not general platform slowdown. The divergence between P50 and P95 is the meaningful signal.
- **Visualization:** KPI card with inverted delta + purple sparkline from `p95_duration_trend`.

---

**R-05 - P99 Duration**

- **What it measures:** 99th percentile run duration - tail latency experienced by the worst 1% of runs.
- **Formula:** `PERCENTILE(completed_at - started_at, 99) WHERE status = 'success'`
- **Calculation components:**
  - Source: `reliability.p99_duration_ms`, `reliability.p99_duration_ms_prior`
  - Delta: inverted; trend from `p99_duration_trend`
  - P99 >= P95 always
- **Example:** 120s; -5s vs prior (improving)
- **Why it matters:** P99 represents the worst-case outlier. A P99 of 2 minutes vs a P50 of 12 seconds (a 10x tail) might indicate a category of run type (e.g. full-repo refactors) that needs a separate timeout or queue tier.
- **Visualization:** KPI card with inverted delta + purple sparkline from `p99_duration_trend`.

---

**R-06 - Retry Rate**

- **What it measures:** Percentage of runs that were automatically retried at least once by the platform.
- **Formula:** `COUNT(runs WHERE retry_count > 0) / COUNT(runs) * 100`
- **Calculation components:**
  - Source: `reliability.retry_rate` (fraction 0-1 in the API) * 100 for display
  - Delta: inverted (lower rate = green)
  - Trend sparkline: `reliability.retry_rate_trend[].value * 100`
  - Prior: `retry_rate_prior`
- **Example:** 8.1%; -1.2% vs prior (improving)
- **Why it matters:** Each automatic retry consumes an additional full set of tokens without producing additional user value. High retry rate is a hidden tax on spend - it inflates cost without improving success rate.
- **Visualization:** KPI card with inverted delta + purple sparkline (values * 100 for display).

---

**R-07 - MTTR**

- **What it measures:** Mean time to recovery for platform incidents - average elapsed minutes from when an error spike was first detected to when it was resolved.
- **Formula:** `MEAN(resolved_at - detected_at) FOR incidents WHERE resolved_at IS NOT NULL`
  - Computed client-side: `resolvedMttrs.reduce((a, b) => a + b, 0) / resolvedMttrs.length`
  - Null when no resolved incidents in the period; displays "No incidents" in that case
- **Calculation components:**
  - Source: `reliability.incidents[]` array; filter to `mttr_minutes !== null`
  - `reliability.mttr_minutes` = pre-computed mean; `reliability.mttr_minutes_prior` for delta
  - Delta: inverted (shorter MTTR = green); null delta when no prior incidents
  - Trend sparkline: `reliability.mttr_trend[].value` (daily MTTR values where incidents occurred)
- **Example:** 42.0 min; -25.3 min vs prior (improving); or "No incidents" with no delta
- **Why it matters:** Fast recovery is the difference between a 42-minute disruption (mildly inconvenient) and a 4-hour outage (engineers blocked, deadline missed). MTTR is the operational SLA engineers care about most.
- **Visualization:** KPI card with inverted delta (or no delta when no incidents) + purple sparkline from `mttr_trend`.

---

**R-08 - Cost of Failed Runs (Reliability)**

- **What it measures:** Total dollar value of token consumption spent on runs that produced no successful output.
- **Formula:** `SUM(run_cost WHERE status IN ('error', 'timeout'))`
- **Calculation components:**
  - Source: `reliability.cost_of_failed_runs`, `reliability.cost_of_failed_runs_prior`
  - Delta: inverted (lower wasted cost = green)
  - Trend sparkline: `reliability.cost_of_failed_runs_trend[].value`
- **Example:** $1,420; -8.2% vs prior (improving)
- **Why it matters:** Bridges platform reliability to financial impact. Reducing error rate is not just a technical goal - each failed run is a billed API call that produced no value. Also appears in the Billing section (B-06) where it is shown as a percentage of total spend.
- **Visualization:** KPI card with inverted delta + purple sparkline.

---

**R-09 - Error Rate Trend**

- **What it measures:** 7-day rolling error rate as a time series, with a reference line at the 5% alert threshold.
- **Formula:** Daily error rates from `reliability.error_trend_7d[].error_rate` (computed server-side as a 7-day moving average)
- **Calculation components:**
  - Source: `reliability.error_trend_7d[]` - date + error_rate pairs
  - Chart color: red when current error_rate > 5%, blue otherwise
  - Threshold annotation: `<Viz.Annotation axis="y" value={0.05} label="5% threshold">` - a horizontal reference line
  - X-axis: time scale; Y-axis: linear auto-domain
  - Tooltip: "Error Rate (7d avg)" label
- **Example:** 7-day trend from 4.1% down to 3.8%; blue area; 5% threshold line visible above the data
- **Why it matters:** The current error rate is a snapshot; the trend tells you if the platform is improving or worsening. A downward slope with the 5% line visible above = healthy. An upward slope approaching the line = action required.
- **Visualization:** `<AreaChart>` + `<Annotation axis="y" value={0.05} label="5% threshold">` + `<SeriesTooltip>`.

---

**R-10 - Error Type Breakdown**

- **What it measures:** Distribution of failure causes across all failed runs in the period.
- **Formula:** `COUNT(runs) GROUP BY error_type WHERE status = 'error'`
- **Error types and colors:**
  - `model_error` - red (`#ef4444`): The model API returned an error response
  - `timeout` - orange (`#f97316`): Run exceeded maximum allowed duration
  - `tool_call_failure` - blue (`#3b82f6`): An external tool call (file write, test runner, etc.) failed
  - `rate_limit` - purple (`#a855f7`): API rate limit hit
  - `other` - gray (`#6b7280`): Uncategorized failures
- **Calculation components:**
  - Source: `reliability.error_type_breakdown[]` - `{ type, count, percentage }`
  - Total count: `error_type_breakdown.reduce((s, e) => s + e.count, 0)` - shown in donut center
  - Legend: type label (human-readable) + percentage + count per type
- **Example:** Model Error 35% (250) | Timeout 28% (198) | Tool Call Failure 20% (142) | Rate Limit 10% (71) | Other 7% (50) | 711 total
- **Why it matters:** Different error types require completely different responses. Context overflow / tool failures = prompt engineering problem. Rate limits = capacity upgrade. Model errors = API reliability issue. Without the breakdown, "3.8% error rate" is an unactionable number.
- **Visualization:** `<DonutChart slices={...} centerLine1={formatNumber(total)} centerLine2="errors" size={180}>` + `<DonutLegend>` showing percentage and count per type.

---

**R-11 - Platform Availability Calendar**

- **What it measures:** Daily uptime percentage for each day in the selected period, with a summary footer showing overall availability, incident count, longest incident, and MTTR.
- **Formula:** `(total_minutes - downtime_minutes) / total_minutes * 100` per calendar day
- **Calculation components:**
  - Source: `reliability.availability_by_day[]` - `{ date, uptime_pct }` per day
  - Three color tiers (applied to each `<AvailabilityDayBox>` component):
    - Green: `uptime_pct >= 99.9%` - SLA compliant
    - Amber: `99.0% <= uptime_pct < 99.9%` - degraded but not breached
    - Red: `uptime_pct < 99.0%` - SLA breach
  - Box layout: 48x48px divs in `flex-wrap`; each shows date (DD/MM) + uptime%
  - Tooltip (`title` attr): `"{date}: {uptime.toFixed(3)}% uptime"`
  - Summary footer (below boxes):
    - MTD Availability: `formatPercent(platform_availability)` (period average)
    - Incidents: count of `reliability.incidents[]`
    - Longest Incident: max `mttr_minutes` from incidents (with date)
    - MTTR: `mttr_minutes.toFixed(1) min` or "-"
- **Example:** 26 green boxes, 3 amber, 1 red | 99.87% MTD | 2 incidents | Longest: 42 min (Jun 19)
- **Why it matters:** SLA compliance metric. Most enterprise contracts require 99.9% availability. The calendar format shows incident clustering (e.g. three red days in a row = a sustained outage vs scattered amber = sporadic issues) that a single percentage cannot.
- **Visualization:** Custom `<AvailabilityDayBox>` components (not @visx/heatmap) in a `role="list"` flex container; color and border set via inline styles; legend in card header; summary row as a `border-t` flex bar below.

---

### Section: Billing & Financial (B-01 through B-11)

Six KPI cards in two groups of three (rendered in one CSS grid), then three chart rows.

---

**B-01 - Budget Utilization**

- **What it measures:** Current month-to-date spend as a percentage of the org's monthly budget, with remaining budget displayed as the delta.
- **Formula:** `current_month_spend / monthly_budget * 100`
- **Calculation components:**
  - Source: `billing.budget_utilization` (pre-computed percentage), `billing.current_month_spend`, `billing.monthly_budget`
  - Main value: `formatPercent(budget_utilization, 1)` (one decimal)
  - subValue: `"${formatCurrency(current_month_spend)} of ${formatCurrency(monthly_budget)} budget"`
  - Delta: `monthly_budget - current_month_spend` in dollars, format: `currency`, label: "budget remaining"
  - Trend sparkline: `billing.cost_anomaly_days[].daily_cost` (day-by-day actual spend)
- **Example:** 65.3% | $9,800 of $15,000 budget | $5,200 budget remaining
- **Why it matters:** At-a-glance budget health check. A billing admin can see in one number whether the org is on track (65% at day 26 = underspending) or at risk (90% at day 15 = likely overspend).
- **Visualization:** KPI card with currency delta (budget remaining, green when positive) + subValue + purple sparkline.

---

**B-02 - Projected Annual Spend**

- **What it measures:** Full-year spend projection based on the current month's projected month-end cost annualized.
- **Formula:** `projected_month_end * 12`
  - `projected_month_end = (current_month_spend / days_elapsed) * days_in_month`
  - Both computed in the mock generator; `billing.projected_annual_spend` is the direct field
- **Calculation components:**
  - Source: `billing.projected_annual_spend`, `billing.monthly_budget`
  - Annual budget comparison: `monthly_budget * 12`
  - Delta: `(monthly_budget * 12) - projected_annual_spend` in dollars, format: `currency`
  - Delta label: "under budget" (positive) or "above budget risk" (negative)
  - Trend sparkline: `billing.invoice_history[].total_billed` mapped to `{ date: month + '-01', value: total_billed }`
- **Example:** $157,300 projected; $22,700 under annual budget ($180,000)
- **Why it matters:** The number that appears in the renewal conversation. CFOs and procurement teams need the annual commitment figure, not the monthly.
- **Visualization:** KPI card with currency delta (under/over annual budget) + purple sparkline of invoice history.

---

**B-03 - New User Activation Cost**

- **What it measures:** Average cost attributable to onboarding new users in the period - the investment required to bring one new seat holder to their first productive runs.
- **Formula:** API-computed; represents the cost slice attributed to users in their activation window (first N runs).
- **Calculation components:**
  - Source: `billing.new_user_activation_cost` (null when no new users activated this period), `billing.new_user_activation_cost_prior`
  - Null handling: "Insufficient data" when null; shown as empty value with badge
  - Delta: inverted (lower activation cost = green); label "WoW"
  - Trend sparkline: `billing.new_user_activation_cost_trend[]` (daily values; empty array when null)
- **Example:** $50.00 activation cost; -$8.20 WoW (improving)
- **Why it matters:** If onboarding costs $50 and monthly retention costs $100/user, the org recoups the onboarding investment in the first month of active use. Rising activation cost signals onboarding friction.
- **Visualization:** KPI card with inverted currency delta + "Insufficient data" fallback + purple sparkline.

---

**B-04 - Cost per Successful Run**

- **What it measures:** Average cost of producing one successfully completed agent output.
- **Formula:** `current_month_spend / successful_run_count`
  - Implemented as `computeCostPerSuccessfulRun(totalCost, successfulRunCount)` in `src/lib/kpi/formulas.ts`
  - Returns 0 when `successfulRunCount === 0`
- **Calculation components:**
  - Source: `billing.cost_per_successful_run`, `billing.cost_per_successful_run_prior`
  - Delta: inverted (lower cost = green); label "WoW"
  - Trend sparkline: `billing.cost_per_successful_run_trend[].value`
- **Example:** $1.21 per successful run; -$0.08 WoW (improving)
- **Why it matters:** The clearest unit economics metric. "Each useful agent result costs us $1.21" grounds the ROI conversation. Compare against: how long would an engineer take to do the same task manually?
- **Visualization:** KPI card with inverted currency delta + purple sparkline.

---

**B-05 - Token Rate Efficiency**

- **What it measures:** Effective cost per million tokens vs. the published list price, quantifying any volume discount or pricing tier benefit realized.
- **Formula:** `total_token_cost / (total_tokens / 1,000,000)`
  - Implemented as `computeTokenRateEfficiency(totalTokenCost, totalTokens)` in `src/lib/kpi/formulas.ts`
  - Returns 0 when `totalTokens === 0`
  - `token_rate_list` is fixed at $3.00/1M in the mock (configurable in production)
- **Calculation components:**
  - Source: `billing.token_rate_actual`, `billing.token_rate_list` (3.00), `billing.token_rate_actual_prior`
  - Main value: `formatCurrency(token_rate_actual) + "/1M"`
  - subValue: `formatPercent((list - actual) / list * 100, 1) + "% below list (" + formatCurrency(list) + "/1M)"`
  - Delta: inverted (lower actual rate = green, means bigger discount realized); label "WoW"
  - Trend sparkline: `billing.token_rate_trend[].value`
- **Example:** $2.40/1M actual | 20.0% below list ($3.00/1M)
- **Why it matters:** Enterprise contracts often include volume discounts. This KPI verifies the discount is being applied correctly and quantifies its annual value.
- **Visualization:** KPI card with subValue showing discount percentage + inverted delta + purple sparkline.

---

**B-06 - Cost of Failed Runs (Billing)**

- **What it measures:** Same calculation as R-08 (API spend on failed runs), but presented in the billing context with an additional percentage-of-spend subValue for financial framing.
- **Formula:** `SUM(run_cost WHERE status IN ('error', 'timeout'))`
- **Calculation components:**
  - Source: `billing.cost_of_failed_runs`, `billing.cost_of_failed_runs_prior`, `billing.current_month_spend`
  - Main value: `formatCurrency(cost_of_failed_runs)`
  - subValue: `formatPercent((cost_of_failed_runs / current_month_spend) * 100, 1) + "% of period spend"`
  - Delta: inverted (lower = green); label "WoW"
  - Trend sparkline: `billing.cost_of_failed_runs_trend[].value`
- **Example:** $1,420 | 5.1% of period spend; -8.2% WoW (improving)
- **Why it matters:** Redundant with R-08 by design - it makes the reliability-finance connection explicit in the billing section. "5.1% of spend produced zero output" is a financial statement that motivates reliability investment.
- **Visualization:** KPI card with subValue (% of spend) + inverted percentage delta + purple sparkline.

---

**B-07 - Cumulative Spend vs. Budget**

- **What it measures:** Month-by-month cumulative spend from invoice history (actual) extended with a projected point for the current month, versus the monthly budget annotation.
- **Formula:**
  - **Actual series:** `billing.invoice_history[]` monthly totals (closed months as discrete data points)
  - **Projected series:** last closed month's total as starting point + `{ date: current_month_start, value: projected_month_end }` as ending point - rendered as a dashed extension
  - **Budget annotation:** `billing.monthly_budget` as a horizontal reference line labeled "Budget"
- **Calculation components:**
  - Source: `billing.invoice_history[]` + `billing.projected_month_end` + `billing.monthly_budget`
  - Two series: `actual` (solid) + `projected` (dashed, `fillOpacity` unset = default)
  - X-axis: time scale with month granularity (`date = month + '-01'`)
  - Tooltip: shows both series values at the hovered month
- **Example:** Monthly trend Jan-May ($9,100 -> $14,200) + dashed Jun projection to $11,308 + flat Budget line at $15,000
- **Why it matters:** Shows the billing arc over time and whether the current month is trending above or below the historical run rate. The dashed projection makes the expected month-end visible before the invoice is issued.
- **Visualization:** Dual-series `<AreaChart>` (solid actual + dashed projected) + `<Annotation axis="y" value={monthly_budget} label="Budget">` + `<SeriesTooltip>`.

---

**B-08 - Invoice History**

- **What it measures:** The last 6 closed monthly invoices as a column chart showing spend trend over 6 months.
- **Formula:** `SELECT month, total_billed FROM invoice_history ORDER BY month ASC` (6 entries)
- **Calculation components:**
  - Source: `billing.invoice_history[]` - `{ month: 'YYYY-MM', total_billed: number }`
  - 6 months of closed invoices; current month is in-flight (not in this list)
  - X-axis: band scale with month labels (YYYY-MM format)
  - Y-axis: linear auto-domain; 3 ticks
  - Tooltip: "Monthly Billed" label + `formatCurrency` value per bar
- **Example:** Jan $9,100 | Feb $9,800 | Mar $10,400 | Apr $11,900 | May $12,680 | Jun in-flight
- **Why it matters:** Shows the spending trajectory at a glance. A steeply rising trend prompts capacity planning and contract renegotiation conversations. A flat trend signals stable usage.
- **Visualization:** `<ColumnChart series="bars" axis="y">` on a band X-axis + `<SeriesTooltip matchKey="label">`.

---

**B-09 - Cost by Team (Donut)**

- **What it measures:** Proportional distribution of total period spend across teams, combining token consumption costs and prorated seat license costs.
- **Formula:** Per team: `token_cost + seat_cost_prorated`
  - `token_cost`: team's share of API token consumption (70% of total in mock)
  - `seat_cost_prorated`: org seat fee * (team_headcount / org_headcount) (30% of total in mock)
  - `percentage`: integer percentage summing to exactly 100 across all teams
- **Calculation components:**
  - Source: `billing.cost_by_team[]` - `{ team_id, team_name, token_cost, seat_cost_prorated, total, percentage }`
  - Donut slices colored by `teamColor(team_id, i)`
  - Legend: team name + percentage + total cost per team
  - Donut size: 160px
- **Example:** Platform 28% ($4,100) | Backend 22% ($3,200) | Frontend 19% ($2,800) | Data 11% ($1,600)
- **Why it matters:** Finance needs this proportional view for P&L allocation. "Platform team consumed 28% of our AI spend" is how cost center managers report to finance.
- **Visualization:** `<DonutChart slices={...} size={160}>` + `<DonutLegend>` showing percentage and formatted total per team.

---

**B-10 - Cost Chargeback Table**

- **What it measures:** Line-item cost breakdown formatted for internal chargeback reporting - each team's token cost, prorated seat cost, total, and percentage of org spend.
- **Formula:** Same source as B-09 but presented as a table for copy-paste into finance reports.
- **Columns:** Team | Seat Cost | Token Cost | Total | % of Org
- **Calculation components:**
  - Source: `billing.cost_by_team[]` rendered by `<ChargebackTable>` component
  - All currency values with `formatCurrency()`
  - Percentage with one decimal place
- **Example row:** Platform | $1,230 (seat) | $2,870 (token) | $4,100 | 28%
- **Why it matters:** The donut (B-09) shows proportion visually; the chargeback table provides the exact numbers a billing admin needs to file cost allocation reports. Together they serve different stakeholders of the same underlying data.
- **Visualization:** shadcn/ui `<Table>` rendered by `src/components/kpis/ChargebackTable.tsx`.

---

**B-11 - Cost Anomaly Calendar**

- **What it measures:** Daily spend for every day in the period with color-coded anomaly severity tiers, enabling detection of runaway automation or accidental high-volume triggers.
- **Formula:** `daily_cost` per day with anomaly flag: `daily_cost > avg_daily_cost * 1.2` (20% above baseline)
  - Three display tiers based on overage ratio: `ratio = daily_cost / avg_daily_cost`
    - Green (normal): `ratio <= 1.2` (within +20% of average)
    - Amber (elevated): `1.2 < ratio <= 1.5` (+20% to +50%)
    - Red (anomaly): `ratio > 1.5` (>+50%)
- **Calculation components:**
  - Source: `billing.cost_anomaly_days[]` - `{ date, daily_cost, avg_daily_cost, is_anomaly }`
  - `avg_daily_cost` is consistent across all days (30-day average baseline)
  - Box tooltip: `"{date}: {formatCurrency(daily_cost)} (avg {formatCurrency(avg_daily_cost)})"`
  - Summary row below calendar: anomaly alert count (`is_anomaly === true`) + period average daily cost
  - Anomaly count: `cost_anomaly_days.filter(d => d.is_anomaly).length`
  - Average: `sum(daily_cost) / cost_anomaly_days.length`
  - Legend in card header: green = Normal, amber = +20-50%, red = >+50%
- **Example:** 26 green boxes, 3 amber, 2 red | 5 anomaly alerts this period | Avg $430/day
- **Why it matters:** A runaway CI script triggering agents in a loop will show up as a cluster of red boxes immediately, days before the invoice arrives. Without the calendar view, a $1,100 day buried in a monthly total is invisible until billing.
- **Visualization:** Custom `<AnomalyDayBox>` components (colored divs, 48x48px) in a `role="list"` `flex-wrap` container; inline `title` tooltip; summary row below as `border-t` flex bar. Not @visx/heatmap - uses the same custom component pattern as the availability calendar (R-11).
