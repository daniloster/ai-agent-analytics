# SPEC: WP-11 - /understanding Route

**Date:** 2026-06-26
**Plan reference:** `docs/20260626-analytics-dashboard-plan.md` - WP-11
**Investigation reference:** `docs/20260626-cloud-agent-analytics-dashboard-investigation.md` - all sections
**Status:** Ready

---

## Assumptions (confirmed or defaulted)

- No filter bar, no SectionNav, no TanStack Query polling - this is a static documentation page.
- The page has its own layout: fixed left sidebar (240px) + scrollable right content area. This is distinct from `DashboardLayout` (WP-04).
- All content is hardcoded as TypeScript constants in `src/routes/understanding/data/`; the page does NOT fetch from an API or render raw markdown files.
- KPI formula strings in `kpis.ts` must match those documented in investigation Appendix A. They are static strings, not runtime calls to `src/lib/kpi/formulas.ts` - the link to the implementation is intentional documentation, not an import dependency.
- `src/app/router.tsx` is created in WP-04 with the `/` route. WP-11 modifies it to add `/understanding`.
- `react-router-dom` is already installed (WP-01) and the router is already configured (WP-04).
- The `/understanding` route is publicly accessible with no authentication gating.
- This WP is built last (depends on WP-01 through WP-10) so its content reflects the actual final implementation.

---

## 1. Context

Implements **WP-11** from `docs/20260626-analytics-dashboard-plan.md`.

This is the final working package. It is ordered last by design: the `/understanding` page documents what was actually built, not what was planned. By the time this WP is implemented, every KPI formula, every key decision, every technology choice is finalized - and the page can accurately reflect all of them.

The page serves any stakeholder who needs to understand the dashboard without reading the investigation document:
- An evaluator assessing the implementation
- A new engineer onboarding to the codebase
- A CTO wanting to understand what KPIs measure and how formulas work
- A billing admin wanting to understand the billing model premise

**Files modified:**
- `src/app/router.tsx` - adds the `/understanding` route

**Files created (all new):**
- `src/routes/understanding/UnderstandingPage.tsx`
- `src/routes/understanding/components/UnderstandingSidebar.tsx`
- `src/routes/understanding/components/KpiEntryCard.tsx`
- `src/routes/understanding/components/DecisionTable.tsx`
- `src/routes/understanding/data/kpis.ts`
- `src/routes/understanding/data/decisions.ts`
- `src/routes/understanding/data/techStack.ts`
- `src/routes/understanding/data/scope.ts`

**Depends on:** WP-01 through WP-10 (all other WPs must be complete).

---

## 2. Data model

All types are co-located with their data files. No shared type imports needed outside this route.

```ts
// src/routes/understanding/data/kpis.ts

export interface KpiEntry {
  id: string                    // 'KPI-01'
  section: 'overview' | 'teams' | 'reliability' | 'billing' | 'quality'
  label: string                 // 'Total Agent Runs'
  whatItMeasures: string
  formula: string               // human-readable formula string (not a function call)
  example: string               // 'Example: 12,450 runs in the last 30 days'
  whyItMatters: string
  dataRequirements: string | null  // null if no special data dependency
  visualization: string         // 'KPI card with sparkline showing daily run count trend'
}

// 49 entries total, grouped by section:
// overview: KPI-01 through KPI-14  (14 entries)
// teams:    KPI-15 through KPI-25  (11 entries)
// reliability: KPI-26 through KPI-35  (10 entries)
// billing:  KPI-36 through KPI-45  (10 entries)
// quality:  KPI-46 through KPI-49   (4 entries)

export const KPI_CATALOG: KpiEntry[]
```

```ts
// src/routes/understanding/data/decisions.ts

export interface DecisionEntry {
  id: string            // 'D-1'
  decision: string      // 'Dashboard layout pattern'
  options: string[]     // ['Single-page progressive', 'Multi-page with sidebar', 'Configurable widget grid']
  status: 'Resolved' | 'Open'
  chosen: string        // 'Single-page progressive (Option A)'; empty string when Open
  rationale: string     // full rationale text from investigation §6
  reversible: boolean
}

// 15 entries: D-1 through D-15

export const KEY_DECISIONS: DecisionEntry[]
```

