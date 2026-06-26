# WP-04 Dashboard Shell & Filter Bar - Tasks

---

## T-1: UI component prerequisites (shadcn/ui primitives)

**Context**

WP-01 was supposed to deliver shadcn/ui. It was not installed. This task installs the required Radix UI packages, creates the `cn()` utility, and scaffolds the four shadcn/ui component files (`Popover`, `Calendar`, `Select`, `Skeleton`) that the filter components in T-5 and T-6 depend on. No existing files are modified. All later tasks assume these components exist at their paths.

Read `src/index.css` before starting to understand existing CSS custom properties that `cn()` and the components will reference.

**Requirements**

1. Install the following npm packages: `clsx`, `tailwind-merge`, `class-variance-authority`, `@radix-ui/react-popover`, `@radix-ui/react-select`, `react-day-picker`, `date-fns`, `lucide-react`.
2. Create `src/lib/utils.ts` exporting a `cn` function that merges Tailwind class strings using `clsx` and `tailwind-merge`.
3. Create `src/components/ui/popover.tsx` exporting `Popover`, `PopoverTrigger`, `PopoverContent` built on `@radix-ui/react-popover`.
4. Create `src/components/ui/calendar.tsx` exporting `Calendar` built on `react-day-picker` v9 (`DayPicker` component, `mode="single"`).
5. Create `src/components/ui/select.tsx` exporting `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem` built on `@radix-ui/react-select`.
6. Create `src/components/ui/skeleton.tsx` exporting `Skeleton` as a `div` with `animate-pulse bg-muted rounded-md`.
7. Create `src/components/ui/button.tsx` exporting `Button` with `variant` prop (`"default" | "outline" | "ghost"`) used by Calendar navigation.
8. Each component must use `cn()` from `src/lib/utils.ts` for className merging.
9. Run `npx tsc --noEmit` and fix all type errors introduced by this task.
10. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- Radix UI primitives are the underlying engine; the component files are thin wrappers styled with Tailwind - consistent with how shadcn/ui distributes its components.
- `react-day-picker` v9 exports `DayPicker` (not `Calendar`) as the main component. The wrapper renames it to `Calendar` at the export boundary.
- `date-fns` v3 is the peer dependency for `react-day-picker` v9 - install both together.
- `lucide-react` is required for Calendar navigation chevron icons (`ChevronLeft`, `ChevronRight`).
- No shadcn/ui CLI (`npx shadcn@latest add`) - install packages manually and write component files directly to avoid interactive CLI prompts.
- `tailwind.config.js` already has `content` paths covering `src/**/*.{ts,tsx}` - no changes needed there.

**Design**

```ts
// src/lib/utils.ts  (new)
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string

// src/components/ui/skeleton.tsx  (new)
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): JSX.Element
// renders: <div className={cn('animate-pulse bg-muted rounded-md', className)} {...props} />

// src/components/ui/button.tsx  (new)
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost'
}
export function Button({ variant = 'default', className, ...props }: ButtonProps): JSX.Element

// src/components/ui/popover.tsx  (new)
// Re-exports: Popover, PopoverTrigger from @radix-ui/react-popover
// Creates: PopoverContent wrapping Radix PopoverContent with positioning + animation classes

// src/components/ui/calendar.tsx  (new)
// Wraps DayPicker from react-day-picker with Tailwind styling
// Props: subset of DayPickerProps - mode="single", selected, onSelect, disabled

// src/components/ui/select.tsx  (new)
// Re-exports: Select, SelectValue from @radix-ui/react-select
// Creates: SelectTrigger, SelectContent, SelectItem with Tailwind styling
```

**Acceptance criteria**

1. `import { cn } from '../lib/utils'` resolves without error in any `src/` file; `cn('a', false, 'b')` returns `'a b'`.
2. `<Skeleton className="h-9 w-36" />` renders a `div` with both `animate-pulse` and `h-9 w-36` in its class list.
3. `<Popover><PopoverTrigger><button>Open</button></PopoverTrigger><PopoverContent>Content</PopoverContent></Popover>` renders without throwing.
4. `<Calendar mode="single" />` renders without throwing.
5. `<Select><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="a">A</SelectItem></SelectContent></Select>` renders without throwing.
6. `npx tsc --noEmit` reports zero errors after this task.

**Test Plan**

- `src/lib/utils.test.ts` (new)
  - Scenario: `cn('a', 'b')` returns `'a b'`.
  - Scenario: `cn('px-2', 'px-4')` returns `'px-4'` (tailwind-merge deduplication).
  - Scenario: `cn('a', false && 'b', 'c')` returns `'a c'` (clsx falsy filtering).

- `src/components/ui/skeleton.test.tsx` (new)
  - Scenario: renders a div with `animate-pulse` class.
  - Scenario: additional className prop is merged onto the element.

**Files**

- `src/lib/utils.ts` (new) - `cn()` class-merging utility
- `src/components/ui/skeleton.tsx` (new) - animate-pulse placeholder element
- `src/components/ui/button.tsx` (new) - basic button with variant prop
- `src/components/ui/popover.tsx` (new) - Radix-based popover
- `src/components/ui/calendar.tsx` (new) - react-day-picker wrapper
- `src/components/ui/select.tsx` (new) - Radix-based select

---

