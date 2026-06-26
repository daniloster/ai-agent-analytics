import { useQuery } from '@tanstack/react-query'
import { useDeepComputed } from '../../hooks/useDeepComputed'
import { filterQueryParams, teamId } from '../../lib/filters/filterSignals'
import { Section } from '../layout/Section'
import { TeamTable } from '../kpis/TeamTable'
import { KpiCard } from '../kpis/KpiCard'
import { BarChart } from '../charts/BarChart'
import { ColumnChart } from '../charts/ColumnChart'
import { Sparkline } from '../charts/Sparkline'
import { Skeleton } from '../ui/skeleton'
import { formatCurrency, formatPercent, formatNumber, formatQuality } from '../../lib/kpi/formatters'
import type { TeamsResponse } from '../../types/api'

const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6']

export function TeamBreakdown(): JSX.Element {
  const params = filterQueryParams.value

  const query = useQuery<TeamsResponse>({
    queryKey: ['teams', params],
    queryFn: () => {
      const sp = new URLSearchParams({ from: params.from, to: params.to })
      if (params.team_id) sp.set('team_id', params.team_id)
      return fetch('/api/analytics/teams?' + sp.toString()).then((r) => r.json() as Promise<TeamsResponse>)
    },
  })

  const currentTeamId = useDeepComputed(() => teamId.value)

  const data = query.data

  const orgAvgFailedRunRate = data?.org_avg_failed_run_rate ?? 0

  const nonNullQuality = data
    ? data.teams.filter((t) => t.cost_per_quality_point !== null)
    : []
  const avgCostPerQualityPoint =
    nonNullQuality.length > 0
      ? Math.round(
          nonNullQuality.reduce((sum, t) => sum + (t.cost_per_quality_point ?? 0), 0) /
            nonNullQuality.length,
        )
      : null

  return (
    <Section id="teams" labelledBy="teams-heading">
      <h2 id="teams-heading">Teams</h2>

      {query.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : currentTeamId.value !== undefined ? (
        // Single-team detail view
        (() => {
          const team = data?.teams[0]
          if (!team) return null
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <KpiCard
                  label="Runs"
                  value={formatNumber(team.runs)}
                  formulaTooltip="Total number of AI agent runs for this team."
                  exampleTooltip="e.g. 1,234 runs"
                />
                <KpiCard
                  label="Cost"
                  value={formatCurrency(team.cost)}
                  formulaTooltip="Total API spend for this team in the selected period."
                  exampleTooltip="e.g. $500.00"
                />
                <KpiCard
                  label="Quality Score"
                  value={team.avg_quality_score !== null ? formatQuality(team.avg_quality_score) : ''}
                  insufficientData={team.avg_quality_score === null}
                  insufficientDataReason={team.avg_quality_score === null ? 'Fewer than 10 rated runs' : undefined}
                  formulaTooltip="Average quality score from rated runs (1-5 scale)."
                  exampleTooltip="e.g. 4.2 / 5.0"
                />
                <KpiCard
                  label="Failed Rate"
                  value={formatPercent(team.failed_run_rate * 100)}
                  formulaTooltip="Percentage of runs that failed for this team."
                  exampleTooltip="e.g. 3.0%"
                />
              </div>

              <figure>
                <figcaption className="text-sm font-medium mb-2">Use cases</figcaption>
                <div role="list">
                  <div role="listitem">
                    <div className="flex h-6 rounded overflow-hidden">
                      {team.top_use_cases.map((seg, i) => (
                        <div
                          key={seg.category}
                          aria-label={seg.category}
                          style={{
                            width: seg.percentage + '%',
                            background: COLORS[i % COLORS.length],
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </figure>

              <figure>
                <figcaption className="text-sm font-medium mb-2">Cost trend</figcaption>
                <Sparkline
                  data={team.cost_trend.map((p) => ({ date: p.date, value: p.cost }))}
                  height={80}
                />
              </figure>
            </div>
          )
        })()
      ) : (
        // Org-wide view
        data && (
          <div className="space-y-4">
            <TeamTable teams={data.teams} orgAvgFailedRunRate={orgAvgFailedRunRate} />

            <figure>
              <figcaption className="text-sm font-medium mb-2">Runs per team</figcaption>
              <BarChart
                bars={[...data.teams]
                  .sort((a, b) => b.runs - a.runs)
                  .map((t) => ({ label: t.team_name, value: t.runs }))}
              />
            </figure>

            <figure>
              <figcaption className="text-sm font-medium mb-2">Cost per team</figcaption>
              <BarChart
                bars={[...data.teams]
                  .sort((a, b) => b.cost - a.cost)
                  .map((t) => ({ label: t.team_name, value: t.cost }))}
              />
            </figure>

            <figure>
              <figcaption className="text-sm font-medium mb-2">Quality score per team</figcaption>
              <ColumnChart
                bars={[...data.teams]
                  .filter((t) => t.avg_quality_score !== null)
                  .sort((a, b) => (b.avg_quality_score ?? 0) - (a.avg_quality_score ?? 0))
                  .map((t) => ({ label: t.team_name, value: t.avg_quality_score as number }))}
              />
            </figure>

            <figure>
              <figcaption className="text-sm font-medium mb-2">Use cases by team</figcaption>
              <div role="list" className="space-y-2">
                {data.teams.map((team) => (
                  <div key={team.team_id} role="listitem">
                    <div className="text-xs text-muted-foreground mb-1">{team.team_name}</div>
                    <div className="flex h-6 rounded overflow-hidden">
                      {team.top_use_cases.map((seg, i) => (
                        <div
                          key={seg.category}
                          aria-label={seg.category}
                          style={{
                            width: seg.percentage + '%',
                            background: COLORS[i % COLORS.length],
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </figure>

            <figure>
              <figcaption className="text-sm font-medium mb-2">
                Cost per quality point (lower is better)
              </figcaption>
              <ColumnChart
                bars={[...data.teams]
                  .filter((t) => t.cost_per_quality_point !== null)
                  .sort((a, b) => (a.cost_per_quality_point ?? Infinity) - (b.cost_per_quality_point ?? Infinity))
                  .map((t) => ({ label: t.team_name, value: t.cost_per_quality_point as number }))}
                annotation={
                  avgCostPerQualityPoint !== null
                    ? { value: avgCostPerQualityPoint, label: 'lower is better' }
                    : undefined
                }
              />
            </figure>
          </div>
        )
      )}
    </Section>
  )
}