```ts
// src/routes/understanding/data/techStack.ts

export interface TechDecision {
  area: string           // 'Chart library'
  choice: string         // 'Visx (@visx/*)'
  ruledOut: string[]     // ['Recharts', 'Nivo', 'ECharts', 'Chart.js', 'Tremor']
  rationale: string      // condensed from investigation D-2 detail
  packageRef?: string    // '@visx/scale @visx/shape ...'
}

export const TECH_DECISIONS: TechDecision[]
// Entries: Visx, Preact Signals (@preact/signals-react), TanStack Query,
// MSW + Faker.js, react-fast-compare, shadcn/ui, Vitest, URL search params (filter state)
```

```ts
// src/routes/understanding/data/scope.ts

export interface ScopeEntry {
  item: string
  rationale: string
}

export const IN_SCOPE: ScopeEntry[]
// From investigation §4: org-level dashboard, 49 KPIs, mock API, charts, responsive layout, tests

export const OUT_OF_SCOPE: ScopeEntry[]
// From investigation §4: live streaming (v2), user drill-down (v2), alerting,
// auth/SSO, backend implementation, mobile layout, CSV/PDF export (v2), benchmarking
```

---

## 3. Component / module design

### `src/app/router.tsx` (modified)

WP-04 created this file with a single `/` route. WP-11 adds the `/understanding` route:

```ts
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { UnderstandingPage } from '@/routes/understanding/UnderstandingPage'
// ... section imports

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <DashboardLayout>
        {/* four Section components from WP-05 through WP-08 */}
      </DashboardLayout>
    ),
  },
  {
    path: '/understanding',
    element: <UnderstandingPage />,
  },
])
```

---

### `src/routes/understanding/UnderstandingPage.tsx` (new)

```ts
export function UnderstandingPage(): JSX.Element
```

- Page-level layout: `<div className="flex min-h-screen">` with two children:
  - `<UnderstandingSidebar />` - fixed 240px left column
  - `<main id="main-content" className="flex-1 ml-60 px-8 py-12 max-w-4xl">` - scrollable content
- Seven content sections, each a `<section>` with a matching `id` attribute:

| Section id | Heading | Content |
|------------|---------|---------|
| `about` | "About This Dashboard" | Problem statement, who is affected (stakeholder table), cost of inaction, why now - from investigation §2 and §3 |
| `premise` | "Billing Model Premise" | The hybrid token + seat model explained; labeled explicitly as an assumption for evaluators. Mirrors investigation §2 Constraints paragraph. |
| `kpis` | "KPI Catalog" | `KPI_CATALOG` grouped into 5 subsections; each entry rendered as `<KpiEntryCard>` |
| `decisions` | "Key Technical Decisions" | `<DecisionTable decisions={KEY_DECISIONS} />` |
| `tech` | "Technology Choices" | `TECH_DECISIONS` rendered as a comparison list; Visx rationale rendered in full (the longest entry) |
| `scope` | "Scope: v1" | Two columns: In Scope / Out of Scope from `IN_SCOPE` and `OUT_OF_SCOPE` |
| `glossary` | "Glossary" | Definition list (`<dl>`) of all terms from investigation §11; 20 terms |

- A link to `/` appears at the top of the page (outside the sidebar, in a small top bar): `<Link to="/">Back to Dashboard</Link>` using `react-router-dom` `Link`.

---

### `src/routes/understanding/components/UnderstandingSidebar.tsx` (new)

```ts
export function UnderstandingSidebar(): JSX.Element
```

- `<nav aria-label="Understanding page navigation">` inside a `<aside className="fixed top-0 left-0 h-screen w-60 border-r bg-background p-6 overflow-y-auto">`
- Top of sidebar: `<Link to="/" className="...">Back to Dashboard</Link>` (react-router-dom Link)
- Seven anchor links: About, Billing Premise, KPI Catalog, Key Decisions, Technology, Scope, Glossary
- Active section tracked by a local `useSignal<string>('about')` - private to this component
- `useEffect` on mount: creates one `IntersectionObserver` (threshold 0.2) watching all seven section elements; updates `activeSection.value` on intersection
- Active link: `aria-current="true"` + `font-medium text-primary` Tailwind classes; inactive links: `text-muted-foreground hover:text-foreground`
- Click handler: `e.preventDefault(); document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })`

---

### `src/routes/understanding/components/KpiEntryCard.tsx` (new)

```ts
export function KpiEntryCard({ kpi }: { kpi: KpiEntry }): JSX.Element
```

- shadcn/ui `<Card>` with `<CardHeader>` and `<CardContent>`
- `<CardHeader>`:
  - `<Badge variant="outline">{kpi.id}</Badge>` - e.g. "KPI-01"
  - `<CardTitle className="text-base">{kpi.label}</CardTitle>` - e.g. "Total Agent Runs"