## T-2: Filter signals module

**Context**

Implements SPEC §3 `src/lib/filters/filterSignals.ts`. This module is the single source of truth for all filter state in the app. It owns two writable signals (`dateRange`, `teamId`) and one computed signal (`filterQueryParams`) that every section query uses as part of its TanStack Query key. All other WP-04 components read from or write to this module. It must be implemented before any filter UI component (T-5, T-6) or URL wiring (T-9).

Read `src/types/api.ts` before starting - `FilterParams` there mirrors the shape of `FilterQueryParams` exported here.

**Requirements**

1. Create `src/lib/filters/filterSignals.ts` exporting the types `DatePreset`, `DateRange`, `FilterQueryParams`, `SectionId` as defined in SPEC §2.
2. Export module-level `dateRange: Signal<DateRange>` initialized to `{ from: <30 days ago>, to: <today>, preset: '30d' }` using plain `Date` arithmetic (no library).
3. Export module-level `teamId: Signal<string | undefined>` initialized to `undefined`.
4. Export module-level `filterQueryParams: ReadonlySignal<FilterQueryParams>` using `computed()` from `@preact/signals-react`. The computed function must return the previous object reference when `from`, `to`, and `team_id` are all structurally equal to the last computed value - follow the pseudo-implementation in SPEC §3 design note exactly.
5. Export `initFiltersFromUrl(): void` that reads `window.location.search`, parses `from`, `to`, `preset`, and `team` params, and sets `dateRange.value` and `teamId.value`. If `from`/`to` are missing, leave signals at their defaults. `preset` defaults to `'custom'` when `from`/`to` are present but `preset` is absent.
6. Export `syncFiltersToUrl(): void` that serializes `dateRange.value` (`from`, `to`, `preset`) and `teamId.value` (`team` param, omitted when `undefined`) into a `URLSearchParams` string and calls `history.replaceState({}, '', '?' + params.toString())`.
7. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- Use `signal` and `computed` from `@preact/signals-react` (module-level, not inside a component).
- The stability trick for `filterQueryParams` uses a module-level `let _prev` variable - not a React ref. This is correct because the module is a singleton loaded once per app session.
- Date arithmetic for the default `dateRange` value: `to` = today in `YYYY-MM-DD` format, `from` = 30 days before today. Use `new Date()` then `.toISOString().slice(0, 10)`.
- `initFiltersFromUrl` must validate that `from` and `to` match `YYYY-MM-DD` format before setting signals; silently ignore malformed params.
- `syncFiltersToUrl` uses `history.replaceState` (not `pushState`) so that filter changes do not create browser history entries.

**Design**

```ts
// src/lib/filters/filterSignals.ts  (new)

import { signal, computed } from '@preact/signals-react'
import type { Signal, ReadonlySignal } from '@preact/signals-react'

export type DatePreset = '7d' | '30d' | '90d' | 'custom'

export interface DateRange {
  from: string   // YYYY-MM-DD
  to: string     // YYYY-MM-DD
  preset: DatePreset
}

export interface FilterQueryParams {
  from: string
  to: string
  team_id: string | undefined
}

export type SectionId = 'overview' | 'teams' | 'reliability' | 'billing'

// Module-level singleton signals
export const dateRange: Signal<DateRange>
export const teamId: Signal<string | undefined>
export const filterQueryParams: ReadonlySignal<FilterQueryParams>

export function initFiltersFromUrl(): void
export function syncFiltersToUrl(): void
```

**Acceptance criteria**

1. After `initFiltersFromUrl()` with `window.location.search = '?from=2026-06-01&to=2026-06-26&preset=custom&team=team_002'`, `dateRange.value` equals `{ from: '2026-06-01', to: '2026-06-26', preset: 'custom' }` and `teamId.value` equals `'team_002'`.
2. After `initFiltersFromUrl()` with no query string, signals retain their initial values (no crash, no mutation).
3. `filterQueryParams.value` after module load returns `{ from: <30d ago>, to: <today>, team_id: undefined }`.
4. `filterQueryParams.value === filterQueryParams.value` returns `true` when neither `dateRange` nor `teamId` has changed between reads (same object reference).
5. After mutating `dateRange.value` to new dates, `filterQueryParams.value` returns a new object reference with the updated `from`/`to`.
6. `syncFiltersToUrl()` when `dateRange.value = { from: '2026-06-01', to: '2026-06-26', preset: 'custom' }` and `teamId.value = 'team_002'` calls `history.replaceState` with a URL containing all four params.
7. `syncFiltersToUrl()` when `teamId.value = undefined` calls `history.replaceState` with a URL that does NOT contain a `team` param.
8. `initFiltersFromUrl()` with a malformed date param (`?from=not-a-date`) leaves `dateRange.value` at its default - no crash.

**Test Plan**

- `src/lib/filters/filterSignals.test.ts` (new)
  - Scenario: `initFiltersFromUrl()` parses all four URL params correctly.
  - Scenario: `initFiltersFromUrl()` with no query string leaves signals at defaults.
  - Scenario: `filterQueryParams` returns same reference when signals unchanged.
  - Scenario: `filterQueryParams` returns new reference after `dateRange.value` mutation.
  - Scenario: `syncFiltersToUrl()` includes all params when `teamId` is set.
  - Scenario: `syncFiltersToUrl()` omits `team` param when `teamId = undefined`.
  - Scenario: `initFiltersFromUrl()` with malformed date param does not throw.

