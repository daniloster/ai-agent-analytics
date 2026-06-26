# TASKS: WP-05 - Section 1 Overview

**SPEC:** `docs/20260626-wp05-executive-overview-spec.md`
**Date:** 2026-06-26

---

## T-1: KPI formula functions

**Context**

Implements SPEC §2 `src/lib/kpi/formulas.ts`. These are the pure computation functions that derive KPI values from raw API fields. They have no React or signal dependencies - they are plain TypeScript functions that take numbers (or null) and return numbers (or null). They must exist before `Overview.tsx` (T-8) can compute any KPI value from `OverviewResponse`.

Read `src/types/api.ts` before starting to understand `OverviewResponse` field names (`total_cost`, `mau`, `avg_quality_score`, `rated_run_count`, etc.) that the callers will pass in.

**Requirements**

1. Create `src/lib/kpi/formulas.ts` exporting exactly the six functions listed in SPEC §2.
2. `computeRetentionCost(totalCost: number, mau: number): number` must return `totalCost / mau`; must return `0` when `mau === 0` (no division by zero).
3. `computeCostPerQualityPoint(totalCost: number, ratedRunCount: number, avgQualityScore: number | null): number | null` must return `null` when `avgQualityScore` is `null` OR when `ratedRunCount < 10`.
4. `computeCostPerAcceptedOutput(totalCost: number, runCount: number, acceptanceRate: number | null): number | null` must return `null` when `acceptanceRate` is `null`.
5. `computeQualityCostEfficiency(avgQuality: number | null, acceptanceRate: number | null, costPerRun: number): number | null` must return `(avgQuality * acceptanceRate) / costPerRun`; must return `null` when either `avgQuality` or `acceptanceRate` is `null`.
6. `computeProjectedMonthEnd(currentSpend: number, daysElapsed: number, daysInMonth: number): number` must return `(currentSpend / daysElapsed) * daysInMonth`; must return `0` when `daysElapsed === 0`.
7. `computeDeltaPercent(current: number, prior: number): number` must return `(current - prior) / prior * 100`; must return `0` when `prior === 0`.
8. All functions must be pure - no side effects, no imports from React, signals, or other modules.
9. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- Return `null` (not `NaN` or `0`) for insufficient-data cases so callers can distinguish "we have a value of zero" from "we cannot compute this". The `Overview` component uses `null` to trigger the `insufficientData` flag on KpiCard.
- `computeCostPerQualityPoint` uses `ratedRunCount < 10` as the reliability threshold per SPEC §2 and assumption bullet 3.
- `computeProjectedMonthEnd` guard (`daysElapsed === 0`) prevents division by zero at month boundaries.

**Design**

```ts
// src/lib/kpi/formulas.ts  (new file)

export function computeRetentionCost(totalCost: number, mau: number): number
// totalCost / mau; returns 0 when mau === 0

export function computeCostPerQualityPoint(
  totalCost: number,
  ratedRunCount: number,
  avgQualityScore: number | null
): number | null
// returns null when avgQualityScore is null OR ratedRunCount < 10
// returns totalCost / (ratedRunCount * avgQualityScore) otherwise

export function computeCostPerAcceptedOutput(
  totalCost: number,
  runCount: number,
  acceptanceRate: number | null
): number | null
// returns null when acceptanceRate is null
// returns totalCost / (runCount * acceptanceRate) otherwise

export function computeQualityCostEfficiency(
  avgQuality: number | null,
  acceptanceRate: number | null,
  costPerRun: number
): number | null
// returns (avgQuality * acceptanceRate) / costPerRun
// returns null when avgQuality or acceptanceRate is null

export function computeProjectedMonthEnd(
  currentSpend: number,
  daysElapsed: number,
  daysInMonth: number
): number
// (currentSpend / daysElapsed) * daysInMonth; returns 0 when daysElapsed === 0

export function computeDeltaPercent(current: number, prior: number): number
// (current - prior) / prior * 100; returns 0 when prior === 0
```

**Acceptance criteria**

1. `computeRetentionCost(14200, 340)` returns approximately `41.76` (within floating point tolerance).
2. `computeRetentionCost(14200, 0)` returns `0` without throwing.
3. `computeCostPerQualityPoint(14200, 8200, 4.1)` returns a value between `0.421` and `0.423`.
4. `computeCostPerQualityPoint(14200, 5, 4.1)` returns `null` (ratedRunCount < 10 threshold).
5. `computeCostPerQualityPoint(14200, 8200, null)` returns `null`.
6. `computeDeltaPercent(120, 100)` returns `20`.
7. `computeDeltaPercent(80, 100)` returns `-20`.
8. `computeDeltaPercent(100, 0)` returns `0` without throwing.
9. `computeProjectedMonthEnd(0, 0, 30)` returns `0` without throwing.
10. `npx tsc --noEmit` reports zero errors after this task.

**Test Plan**

- `src/lib/kpi/formulas.test.ts` (new)
  - Scenario: `computeRetentionCost` happy path - correct division result.
  - Scenario: `computeRetentionCost` mau=0 guard - returns 0, does not throw.
  - Scenario: `computeCostPerQualityPoint` returns null when `avgQualityScore` is null.
  - Scenario: `computeCostPerQualityPoint` returns null when `ratedRunCount < 10`.
  - Scenario: `computeCostPerQualityPoint` returns correct value for known inputs (14200, 8200, 4.1).
  - Scenario: `computeCostPerAcceptedOutput` returns null when `acceptanceRate` is null.
  - Scenario: `computeCostPerAcceptedOutput` returns correct value for known inputs.
  - Scenario: `computeQualityCostEfficiency` returns null when `avgQuality` is null.
  - Scenario: `computeQualityCostEfficiency` returns null when `acceptanceRate` is null.
  - Scenario: `computeQualityCostEfficiency` returns correct value for known inputs.
  - Scenario: `computeProjectedMonthEnd` proportional projection - `computeProjectedMonthEnd(300, 10, 30)` returns 900.
  - Scenario: `computeProjectedMonthEnd` daysElapsed=0 returns 0 without throwing.
  - Scenario: `computeDeltaPercent` positive delta (120, 100) returns 20.
  - Scenario: `computeDeltaPercent` negative delta (80, 100) returns -20.
  - Scenario: `computeDeltaPercent` zero delta (100, 100) returns 0.
  - Scenario: `computeDeltaPercent` prior=0 returns 0 without throwing.

**Files**

- `src/lib/kpi/formulas.ts` (new) - six pure KPI computation functions
- `src/lib/kpi/formulas.test.ts` (new) - unit tests for all functions and edge cases

---

## T-2: KPI formatter functions

**Context**

