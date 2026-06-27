import { useQuery } from "@tanstack/react-query";
import { useDeepComputed } from "../../hooks/useDeepComputed";
import { filterQueryParams } from "../../lib/filters/filterSignals";
import {
  formatCurrency,
  formatDuration,
  formatNumber,
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
import { DonutLegend } from "../charts/DonutLegend";
import { Annotation } from "../charts/overlays/Annotation";
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

const ERROR_TYPE_COLORS: Record<string, string> = {
  model_error: "#ef4444",
  timeout: "#f97316",
  tool_call_failure: "#3b82f6",
  rate_limit: "#a855f7",
  other: "#6b7280",
};

const ERROR_TYPE_LABELS: Record<string, string> = {
  model_error: "Model Error",
  timeout: "Timeout",
  tool_call_failure: "Tool Call Failure",
  rate_limit: "Rate Limit",
  other: "Other",
};

function AvailabilityDayBox({
  date,
  uptime,
}: {
  date: string;
  uptime: number;
}): JSX.Element {
  const parts = date.split("-");
  const label = `${parts[2]}/${parts[1]}`;

  let bg: string, textColor: string, borderColor: string;
  if (uptime >= 99.9) {
    bg = "#f0fdf4";
    textColor = "#166534";
    borderColor = "#bbf7d0";
  } else if (uptime >= 99.0) {
    bg = "#fefce8";
    textColor = "#713f12";
    borderColor = "#fde68a";
  } else {
    bg = "#fef2f2";
    textColor = "#991b1b";
    borderColor = "#fecaca";
  }

  const displayPct =
    uptime >= 100
      ? "100%"
      : uptime >= 99.9
        ? `${uptime.toFixed(2)}%`
        : `${uptime.toFixed(2)}%`;

  return (
    <div
      title={`${date}: ${uptime.toFixed(3)}% uptime`}
      className="flex flex-col items-center justify-center rounded gap-0.5"
      style={{
        width: 48,
        height: 48,
        background: bg,
        color: textColor,
        border: `1px solid ${borderColor}`,
        fontSize: 9,
        fontWeight: 500,
        lineHeight: "1.25",
        flexShrink: 0,
      }}
    >
      <span>{label}</span>
      <span style={{ fontSize: 8 }}>{displayPct}</span>
    </div>
  );
}

function periodMonthYear(from: string): string {
  const d = new Date(from + "T00:00:00Z");
  return d.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

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

  const errorRateColor = (d?.error_rate ?? 0) > 5 ? "#ef4444" : "#2563eb";

  const errorTotalCount = d
    ? d.error_type_breakdown.reduce((s, e) => s + e.count, 0)
    : 0;

  const longestIncident = d
    ? d.incidents.reduce<{ minutes: number; date: string } | null>(
        (best, inc) => {
          const m = inc.mttr_minutes ?? 0;
          if (m > (best?.minutes ?? 0)) {
            return { minutes: m, date: inc.detected_at };
          }
          return best;
        },
        null,
      )
    : null;

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
              value={d ? formatPercent(d.error_rate) : undefined}
              statusDot={d ? computeErrorRateSeverity(d.error_rate) : undefined}
              delta={
                d
                  ? -computeDeltaPercent(d.error_rate, d.error_rate_prior)
                  : undefined
              }
              deltaLabel="vs last period"
              trend={
                d
                  ? d.error_trend_7d.map((p) => ({
                      date: p.date,
                      value: p.error_rate,
                    }))
                  : undefined
              }
              trendColor={errorRateColor}
              formulaTooltip="Percentage of runs that resulted in an error."
              exampleTooltip="e.g. 3.2%"
            />
            <KpiCard
              label="Timeout Rate"
              value={d ? formatPercent(d.timeout_rate) : undefined}
              delta={
                d
                  ? -computeDeltaPercent(d.timeout_rate, d.timeout_rate_prior)
                  : undefined
              }
              deltaLabel="vs last period"
              trend={
                d
                  ? d.timeout_rate_trend.map((p) => ({
                      date: p.date,
                      value: p.value,
                    }))
                  : undefined
              }
              trendColor="#7c3aed"
              formulaTooltip="Percentage of runs that timed out before completion."
              exampleTooltip="e.g. 1.4%"
            />
            <KpiCard
              label="P50 Duration"
              value={d ? formatDuration(d.p50_duration_ms) : undefined}
              subValue={
                d ? `Queue wait: ${formatDuration(d.queue_wait_ms)}` : undefined
              }
              delta={
                d
                  ? -computeDeltaPercent(
                      d.p50_duration_ms,
                      d.p50_duration_ms_prior,
                    )
                  : undefined
              }
              deltaLabel="vs last period"
              trend={d ? d.p50_duration_trend : undefined}
              trendColor="#7c3aed"
              formulaTooltip="Median run duration (50th percentile)."
              exampleTooltip="e.g. 12s"
            />
            <KpiCard
              label="P95 Duration"
              value={d ? formatDuration(d.p95_duration_ms) : undefined}
              delta={
                d
                  ? -computeDeltaPercent(
                      d.p95_duration_ms,
                      d.p95_duration_ms_prior,
                    )
                  : undefined
              }
              deltaLabel="vs last period"
              trend={d ? d.p95_duration_trend : undefined}
              trendColor="#7c3aed"
              formulaTooltip="95th percentile run duration."
              exampleTooltip="e.g. 48s"
            />
          </div>

          {/* Row 2: P99, Retry Rate, MTTR, Cost of Failed Runs */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            <KpiCard
              label="P99 Duration"
              value={d ? formatDuration(d.p99_duration_ms) : undefined}
              delta={
                d
                  ? -computeDeltaPercent(
                      d.p99_duration_ms,
                      d.p99_duration_ms_prior,
                    )
                  : undefined
              }
              deltaLabel="vs last period"
              trend={d ? d.p99_duration_trend : undefined}
              trendColor="#7c3aed"
              formulaTooltip="99th percentile run duration."
              exampleTooltip="e.g. 120s"
            />
            <KpiCard
              label="Retry Rate"
              value={d ? formatPercent(d.retry_rate * 100) : undefined}
              delta={
                d
                  ? -computeDeltaPercent(d.retry_rate, d.retry_rate_prior)
                  : undefined
              }
              deltaLabel="vs last period"
              trend={
                d
                  ? d.retry_rate_trend.map((p) => ({
                      date: p.date,
                      value: p.value * 100,
                    }))
                  : undefined
              }
              trendColor="#7c3aed"
              formulaTooltip="Percentage of runs retried at least once."
              exampleTooltip="e.g. 8.1%"
            />
            <KpiCard
              label="MTTR"
              value={
                d
                  ? d.mttr_minutes !== null
                    ? `${d.mttr_minutes.toFixed(1)} min`
                    : "No incidents"
                  : undefined
              }
              delta={
                d && d.mttr_minutes !== null && d.mttr_minutes_prior !== null
                  ? -computeDeltaPercent(d.mttr_minutes, d.mttr_minutes_prior)
                  : undefined
              }
              deltaLabel="vs last period"
              trend={d ? d.mttr_trend : undefined}
              trendColor="#7c3aed"
              formulaTooltip="Mean time to resolution across all incidents in the period."
              exampleTooltip="e.g. 42 min"
            />
            <KpiCard
              label="Cost of Failed Runs"
              value={d ? formatCurrency(d.cost_of_failed_runs) : undefined}
              delta={
                d
                  ? -computeDeltaPercent(
                      d.cost_of_failed_runs,
                      d.cost_of_failed_runs_prior,
                    )
                  : undefined
              }
              deltaLabel="vs last period"
              trend={d ? d.cost_of_failed_runs_trend : undefined}
              trendColor="#7c3aed"
              formulaTooltip="Total API spend on runs that ultimately failed."
              exampleTooltip="e.g. $1,420"
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
                    <AreaChart
                      series="error_rate"
                      axis="y"
                      color={errorRateColor}
                    />
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
                  Error Type Distribution
                </p>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Breakdown of failure causes this period
                </p>
              </div>
              {d && (
                <div className="flex items-center gap-8">
                  <DonutChart
                    slices={d.error_type_breakdown.map((e) => ({
                      label: e.type,
                      value: e.count,
                      color: ERROR_TYPE_COLORS[e.type] ?? "#6b7280",
                    }))}
                    centerLine1={formatNumber(errorTotalCount)}
                    centerLine2="errors"
                    size={180}
                    ariaLabel="Error type breakdown donut"
                  />
                  <DonutLegend
                    items={d.error_type_breakdown.map((e) => ({
                      color: ERROR_TYPE_COLORS[e.type] ?? "#6b7280",
                      title: ERROR_TYPE_LABELS[e.type] ?? e.type,
                      renderDetail: () => (
                        <>
                          <span>{e.percentage}%</span>
                          <span className="text-foreground font-medium">
                            {" "}- {formatNumber(e.count)} errors
                          </span>
                        </>
                      ),
                    }))}
                  />
                </div>
              )}
            </figure>
          </div>

          {/* Availability */}
          <div className="mt-4">
            <figure
              className="rounded-lg border bg-card shadow-sm p-6"
              aria-label="Platform availability"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[14px] font-semibold text-foreground">
                    {d
                      ? `Platform Availability - ${periodMonthYear(d.period.from)}`
                      : "Platform Availability"}
                  </p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    Daily uptime percentage - hover for incident details
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-shrink-0 mt-0.5">
                  <span className="flex items-center gap-1">
                    <span
                      className="inline-block w-3 h-3 rounded-sm"
                      style={{
                        background: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                      }}
                    />
                    &gt;99.9%
                  </span>
                  <span className="flex items-center gap-1">
                    <span
                      className="inline-block w-3 h-3 rounded-sm"
                      style={{
                        background: "#fefce8",
                        border: "1px solid #fde68a",
                      }}
                    />
                    99.0-99.9%
                  </span>
                  <span className="flex items-center gap-1">
                    <span
                      className="inline-block w-3 h-3 rounded-sm"
                      style={{
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                      }}
                    />
                    &lt;99.0%
                  </span>
                </div>
              </div>
              <div
                className="flex flex-wrap gap-1"
                role="list"
                aria-label="Daily availability"
              >
                {d &&
                  d.availability_by_day.map((day) => (
                    <div key={day.date} role="listitem">
                      <AvailabilityDayBox
                        date={day.date}
                        uptime={day.uptime_pct}
                      />
                    </div>
                  ))}
              </div>
              {d && (
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1 mt-4 pt-4 border-t text-[13px] text-muted-foreground">
                  <span>
                    MTD Availability:{" "}
                    <strong className="text-foreground">
                      {formatPercent(d.platform_availability)}
                    </strong>
                  </span>
                  <span>
                    Incidents:{" "}
                    <strong className="text-foreground">
                      {d.incidents.length}
                    </strong>
                  </span>
                  <span>
                    Longest Incident:{" "}
                    <strong className="text-foreground">
                      {longestIncident && longestIncident.minutes > 0
                        ? `${longestIncident.minutes} min (${new Date(longestIncident.date).toLocaleString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })})`
                        : "-"}
                    </strong>
                  </span>
                  <span>
                    MTTR:{" "}
                    <strong className="text-foreground">
                      {d.mttr_minutes !== null
                        ? `${d.mttr_minutes.toFixed(1)} min`
                        : "-"}
                    </strong>
                  </span>
                </div>
              )}
            </figure>
          </div>
        </>
      )}
    </Section>
  );
}
