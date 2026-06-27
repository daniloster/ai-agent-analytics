# TASKS: WP-09 - Accessibility & Quality Pass

**SPEC:** `docs/20260626-wp09-accessibility-spec.md`
**Date:** 2026-06-26

---

## Pre-implementation audit summary

The following gaps were identified by reading every file before writing these tasks. Read this section before starting any task so you understand what is already correct and what is not.

**Already correct (do not change):**
- `Area.tsx` (`src/components/charts/marks/Area.tsx`): `role="listitem"`, `tabIndex={0}`, `aria-label`, and `onKeyDown`/`onFocus`/`onBlur` handlers already present on each `<circle>`.
- `SectionNav.tsx`: `aria-current` already set on the active link.
- `Heatmap.tsx`: `role="listitem"`, `tabIndex={0}`, `aria-label` already on each `<rect>`.
- `KpiCard.tsx`: `role="status"` already on the insufficient-data `<span>`.

**Gaps that require fixes:**
| File | Gap |
|---|---|
| `DashboardLayout.tsx` | No `<SkipLink>`, no `id="main-content"`, no `tabIndex={-1}` on `<main>`, no `aria-label` on nav wrapper |
| `SectionNav.tsx` | No `aria-label` on `<nav>`, no `<ul>` wrapper, no `aria-label="Dashboard sections"` on link list |
| `FilterBar.tsx` | No `role="search"` or `aria-label` on wrapper |
| `DateRangePicker.tsx` | Trigger button has no `aria-label` with current value |
| `TeamSelector.tsx` | `<SelectTrigger>` has no `aria-label` with current value |
| `KpiCard.tsx` | Info button `aria-label="More information"` (too generic); insufficient-data `<span>` missing `aria-live="polite"`; `<DeltaBadge>` missing `aria-label`; no popover focus management; no `aria-hidden` on Sparkline |
| `Area.tsx` | No `<g role="list">` wrapper around circles; `aria-label` uses raw series/field names, not formatted date/value; `<defs>` not `aria-hidden`; no tooltip aria-live region |
| `Visualization.tsx` | No tooltip aria-live region (will be added here as the central place that reads `activePoint`) |
| `DonutChart.tsx` | Each arc `<path>` has no `role`, no `tabIndex`, no `aria-label`, no keyboard handlers; `<Group>` has no `role="list"` |
| `BarChart.tsx` | `role="listitem"` div has no `tabIndex`; no keyboard handlers; no aria-live announcement region |
| `Heatmap.tsx` | No keyboard handlers (Enter, ArrowKeys); no roving tabindex; no `<g role="list">` wrapper |

---

## T-1: a11y infrastructure - axeConfig utility and SkipLink component

**Context**

Creates two new files referenced throughout WP-09. `src/lib/a11y/axeConfig.ts` is the shared `checkA11y` function used in T-6 section tests. `src/components/layout/SkipLink.tsx` is the skip-to-content link added to DashboardLayout in T-2. Both must exist before any other task uses them.

`axe-core` is already installed as a transitive dependency of `@axe-core/react`. Import directly from `'axe-core'`.

Before starting, read:
- `src/components/ui/button.tsx` - import `Button` from here for the SkipLink's visual style
- `src/lib/kpi/formulas.ts` - pattern for a bare utility module (pure exports, no React, no imports from the app)

**Requirements**

1. Create `src/lib/a11y/axeConfig.ts` exporting `async function checkA11y(container: Element): Promise<void>`.
2. `checkA11y` must call `axe.run(container, { rules: { 'color-contrast': { enabled: true }, 'keyboard': { enabled: true }, 'aria-required-attr': { enabled: true }, 'aria-valid-attr-value': { enabled: true } } })`.
3. When `results.violations.length === 0`, `checkA11y` must resolve without throwing.
4. When `results.violations.length > 0`, `checkA11y` must throw an `Error` whose message is `violations.map(v => v.description).join('\n')`.
5. Create `src/components/layout/SkipLink.tsx` exporting `function SkipLink(): JSX.Element`.
6. `SkipLink` must render `<a href="#main-content">Skip to content</a>`.
7. `SkipLink` must use Tailwind class `sr-only` at rest so it is visually hidden.
8. `SkipLink` must use Tailwind classes `focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50` so it appears when focused.
9. `SkipLink` must use `<Button asChild variant="outline">` from `src/components/ui/button.tsx` (via `asChild` composition) so it inherits the focus ring style.
10. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- `axe-core` is imported as `import axe from 'axe-core'` (default import). The package is available as a transitive dep of `@axe-core/react`; no `npm install` needed.
- `checkA11y` throws synchronously after `await axe.run(...)` resolves; it does not return the violations - callers do not inspect them, they just need pass/fail.
- `SkipLink` uses `<Button asChild variant="outline">` + `<a>` inside. The `asChild` prop from shadcn merges the Button's styles onto the `<a>` element. This gives the link a visible focus ring without custom CSS.
- File naming: `axeConfig.ts` not `checkA11y.ts` - the file exports multiple rule constants in future; using the config module name is more future-stable.

**Design**

```ts
// src/lib/a11y/axeConfig.ts  (new file)
import axe from 'axe-core'

export async function checkA11y(container: Element): Promise<void>
// const results = await axe.run(container, { rules: { ... } })
// if (results.violations.length > 0) throw new Error(...)
```

```tsx
// src/components/layout/SkipLink.tsx  (new file)
import { Button } from '../ui/button'

export function SkipLink(): JSX.Element
// return (
//   <Button asChild variant="outline">
//     <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50">
//       Skip to content
//     </a>
//   </Button>
// )
```

**Acceptance criteria**

1. `checkA11y` resolves without throwing when passed a DOM element with `<button aria-label="test">`.
2. `checkA11y` throws an `Error` containing a violation description when passed a `<button>` with no `aria-label` and no text content.
3. `SkipLink` renders an `<a>` element with `href="#main-content"`.
4. The `<a>` element has the class `sr-only` in its class list.
5. The `<a>` element has `focus:not-sr-only` in its class list.
6. `SkipLink` renders without throwing when no props are provided.

**Test Plan**

- `src/lib/a11y/axeConfig.test.ts` (new)
  - Scenario: accessible element (button with aria-label) passes without throwing.
  - Scenario: inaccessible element (button with no label or text) throws with violation description.
  - Scenario: empty container with no interactive elements passes without throwing.

- `src/components/layout/SkipLink.test.tsx` (new)
  - Scenario: renders an `<a>` with `href="#main-content"`.
  - Scenario: `sr-only` class is present on the `<a>`.
  - Scenario: `focus:not-sr-only` class is present on the `<a>`.

**Files**

- `src/lib/a11y/axeConfig.ts` (new) - exports `checkA11y` using axe-core
- `src/lib/a11y/axeConfig.test.ts` (new) - pass/fail assertions for checkA11y
- `src/components/layout/SkipLink.tsx` (new) - sr-only skip link that becomes visible on focus
- `src/components/layout/SkipLink.test.tsx` (new) - href and class assertions