Implements SPEC §2 `src/lib/kpi/formatters.ts`. These are the pure display formatting functions that convert raw numbers into human-readable strings for KpiCard `value` and `subValue` props. They have no React or signal dependencies. They must exist before `KpiCard` (T-5) and `Overview` (T-8) can build display strings.

No existing formatter pattern in this project - these are new utilities. Per ARCHITECTURE.md §2.3, since they are used by both `KpiCard` and `Overview`, they belong in `src/lib/kpi/` (single-owner module, not `src/utils/` which requires two distinct call sites before extraction).

**Requirements**

1. Create `src/lib/kpi/formatters.ts` exporting exactly the six functions listed in SPEC §2.
2. `formatCurrency(n: number): string` must use three display tiers: `n < 1` formats as `"$0.42"` (2 decimal places); `n >= 1_000_000` formats as `"$1.4M"` (1 decimal, no trailing zero suppression); `n >= 1000` (and < 1M) formats as `"$14,200"` (no decimals, comma separator); otherwise formats as `"$0.42"`-style with 2 decimals.
3. `formatTokens(n: number): string` must use three tiers: `n >= 1_000_000_000` formats as `"2.41B"` (2 decimals); `n >= 1_000_000` formats as `"241M"` (no decimals when integer, 1 decimal otherwise - see note); `n >= 1000` formats as `"842K"` (no decimals); below 1000 formats as locale integer.
4. `formatPercent(n: number, decimals?: number): string` must default to 1 decimal place and append `"%"`: `formatPercent(72.5)` returns `"72.5%"`, `formatPercent(72.5, 0)` returns `"73%"`.
5. `formatDuration(ms: number): string` must use two tiers: `ms < 60_000` returns `"47s"` format (whole seconds, no padding); `ms >= 60_000` returns `"2m 3s"` format (minutes and remaining whole seconds).
6. `formatQuality(score: number): string` must return `"4.1 / 5.0"` format (1 decimal for score, fixed `"/ 5.0"` suffix).
7. `formatNumber(n: number): string` must return locale-formatted integer with thousands separator: `formatNumber(12450)` returns `"12,450"`. Use `n.toLocaleString('en-US', { maximumFractionDigits: 0 })`.
8. All functions must be pure - no imports from React, signals, or other modules.
9. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- `formatCurrency` thresholds: `n < 1` (sub-dollar for cost-per-quality-point values like $0.42), `n >= 1_000_000` (millions for annual projections), `n >= 1000` (thousands for monthly costs). Handle the range `[1, 1000)` as 2-decimal fallback.
- `formatTokens` note: `"241M"` means no decimals when the M value is a whole number; `"1.4M"` when it isn't. Use `n >= 1_000_000 ? (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + 'M'` or equivalent logic that avoids unnecessary decimals.
- `formatDuration` uses integer seconds: `Math.round(ms / 1000)` for the total seconds, then floor division for minutes and remainder for seconds.
- `formatNumber` locale: use `'en-US'` explicitly so test environments produce consistent output regardless of system locale.

**Design**

```ts
// src/lib/kpi/formatters.ts  (new file)

export function formatCurrency(n: number): string
// tiers: < $1 -> "$0.42"; >= $1M -> "$1.4M"; >= $1000 -> "$14,200"; else "$0.42"

export function formatTokens(n: number): string
// tiers: >= 1B -> "2.41B"; >= 1M -> "241M" or "1.4M"; >= 1K -> "842K"; else locale int

export function formatPercent(n: number, decimals?: number): string
// default 1 decimal, appends "%"

export function formatDuration(ms: number): string
// < 60s -> "47s"; >= 60s -> "2m 3s"

export function formatQuality(score: number): string
// "4.1 / 5.0"

export function formatNumber(n: number): string
// locale thousands separator, en-US, no decimals
```

**Acceptance criteria**

1. `formatCurrency(0.42)` returns `"$0.42"`.
2. `formatCurrency(14200)` returns `"$14,200"`.
3. `formatCurrency(1_400_000)` returns `"$1.4M"`.
4. `formatTokens(842_000)` returns `"842K"`.
5. `formatTokens(241_000_000)` returns `"241M"`.
6. `formatTokens(2_410_000_000)` returns `"2.41B"`.
7. `formatDuration(47_000)` returns `"47s"`.
8. `formatDuration(123_000)` returns `"2m 3s"`.
9. `formatPercent(72.5)` returns `"72.5%"`.
10. `formatPercent(72.5, 0)` returns `"73%"`.
11. `formatNumber(12450)` returns `"12,450"`.
12. `formatQuality(4.1)` returns `"4.1 / 5.0"`.

**Test Plan**

- `src/lib/kpi/formatters.test.ts` (new)
  - Scenario: `formatCurrency` sub-dollar value ($0.42).
  - Scenario: `formatCurrency` thousands value ($14,200).
  - Scenario: `formatCurrency` millions value ($1.4M).
  - Scenario: `formatTokens` thousands (842K).
  - Scenario: `formatTokens` whole millions (241M).
  - Scenario: `formatTokens` fractional millions (1.4M).
  - Scenario: `formatTokens` billions (2.41B).
  - Scenario: `formatDuration` seconds only (47s).
  - Scenario: `formatDuration` minutes and seconds (2m 3s).
  - Scenario: `formatPercent` default 1 decimal (72.5%).
  - Scenario: `formatPercent` 0 decimal places (73%).
  - Scenario: `formatNumber` thousands separator (12,450).
  - Scenario: `formatQuality` correct format (4.1 / 5.0).

**Files**

- `src/lib/kpi/formatters.ts` (new) - six pure display formatting functions
- `src/lib/kpi/formatters.test.ts` (new) - unit tests for all formatters and format boundaries

---

## T-3: Card UI component

**Context**

Creates `src/components/ui/card.tsx` following the shadcn/ui Card pattern. The shadcn/ui Card is NOT backed by a Radix UI primitive - it is plain styled `div` elements. `KpiCard` (T-5) requires this component and cannot be built without it. WP-04 (T-1) installed shadcn/ui primitives but Card was not included in that task.

Read `src/components/ui/skeleton.tsx` (WP-04 T-1) before implementing - it shows the pattern for a shadcn/ui component file in this project (uses `cn()` from `src/lib/utils.ts`, named exports, `function` declaration style per ARCHITECTURE.md §4.3).

**Requirements**

