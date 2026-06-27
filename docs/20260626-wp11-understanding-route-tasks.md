# TASKS: WP-11 - /understanding Route

**SPEC:** `docs/20260626-wp11-understanding-route-spec.md`
**Date:** 2026-06-26

---

## T-1: Static data layer

**Context**

Implements the "Data model" section of the WP-11 spec. This task creates the four TypeScript constant files that hold all the static content for the `/understanding` page. Everything else in WP-11 imports from these files, so they must be created first. No component, no logic - only types and constants.

Read `src/routes/understanding/data/` before starting (currently only `.gitkeep` exists). Read `src/lib/kpi/formulas.ts` to verify formula strings for KPI entries that reference pure functions (e.g. `computeRetentionCost`, `computeCostPerQualityPoint`). Read `docs/20260626-wp11-understanding-route-spec.md` Appendix A in full - it is the authoritative source for all 38 KPI entries. Use the `KpiEntry` shape exactly as specced: `{ id, section, label, whatItMeasures, formula, example, whyItMatters, visualization }`.

**Requirements**

1. `src/routes/understanding/data/kpis.ts` must export `KpiSection`, `KpiEntry`, and `KPI_CATALOG: KpiEntry[]` with exactly 38 entries.
2. IDs must follow the pattern: O-01 through O-11 (overview), T-01 through T-05 (teams), R-01 through R-11 (reliability), B-01 through B-11 (billing).
3. All `section` values must be one of the four `KpiSection` literals; no other strings.
4. Every entry's `formula` field must be a human-readable formula string, not a code snippet. For entries backed by `src/lib/kpi/formulas.ts` pure functions, the formula string must accurately describe what that function computes.
5. `src/routes/understanding/data/decisions.ts` must export `DecisionEntry` and `KEY_DECISIONS: DecisionEntry[]` with exactly 15 entries, IDs D-1 through D-15.
6. Every `DecisionEntry` must have non-empty `id`, `decision`, `chosen`, `rationale`, and `options` (array with at least 2 strings).
7. `src/routes/understanding/data/techStack.ts` must export `TechDecision` and `TECH_DECISIONS: TechDecision[]` with at least 6 entries covering the libraries listed in the spec (Visx, Preact Signals, TanStack Query, MSW + Faker.js, react-fast-compare, shadcn/ui).
8. `src/routes/understanding/data/scope.ts` must export `ScopeEntry`, `IN_SCOPE: ScopeEntry[]`, and `OUT_OF_SCOPE: ScopeEntry[]` with at least 6 entries each.
9. No file in this task may import from outside `src/routes/understanding/data/` - all types are co-located with their data.
10. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- All types are defined in the same file as the data they describe (`kpis.ts` owns `KpiSection` and `KpiEntry`; no shared `types/` import).
- `KPI_CATALOG` uses `formula` as a human-readable string (e.g. `"total_cost / retained_users_7d"`) not a TS expression - the card renders it in a `<code>` block.
- The spec Appendix A is the canonical entry content; the wording there is what goes into the constants.

**Design**

```ts
// src/routes/understanding/data/kpis.ts  (new file)

export type KpiSection = 'overview' | 'teams' | 'reliability' | 'billing'

export interface KpiEntry {
  id: string            // 'O-01', 'T-01', 'R-01', 'B-01'
  section: KpiSection
  label: string
  whatItMeasures: string
  formula: string       // human-readable; rendered in <code>
  example: string
  whyItMatters: string
  visualization: string
}

export const KPI_CATALOG: KpiEntry[] = [
  // Overview (O-01 through O-11) - 11 entries
  // Teams (T-01 through T-05) - 5 entries
  // Reliability (R-01 through R-11) - 11 entries
  // Billing (B-01 through B-11) - 11 entries
]
```

```ts
// src/routes/understanding/data/decisions.ts  (new file)

export interface DecisionEntry {
  id: string             // 'D-1' through 'D-15'
  decision: string
  options: string[]      // at least 2 items
  chosen: string
  rationale: string
  reversible: boolean
}

export const KEY_DECISIONS: DecisionEntry[] = [
  // D-1 through D-15
]
```