- `<CardContent>` (compact, prose-style):
  - **What it measures:** `<p>{kpi.whatItMeasures}</p>`
  - **Formula:** `<code className="block bg-muted px-3 py-2 rounded text-sm font-mono">{kpi.formula}</code>`
  - **Example:** `<p className="text-sm text-muted-foreground italic">{kpi.example}</p>`
  - **Why it matters:** `<p className="text-sm">{kpi.whyItMatters}</p>`
  - **Data requirements:** rendered only when `kpi.dataRequirements !== null`: `<p className="text-sm text-amber-600">Requires: {kpi.dataRequirements}</p>`
  - **Visualization:** `<p className="text-xs text-muted-foreground">{kpi.visualization}</p>`

Used in `UnderstandingPage` inside the `#kpis` section, grouped by `kpi.section` into five subsections with a heading each:
- "Section 1: Overview" (14 cards)
- "Section 2: Team Breakdown" (11 cards)
- "Section 3: Reliability" (10 cards)
- "Section 4: Billing & Financial" (10 cards)
- "Quality & Efficiency Cross-cuts" (4 cards)

Cards rendered in a responsive grid: `grid grid-cols-1 gap-4 lg:grid-cols-2`.

---

### `src/routes/understanding/components/DecisionTable.tsx` (new)

```ts
export function DecisionTable({ decisions }: { decisions: DecisionEntry[] }): JSX.Element
```

- shadcn/ui `<Table>` with `<TableHeader>` and `<TableBody>`
- Columns: **ID**, **Decision**, **Options Considered**, **Status**, **Chosen**, **Reversible**
- Each row: one `<TableRow>` for the summary + one `<TableRow>` for the rationale (expandable via shadcn/ui `<Collapsible>` triggered by clicking the summary row)
- **Status** column: `<Badge variant="default">Resolved</Badge>` (green) or `<Badge variant="secondary">Open</Badge>` for open decisions
- **Reversible** column: "Yes" or "No" text
- **Options Considered** column: comma-joined string from `entry.options`
- The rationale row spans all columns and is hidden by default; clicking the summary row toggles it

---

## 4. Interaction diagram

### Route navigation

```
User is at / (dashboard)
  --> clicks "Understanding" link in DashboardLayout header or footer
  --> React Router <Link to="/understanding"> navigates
  --> URL becomes /understanding
  --> UnderstandingPage mounts (no QueryClient, no filter signals, no MSW worker calls)
  --> Page renders immediately (all data is static module-level constants)
  --> UnderstandingSidebar mounts, sets up IntersectionObserver on 7 section elements
  --> #about section is in viewport -> activeSection.value = 'about'
  --> "About" link in sidebar receives active styling

User clicks "KPI Catalog" in sidebar
  --> click handler: document.getElementById('kpis')?.scrollIntoView({ behavior: 'smooth' })
  --> page scrolls to #kpis section
  --> IntersectionObserver fires for #kpis (threshold 0.2)
  --> activeSection.value = 'kpis'
  --> "KPI Catalog" link gets active styling; "About" loses it

User clicks "Back to Dashboard" (Link component, top of sidebar)
  --> React Router navigates to /
  --> DashboardLayout mounts, filterSignals.initFiltersFromUrl() called
  --> URL has no params -> default 30d date range, all teams
  --> Dashboard renders normally
```

### KPI Catalog rendering

```
UnderstandingPage renders #kpis section:
  --> const grouped = groupBy(KPI_CATALOG, kpi => kpi.section)
  --> renders in order: overview, teams, reliability, billing, quality

For each group:
  --> <h3>{sectionLabel}</h3>   e.g. "Section 1: Overview"
  --> <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {group.map(kpi => <KpiEntryCard key={kpi.id} kpi={kpi} />)}
      </div>

KpiEntryCard for KPI-01:
  --> <Badge>KPI-01</Badge>
  --> <CardTitle>Total Agent Runs</CardTitle>
  --> What it measures: "Number of agent executions in the selected period."
  --> Formula: <code>COUNT(runs WHERE org = org_id AND started_at IN period)</code>
  --> Example: "12,450 runs in the last 30 days."
  --> Why it matters: "The most basic health signal..."
  --> Data requirements: (none - null -> not rendered)
  --> Visualization: "KPI card with sparkline showing daily run count trend."
```

### Decision log interaction