**Files**

- `src/lib/filters/filterSignals.ts` (new) - module-level filter signals, computed, and URL sync helpers

---

## T-3: Section and SectionSkeleton components

**Context**

Implements SPEC §3 `Section.tsx` and `SectionSkeleton.tsx`. `Section` provides lazy-mount semantics: it renders `<SectionSkeleton />` until the section scrolls into the viewport, at which point it mounts its children and disconnects the observer. This prevents below-the-fold sections from triggering their TanStack Query `useQuery` calls until the user scrolls to them. `SectionSkeleton` is only used by `Section` and has no other consumers - the two are implemented together as one task.

There are no existing layout components to follow as a pattern. Follow the component definition style in ARCHITECTURE.md §4.3 (`function ComponentName(`), named exports, signal-based local state with `useSignal`.

**Requirements**

1. Create `src/components/layout/SectionSkeleton.tsx` exporting `SectionSkeleton()` as a `function` declaration (not arrow function).
2. `SectionSkeleton` must render four `div` elements with `animate-pulse bg-muted rounded-md` classes; heights must be `80px`, `200px`, `80px`, `200px` in order.
3. `SectionSkeleton` must accept no props.
4. Create `src/components/layout/Section.tsx` exporting `Section()` as a `function` declaration.
5. `Section` must accept props `{ id: SectionId, labelledBy: string, children: React.ReactNode }` where `SectionId` is imported from `src/lib/filters/filterSignals.ts`.
6. `Section` must render a `<section>` element with `id={id}` and `aria-labelledby={labelledBy}`.
7. `Section` must have a local `mounted` signal (`useSignal(false)`) that is never exposed outside the component.
8. On mount (`useEffect(fn, [])`), `Section` must create an `IntersectionObserver` with `threshold: 0.1` on the section's own DOM element. On the first intersection where `entry.isIntersecting` is `true`, it must set `mounted.value = true` and call `observer.disconnect()`.
9. When `mounted.value === false`, `Section` must render `<SectionSkeleton />` inside the `<section>`.
10. When `mounted.value === true`, `Section` must render `children` inside the `<section>`.
11. `Section` must use a `useRef<HTMLElement>(null)` to hold the `<section>` DOM node (required for the `IntersectionObserver` target).
12. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- `IntersectionObserver` is a browser API not available in jsdom by default - tests must install a mock before `render`. Use `vi.stubGlobal('IntersectionObserver', MockIO)` in each test that needs it. The mock must call the callback synchronously with `isIntersecting: true` when the test wants to simulate an intersection.
- Once `mounted.value = true`, the observer is disconnected and children render permanently. Children never un-mount after first render.
- `SectionSkeleton` has no dynamic content - its test just verifies the four divs render with `animate-pulse`.
- Do NOT use `React.memo` - ARCHITECTURE.md §4.3 forbids it.

**Design**

```tsx
// src/components/layout/SectionSkeleton.tsx  (new)
export function SectionSkeleton(): JSX.Element
// renders four divs: animate-pulse bg-muted rounded-md, heights 80/200/80/200 px

// src/components/layout/Section.tsx  (new)
import type { SectionId } from '../../lib/filters/filterSignals'

interface SectionProps {
  id: SectionId
  labelledBy: string
  children: React.ReactNode
}

export function Section({ id, labelledBy, children }: SectionProps): JSX.Element
// local: const ref = useRef<HTMLElement>(null)
// local: const mounted = useSignal(false)
// useEffect: IntersectionObserver on ref.current, threshold 0.1
//   on isIntersecting: mounted.value = true; observer.disconnect()
// renders: <section id={id} aria-labelledby={labelledBy} ref={ref}>
//   {mounted.value ? children : <SectionSkeleton />}
// </section>
```

**Acceptance criteria**

1. Rendering `<Section id="overview" labelledBy="overview-heading">content</Section>` without triggering IntersectionObserver shows a `div` with `animate-pulse` in the DOM and no `content` text.
2. After the `IntersectionObserver` callback fires with `isIntersecting: true`, the DOM contains `content` text and no `animate-pulse` div.
3. After intersection, `observer.disconnect` was called exactly once.
4. The rendered `<section>` element has `id="overview"` and `aria-labelledby="overview-heading"`.
5. Rendering `<SectionSkeleton />` produces exactly 4 child divs each with `animate-pulse` in their class.

**Test Plan**

- `src/components/layout/SectionSkeleton.test.tsx` (new)
  - Scenario: renders exactly 4 divs all containing `animate-pulse`.
  - Scenario: first and third div have inline height 80px; second and fourth have 200px.

- `src/components/layout/Section.test.tsx` (new)
  - Scenario: initial render shows `SectionSkeleton` (animate-pulse present, children absent).
  - Scenario: after IntersectionObserver fires with `isIntersecting: true`, children render and skeleton is gone.
  - Scenario: `observer.disconnect()` called exactly once after intersection.
  - Scenario: section element has correct `id` and `aria-labelledby` attributes.
  - Scenario: IntersectionObserver fires with `isIntersecting: false` - children do NOT mount (skeleton stays).

**Files**