```ts
// src/routes/understanding/data/techStack.ts  (new file)

export interface TechDecision {
  area: string
  choice: string
  ruledOut: string[]
  rationale: string
  packageRef?: string
}

export const TECH_DECISIONS: TechDecision[]
```

```ts
// src/routes/understanding/data/scope.ts  (new file)

export interface ScopeEntry {
  item: string
  rationale: string
}

export const IN_SCOPE: ScopeEntry[]
export const OUT_OF_SCOPE: ScopeEntry[]
```

**Acceptance criteria**

1. `KPI_CATALOG.length === 38` (asserted in the test).
2. `KPI_CATALOG.filter(k => k.section === 'overview').length === 11`.
3. `KPI_CATALOG.filter(k => k.section === 'teams').length === 5`.
4. `KPI_CATALOG.filter(k => k.section === 'reliability').length === 11`.
5. `KPI_CATALOG.filter(k => k.section === 'billing').length === 11`.
6. No two entries share the same `id` - `new Set(KPI_CATALOG.map(k => k.id)).size === 38`.
7. `KEY_DECISIONS.length === 15` and IDs form an unbroken sequence 'D-1' through 'D-15'.
8. All `DecisionEntry` objects have non-empty `chosen` and `rationale` and at least 2 items in `options`.
9. `TECH_DECISIONS.length >= 6`; all entries have non-empty `area`, `choice`, and `rationale`.
10. `IN_SCOPE.length >= 6` and `OUT_OF_SCOPE.length >= 6`.

**Test plan**

- `src/routes/understanding/data/kpis.test.ts` (new)
  - Scenario: `KPI_CATALOG.length === 38`.
  - Scenario: per-section counts match (11/5/11/11).
  - Scenario: no duplicate IDs.
  - Scenario: every entry has non-empty `id`, `label`, `formula`, `example`, `section`.
  - Scenario: all `section` values are one of the 4 valid literals.
  - Scenario: `formula` field for O-05 contains "total_cost" and "retained_users_7d" (spot-check formula accuracy against `computeRetentionCost`).
- `src/routes/understanding/data/decisions.test.ts` (new)
  - Scenario: `KEY_DECISIONS.length === 15`.
  - Scenario: IDs are exactly 'D-1' through 'D-15' with no gaps.
  - Scenario: every entry has non-empty `chosen` and `rationale`.
  - Scenario: every `options` array has at least 2 items.

**Files**

- `src/routes/understanding/data/kpis.ts` (new) - `KpiSection`, `KpiEntry`, `KPI_CATALOG` with all 38 entries
- `src/routes/understanding/data/decisions.ts` (new) - `DecisionEntry`, `KEY_DECISIONS` with 15 entries
- `src/routes/understanding/data/techStack.ts` (new) - `TechDecision`, `TECH_DECISIONS` with library rationales
- `src/routes/understanding/data/scope.ts` (new) - `ScopeEntry`, `IN_SCOPE`, `OUT_OF_SCOPE`
- `src/routes/understanding/data/kpis.test.ts` (new) - catalog integrity tests
- `src/routes/understanding/data/decisions.test.ts` (new) - decision integrity tests

---

## T-2: KpiEntryCard component

**Context**

Implements the `KpiEntryCard` component from the "Component / module design" section of the WP-11 spec. This is a pure presentational component - it receives one `KpiEntry` (from T-1) and renders it as a shadcn/ui `Card`. It has no signal state and no async dependencies.

Read `src/components/kpis/KpiCard.tsx` before starting - it shows the existing `Card`, `CardHeader`, `CardContent`, and `Badge` usage patterns in this codebase. Read `src/components/ui/card.tsx` and `src/components/ui/badge.tsx` to confirm available import paths. Read `src/routes/understanding/data/kpis.ts` (T-1 output) for the `KpiEntry` type.

**Requirements**