1. Create `src/components/ui/card.tsx` exporting five named components: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`.
2. `Card` must render a `<div>` with classes `rounded-lg border bg-card text-card-foreground shadow-sm`; it must accept and forward `className` and any `HTMLDivElement` attributes via `React.HTMLAttributes<HTMLDivElement>`.
3. `CardHeader` must render a `<div>` with classes `flex flex-col space-y-1.5 p-6`; accepts and forwards `className` and div attributes.
4. `CardTitle` must render an `<h3>` (semantic heading) with classes `text-2xl font-semibold leading-none tracking-tight`; accepts and forwards `className` and `HTMLHeadingElement` attributes.
5. `CardDescription` must render a `<p>` with classes `text-sm text-muted-foreground`; accepts and forwards `className` and paragraph attributes.
6. `CardContent` must render a `<div>` with classes `p-6 pt-0`; accepts and forwards `className` and div attributes.
7. All components must use `cn()` from `src/lib/utils.ts` for className merging.
8. All components must be `function` declarations (not arrow functions) per ARCHITECTURE.md §4.3.
9. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- No Radix UI primitive required for Card - it is purely structural HTML. This is the same pattern shadcn/ui uses for its Card component.
- `bg-card` and `text-card-foreground` are CSS custom property tokens defined in `src/index.css` (same pattern as other Tailwind semantic color tokens used in the project).
- `CardFooter` is NOT required by WP-05 - do not add it. Add only what is needed.

**Design**

```tsx
// src/components/ui/card.tsx  (new file)
import { cn } from '../../lib/utils'

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): JSX.Element
// renders: <div className={cn('rounded-lg border bg-card text-card-foreground shadow-sm', className)} {...props} />

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): JSX.Element
// renders: <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>): JSX.Element
// renders: <h3 className={cn('text-2xl font-semibold leading-none tracking-tight', className)} {...props} />

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>): JSX.Element
// renders: <p className={cn('text-sm text-muted-foreground', className)} {...props} />

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>): JSX.Element
// renders: <div className={cn('p-6 pt-0', className)} {...props} />
```

**Acceptance criteria**

1. `<Card />` renders a `div` with `rounded-lg` and `border` in its class list.
2. `<Card className="extra" />` renders a `div` with both `rounded-lg` and `extra` in its class list.
3. `<CardContent>hello</CardContent>` renders a `div` containing the text `"hello"`.
4. `<CardTitle>My Title</CardTitle>` renders an `h3` containing `"My Title"`.
5. `<CardHeader>` renders a `div` with `flex` in its class list.
6. `npx tsc --noEmit` reports zero errors after this task.

**Test Plan**

- `src/components/ui/card.test.tsx` (new)
  - Scenario: `Card` renders a div with `rounded-lg` and `border` classes.
  - Scenario: `Card` forwards additional `className` alongside default classes.
  - Scenario: `CardContent` renders children inside a div.
  - Scenario: `CardTitle` renders as an `h3` element.
  - Scenario: `CardHeader` renders a div with `flex` class.

**Files**

- `src/components/ui/card.tsx` (new) - Card, CardHeader, CardTitle, CardDescription, CardContent styled div wrappers
- `src/components/ui/card.test.tsx` (new) - rendering and className merging tests

---

## T-4: Sparkline chart component

**Context**

Creates `src/components/charts/Sparkline.tsx` - the miniature trend chart used in the optional sparkline slot of `KpiCard` (T-5). A Sparkline is a `Visualization` instance (WP-03, `src/components/charts/Visualization.tsx`) configured with both axes hidden (margin collapses to zero), an Area mark for the trend line, and no interactive overlays. It accepts a simple `Array<{ date: string; value: number }>` so callers do not need to know about `Visualization`'s generic API.

Read `src/components/charts/Visualization.tsx` in full before implementing - understand `VisualizationProps`, `AxisConfig`, `defineAxes`, and how `children` receives `VisMark`. Also read `src/components/charts/marks/Area.tsx` to understand `AreaProps` (specifically the `series` and `axis` id strings).

**Requirements**

1. Create `src/components/charts/Sparkline.tsx` exporting `function Sparkline(props: SparklineProps): JSX.Element`.
2. `SparklineProps` must include: `data: Array<{ date: string; value: number }>`, `color?: string`, `height?: number`.
3. `Sparkline` must wrap `Visualization` from `src/components/charts/Visualization.tsx` with `data={{ trend: props.data }}` (signal-compatible shape using `useDeepComputed` or `useSignal`).
4. `Sparkline` must configure two axes using `defineAxes`: `{ id: 'x', type: 'time', position: 'bottom', accessor: (d) => new Date((d as { date: string }).date), hidden: true }` and `{ id: 'y', type: 'linear', position: 'left', accessor: (d) => (d as { value: number }).value, hidden: true }`.
5. `Sparkline` must render one `<Area series="trend" axis="y" color={props.color} fillOpacity={0.15} />` inside `Visualization`'s children callback.
6. `Sparkline` must forward `height` to `Visualization` (default `40` when `height` is undefined).
7. `Sparkline` must NOT render axes, labels, tooltips, or grid lines - it is decoration only.
8. The `data` prop passed to `Visualization` must be a `ReadonlySignal`. Use `useDeepComputed(() => ({ trend: props.data }))` to convert the array prop to a signal. This follows the signal subscription strategy in ARCHITECTURE.md §3.2.
9. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- `Visualization` requires `data: ReadonlySignal<TData>`. Using `useDeepComputed(() => ({ trend: props.data }))` creates a stable signal that updates when `props.data` changes without triggering unnecessary re-renders when the array is structurally identical (deep equal).
- Both axes have `hidden: true`. `Visualization` returns `ZERO_MARGIN` when all axes are hidden, so the Area mark fills the full height without any padding for labels.
- `fillOpacity: 0.15` is intentionally lighter than the default `0.3` in the Area mark - sparklines are decorative and should not overpower the KPI value text.
- Do not add `ariaLabel` to `Visualization` - the sparkline is decorative; the KpiCard itself carries the accessible label for its value.

**Design**

```tsx
// src/components/charts/Sparkline.tsx  (new file)
import { useDeepComputed } from '../../hooks/useDeepComputed'
import { Visualization, defineAxes } from './Visualization'
import { Area } from './marks/Area'

export interface SparklineProps {
  data: Array<{ date: string; value: number }>
  color?: string
  height?: number
}

// Hoisted - no component-scope variables captured.
const SPARKLINE_AXES = defineAxes([
  {
    id: 'x',
    type: 'time' as const,
    position: 'bottom' as const,
    accessor: (d) => new Date((d as { date: string }).date),
    hidden: true,
  },
  {
    id: 'y',
    type: 'linear' as const,
    position: 'left' as const,
    accessor: (d) => (d as { value: number }).value,
    hidden: true,
  },
])

