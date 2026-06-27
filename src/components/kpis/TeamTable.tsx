import { useSignal } from '@preact/signals-react'
import { useDeepComputed } from '../../hooks/useDeepComputed'
import type { TeamMetrics } from '../../types/api'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { SparklineChart } from '../charts/SparklineChart'
import { Visualization, defineAxes } from '../charts/Visualization'
import { formatCurrency, formatPercent, formatNumber, formatQuality } from '../../lib/kpi/formatters'

type SortKey =
  | 'runs'
  | 'cost'
  | 'mau'
  | 'adoption_rate'
  | 'avg_quality_score'
  | 'failed_run_rate'
  | 'cost_per_quality_point'
  | 'wow_cost_change'

type SortDirection = 'asc' | 'desc'

export interface TeamTableProps {
  teams: TeamMetrics[]
  orgAvgFailedRunRate: number
}

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

function compareFn(key: SortKey, dir: SortDirection): (a: TeamMetrics, b: TeamMetrics) => number {
  return (a, b) => {
    const av = a[key]
    const bv = b[key]
    if (av === null && bv === null) return 0
    if (av === null) return 1
    if (bv === null) return -1
    const diff = (av as number) - (bv as number)
    return dir === 'asc' ? diff : -diff
  }
}

function TeamRow({ team, failedRateClass }: { team: TeamMetrics; failedRateClass: string }): JSX.Element {
  const trendDataSig = useDeepComputed(() => ({
    trend: team.cost_trend.map((p) => ({ date: p.date, value: p.cost, trend: p.cost })),
  }))

  return (
    <TableRow>
      <TableCell>{team.team_name}</TableCell>
      <TableCell>{formatNumber(team.runs)}</TableCell>
      <TableCell>{formatCurrency(team.cost)}</TableCell>
      <TableCell>{formatNumber(team.mau) + ' / ' + formatNumber(team.seat_count)}</TableCell>
      <TableCell>
        <Progress value={team.adoption_rate * 100} />
      </TableCell>
      <TableCell>
        {team.avg_quality_score !== null ? formatQuality(team.avg_quality_score) : '-'}
      </TableCell>
      <TableCell className={failedRateClass}>
        {formatPercent(team.failed_run_rate * 100)}
      </TableCell>
      <TableCell>
        <Visualization data={trendDataSig} axes={SPARKLINE_AXES} height={40}>
          {() => <SparklineChart series="trend" axis="y" />}
        </Visualization>
      </TableCell>
      <TableCell>
        {team.churn_signal_count > 0 && (
          <Badge variant="destructive">
            {team.churn_signal_count === 1
              ? '1 churn signal'
              : `${team.churn_signal_count} churn signals`}
          </Badge>
        )}
      </TableCell>
    </TableRow>
  )
}

export function TeamTable({ teams, orgAvgFailedRunRate }: TeamTableProps): JSX.Element {
  const sortKey = useSignal<SortKey>('runs')
  const sortDir = useSignal<SortDirection>('desc')

  const sortedTeams = useDeepComputed(() =>
    [...teams].sort(compareFn(sortKey.value, sortDir.value)),
  )

  function handleSort(key: SortKey): void {
    if (sortKey.value === key) {
      sortDir.value = sortDir.value === 'desc' ? 'asc' : 'desc'
    } else {
      sortKey.value = key
      sortDir.value = 'desc'
    }
  }

  function sortIndicator(key: SortKey): string {
    if (sortKey.value !== key) return ''
    return sortDir.value === 'desc' ? ' ▼' : ' ▲'
  }

  function failedRateClass(team: TeamMetrics): string {
    if (team.failed_run_rate > 2 * orgAvgFailedRunRate) return 'bg-red-100 text-red-700'
    if (team.failed_run_rate > 1.5 * orgAvgFailedRunRate) return 'bg-amber-100 text-amber-700'
    return ''
  }

  const rows = sortedTeams.value

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Team</TableHead>
          <TableHead className="cursor-pointer" onClick={() => handleSort('runs')}>
            Runs{sortIndicator('runs')}
          </TableHead>
          <TableHead className="cursor-pointer" onClick={() => handleSort('cost')}>
            Cost{sortIndicator('cost')}
          </TableHead>
          <TableHead className="cursor-pointer" onClick={() => handleSort('mau')}>
            Users{sortIndicator('mau')}
          </TableHead>
          <TableHead className="cursor-pointer" onClick={() => handleSort('adoption_rate')}>
            Adoption{sortIndicator('adoption_rate')}
          </TableHead>
          <TableHead className="cursor-pointer" onClick={() => handleSort('avg_quality_score')}>
            Quality{sortIndicator('avg_quality_score')}
          </TableHead>
          <TableHead className="cursor-pointer" onClick={() => handleSort('failed_run_rate')}>
            Failed Rate{sortIndicator('failed_run_rate')}
          </TableHead>
          <TableHead>WoW Trend</TableHead>
          <TableHead>Churn</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((team) => (
          <TeamRow key={team.team_id} team={team} failedRateClass={failedRateClass(team)} />
        ))}
      </TableBody>
    </Table>
  )
}