1. The component must be a named export `export function KpiEntryCard` following the function declaration style required by `ARCHITECTURE.md` section 4.3.
2. Props must be `{ kpi: KpiEntry }` where `KpiEntry` is imported from `../data/kpis`.
3. The card must render `kpi.id` inside a `<Badge variant="outline">`.
4. The card must render `kpi.label` inside a `<CardTitle className="text-sm">` adjacent to the badge.
5. The card must render `kpi.formula` inside a `<code className="block bg-muted px-3 py-1.5 rounded text-xs font-mono mt-1">` element.
6. The card must render `kpi.example` as an italic `<p className="text-xs text-muted-foreground italic mt-1">`.
7. The card must render `kpi.whyItMatters` as a `<p className="text-xs mt-1">`.
8. The card must render `kpi.visualization` as a `<p className="text-xs text-muted-foreground mt-1">`.
9. Field labels ("Formula:", "Example:", "Why it matters:", "Visualization:") must appear before each field value so screen readers can identify them.
10. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- No signals, no state - purely a display component. `useSignal` is not needed.
- Field labels are rendered as `<span className="font-medium text-xs">Label:</span>` inline before each value, so the card is self-contained and readable without CSS class inspection.
- Do not add a Popover or tooltip - the full content is already visible inline.

**Design**

```tsx
// src/routes/understanding/components/KpiEntryCard.tsx  (new file)

import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import type { KpiEntry } from '../data/kpis'

export function KpiEntryCard({ kpi }: { kpi: KpiEntry }): JSX.Element {
  // renders id badge + label in header
  // renders 5 fields in CardContent: whatItMeasures, formula (in <code>), example, whyItMatters, visualization
}
```

**Acceptance criteria**

1. Rendering `<KpiEntryCard kpi={O01_ENTRY} />` (any valid `KpiEntry`) makes `kpi.id` visible in the output.
2. `kpi.formula` is rendered inside a `<code>` element (query by `container.querySelector('code')`).
3. `kpi.example` text is present in the rendered output.
4. `kpi.whyItMatters` text is present in the rendered output.
5. `kpi.visualization` text is present in the rendered output.
6. Rendering two different entries produces two distinct id values in the output.

**Test plan**

- `src/routes/understanding/components/KpiEntryCard.test.tsx` (new)
  - Scenario: renders `kpi.id` in a Badge element (query by badge class or text content).
  - Scenario: renders `kpi.label` as the card title.
  - Scenario: renders `kpi.formula` inside a `<code>` element.
  - Scenario: renders `kpi.example` text in the output.
  - Scenario: renders `kpi.whyItMatters` text in the output.
  - Scenario: renders `kpi.visualization` text in the output.
  - Scenario: rendering with `avg_quality_score === null` in the formula string does not throw.

**Files**

- `src/routes/understanding/components/KpiEntryCard.tsx` (new) - presentational card for one KpiEntry
- `src/routes/understanding/components/KpiEntryCard.test.tsx` (new) - rendering tests

---

## T-3: DecisionCard component

**Context**

Implements the `DecisionCard` component from the "Component / module design" section of the WP-11 spec. It renders one `DecisionEntry` (from T-1) as an expandable card: collapsed by default, rationale revealed on click, with `aria-expanded` toggled so screen readers announce the state change.

Read `src/components/kpis/KpiCard.tsx` for how `useSignal` is used for local boolean state in a card component (the `open = useSignal(false)` pattern for the Popover). That is the pattern to follow for `DecisionCard`. Read `src/routes/understanding/data/decisions.ts` (T-1 output) for the `DecisionEntry` type. The `Button` with `aria-expanded` pattern should follow the approach in `src/components/layout/SectionNav.tsx` for clickable interactive elements.

**Requirements**

1. The component must be a named export `export function DecisionCard` following the function declaration style.
2. Props must be `{ decision: DecisionEntry }` where `DecisionEntry` is imported from `../data/decisions`.
3. The card must show `decision.id`, `decision.decision`, and `decision.chosen` in the collapsed (default) state.
4. The card must show `decision.options` joined with " / " in the collapsed state.
5. A `<Badge>Resolved</Badge>` must appear in the collapsed state.
6. The `open` state must be tracked by `useSignal<boolean>(false)` - private to this component.
7. The toggle element must be a `<button>` with `aria-expanded={open.value}` and a chevron icon that rotates 180deg when `open.value === true`.
8. When expanded, the card must additionally render `decision.rationale` in a `<p>`.
9. When expanded, the card must additionally render `decision.reversible` as "Reversible: Yes" or "Reversible: No".
10. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- `useSignal<boolean>(false)` not `useState` - per `ARCHITECTURE.md` section 3.1.
- The chevron rotation is a pure CSS transform: `style={{ transform: open.value ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}`.
- The toggle trigger is the entire card header (or a `<button>` inside it) - not just the chevron - to maximize click target size.
- `aria-expanded` goes on the `<button>` element, not the card container.

