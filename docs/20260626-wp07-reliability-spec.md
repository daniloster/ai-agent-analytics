# SPEC: WP-07 - Section 3: Reliability

**Date:** 2026-06-26
**Source plan:** `docs/20260626-analytics-dashboard-plan.md` WP-07
**Investigation:** `docs/20260626-cloud-agent-analytics-dashboard-investigation.md` Appendix A §Section 3

---

## Assumptions (confirmed or defaulted)

- Error rate threshold line at 5% (investigation: "anything above 5% is problematic for a production tool")
- Availability heatmap uses `colorScale='availability'` variant from the Heatmap primitive (WP-03)
- Incident log is shown only when `incidents.length > 0` (not gated on `mttr_minutes` alone)
- KpiCard is imported from `src/components/kpis/KpiCard.tsx` (created in WP-05)
- P50/P95/P99 rendered as three separate KpiCards side by side (no sparkline; values are stat cards)
- MTTR shows "No incidents" as the metric value when `mttr_minutes` is null
- KPI-35 `subValue` shows the failed-run cost as both dollar amount and percentage of total spend
- `computeErrorRateSeverity` is a pure function extracted to `src/lib/kpi/formulas.ts`

---

## 1. Context

Implements Investigation Appendix A §Section 3: KPI-26 through KPI-35 (Overall Error Rate, Timeout Rate, P50/P95/P99 Run Duration, Queue Wait Time, Error Type Breakdown, Retry Rate, Platform Availability, Error Trend, MTTR, Cost of Failed Runs).

**Files created:**
- `src/components/sections/Reliability.tsx` - section container and layout
- `src/components/kpis/IncidentTable.tsx` - shadcn/ui Table for incident log

**Files modified:**
- `src/lib/kpi/formulas.ts` - adds `computeErrorRateSeverity`

**Imports from prior WPs:**
- `KpiCard` from `src/components/kpis/KpiCard.tsx` (WP-05)
- `AreaChart`, `DonutChart`, `Heatmap` from `src/components/charts/` (WP-03)
- `filterQueryParams` from `src/lib/filters/filterSignals.ts` (WP-04)

**TanStack Query key:** `['reliability', filterQueryParams.value]`

This WP is fully independent of WP-06 (Team Breakdown). It shares only the primitive chart layer (WP-03) and filter signals (WP-04).

---

## 2. Data model

```ts
// src/types/api.ts additions (WP-02 already defines ReliabilityResponse;
// these are the shapes this SPEC references)

type ErrorRateSeverity = 'good' | 'warning' | 'critical'
// good:     error_rate < 0.02
// warning:  0.02 <= error_rate < 0.05
// critical: error_rate >= 0.05

interface ErrorTrendPoint {
  date: string        // ISO date
  error_rate: number  // 0.0 - 1.0
}

interface AvailabilityPoint {
  date: string        // ISO date
  uptime_pct: number  // 0.0 - 100.0
}

interface Incident {
  detected_at: string
  resolved_at: string | null
  mttr_minutes: number | null
  error_type: string
}

// IncidentTable props
interface IncidentTableProps {
  incidents: Incident[]
}

// ReliabilityResponse (reference shape from WP-02)
interface ReliabilityResponse {
  error_rate: number
  error_rate_delta: number
  timeout_rate: number
  timeout_rate_delta: number
  p50_duration_s: number
  p95_duration_s: number
  p99_duration_s: number
  queue_wait_median_s: number
  error_type_breakdown: Array<{ type: string; count: number }>
  retry_rate: number
  mttr_minutes: number | null
  failed_run_cost: number
  failed_run_cost_pct: number
  error_trend_7d: ErrorTrendPoint[]
  availability_by_day: AvailabilityPoint[]
  incidents: Incident[]
}
```

---

## 3. Component / module design

### New files

**`src/components/sections/Reliability.tsx`**

Single responsibility: fetch reliability data and render the Section 3 layout.

```ts
export function Reliability(): JSX.Element

// Internal layout (not exported):
// - Row 1: 4 KpiCard columns
// - Row 2: AreaChart (error trend) + DonutChart (error types)
// - Row 3: 3 KpiCards (Retry Rate, MTTR, Cost of Failed Runs)
// - Row 4: Heatmap (availability calendar) + conditional IncidentTable
```

**`src/components/kpis/IncidentTable.tsx`**

Single responsibility: render a shadcn/ui Table of incidents sorted descending by `detected_at`.

```ts
export function IncidentTable(props: IncidentTableProps): JSX.Element
// Columns: Detected At | Resolved At | MTTR | Error Type
// "Resolved At" shows "Unresolved" in amber when resolved_at is null
// "MTTR" shows "-" when mttr_minutes is null
// "Error Type" renders as a shadcn/ui Badge
```

### Modified files

**`src/lib/kpi/formulas.ts`** - add:

```ts
export function computeErrorRateSeverity(errorRate: number): ErrorRateSeverity
// errorRate is 0.0 - 1.0 (not a percentage)
// < 0.02  -> 'good'
// < 0.05  -> 'warning'
// >= 0.05 -> 'critical'
```