export function Sparkline({ data, color, height = 40 }: SparklineProps): JSX.Element
// const dataSig = useDeepComputed(() => ({ trend: data }))
// return (
//   <Visualization data={dataSig} axes={SPARKLINE_AXES} height={height}>
//     {({ Area: AreaMark }) => <AreaMark series="trend" axis="y" color={color} fillOpacity={0.15} />}
//   </Visualization>
// )
```

**Acceptance criteria**

1. `<Sparkline data={[{ date: '2026-06-01', value: 10 }, { date: '2026-06-02', value: 20 }]} />` renders an SVG element in the DOM.
2. The rendered SVG contains at least one `<path>` element (the Area mark's AreaClosed path).
3. No `<text>` elements are rendered (no axis labels, no tick marks).
4. Rendering `<Sparkline data={[]} />` does not throw (empty data guard handled by Area mark's null return).
5. The SVG height attribute equals the `height` prop value (default 40) plus any zero margin.

**Test Plan**

- `src/components/charts/Sparkline.test.tsx` (new)
  - Scenario: renders an SVG when given non-empty data.
  - Scenario: SVG contains at least one `<path>` element.
  - Scenario: no `<text>` elements in the DOM (no axis labels).
  - Scenario: empty `data` array does not throw.
  - Scenario: custom `height` prop is passed to `Visualization`.

**Files**

- `src/components/charts/Sparkline.tsx` (new) - minimal Area-based trend chart with hidden axes
- `src/components/charts/Sparkline.test.tsx` (new) - rendering and empty-data tests

---

## T-5: KpiCard atom

**Context**

Implements SPEC §3 `src/components/kpis/KpiCard.tsx` - the atomic unit that all four section organisms (WP-05 through WP-08) reuse. It is the container for a single KPI metric: a label, a formatted value, optional sub-value, optional delta badge, optional sparkline, and an info popover with formula/example text. This task also wires the loading skeleton state and the `insufficientData` overlay.

Read `src/components/ui/card.tsx` (T-3), `src/components/ui/skeleton.tsx` (WP-04 T-1), `src/components/ui/popover.tsx` (WP-04 T-1), and `src/components/charts/Sparkline.tsx` (T-4) before implementing. The component must follow ARCHITECTURE.md §4.3 (`function` declaration, no `React.memo`).

**Requirements**

1. Create `src/components/kpis/KpiCard.tsx` exporting `KpiCardProps` and `function KpiCard(props: KpiCardProps): JSX.Element`.
2. `KpiCardProps` must include all fields from SPEC §2: `label`, `value` (type `string | undefined` to support loading state), `subValue?`, `delta?`, `deltaLabel?`, `trend?`, `trendColor?`, `formulaTooltip`, `exampleTooltip`, `insufficientData?`, `insufficientDataReason?`.
3. When `value === undefined`, the value slot must render `<Skeleton className="h-8 w-24" />` instead of text.
4. When `insufficientData === true`, the value slot must render a `<span role="status">Insufficient data</span>` instead of the `value` text; when `insufficientDataReason` is also provided, render it in a muted `<p>` below the span.
5. When `delta` is a number, render a badge showing `formatPercent(Math.abs(delta), 1)` with a `+` prefix when `delta > 0` and `-` prefix when `delta < 0`; badge background must be `bg-emerald-100 text-emerald-700` when `delta > 0`, `bg-red-100 text-red-700` when `delta < 0`, and `bg-muted text-muted-foreground` when `delta === 0`.
6. When `delta` is `undefined`, no badge is rendered.
7. When `deltaLabel` is provided and `delta` is a number, render `deltaLabel` as small muted text alongside the badge.
8. When `trend` is provided, render `<Sparkline data={trend} color={trendColor} />` at the bottom of the card.
9. The info icon button must render as a `<button>` element with `aria-label="More information"` containing `"?"` text; clicking it must open a `shadcn/ui Popover` containing `formulaTooltip` and `exampleTooltip` in separate `<p>` elements.
10. The Popover must close on click-outside and Escape key (handled by the shadcn/ui Popover implementation from WP-04).
11. The local popover open state must use `useSignal(false)` per ARCHITECTURE.md §3.1 (never `useState`).
12. The outer container must use `<Card>` from T-3; the header area must use `<CardHeader>`; the value area must use `<CardContent>`.
13. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- `value` typed as `string | undefined` (not `string`) because the caller passes `undefined` during TanStack Query loading. This deviates from SPEC §2 which shows `value: string`, but the SPEC comment "caller passes undefined during query loading" makes `undefined` the documented intent.
- The delta badge does NOT take an `invertDelta` prop. When a KPI needs inverted semantics (e.g. KPI-05 cost decrease = green), the caller negates the delta before passing it.
- `useSignal(false)` for popover open state is correct here - the Popover open state is ephemeral local UI state that does not need to survive re-renders.
- Do not hoist the component body's JSX helpers that close over `props` - they cannot be hoisted per ARCHITECTURE.md §4.4. Only pure formatters (imported from `src/lib/kpi/formatters.ts`) are used; those are already hoisted at the module level in their own file.

**Design**

```tsx
// src/components/kpis/KpiCard.tsx  (new file)
import { useSignal } from '@preact/signals-react'
import { Card, CardHeader, CardContent } from '../ui/card'
import { Skeleton } from '../ui/skeleton'
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover'
import { Sparkline } from '../charts/Sparkline'
import { formatPercent } from '../../lib/kpi/formatters'

export interface KpiCardProps {
  label: string
  value: string | undefined
  subValue?: string
  delta?: number
  deltaLabel?: string
  trend?: Array<{ date: string; value: number }>
  trendColor?: string
  formulaTooltip: string
  exampleTooltip: string
  insufficientData?: boolean
  insufficientDataReason?: string
}