**Design**

```tsx
// src/routes/understanding/components/DecisionCard.tsx  (new file)

import { useSignal } from '@preact/signals-react'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardHeader } from '../../components/ui/card'
import type { DecisionEntry } from '../data/decisions'

export function DecisionCard({ decision }: { decision: DecisionEntry }): JSX.Element {
  const open = useSignal<boolean>(false)
  // toggle: open.value = !open.value on button click
  // collapsed: id badge, decision label, chosen badge, options list, Resolved badge
  // expanded: + rationale paragraph + Reversible: Yes/No
}
```

**Acceptance criteria**

1. Initial render: `decision.rationale` text is NOT present in the DOM.
2. After clicking the toggle button: `decision.rationale` text IS present in the DOM.
3. After a second click: `decision.rationale` text is NOT present again.
4. `aria-expanded` on the toggle button is `"false"` initially, `"true"` after first click, `"false"` after second click.
5. `decision.chosen` is visible in the collapsed state.
6. `decision.options` (joined with " / ") is visible in the collapsed state.
7. A `<Badge>Resolved</Badge>` is visible in the collapsed state.

**Test plan**

- `src/routes/understanding/components/DecisionCard.test.tsx` (new)
  - Scenario: rationale text is not visible on initial render.
  - Scenario: clicking the toggle button makes rationale text visible.
  - Scenario: clicking the toggle button again hides rationale text.
  - Scenario: `aria-expanded` is `"false"` before click and `"true"` after click.
  - Scenario: `decision.chosen` text is present in collapsed state.
  - Scenario: "Resolved" badge is present in collapsed state.

**Files**

- `src/routes/understanding/components/DecisionCard.tsx` (new) - expandable card for one DecisionEntry
- `src/routes/understanding/components/DecisionCard.test.tsx` (new) - expand/collapse tests

---

## T-4: UnderstandingSidebar component

**Context**

Implements the `UnderstandingSidebar` component from the "Component / module design" section of the WP-11 spec. It is a fixed left sidebar with seven anchor links, a "Back to Dashboard" link, and an `IntersectionObserver` that highlights the active section as the user scrolls the page content.

The pattern to follow for the `IntersectionObserver` + signal-driven active state is `src/components/layout/SectionNav.tsx`. Read that file in full before implementing. The sidebar is an `<aside>` rather than a `<nav>` strip, and it uses `document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })` for click navigation instead of URL-based section sync. The `userHasScrolled` ref from `SectionNav.tsx` is NOT needed here - the understanding page is a long static page where the IO should fire on first paint too (the user is not mid-session on this page).

Read `src/routes/understanding/data/kpis.ts` and the spec section ids from the spec to know the 7 section IDs: `about`, `premise`, `kpis`, `decisions`, `tech`, `scope`, `glossary`.

**Requirements**

