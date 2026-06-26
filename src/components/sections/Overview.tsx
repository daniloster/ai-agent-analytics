import { useQuery } from "@tanstack/react-query";
import { filterQueryParams } from "../../lib/filters/filterSignals";
import {
  formatCurrency,
  formatDuration,
  formatNumber,
  formatPercent,
  formatQuality,
} from "../../lib/kpi/formatters";
import {
  computeCostPerAcceptedOutput,
  computeCostPerQualityPoint,
  computeDeltaPercent,
  computeRetentionCost,
} from "../../lib/kpi/formulas";
import type {
  OrgConfig,
  OverviewResponse,
  TimeseriesResponse,
} from "../../types/api";
import { buildQueryParams } from "../../utils/buildQueryParams";
import { AreaChart } from "../charts/AreaChart";
import { BarChart } from "../charts/BarChart";
import { DonutChart } from "../charts/DonutChart";
import { KpiCard } from "../kpis/KpiCard";
import { Section } from "../layout/Section";
import { Skeleton } from "../ui/skeleton";

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
  const costPerAcceptedOutput = d
    ? computeCostPerAcceptedOutput(
        d.total_cost,
        d.total_runs,
        d.acceptance_rate,
      )
    : null;

  const tokenSeries = ts
    ? [
        {
          id: "input_tokens",
          label: "Input Tokens",
          data: ts.points.map((p) => ({ date: p.date, value: p.input_tokens })),
        },
        {
          id: "output_tokens",
          label: "Output Tokens",
          data: ts.points.map((p) => ({
            date: p.date,
            value: p.output_tokens,
          })),
        },
      ]
    : [];

  const costSeries = ts
    ? [
        {
          id: "cost",
          label: "Daily Cost",
          data: ts.points.map((p) => ({ date: p.date, value: p.cost })),
        },
      ]
    : [];

  const qualitySeries = ts
    ? [
        {
          id: "quality",
          label: "Quality Score Trend",
          data: ts.points.map((p) => ({
            date: p.date,
            value: p.avg_quality_score ?? 0,
          })),
        },
      ]
    : [];

  const activatedCount = d
    ? Math.round((d.seat_count * d.user_activation_rate) / 100)
    : 0;

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
          formulaTooltip="Total number of AI agent runs in the selected period."
          exampleTooltip="e.g. 12,450 runs"
        />
        <KpiCard
          label="Monthly Active Users"
          value={d ? formatNumber(d.mau) : undefined}
          subValue={d ? `DAU: ${formatNumber(d.dau)}` : undefined}
          formulaTooltip="Unique users who ran at least one request this month."
          exampleTooltip="e.g. 340 MAU"
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
          formulaTooltip="MAU / seat_count - percentage of provisioned seats actively used."
          exampleTooltip="e.g. 85.0%"
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
          formulaTooltip="Total cost / (rated_run_count * avg_quality_score)."
          exampleTooltip="e.g. $0.42 / point"
        />
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <figure
          className="rounded-lg border bg-card shadow-sm p-6"
          aria-label="Token usage over time"
        >
          <div className="mb-4">
            <p className="text-[14px] font-semibold text-foreground">
              Token usage over time
            </p>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Input and output tokens per day
            </p>
          </div>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <AreaChart series={tokenSeries} ariaLabel="Token usage over time" />
          )}
        </figure>
        <figure
          className="rounded-lg border bg-card shadow-sm p-6"
          aria-label="Cost vs budget"
        >
          <div className="mb-4">
            <p className="text-[14px] font-semibold text-foreground">
              Cost vs. budget
            </p>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Daily API spend against monthly budget
            </p>
          </div>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <AreaChart
              series={costSeries}
              referenceLine={
                orgConfig
                  ? { value: orgConfig.monthly_budget, label: "Budget" }
                  : undefined
              }
              ariaLabel="Cost vs. budget"
            />
          )}
        </figure>
      </div>

      {/* Row 4 */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <figure
          className="rounded-lg border bg-card shadow-sm p-6"
          aria-label="Seat adoption"
        >
          <div className="mb-4">
            <p className="text-[14px] font-semibold text-foreground">
              Seat adoption
            </p>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Active users vs. provisioned seats
            </p>
          </div>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <DonutChart
              slices={
                d
                  ? [
                      { label: "Active", value: d.mau },
                      {
                        label: "Unused",
                        value: Math.max(0, d.seat_count - d.mau),
                      },
                    ]
                  : []
              }
              ariaLabel="Seat adoption"
            />
          )}
        </figure>
        <figure
          className="rounded-lg border bg-card shadow-sm p-6"
          aria-label="Activation funnel"
        >
          <div className="mb-4">
            <p className="text-[14px] font-semibold text-foreground">
              Activation funnel
            </p>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Provisioned seats to active users
            </p>
          </div>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <BarChart
              bars={
                d
                  ? [
                      { label: "Provisioned", value: d.seat_count },
                      { label: "Activated", value: activatedCount },
                      { label: "MAU", value: d.mau },
                    ]
                  : []
              }
              ariaLabel="Activation funnel"
            />
          )}
        </figure>
      </div>

      {/* Row 5 */}
      <div className="grid grid-cols-4 gap-4 mt-4">
        <KpiCard
          label="Acceptance Rate"
          value={
            d && d.acceptance_rate !== null
              ? formatPercent(d.acceptance_rate)
              : d
                ? ""
                : undefined
          }
          insufficientData={d ? d.acceptance_rate === null : undefined}
          formulaTooltip="Percentage of AI outputs accepted by users."
          exampleTooltip="e.g. 72.5%"
        />
        <KpiCard
          label="Cost / Accepted Output"
          value={
            d && costPerAcceptedOutput !== null
              ? formatCurrency(costPerAcceptedOutput)
              : d
                ? ""
                : undefined
          }
          insufficientData={d ? costPerAcceptedOutput === null : undefined}
          formulaTooltip="Total cost / (run_count * acceptance_rate)."
          exampleTooltip="e.g. $0.18 / output"
        />
        <KpiCard
          label="Avg Run Duration"
          value={d ? formatDuration(d.avg_run_duration_ms) : undefined}
          formulaTooltip="Average time from run start to completion."
          exampleTooltip="e.g. 47s"
        />
        <KpiCard
          label="MoM Usage Growth"
          value={d ? formatPercent(d.mom_usage_growth) : undefined}
          delta={d ? d.mom_usage_growth : undefined}
          formulaTooltip="Month-over-month change in total runs."
          exampleTooltip="e.g. +12.5%"
        />
      </div>

      {/* Row 6 */}
      <div className="mt-4">
        <figure
          className="rounded-lg border bg-card shadow-sm p-6"
          aria-label="Quality score trend"
        >
          <div className="mb-4">
            <p className="text-[14px] font-semibold text-foreground">
              Quality score trend
            </p>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              30-day rolling average quality score
            </p>
          </div>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <AreaChart
              series={qualitySeries}
              ariaLabel="Quality score 30-day trend"
            />
          )}
        </figure>
      </div>
    </Section>
  );
}
