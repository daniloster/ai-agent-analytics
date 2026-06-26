# SPEC: WP-04 - Dashboard Shell & Filter Bar

**Date:** 2026-06-26
**Plan reference:** `docs/20260626-analytics-dashboard-plan.md` - WP-04
**Investigation reference:** `docs/20260626-cloud-agent-analytics-dashboard-investigation.md` - D-1, D-6, D-7, D-8, D-10

---

## Assumptions (confirmed or defaulted)

- Filter state lives in Preact signals (`filterSignals.ts`); URL is the persistence layer. The two are always in sync.
- `filterQueryParams` is a computed signal derived from `dateRange` and `teamId`. It uses `useDeepComputed` so it is referentially stable when the underlying values have not changed - preventing spurious TanStack Query refetches.
- TanStack Query `QueryClient` is configured once in `DashboardLayout`. All section queries use `filterQueryParams.value` as part of their query key.
- Lazy section mount uses `IntersectionObserver` in a `useEffect` inside `Section.tsx` - this is content-level lazy rendering, not `React.lazy`/`Suspense`. Once mounted, a section never un-mounts.
- shadcn/ui `Calendar` for the date picker; shadcn/ui `Select` for team selector.
- Active `SectionNav` item is tracked via `IntersectionObserver` on each section's sentinel element (not scroll position arithmetic).
- Components use `function ComponentName(` declaration style. No arrow-function component definitions. No `React.memo`.
- `filterQueryParams` is computed using `computed()` from `@preact/signals-react` (not `useDeepComputed`) because it is module-level (not in a component). The deep-equality stable reference is achieved by checking object equality before updating - see §3 design note.

---

## 1. Context

Implements investigation decisions:
- D-1: Single-page progressive layout with sticky header and section navigation
- D-6: Date range filter (7d / 30d / 90d / custom)
- D-7: Team filter ("All teams" default + single-team scoping)
- D-8: 30-second polling via TanStack Query `refetchInterval`
- D-10: URL search params as the filter state persistence layer

**Files created (all new):**
- `src/app/router.tsx` - `createBrowserRouter` defining the `/` route (renders `DashboardLayout` with the four section placeholders); the `/understanding` route is added later in WP-11
- `src/lib/filters/filterSignals.ts`
- `src/components/layout/DashboardLayout.tsx`
- `src/components/layout/SectionNav.tsx`
- `src/components/layout/Section.tsx`
- `src/components/layout/SectionSkeleton.tsx`
- `src/components/filters/FilterBar.tsx`
- `src/components/filters/DateRangePicker.tsx`
- `src/components/filters/TeamSelector.tsx`

**Files modified:**
- `src/App.tsx` - already renders `<RouterProvider router={router}>` (wired in WP-01 with a placeholder router); WP-04 updates `src/app/router.tsx` to replace the placeholder with the real dashboard route; `App.tsx` itself does not change
- `src/main.tsx` - already modified by WP-02 to start MSW worker (no further changes needed)

**Depends on:**
- WP-01: Vite project, Tailwind, shadcn/ui, `@preact/signals-react` installed
- WP-02: `Team` type exported from `src/types/api.ts`; MSW handler for `GET /api/org/teams` exists

---

## 2. Data model

```ts
// src/lib/filters/filterSignals.ts

export type DatePreset = '7d' | '30d' | '90d' | 'custom'

export interface DateRange {
  from: string    // ISO date 'YYYY-MM-DD'
  to: string      // ISO date 'YYYY-MM-DD'
  preset: DatePreset
}

// Used as TanStack Query key and serialized to URLSearchParams
export interface FilterQueryParams {
  from: string
  to: string
  team_id: string | undefined
}

// Section identifiers - match the id attributes of Section components
export type SectionId = 'overview' | 'teams' | 'reliability' | 'billing'

// URL param keys
// ?from=YYYY-MM-DD&to=YYYY-MM-DD&preset=30d&team=<team_id>
```

---

## 3. Component / module design

### `src/lib/filters/filterSignals.ts`

Module-level signals (not inside a class or component). These are singletons for the duration of the app session.