1. The component must be a named export `export function UnderstandingSidebar`.
2. The outer element must be `<aside className="fixed top-0 left-0 h-screen w-60 border-r bg-card p-6 overflow-y-auto z-10">`.
3. A `<Link to="/">Back to Dashboard</Link>` (from `react-router-dom`) must appear at the top of the sidebar, above the nav links.
4. A `<nav aria-label="Page navigation">` must wrap the seven anchor links.
5. Active section must be tracked by `useSignal<string>('about')` - private to this component.
6. A `useEffect` on mount must install one `IntersectionObserver` (threshold `0.3`) that watches all seven `<section>` elements by `document.getElementById(sectionId)` and sets `activeSection.value = entry.target.id` when intersecting.
7. The observer must be disconnected on component unmount (return the cleanup function from `useEffect`).
8. Each anchor's `onClick` handler must call `e.preventDefault()` then `document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })` then `activeSection.value = sectionId`.
9. Active link must have `aria-current="true"` and the class string `"font-medium text-foreground border-l-2 border-foreground pl-2"`.
10. Inactive links must have `"text-muted-foreground hover:text-foreground pl-2"` (no left border).
11. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- `useSignal` not `useState` for `activeSection` - per `ARCHITECTURE.md` section 3.1.
- The observer threshold is `0.3` (not `0.4` like `SectionNav`) because sections on the understanding page are taller and the lower threshold fires earlier, keeping the sidebar in sync as the user scrolls through long KPI or decision lists.
- No `setSectionInUrl` call - the `/understanding` URL does not carry a `?section=` param.
- `IntersectionObserver` is installed without the `userHasScrolled` guard used in `SectionNav` because the understanding page always wants the first visible section highlighted immediately.

**Design**

```tsx
// src/routes/understanding/components/UnderstandingSidebar.tsx  (new file)

import { useSignal } from '@preact/signals-react'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'

const SECTIONS = [
  { id: 'about',     label: 'About This Dashboard' },
  { id: 'premise',   label: 'Billing Model Premise' },
  { id: 'kpis',      label: 'KPI & Metric Catalog' },
  { id: 'decisions', label: 'Key Technical Decisions' },
  { id: 'tech',      label: 'Technology Choices' },
  { id: 'scope',     label: 'Scope: v1' },
  { id: 'glossary',  label: 'Glossary' },
]

export function UnderstandingSidebar(): JSX.Element {
  const activeSection = useSignal<string>('about')

  useEffect(() => {
    // install IntersectionObserver watching all 7 section elements
    // return cleanup: observer.disconnect()
  }, [activeSection])

  // renders: <aside> > <Link to="/">Back to Dashboard</Link> + <nav> with 7 <a> links
  // each link: aria-current when active, onClick scrolls + sets activeSection.value
}
```

**Acceptance criteria**

1. Rendering the sidebar produces exactly 7 anchor `<a>` elements inside the `<nav>` (plus the `<Link>` outside it).
2. The "Back to Dashboard" `<Link>` has `to="/"`.
3. The link with label "About This Dashboard" has `aria-current="true"` in the default rendered state (`activeSection` initial value is `'about'`).
4. Clicking the "KPI & Metric Catalog" link calls `document.getElementById('kpis')?.scrollIntoView`.
5. After clicking "KPI & Metric Catalog", that link has `aria-current="true"` and the "About This Dashboard" link does not.
6. The `<aside>` element has `className` containing `fixed` and `w-60`.

**Test plan**

- `src/routes/understanding/components/UnderstandingSidebar.test.tsx` (new)
  - Scenario: renders 7 anchor links inside the nav.
  - Scenario: "Back to Dashboard" link has `to="/"`.
  - Scenario: "About This Dashboard" link has `aria-current="true"` on initial render.
  - Scenario: clicking "KPI & Metric Catalog" link calls `document.getElementById` with `'kpis'` and `scrollIntoView`.
  - Scenario: after clicking "KPI & Metric Catalog", its link has `aria-current="true"`.
  - Scenario: `IntersectionObserver` is disconnected on unmount (verify `disconnect` called via spy on the global).

**Files**

- `src/routes/understanding/components/UnderstandingSidebar.tsx` (new) - fixed sidebar with section navigation
- `src/routes/understanding/components/UnderstandingSidebar.test.tsx` (new) - link rendering and interaction tests

---

## T-5: UnderstandingPage

**Context**

Implements the `UnderstandingPage` route component from the "Component / module design" section of the WP-11 spec. This is the largest task in WP-11: it assembles `UnderstandingSidebar` (T-4), `KpiEntryCard` (T-2), and `DecisionCard` (T-3) into a single scrollable page with seven content sections, each with prose content written inline. No async data, no `QueryClientProvider`.

Read the full WP-11 spec sections 3 and 4 before starting - the component design and interaction diagram describe the exact seven sections and their content sources. The static content for `#about`, `#premise`, `#tech`, `#scope`, and `#glossary` is written directly in JSX; the `#kpis` section maps over `KPI_CATALOG` grouped by section; the `#decisions` section maps over `KEY_DECISIONS`.

