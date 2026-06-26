# SPEC: WP-05 - Section 1 Executive Overview

**Date:** 2026-06-26
**Status:** Ready
**Working Package:** WP-05
**Depends on:** WP-02, WP-03, WP-04

---

## Assumptions (confirmed or defaulted)

- KpiCard is the atomic unit for all KPIs; sparkline slot is optional per card.
- `<figure>` + `<figcaption>` wraps each chart at the section level (caller), not inside the chart component.
- KPI-09 (Quality Score), KPI-10 (Cost/Quality Point), KPI-11 (Acceptance Rate), KPI-12 (Cost/Accepted Output) show "Insufficient data" when their respective source value is null in the API response (i.e. when rated_run_count < 10 or accept/discard tracking is absent).
- TanStack Query keys: `['overview', filterQueryParams.value]` and `['timeseries', filterQueryParams.value]`.
- KpiCard is defined here (WP-05) and re-used by WP-06, WP-07, WP-08.
- Polling: `refetchInterval: 30_000`, `staleTime: 25_000` - configured at root QueryClient (WP-04).
- Loading state: skeleton placeholders rendered using shadcn/ui Skeleton, one per KpiCard slot.

---

## 1. Context

Implements WP-05 from `docs/20260626-analytics-dashboard-plan.md`. Corresponds to Investigation Appendix A §Section 1 (KPI-01 through KPI-14) plus KPI-49 (Quality Score Trend, cross-cutting).

**Files touched:**
- `src/components/kpis/` - new directory; owns KpiCard atom
- `src/components/sections/ExecutiveOverview.tsx` - new organism
- `src/lib/kpi/formulas.ts` - new; pure KPI computation functions
- `src/lib/kpi/formatters.ts` - new; pure display formatting functions

**Existing files consumed (not modified):**
- `src/types/api.ts` (WP-02) - OverviewResponse, TimeseriesResponse
- `src/components/charts/Sparkline.tsx` (WP-03)
- `src/components/charts/AreaChart.tsx` (WP-03)
- `src/components/charts/DonutChart.tsx` (WP-03)
- `src/components/charts/BarChart.tsx` (WP-03)
- `src/components/layout/Section.tsx` (WP-04) - lazy-mount wrapper
- `src/lib/filters/filterSignals.ts` (WP-04) - filterQueryParams signal

---

## 2. Data model

```ts
// src/components/kpis/KpiCard.tsx

interface KpiCardProps {
  label: string
  value: string                             // pre-formatted display value
  subValue?: string                         // secondary line e.g. "DAU: 34"
  delta?: number                            // % change vs prior period; undefined = no badge
  deltaLabel?: string                       // e.g. "vs prior 30 days"
  trend?: Array<{ date: string; value: number }>  // sparkline data; absent = no sparkline
  trendColor?: string                       // CSS color token string
  formulaTooltip: string                    // shown in info popover
  exampleTooltip: string                    // shown in info popover
  insufficientData?: boolean                // shows overlay when true
  insufficientDataReason?: string           // optional explanation in overlay
}

// src/lib/kpi/formulas.ts - signatures only

export function computeRetentionCost(totalCost: number, mau: number): number
// totalCost / mau; returns 0 when mau = 0

export function computeCostPerQualityPoint(
  totalCost: number,
  ratedRunCount: number,
  avgQualityScore: number | null
): number | null
// returns null when avgQualityScore is null or ratedRunCount < 10

export function computeCostPerAcceptedOutput(
  totalCost: number,
  runCount: number,
  acceptanceRate: number | null
): number | null
// returns null when acceptanceRate is null

export function computeQualityCostEfficiency(
  avgQuality: number | null,
  acceptanceRate: number | null,
  costPerRun: number
): number | null
// (avgQuality * acceptanceRate) / costPerRun; returns null when either input is null

export function computeProjectedMonthEnd(
  currentSpend: number,
  daysElapsed: number,
  daysInMonth: number
): number
// (currentSpend / daysElapsed) * daysInMonth

export function computeDeltaPercent(current: number, prior: number): number
// (current - prior) / prior * 100; returns 0 when prior = 0

// src/lib/kpi/formatters.ts - signatures only

export function formatCurrency(n: number): string
// < $1: "$0.42"; >= $1000: "$14,200"; >= $1M: "$1.4M"

export function formatTokens(n: number): string
// < 1M: "842K"; >= 1B: "2.41B"; else "241M"

export function formatPercent(n: number, decimals?: number): string
// "72.5%" default 1 decimal

export function formatDuration(ms: number): string
// < 60s: "47s"; >= 60s: "2m 3s"

export function formatQuality(score: number): string
// "4.1 / 5.0"

export function formatNumber(n: number): string
// "12,450" with locale thousands separator
```

