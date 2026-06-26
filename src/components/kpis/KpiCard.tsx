import { useSignal } from '@preact/signals-react'

const STATUS_DOT_COLORS: Record<'good' | 'warning' | 'critical', string> = {
  good: 'bg-emerald-500',
  warning: 'bg-amber-500',
  critical: 'bg-red-500',
}
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
  statusDot?: 'good' | 'warning' | 'critical'
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
    ? 'bg-green-50 text-green-600'
    : isNegative
      ? 'bg-red-50 text-red-600'
      : 'bg-muted text-muted-foreground'

  return (
    <div className="flex items-center gap-1">
      <span
        className={`inline-flex items-center rounded-full px-[7px] py-0.5 text-[11px] font-semibold ${colorClass}`}
      >
        {prefix}{formatPercent(Math.abs(delta), 1)}
      </span>
      {deltaLabel && <span className="text-[11px] text-muted-foreground">{deltaLabel}</span>}
    </div>
  )
}

export function KpiCard(props: KpiCardProps): JSX.Element {
  const open = useSignal(false)

  return (
    <Card>
      <CardHeader className="p-5 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {props.statusDot && (
              <span
                className={`h-2 w-2 rounded-full ${STATUS_DOT_COLORS[props.statusDot]}`}
                aria-hidden="true"
              />
            )}
            <span className="text-[12px] font-medium text-muted-foreground">{props.label}</span>
          </div>
          <Popover open={open.value} onOpenChange={(v) => { open.value = v }}>
            <PopoverTrigger asChild>
              <button
                aria-label="More information"
                className="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-border bg-muted text-[10px] text-muted-foreground hover:bg-border"
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
      <CardContent className="px-5 pb-5 pt-0">
        <div className="space-y-1.5">
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
            <div className="text-[28px] font-bold leading-none tracking-tight">{props.value}</div>
          )}
          {props.subValue && (
            <p className="text-[11px] text-muted-foreground">{props.subValue}</p>
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