Read `src/components/layout/SectionNav.tsx` and `src/components/layout/Section.tsx` to understand the section ID / heading pattern in the existing dashboard.

**Requirements**

1. The component must be a named export `export function UnderstandingPage`.
2. The page layout must be `<div className="flex min-h-screen bg-background">` with `<UnderstandingSidebar />` and a `<main id="main-content" tabIndex={-1} className="flex-1 ml-60 px-8 py-10 max-w-4xl">`.
3. Exactly seven `<section>` elements must be rendered, with `id` attributes: `about`, `premise`, `kpis`, `decisions`, `tech`, `scope`, `glossary` (in that order).
4. The `#about` section must include an `<h1>About This Dashboard</h1>` (or `<h2>` - use consistent heading hierarchy; `<h2>` is fine if the page has no `<h1>`) and a prose description of what the dashboard does and who it is for.
5. The `#premise` section must explicitly name "hybrid token + seat model" and label it as an assumption (e.g. "This is a premise for evaluators, not a production billing guarantee.").
6. The `#kpis` section must render `KPI_CATALOG` grouped into the four sections (overview, teams, reliability, billing), each subsection preceded by an `<h3>` heading. Each entry is rendered as `<KpiEntryCard key={kpi.id} kpi={kpi} />` inside a `<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">`.
7. The `#decisions` section must render `KEY_DECISIONS` as a `<ul role="list">` with one `<li>` per entry, each containing `<DecisionCard key={d.id} decision={d} />`.
8. The `#tech` section must render `TECH_DECISIONS` as a readable list showing `area`, `choice`, and `rationale` for each entry, plus `ruledOut` options where non-empty.
9. The `#scope` section must render `IN_SCOPE` and `OUT_OF_SCOPE` side by side (two-column grid on `lg:` screens, stacked on mobile).
10. The `#glossary` section must render a `<dl>` definition list with at least 20 term/definition pairs covering key terms from the investigation (e.g. MAU, retention cost, quality score, token rate efficiency, MTTR, P50, P95, P99, seat adoption, churn signal, cost anomaly, cost per quality point, cost per successful run, 7-day retention window, WoW, MoM, dau, seat_count, rated_run_count, budget utilization).
11. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- No signals, no `useEffect`, no TanStack Query - the page is fully static. The only signal-dependent code lives inside `UnderstandingSidebar` (T-4).
- Group `KPI_CATALOG` by section at the module level (outside the component) to avoid re-grouping on every render: `const BY_SECTION = { overview: KPI_CATALOG.filter(...), teams: ..., ... }`.
- `BY_SECTION` is a `const` at module scope because it depends only on `KPI_CATALOG` (pure, no props or signals). This follows the "hoist pure functions outside components" rule from `ARCHITECTURE.md` section 4.4.
- Prose content for `#about`, `#premise`, `#glossary` is written directly in JSX - not imported from a data file - because it is display text tied to the page layout and has no reuse elsewhere.

**Design**

```tsx
// src/routes/understanding/UnderstandingPage.tsx  (new file)

import { KPI_CATALOG } from './data/kpis'
import { KEY_DECISIONS } from './data/decisions'
import { TECH_DECISIONS } from './data/techStack'
import { IN_SCOPE, OUT_OF_SCOPE } from './data/scope'
import { UnderstandingSidebar } from './components/UnderstandingSidebar'
import { KpiEntryCard } from './components/KpiEntryCard'
import { DecisionCard } from './components/DecisionCard'

// Hoisted - runs once at import time
const BY_SECTION = {
  overview:    KPI_CATALOG.filter(k => k.section === 'overview'),
  teams:       KPI_CATALOG.filter(k => k.section === 'teams'),
  reliability: KPI_CATALOG.filter(k => k.section === 'reliability'),
  billing:     KPI_CATALOG.filter(k => k.section === 'billing'),
}

export function UnderstandingPage(): JSX.Element {
  return (
    <div className="flex min-h-screen bg-background">
      <UnderstandingSidebar />
      <main id="main-content" tabIndex={-1} className="flex-1 ml-60 px-8 py-10 max-w-4xl">
        <section id="about">...</section>
        <section id="premise">...</section>
        <section id="kpis">
          {/* overview subsection */}
          <h3>Overview</h3>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {BY_SECTION.overview.map(kpi => <KpiEntryCard key={kpi.id} kpi={kpi} />)}
          </div>
          {/* teams, reliability, billing subsections follow same pattern */}
        </section>
        <section id="decisions">
          <ul role="list">
            {KEY_DECISIONS.map(d => <li key={d.id}><DecisionCard decision={d} /></li>)}
          </ul>
        </section>
        <section id="tech">...</section>
        <section id="scope">...</section>
        <section id="glossary"><dl>...</dl></section>
      </main>
    </div>
  )
}
```