```
User views #decisions section
  --> <DecisionTable decisions={KEY_DECISIONS} />
  --> 15 summary rows visible; rationale rows collapsed

User clicks D-2 row ("Chart library")
  --> Collapsible toggles
  --> Rationale row expands below D-2:
      "Visx is chosen over Recharts because this dashboard has two non-negotiable
       requirements that Recharts cannot meet: full keyboard/ARIA accessibility on
       chart data elements, and visualization types (heatmaps, confidence-interval
       overlays, cohort retention curves) that Recharts cannot produce..."
  --> Clicking again collapses the rationale row
```

---

## 5. Acceptance criteria

1. Navigating to `/understanding` renders `UnderstandingPage` with no console errors and no uncaught exceptions.
2. Navigating to `/` from the "Back to Dashboard" link renders the full analytics dashboard with the default filter state.
3. The KPI Catalog section renders exactly 49 `KpiEntryCard` components (verifiable by counting rendered cards or checking `KPI_CATALOG.length === 49`).
4. KPI entries are grouped correctly: "Section 1: Overview" group contains exactly 14 cards (KPI-01 through KPI-14).
5. The Key Decisions section renders exactly 15 rows in `DecisionTable` (D-1 through D-15).
6. All 15 decisions have `status: 'Resolved'`; the "Resolved" badge is shown in green for each row.
7. The `#premise` section contains text explicitly naming "hybrid token + seat model" and labeling it as a premise for evaluators.
8. Clicking "KPI Catalog" in the sidebar scrolls to `#kpis` and applies active styling to that sidebar link; the previously active link loses active styling.
9. The sidebar is `position: fixed` and remains visible in the left column while the user scrolls through the entire KPI Catalog (the longest section).
10. `npx tsc --noEmit` passes with zero errors after WP-11 is complete.
11. The page renders to a visible state in under 500ms (no async data fetching; confirmed by timing the initial render in a dev build).
12. Each `KpiEntry` in `KPI_CATALOG` has a non-empty `formula` string matching the formula in investigation Appendix A for that KPI id (spot-checked in the data test).
13. The Glossary section (`#glossary`) contains all 20 terms from investigation §11, rendered as a `<dl>` definition list.
14. `KpiEntryCard` does not render the "Requires:" line when `kpi.dataRequirements` is `null`.
15. Clicking a `DecisionTable` row expands the rationale text; clicking it again collapses it.

---

## 6. Out of scope

- Fetching KPI definitions or decisions from an API (static constants only in v1).
- Rendering raw markdown files (`.md` files are source documents, not rendered assets).
- Editing or annotating KPI definitions from the UI.
- Exporting the understanding page to PDF (v2).
- Displaying live metrics or real-time data on this page (use `/` for that).
- Authentication or role-based access control on `/understanding` (publicly accessible).
- Internationalization of the content (English only in v1).
- Dark-mode-specific prose color overrides beyond what Tailwind's `dark:` variants and CSS variables provide automatically.

---

## Test plan

| File | What it tests |
|------|---------------|
| `src/routes/understanding/data/kpis.test.ts` (new) | `KPI_CATALOG.length === 49`; each entry has non-empty `id`, `label`, `formula`, `example`, `section`; no duplicate ids; all `section` values are one of the five valid literals; exactly 14 entries with `section === 'overview'` |
| `src/routes/understanding/data/decisions.test.ts` (new) | `KEY_DECISIONS.length === 15`; ids are 'D-1' through 'D-15' with no gaps; all entries have `status === 'Resolved'`; all resolved entries have non-empty `chosen` string; all `options` arrays have at least 2 items |
| `src/routes/understanding/components/KpiEntryCard.test.ts` (new) | renders KPI id badge text; renders formula inside a `<code>` element; renders example text; renders "Requires:" line when `dataRequirements` is non-null; does not render "Requires:" line when `dataRequirements` is null |
| `src/routes/understanding/components/DecisionTable.test.ts` (new) | renders 15 table rows (one per decision); Resolved badge present for all rows; clicking a row expands the rationale text; clicking again collapses it; chosen value is non-empty for all rows |
| `src/routes/understanding/components/UnderstandingSidebar.test.ts` (new) | all 7 anchor links present with correct href values; "Back to Dashboard" Link points to `/`; active class applied to link matching `activeSection`; click calls `scrollIntoView` on the target section element |
| `src/routes/understanding/UnderstandingPage.test.ts` (new) | renders without crashing inside a `MemoryRouter`; 7 section elements present with correct ids; exactly 49 `KpiEntryCard` components rendered; sidebar is present; "About This Dashboard" heading present |
