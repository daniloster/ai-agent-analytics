# SPEC: WP-09 - Accessibility, Responsive Layout & Quality Pass

**Date:** 2026-06-26 (revised 2026-06-27: responsive layout added to scope)
**Working Package:** WP-09
**Depends on:** WP-05, WP-06, WP-07, WP-08
**Effort:** Medium-Large

---

## Assumptions (confirmed or defaulted)

- Skip-to-content link at top of DashboardLayout; it is the first focusable element and jumps to `id="main-content"`.
- All SVG data elements must carry: `role="listitem"`, `tabIndex={0}`, `aria-label`, `onKeyDown` for Enter/Space tooltip activation, `onFocus`/`onBlur` for show/hide tooltip.
- SVG groups wrapping data elements must carry `role="list"` and a descriptive `aria-label`.
- "Insufficient data" states must use `role="status"` so screen readers announce the message.
- Color contrast target: WCAG AA 4.5:1 for all text (axis labels, tick labels, KPI values) against chart backgrounds in both light and dark mode.
- `prefers-reduced-motion: reduce` disables all chart mount animations.
- This WP audits and fixes - it does not add new features. Most ARIA work should already be present from WP-03 through WP-08.
- **Responsive breakpoints (Tailwind defaults):**

| Token | Min-width | Target devices |
|-------|-----------|----------------|
| (none) | 0px | Mobile portrait (320-639px) |
| `sm` | 640px | Mobile landscape / small tablet |
| `lg` | 1024px | Desktop |

Only three tiers are required. The `md` (768px) tier is not used to keep variants minimal. All bare grid/flex/padding classes must be audited for mobile impact.

---

## 1. Context

This WP implements the accessibility audit and remediation described in WP-09 of `docs/20260626-analytics-dashboard-plan.md`. Scope was revised on 2026-06-27 to also include responsive layout fixes - the mobile view at sub-640px widths is broken because all grid columns, paddings, and the sticky header use fixed desktop values.

It AUDITS every chart component (from WP-03) and every section component (from WP-05 through WP-08) against WCAG 2.1 AA. It then FIXES any gap found. It also adds `@axe-core/react` automated assertions to the existing Vitest suite so that future regressions are caught in CI.

The responsive layout work adds Tailwind breakpoint variants to existing Tailwind classes only. No new components, no new routes, no new KPIs or chart types.

**Files that will definitely be created:**
- `src/lib/a11y/axeConfig.ts` - axe-core configuration helper
- `src/components/layout/SkipLink.tsx` - skip-to-content link

**Files that will be modified (audit-driven; exact list determined at runtime):**
- Any chart component (`Sparkline.tsx`, `AreaChart.tsx`, `BarChart.tsx`, `DonutChart.tsx`, `Heatmap.tsx`) missing required ARIA attributes
- `src/components/layout/DashboardLayout.tsx` - add `<SkipLink>`, `id="main-content"` on main landmark, `aria-label` on `<nav>`
- `src/components/layout/SectionNav.tsx` - `aria-label="Dashboard navigation"`, `aria-controls` on each link
- `src/components/filters/FilterBar.tsx` - `aria-label="Filter dashboard data"`
- `src/components/kpis/KpiCard.tsx` - `aria-label` on info icon button; `role="status"` on insufficient-data state; focus management on info popover open

**Files that may be created (if gap discovered during audit):**
- `src/hooks/useAriaLive.ts` - `useAriaLive()` hook for tooltip aria-live announcements

---

## 2. Data model

No new domain types. The patterns below are the normative reference every chart and section component must conform to after this WP.