**Acceptance criteria**

1. The page renders without throwing inside `<MemoryRouter>` with no `QueryClientProvider`.
2. Exactly seven elements with the correct `id` values are present in the output.
3. `document.querySelectorAll('[data-section-id]')` - or more practically: the heading "About This Dashboard" is present.
4. The heading "Billing Model Premise" is present and the section text contains "hybrid token + seat model".
5. The `#kpis` section contains exactly 38 `KpiEntryCard` components (38 `<code>` elements or 38 elements with `data-kpi-id` - use the formula `<code>` elements as the proxy).
6. The `#decisions` section contains exactly 15 `DecisionCard` toggle buttons.
7. The `#glossary` `<dl>` contains at least 20 `<dt>` elements.
8. `BY_SECTION.overview.length + BY_SECTION.teams.length + BY_SECTION.reliability.length + BY_SECTION.billing.length === 38` (verifiable by importing `BY_SECTION` if exported, or by counting rendered cards).

**Test plan**

- `src/routes/understanding/UnderstandingPage.test.tsx` (new)
  - Mock `UnderstandingSidebar` to `<aside data-testid="sidebar" />` to avoid IntersectionObserver in jsdom.
  - Scenario: renders without throwing inside `MemoryRouter`.
  - Scenario: all 7 section `id` values present in the DOM.
  - Scenario: heading "About This Dashboard" is present.
  - Scenario: text "hybrid token + seat model" is present in the output.
  - Scenario: exactly 38 `<code>` elements are present (one per `KpiEntryCard` formula field).
  - Scenario: exactly 15 `aria-expanded` buttons present (one per `DecisionCard` toggle).
  - Scenario: `<dl>` element is present and has at least 20 `<dt>` children.

**Files**

- `src/routes/understanding/UnderstandingPage.tsx` (new) - full page with 7 sections
- `src/routes/understanding/UnderstandingPage.test.tsx` (new) - page structure and content tests

---

## T-6: Router wiring and DashboardLayout link

**Context**

Implements the two small file modifications described in the WP-11 spec "Context" section. This wires the `/understanding` route into the router and adds the "How this works" navigation link to the existing dashboard header. T-5 must be complete before this task, because `router.tsx` imports `UnderstandingPage`.

Read `src/app/router.tsx` in full - the `/understanding` route entry goes directly after the existing `{ path: '/', element: <DashboardRoute /> }` entry. The comment `// WP-11 adds the /understanding route alongside this entry.` is already present; replace it with the actual route.

Read `src/components/layout/DashboardLayout.tsx` in full - the "How this works" `<Link>` is added in the `<header>` element between the product name span and the `<FilterBar />`. Use `react-router-dom`'s `Link` component; confirm it is already imported in `DashboardLayout.tsx` (it is not - add the import).

Read `src/app/router.test.tsx` and `src/components/layout/DashboardLayout.test.tsx` before touching the test files.

**Requirements**