---

## 3. Component / module design

### New files

**`src/lib/kpi/formulas.ts`** (new)
- All functions are pure - no side effects, no imports from React or signals.
- Each function that can receive null inputs must return null when data is insufficient rather than NaN or 0.
- Eligible for extraction to `src/utils/` only if a second consumer appears (per ARCHITECTURE.md §2.3).

**`src/lib/kpi/formatters.ts`** (new)
- All functions are pure.
- `formatCurrency` must handle sub-dollar values (e.g. $0.42 for cost-per-quality-point) and large values (e.g. $157K for annual projected).

**`src/components/kpis/KpiCard.tsx`** (new)
- Atom-level component.
- Renders shadcn/ui `<Card>` containing: header label + info icon button, primary value display, optional subValue line, optional delta badge (green = positive delta, red = negative), optional `<Sparkline>` at card bottom.
- Info icon (`?`): shadcn/ui `<Popover>` triggered on click, content shows `formulaTooltip` and `exampleTooltip` formatted strings. Closes on click-outside or Escape.
- `insufficientData=true`: renders "Insufficient data" text with `role="status"` in place of `value`. `insufficientDataReason` shown below in muted text when provided.
- Loading skeleton variant: when `value` is undefined, renders `<Skeleton className="h-8 w-24" />` in the value slot (caller passes undefined during query loading).

**`src/components/sections/ExecutiveOverview.tsx`** (new)
- Organism-level component.
- Two TanStack Query `useQuery` calls:
  - `['overview', filterQueryParams.value]` -> `/api/analytics/overview`
  - `['timeseries', filterQueryParams.value]` -> `/api/analytics/timeseries`
- All rendering is inside a `<Section id="overview" aria-labelledby="overview-heading">` from WP-04.
- Layout rows (grid-based, responsive):
  - **Row 1 (4 KpiCards):** KPI-01 Total Runs, KPI-02 Active Users (subValue: DAU count), KPI-03 Seat Adoption Rate (value: formatted percent), KPI-05 Total Cost (delta badge)
  - **Row 2 (4 KpiCards):** KPI-06 Retention Cost, KPI-07 Success Rate (subValue: status indicator), KPI-09 Avg Quality Score (insufficientData when null), KPI-10 Cost/Quality Point (insufficientData when null)
  - **Row 3 (2 charts):** `<figure>` AreaChart for KPI-04 (input vs. output token split over time), `<figure>` AreaChart for KPI-05 cost cumulative vs. budget reference line
  - **Row 4 (2 mixed):** `<figure>` DonutChart for KPI-03 (used vs. unused seats), `<figure>` horizontal BarChart mini-funnel for KPI-14 (provisioned -> activated -> MAU)
  - **Row 5 (4 KpiCards):** KPI-11 Acceptance Rate (insufficientData when null), KPI-12 Cost/Accepted Output (insufficientData when null), KPI-08 Avg Run Duration, KPI-13 MoM Usage Growth (delta badge only)
  - **Row 6 (1 chart full-width):** `<figure>` AreaChart for KPI-49 Quality Score Trend (30-day moving average; gradient fill)

### Public API

```ts
// src/components/kpis/KpiCard.tsx
export function KpiCard(props: KpiCardProps): JSX.Element

// src/components/sections/ExecutiveOverview.tsx
export function ExecutiveOverview(): JSX.Element
```

---

## 4. Interaction diagram

### Data flow

```
ExecutiveOverview mounts (inside Section lazy-mount wrapper from WP-04)
  --> useQuery(['overview', filterQueryParams.value])
  --> useQuery(['timeseries', filterQueryParams.value])
  --> while isLoading: each KpiCard slot renders Skeleton placeholder

On data received (OverviewResponse):
  --> computeRetentionCost(totalCost, mau) -> formatted via formatCurrency
  --> computeCostPerQualityPoint(...) -> null check -> insufficientData flag
  --> computeCostPerAcceptedOutput(...) -> null check -> insufficientData flag
  --> all 14 KPI values formatted and passed as props to KpiCard components

On TimeseriesResponse received:
  --> points mapped to [{date, value}] arrays
  --> passed as trend prop to relevant KpiCards (sparklines)
  --> passed as series arrays to AreaChart components

filterQueryParams signal changes (user adjusts date range or team):
  --> both query keys contain new filterQueryParams.value string
  --> TanStack Query triggers background refetch
  --> on settled: KpiCards update; charts re-render with new data
  --> Faker.js seed changes (new date range) -> different but realistic data

Every 30s (refetchInterval fires):
  --> filterQueryParams.value is unchanged
  --> MSW returns identical data (same Faker seed)
  --> TanStack Query data is structurally identical -> no visible re-render
```