- `src/components/layout/SectionSkeleton.tsx` (new) - four animate-pulse placeholder divs
- `src/components/layout/Section.tsx` (new) - lazy-mount section wrapper using IntersectionObserver
- `src/components/layout/SectionSkeleton.test.tsx` (new) - skeleton rendering tests
- `src/components/layout/Section.test.tsx` (new) - lazy mount and accessibility tests

---

## T-4: SectionNav component

**Context**

Implements SPEC §3 `SectionNav.tsx`. The nav tracks which section is currently in the viewport using a single `IntersectionObserver` across all four section sentinel elements. The active section is highlighted with `aria-current="true"` and a visual class. Clicking a nav link scrolls smoothly to the target section without changing the URL (preventDefault).

There are no existing nav components to follow as a pattern. Follow ARCHITECTURE.md §4.3 for component definition style. This component has no dependency on T-1 or T-2 and can be implemented in parallel with them.

**Requirements**

1. Create `src/components/layout/SectionNav.tsx` exporting `SectionNav()` as a `function` declaration.
2. `SectionNav` must render a `<nav>` element containing exactly four `<a>` elements with `href` values `#overview`, `#teams`, `#reliability`, `#billing` and text content `Overview`, `Teams`, `Reliability`, `Billing` respectively.
3. `SectionNav` must have a local `activeSection` signal (`useSignal<SectionId>('overview')`).
4. On mount (`useEffect(fn, [])`), `SectionNav` must create a single `IntersectionObserver` with `threshold: 0.4` that observes the four section elements by querying `document.getElementById('overview')` etc. The observer callback must set `activeSection.value` to the `id` of the intersecting element when `entry.isIntersecting` is `true`.
5. The `<a>` whose `href` fragment matches `activeSection.value` must have `aria-current="true"` and a visible active class (e.g. `text-primary font-medium`).
6. All other `<a>` elements must NOT have `aria-current` set.
7. Each `<a>` click handler must call `e.preventDefault()` and then `document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })`.
8. The `useEffect` cleanup must call `observer.disconnect()`.
9. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- `IntersectionObserver` must be mocked in tests using `vi.stubGlobal` - same pattern as T-3 tests.
- `document.getElementById` returns `null` in jsdom for elements not rendered in the test - `?.observe()` guards handle this gracefully.
- `scrollIntoView` is not implemented in jsdom - mock it with `vi.fn()` on the element before asserting it was called.
- The observer fires when the section passes the 0.4 threshold. Only `isIntersecting: true` entries update the active section; entries where `isIntersecting: false` are ignored.
- Do not use `window.addEventListener('scroll', ...)` - IntersectionObserver is the only mechanism.

**Design**

```tsx
// src/components/layout/SectionNav.tsx  (new)
import type { SectionId } from '../../lib/filters/filterSignals'

const SECTIONS: Array<{ id: SectionId; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'teams', label: 'Teams' },
  { id: 'reliability', label: 'Reliability' },
  { id: 'billing', label: 'Billing' },
]

export function SectionNav(): JSX.Element
// local: const activeSection = useSignal<SectionId>('overview')
// useEffect: IntersectionObserver, threshold 0.4
//   observes document.getElementById(id) for each section in SECTIONS
//   on isIntersecting: activeSection.value = entry.target.id as SectionId
//   cleanup: observer.disconnect()
// renders: <nav>
//   {SECTIONS.map(s => (
//     <a href={`#${s.id}`}
//        aria-current={activeSection.value === s.id ? 'true' : undefined}
//        onClick={e => { e.preventDefault(); document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth' }) }}>
//       {s.label}
//     </a>
//   ))}
// </nav>
```

**Acceptance criteria**

1. `<SectionNav />` renders a `<nav>` with exactly four `<a>` children; their text content is `Overview`, `Teams`, `Reliability`, `Billing`.
2. On initial render, the `Overview` link has `aria-current="true"` and the other three do not have `aria-current`.
3. After the IntersectionObserver callback fires with `target.id = 'reliability'` and `isIntersecting: true`, the `Reliability` link has `aria-current="true"` and `Overview` does not.
4. Clicking the `Teams` link calls `scrollIntoView({ behavior: 'smooth' })` on the `#teams` element and does not change `window.location.href`.
5. After unmount, `observer.disconnect()` has been called.

**Test Plan**

- `src/components/layout/SectionNav.test.tsx` (new)
  - Scenario: all four anchors render with correct `href` and text.
  - Scenario: `Overview` link has `aria-current="true"` on initial render.
  - Scenario: IntersectionObserver intersection on `reliability` sets active to `Reliability` link.
  - Scenario: clicking a link calls `scrollIntoView` and does not navigate.
  - Scenario: IntersectionObserver entry with `isIntersecting: false` does not change active section.

**Files**

- `src/components/layout/SectionNav.tsx` (new) - horizontal section navigation with active highlight and scroll-to behavior
- `src/components/layout/SectionNav.test.tsx` (new) - navigation rendering and interaction tests

---

## T-5: DateRangePicker component

**Context**

Implements SPEC §3 `DateRangePicker.tsx`. The picker displays the current date range in a trigger button and opens a popover containing four preset buttons plus a custom date range picker using shadcn/ui Calendar. It writes to the `dateRange` signal from `src/lib/filters/filterSignals.ts`. Depends on T-1 (shadcn/ui Popover and Calendar components) and T-2 (filter signals).