---

## T-2: Layout and filter component ARIA

**Context**

Implements SPEC §3 "Layout" and "Filter" audit items. Adds `<SkipLink>` from T-1 as the first focusable element in the dashboard, wraps `<main>` with the correct id and tabIndex, adds descriptive `aria-label` to the nav and filter controls, and fixes both filter trigger buttons to announce their current value.

DashboardLayout.tsx, SectionNav.tsx, FilterBar.tsx, DateRangePicker.tsx, and TeamSelector.tsx are all layout/filter components that can be fixed together because none of their changes depend on each other.

Before starting, read:
- `src/components/layout/DashboardLayout.tsx` - current structure; `<SkipLink>` must be the very first child of the outermost wrapper, before the sticky header
- `src/components/layout/SectionNav.tsx` - current `<nav>` has no `aria-label`; links are direct children of `<nav>` with no `<ul>` wrapper
- `src/components/filters/FilterBar.tsx` - current wrapper div has no ARIA
- `src/components/filters/DateRangePicker.tsx` - trigger `<Button>` currently shows date text with no `aria-label` attribute
- `src/components/filters/TeamSelector.tsx` - `<SelectTrigger>` has no `aria-label`
- `src/components/layout/SkipLink.tsx` (T-1) - import from here

**Requirements**

1. `DashboardLayout` must render `<SkipLink />` as the first child of the outermost wrapper `<div>`, before the sticky header `<div className="sticky ...">`.
2. `DashboardLayout` must add `id="main-content"` and `tabIndex={-1}` to the `<main>` element.
3. `DashboardLayout` must wrap `<SectionNav />` in `<nav aria-label="Dashboard navigation">` (the existing `<SectionNav>` already renders its own `<nav>` - wrap only if `SectionNav` renders a non-nav element; otherwise add `aria-label` directly to the nav inside `SectionNav`).
4. After reading `SectionNav.tsx`: the `<nav>` element must gain `aria-label="Dashboard navigation"`.
5. `SectionNav` must wrap its `<a>` elements in `<ul aria-label="Dashboard sections">` with each link inside a `<li>`.
6. `FilterBar` must change its wrapper `<div>` to `<div role="search" aria-label="Filter dashboard data">`.
7. `DateRangePicker` trigger button must gain `aria-label={"Select date range, currently " + triggerLabel}` where `triggerLabel` is the already-computed date range string.
8. `TeamSelector` `<SelectTrigger>` must gain `aria-label={"Filter by team, currently " + currentLabel}` where `currentLabel` is `"All teams"` when `teamId.value` is undefined, and the selected team's name when a team is selected.
9. For `TeamSelector`, derive `currentLabel` from `data?.find(t => t.id === teamId.value)?.name ?? 'All teams'` before the return statement.
10. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- Requirement 3+4: `SectionNav.tsx` already renders `<nav>`. Add `aria-label="Dashboard navigation"` directly to that `<nav>` element. Do NOT add a second `<nav>` wrapper in DashboardLayout.
- `<ul>` wrapper in SectionNav: the SPEC requires `aria-label="Dashboard sections"` on the `<ul>`. Adding this wrapper changes the DOM structure from `nav > a` to `nav > ul > li > a`. This is correct HTML and accessible - do not skip the `<ul>`.
- `TeamSelector` `currentLabel`: the `data` query may still be loading when the label is needed. Use the safe fallback `data?.find(...) ?? 'All teams'` so the label is always valid even during loading.
- `tabIndex={-1}` on `<main>`: this allows the SkipLink's `href="#main-content"` to programmatically move focus to the main content area, which does not receive focus by default.

**Design**

```tsx
// src/components/layout/DashboardLayout.tsx  (modified)
import { SkipLink } from './SkipLink'
// Outermost JSX:
// <QueryClientProvider ...>
//   <SkipLink />        <-- NEW: first child
//   <div className="sticky ...">
//     <FilterBar />
//     <SectionNav />   <-- remove wrapping nav here; aria-label is on nav inside SectionNav
//   </div>
//   <main id="main-content" tabIndex={-1}>{children}</main>   <-- id + tabIndex added
// </QueryClientProvider>
```

```tsx
// src/components/layout/SectionNav.tsx  (modified)
// <nav aria-label="Dashboard navigation">  <-- aria-label added
//   <ul aria-label="Dashboard sections">   <-- ul wrapper added
//     {SECTIONS.map(s => (
//       <li key={s.id}>
//         <a ... aria-current={...}>{s.label}</a>
//       </li>
//     ))}
//   </ul>
// </nav>
```

```tsx
// src/components/filters/FilterBar.tsx  (modified)
// <div role="search" aria-label="Filter dashboard data">  <-- role + aria-label added
//   <DateRangePicker />
//   <TeamSelector />
// </div>
```

```tsx
// src/components/filters/DateRangePicker.tsx  (modified)
// <Button variant="outline" aria-label={"Select date range, currently " + triggerLabel}>  <-- aria-label added
//   {triggerLabel}
// </Button>
```

```tsx
// src/components/filters/TeamSelector.tsx  (modified)
// const currentLabel = data?.find(t => t.id === teamId.value)?.name ?? 'All teams'
// <SelectTrigger aria-label={"Filter by team, currently " + currentLabel} className="h-9 w-36">  <-- aria-label added
```

**Acceptance criteria**

1. `SkipLink` is rendered before the sticky header in DashboardLayout's DOM output.
2. The `<main>` element has `id="main-content"` and `tabIndex="-1"`.
3. The nav element in SectionNav has `aria-label="Dashboard navigation"`.
4. There is a `<ul>` with `aria-label="Dashboard sections"` inside the nav.
5. Each nav link is wrapped in a `<li>`.
6. FilterBar's wrapper element has `role="search"` and `aria-label="Filter dashboard data"`.
7. DateRangePicker trigger button's `aria-label` contains the word "currently".
8. TeamSelector trigger's `aria-label` is `"Filter by team, currently All teams"` when no team is selected.

**Test Plan**

- `src/components/layout/DashboardLayout.test.tsx` (new)
  - Scenario: SkipLink `<a href="#main-content">` is the first focusable element in the rendered output.
  - Scenario: `<main>` has `id="main-content"` and `tabIndex="-1"`.

- `src/components/layout/SectionNav.test.tsx` (new)
  - Scenario: nav has `aria-label="Dashboard navigation"`.
  - Scenario: `<ul>` inside nav has `aria-label="Dashboard sections"`.
  - Scenario: each link is inside a `<li>`.
  - Scenario: active link has `aria-current="true"`.

- `src/components/filters/FilterBar.test.tsx` (new)
  - Scenario: wrapper div has `role="search"` and `aria-label="Filter dashboard data"`.

- `src/components/filters/DateRangePicker.test.tsx` (new or modified)
  - Scenario: trigger button `aria-label` includes "currently".