export function KpiCard(props: KpiCardProps): JSX.Element
// local: const open = useSignal(false)
// renders:
//   <Card>
//     <CardHeader>
//       {props.label}
//       <Popover open={open.value} onOpenChange={v => { open.value = v }}>
//         <PopoverTrigger asChild>
//           <button aria-label="More information">?</button>
//         </PopoverTrigger>
//         <PopoverContent>
//           <p>{props.formulaTooltip}</p>
//           <p>{props.exampleTooltip}</p>
//         </PopoverContent>
//       </Popover>
//     </CardHeader>
//     <CardContent>
//       {/* value slot: Skeleton | insufficientData | value text */}
//       {/* optional subValue */}
//       {/* optional delta badge */}
//       {/* optional trend sparkline */}
//     </CardContent>
//   </Card>
```

**Acceptance criteria**

1. `<KpiCard label="Total Runs" value="12,450" formulaTooltip="f" exampleTooltip="e" />` renders `"Total Runs"` and `"12,450"` in the DOM.
2. `<KpiCard label="..." value={undefined} formulaTooltip="f" exampleTooltip="e" />` renders an element with `animate-pulse` class (Skeleton) and does not render any value text.
3. `<KpiCard ... insufficientData={true} />` renders a `span` with `role="status"` containing `"Insufficient data"` and does NOT render the `value` text.
4. `<KpiCard ... insufficientData={true} insufficientDataReason="Need 10+ rated runs" />` renders the reason string in addition to the "Insufficient data" span.
5. `<KpiCard ... delta={18.4} />` renders `"+18.4%"` with green badge classes (`bg-emerald-100`).
6. `<KpiCard ... delta={-3.2} />` renders `"-3.2%"` with red badge classes (`bg-red-100`).
7. `<KpiCard ... delta={undefined} />` renders no badge element.
8. Clicking the info button opens the Popover; the `formulaTooltip` text is visible in the DOM.
9. `<KpiCard ... trend={[{ date: '2026-06-01', value: 10 }]} />` renders an SVG element (the Sparkline).
10. `<KpiCard ... trend={undefined} />` renders no SVG element.

**Test Plan**

- `src/components/kpis/KpiCard.test.tsx` (new)
  - Scenario: renders label and value text when both are provided.
  - Scenario: renders Skeleton when `value` is undefined.
  - Scenario: positive delta renders green badge with `+` prefix.
  - Scenario: negative delta renders red badge with `-` prefix.
  - Scenario: undefined delta renders no badge.
  - Scenario: `insufficientData=true` renders "Insufficient data" with `role="status"`.
  - Scenario: `insufficientData=true` with `insufficientDataReason` renders the reason text.
  - Scenario: clicking info button renders `formulaTooltip` text in the DOM.
  - Scenario: `trend` array renders a Sparkline SVG element.
  - Scenario: no `trend` prop renders no SVG element.

**Files**

- `src/components/kpis/KpiCard.tsx` (new) - atom KPI display card with skeleton, delta badge, info popover, and sparkline slot
- `src/components/kpis/KpiCard.test.tsx` (new) - rendering, loading state, delta badge, insufficientData, and popover tests

---

## T-6: AreaChart component

**Context**

Creates `src/components/charts/AreaChart.tsx` - a high-level wrapper around `Visualization` for time-series area charts. It is used three times in `Overview` (T-8): KPI-04 (two-series token chart), KPI-05 (cost chart with budget reference line), and KPI-49 (quality score trend with gradient fill). The existing `Visualization` component (WP-03 `src/components/charts/Visualization.tsx`) provides the rendering engine; `AreaChart` configures it with a time x-axis, a linear y-axis, one `Area` mark per series, and an optional `Annotation` reference line.

Read `src/components/charts/Visualization.tsx`, `src/components/charts/marks/Area.tsx`, and `src/components/charts/overlays/Annotation.tsx` in full before implementing.

**Requirements**

1. Create `src/components/charts/AreaChart.tsx` exporting `AreaChartSeries`, `AreaChartProps`, and `function AreaChart(props: AreaChartProps): JSX.Element`.
2. `AreaChartSeries` must include: `id: string`, `label: string`, `data: Array<{ date: string; value: number }>`, `color?: string`.
3. `AreaChartProps` must include: `series: AreaChartSeries[]`, `referenceLine?: { value: number; label: string }`, `height?: number`, `ariaLabel?: string`.
4. `AreaChart` must construct `data` as a `ReadonlySignal` using `useDeepComputed(() => Object.fromEntries(props.series.map(s => [s.id, s.data])))` so the signal updates when series data changes.
5. `AreaChart` must configure axes using `defineAxes`: one time axis `{ id: 'x', type: 'time', position: 'bottom', accessor: (d) => new Date((d as { date: string }).date) }` and one linear axis `{ id: 'y', type: 'linear', position: 'left', accessor: (d) => (d as { value: number }).value, domain: 'auto' }`.
6. `AreaChart` must render one `<Area series={s.id} axis="y" color={s.color} />` inside the `Visualization` children callback for each entry in `props.series`.
7. When `props.referenceLine` is provided, `AreaChart` must also render `<Annotation axis="y" value={props.referenceLine.value} label={props.referenceLine.label} variant="warning" />` inside the children callback.
8. `AreaChart` must forward `height` and `ariaLabel` to `Visualization`.
9. The axes array must be hoisted outside the component when it does not depend on props, or use `useMemo` when it depends on props - per ARCHITECTURE.md §4.4.
10. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- `useDeepComputed` for data signal: series data arrays frequently share the same structure; deep equality prevents Visualization from re-rendering when refetch returns identical data (same Faker seed).
- The axes configuration does NOT change based on props (time + linear is fixed for all AreaChart instances), so `AREA_CHART_AXES` can be hoisted as a module-level constant using `defineAxes`.
- `domain: 'auto'` on the y-axis lets D3 scale infer the domain from the data. The Visualization's `buildScale` function in `src/components/charts/primitives/scales.ts` handles this.
- `variant="warning"` on Annotation matches the budget reference line semantic (cost approaching budget is a warning), which produces `tokens.warning` stroke color.

**Design**

```tsx
// src/components/charts/AreaChart.tsx  (new file)
import { useDeepComputed } from '../../hooks/useDeepComputed'
import { Visualization, defineAxes } from './Visualization'
import { Area } from './marks/Area'
import { Annotation } from './overlays/Annotation'

export interface AreaChartSeries {
  id: string
  label: string
  data: Array<{ date: string; value: number }>
  color?: string
}

export interface AreaChartProps {
  series: AreaChartSeries[]
  referenceLine?: { value: number; label: string }
  height?: number
  ariaLabel?: string
}

// Hoisted - same axes for all AreaChart instances.
const AREA_CHART_AXES = defineAxes([
  {
    id: 'x',
    type: 'time' as const,
    position: 'bottom' as const,
    accessor: (d) => new Date((d as { date: string }).date),
  },
  {
    id: 'y',
    type: 'linear' as const,
    position: 'left' as const,
    accessor: (d) => (d as { value: number }).value,
    domain: 'auto' as const,
  },
])