### KpiCard info popover

```
User clicks info icon (?) on any KpiCard
  --> shadcn/ui Popover opens (positioned relative to icon)
  --> Content renders:
      "Formula: COUNT(runs WHERE org = org_id AND started_at IN period)"
      "Example: 12,450 runs in the last 30 days"
  --> Popover closes on: click outside, Escape key, second click on icon
  --> Focus returns to info icon button on close
```

### Delta badge logic

```
delta prop received (number):
  delta > 0 --> green badge, upward arrow, "+18.4%"
  delta < 0 --> red badge, downward arrow, "-3.2%"
  delta = 0 --> neutral badge, "0.0%"
  delta = undefined --> no badge rendered
```

---

## 5. Acceptance criteria

1. `ExecutiveOverview` renders exactly 14 KpiCard instances when the API returns a complete `OverviewResponse`.
2. KPI-09 (Quality Score) and KPI-10 (Cost/Quality Point) show "Insufficient data" text with `role="status"` when `avg_quality_score` is `null` in the API response.
3. KPI-05 (Total Cost) renders a green delta badge when `total_cost_delta` is negative (cost decreased) and red when positive.
4. The token area chart (KPI-04) renders two visually distinct `<AreaClosed>` paths - one for `input_tokens` series and one for `output_tokens` series.
5. The cost area chart (KPI-05) renders a horizontal reference line at the org monthly budget value (from `/api/org/config`).
6. Each KpiCard info icon opens a popover containing the formula string and example string passed as props.
7. Changing `filterQueryParams` (via date range change) causes both TanStack Query queries to refetch; KpiCard values update after refetch completes.
8. KPI-03 DonutChart renders two arcs proportional to `mau` (used) and `licensed_seat_count - mau` (unused).
9. KPI-14 horizontal BarChart renders three bars in descending order: seats provisioned >= activated >= MAU.
10. `computeCostPerQualityPoint(14200, 8200, 4.1)` returns a value between 0.421 and 0.423 (unit test assertion).
11. `computeCostPerQualityPoint(14200, 5, 4.1)` returns `null` (ratedRunCount < 10 threshold).
12. While both queries are loading, all KpiCard value slots render shadcn/ui Skeleton elements instead of text.
13. KPI-49 quality score trend AreaChart renders a single path for the 30-day moving average with a `<LinearGradient>` fill underneath.

---

## 6. Out of scope

- Team-level KPI breakdowns (WP-06)
- Reliability section metrics (WP-07)
- Billing section metrics (WP-08)
- Axe-core automated accessibility assertions (WP-09)
- CohortChart / retention cohort curves (investigation mentions as v2 chart type)
- Export to CSV or PDF
- Comparison vs. other organizations

---

## Test plan

| File | What it tests |
|------|---------------|
| `src/lib/kpi/formulas.test.ts` (new) | `computeRetentionCost` happy path and mau=0 guard; `computeCostPerQualityPoint` returns null when avgQualityScore null; returns null when ratedRunCount < 10; returns correct value for known inputs; `computeDeltaPercent` positive, negative, zero, prior=0 cases; `computeProjectedMonthEnd` proportional projection correctness |
| `src/lib/kpi/formatters.test.ts` (new) | `formatCurrency` sub-dollar ($0.42), thousands ($14,200), millions ($1.4M); `formatTokens` thousands (842K), millions (241M), billions (2.41B); `formatDuration` seconds (47s), minutes (2m 3s); `formatPercent` default and custom decimals; `formatNumber` thousands separator |
| `src/components/kpis/KpiCard.test.ts` (new) | renders label and value; positive delta shows green badge; negative delta shows red badge; undefined delta renders no badge; `insufficientData=true` renders "Insufficient data" with `role="status"`; info icon click opens popover with formula and example text; popover closes on Escape |
| `src/components/sections/ExecutiveOverview.test.ts` (new) | renders 14 KpiCard instances with mocked API response; shows Skeleton while query loading; KPI-09 shows insufficientData when `avg_quality_score` is null; token area chart renders when timeseries data present; filter change triggers query refetch (verify query key update) |