```ts
// Pattern: keyboard-navigable SVG data element
// Applied to: <circle>, <rect>, <path> (bar, arc, heatmap cell, sparkline point)
//
// <DataElement
//   role="listitem"
//   tabIndex={0}
//   aria-label={`${formatDate(d.date)}: ${formatValue(d.value)}`}
//   onKeyDown={(e) => {
//     if (e.key === 'Enter' || e.key === ' ') {
//       e.preventDefault()
//       showTooltip({ tooltipData: d, tooltipLeft: cx, tooltipTop: cy })
//     }
//     if (e.key === 'Escape') hideTooltip()
//   }}
//   onFocus={() => showTooltip({ tooltipData: d, tooltipLeft: cx, tooltipTop: cy })}
//   onBlur={() => hideTooltip()}
// />

// Pattern: data group container
// <g role="list" aria-label="{Chart title} data">
//   {data.map((d, i) => <DataElement key={i} ... />)}
// </g>

// Pattern: chart wrapper at the section (consumer) level - NOT inside the chart primitive
// <figure aria-labelledby="chart-{id}-caption">
//   <figcaption id="chart-{id}-caption">{Human-readable chart description}</figcaption>
//   <AreaChart ... />
// </figure>

// Pattern: tooltip aria-live region (rendered inside chart or section wrapper)
// <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
//   {tooltipData ? `${formatDate(tooltipData.date)}: ${formatValue(tooltipData.value)}` : ''}
// </div>

// Pattern: insufficient data state in KpiCard
// <p role="status" aria-live="polite">Insufficient data - fewer than 10 rated runs</p>
```

---

## 3. Component / module design

### New files

**`src/lib/a11y/axeConfig.ts`** (new)
- Exports `checkA11y(container: Element): Promise<void>`
- Internally calls `axe.run(container, { rules: { 'color-contrast': { enabled: true }, 'keyboard': { enabled: true }, 'aria-required-attr': { enabled: true }, 'aria-valid-attr-value': { enabled: true } } })`
- Throws an `Error` listing all violations if `results.violations.length > 0`; otherwise resolves

```ts
// src/lib/a11y/axeConfig.ts
import axe from 'axe-core'

export async function checkA11y(container: Element): Promise<void>
```

**`src/components/layout/SkipLink.tsx`** (new)
- Renders `<a href="#main-content">` as the very first child of `DashboardLayout`
- Uses Tailwind `sr-only` at rest and `focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50` to appear on focus
- Styled as a shadcn/ui `<Button>` variant for consistent focus ring

```tsx
// src/components/layout/SkipLink.tsx
export function SkipLink(): JSX.Element
```

**`src/hooks/useAriaLive.ts`** (new, only if tooltip `role="status"` inline pattern is insufficient)
- Returns `{ ref: React.RefObject<HTMLDivElement>, announce: (message: string) => void }`
- `announce` sets the text content of the live region; clears after 500ms to allow re-announcement of the same value

```ts
// src/hooks/useAriaLive.ts
export function useAriaLive(): { ref: React.RefObject<HTMLDivElement>; announce: (message: string) => void }
```

### Audit checklist per component category

**Chart primitives (src/components/charts/)** - verify and fix:
- `Sparkline.tsx`: data points are `<circle role="listitem" tabIndex={0} aria-label="..." onKeyDown onFocus onBlur>`; wrapping `<g role="list" aria-label="...">`; tooltip `role="status"` aria-live region present
- `AreaChart.tsx`: same pattern on `<circle>` data hit targets; `<LinearGradient>` has `aria-hidden="true"`
- `BarChart.tsx`: each `<Bar>` (rect) has role/tabIndex/aria-label/keyboard handlers; `<BarStack>` segments individually labeled
- `DonutChart.tsx`: each `<Arc>` segment has role/tabIndex/aria-label; `innerRadius` label text has `aria-hidden="true"` (announced via arc aria-label instead)
- `Heatmap.tsx`: each `<HeatmapRect>` cell has role/tabIndex/`aria-label="date: uptime%"`; cells navigable via arrow keys (implement `onKeyDown` for ArrowRight/ArrowLeft/ArrowUp/ArrowDown)