export function AreaChart({ series, referenceLine, height, ariaLabel }: AreaChartProps): JSX.Element
// const dataSig = useDeepComputed(() => Object.fromEntries(series.map(s => [s.id, s.data])))
// return (
//   <Visualization data={dataSig} axes={AREA_CHART_AXES} height={height} ariaLabel={ariaLabel}>
//     {({ Area: AreaMark, Annotation: AnnotationMark }) => (
//       <>
//         {series.map(s => <AreaMark key={s.id} series={s.id} axis="y" color={s.color} />)}
//         {referenceLine && <AnnotationMark axis="y" value={referenceLine.value} label={referenceLine.label} variant="warning" />}
//       </>
//     )}
//   </Visualization>
// )
```

**Acceptance criteria**

1. `<AreaChart series={[{ id: 'cost', label: 'Cost', data: [{date:'2026-06-01', value:100}] }]} />` renders an SVG element in the DOM.
2. A two-series `AreaChart` renders two `<path>` elements inside the SVG (one per Area mark).
3. When `referenceLine` is provided, an `<Annotation>` element renders a `<line>` inside the SVG.
4. When `referenceLine` is absent, no `<line>` element renders.
5. Rendering `<AreaChart series={[]} />` does not throw.
6. The `ariaLabel` prop is forwarded and appears on the `<figure>` rendered by `Visualization`.

**Test Plan**

- `src/components/charts/AreaChart.test.tsx` (new)
  - Scenario: single-series renders SVG with a path element.
  - Scenario: two-series renders two path elements.
  - Scenario: `referenceLine` prop renders a `<line>` element.
  - Scenario: no `referenceLine` renders no `<line>` element.
  - Scenario: empty `series` array does not throw.

**Files**

- `src/components/charts/AreaChart.tsx` (new) - multi-series area chart wrapper with optional reference line
- `src/components/charts/AreaChart.test.tsx` (new) - rendering, multi-series, and reference line tests

---

## T-7: DonutChart and BarChart components

**Context**

Creates `src/components/charts/DonutChart.tsx` and `src/components/charts/BarChart.tsx`. These two standalone components render in `Overview` (T-8): DonutChart for KPI-03 (seat adoption as used vs. unused arcs) and BarChart for KPI-14 (horizontal mini-funnel for provisioned/activated/MAU). Unlike `AreaChart` (T-6), these do NOT wrap `Visualization` - the `Pie`/`Arc` pattern and horizontal bar layout don't fit the axis-based `Visualization` API. Both are direct consumers of `@visx/shape` and `@visx/group`.

Read `src/components/charts/marks/Bar.tsx` and `src/components/charts/marks/Gauge.tsx` before implementing to understand how the project uses visx shape primitives. Also check `package.json` to confirm `@visx/shape` is available.

**Requirements (DonutChart)**

1. Create `src/components/charts/DonutChart.tsx` exporting `DonutChartSlice`, `DonutChartProps`, and `function DonutChart(props: DonutChartProps): JSX.Element`.
2. `DonutChartSlice` must include: `label: string`, `value: number`, `color?: string`.
3. `DonutChartProps` must include: `slices: DonutChartSlice[]`, `ariaLabel?: string`, `size?: number`.
4. `DonutChart` must render an `<svg>` element with `width={size}` and `height={size}` (default `size = 120`).
5. `DonutChart` must use `Pie` from `@visx/shape` to render one `<Arc>` per slice; the outer radius must be `size / 2 - 4` and the inner radius must be `size / 4` (creating the donut hole).
6. Each arc must use `slice.color` as `fill`; when `color` is absent, fall back to a token from `useChartTokens()` in order: first slice uses `tokens.primary`, second uses `tokens.muted`, subsequent slices use `tokens.border`.
7. The `<svg>` must include `role="img"` and `aria-label={ariaLabel ?? 'Donut chart'}`.
8. The `Pie` must be centered using a `<Group top={size/2} left={size/2}>` wrapper from `@visx/group`.

**Requirements (BarChart)**

9. Create `src/components/charts/BarChart.tsx` exporting `BarChartBar`, `BarChartProps`, and `function BarChart(props: BarChartProps): JSX.Element`.
10. `BarChartBar` must include: `label: string`, `value: number`, `color?: string`.
11. `BarChartProps` must include: `bars: BarChartBar[]`, `maxValue?: number`, `ariaLabel?: string`, `height?: number`.
12. `BarChart` must render a `<div>` (not SVG) containing one row per bar; each row contains a label `<span>`, a filled `<div>` (the bar), and a value `<span>`.
13. Each bar `<div>` width must be `${(bar.value / maxValue) * 100}%` where `maxValue` defaults to `Math.max(...bars.map(b => b.value))` when `maxValue` prop is absent.
14. When `bars` is empty, `maxValue` must default to `1` to prevent division by zero.
15. Each bar's `fill` color must use `bar.color` when provided, otherwise `tokens.primary` from `useChartTokens()`.
16. The outer `<div>` must include `role="list"` and `aria-label={ariaLabel ?? 'Bar chart'}`; each row must include `role="listitem"`.

**Requirements (shared)**

17. Both components must be `function` declarations (not arrow functions) per ARCHITECTURE.md §4.3.
18. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- DonutChart uses `@visx/shape`'s `Pie` (which returns `PieArcDatum` objects) and `@visx/shape`'s `Arc` for rendering. No D3 scales or `Visualization` needed.
- BarChart uses plain HTML divs with inline `width` style for the horizontal bar - simpler and more accessible than SVG bars for a 3-item funnel display. Screen readers can read `role="listitem"` rows with label and value spans naturally.
- `useChartTokens()` is called at the top of each component to get color tokens. This is acceptable here (not in a signal-derived compute) because the tokens read CSS custom properties synchronously at render time.

**Design**

```tsx
// src/components/charts/DonutChart.tsx  (new file)
import { Pie, Arc } from '@visx/shape'
import { Group } from '@visx/group'
import { useChartTokens } from './primitives/useChartTokens'

export interface DonutChartSlice {
  label: string
  value: number
  color?: string
}

export interface DonutChartProps {
  slices: DonutChartSlice[]
  ariaLabel?: string
  size?: number
}

export function DonutChart({ slices, ariaLabel, size = 120 }: DonutChartProps): JSX.Element
// const tokens = useChartTokens()
// outerRadius = size / 2 - 4; innerRadius = size / 4
// fallbackColors = [tokens.primary, tokens.muted, tokens.border]
// <svg width={size} height={size} role="img" aria-label={ariaLabel ?? 'Donut chart'}>
//   <Group top={size/2} left={size/2}>
//     <Pie data={slices} pieValue={d => d.value} outerRadius={outerRadius} innerRadius={innerRadius}>
//       {pie => pie.arcs.map((arc, i) => (
//         <Arc key={i} {...arc} fill={slices[i].color ?? fallbackColors[i] ?? tokens.border} />
//       ))}
//     </Pie>
//   </Group>
// </svg>

// src/components/charts/BarChart.tsx  (new file)
import { useChartTokens } from './primitives/useChartTokens'

export interface BarChartBar {
  label: string
  value: number
  color?: string
}

export interface BarChartProps {
  bars: BarChartBar[]
  maxValue?: number
  ariaLabel?: string
  height?: number
}

