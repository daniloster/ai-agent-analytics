# SPEC: WP-08 - Section 4: Billing & Financial

**Date:** 2026-06-26
**Source plan:** `docs/20260626-analytics-dashboard-plan.md` WP-08
**Investigation:** `docs/20260626-cloud-agent-analytics-dashboard-investigation.md` Appendix A §Section 4

---

## Assumptions (confirmed or defaulted)

- GaugeChart is a 180-degree semicircle arc built from `@visx/shape` `<Pie>` with `startAngle=-Math.PI/2, endAngle=Math.PI/2`; it is a new chart component, not a variant of DonutChart
- KpiCard imported from `src/components/kpis/KpiCard.tsx` (WP-05); `computeProjectedMonthEnd` imported from `src/lib/kpi/formulas.ts` (WP-05)
- Cost anomaly heatmap uses `colorScale='cost'` variant from Heatmap primitive (WP-03); anomaly cells use `tokens.destructive`
- Billing period = calendar month (investigation §10: "v1 assumes calendar month")
- ChargebackTable is a shadcn/ui Table (not a chart); exported from `src/components/kpis/ChargebackTable.tsx`
- KPI-46, KPI-47, KPI-48 (cross-cutting quality block) are included in this section as a final row
- Token Rate Efficiency (KPI-40) displays actual rate vs. list rate side by side with a badge showing % discount
- BarChart `trendLine` prop overlays a `<LinePath>` within the same SVG (implemented inside BarChart.tsx per WP-03)

---

## 1. Context

Implements Investigation Appendix A §Section 4 (KPI-36 through KPI-45) and cross-cutting KPIs 46, 47, 48.

KPI-45 (Cost of Failed Runs - billing context) is a cross-reference to KPI-35 from the Reliability section. It shares the same data source; the billing section renders it with billing framing.

**Files created:**
- `src/components/sections/Billing.tsx` - section container and layout
- `src/components/charts/GaugeChart.tsx` - 180-degree arc gauge (new chart type)
- `src/components/kpis/ChargebackTable.tsx` - shadcn/ui Table for team chargeback

**Files modified:**
- `src/lib/kpi/formulas.ts` - adds three formula functions

**Imports from prior WPs:**
- `KpiCard` from `src/components/kpis/KpiCard.tsx` (WP-05)
- `computeProjectedMonthEnd` from `src/lib/kpi/formulas.ts` (WP-05)
- `AreaChart`, `BarChart`, `DonutChart`, `Heatmap` from `src/components/charts/` (WP-03)
- `ChartTokens`, `useChartTokens` from `src/components/charts/primitives/useChartTokens.ts` (WP-03)
- `filterQueryParams` from `src/lib/filters/filterSignals.ts` (WP-04)

**TanStack Query key:** `['billing', filterQueryParams.value]`

Depends on WP-05 for KpiCard and the projection formula. Independent of WP-06 and WP-07.

---

## 2. Data model