Read `src/lib/filters/filterSignals.ts` (created in T-2) and `src/components/ui/popover.tsx` and `src/components/ui/calendar.tsx` (created in T-1) before implementing.

**Requirements**

1. Create `src/components/filters/DateRangePicker.tsx` exporting `DateRangePicker()` as a `function` declaration.
2. `DateRangePicker` must render a shadcn/ui `Popover` whose trigger shows the current date range as formatted text: `"Jun 1 - Jun 30"` format using `date-fns` `format` with pattern `"MMM d"`.
3. Inside the popover content, render four preset buttons with labels `"7 days"`, `"30 days"`, `"90 days"`, `"Custom"`.
4. Clicking `"7 days"` must set `dateRange.value = { from: <today minus 6 days>, to: <today>, preset: '7d' }`. Clicking `"30 days"` must use 29 days back (so the range is 30 days inclusive). Clicking `"90 days"` must use 89 days back.
5. The active preset button (matching `dateRange.value.preset`) must have a visually distinct active state (e.g. `bg-primary text-primary-foreground`); inactive preset buttons must not have this class.
6. Clicking `"Custom"` must set `dateRange.value.preset = 'custom'` and reveal two shadcn/ui `Calendar` components (one for `from`, one for `to`).
7. In custom mode, selecting a date in the `from` Calendar must update `dateRange.value.from`; selecting a date in the `to` Calendar must update `dateRange.value.to`. Both calendars must remain visible until the user closes the popover.
8. All date arithmetic must use plain `Date` objects (no date-fns arithmetic) - only `date-fns` `format` is used for display.
9. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- Use `dateRange.value` (read from signal) directly in the component - the Babel signals transform injects `useSignals()` automatically, so no manual `useSignal` is needed for reading global signals.
- When the user clicks a preset button, compute `from` and `to` in the click handler using `new Date()` then `.toISOString().slice(0, 10)` for the string format.
- Custom Calendar `onSelect` receives a `Date | undefined` from react-day-picker. Convert to ISO date string before writing to signal. Guard against `undefined` (user may deselect).
- Do not close the popover after selecting custom dates - the user closes it manually.
- The local popover open state can use `useSignal(false)`.

**Design**

```tsx
// src/components/filters/DateRangePicker.tsx  (new)
import { dateRange } from '../../lib/filters/filterSignals'
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover'
import { Calendar } from '../ui/calendar'
import { format } from 'date-fns'

// Hoisted constant - no component scope variables captured
const PRESETS = [
  { label: '7 days', preset: '7d' as const, daysBack: 6 },
  { label: '30 days', preset: '30d' as const, daysBack: 29 },
  { label: '90 days', preset: '90d' as const, daysBack: 89 },
  { label: 'Custom', preset: 'custom' as const, daysBack: 0 },
] as const

export function DateRangePicker(): JSX.Element
// local: const open = useSignal(false)
// trigger: format(new Date(dateRange.value.from), 'MMM d') + ' - ' + format(new Date(dateRange.value.to), 'MMM d')
// preset buttons: map PRESETS, onClick writes to dateRange.value
// custom mode: two Calendar pickers when dateRange.value.preset === 'custom'
```

**Acceptance criteria**

1. `<DateRangePicker />` renders a button showing the formatted date range from `dateRange.value` (e.g. `"Jun 1 - Jun 26"`).
2. Clicking the `"30 days"` preset button sets `dateRange.value.preset` to `'30d'` and computes `from` = 29 days before `to`.
3. After clicking `"30 days"`, the `"30 days"` button has the active class and the `"7 days"` button does not.
4. When `dateRange.value.preset === 'custom'`, two Calendar elements are visible inside the popover.
5. Selecting a date in the `from` Calendar updates `dateRange.value.from` to the selected date in `YYYY-MM-DD` format.
6. When preset is `'7d'`, `'30d'`, or `'90d'`, Calendar pickers are not rendered in the DOM.

**Test Plan**

- `src/components/filters/DateRangePicker.test.tsx` (new)
  - Scenario: trigger button shows formatted date range from signal.
  - Scenario: clicking `"30 days"` sets `dateRange.value` with correct preset and date range.
  - Scenario: active preset button has active class; others do not.
  - Scenario: clicking `"Custom"` shows Calendar pickers.
  - Scenario: Calendar `from` date selection updates `dateRange.value.from`.
  - Scenario: Calendar pickers absent when non-custom preset is active.

**Files**

- `src/components/filters/DateRangePicker.tsx` (new) - preset and custom date range picker writing to `dateRange` signal

---

## T-6: TeamSelector component

**Context**

Implements SPEC §3 `TeamSelector.tsx`. The selector fetches the team list via TanStack Query, renders a shadcn/ui Select with "All teams" as the first option, and writes the selected `team_id` to the `teamId` signal. A Skeleton placeholder shows while the query is loading. Depends on T-1 (shadcn/ui Select and Skeleton) and T-2 (filter signals).

Read `src/lib/filters/filterSignals.ts` (T-2), `src/types/api.ts` (`Team` type), `src/components/ui/select.tsx`, and `src/components/ui/skeleton.tsx` (T-1) before implementing. Also read `src/lib/mock/handlers.ts` to understand the existing MSW handler for `GET /api/org/teams`.