**Layout (src/components/layout/)** - verify and fix:
- `DashboardLayout.tsx`: `<SkipLink>` is first child; `<main id="main-content" tabIndex={-1}>` wraps scrollable content; `<nav aria-label="Dashboard navigation">` wraps SectionNav
- `SectionNav.tsx`: `aria-label="Dashboard sections"` on `<ul>`; each `<a>` has `aria-current="true"` when its section is active (via IntersectionObserver)
- `FilterBar.tsx`: `<div role="search" aria-label="Filter dashboard data">` wraps date + team controls; DateRangePicker trigger button has `aria-label="Select date range, currently {value}"`; TeamSelector trigger has `aria-label="Filter by team, currently {value}"`

**KPI components (src/components/kpis/)** - verify and fix:
- `KpiCard.tsx`:
  - Info icon button: `aria-label="Formula and example for {label}"`
  - Popover: when it opens, move focus into it (`autoFocus` on first focusable element inside); on close, return focus to info button
  - Insufficient data: `<p role="status" aria-live="polite">Insufficient data...</p>`
  - Delta badge: `aria-label="{+/-}{value}% compared to prior period"` (not just visual arrow)
  - Sparkline slot inside KpiCard: `aria-hidden="true"` (the KpiCard itself conveys the value; sparkline is decorative in this context)

**Section components (src/components/sections/)** - verify and fix:
- Each chart usage must be wrapped in `<figure aria-labelledby="..."><figcaption id="...">...</figcaption><ChartComponent .../></figure>`
- Each section `<section>` must have `id="section-executive"` (etc.) and `aria-labelledby` pointing to its heading

### Responsive layout audit (new scope)

Current state (read from files, 2026-06-27):

**`DashboardLayout.tsx`** (`<header>` and `<main>`):
- `<header className="bg-card border-b border-border h-14 px-8 flex items-center justify-between">` - rigid `h-14`, fixed `px-8`, no wrap. On 375px the brand name + two filter controls overflow.
- `<main className="px-8 py-7 max-w-[1440px] mx-auto flex flex-col gap-8">` - fixed `px-8`, no responsive variants.

**`SectionNav.tsx`**:
- `<nav className="flex border-b border-border bg-card px-8">` - no `overflow-x-auto`; four links overflow on narrow screens. Fixed `px-8`.

**`FilterBar.tsx`**:
- `<div className="flex items-center gap-3">` - always horizontal. Two controls side by side; they can wrap if the header allows it.

**Section grid layouts** (all bare, no responsive variants):
- `Overview.tsx`: `grid-cols-4` (x2), `grid-cols-2`
- `Reliability.tsx`: `grid-cols-4` (x4), `grid-cols-2` (x2)
- `TeamBreakdown.tsx`: `grid-cols-4`, `grid-cols-2`
- `Billing.tsx`: `grid-cols-3` (x4), `grid-cols-2` (x3)

**Required changes:**

```tsx
// DashboardLayout.tsx - header
// from: "bg-card border-b border-border h-14 px-8 flex items-center justify-between"
// to:   "bg-card border-b border-border min-h-14 h-auto flex flex-wrap items-center justify-between gap-x-4 px-4 py-2 sm:px-8 sm:h-14 sm:flex-nowrap sm:py-0"

// DashboardLayout.tsx - main
// from: "px-8 py-7 max-w-[1440px] mx-auto flex flex-col gap-8"
// to:   "px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-7 max-w-[1440px] mx-auto flex flex-col gap-4 sm:gap-6 lg:gap-8"

// SectionNav.tsx - nav
// from: "flex border-b border-border bg-card px-8"
// to:   "flex overflow-x-auto border-b border-border bg-card px-4 sm:px-8"

// FilterBar.tsx - wrapper div
// from: "flex items-center gap-3"
// to:   "flex flex-wrap items-center gap-2 sm:gap-3"

// All sections - grid-cols-4
// from: "grid grid-cols-4 gap-4"
// to:   "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"

// All sections - grid-cols-3
// from: "grid grid-cols-3 gap-4"
// to:   "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"

// All sections - grid-cols-2
// from: "grid grid-cols-2 gap-4"
// to:   "grid grid-cols-1 sm:grid-cols-2 gap-4"
```