```ts
// GaugeChart props
interface GaugeChartProps {
  value: number        // 0-100 percentage to fill
  label: string        // large center label, e.g. "65.3%"
  subLabel?: string    // small center sub-label, e.g. "of $15,000 budget"
  tokens: ChartTokens  // from useChartTokens(); drives color
}
// Color logic: if value > 90 use tokens.destructive; else use tokens.primary
// Background arc always uses tokens.muted (gray, 100% fill)

// ChargebackTable props
interface ChargebackTableProps {
  rows: Array<{
    team_id: string
    team_name: string
    seat_cost_prorated: number
    token_cost: number
    total: number
    percentage: number  // 0-100, this team's share of org total
  }>
}
// Renders rows sorted descending by `total`
// Last row is a fixed "Organization Total" summary row (sum of all columns)

// BillingResponse (reference shape from WP-02)
interface BillingResponse {
  current_month_spend: number
  days_elapsed: number
  days_in_month: number
  monthly_budget: number
  projected_month_end: number        // pre-computed: (current_month_spend / days_elapsed) * days_in_month
  budget_utilization: number         // 0-100
  projected_annual_spend: number     // pre-computed from 90d rate
  invoice_history: Array<{ month: string; total_billed: number }>  // 6 entries
  cost_by_team: ChargebackTableProps['rows']
  cost_anomaly_days: Array<{
    date: string
    daily_cost: number
    avg_daily_cost: number
    is_anomaly: boolean
  }>
  cost_per_successful_run: number
  token_rate_actual: number          // effective $/1M tokens
  token_rate_list: number            // list price $/1M tokens
  failed_run_cost: number            // cross-ref KPI-35
  failed_run_cost_pct: number
  // cross-cutting quality block
  quality_cost_efficiency: number | null  // KPI-46; null when quality data unavailable
  churn_risk_count: number           // KPI-47
  new_user_activation_cost: number | null  // KPI-48; null when insufficient new users
  // for projected spend AreaChart
  daily_actuals: Array<{ date: string; cumulative_spend: number }>
}
```

---

## 3. Component / module design

### New files

**`src/components/charts/GaugeChart.tsx`**

Single responsibility: render a 180-degree semicircle progress arc.

```ts
export function GaugeChart(props: GaugeChartProps): JSX.Element
// Uses @visx/shape Pie internally with two arcs:
//   background arc: startAngle=-Math.PI/2, endAngle=Math.PI/2, fill=tokens.muted
//   foreground arc: startAngle=-Math.PI/2, endAngle computed from value%, fill varies by threshold
// Center text: props.label (large) + props.subLabel (small) absolutely positioned
// No per-data-element keyboard navigation (display only; not a data series)
// Wrapped in ChartSVG (WP-03) for responsive sizing
```

**`src/components/kpis/ChargebackTable.tsx`**

Single responsibility: render chargeback rows in a shadcn/ui Table.

```ts
export function ChargebackTable(props: ChargebackTableProps): JSX.Element
// Columns: Team | Seat Cost | Token Cost | Total | % of Org
// All currency columns formatted as "$X,XXX.XX"
// Percentage column formatted as "XX.X%"
// Rows sorted descending by total (caller may pre-sort; component sorts defensively)
// Final "Organization Total" row uses <tfoot> with bold styling
```

**`src/components/sections/Billing.tsx`**

Single responsibility: fetch billing data and render the Section 4 layout.

```ts
export function Billing(): JSX.Element
// Layout:
//   id="billing" aria-labelledby="billing-heading" (scroll anchor per Section.tsx from WP-04)
//   Row 1: 4-column grid
//     col 1: KpiCard KPI-36 Current Month Spend (progress bar subcomponent showing spend/budget)
//     col 2: KpiCard KPI-37 Projected Month-End (subValue = "Day {days_elapsed} of {days_in_month}")
//     col 3: GaugeChart KPI-38 Budget Utilization (NOT a KpiCard)
//     col 4: KpiCard KPI-43 Projected Annual Spend
//   Row 2: 2-column grid
//     col 1: <figure><figcaption>Cumulative Spend vs Budget</figcaption>
//              AreaChart: daily_actuals + projected + budget reference line
//            </figure>
//     col 2: <figure><figcaption>Invoice History</figcaption>
//              BarChart: invoice_history (6 bars) with trendLine prop
//            </figure>
//   Row 3: 2-column grid
//     col 1: <figure><figcaption>Cost Allocation by Team</figcaption>
//              DonutChart: cost_by_team (labelKey="team_name", valueKey="total")
//            </figure>
//     col 2: ChargebackTable rows={cost_by_team}
//   Row 4: full width
//     <figure><figcaption>Cost Anomaly Calendar</figcaption>
//       Heatmap: cost_anomaly_days colorScale='cost'
//     </figure>
//   Row 5: 3-column grid
//     KpiCard KPI-39 Cost per Successful Run
//     KpiCard KPI-40 Token Rate Efficiency
//     KpiCard KPI-45 Cost of Failed Runs (cross-ref note in tooltip)
//   Row 6: 3-column grid (cross-cutting quality block)
//     KpiCard KPI-46 Quality-Cost Efficiency Score (insufficientData when quality_cost_efficiency is null)
//     KpiCard KPI-47 User Churn Risk Count
//     KpiCard KPI-48 New User Cost to Activate (insufficientData when new_user_activation_cost is null)
```