```ts
import { signal, computed } from '@preact/signals-react'

export const dateRange: Signal<DateRange>       // writable signal
export const teamId: Signal<string | undefined> // writable signal

// computed: derives FilterQueryParams from dateRange + teamId.
// Uses an internal prev-reference check so that if the computed
// value is structurally identical to the previous value, the same
// object reference is returned - preventing TanStack Query from
// treating it as a new query key.
export const filterQueryParams: ReadonlySignal<FilterQueryParams>

export function initFiltersFromUrl(): void
// Reads window.location.search; parses from, to, preset, team params.
// Sets dateRange.value and teamId.value.
// Called once on app mount.

export function syncFiltersToUrl(): void
// Serializes dateRange.value and teamId.value to URLSearchParams.
// Calls history.replaceState to update the URL without navigation.
// Called inside useSignalEffect in App.tsx whenever signals change.
```

**Design note on `filterQueryParams` stability:**
`computed()` from `@preact/signals-react` uses reference equality (`===`) to decide whether to notify subscribers. Because `FilterQueryParams` is a plain object, each computation creates a new reference even if the values are identical. To prevent this from triggering spurious TanStack Query refetches, the computed function keeps a previous-value ref and returns the same object reference when structurally equal:

```ts
// pseudo-implementation (shape only)
let _prev: FilterQueryParams | undefined
export const filterQueryParams = computed((): FilterQueryParams => {
  const next = { from: dateRange.value.from, to: dateRange.value.to, team_id: teamId.value }
  if (_prev && _prev.from === next.from && _prev.to === next.to && _prev.team_id === next.team_id) {
    return _prev
  }
  _prev = next
  return next
})
```

---

### `src/app/router.tsx`

```ts
import { createBrowserRouter } from 'react-router-dom'

// WP-04 replaces the WP-01 placeholder with the real dashboard route.
// WP-11 adds the /understanding route alongside this entry.
export const router = createBrowserRouter([
  {
    path: '/',
    element: <DashboardRoute />,   // renders DashboardLayout + four Section placeholders
  },
  // /understanding added by WP-11
])
```

`DashboardRoute` is a thin wrapper rendered by this file that:
1. Calls `initFiltersFromUrl()` once on mount (via `useEffect(fn, [])`)
2. Wires `useSignalEffect(() => syncFiltersToUrl())` to keep URL in sync with signals
3. Renders `<DashboardLayout>` containing the four `<Section>` placeholders

---

### `src/components/layout/DashboardLayout.tsx`

```ts
export function DashboardLayout({ children }: { children: React.ReactNode }): JSX.Element
```

- Creates a `QueryClient` instance with `defaultOptions: { queries: { refetchInterval: 30_000, staleTime: 25_000 } }`
- Wraps children in `QueryClientProvider`
- Renders: sticky header `div` (z-50, bg-background, border-b) containing `<FilterBar />` and `<SectionNav />`
- Renders: scrollable main area containing children
- Does NOT call `initFiltersFromUrl()` - that is App.tsx's responsibility

---

### `src/components/layout/SectionNav.tsx`

```ts
export function SectionNav(): JSX.Element
```