**Requirements**

1. Create `src/components/filters/TeamSelector.tsx` exporting `TeamSelector()` as a `function` declaration.
2. `TeamSelector` must use `useQuery` from `@tanstack/react-query` with `queryKey: ['org/teams']` and `queryFn` that calls `fetch('/api/org/teams')` then `.then(r => r.json())` typed as `Promise<Team[]>`.
3. While the query is loading (`isLoading === true`), `TeamSelector` must render `<Skeleton className="h-9 w-36" />` and nothing else.
4. When the query has data, `TeamSelector` must render a shadcn/ui `<Select>` with `value={teamId.value ?? ''}` and `onValueChange` that sets `teamId.value = value || undefined`.
5. The Select must include `<SelectItem value="">All teams</SelectItem>` as its first item.
6. After the first item, the Select must include one `<SelectItem value={team.id}>{team.name}</SelectItem>` for each team in the query result, in order.
7. When `teamId.value` is `undefined`, the Select `value` prop must be `''` (empty string) causing "All teams" to appear selected.
8. `TeamSelector` must be wrapped in a `QueryClientProvider` in its tests (TanStack Query requires the provider).
9. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- `TeamSelector` reads `teamId.value` from the module-level signal - the Babel signals transform injects `useSignals()` automatically.
- In tests, use `createWrapper` helper that wraps the component in a `QueryClientProvider` with a fresh `QueryClient` per test (this prevents test pollution). Follow the pattern: `const wrapper = ({ children }) => <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>`.
- Mock `fetch` in tests using `vi.stubGlobal('fetch', vi.fn())` returning a resolved `Response` with JSON body.
- The empty string `''` as Select value is the conventional shadcn/ui pattern for "no selection" - the SelectItem with `value=""` matches it.
- `queryKey: ['org/teams']` is stable (no filter params) because the team list is org-wide and does not change with date range.

**Design**

```tsx
// src/components/filters/TeamSelector.tsx  (new)
import { useQuery } from '@tanstack/react-query'
import { teamId } from '../../lib/filters/filterSignals'
import type { Team } from '../../types/api'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select'
import { Skeleton } from '../ui/skeleton'

export function TeamSelector(): JSX.Element
// useQuery: queryKey ['org/teams'], queryFn fetch('/api/org/teams').then(r => r.json()) as Team[]
// if isLoading: return <Skeleton className="h-9 w-36" />
// else: return <Select value={teamId.value ?? ''} onValueChange={v => teamId.value = v || undefined}>
//   <SelectTrigger><SelectValue /></SelectTrigger>
//   <SelectContent>
//     <SelectItem value="">All teams</SelectItem>
//     {data?.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
//   </SelectContent>
// </Select>
```

**Acceptance criteria**

1. While the query is pending, exactly one element with `animate-pulse` class is rendered and no Select is present.
2. After the query resolves with `[{ id: 'team_001', name: 'Engineering' }]`, a Select is present with "All teams" and "Engineering" as options.
3. Selecting "Engineering" sets `teamId.value = 'team_001'`.
4. Selecting "All teams" (value `""`) sets `teamId.value = undefined`.
5. When `teamId.value = undefined`, the Select's displayed value matches "All teams".

**Test Plan**

- `src/components/filters/TeamSelector.test.tsx` (new)
  - Scenario: renders Skeleton while query is loading.
  - Scenario: renders Select with "All teams" and team options after query resolves.
  - Scenario: selecting a team sets `teamId.value` to the team's id.
  - Scenario: selecting "All teams" sets `teamId.value` to `undefined`.
  - Scenario: when `teamId.value = undefined`, Select shows "All teams" as selected.

**Files**

- `src/components/filters/TeamSelector.tsx` (new) - team filter select reading from TanStack Query and writing to `teamId` signal

---

## T-7: FilterBar component

**Context**

Implements SPEC §3 `FilterBar.tsx`. This is a thin composition component that renders `DateRangePicker` and `TeamSelector` side by side in a horizontal flex row. It reads from filter signals only via its children - it has no direct signal reads of its own. Depends on T-5 and T-6. This task is Small because it contains no logic - only layout composition.

Read `src/components/filters/DateRangePicker.tsx` (T-5) and `src/components/filters/TeamSelector.tsx` (T-6) before implementing.

**Requirements**

1. Create `src/components/filters/FilterBar.tsx` exporting `FilterBar()` as a `function` declaration.
2. `FilterBar` must render a `<div>` with `flex items-center gap-3` classes containing `<DateRangePicker />` and `<TeamSelector />` as children, in that order.
3. `FilterBar` must accept no props.
4. `FilterBar` must not read from any signal directly - all signal interaction belongs to its children.
5. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- FilterBar tests require both `QueryClientProvider` (for TeamSelector) and the signals to be importable. Since the signals module is side-effect-free at import time, no special mocking is needed for signals in FilterBar's test.
- Wrap test render in a `QueryClientProvider` with a fresh `QueryClient` (same pattern as T-6 tests).

**Design**

