import { useQuery } from '@tanstack/react-query'
import { filterQueryParams } from '../../lib/filters/filterSignals'
import { Section } from '../layout/Section'
import { KpiCard } from '../kpis/KpiCard'
import { AreaChart } from '../charts/AreaChart'
import { DonutChart } from '../charts/DonutChart'
import { Heatmap } from '../charts/Heatmap'
import { IncidentTable } from '../kpis/IncidentTable'
import { Skeleton } from '../ui/skeleton'
import { computeErrorRateSeverity, computeDeltaPercent } from '../../lib/kpi/formulas'
import { formatCurrency, formatPercent, formatDuration } from '../../lib/kpi/formatters'
import type { ReliabilityResponse } from '../../types/api'

function buildQueryParams(params: { from: string; to: string; team_id?: string }): string {
  const sp = new URLSearchParams({ from: params.from, to: params.to })
  if (params.team_id) sp.set('team_id', params.team_id)
  return sp.toString()
}

export function Reliability(): JSX.Element {
  const params = filterQueryParams.value

  const query = useQuery<ReliabilityResponse>({
    queryKey: ['reliability', params],
    queryFn: () =>
      fetch('/api/analytics/reliability?' + buildQueryParams(params)).then(
        (r) => r.json() as Promise<ReliabilityResponse>,
      ),
    refetchInterval: 30_000,
  })

  const d = query.data

  return (
    <Section id="reliability" labelledBy="reliability-heading">
      <h2 id="reliability-heading">Reliability</h2>

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
              delta={d ? -computeDeltaPercent(d.error_rate, d.error_rate_prior) : undefined}
              formulaTooltip="Percentage of runs that resulted in an error."
              exampleTooltip="e.g. 3.2%"
            />
            <KpiCard
              label="Timeout Rate"
              value={d ? formatPercent(d.timeout_rate * 100) : undefined}
              formulaTooltip="Percentage of runs that timed out before completion."
              exampleTooltip="e.g. 1.4%"
            />
            <KpiCard
              label="P50 Duration"
              value={d ? formatDuration(d.p50_duration_ms) : undefined}
              subValue={d ? `Queue wait: ${formatDuration(d.queue_wait_ms)}` : undefined}
              formulaTooltip="Median run duration (50th percentile)."
              exampleTooltip="e.g. 12s"
            />
            <KpiCard
              label="P95 Duration"
              value={d ? formatDuration(d.p95_duration_ms) : undefined}
              formulaTooltip="95th percentile run duration."
              exampleTooltip="e.g. 48s"
            />
          </div>

          {/* Row 2: P99, Retry Rate, MTTR, Cost of Failed Runs */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            <KpiCard
              label="P99 Duration"
              value={d ? formatDuration(d.p99_duration_ms) : undefined}
              formulaTooltip="99th percentile run duration."
              exampleTooltip="e.g. 120s"
            />
            <KpiCard
              label="Retry Rate"
              value={d ? formatPercent(d.retry_rate * 100) : undefined}
              formulaTooltip="Percentage of runs retried at least once."
              exampleTooltip="e.g. 8.1%"
            />
            <KpiCard
              label="MTTR"
              value={d ? (d.mttr_minutes !== null ? `${d.mttr_minutes} min` : 'No incidents') : undefined}
              formulaTooltip="Mean time to resolution across all incidents in the period."
              exampleTooltip="e.g. 42 min"
            />
            <KpiCard
              label="Cost of Failed Runs"
              value={d ? formatCurrency(d.cost_of_failed_runs) : undefined}
              formulaTooltip="Total API spend on runs that ultimately failed."
              exampleTooltip="e.g. $1,420"
            />
          </div>

          {/* Chart row: AreaChart + DonutChart */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <figure>
              <figcaption className="text-sm font-medium mb-2">Error rate trend (7-day avg)</figcaption>
              <AreaChart
                series={
                  d
                    ? [
                        {
                          id: 'error_rate',
                          label: 'Error Rate (7d avg)',
                          data: d.error_trend_7d.map((p) => ({ date: p.date, value: p.error_rate })),
                        },
                      ]
                    : []
                }
                referenceLine={{ value: 0.05, label: '5% threshold' }}
                ariaLabel="Error rate trend"
              />
            </figure>
            <figure>
              <figcaption className="text-sm font-medium mb-2">Error type breakdown</figcaption>
              <DonutChart
                slices={d ? d.error_type_breakdown.map((e) => ({ label: e.type, value: e.count })) : []}
                ariaLabel="Error type breakdown"
              />
            </figure>
          </div>

          {/* Availability row: Heatmap + optional IncidentTable */}
          <div className="mt-4">
            <figure>
              <figcaption className="text-sm font-medium mb-2">
                {d
                  ? `Platform availability - ${formatPercent(d.platform_availability * 100)}`
                  : 'Platform availability'}
              </figcaption>
              <Heatmap
                data={d ? d.availability_by_day.map((day) => ({ date: day.date, value: day.uptime_pct })) : []}
                colorScale="availability"
                ariaLabel="Platform availability calendar"
              />
            </figure>
            {d && d.incidents.length > 0 && <IncidentTable incidents={d.incidents} />}
          </div>
        </>
      )}
    </Section>
  )
}