export function BarChart({ bars, maxValue, ariaLabel }: BarChartProps): JSX.Element
// const tokens = useChartTokens()
// const max = maxValue ?? (bars.length > 0 ? Math.max(...bars.map(b => b.value)) : 1)
// <div role="list" aria-label={ariaLabel ?? 'Bar chart'}>
//   {bars.map((bar, i) => (
//     <div key={i} role="listitem">
//       <span>{bar.label}</span>
//       <div style={{ width: `${(bar.value / max) * 100}%`, background: bar.color ?? tokens.primary }} />
//       <span>{bar.value}</span>
//     </div>
//   ))}
// </div>
```

**Acceptance criteria**

1. `<DonutChart slices={[{ label: 'A', value: 70 }, { label: 'B', value: 30 }]} />` renders an `<svg>` element with `role="img"`.
2. The SVG contains exactly 2 `<path>` elements (one arc per slice).
3. Rendering `<DonutChart slices={[]} />` does not throw.
4. `<BarChart bars={[{ label: 'Provisioned', value: 500 }, { label: 'Activated', value: 340 }, { label: 'MAU', value: 280 }]} />` renders a `div` with `role="list"` containing 3 items with `role="listitem"`.
5. The first bar's fill div `width` style is `"100%"` (the largest value fills full width when no explicit `maxValue`).
6. The second bar's fill div `width` style is `"68%"` (340/500 = 68%).
7. Rendering `<BarChart bars={[]} />` does not throw (empty guard).

**Test Plan**

- `src/components/charts/DonutChart.test.tsx` (new)
  - Scenario: renders an SVG with `role="img"`.
  - Scenario: two slices render two path elements.
  - Scenario: empty slices array does not throw.

- `src/components/charts/BarChart.test.tsx` (new)
  - Scenario: renders a `div` with `role="list"` and three `role="listitem"` items.
  - Scenario: first (largest) bar has `width: 100%`.
  - Scenario: second bar width is proportional to its value.
  - Scenario: empty bars array does not throw.

**Files**

- `src/components/charts/DonutChart.tsx` (new) - Pie-based donut chart for two-slice proportional display
- `src/components/charts/DonutChart.test.tsx` (new) - rendering and slice count tests
- `src/components/charts/BarChart.tsx` (new) - horizontal proportional bar list for funnel display
- `src/components/charts/BarChart.test.tsx` (new) - rendering, proportion width, and empty-guard tests

---

## T-8: Overview organism

**Context**

Implements SPEC §3 `src/components/sections/Overview.tsx` - the organism that assembles all 14 KPIs and 5 chart figures for Section 1. It makes three TanStack Query calls (`overview`, `timeseries`, `org/config`), maps API responses through the formula and formatter functions (T-1, T-2), and renders KpiCard instances (T-5) and chart components (T-6, T-7).

Before starting, read:
- `src/types/api.ts` - `OverviewResponse`, `TimeseriesResponse`, `OrgConfig` field names
- `src/lib/kpi/formulas.ts` (T-1) - compute functions
- `src/lib/kpi/formatters.ts` (T-2) - format functions
- `src/components/kpis/KpiCard.tsx` (T-5) - `KpiCardProps` interface
- `src/components/charts/AreaChart.tsx` (T-6)
- `src/components/charts/DonutChart.tsx` (T-7)
- `src/components/charts/BarChart.tsx` (T-7)
- `src/components/layout/Section.tsx` (WP-04 T-3) - `SectionProps` and `labelledBy` prop name
- `src/lib/filters/filterSignals.ts` (WP-04 T-2) - `filterQueryParams` signal

**Requirements**

1. Create `src/components/sections/Overview.tsx` exporting `function Overview(): JSX.Element`.
2. `Overview` must make three `useQuery` calls:
   - `queryKey: ['overview', filterQueryParams.value]`, `queryFn`: `fetch('/api/analytics/overview?' + new URLSearchParams(filterQueryParams.value).then(r => r.json())` typed as `OverviewResponse`.
   - `queryKey: ['timeseries', filterQueryParams.value]`, `queryFn`: same pattern for `/api/analytics/timeseries` typed as `TimeseriesResponse`.
   - `queryKey: ['org/config']` (no filter params - org config is stable), `queryFn`: `fetch('/api/org/config').then(r => r.json())` typed as `OrgConfig`.
3. The `queryFn` for `overview` and `timeseries` must serialize `filterQueryParams.value` into query params using `new URLSearchParams({ from: params.from, to: params.to, ...(params.team_id ? { team_id: params.team_id } : {}) })`.
4. While any query is loading (`overview.isLoading || timeseries.isLoading`), KpiCard instances must receive `value={undefined}` (triggering their skeleton state); chart figures must render `<Skeleton className="h-48 w-full" />` placeholders.
5. All rendering must be wrapped in `<Section id="overview" labelledBy="overview-heading">` from `src/components/layout/Section.tsx`; the section must contain `<h2 id="overview-heading">Overview</h2>`.
6. Row 1 must render four KpiCard instances: KPI-01 (`total_runs` formatted with `formatNumber`), KPI-02 (`mau` formatted with `formatNumber`, `subValue` = `"DAU: " + formatNumber(dau)`), KPI-03 (seat adoption rate = `mau / seat_count`, formatted with `formatPercent`), KPI-05 (`total_cost` formatted with `formatCurrency`, `delta` = `computeDeltaPercent(total_cost, total_cost_prior)` negated so cost decrease = positive delta).
7. Row 2 must render four KpiCard instances: KPI-06 (`computeRetentionCost(total_cost, mau)` formatted with `formatCurrency`), KPI-07 (`success_rate` formatted with `formatPercent`), KPI-09 (`avg_quality_score` formatted with `formatQuality` when not null; `insufficientData={avg_quality_score === null}`), KPI-10 (`computeCostPerQualityPoint(...)` formatted with `formatCurrency` when not null; `insufficientData={cost_per_quality_point === null}`).
8. Row 3 must render two `<figure>` elements: one `AreaChart` with two series (`input_tokens` and `output_tokens` from `TimeseriesResponse.points`), one `AreaChart` for cumulative `cost` with `referenceLine={{ value: orgConfig.monthly_budget, label: 'Budget' }}`.
9. Row 4 must render two `<figure>` elements: one `DonutChart` with slices `[{ label: 'Active', value: mau }, { label: 'Unused', value: seat_count - mau }]`, one `BarChart` with bars `[{ label: 'Provisioned', value: seat_count }, { label: 'Activated', value: Math.round(seat_count * user_activation_rate) }, { label: 'MAU', value: mau }]`.
10. Row 5 must render four KpiCard instances: KPI-11 (`acceptance_rate` formatted with `formatPercent`; `insufficientData={acceptance_rate === null}`), KPI-12 (`computeCostPerAcceptedOutput(...)` formatted with `formatCurrency`; `insufficientData={cost_per_accepted_output === null}`), KPI-08 (`avg_run_duration_ms` formatted with `formatDuration`), KPI-13 (`mom_usage_growth` formatted with `formatPercent`, `delta={mom_usage_growth}`).
11. Row 6 must render one `<figure>` spanning full width: an `AreaChart` with one series `{ id: 'quality', label: 'Quality Score Trend', data: timeseries.points.map(p => ({ date: p.date, value: p.avg_quality_score ?? 0 })) }` and `ariaLabel="Quality score 30-day trend"`.
12. Every `<figure>` must have a `<figcaption>` child with a descriptive label (e.g. `"Token usage over time"`, `"Cost vs. budget"`, `"Seat adoption"`, `"Activation funnel"`, `"Quality score trend"`).
13. The `filterQueryParams` signal must be read using `filterQueryParams.value` inside the component; the Babel signals transform (ARCHITECTURE.md §10.2) will inject `useSignals()` automatically.
14. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- `filterQueryParams.value` appears in TanStack Query keys. The Babel signals transform tracks this read, so when the signal changes the component re-renders and TanStack Query sees a new key, triggering a refetch. Do NOT use `useSignalEffect` here - TanStack Query handles refetch internally once the key changes.
- KPI-05 cost delta semantic: pass `delta={-computeDeltaPercent(total_cost, total_cost_prior)}` so a cost decrease shows as a positive (green) delta in KpiCard. This is documented in T-5's technical decisions.
- Row 4 BarChart bars must be in descending order by value (provisioned >= activated >= MAU per acceptance criterion 9 in SPEC §5). Compute `activatedCount = Math.round(seat_count * user_activation_rate)` and verify sort at test time.
- `org/config` query has no filter params - the org config is independent of date range, so `queryKey: ['org/config']` without `filterQueryParams.value` is correct and will not trigger unnecessary refetches when filters change.
- Chart figures render Skeleton placeholders during loading only when `overview.isLoading || timeseries.isLoading`. OrgConfig loading does not block chart rendering - if unavailable, use a default `referenceLine` value of `0` (no visible line at zero).

**Design**

```tsx
// src/components/sections/Overview.tsx  (new file)
import { useQuery } from '@tanstack/react-query'
import { filterQueryParams } from '../../lib/filters/filterSignals'
import { Section } from '../layout/Section'
import { KpiCard } from '../kpis/KpiCard'
import { AreaChart } from '../charts/AreaChart'
import { DonutChart } from '../charts/DonutChart'
import { BarChart } from '../charts/BarChart'
import { Skeleton } from '../ui/skeleton'
import {
  computeRetentionCost,
  computeCostPerQualityPoint,
  computeCostPerAcceptedOutput,
  computeDeltaPercent,
} from '../../lib/kpi/formulas'
import {
  formatCurrency,
  formatTokens,
  formatPercent,
  formatDuration,
  formatQuality,
  formatNumber,
} from '../../lib/kpi/formatters'
import type { OverviewResponse, TimeseriesResponse, OrgConfig } from '../../types/api'

export function Overview(): JSX.Element
// 3 useQuery calls (overview, timeseries, org/config)
// maps data through compute + format functions
// renders: <Section id="overview" labelledBy="overview-heading">
//   <h2 id="overview-heading">Overview</h2>
//   {/* Row 1: 4 KpiCards */}
//   {/* Row 2: 4 KpiCards */}
//   {/* Row 3: 2 figure+AreaChart */}
//   {/* Row 4: 1 figure+DonutChart + 1 figure+BarChart */}
//   {/* Row 5: 4 KpiCards */}
//   {/* Row 6: 1 figure+AreaChart full-width */}
// </Section>
```

**Acceptance criteria**

1. `Overview` renders exactly 14 KpiCard instances when `overview` query returns a complete `OverviewResponse`.
2. KPI-09 (Quality Score) and KPI-10 (Cost/Quality Point) show `insufficientData={true}` when `avg_quality_score` is `null` in the API response.
3. KPI-05 (Total Cost) renders a green delta badge when `total_cost_delta` is negative (cost decreased) - verified by mocking `total_cost < total_cost_prior`.
4. The token area chart (Row 3) renders two visually distinct area paths (two series).
5. The cost area chart (Row 3) renders an Annotation reference line when `orgConfig.monthly_budget` is a positive number.
6. Changing `filterQueryParams` (simulate by mutating the signal) causes `['overview', filterQueryParams.value]` key to change, which TanStack Query responds to with a new fetch call.
7. The DonutChart (Row 4) receives two slices: `{ label: 'Active', value: mau }` and `{ label: 'Unused', value: seat_count - mau }`.
8. The BarChart (Row 4) receives three bars in descending order: provisioned >= activated >= MAU.
9. While `overview.isLoading` is true, all KpiCard `value` props are `undefined` (Skeleton renders).
10. KPI-49 quality score trend AreaChart (Row 6) renders with series id `"quality"`.
11. All `<figure>` elements have a `<figcaption>` child with non-empty text.
12. `npx tsc --noEmit` reports zero errors after this task.

**Test Plan**

- `src/components/sections/Overview.test.tsx` (new)
  - Scenario: renders exactly 14 KpiCard instances when API returns full `OverviewResponse` (mock both queries with MSW or `vi.stubGlobal('fetch', ...)`).
  - Scenario: KPI-09 shows `insufficientData` when `avg_quality_score` is null in mocked response.
  - Scenario: all KpiCard `value` props are undefined (Skeleton present) while queries are loading.
  - Scenario: token area chart (Row 3) renders two Area series when timeseries data is present.
  - Scenario: filter change (mutate `filterQueryParams` signal) causes query re-trigger (verify by checking `fetch` was called again with new params).

**Files**

- `src/components/sections/Overview.tsx` (new) - 14-KPI organism with 5 chart figures, loading skeletons, and filter-reactive queries
- `src/components/sections/Overview.test.tsx` (new) - query mocking, KPI count, insufficientData, loading skeleton, and filter reactivity tests

---

## Implementation order table

| Done | Priority | Task | Depends on | Effort |
|------|----------|------|------------|--------|
| [x]  | 1        | T-1: KPI formula functions | - | Small |
| [x]  | 2        | T-2: KPI formatter functions | - | Small |
| [x]  | 3        | T-3: Card UI component | - | Small |
| [x]  | 4        | T-4: Sparkline chart component | - | Small |
| [x]  | 5        | T-5: KpiCard atom | T-2, T-3, T-4 | Medium |
| [x]  | 6        | T-6: AreaChart component | - | Medium |
| [x]  | 7        | T-7: DonutChart and BarChart | - | Medium |
| [ ]  | 8        | T-8: Overview organism | T-1, T-5, T-6, T-7 | Large |