```tsx
// src/components/filters/FilterBar.tsx  (new)
import { DateRangePicker } from './DateRangePicker'
import { TeamSelector } from './TeamSelector'

export function FilterBar(): JSX.Element
// renders: <div className="flex items-center gap-3">
//   <DateRangePicker />
//   <TeamSelector />
// </div>
```

**Acceptance criteria**

1. `<FilterBar />` (wrapped in QueryClientProvider) renders a container div containing both a DateRangePicker trigger element and a TeamSelector skeleton or select.
2. The container div has `flex` in its class list.
3. DateRangePicker appears before TeamSelector in the DOM order.

**Test Plan**

- `src/components/filters/FilterBar.test.tsx` (new)
  - Scenario: renders without error when wrapped in QueryClientProvider.
  - Scenario: container has `flex` class.
  - Scenario: DateRangePicker content (date text) appears before TeamSelector content (skeleton) in DOM.

**Files**

- `src/components/filters/FilterBar.tsx` (new) - horizontal filter row composing DateRangePicker and TeamSelector

---

## T-8: DashboardLayout component

**Context**

Implements SPEC §3 `DashboardLayout.tsx`. This is the top-level layout shell: it creates the TanStack Query `QueryClient`, wraps the page in `QueryClientProvider`, renders the sticky header (containing `FilterBar` and `SectionNav`), and renders a scrollable main area for children. Depends on T-3 (Section/SectionSkeleton), T-4 (SectionNav), and T-7 (FilterBar).

Read `src/components/layout/SectionNav.tsx` (T-4), `src/components/filters/FilterBar.tsx` (T-7) before implementing.

**Requirements**

1. Create `src/components/layout/DashboardLayout.tsx` exporting `DashboardLayout({ children })` as a `function` declaration accepting `{ children: React.ReactNode }`.
2. `DashboardLayout` must create one `QueryClient` instance with `defaultOptions: { queries: { refetchInterval: 30_000, staleTime: 25_000 } }` using `useMemo(fn, [])` so it is stable across renders.
3. `DashboardLayout` must wrap all rendered content in `<QueryClientProvider client={queryClient}>`.
4. `DashboardLayout` must render a sticky header `<div>` with classes `sticky top-0 z-50 bg-background border-b` containing `<FilterBar />` and `<SectionNav />`.
5. `DashboardLayout` must render a `<main>` element after the sticky header containing `{children}`.
6. `DashboardLayout` must NOT call `initFiltersFromUrl()` - that is `DashboardRoute`'s responsibility (T-9).
7. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- `useMemo(fn, [])` for `QueryClient` creation: creating it inside the component body without memoization would create a new client on every render, flushing the query cache. `useMemo(fn, [])` runs once per mount - the right semantics.
- Do not use `new QueryClient()` at module level (outside the component) - that would create a single shared client across all test renders, causing test pollution.
- Tests for this component must mock `FilterBar` and `SectionNav` to avoid needing their full dependency trees. Use `vi.mock('../../components/filters/FilterBar', ...)` returning a simple div.

**Design**

```tsx
// src/components/layout/DashboardLayout.tsx  (new)
import { useMemo } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FilterBar } from '../filters/FilterBar'
import { SectionNav } from './SectionNav'

export function DashboardLayout({ children }: { children: React.ReactNode }): JSX.Element
// const queryClient = useMemo(() => new QueryClient({ defaultOptions: { queries: { refetchInterval: 30_000, staleTime: 25_000 } } }), [])
// return (
//   <QueryClientProvider client={queryClient}>
//     <div className="sticky top-0 z-50 bg-background border-b">
//       <FilterBar />
//       <SectionNav />
//     </div>
//     <main>{children}</main>
//   </QueryClientProvider>
// )
```

**Acceptance criteria**

1. `<DashboardLayout><p>content</p></DashboardLayout>` renders without error; "content" appears inside a `<main>` element.
2. A `div` with `sticky` in its class list exists in the DOM and precedes the `<main>`.
3. The sticky header contains both `FilterBar` and `SectionNav` (or their mocked equivalents) in that order.
4. Rendering `<DashboardLayout>` twice in separate tests does not share query cache state (each render gets a fresh `QueryClient`).

**Test Plan**

- `src/components/layout/DashboardLayout.test.tsx` (new)
  - Scenario: children render inside `<main>`.
  - Scenario: sticky header div precedes `<main>` in the DOM.
  - Scenario: header contains FilterBar and SectionNav (mocked).
  - Scenario: two separate renders each produce an independent QueryClient (verify by confirming each render wraps in a separate Provider).

**Files**

- `src/components/layout/DashboardLayout.tsx` (new) - QueryClient provider + sticky header + main content shell

---

## T-9: Router wiring (replace WP-03 scaffold with real dashboard)

**Context**

Implements SPEC §3 `src/app/router.tsx` - the real dashboard route. This task replaces the WP-03 `ScaffoldPage` (RunsChart + CostChart + counter) with the production dashboard structure: a `DashboardRoute` that initializes filter signals from URL params on mount, keeps the URL in sync via `useSignalEffect`, and renders `DashboardLayout` with four `Section` placeholders. Depends on T-2 (filterSignals) and T-8 (DashboardLayout).

Read the current `src/app/router.tsx` in full before modifying it - understand what is being replaced. Also read `src/lib/filters/filterSignals.ts` (T-2) and `src/components/layout/DashboardLayout.tsx` (T-8).