- `src/components/filters/TeamSelector.test.tsx` (new or modified)
  - Scenario: SelectTrigger `aria-label` is "Filter by team, currently All teams" when no team selected.

**Files**

- `src/components/layout/DashboardLayout.tsx` (modified) - adds SkipLink, `id="main-content"`, `tabIndex={-1}` on main
- `src/components/layout/SectionNav.tsx` (modified) - adds nav `aria-label`, `<ul>` wrapper with `aria-label`
- `src/components/filters/FilterBar.tsx` (modified) - adds `role="search"` and `aria-label`
- `src/components/filters/DateRangePicker.tsx` (modified) - adds descriptive `aria-label` on trigger
- `src/components/filters/TeamSelector.tsx` (modified) - adds descriptive `aria-label` on SelectTrigger
- `src/components/layout/DashboardLayout.test.tsx` (new) - SkipLink placement and main landmark tests
- `src/components/layout/SectionNav.test.tsx` (new) - nav label, ul wrapper, aria-current tests
- `src/components/filters/FilterBar.test.tsx` (new) - search role and label tests
- `src/components/filters/DateRangePicker.test.tsx` (new) - trigger aria-label tests
- `src/components/filters/TeamSelector.test.tsx` (new) - trigger aria-label tests

---

## T-3: KpiCard ARIA remediation

**Context**

Implements SPEC §3 "KPI components" audit items for `src/components/kpis/KpiCard.tsx`. There are five independent gaps to fix in this one file:
1. Info button `aria-label` is generic.
2. Insufficient-data element has `role="status"` but no `aria-live`.
3. `DeltaBadge` has no `aria-label` for screen readers.
4. No popover focus management (focus does not move into popover on open, does not return on close).
5. Sparkline wrapper inside KpiCard has no `aria-hidden="true"` (sparkline is decorative in the card context).

Before starting, read `src/components/kpis/KpiCard.tsx` in full - pay attention to the `open = useSignal(false)` pattern for the Popover, and the `DeltaBadge` sub-component.

**Requirements**

