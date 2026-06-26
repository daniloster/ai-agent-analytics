import { useSignal } from '@preact/signals-react'
import { Card, CardHeader, CardContent } from '../ui/card'
import { Skeleton } from '../ui/skeleton'
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover'
import { Sparkline } from '../charts/Sparkline'
import { formatPercent } from '../../lib/kpi/formatters'

export interface KpiCardProps {
  label: string
  value: string | undefined
  subValue?: string
  delta?: number
  deltaLabel?: string
  trend?: Array<{ date: string; value: number }>
  trendColor?: string
  formulaTooltip: string
  exampleTooltip: string
  insufficientData?: boolean
  insufficientDataReason?: string
}

function DeltaBadge({ delta, deltaLabel }: { delta: number; deltaLabel?: string }): JSX.Element {
  const isPositive = delta > 0
  const isNegative = delta < 0
  const prefix = isPositive ? '+' : isNegative ? '-' : ''
  const colorClass = isPositive
    ? 'bg-emerald-100 text-emerald-700'
    : isNegative
      ? 'bg-red-100 text-red-700'
      : 'bg-muted text-muted-foreground'

  return (
    <div className="flex items-center gap-1">
      <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${colorClass}`}>
        {prefix}{formatPercent(Math.abs(delta), 1)}
      </span>
      {deltaLabel && <span className="text-xs text-muted-foreground">{deltaLabel}</span>}
    </div>
  )
}

export function KpiCard(props: KpiCardProps): JSX.Element {
  const open = useSignal(false)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">{props.label}</span>
          <Popover open={open.value} onOpenChange={(v) => { open.value = v }}>
            <PopoverTrigger asChild>
              <button
                aria-label="More information"
                className="flex h-5 w-5 items-center justify-center rounded-full text-xs text-muted-foreground hover:bg-muted"
              >
                ?
              </button>
            </PopoverTrigger>
            <PopoverContent>
              <p className="text-sm">{props.formulaTooltip}</p>
              <p className="mt-1 text-xs text-muted-foreground">{props.exampleTooltip}</p>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {props.value === undefined ? (
            <Skeleton className="h-8 w-24" />
          ) : props.insufficientData ? (
            <>
              <span role="status" className="text-sm text-muted-foreground">Insufficient data</span>
              {props.insufficientDataReason && (
                <p className="text-xs text-muted-foreground">{props.insufficientDataReason}</p>
              )}
            </>
          ) : (
            <div className="text-2xl font-bold">{props.value}</div>
          )}
          {props.subValue && (
            <p className="text-xs text-muted-foreground">{props.subValue}</p>
          )}
          {typeof props.delta === 'number' && (
            <DeltaBadge delta={props.delta} deltaLabel={props.deltaLabel} />
          )}
        </div>
        {props.trend && (
          <div className="mt-3">
            <Sparkline data={props.trend} color={props.trendColor} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