The four sections are rendered as placeholders - each `Section` contains only an `<h2>` heading and a `<p>` describing what WP-05 through WP-08 will fill in. No chart or data components are added here.

**Requirements**

1. Rewrite `src/app/router.tsx` to export `router` as the result of `createBrowserRouter([{ path: '/', element: <DashboardRoute /> }])`. The `/understanding` route comment from the SPEC must be present as a code comment.
2. Define `DashboardRoute()` as a `function` declaration in `src/app/router.tsx`.
3. `DashboardRoute` must call `initFiltersFromUrl()` exactly once on mount using `useEffect(fn, [])`.
4. `DashboardRoute` must call `useSignalEffect(() => { syncFiltersToUrl() })` to keep the URL in sync with signal changes.
5. `DashboardRoute` must render `<DashboardLayout>` containing four `<Section>` elements with `id` values `'overview'`, `'teams'`, `'reliability'`, `'billing'` in that order.
6. Each `Section` must have a `labelledBy` prop matching the `id` of its `<h2>` child (e.g. `labelledBy="overview-heading"` with `<h2 id="overview-heading">Overview</h2>`).
7. Each `Section` must contain a placeholder `<h2>` and `<p>` - no chart or KPI components. The `<p>` must say "Content coming in WP-0N" where N matches the WP number (WP-05 for overview, WP-06 for teams, WP-07 for reliability, WP-08 for billing).
8. All imports from the previous WP-03 scaffold (`RunsChart`, `CostChart`, `Visualization`, chart axes) must be removed. The `count` module-level signal must also be removed.
9. Run `npx tsc --noEmit` and fix all type errors.
10. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- `useSignalEffect` from `@preact/signals-react` - not `useEffect`. `useSignalEffect` automatically tracks signal reads inside its callback, so `syncFiltersToUrl()` (which reads `dateRange.value` and `teamId.value`) will re-run whenever those signals change.
- `initFiltersFromUrl()` only reads `window.location.search` which is a side effect that must not run on every render. Wrapping it in `useEffect(fn, [])` ensures it runs once on mount.
- The WP-03 `ScaffoldPage` and its chart components (`RunsChart`, `CostChart`, the module-level signal `count`) are deleted entirely - this file is a full rewrite.
- The wildcard route (`path: '*'`) from WP-03 is replaced with `path: '/'` - the new route is exact.

**Design**

```tsx
// src/app/router.tsx  (modified - full rewrite)
import { useEffect } from 'react'
import { useSignalEffect } from '@preact/signals-react'
import { createBrowserRouter } from 'react-router-dom'
import { initFiltersFromUrl, syncFiltersToUrl } from '../lib/filters/filterSignals'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { Section } from '../components/layout/Section'

function DashboardRoute(): JSX.Element {
  useEffect(() => { initFiltersFromUrl() }, [])
  useSignalEffect(() => { syncFiltersToUrl() })
  // renders DashboardLayout + 4 Section placeholders
}

// WP-11 adds the /understanding route alongside this entry.
export const router = createBrowserRouter([
  { path: '/', element: <DashboardRoute /> },
])
```

**Acceptance criteria**

1. `npm run dev` starts without errors; navigating to `http://localhost:5173/` renders the sticky header with FilterBar and SectionNav, and four sections with their placeholder headings.
2. On page load at `/?preset=7d&from=2026-06-19&to=2026-06-26`, `dateRange.value.preset` equals `'7d'` (verified by reading the signal in the browser console after load).
3. Selecting "30 days" in DateRangePicker updates the browser URL to include `preset=30d` without a full page reload.
4. The four sections appear in order: Overview, Teams, Reliability, Billing.
5. `npx tsc --noEmit` reports zero errors after this task.
6. `npm run test` passes with no test failures.

**Test Plan**

- `src/app/router.test.tsx` (new)
  - Scenario: `<DashboardRoute />` calls `initFiltersFromUrl` on mount.
  - Scenario: all four section headings render (Overview, Teams, Reliability, Billing).
  - Scenario: `<DashboardRoute />` is wrapped in a `DashboardLayout` which renders `<main>`.
  - Note: mock `initFiltersFromUrl`, `syncFiltersToUrl`, `DashboardLayout`, and `Section` to isolate `DashboardRoute` from their implementations.

**Files**

- `src/app/router.tsx` (modified) - full rewrite replacing WP-03 scaffold with DashboardRoute + DashboardLayout + four Section placeholders

---

## Implementation order table

| Done | Priority | Task | Depends on | Effort |
|------|----------|------|------------|--------|
| [x]  | 1        | T-1: UI component prerequisites | - | Medium |
| [x]  | 2        | T-2: Filter signals module | - | Small |
| [x]  | 3        | T-3: Section and SectionSkeleton | - | Small |
| [x]  | 4        | T-4: SectionNav | - | Small |
| [x]  | 5        | T-5: DateRangePicker | T-1, T-2 | Medium |
| [x]  | 6        | T-6: TeamSelector | T-1, T-2 | Medium |
| [x]  | 7        | T-7: FilterBar | T-5, T-6 | Small |
| [x]  | 8        | T-8: DashboardLayout | T-3, T-4, T-7 | Medium |
| [x]  | 9        | T-9: Router wiring | T-2, T-8 | Small |