Note: `Section.tsx` uses `scrollMarginTop: '104px'` (header 56px + SectionNav 48px). On mobile the header may be taller when it wraps. Change to `scrollMarginTop: '120px'` as a conservative buffer; exact value should be verified against the wrapped mobile header height.

---

## 4. Interaction diagram

### Keyboard navigation flow

```
Browser address bar
  Tab
    --> SkipLink "Skip to content" (sr-only -> visible on focus)
    Enter --> focus jumps to <main id="main-content" tabIndex={-1}>

  Tab (continuing from address bar without activating SkipLink)
    --> DateRangePicker trigger button (aria-label="Select date range, currently Last 30 days")
    --> TeamSelector trigger (aria-label="Filter by team, currently All teams")
    --> SectionNav: "Overview" link (aria-current="true" if in view)
    --> SectionNav: "Teams" link
    --> SectionNav: "Reliability" link
    --> SectionNav: "Billing" link

  Tab into Section 1
    --> KpiCard info icon for "Total Runs" (aria-label="Formula and example for Total Runs")
    Enter --> Popover opens; focus moves inside popover
    Escape --> Popover closes; focus returns to info icon button
    Tab (popover closed) --> next KpiCard info icon

  Tab into first chart (Token Consumption AreaChart)
    --> first data point circle (role="listitem", tabIndex=0)
    Enter/Space --> tooltip shown; aria-live region announces "Jan 15: 82.4M tokens"
    Escape --> tooltip hidden; focus stays on data point
    Tab --> next data point
    Tab (past last point) --> next focusable element (next chart or next section)

Heatmap (Availability / Cost Anomaly):
  Tab --> first cell (role="listitem", tabIndex=0, aria-label="June 1: 100% uptime")
  ArrowRight --> next cell (tabIndex managed via roving tabindex pattern)
  ArrowLeft --> previous cell
  Enter/Space --> tooltip shown for that cell
  Escape --> tooltip hidden
```

### axe-core integration in tests

```
Test render
  --> render(<SectionComponent />) wrapped in QueryClient + MSW
  --> await checkA11y(container)
      --> axe.run(container, rules)
      --> results.violations === [] --> test passes
      --> results.violations.length > 0 --> throw Error(violations.map(v => v.description).join('\n'))
```

---

## 5. Acceptance criteria

1. Tab through the full dashboard with no mouse - every interactive element receives focus in logical DOM order with no skipped or trapped elements.
2. The skip-to-content link is visually hidden at rest (sr-only); it becomes visible when focused; activating it (Enter) moves focus to `id="main-content"`.
3. All 31 Heatmap cells in the availability calendar are individually reachable via Tab and arrow keys; pressing Enter on a cell shows a tooltip.
4. All BarChart bars are reachable by Tab; pressing Enter shows the bar's value tooltip; tooltip content is announced in the aria-live region.
5. All DonutChart arcs are reachable by Tab; each has an `aria-label` with its category name and percentage.
6. `axe-core` reports zero violations when `checkA11y` is called on each of the four section components rendered in Vitest.
7. The axe `color-contrast` rule passes for chart axis labels, tick labels, KpiCard metric values, and delta badge text in both light and dark color schemes.
8. "Insufficient data" text in KpiCard is wrapped in `role="status" aria-live="polite"` and is announced to screen readers without requiring user interaction.
9. The KpiCard info popover receives focus when it opens; pressing Escape closes it and returns focus to the info icon button.
10. With `prefers-reduced-motion: reduce` set in CSS, chart mount animations (opacity/scale transitions) are suppressed - verified by checking that the relevant Tailwind `motion-safe:` class is applied to animation utilities, not bare `transition`.
11. Every `<section>` element has an `aria-labelledby` attribute pointing to its visible heading.
12. SectionNav active link has `aria-current="true"` when its target section intersects the viewport.
13. At 375px viewport width, the sticky header fits within one or two lines without horizontal overflow (no scrollbar on the x-axis of the header).
14. At 375px viewport width, the SectionNav is fully usable - all four links are reachable by horizontal scroll, with no clipped text.
15. At 375px viewport width, KpiCard grids render as a single column (one card per row).
16. At 640px viewport width, KpiCard grids render as two columns.
17. At 1024px viewport width, `grid-cols-4` grids render as four columns and `grid-cols-3` grids render as three columns.
18. `<main>` padding is `px-4` (16px) at mobile and increases to `px-8` (32px) at 1024px.

