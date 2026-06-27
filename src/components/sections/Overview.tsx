import { useQuery } from "@tanstack/react-query";
import { useDeepComputed } from "../../hooks/useDeepComputed";
import { filterQueryParams } from "../../lib/filters/filterSignals";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatQuality,
  formatTokens,
} from "../../lib/kpi/formatters";
import {
  computeCostPerQualityPoint,
  computeDeltaPercent,
  computeRetentionCost,
} from "../../lib/kpi/formulas";
import type {
  OrgConfig,
  OverviewResponse,
  TimeseriesResponse,
} from "../../types/api";
import type { MonthlyQualityPoint } from "../../utils/aggregateQualityMonthly";
import { aggregateQualityMonthly } from "../../utils/aggregateQualityMonthly";
import { buildQueryParams } from "../../utils/buildQueryParams";
import { AreaChart } from "../charts/AreaChart";
import { ColumnChart } from "../charts/ColumnChart";
import { Annotation } from "../charts/overlays/Annotation";
import { DataLabels } from "../charts/overlays/DataLabels";
import { SeriesTooltip } from "../charts/overlays/SeriesTooltip";
import { Visualization, defineAxes } from "../charts/Visualization";
import { KpiCard } from "../kpis/KpiCard";
import { Section } from "../layout/Section";
import { Skeleton } from "../ui/skeleton";

const AREA_AXES = defineAxes([
  {
    id: "x",
    type: "time" as const,
    position: "bottom" as const,
    accessor: (d) => new Date((d as { date: string }).date),
    numTicks: 5,
  },
  {
    id: "y",
    type: "linear" as const,
    position: "left" as const,
    accessor: (d) => (d as { value: number }).value,
    domain: "auto" as const,
    numTicks: 4,
  },
]);

const QUALITY_VOLUME_COLOR = "#ddd6fe";
const QUALITY_LINE_COLOR = "#7c3aed";
const QUALITY_COLUMN_COLOR = "#2563eb55";

/** Dynamically scales quality y-axis to data range, avoiding forced 0-minimum. */
function buildQualityTrendAxes(data: Record<string, unknown[]>) {
  const pts = (data["quality"] ?? []) as MonthlyQualityPoint[];
  const qValues = pts
    .map((p) => p.quality)
    .filter((v): v is number => v !== null);
  const minQ = qValues.length > 0 ? Math.min(...qValues) : 1;
  const maxQ = qValues.length > 0 ? Math.max(...qValues) : 5;
  const paddedMin = Math.max(0, Math.floor((minQ - 0.5) * 2) / 2);
  const paddedMax = Math.min(5.5, maxQ + 0.5);
  return [
    {
      id: "x",
      type: "band" as const,
      position: "bottom" as const,
      accessor: (d: Record<string, unknown>) =>
        (d as unknown as MonthlyQualityPoint).label,
    },
    {
      id: "quality_y",
      type: "linear" as const,
      position: "left" as const,
      accessor: (d: Record<string, unknown>) =>
        (d as unknown as MonthlyQualityPoint).quality ?? 0,
      domain: [paddedMin, paddedMax] as [number, number],
      numTicks: 5,
    },
    {
      id: "volume_y",
      type: "linear" as const,
      position: "right" as const,
      accessor: (d: Record<string, unknown>) =>
        (d as unknown as MonthlyQualityPoint).volume,
      hidden: true,
      numTicks: 4,
    },
  ];
}

/** Returns the first day of the month that is `monthsBack` calendar months before `dateStr`. */
function qualityTrendFrom(dateStr: string, monthsBack: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() - monthsBack);
  d.setUTCDate(1);
  return d.toISOString().slice(0, 10);
}