1. Change the info icon `<button aria-label="More information">` to `aria-label={"Formula and example for " + props.label}`.
2. Change `<span role="status"` to `<p role="status" aria-live="polite">` (element type `span` -> `p`; add `aria-live="polite"`).
3. `DeltaBadge` must add `aria-label` on the `<span>` that shows the formatted delta value: `aria-label={`${prefix}${formatPercent(Math.abs(delta), 1)} compared to prior period${deltaLabel ? ' ' + deltaLabel : ''}`}`.
4. The `<Popover>` must auto-focus the first focusable element when it opens: add `onOpenAutoFocus={(e) => e.preventDefault()}` and `autoFocus` on the first interactive element inside `<PopoverContent>` (if the shadcn Popover already handles `onOpenAutoFocus`, verify and use that mechanism rather than manual focus).
5. When the Popover closes (`open.value` transitions from `true` to `false`), focus must return to the info icon button: add `onCloseAutoFocus` to `<PopoverContent>` (shadcn Popover supports this prop on `PopoverContent` via Radix UI) returning focus to the trigger button.
6. The `<div className="mt-3">` that wraps `<Sparkline>` inside KpiCard must gain `aria-hidden="true"`.
7. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- Requirement 4+5: Radix UI Popover (used by shadcn's `Popover`) supports `onOpenAutoFocus` on `PopoverContent` which fires when the popover opens and auto-focuses the first interactive descendant by default. It also supports `onCloseAutoFocus` which returns focus to the trigger. The default Radix behavior already does this correctly; **only override if testing reveals it is not working**. Do not add custom `useEffect`/`useRef` focus management if Radix UI already handles it.
- Requirement 3: the `prefix` variable and `formatPercent(Math.abs(delta), 1)` already exist in `DeltaBadge`. Reuse them for the `aria-label`.
- `<span>` -> `<p>`: the insufficient-data state currently renders `<span role="status">`. Changing to `<p>` is semantically correct (paragraph of status text). The visual output is unchanged.
- `aria-hidden="true"` on Sparkline wrapper: the KpiCard's numeric `value` is already announced via the `<div className="text-2xl font-bold">`. The sparkline trend is a visual redundancy; hiding it prevents double-announcement of trend data.

**Design**

```tsx
// src/components/kpis/KpiCard.tsx  (modified)

// 1. Info button:
// <button aria-label={"Formula and example for " + props.label} ...>?</button>

// 2. Insufficient-data element:
// <p role="status" aria-live="polite" className="text-sm text-muted-foreground">Insufficient data</p>
// {props.insufficientDataReason && <p className="text-xs text-muted-foreground">{props.insufficientDataReason}</p>}

// 3. DeltaBadge aria-label (on the formatted-delta span):
// <span
//   className={`... ${colorClass}`}
//   aria-label={`${prefix}${formatPercent(Math.abs(delta), 1)} compared to prior period${deltaLabel ? ' ' + deltaLabel : ''}`}
// >
//   {prefix}{formatPercent(Math.abs(delta), 1)}
// </span>

// 4+5. Popover (Radix default focus management - verify first; no custom ref needed if Radix handles it)
// <PopoverContent onCloseAutoFocus={() => { /* Radix default returns focus to trigger */ }}>

// 6. Sparkline wrapper:
// <div aria-hidden="true" className="mt-3">
//   <Sparkline data={props.trend} color={props.trendColor} />
// </div>
```

**Acceptance criteria**

1. The info button `aria-label` for a card with `label="Total Runs"` is `"Formula and example for Total Runs"`.
2. The insufficient-data element is a `<p>` tag (not `<span>`) with both `role="status"` and `aria-live="polite"`.
3. The delta badge `<span>` has an `aria-label` containing "compared to prior period".
4. When the Popover opens, focus moves inside the `<PopoverContent>` (verified by checking `document.activeElement` is a descendant of the popover).
5. When the Popover closes via Escape, focus returns to the info icon button.
6. The Sparkline wrapper `<div>` has `aria-hidden="true"`.

**Test Plan**

- `src/components/kpis/KpiCard.test.tsx` (modified - add cases)
  - Scenario: info button `aria-label` equals `"Formula and example for {label}"`.
  - Scenario: insufficient-data `<p>` has `role="status"` and `aria-live="polite"`.
  - Scenario: delta badge `<span>` has `aria-label` containing "compared to prior period".
  - Scenario: Sparkline wrapper div has `aria-hidden="true"` when `trend` prop is provided.
  - Scenario: Sparkline wrapper is absent when `trend` prop is absent.

**Files**

- `src/components/kpis/KpiCard.tsx` (modified) - info button label, insufficient-data p tag + aria-live, DeltaBadge aria-label, Sparkline aria-hidden
- `src/components/kpis/KpiCard.test.tsx` (modified) - five new aria assertions

---

## T-4: Chart component ARIA - Area, Visualization, DonutChart, BarChart

**Context**

Implements SPEC §3 "Chart primitives" audit items for `Area.tsx`, `Visualization.tsx`, `DonutChart.tsx`, and `BarChart.tsx`. These four files are grouped because each has focused, contained changes: a `<g role="list">` wrapper on circles, a tooltip live region at the Visualization level, and role/tabIndex/keyboard on donut arcs and bar items.

Before starting, read:
- `src/components/charts/marks/Area.tsx` - the `<circle>` elements and the `<>` fragment structure; note `activePoint` from `useVisualizationContext()`
- `src/components/charts/Visualization.tsx` - find where the `<svg>` is rendered; the live region will go immediately after the SVG, inside the outer wrapper
- `src/components/charts/DonutChart.tsx` - current `<Pie>` render; note the `slices` array; total for percentage computation
- `src/components/charts/BarChart.tsx` - HTML div-based chart; current `role="list"` + `role="listitem"` structure
- `src/components/charts/DonutChart.test.tsx` - existing test checks `role="img"` on SVG; this test will break and must be updated

**Requirements - Area.tsx**

1. Wrap the `{data.map((datum, i) => <circle ... />)}` block in `<g role="list" aria-label={props.series + " data"}>...</g>`.
2. Add `aria-hidden="true"` to the `<defs>` element that wraps `<LinearGradient>`.
3. Update the `aria-label` on each `<circle>` from `${props.series}: ${datum[props.series]}` to a human-readable label: compute `xLabel` as `String(accessor(datum))` and `yLabel` as `String(datum[props.series])`; set `aria-label={xLabel + ': ' + yLabel}`.

**Requirements - Visualization.tsx**

4. Read `Visualization.tsx` to find the outermost wrapper element (the `<div>` or container that wraps the `<svg>`). After the `<svg>`, add:
   ```tsx
   <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
     {activePoint.value
       ? String(activePoint.value.datum['date'] ?? activePoint.value.datum[activePoint.value.series]) +
         ': ' + String(activePoint.value.datum[activePoint.value.series])
       : ''}
   </div>
   ```
5. The `activePoint` signal must be read inside the JSX of the Visualization component body (where it is already accessible via context or component state) to make the live region reactive.

**Requirements - DonutChart.tsx**

6. Remove `role="img"` from the `<svg>` element.
7. Add `role="list" aria-label={ariaLabel ?? 'Chart segments'}` to `<Group>`.
8. Compute `const total = slices.reduce((s, sl) => s + sl.value, 0)` before the return statement (outside JSX).
9. For each arc path in the `<Pie>` render callback, add:
   - `role="listitem"`
   - `tabIndex={0}`
   - `aria-label={slices[i]?.label + ': ' + (total > 0 ? ((slices[i]?.value ?? 0) / total * 100).toFixed(1) : '0.0') + '%'}`
   - `onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.preventDefault() }}` (prevent scroll on space; tooltip shown via onFocus)
   - `onFocus={undefined}` and `onBlur={undefined}` (DonutChart has no tooltip system; focus is sufficient for aria-label announcement)
10. Update `src/components/charts/DonutChart.test.tsx` to remove the `role="img"` assertion and add assertions for `role="list"` on the Group and `role="listitem"` on each path.

**Requirements - BarChart.tsx**

11. Add `tabIndex={0}` to each `role="listitem"` div.
12. Add a `const announceText = useSignal('')` inside `BarChart`.
13. Render `<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{announceText.value}</div>` as the first child of the outer `role="list"` div.
14. Add `onFocus={() => { announceText.value = bar.label + ': ' + bar.value }}` on each `role="listitem"` div.
15. Add `onBlur={() => { announceText.value = '' }}` on each `role="listitem"` div.
16. Add `onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); announceText.value = bar.label + ': ' + bar.value } }}` on each `role="listitem"` div.
17. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- Visualization.tsx is the right place for the tooltip aria-live region because `activePoint` is a signal owned by Visualization. Area, Bar, Gauge, etc. all set `activePoint.value`; a single live region in Visualization catches announcements from all marks.
- `activePoint.value.datum['date']` for the live region: most data series have a `date` field. The fallback `?? activePoint.value.datum[activePoint.value.series]` covers non-date x-axes (e.g. band scales).
- DonutChart SVG `role="img"` removal: `role="img"` declares the SVG as a single atomic image with no interactive descendants. Adding `role="listitem"` + `tabIndex={0}` to child paths violates this contract. Removing `role="img"` and using `role="list"` on the Group provides equivalent semantic coverage. The consumer `<figure aria-labelledby>` at the section level provides the outer labeled region.
- BarChart `announceText` uses `useSignal('')` (not `useState`) per ARCHITECTURE §3.1.
- BarChart aria-live region at the top of the list so screen readers encounter it early in the DOM order.

**Design**

```tsx
// src/components/charts/marks/Area.tsx  (modified)
// <defs aria-hidden="true">          <-- aria-hidden added
//   <LinearGradient ... />
// </defs>
// <AreaClosed ... />
// <g role="list" aria-label={props.series + ' data'}>   <-- g wrapper added
//   {data.map((datum, i) => {
//     const xLabel = String(accessor(datum))
//     const yLabel = String(datum[props.series])
//     return (
//       <circle
//         key={i}
//         aria-label={xLabel + ': ' + yLabel}   <-- improved label
//         role="listitem"
//         tabIndex={0}
//         ...
//       />
//     )
//   })}
// </g>
```

```tsx
// src/components/charts/Visualization.tsx  (modified - after the <svg> closing tag, inside the wrapper)
// <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
//   {activePoint.value
//     ? String(activePoint.value.datum['date'] ?? activePoint.value.datum[activePoint.value.series]) +
//       ': ' + String(activePoint.value.datum[activePoint.value.series])
//     : ''}
// </div>
```

```tsx
// src/components/charts/DonutChart.tsx  (modified)
// const total = slices.reduce((s, sl) => s + sl.value, 0)   <-- hoisted before return
// <svg width={size} height={size} aria-label={ariaLabel ?? 'Donut chart'}>   <-- role="img" removed
//   <Group role="list" aria-label={ariaLabel ?? 'Chart segments'} top={size/2} left={size/2}>
//     <Pie ...>
//       {({ arcs, path }) => arcs.map((arc, i) => {
//         const pct = total > 0 ? ((slices[i]?.value ?? 0) / total * 100).toFixed(1) : '0.0'
//         return (
//           <path
//             key={i}
//             role="listitem"
//             tabIndex={0}
//             aria-label={`${slices[i]?.label ?? ''}: ${pct}%`}
//             onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.preventDefault() }}
//             d={path(arc) ?? ''}
//             fill={fill}
//           />
//         )
//       })}
//     </Pie>
//   </Group>
// </svg>
```

```tsx
// src/components/charts/BarChart.tsx  (modified)
// const announceText = useSignal('')
// <div role="list" ...>
//   <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{announceText.value}</div>
//   {bars.map((bar, i) => (
//     <div
//       key={i}
//       role="listitem"
//       tabIndex={0}
//       onFocus={() => { announceText.value = bar.label + ': ' + bar.value }}
//       onBlur={() => { announceText.value = '' }}
//       onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); announceText.value = bar.label + ': ' + bar.value } }}
//       ...
//     >
//   ))}
// </div>
```

**Acceptance criteria**

1. `Area.tsx` circles are wrapped in `<g role="list">`.
2. The `<defs>` element in Area has `aria-hidden="true"`.
3. Each circle `aria-label` does not include the raw series string as a prefix (old format: `"trend: 42"`, new format: `"Mon Jun 01 2026: 42"`).
4. A `<div role="status" aria-live="polite">` is present in the DOM when any Visualization is rendered (visible via `document.querySelector('[role="status"][aria-live]')`).
5. DonutChart SVG no longer has `role="img"`.
6. `<g role="list">` is rendered inside DonutChart SVG.
7. Each `<path>` in DonutChart has `role="listitem"`, `tabIndex={0}`, and an `aria-label` containing `"%"`.
8. DonutChart with slices `[{label:'Active', value:70}, {label:'Unused', value:30}]` gives first arc `aria-label="Active: 70.0%"`.
9. BarChart items have `tabIndex={0}`.
10. Focusing a BarChart item updates the `role="status"` live region with the bar's label and value.
11. Pressing Enter on a focused BarChart item also sets the live region text.

**Test Plan**

- `src/components/charts/marks/Area.test.tsx` (modified - if exists) or new
  - Scenario: circles wrapped in `<g role="list">`.
  - Scenario: `<defs>` has `aria-hidden="true"`.
  - Scenario: circle `aria-label` does not start with the series name.

- `src/components/charts/Visualization.test.tsx` (modified)
  - Scenario: a `div[role="status"][aria-live="polite"]` is rendered.

- `src/components/charts/DonutChart.test.tsx` (modified)
  - Scenario: SVG has no `role="img"`.
  - Scenario: inner `<g>` has `role="list"`.
  - Scenario: each `<path>` has `role="listitem"` and `tabIndex="0"`.
  - Scenario: first arc `aria-label` of two slices (70/30) equals `"Active: 70.0%"`.
  - Scenario: empty slices array does not throw.

- `src/components/charts/BarChart.test.tsx` (modified)
  - Scenario: each listitem div has `tabIndex={0}`.
  - Scenario: `role="status"` live region is present in the DOM.
  - Scenario: firing `focus` on a listitem updates the live region text.
  - Scenario: firing `keydown` Enter on a listitem updates the live region text.

**Files**

- `src/components/charts/marks/Area.tsx` (modified) - `<g role="list">` wrapper, `aria-hidden` on defs, improved aria-label
- `src/components/charts/Visualization.tsx` (modified) - adds tooltip aria-live region below SVG
- `src/components/charts/DonutChart.tsx` (modified) - removes `role="img"`, adds `role="list"` on Group, `role="listitem"` + `tabIndex` + `aria-label` + keyboard on each arc
- `src/components/charts/BarChart.tsx` (modified) - adds `tabIndex`, `announceText` signal, aria-live region, focus/blur/keydown handlers
- `src/components/charts/marks/Area.test.tsx` (new or modified) - three new ARIA assertions
- `src/components/charts/Visualization.test.tsx` (modified) - aria-live region presence test
- `src/components/charts/DonutChart.test.tsx` (modified) - updates `role="img"` test; adds list/listitem/aria-label assertions
- `src/components/charts/BarChart.test.tsx` (modified) - tabIndex and keyboard announcement tests

---

## T-5: Heatmap ARIA - roving tabindex and keyboard navigation

**Context**

Implements SPEC §3 "Chart primitives - Heatmap" and AC #3. The Heatmap cells already have `role="listitem"`, `tabIndex={0}`, and `aria-label` (from WP-07 T-1). The gaps are: no `<g role="list">` wrapper, no keyboard handlers for Enter/Space (tooltip), no focus/blur handlers, and no roving tabindex (all cells have `tabIndex={0}` which means Tab visits every cell - the roving pattern should give Tab access to the first cell, then arrow keys move within the grid).

**Dependency:** This task must be done after WP-08 T-3 which changes `HeatmapProps.data` from `Array<{ date: string; uptime_pct: number }>` to `Array<{ date: string; value: number } & Record<string, unknown>>`. Verify which interface `Heatmap.tsx` has before starting - if `uptime_pct` is still present, complete WP-08 T-3 first.

Before starting, read:
- `src/components/charts/Heatmap.tsx` - current `HeatmapCanvas` function; note the `HeatmapRect` children callback structure; identify where cells are rendered
- `src/components/charts/Visualization.tsx` (from T-4) - do not add a second live region; Heatmap will add its own `role="status"` region outside the SVG (Heatmap does not use Visualization)

**Requirements**

1. Add `const focusedIdx = useSignal(0)` inside `HeatmapCanvas`.
2. Add `const cellRefs = useRef(new Map<number, SVGRectElement>())` inside `HeatmapCanvas`.
3. Compute linear cell index as `const linearIdx = colIdx * 7 + rowIdx` (column-major order) for each cell in the HeatmapRect children callback, where `colIdx` is the column index and `rowIdx` is the cell's row index within that column.
4. Each `<rect>` must set `tabIndex={focusedIdx.value === linearIdx ? 0 : -1}` (roving tabindex pattern).
5. Each `<rect>` must set `ref={(el) => { if (el) cellRefs.current.set(linearIdx, el); else cellRefs.current.delete(linearIdx) }}`.
6. Each `<rect>` must add `onFocus={() => { focusedIdx.value = linearIdx }}`.
7. Each `<rect>` must add `onBlur={() => { /* no-op; focus managed by ref */ }}`.
8. Each `<rect>` must add `onKeyDown` that handles:
   - `ArrowRight`: `newIdx = Math.min(totalCells - 1, linearIdx + 7)` (next week, same day)
   - `ArrowLeft`: `newIdx = Math.max(0, linearIdx - 7)` (prev week, same day)
   - `ArrowDown`: `newIdx = Math.min(totalCells - 1, linearIdx + 1)` (next day in same week)
   - `ArrowUp`: `newIdx = Math.max(0, linearIdx - 1)` (prev day in same week)
   - For all arrow keys: `e.preventDefault()`, `focusedIdx.value = newIdx`, `cellRefs.current.get(newIdx)?.focus()`
   - `Enter` or `Space`: `e.preventDefault()`, `announceText.value = rect's aria-label value`
   - `Escape`: `announceText.value = ''`
9. Wrap all `<rect>` elements in a `<g role="list" aria-label={ariaLabel ?? 'Heatmap data'}>` (pass `ariaLabel` down from `HeatmapProps` to `HeatmapCanvas` via props).
10. Add `const announceText = useSignal('')` inside `HeatmapCanvas`.
11. In `HeatmapCanvas`, outside the `<svg>`, render a sibling `<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{announceText.value}</div>`. Since `HeatmapCanvas` currently returns `<svg>`, change its return to wrap both in a `<div>` or a React fragment: `return (<><svg>...</svg><div role="status" .../></>)`.
12. `totalCells` must equal `data.length` (not `numWeeks * 7`; the last week may be partial).
13. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- Roving tabindex: only the focused cell has `tabIndex={0}`; all others have `tabIndex={-1}`. Tab enters the grid on the focused cell. Arrow keys move focus within the grid. Tab exits the grid to the next focusable element after the last focused cell. This is the standard grid navigation pattern (ARIA APG §grid pattern).
- Column-major index (col * 7 + row): The Heatmap renders weeks as columns (left to right) and days as rows (top to bottom). ArrowRight/Left moves between weeks (cols); ArrowDown/Up moves between days (rows). Index `col*7 + row` maps this correctly.
- `announceText.value` set on Enter reads the same string as `aria-label` so screen readers announce the cell's full description when the user explicitly activates it.
- `HeatmapCanvas` return change from `<svg>` to fragment: wrap in `<>` (not a `<div>`) to avoid introducing a DOM wrapper that could affect layout. The `<div role="status">` is inline after the `<svg>`.
- `cellRefs` and `focusedIdx` use patterns consistent with other Heatmap state. `cellRefs` uses `useRef<Map<number, SVGRectElement>>(() => new Map())` initialization form to avoid creating a new Map each render.

**Design**

```tsx
// src/components/charts/Heatmap.tsx  (modified)

interface HeatmapCanvasProps {
  // ... existing props ...
  ariaLabel?: string  // NEW: pass-through from HeatmapProps
}

function HeatmapCanvas({ data, colorScale, width, height, tokens, ariaLabel }: HeatmapCanvasProps): JSX.Element | null {
  const w = width.value
  if (w === 0 || data.length === 0) return null

  const focusedIdx = useSignal(0)
  const announceText = useSignal('')
  const cellRefs = useRef<Map<number, SVGRectElement>>(new Map())
  const totalCells = data.length
  // ... existing numWeeks / cellWidth / cellHeight / weeks computation ...

  return (
    <>
      <svg width={w} height={height}>
        <HeatmapRect ...>
          {(cells) =>
            <g role="list" aria-label={ariaLabel ?? 'Heatmap data'}>
              {cells.flatMap((colCells, colIdx) =>
                colCells.map((cell, rowIdx) => {
                  const datum = cell.bin
                  const linearIdx = colIdx * 7 + rowIdx
                  const cellAriaLabel = /* existing aria-label computation for datum */
                  const handleKeyDown = (e: React.KeyboardEvent) => {
                    // ArrowRight/Left/Down/Up: update focusedIdx + call focus()
                    // Enter/Space: announceText.value = cellAriaLabel
                    // Escape: announceText.value = ''
                  }
                  return (
                    <rect
                      key={`${cell.column}-${cell.row}`}
                      ref={(el) => { if (el) cellRefs.current.set(linearIdx, el); else cellRefs.current.delete(linearIdx) }}
                      tabIndex={focusedIdx.value === linearIdx ? 0 : -1}
                      role="listitem"
                      aria-label={cellAriaLabel}
                      onFocus={() => { focusedIdx.value = linearIdx }}
                      onKeyDown={handleKeyDown}
                      // ... existing x, y, width, height, fill ...
                    />
                  )
                })
              )}
            </g>
          }
        </HeatmapRect>
      </svg>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announceText.value}
      </div>
    </>
  )
}
```

**Acceptance criteria**

1. Only the cell at `focusedIdx` has `tabIndex={0}`; all other cells have `tabIndex={-1}`.
2. The first cell (index 0) has `tabIndex={0}` on initial render.
3. Pressing ArrowRight while the first cell is focused moves focus to cell at index 7 (next week, same day).
4. Pressing ArrowDown while the first cell is focused moves focus to cell at index 1 (next day, same week).
5. Pressing Enter on a focused cell sets the `role="status"` live region text to the cell's `aria-label` content.
6. Pressing Escape clears the `role="status"` live region.
7. All cells are wrapped in `<g role="list">`.
8. A `<div role="status" aria-live="polite">` is rendered alongside the SVG.
9. Arrow key presses do not scroll the page (verify `e.preventDefault()` is called).
10. Navigating past the last cell (ArrowRight on the last column) stays on the last cell (boundary clamp).

**Test Plan**

- `src/components/charts/Heatmap.test.tsx` (modified - update existing tests + add new cases)
  - Scenario: initial render - first rect has `tabIndex={0}`, second has `tabIndex={-1}`.
  - Scenario: `role="list"` is on the `<g>` inside the SVG.
  - Scenario: `role="status" aria-live="polite"` div is rendered alongside SVG.
  - Scenario: ArrowRight keyDown on cell[0] causes cell[7] to become the focused element (if enough cells).
  - Scenario: Enter keyDown on cell[0] sets the status div text to the cell's aria-label.
  - Scenario: Escape keyDown clears the status div text.
  - Scenario: ArrowRight on last-column cell stays on last cell (boundary check).
  - Scenario: existing tests for `aria-label` format still pass (verify WP-08 T-3 interface change doesn't break them).

**Files**

- `src/components/charts/Heatmap.tsx` (modified) - roving tabindex, cellRefs, keyboard handlers, `<g role="list">`, announceText signal + status div
- `src/components/charts/Heatmap.test.tsx` (modified) - roving tabindex, keyboard nav, live region, boundary tests

---

## T-6: Section axe assertions and reduced-motion audit

**Context**

Implements SPEC §3 "Section components" audit, SPEC AC #6, AC #7, AC #10, AC #11. Adds `checkA11y` (from T-1) to all four section component test files, verifies that each section `<section>` has `aria-labelledby`, and scans all chart and layout files for bare Tailwind `transition-*` or `animate-*` classes that should be wrapped with `motion-safe:`.

This task must be done AFTER T-1 through T-5 - the axe checks will fail if any of the ARIA gaps from those tasks are still present.

Before starting, read:
- `src/components/sections/Overview.test.tsx` - existing test pattern (QueryClient + fetch mocks); you will add `checkA11y` at the end of the main render test
- `src/components/sections/Reliability.test.tsx` - same pattern
- `src/components/sections/TeamBreakdown.test.tsx` - same pattern
- `src/components/layout/Section.tsx` - verify that Section renders a `<section>` with `id` and `aria-labelledby` props; if it does not, add them
- All files listed in "Files" below for the reduced-motion scan

**Requirements**

1. Read `src/components/layout/Section.tsx`: if it renders `<section id={props.id}>` without `aria-labelledby={props.labelledBy}`, add `aria-labelledby={props.labelledBy}` to the `<section>` element.
2. Add a test case to `src/components/sections/Overview.test.tsx` that calls `await checkA11y(container)` after the overview data loads and resolves without throwing.
3. Add a test case to `src/components/sections/TeamBreakdown.test.tsx` that calls `await checkA11y(container)` after data loads.
4. Add a test case to `src/components/sections/Reliability.test.tsx` that calls `await checkA11y(container)`.
5. Create `src/components/sections/Billing.test.tsx` (if not already created by WP-08 T-6) with at minimum one test case that calls `await checkA11y(container)` after billing data loads.
6. Each axe test case must use the same QueryClient + MSW mock pattern as the existing section tests.
7. Scan `src/components/charts/` and `src/components/layout/` for any Tailwind utility class matching `transition-` or `animate-` that is NOT prefixed with `motion-safe:`. For each one found: change it to `motion-safe:transition-` or `motion-safe:animate-` (respectively). If none are found, document this explicitly in a comment in `src/lib/a11y/axeConfig.ts`: `// Reduced-motion scan: no bare transition- or animate- classes found in src/components/ as of WP-09`.
8. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- `checkA11y` throws on violation - the test will fail with the axe violation description as the error message, which is a useful diagnostic.
- The axe check must run on the fully-loaded, post-query state. Wrap it in `await waitFor(() => checkA11y(container))` so it retries until data is rendered and axe passes (or fails definitively).
- `Billing.test.tsx`: WP-08 T-6 may have already created this file. Check for it before creating a new one. If it exists, add the `checkA11y` case to it.
- Reduced-motion: Tailwind's `motion-safe:` prefix means the utility applies only when the user has NOT requested reduced motion. Bare `transition-*` and `animate-*` classes run unconditionally. The fix is to prefix them: `transition-all` -> `motion-safe:transition-all`.
- `Section.tsx` `aria-labelledby`: the SPEC uses `<Section id="overview" labelledBy="overview-heading">` with the heading rendered as `<h2 id="overview-heading">` inside. For `aria-labelledby` to work, `Section` must pass `labelledBy` as `aria-labelledby` on `<section>`. This is a one-line fix.

**Design**

```tsx
// src/components/layout/Section.tsx  (modified, if aria-labelledby is missing)
// <section id={props.id} aria-labelledby={props.labelledBy}>   <-- aria-labelledby added
```

```ts
// src/components/sections/Overview.test.tsx  (modified - add case)
import { checkA11y } from '../../lib/a11y/axeConfig'

it('passes axe accessibility check', async () => {
  const { container } = render(<Overview />, { wrapper: QueryWrapper })
  await waitFor(() => screen.getByText('Total Runs'))  // wait for data
  await waitFor(() => checkA11y(container))            // retries until pass or timeout
})
```

```ts
// src/lib/a11y/axeConfig.ts  (modified only if no bare classes found)
// Reduced-motion scan: no bare transition- or animate- classes found
// in src/components/ as of WP-09. All animation utilities use motion-safe: prefix.
```

**Acceptance criteria**

1. `Section` renders `<section aria-labelledby={labelledBy}>` (inspect DOM with `container.querySelector('section').getAttribute('aria-labelledby')`).
2. The axe test in `Overview.test.tsx` passes without throwing (zero violations).
3. The axe test in `TeamBreakdown.test.tsx` passes.
4. The axe test in `Reliability.test.tsx` passes.
5. The axe test in `Billing.test.tsx` passes.
6. All four axe tests report color-contrast rule results (axe ran with color-contrast enabled, not silently skipped).
7. No bare `transition-*` or `animate-*` classes exist in `src/components/` without a `motion-safe:` prefix (verified by running `grep -r "transition-\|animate-" src/components/ | grep -v "motion-safe:"` which should return no results, or results that are documented).

**Test Plan**

- `src/components/layout/Section.test.tsx` (new or modified)
  - Scenario: `<section>` element has `aria-labelledby` attribute matching `labelledBy` prop.

- `src/components/sections/Overview.test.tsx` (modified)
  - Scenario: `await checkA11y(container)` resolves after data loads.

- `src/components/sections/TeamBreakdown.test.tsx` (modified)
  - Scenario: `await checkA11y(container)` resolves after data loads.

- `src/components/sections/Reliability.test.tsx` (modified)
  - Scenario: `await checkA11y(container)` resolves after data loads.

- `src/components/sections/Billing.test.tsx` (new or modified)
  - Scenario: `await checkA11y(container)` resolves after data loads.

**Files**

- `src/components/layout/Section.tsx` (modified, if needed) - adds `aria-labelledby` to `<section>`
- `src/components/layout/Section.test.tsx` (new or modified) - aria-labelledby assertion
- `src/components/sections/Overview.test.tsx` (modified) - adds checkA11y test case
- `src/components/sections/TeamBreakdown.test.tsx` (modified) - adds checkA11y test case
- `src/components/sections/Reliability.test.tsx` (modified) - adds checkA11y test case
- `src/components/sections/Billing.test.tsx` (new or modified) - adds checkA11y test case
- Any `src/components/` file with bare `transition-*`/`animate-*` (modified) - adds `motion-safe:` prefix
- `src/lib/a11y/axeConfig.ts` (modified, if no bare classes found) - reduced-motion audit comment

---

## T-7: Responsive layout - mobile and tablet breakpoints

**Context**

Added 2026-06-27. The mobile view (sub-640px) is broken: the sticky header overflows, the SectionNav clips, and all KpiCard grids render in fixed desktop column counts. This task applies Tailwind responsive variants to existing class strings only - no new components, no structural JSX changes.

Before starting, read every file listed in "Files" below in full. The exact class strings to replace are documented in the SPEC §3 "Responsive layout audit" section. Replace them exactly as documented.

**Requirements**

1. `DashboardLayout.tsx` header: change `"bg-card border-b border-border h-14 px-8 flex items-center justify-between"` to `"bg-card border-b border-border min-h-14 h-auto flex flex-wrap items-center justify-between gap-x-4 px-4 py-2 sm:px-8 sm:h-14 sm:flex-nowrap sm:py-0"`.
2. `DashboardLayout.tsx` main: change `"px-8 py-7 max-w-[1440px] mx-auto flex flex-col gap-8"` to `"px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-7 max-w-[1440px] mx-auto flex flex-col gap-4 sm:gap-6 lg:gap-8"`.
3. `SectionNav.tsx` nav: change `"flex border-b border-border bg-card px-8"` to `"flex overflow-x-auto border-b border-border bg-card px-4 sm:px-8"`.
4. `FilterBar.tsx` wrapper: change `"flex items-center gap-3"` to `"flex flex-wrap items-center gap-2 sm:gap-3"`.
5. `Section.tsx`: change `scrollMarginTop: '104px'` to `scrollMarginTop: '120px'` to account for the taller wrapped header on mobile.
6. In all four section files (`Overview.tsx`, `Reliability.tsx`, `TeamBreakdown.tsx`, `Billing.tsx`): replace every occurrence of `"grid grid-cols-4 gap-4"` (with or without trailing `mt-4`) with `"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"` (preserving any `mt-4`).
7. In all four section files: replace every occurrence of `"grid grid-cols-3 gap-4"` (with or without trailing `mt-4`) with `"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"` (preserving any `mt-4`).
8. In all four section files: replace every occurrence of `"grid grid-cols-2 gap-4"` (with or without trailing `mt-4`) with `"grid grid-cols-1 sm:grid-cols-2 gap-4"` (preserving any `mt-4`).
9. Do not change any `gap-4` spacing, `mt-4` margins, or any class not listed in requirements 1-8. Scope is strictly the responsive variants.
10. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- Three-tier breakpoint strategy (`sm`=640px, `lg`=1024px, none=mobile): adding a `md` tier would double the variant count with minimal visual benefit. The jump from 1 to 2 columns at `sm` covers tablets; the jump from 2 to 4 at `lg` covers desktop.
- `grid-cols-2` grids only go to `grid-cols-1` at mobile and stay `grid-cols-2` at `sm` and above. These grids hold wide charts (two side-by-side figures); making them 1-col on mobile is necessary.
- Header `flex-wrap sm:flex-nowrap`: at mobile the brand name and FilterBar can wrap to a second line. At `sm` and above they lock to a single row at the fixed `h-14` height.
- `overflow-x-auto` on SectionNav: the four links are 90-120px each; at 320-375px they will overflow the available width. Horizontal scroll is the correct pattern for a pill-tab nav - it does not require any JS, is accessible, and preserves the active indicator underline.
- `scrollMarginTop: '120px'`: the current value of `104px` (56px header + 48px SectionNav) is exact for desktop. The wrapped mobile header can be up to ~112px (two rows). `120px` gives 8px buffer without hiding too much section content.
- **Do not change `TeamBreakdown.test.tsx` test** at line 149 which asserts `className.contains('grid-cols-2')` - the responsive class string `"grid-cols-1 sm:grid-cols-2 gap-4"` still contains `grid-cols-2` as a substring, so this test continues to pass without modification.

**Design**

No new types or components. The changes are class-string substitutions on existing elements.

Files modified and which class strings change:

```
DashboardLayout.tsx
  <header>: h-14 px-8 flex items-center justify-between
         -> min-h-14 h-auto flex flex-wrap items-center justify-between gap-x-4 px-4 py-2 sm:px-8 sm:h-14 sm:flex-nowrap sm:py-0
  <main>:  px-8 py-7 ... gap-8
        -> px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-7 ... gap-4 sm:gap-6 lg:gap-8

SectionNav.tsx
  <nav>: flex border-b border-border bg-card px-8
      -> flex overflow-x-auto border-b border-border bg-card px-4 sm:px-8

FilterBar.tsx
  <div>: flex items-center gap-3
      -> flex flex-wrap items-center gap-2 sm:gap-3

Section.tsx
  style: scrollMarginTop: '104px'  ->  scrollMarginTop: '120px'

Overview.tsx, Reliability.tsx, TeamBreakdown.tsx, Billing.tsx
  grid grid-cols-4 [gap-4|gap-4 mt-4]
  -> grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 [gap-4|gap-4 mt-4]

  grid grid-cols-3 [gap-4|gap-4 mt-4]
  -> grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 [gap-4|gap-4 mt-4]

  grid grid-cols-2 [gap-4|gap-4 mt-4]
  -> grid grid-cols-1 sm:grid-cols-2 [gap-4|gap-4 mt-4]
```

**Acceptance criteria**

1. `DashboardLayout.tsx` header class string contains `flex-wrap` and `sm:px-8`.
2. `DashboardLayout.tsx` main class string contains `px-4` and `lg:px-8`.
3. `SectionNav.tsx` nav class string contains `overflow-x-auto`.
4. `FilterBar.tsx` wrapper class string contains `flex-wrap`.
5. `Section.tsx` `scrollMarginTop` is `'120px'`.
6. `Overview.tsx` contains no bare `grid-cols-4` (all occurrences have `lg:grid-cols-4`).
7. `Reliability.tsx` contains no bare `grid-cols-4`.
8. `TeamBreakdown.tsx` contains no bare `grid-cols-4`.
9. `Billing.tsx` contains no bare `grid-cols-3`.
10. No `grid-cols-2` without `grid-cols-1` as its smaller-viewport predecessor exists in any section file.
11. Manual verification at 375px viewport: header does not scroll horizontally; SectionNav shows all four links via horizontal scroll; KpiCard grids are single-column.

**Test Plan**

- `src/components/layout/DashboardLayout.test.tsx` (modified)
  - Scenario: rendered `<header>` className contains `flex-wrap`.
  - Scenario: rendered `<main>` className contains `px-4`.

- `src/components/layout/SectionNav.test.tsx` (modified)
  - Scenario: rendered `<nav>` className contains `overflow-x-auto`.

- No grid class tests needed: Tailwind class presence is verified by requirements 6-10 via code review. Existing tests (including the `grid-cols-2` assertion in TeamBreakdown.test.tsx) continue to pass without modification.

**Files**

- `src/components/layout/DashboardLayout.tsx` (modified) - responsive header and main classes
- `src/components/layout/SectionNav.tsx` (modified) - overflow-x-auto and responsive padding on nav
- `src/components/filters/FilterBar.tsx` (modified) - flex-wrap on wrapper
- `src/components/layout/Section.tsx` (modified) - scrollMarginTop 104px -> 120px
- `src/components/sections/Overview.tsx` (modified) - responsive grid-cols variants
- `src/components/sections/Reliability.tsx` (modified) - responsive grid-cols variants
- `src/components/sections/TeamBreakdown.tsx` (modified) - responsive grid-cols variants
- `src/components/sections/Billing.tsx` (modified) - responsive grid-cols variants
- `src/components/layout/DashboardLayout.test.tsx` (modified) - flex-wrap and px-4 assertions
- `src/components/layout/SectionNav.test.tsx` (modified) - overflow-x-auto assertion

---

## Implementation order table

| Done | Priority | Task | Depends on | Effort |
|------|----------|------|------------|--------|
| [ ]  | 1        | T-1: a11y infrastructure - axeConfig + SkipLink | - | Small |
| [ ]  | 2        | T-2: Layout and filter ARIA | T-1 | Small |
| [ ]  | 3        | T-3: KpiCard ARIA remediation | - | Medium |
| [ ]  | 4        | T-4: Chart ARIA - Area, Visualization, DonutChart, BarChart | - | Medium |
| [ ]  | 5        | T-5: Heatmap ARIA + roving tabindex | WP-08 T-3 | Medium |
| [ ]  | 6        | T-6: Section axe assertions + reduced-motion audit | T-1, T-2, T-3, T-4, T-5 | Medium |
| [ ]  | 7        | T-7: Responsive layout - mobile and tablet breakpoints | - | Small |