### Public API surface

```ts
// src/components/sections/Reliability.tsx
export function Reliability(): JSX.Element

// src/components/kpis/IncidentTable.tsx
export function IncidentTable(props: IncidentTableProps): JSX.Element

// src/lib/kpi/formulas.ts (addition)
export function computeErrorRateSeverity(errorRate: number): ErrorRateSeverity
```

---

## 4. Interaction diagram

### Data flow

```
Reliability mounts
  --> useQuery({ queryKey: ['reliability', filterQueryParams.value], refetchInterval: 30_000 })
  --> ReliabilityResponse

error_rate (number) --> computeErrorRateSeverity(error_rate)
  --> ErrorRateSeverity --> colored dot in KpiCard header ('good'=green, 'warning'=amber, 'critical'=red)

error_trend_7d: ErrorTrendPoint[]
  --> AreaChart:
        data={error_trend_7d}
        series={[{ key: 'error_rate', label: 'Error Rate (7d avg)' }]}
        referenceLines={[{ y: 0.05, label: '5% threshold', variant: 'warning' }]}

error_type_breakdown: Array<{type, count}>
  --> DonutChart:
        data={error_type_breakdown}
        labelKey="type"
        valueKey="count"

availability_by_day: AvailabilityPoint[]
  --> Heatmap:
        data={availability_by_day}
        colorScale='availability'
        // 'availability' scale: uptime_pct >= 99.9 -> tokens.success (green)
        //                       uptime_pct >= 99.0 -> tokens.warning (amber)
        //                       uptime_pct <  99.0 -> tokens.destructive (red)
        getAriaLabel={(d) => `${d.date}: ${d.uptime_pct}% uptime`}

incidents: Incident[]
  --> incidents.length > 0
        ? <IncidentTable incidents={incidents} />
        : null
```

### State machine: MTTR display

```
mttr_minutes === null  -->  KpiCard value="No incidents"
mttr_minutes !== null  -->  KpiCard value="{mttr_minutes} min"
```

---

## 5. Acceptance criteria

1. The Reliability section renders exactly 7 KpiCards: Error Rate, Timeout Rate, P50 Duration, P95 Duration, P99 Duration, Retry Rate, MTTR - plus a Cost of Failed Runs KpiCard (8 total; P50/P95/P99 are three separate cards).
2. The Error Rate KpiCard shows a green status dot when `error_rate < 0.02`, amber when `0.02 <= error_rate < 0.05`, red when `error_rate >= 0.05`.
3. The error trend AreaChart renders a horizontal reference line at y=0.05 labeled "5% threshold".
4. The error type DonutChart renders exactly as many arcs as there are entries in `error_type_breakdown` (typically 4: context_overflow, tool_failure, rate_limit, infrastructure).
5. The availability Heatmap renders one cell per entry in `availability_by_day`; each cell has an `aria-label` attribute containing the date and uptime percentage.
6. When `incidents` has entries, IncidentTable is rendered with rows sorted by `detected_at` descending.
7. When `incidents` is an empty array, IncidentTable is not rendered (not present in DOM).
8. The MTTR KpiCard shows "No incidents" as its metric value when `mttr_minutes` is null.
9. The Cost of Failed Runs KpiCard shows the dollar value as the primary metric and the percentage of total spend as `subValue` (e.g., "$680 / 4.8% of spend").
10. `computeErrorRateSeverity(0.06)` returns `'critical'`; `computeErrorRateSeverity(0.03)` returns `'warning'`; `computeErrorRateSeverity(0.01)` returns `'good'`.
11. `computeErrorRateSeverity(0.02)` returns `'warning'` (boundary is inclusive on the warning side); `computeErrorRateSeverity(0.05)` returns `'critical'` (boundary is inclusive on the critical side).

---

## 6. Out of scope

- Alerting or push notifications on threshold breach (separate initiative)
- Real-time error rate streaming or WebSocket updates (v2)
- Individual error log drill-down (per-run error detail)
- Incident creation or acknowledgement UI (read-only display only)
- Custom threshold configuration (the 5% threshold is hardcoded in v1)

---

## Test plan

| File | What it tests |
|------|---------------|
| `src/components/kpis/IncidentTable.test.ts` (new) | Rows render sorted descending by `detected_at`; `resolved_at=null` renders "Unresolved" in amber; `mttr_minutes=null` renders "-"; Error Type renders as a Badge |
| `src/components/sections/Reliability.test.ts` (new) | 8 KpiCards rendered; Error Rate KpiCard has green/amber/red dot for respective thresholds; AreaChart is present; DonutChart is present; Heatmap cell count equals `availability_by_day.length`; IncidentTable absent when `incidents=[]`; IncidentTable present when `incidents` has entries; MTTR KpiCard shows "No incidents" when `mttr_minutes=null` |
| `src/lib/kpi/formulas.test.ts` (modified - add cases) | `computeErrorRateSeverity`: values 0.01, 0.02, 0.03, 0.05, 0.06 produce correct severity; boundary values at 0.02 and 0.05 are inclusive |
