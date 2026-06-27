import { useQuery } from "@tanstack/react-query";
import { useDeepComputed } from "../../hooks/useDeepComputed";
import { filterQueryParams } from "../../lib/filters/filterSignals";
import {
  formatCurrency,
  formatDuration,
  formatPercent,
} from "../../lib/kpi/formatters";
import {
  computeDeltaPercent,
  computeErrorRateSeverity,
} from "../../lib/kpi/formulas";
import type { ReliabilityResponse } from "../../types/api";
import { buildQueryParams } from "../../utils/buildQueryParams";
import { AreaChart } from "../charts/AreaChart";
import { DonutChart } from "../charts/DonutChart";
import { Heatmap } from "../charts/Heatmap";
import { Annotation } from "../charts/overlays/Annotation";
import { SeriesTooltip } from "../charts/overlays/SeriesTooltip";
import { Visualization, defineAxes } from "../charts/Visualization";
import { IncidentTable } from "../kpis/IncidentTable";
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

export function Reliability(): JSX.Element {
  const params = filterQueryParams.value;

  const query = useQuery<ReliabilityResponse>({
    queryKey: ["reliability", params],
    queryFn: () =>
      fetch("/api/analytics/reliability?" + buildQueryParams(params)).then(
        (r) => r.json() as Promise<ReliabilityResponse>,
      ),
    refetchInterval: 30_000,
  });

  const d = query.data;

  const errorDataSig = useDeepComputed(() => ({
    error_rate: d
      ? d.error_trend_7d.map((p) => ({
          date: p.date,
          value: p.error_rate,
          error_rate: p.error_rate,
        }))
      : ([] as Array<{ date: string; value: number; error_rate: number }>),
  }));

  return (
    <Section id="reliability" labelledBy="reliability-heading">
      <div className="mb-6">
        <h2
          id="reliability-heading"
          className="text-[22px] font-bold tracking-tight text-foreground"
        >
          Reliability
        </h2>
        <p className="text-[13px] text-muted-foreground mt-1">
          Error rates, latency, and incident tracking
        </p>
      </div>

      {query.isLoading ? (
        <>
          <div className="grid grid-cols-4 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="grid grid-cols-4 gap-4 mt-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </>
      ) : (
        <>
          {/* Row 1: Error Rate, Timeout Rate, P50, P95 */}
          <div className="grid grid-cols-4 gap-4">
            <KpiCard
              label="Error Rate"
              value={d ? formatPercent(d.error_rate * 100) : undefined}
              statusDot={d ? computeErrorRateSeverity(d.error_rate) : undefined}
              delta={
                d
                  ? -computeDeltaPercent(d.error_rate, d.error_rate_prior)
                  : undefined
              }
              formulaTooltip="Percentage of runs that resulted in an error."
              exampleTooltip="e.g. 3.2%"
              trendColor="#7c3aed"
            />
            <KpiCard
              label="Timeout Rate"
              value={d ? formatPercent(d.timeout_rate * 100) : undefined}
              formulaTooltip="Percentage of runs that timed out before completion."
              exampleTooltip="e.g. 1.4%"
              trendColor="#7c3aed"
            />
            <KpiCard
              label="P50 Duration"
              value={d ? formatDuration(d.p50_duration_ms) : undefined}
              subValue={
                d ? `Queue wait: ${formatDuration(d.queue_wait_ms)}` : undefined
              }
              formulaTooltip="Median run duration (50th percentile)."
              exampleTooltip="e.g. 12s"
              trendColor="#7c3aed"
            />
            <KpiCard
              label="P95 Duration"
              value={d ? formatDuration(d.p95_duration_ms) : undefined}
              formulaTooltip="95th percentile run duration."
              exampleTooltip="e.g. 48s"
              trendColor="#7c3aed"
            />
          </div>

          {/* Row 2: P99, Retry Rate, MTTR, Cost of Failed Runs */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            <KpiCard
              label="P99 Duration"
              value={d ? formatDuration(d.p99_duration_ms) : undefined}
              formulaTooltip="99th percentile run duration."
              exampleTooltip="e.g. 120s"
              trendColor="#7c3aed"
            />
            <KpiCard
              label="Retry Rate"
              value={d ? formatPercent(d.retry_rate * 100) : undefined}
              formulaTooltip="Percentage of runs retried at least once."
              exampleTooltip="e.g. 8.1%"
              trendColor="#7c3aed"
            />
            <KpiCard
              label="MTTR"
              value={
                d
                  ? d.mttr_minutes !== null
                    ? `${d.mttr_minutes} min`
                    : "No incidents"
                  : undefined
              }
              formulaTooltip="Mean time to resolution across all incidents in the period."
              exampleTooltip="e.g. 42 min"
              trendColor="#7c3aed"
            />
            <KpiCard
              label="Cost of Failed Runs"
              value={d ? formatCurrency(d.cost_of_failed_runs) : undefined}
              formulaTooltip="Total API spend on runs that ultimately failed."
              exampleTooltip="e.g. $1,420"
              trendColor="#7c3aed"
            />
          </div>

          {/* Chart row: AreaChart + DonutChart */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <figure
              className="rounded-lg border bg-card shadow-sm p-6"
              aria-label="Error rate trend"
            >
              <div className="mb-4">
                <p className="text-[14px] font-semibold text-foreground">
                  Error rate trend
                </p>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  7-day rolling average
                </p>
              </div>
              <Visualization
                data={errorDataSig}
                axes={AREA_AXES}
                ariaLabel="Error rate trend"
              >
                {() => (
                  <>
                    <AreaChart series="error_rate" axis="y" />
                    <Annotation axis="y" value={0.05} label="5% threshold" />
                    <SeriesTooltip
                      series={[
                        { id: "error_rate", label: "Error Rate (7d avg)" },
                      ]}
                    />
                  </>
                )}
              </Visualization>
            </figure>
            <figure
              className="rounded-lg border bg-card shadow-sm p-6"
              aria-label="Error type breakdown"
            >
              <div className="mb-4">
                <p className="text-[14px] font-semibold text-foreground">
                  Error type breakdown
                </p>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Distribution of error categories
                </p>
              </div>
              <DonutChart
                slices={
                  d
                    ? d.error_type_breakdown.map((e) => ({
                        label: e.type,
                        value: e.count,
                      }))
                    : []
                }
                ariaLabel="Error type breakdown"
              />
            </figure>
          </div>

          {/* Availability row: Heatmap + optional IncidentTable */}
          <div className="mt-4">
            <figure
              className="rounded-lg border bg-card shadow-sm p-6"
              aria-label="Platform availability"
            >
              <div className="mb-4">
                <p className="text-[14px] font-semibold text-foreground">
                  {d
                    ? `Platform availability - ${formatPercent(d.platform_availability * 100)}`
                    : "Platform availability"}
                </p>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Daily uptime percentage
                </p>
              </div>
              <Heatmap
                data={
                  d
                    ? d.availability_by_day.map((day) => ({
                        date: day.date,
                        value: day.uptime_pct,
                      }))
                    : []
                }
                colorScale="availability"
                ariaLabel="Platform availability calendar"
              />
            </figure>
            {d && d.incidents.length > 0 && (
              <IncidentTable incidents={d.incidents} />
            )}
          </div>
        </>
      )}
    </Section>
  );
}