- Four `<a>` elements: "Overview" (href="#overview"), "Teams" (#teams), "Reliability" (#reliability), "Billing" (#billing)
- Local `activeSection` signal (`useSignal<SectionId>('overview')`) - private to this component
- On mount (`useEffect`): creates one `IntersectionObserver` for all four section sentinel elements (threshold: 0.4). On intersection, sets `activeSection.value` to the intersecting section id.
- Active `<a>` receives `aria-current="true"` and visual highlight class.
- Click handler: `e.preventDefault(); document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })`

---

### `src/components/layout/Section.tsx`

```ts
export function Section({
  id,
  labelledBy,
  children,
}: {
  id: SectionId
  labelledBy: string     // id of the section's h2 heading element
  children: React.ReactNode
}): JSX.Element
```

- Renders a `<section>` with `id={id}` and `aria-labelledby={labelledBy}`
- Local `mounted` signal (`useSignal(false)`) - private to this component
- On mount (`useEffect`): creates `IntersectionObserver` on the section element (threshold: 0.1). On first intersection: sets `mounted.value = true`; disconnects the observer (never un-mounts content once shown).
- Renders `<SectionSkeleton />` when `!mounted.value`
- Renders `children` when `mounted.value === true`

---

### `src/components/layout/SectionSkeleton.tsx`

```ts
export function SectionSkeleton(): JSX.Element
```

- Four `div` elements with `animate-pulse bg-muted rounded-md`
- Heights approximate the section content: 80px, 200px, 80px, 200px
- No props; purely visual placeholder

---

### `src/components/filters/FilterBar.tsx`

```ts
export function FilterBar(): JSX.Element
```

- Reads `dateRange` and `teamId` signals from `filterSignals.ts`
- Renders `<DateRangePicker />` and `<TeamSelector />` in a horizontal flex row
- Does not write to signals directly - delegates to child components

---

### `src/components/filters/DateRangePicker.tsx`

```ts
export function DateRangePicker(): JSX.Element
```

- shadcn/ui `<Popover>` trigger showing current range as formatted text (e.g. "Jun 1 - Jun 30")
- Inside popover: four preset buttons ("7 days", "30 days", "90 days", "Custom")
- Preset click: computes `from` and `to` from today using `Date`, sets `dateRange.value = { from, to, preset }`
- Custom mode: reveals two shadcn/ui `<Calendar>` pickers (one for `from`, one for `to`); sets `dateRange.value = { from, to, preset: 'custom' }` when both dates are selected
- Reads current selection from `dateRange.value` to highlight active preset button

---

### `src/components/filters/TeamSelector.tsx`

```ts
export function TeamSelector(): JSX.Element
```

- TanStack Query: `useQuery({ queryKey: ['org/teams'], queryFn: () => fetch('/api/org/teams').then(r => r.json()) })`
- Renders shadcn/ui `<Select>` with `<SelectItem value="">All teams</SelectItem>` as first item, followed by one item per team
- On value change: sets `teamId.value = selectedValue || undefined`
- Reads current selection from `teamId.value` to set `Select` `value` prop
- Loading state: `<Skeleton className="h-9 w-36" />` while teams are fetching

---

## 4. Interaction diagram

### Filter change -> URL update -> Query refetch

```
User selects "Last 30 days" in DateRangePicker
  --> DateRangePicker computes from/to dates
  --> dateRange.value = { from: '2026-05-27', to: '2026-06-26', preset: '30d' }
  --> filterQueryParams computed re-evaluates
      --> new FilterQueryParams object (different from prev)
      --> filterQueryParams subscribers notified
  --> useSignalEffect in App.tsx fires
      --> syncFiltersToUrl()
      --> history.replaceState({}, '', '?from=2026-05-27&to=2026-06-26&preset=30d')
  --> Each section's useQuery sees queryKey changed
      (e.g. ['analytics/overview', { from: '2026-05-27', to: '2026-06-26', team_id: undefined }])
      --> TanStack Query triggers refetch
      --> MSW handler generates new mock data for the date range
      --> Section re-renders with updated data
```

### Page load with URL params

```
Browser loads /?from=2026-06-01&to=2026-06-30&preset=custom&team=team_002
  --> React mounts, App.tsx calls initFiltersFromUrl()
  --> initFiltersFromUrl() reads window.location.search
      --> dateRange.value = { from: '2026-06-01', to: '2026-06-30', preset: 'custom' }
      --> teamId.value = 'team_002'
  --> filterQueryParams computed evaluates to { from: '2026-06-01', to: '2026-06-30', team_id: 'team_002' }
  --> DateRangePicker reads dateRange.value, shows "Jun 1 - Jun 30"
  --> TeamSelector reads teamId.value, shows team_002's name in the Select
  --> Section queries use the hydrated filterQueryParams as query key
  --> Data fetched for the correct date range and team
```

### Section lazy mount

```
DashboardLayout renders:
  <Section id="overview" ...>   mounted=false -> <SectionSkeleton />
  <Section id="teams" ...>      mounted=false -> <SectionSkeleton />
  <Section id="reliability" ...> mounted=false -> <SectionSkeleton />
  <Section id="billing" ...>    mounted=false -> <SectionSkeleton />

IntersectionObserver fires for 'overview' (above the fold on load):
  --> Section 'overview': mounted.value = true
  --> observer disconnected for this section
  --> children render (ExecutiveOverview component mounts, triggers its useQuery)

User scrolls to 'teams' section:
  --> IntersectionObserver fires for 'teams' (threshold 0.1 = 10% visible)
  --> Section 'teams': mounted.value = true
  --> children render (TeamBreakdown mounts, triggers its useQuery)
```

### 30-second polling cycle

```
TanStack Query QueryClient (refetchInterval: 30_000, staleTime: 25_000):
  --> Every 30s: marks all active queries as stale and refetches
  --> MSW handlers regenerate data with same Faker seed (same date-range = same data)
  --> Charts re-render with identical data -> no visible change (prevents flicker)
  --> If user has changed the filter between ticks: new seed -> new data visible
```

---

## 5. Acceptance criteria

1. Selecting "Last 7 days" in `DateRangePicker` updates the browser URL to include `from`, `to`, and `preset=7d` params within one render cycle; refreshing the page re-selects "7 days" in the picker automatically.
2. Selecting a team from `TeamSelector` adds `team=<team_id>` to the URL; selecting "All teams" removes the `team` param.
3. Loading the app at `/?from=2026-06-01&to=2026-06-30&preset=custom&team=team_002` displays the correct date range and team pre-selected in both filter controls.
4. On initial load, sections below the fold render `<SectionSkeleton>` (4 `animate-pulse` divs visible); scrolling to a section replaces the skeleton with the section's actual children.
5. The sticky header (containing `FilterBar` and `SectionNav`) remains visible at the top of the viewport when scrolled to the bottom of any section.
6. Clicking "Reliability" in `SectionNav` scrolls the page to the reliability section (`#reliability`); after scroll settles, the "Reliability" nav item has `aria-current="true"`.
7. `filterQueryParams.value` returns the same object reference (===) when `dateRange` and `teamId` have not changed between two reads.
8. `TeamSelector` shows a skeleton while `GET /api/org/teams` is pending; after the query resolves it shows team options.
9. With `teamId = undefined`, `TeamSelector` Select control shows "All teams" as selected value.
10. A TanStack Query refetch at 30s with the same filter params does not trigger a chart re-render (validated by checking that `filterQueryParams.value` reference is stable across the refetch cycle).

---

## 6. Out of scope

- The four dashboard section components (WP-05 through WP-08)
- Chart rendering of any kind
- KPI card component (WP-05)
- The `/understanding` route and its layout (WP-11 adds this route to `src/app/router.tsx`)
- Accessibility audit pass (WP-09)
- Test coverage baseline (WP-10)
- Mobile layout (out of scope for v1 per investigation §4)

---

## Test plan

| File | What it tests |
|------|---------------|
| `src/lib/filters/filterSignals.test.ts` (new) | `initFiltersFromUrl()` parses all four URL params into correct signal values; `syncFiltersToUrl()` writes correct URLSearchParams string; `filterQueryParams` updates when `dateRange` changes; `filterQueryParams` returns same object reference when neither signal changed (stability test) |
| `src/components/layout/Section.test.ts` (new) | Renders `SectionSkeleton` when `mounted=false`; renders children after `IntersectionObserver` callback fires with `isIntersecting=true`; `IntersectionObserver` disconnected after first intersection |
| `src/components/layout/SectionNav.test.ts` (new) | All four anchor links present with correct `href`; `aria-current` applied to active section; click calls `scrollIntoView`; `IntersectionObserver` intersection updates active section |
| `src/components/filters/DateRangePicker.test.ts` (new) | Clicking "30 days" sets `dateRange.value` with correct `from`, `to`, `preset='30d'`; custom selection updates `from` then `to` then sets `preset='custom'`; current selection highlighted in UI |
| `src/components/filters/TeamSelector.test.ts` (new) | "All teams" option sets `teamId.value = undefined`; selecting a team sets `teamId.value` to team id string; shows skeleton while query pending |
| `src/lib/filters/filterSignals.test.ts` (new - integration) | Full round-trip: set signals -> check URL string; set URL string -> call `initFiltersFromUrl()` -> check signal values |