### Modified files

**`src/lib/kpi/formulas.ts`** - add three pure functions:

```ts
// Projected full-year spend from trailing 90-day cost
export function computeProjectedAnnualSpend(cost90d: number): number
// Returns: (cost90d / 90) * 365

// Effective token rate in $/1M tokens
export function computeTokenRateEfficiency(totalTokenCost: number, totalTokens: number): number
// Returns: totalTokenCost / (totalTokens / 1_000_000)
// Guard: return 0 when totalTokens === 0

// Average cost per successful run
export function computeCostPerSuccessfulRun(totalCost: number, successfulRunCount: number): number
// Returns: totalCost / successfulRunCount
// Guard: return 0 when successfulRunCount === 0
```

### Public API surface

```ts
// src/components/charts/GaugeChart.tsx
export function GaugeChart(props: GaugeChartProps): JSX.Element

// src/components/kpis/ChargebackTable.tsx
export function ChargebackTable(props: ChargebackTableProps): JSX.Element

// src/components/sections/Billing.tsx
export function Billing(): JSX.Element

// src/lib/kpi/formulas.ts (additions)
export function computeProjectedAnnualSpend(cost90d: number): number
export function computeTokenRateEfficiency(totalTokenCost: number, totalTokens: number): number
export function computeCostPerSuccessfulRun(totalCost: number, successfulRunCount: number): number
```

---

## 4. Interaction diagram

### Budget utilization gauge

```
BillingResponse.budget_utilization (e.g. 65.3)
  --> tokens = useChartTokens()
  --> GaugeChart:
        value=65.3
        label="65.3%"
        subLabel="of $15,000 budget"
        tokens=tokens
  --> value > 90?
        yes: foreground arc fill = tokens.destructive
        no:  foreground arc fill = tokens.primary
```

### Projected spend AreaChart

```
BillingResponse: { daily_actuals, projected_month_end, days_elapsed, days_in_month, monthly_budget }
  --> compute daily_rate = current_month_spend / days_elapsed
  --> build projected array:
        for day in (days_elapsed + 1)..days_in_month:
          { date: ..., cumulative_spend: daily_actuals[last].cumulative_spend + daily_rate * (day - days_elapsed) }
  --> AreaChart:
        data = [...daily_actuals, ...projected]
        series = [
          { key: 'cumulative_spend', label: 'Actual',    dashed: false },
          { key: 'cumulative_spend', label: 'Projected', dashed: true  },
          // actuals and projected share the key; AreaChart uses a 'projected' boolean on each point
          // to switch stroke style - OR implemented as two separate series with a split at today
        ]
        referenceLines = [{ y: monthly_budget, label: 'Budget', variant: 'warning' }]
```

Note: the simplest implementation passes two separate series arrays: `actualSeries` (up to today) and `projectedSeries` (from today to month end). BarChart already supports multi-series. AreaChart `dashed` prop is per-series.

### Invoice history BarChart with trend line

```
BillingResponse.invoice_history: Array<{month, total_billed}> (6 items)
  --> BarChart:
        data={invoice_history}
        xKey="month"
        yKey="total_billed"
        trendLine={true}
        // trendLine=true renders a <LinePath> through bar midpoints in the same SVG
        // using tokens.muted stroke and no fill
```

### Cost anomaly heatmap