---

## 6. Out of scope

- WCAG 2.1 AAA (only AA is required per investigation D-13)
- Screen reader testing on production browsers (VoiceOver, NVDA, JAWS) - manual testing only, not automated
- Internationalization / RTL layout (out of scope for v1)
- Automated visual contrast measurement via screenshot diffing
- Native mobile app or PWA offline support
- Tailwind `md` (768px) breakpoint tier - only `sm` (640px) and `lg` (1024px) are used to keep variant count minimal
- Automated Playwright/Cypress viewport tests - manual browser testing at 375px and 1024px is sufficient for this WP

---

## Test plan

| File | What it tests |
|------|---------------|
| `src/lib/a11y/axeConfig.test.ts` (new) | `checkA11y` resolves on an accessible element; `checkA11y` rejects with violation description on element missing required `aria-label` |
| `src/components/layout/SkipLink.test.ts` (new) | Renders with `sr-only` class by default; gains visibility classes on focus (simulated); `href` is `#main-content` |
| `src/hooks/useAriaLive.test.ts` (new, if hook created) | `announce("message")` sets live region text; text is cleared after 500ms |
| `src/components/charts/AreaChart.test.ts` (modified) | All data circles have `role="listitem"`, `tabIndex={0}`, non-empty `aria-label`; wrapping `<g>` has `role="list"` |
| `src/components/charts/BarChart.test.ts` (modified) | All Bar rects have `role="listitem"`, `tabIndex={0}`, non-empty `aria-label`; keyboard Enter triggers tooltip |
| `src/components/charts/DonutChart.test.ts` (modified) | All Arc paths have `role="listitem"`, `tabIndex={0}`, `aria-label` with category and percentage |
| `src/components/charts/Heatmap.test.ts` (modified) | All cells have `role="listitem"`, `tabIndex` managed via roving tabindex; axe-core check passes on full heatmap render |
| `src/components/sections/Overview.test.ts` (modified) | axe check passes; each chart is inside `<figure>` with `<figcaption>`; section has `aria-labelledby` |
| `src/components/sections/TeamBreakdown.test.ts` (modified) | axe check passes; section has `aria-labelledby` |
| `src/components/sections/Reliability.test.ts` (modified) | axe check passes; section has `aria-labelledby` |
| `src/components/sections/Billing.test.ts` (modified) | axe check passes; section has `aria-labelledby` |
| `src/components/kpis/KpiCard.test.ts` (modified) | Info button has correct `aria-label`; insufficient-data state has `role="status"`; popover focuses first element on open; Escape closes popover and returns focus to info button |
| `src/components/layout/DashboardLayout.test.tsx` (modified) | Header has `min-h-14` and `flex-wrap`; main has `px-4` in base class |
| `src/components/layout/SectionNav.test.tsx` (modified) | nav has `overflow-x-auto` |
| Manual - 375px viewport | Header does not overflow; SectionNav scrolls; KpiCard grids are single-column |
| Manual - 1024px viewport | KpiCard grids are 4/3 columns as designed; paddings are at full width |