1. `src/app/router.tsx` must add `{ path: '/understanding', element: <UnderstandingPage /> }` to the `createBrowserRouter` array.
2. `UnderstandingPage` must be imported as a named import from `'../routes/understanding/UnderstandingPage'`.
3. The WP-11 placeholder comment (`// WP-11 adds the /understanding route alongside this entry.`) must be removed.
4. `src/components/layout/DashboardLayout.tsx` must add `import { Link } from 'react-router-dom'` at the top of the file.
5. The `<Link to="/understanding" className="text-xs text-muted-foreground hover:text-foreground ml-auto">How this works</Link>` element must be added inside the `<header>`, between the product name `<span>` and `<FilterBar />`.
6. The `<FilterBar />` must remain in the header after this change - the `<Link>` is inserted between the product name and the `FilterBar`, not replacing it.
7. `src/app/router.test.tsx` must be updated to add a test: `'renders /understanding route'` - renders `UnderstandingPage` by mocking it and confirming the mock renders when the router navigates to `/understanding`.
8. `src/components/layout/DashboardLayout.test.tsx` must be updated to add a test: `'header contains How this works link pointing to /understanding'`.
9. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- The "How this works" `<Link>` uses `ml-auto` to push it to the far right of the product name span, leaving `<FilterBar />` on the right end of the header (it already uses its own flex placement).
- `UnderstandingPage` is lazy-loaded candidate in the future (`React.lazy`), but for now it is a static import - consistent with how `DashboardRoute` components are imported.

**Design**

```tsx
// src/app/router.tsx  (modified)
// Add after existing imports:
import { UnderstandingPage } from '../routes/understanding/UnderstandingPage'

// Replace the placeholder comment; update createBrowserRouter:
export const router = createBrowserRouter([
  { path: '/', element: <DashboardRoute /> },
  { path: '/understanding', element: <UnderstandingPage /> },
])
```

```tsx
// src/components/layout/DashboardLayout.tsx  (modified)
// Add import:
import { Link } from 'react-router-dom'

// In the header JSX, between the product name span and <FilterBar />:
<span className="text-sm font-semibold text-foreground">
  AI Agent Analytics
</span>
<Link to="/understanding" className="text-xs text-muted-foreground hover:text-foreground ml-auto">
  How this works
</Link>
<FilterBar />
```

**Acceptance criteria**

1. `npx tsc --noEmit` passes with zero errors after this task.
2. Navigating to `/understanding` in the running app renders the `UnderstandingPage` (manual check).
3. The header of the dashboard at `/` contains a link with text "How this works" pointing to `/understanding`.
4. The `<FilterBar />` is still rendered in the header after the change.
5. The existing `router.test.tsx` tests all continue to pass without modification.
6. The new router test passes: rendering the router with `initialEntries={['/understanding']}` renders the mocked `UnderstandingPage` component.

**Test plan**

- `src/app/router.test.tsx` (modified)
  - Add mock: `vi.mock('../routes/understanding/UnderstandingPage', () => ({ UnderstandingPage: () => <div data-testid="understanding-page" /> }))`.
  - New scenario: render the `/understanding` route via `RouterProvider` with `createMemoryRouter` and `initialEntries={['/understanding']}`; confirm `screen.getByTestId('understanding-page')` is present.
- `src/components/layout/DashboardLayout.test.tsx` (modified)
  - New scenario: render `<DashboardLayout><p>child</p></DashboardLayout>` inside a `MemoryRouter`; confirm an anchor element with text "How this works" and `href="/understanding"` is present in the header.

**Files**

- `src/app/router.tsx` (modified) - adds `/understanding` route entry; removes WP-11 placeholder comment
- `src/components/layout/DashboardLayout.tsx` (modified) - adds `Link` import and "How this works" link in header
- `src/app/router.test.tsx` (modified) - adds `/understanding` route navigation test
- `src/components/layout/DashboardLayout.test.tsx` (modified) - adds "How this works" link test

---

## Implementation order table

| Done | Priority | Task | Depends on | Effort |
|------|----------|------|------------|--------|
| [x]  | 1        | T-1: Static data layer | - | Medium |
| [x]  | 2        | T-2: KpiEntryCard component | T-1 | Small |
| [x]  | 3        | T-3: DecisionCard component | T-1 | Small |
| [x]  | 4        | T-4: UnderstandingSidebar component | T-1 | Medium |
| [x]  | 5        | T-5: UnderstandingPage | T-1, T-2, T-3, T-4 | Large |
| [ ]  | 6        | T-6: Router wiring and DashboardLayout link | T-5 | Small |