```
BillingResponse.cost_anomaly_days: Array<{date, daily_cost, avg_daily_cost, is_anomaly}>
  --> Heatmap:
        colorScale='cost'
        // 'cost' colorScale logic in Heatmap.tsx:
        //   is_anomaly=true  -> tokens.destructive (red)
        //   is_anomaly=false -> tokens.muted (neutral)
        getAriaLabel={(d) => `${d.date}: $${d.daily_cost.toFixed(0)} (avg $${d.avg_daily_cost.toFixed(0)})`}
        getTooltip={(d) => same string as aria-label
```

### Cross-cutting quality block

```
BillingResponse.quality_cost_efficiency (number | null)
  --> KpiCard KPI-46:
        insufficientData={quality_cost_efficiency === null}
        value={quality_cost_efficiency ?? 0}

BillingResponse.new_user_activation_cost (number | null)
  --> KpiCard KPI-48:
        insufficientData={new_user_activation_cost === null}
        value={new_user_activation_cost ?? 0}
```

---

## 5. Acceptance criteria

1. The Billing section renders a GaugeChart (not a KpiCard) for Budget Utilization (KPI-38) as a semicircular arc.
2. When `budget_utilization > 90`, the GaugeChart foreground arc color is the destructive (red) CSS token; otherwise it is the primary token.
3. The projected spend AreaChart renders a dashed series from today to month end alongside the solid actual series.
4. The projected spend AreaChart renders a flat horizontal reference line at `monthly_budget`.
5. The invoice history BarChart renders exactly 6 bars (one per month in `invoice_history`) with a trend line overlay.
6. ChargebackTable rows are sorted descending by `total`; the last rendered row is "Organization Total" with summed values.
7. The cost anomaly Heatmap renders exactly `cost_anomaly_days.length` cells; cells where `is_anomaly=true` use the destructive color token.
8. Every Heatmap cell has an `aria-label` attribute containing the date and the daily cost amount.
9. KPI-46 KpiCard shows "Insufficient data" when `quality_cost_efficiency` is `null`.
10. KPI-48 KpiCard shows "Insufficient data" when `new_user_activation_cost` is `null`.
11. `computeProjectedAnnualSpend(38780)` returns `(38780 / 90) * 365` (approximately 157,300).
12. `computeTokenRateEfficiency(0, 0)` returns `0` (guard against division by zero).
13. `computeCostPerSuccessfulRun(0, 0)` returns `0` (guard against division by zero).

---

## 6. Out of scope

- Export to CSV/PDF (v2)
- Real billing API integration (v1 is fully mocked via MSW)
- Invoice PDF download link
- Retroactive budget adjustment UI
- Multi-currency support (v1 assumes USD only)
- Commitment / contract term view (annual vs. monthly contract)

---

## Test plan

| File | What it tests |
|------|---------------|
| `src/components/charts/GaugeChart.test.ts` (new) | SVG renders; foreground arc uses destructive color when value=91; foreground arc uses primary color when value=89; center label text rendered; subLabel rendered when provided |
| `src/components/kpis/ChargebackTable.test.ts` (new) | Rows sorted descending by total; "Organization Total" row is last; currency values formatted with "$"; percentage values formatted with "%"; handles single-row input |
| `src/components/sections/Billing.test.ts` (new) | GaugeChart present in DOM; invoice history BarChart present; anomaly Heatmap present with correct cell count; KPI-46 KpiCard shows "Insufficient data" when null; KPI-48 KpiCard shows "Insufficient data" when null; ChargebackTable present with correct row count |
| `src/lib/kpi/formulas.test.ts` (modified - add cases) | `computeProjectedAnnualSpend(38780)` ~= 157300; `computeProjectedAnnualSpend(0)` = 0; `computeTokenRateEfficiency(3, 1_000_000)` = 3.0; `computeTokenRateEfficiency(0, 0)` = 0; `computeCostPerSuccessfulRun(14200, 11720)` ~= 1.21; `computeCostPerSuccessfulRun(0, 0)` = 0 |