export function Overview(): JSX.Element {
  const params = filterQueryParams.value;

  const overview = useQuery<OverviewResponse>({
    queryKey: ["overview", params],
    queryFn: () =>
      fetch("/api/analytics/overview?" + buildQueryParams(params)).then(
        (r) => r.json() as Promise<OverviewResponse>,
      ),
  });

  const timeseries = useQuery<TimeseriesResponse>({
    queryKey: ["timeseries", params],
    queryFn: () =>
      fetch("/api/analytics/timeseries?" + buildQueryParams(params)).then(
        (r) => r.json() as Promise<TimeseriesResponse>,
      ),
  });

  const orgConfigQuery = useQuery<OrgConfig>({
    queryKey: ["org/config"],
    queryFn: () =>
      fetch("/api/org/config").then((r) => r.json() as Promise<OrgConfig>),
  });

  const qtFrom = qualityTrendFrom(params.to, 5);
  const qualityTrendQuery = useQuery<TimeseriesResponse>({
    queryKey: ["quality-trend", qtFrom, params.to],
    queryFn: () =>
      fetch(`/api/analytics/timeseries?from=${qtFrom}&to=${params.to}`).then(
        (r) => r.json() as Promise<TimeseriesResponse>,
      ),
  });

  const d = overview.data;
  const ts = timeseries.data;
  const orgConfig = orgConfigQuery.data;
  const loading = overview.isLoading || timeseries.isLoading;

  const retentionCost = d
    ? computeRetentionCost(d.total_cost, d.retained_users_7d)
    : null;
  const costPerQualityPoint = d
    ? computeCostPerQualityPoint(
        d.total_cost,
        d.rated_run_count,
        d.avg_quality_score,
      )
    : null;
  const todayStr = new Date().toISOString().slice(0, 10);

  const tokenSeries = ts
    ? [
        {
          id: "input_tokens",
          label: "Input Tokens",
          color: "#0d9488",
          formatValue: formatTokens,
          data: ts.points.map((p) => ({ date: p.date, value: p.input_tokens })),
        },
        {
          id: "output_tokens",
          label: "Output Tokens",
          color: "#2563eb",
          formatValue: formatTokens,
          data: ts.points.map((p) => ({
            date: p.date,
            value: p.output_tokens,
          })),
        },
      ]
    : [];

  const { costSeries, projectedCostData, budgetPct } = (() => {
    if (!ts)
      return {
        costSeries: [],
        projectedCostData: [] as Array<{ date: string; value: number }>,
        budgetPct: null,
      };

    let cumCost = 0;
    const actualData: Array<{ date: string; value: number }> = [];

    for (const p of ts.points) {
      cumCost += p.cost;
      if (p.date <= todayStr) {
        actualData.push({ date: p.date, value: cumCost });
      }
    }

    const daysActual = Math.max(1, actualData.length);
    const dailyAvg = cumCost / daysActual;
    let projCum =
      actualData.length > 0 ? actualData[actualData.length - 1]!.value : 0;
    const futurePoints = ts.points.filter((p) => p.date > todayStr);
    const projected: Array<{ date: string; value: number }> = [];

    if (futurePoints.length > 0 && actualData.length > 0) {
      projected.push(actualData[actualData.length - 1]!);
      for (const p of futurePoints) {
        projCum += dailyAvg;
        projected.push({ date: p.date, value: projCum });
      }
    }

    const lastActualCost =
      actualData.length > 0
        ? actualData[actualData.length - 1]!.value
        : cumCost;
    const pct =
      orgConfig && orgConfig.monthly_budget > 0
        ? (lastActualCost / orgConfig.monthly_budget) * 100
        : null;

    const series = [
      {
        id: "cost",
        label: "Actual",
        color: "#2563eb" as const,
        formatValue: formatCurrency,
        data: actualData,
      },
      ...(projected.length > 1
        ? [
            {
              id: "cost_projected",
              label: "Projected",
              color: "#2563eb" as const,
              dashed: true,
              fillOpacity: 0.05,
              formatValue: formatCurrency,
              data: projected,
            },
          ]
        : []),
    ];

    return { costSeries: series, projectedCostData: projected, budgetPct: pct };
  })();

  // Data signals for Visualization consumers
  const tokenDataSig = useDeepComputed(() => {
    const result: Record<
      string,
      Array<{ date: string; value: number; [k: string]: unknown }>
    > = {};
    for (const s of tokenSeries) {
      result[s.id] = s.data.map((d) => ({ ...d, [s.id]: d.value }));
    }
    return result;
  });

  const costDataSig = useDeepComputed(() => {
    const result: Record<
      string,
      Array<{ date: string; value: number; [k: string]: unknown }>
    > = {};
    for (const s of costSeries) {
      result[s.id] = s.data.map((d) => ({ ...d, [s.id]: d.value }));
    }
    return result;
  });

  const qualityMonthly = useDeepComputed(() => {
    const qtPoints = qualityTrendQuery.data?.points ?? [];
    return aggregateQualityMonthly(qtPoints, params.to);
  });

  const qualityTrendDataSig = useDeepComputed(() => {
    const monthly = qualityMonthly.value;
    if (monthly.length === 0)
      return {} as Record<string, MonthlyQualityPoint[]>;
    return { quality: monthly, volume: monthly };
  });

  return (
    <Section id="overview" labelledBy="overview-heading">
      <div className="mb-6">
        <h2
          id="overview-heading"
          className="text-[22px] font-bold tracking-tight text-foreground"
        >
          Overview
        </h2>
        <p className="text-[13px] text-muted-foreground mt-1">
          Summary of AI agent usage and costs
        </p>
      </div>

      {/* Row 1 */}
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Total Runs"
          value={d ? formatNumber(d.total_runs) : undefined}
          delta={
            d
              ? computeDeltaPercent(d.total_runs, d.total_runs_prior)
              : undefined
          }
          deltaLabel="vs last month"
          trend={ts?.points.map((p) => ({ date: p.date, value: p.runs }))}
          trendColor="#7c3aed"
          formulaTooltip="Total number of AI agent runs in the selected period."
          exampleTooltip="e.g. 12,450 runs"
        />
        <KpiCard
          label="Active Users"
          value={d ? formatNumber(d.mau) : undefined}
          delta={d ? computeDeltaPercent(d.mau, d.mau_prior) : undefined}
          deltaLabel="vs previous period"
          trend={ts?.points.map((p) => ({ date: p.date, value: p.dau }))}
          trendColor="#7c3aed"
          formulaTooltip="Unique users who ran at least one request this period."
          exampleTooltip="e.g. 340 users"
        />
        <KpiCard
          label="Seat Adoption"
          value={
            d
              ? formatPercent(
                  d.seat_count > 0 ? (d.mau / d.seat_count) * 100 : 0,
                )
              : undefined
          }
          delta={d ? d.mau - d.mau_prior : undefined}
          deltaFormat="number"
          deltaLabel={
            d
              ? `${formatNumber(d.mau)} / ${formatNumber(d.seat_count)} seats`
              : undefined
          }
          trend={
            ts && d
              ? ts.points.map((p) => ({
                  date: p.date,
                  value: d.seat_count > 0 ? (p.dau / d.seat_count) * 100 : 0,
                }))
              : undefined
          }
          trendColor="#7c3aed"
          formulaTooltip="Percentage of provisioned seats used by active users this period - how much of your licensed capacity is being utilized."
          exampleTooltip="e.g. 85.0% (340 of 400 seats)"
        />
        <KpiCard
          label="Total Cost"
          value={d ? formatCurrency(d.total_cost) : undefined}
          delta={
            d
              ? -computeDeltaPercent(d.total_cost, d.total_cost_prior)
              : undefined
          }
          deltaLabel="vs prior period"
          trend={ts?.points.map((p) => ({ date: p.date, value: p.cost }))}
          trendColor="#7c3aed"
          formulaTooltip="Total API spend in the selected period."
          exampleTooltip="e.g. $14,200"
        />
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-4 gap-4 mt-4">
        <KpiCard
          label="7 Days Retention Cost"
          value={
            d && retentionCost !== null
              ? formatCurrency(retentionCost)
              : undefined
          }
          valueSuffix="/user"
          delta={
            d && retentionCost !== null && d.retention_cost_prior > 0
              ? -computeDeltaPercent(retentionCost, d.retention_cost_prior)
              : undefined
          }
          deltaLabel={
            d && retentionCost !== null
              ? retentionCost <= d.retention_cost_prior
                ? "improving efficiency"
                : "degrading efficiency"
              : undefined
          }
          trend={ts?.points.map((p) => ({
            date: p.date,
            value: p.dau > 0 ? p.cost / p.dau : 0,
          }))}
          trendColor="#7c3aed"
          formulaTooltip="Total cost / users retained in the last 7 days of the period."
          exampleTooltip="e.g. $100.00 / user"
        />
        <KpiCard
          label="Success Rate"
          value={d ? formatPercent(d.success_rate) : undefined}
          delta={
            d
              ? computeDeltaPercent(d.success_rate, d.success_rate_prior)
              : undefined
          }
          deltaLabel={
            d
              ? d.success_rate >= d.success_rate_prior
                ? "watch requests count"
                : "watch errors"
              : undefined
          }
          trend={ts?.points.map((p) => ({
            date: p.date,
            value: 100 - p.error_rate,
          }))}
          trendColor="#7c3aed"
          formulaTooltip="Percentage of runs that completed successfully."
          exampleTooltip="e.g. 94.2%"
        />
        <KpiCard
          label="Quality Score"
          value={
            d && d.avg_quality_score !== null
              ? formatQuality(d.avg_quality_score)
              : d
                ? ""
                : undefined
          }
          insufficientData={d ? d.avg_quality_score === null : undefined}
          insufficientDataReason={
            d && d.avg_quality_score === null
              ? "Fewer than 10 rated runs"
              : undefined
          }
          delta={
            d &&
            d.avg_quality_score !== null &&
            d.avg_quality_score_prior !== null
              ? d.avg_quality_score - d.avg_quality_score_prior
              : undefined
          }
          deltaFormat="decimal"
          deltaLabel={
            d && d.avg_quality_score !== null ? "vs previous period" : undefined
          }
          starRating={d ? d.avg_quality_score : undefined}
          starRatingSubtext={
            d && d.avg_quality_score !== null
              ? `Based on ${formatNumber(d.rated_run_count)} human-rated runs`
              : undefined
          }
          formulaTooltip="Average quality score from rated runs (1-5 scale)."
          exampleTooltip="e.g. 4.1 / 5.0"
        />
        <KpiCard
          label="Cost / Quality Point"
          value={
            d && costPerQualityPoint !== null
              ? formatCurrency(costPerQualityPoint)
              : d
                ? ""
                : undefined
          }
          insufficientData={d ? costPerQualityPoint === null : undefined}
          insufficientDataReason={
            d && costPerQualityPoint === null
              ? "Fewer than 10 rated runs"
              : undefined
          }
          delta={
            d &&
            costPerQualityPoint !== null &&
            d.cost_per_quality_point_prior !== null
              ? -computeDeltaPercent(
                  costPerQualityPoint,
                  d.cost_per_quality_point_prior,
                )
              : undefined
          }
          deltaLabel={
            d &&
            costPerQualityPoint !== null &&
            d.cost_per_quality_point_prior !== null
              ? costPerQualityPoint <= d.cost_per_quality_point_prior
                ? "improving efficiency"
                : "degrading efficiency"
              : undefined
          }
          trend={ts?.points
            .filter(
              (p) => p.avg_quality_score !== null && p.avg_quality_score > 0,
            )
            .map((p) => ({
              date: p.date,
              value: p.cost / p.avg_quality_score!,
            }))}
          trendColor="#7c3aed"
          formulaTooltip="How much you spend per unit of quality delivered. Calculated as total cost divided by the volume of quality-rated outputs. Lower means better value."
          exampleTooltip="e.g. $0.42 per quality point"
        />
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <figure
          className="rounded-lg border bg-card shadow-sm p-6"
          aria-label="Token usage over time"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[14px] font-semibold text-foreground">
                Token usage over time
              </p>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Input and output tokens per day
              </p>
            </div>
            <div className="flex items-center gap-4">
              {tokenSeries.map((s) => (
                <span
                  key={s.id}
                  className="flex items-center gap-1.5 text-[11px] text-muted-foreground"
                >
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: s.color }}
                  />
                  {s.label}
                </span>
              ))}
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <Visualization
              data={tokenDataSig}
              axes={AREA_AXES}
              ariaLabel="Token usage over time"
            >
              {() => (
                <>
                  {tokenSeries.map((s) => (
                    <AreaChart
                      key={s.id}
                      series={s.id}
                      axis="y"
                      color={s.color}
                    />
                  ))}
                  <SeriesTooltip
                    series={tokenSeries.map((s) => ({
                      id: s.id,
                      label: s.label,
                      color: s.color,
                      formatValue: s.formatValue,
                    }))}
                  />
                </>
              )}
            </Visualization>
          )}
        </figure>
        <figure
          className="rounded-lg border bg-card shadow-sm p-6"
          aria-label="Cost vs budget"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[14px] font-semibold text-foreground">
                Cost vs. budget
              </p>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                MTD actual
                {budgetPct !== null
                  ? `, projected, ${budgetPct.toFixed(1)}% of budget`
                  : ""}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="inline-block h-[2px] w-4 rounded-sm bg-[#2563eb]" />
                Actual
              </span>
              {projectedCostData.length > 1 && (
                <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span
                    className="inline-block w-4"
                    style={{
                      height: "2px",
                      background:
                        "repeating-linear-gradient(90deg,#71717a 0,#71717a 4px,transparent 4px,transparent 7px)",
                    }}
                  />
                  Projected
                </span>
              )}
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span className="inline-block h-[2px] w-4 rounded-sm bg-red-500" />
                Budget
              </span>
            </div>
          </div>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <Visualization
              data={costDataSig}
              axes={AREA_AXES}
              ariaLabel="Cost vs. budget"
            >
              {() => (
                <>
                  {costSeries.map((s) => (
                    <AreaChart
                      key={s.id}
                      series={s.id}
                      axis="y"
                      color={s.color}
                      dashed={s.dashed}
                      fillOpacity={s.fillOpacity}
                    />
                  ))}
                  {orgConfig && (
                    <Annotation
                      axis="y"
                      value={orgConfig.monthly_budget}
                      label={`$${(orgConfig.monthly_budget / 1000).toFixed(0)}k`}
                      variant="destructive"
                    />
                  )}
                  <SeriesTooltip
                    series={costSeries.map((s) => ({
                      id: s.id,
                      label: s.label,
                      color: s.color,
                      formatValue: s.formatValue,
                    }))}
                  />
                </>
              )}
            </Visualization>
          )}
        </figure>
      </div>

      {/* Row 4 */}
      <div className="mt-4">
        <figure
          className="rounded-lg border bg-card shadow-sm p-6"
          aria-label="Quality score trend"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[14px] font-semibold text-foreground">
                Quality Score Trend
              </p>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                6-month trajectory of human-rated output quality (1-5 scale)
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: QUALITY_LINE_COLOR }}
                />
                Avg Quality Score
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: QUALITY_VOLUME_COLOR }}
                />
                Rating Volume
              </span>
            </div>
          </div>
          {qualityTrendQuery.isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <Visualization
              data={qualityTrendDataSig}
              axes={buildQualityTrendAxes}
              ariaLabel="Quality score 6-month trend"
            >
              {() => (
                <>
                  <ColumnChart
                    series="volume"
                    axis="volume_y"
                    color={QUALITY_COLUMN_COLOR}
                  />
                  <AreaChart
                    series="quality"
                    axis="quality_y"
                    color={QUALITY_LINE_COLOR}
                    centered
                  />
                  <DataLabels
                    series="quality"
                    axis="quality_y"
                    format={(v) => v.toFixed(1)}
                    centered
                  />
                  <SeriesTooltip
                    matchKey="label"
                    series={[
                      {
                        id: "quality",
                        label: "Avg Quality Score",
                        color: QUALITY_LINE_COLOR,
                        axis: "quality_y",
                        formatValue: (v) => v.toFixed(1),
                      },
                      {
                        id: "volume",
                        label: "Rating Volume",
                        color: QUALITY_COLUMN_COLOR,
                        axis: "volume_y",
                        formatValue: (v) => formatNumber(Math.round(v)),
                      },
                    ]}
                  />
                </>
              )}
            </Visualization>
          )}
        </figure>
      </div>
    </Section>
  );
}
