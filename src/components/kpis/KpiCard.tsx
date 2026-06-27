import { useSignal } from '@preact/signals-react'
import { Card, CardHeader, CardContent } from '../ui/card'
import { Skeleton } from '../ui/skeleton'
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover'
import { formatCurrency, formatNumber, formatPercent } from '../../lib/kpi/formatters'

const STATUS_DOT_COLORS: Record<'good' | 'warning' | 'critical', string> = {
  good: 'bg-emerald-500',
  warning: 'bg-amber-500',
  critical: 'bg-red-500',
}

export interface KpiCardProps {
  label: string
  value: string | undefined
  valueSuffix?: string
  subValue?: string
  delta?: number
  deltaFormat?: 'percent' | 'number' | 'decimal' | 'currency'
  deltaLabel?: string
  trend?: Array<{ date: string; value: number }>
  trendColor?: string
  starRating?: number | null
  starRatingSubtext?: string
  statusDot?: 'good' | 'warning' | 'critical'
  formulaTooltip: string
  exampleTooltip: string
  insufficientData?: boolean
  insufficientDataReason?: string
}

// Pure SVG sparkline - no ResizeObserver, no visx, fixed 40px height.
function Sparkline({
  data,
  color = '#2563eb',
}: {
  data: Array<{ date: string; value: number }>
  color?: string
}): JSX.Element | null {
  if (data.length < 2) return null
  const values = data.map((d) => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const W = 200
  const H = 40
  const PAD = 2
  const pts = data.map((d, i) => ({
    x: (i / (data.length - 1)) * W,
    y: PAD + (H - PAD * 2) * (1 - (d.value - min) / range),
  }))
  const linePoints = pts.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')
  const first = pts[0]!
  const last = pts[pts.length - 1]!
  const area = [
    `M${first.x.toFixed(2)},${first.y.toFixed(2)}`,
    ...pts.slice(1).map((p) => `L${p.x.toFixed(2)},${p.y.toFixed(2)}`),
    `L${last.x.toFixed(2)},${H}`,
    `L${first.x.toFixed(2)},${H}`,
    'Z',
  ].join(' ')
  // Gradient ID derived from color - duplicate definitions across cards are identical and harmless.
  const gradId = `kpi-spark-${color.replace(/[^a-z0-9]/gi, '')}`
  return (
    <svg
      width="100%"
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.15} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <polyline
        points={linePoints}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function StarRating({ rating, subtext }: { rating: number; subtext?: string }): JSX.Element {
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100))
  return (
    <div className="mt-2" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      <div className="relative inline-block text-[18px] leading-none select-none" aria-hidden="true">
        <span style={{ color: '#d4d4d8' }}>&#9733;&#9733;&#9733;&#9733;&#9733;</span>
        <span
          data-star-fill
          className="absolute inset-0 overflow-hidden"
          style={{ color: '#f59e0b', width: `${pct}%` }}
        >
          &#9733;&#9733;&#9733;&#9733;&#9733;
        </span>
      </div>
      {subtext && <p className="text-[11px] text-muted-foreground mt-1">{subtext}</p>}
    </div>
  )
}

function DeltaBadge({ delta, deltaFormat = 'percent', deltaLabel }: { delta: number; deltaFormat?: 'percent' | 'number' | 'decimal' | 'currency'; deltaLabel?: string }): JSX.Element {
  const isPositive = delta > 0
  const isNegative = delta < 0
  const prefix = isPositive ? '+' : isNegative ? '-' : ''
  const colorClass = isPositive
    ? 'bg-green-50 text-green-600'
    : isNegative
      ? 'bg-red-50 text-red-600'
      : 'bg-muted text-muted-foreground'

  return (
    <div className="flex items-center justify-between gap-1">
      <span
        className={`inline-flex items-center rounded-full px-[7px] py-0.5 text-[11px] font-semibold ${colorClass}`}
        aria-label={`${prefix}${formatPercent(Math.abs(delta), 1)} compared to prior period${deltaLabel ? ' ' + deltaLabel : ''}`}
      >
        {prefix}{deltaFormat === 'number' ? formatNumber(Math.abs(delta)) : deltaFormat === 'decimal' ? Math.abs(delta).toFixed(1) : deltaFormat === 'currency' ? formatCurrency(Math.abs(delta)) : formatPercent(Math.abs(delta), 1)}
      </span>
      {deltaLabel && <span className="text-[11px] text-muted-foreground">{deltaLabel}</span>}
    </div>
  )
}

export function KpiCard(props: KpiCardProps): JSX.Element {
  const open = useSignal(false)

  return (
    <Card>
      <CardHeader className="p-4 pb-2">
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
                aria-label={"Formula and example for " + props.label}
                className="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-border bg-muted text-[10px] text-muted-foreground hover:bg-border"
              >
                ?
              </button>
            </PopoverTrigger>
            <PopoverContent style={{ maxWidth: 'min(320px, var(--radix-popper-available-width))' }}>
              <p className="text-sm">{props.formulaTooltip}</p>
              <p className="mt-1 text-xs text-muted-foreground">{props.exampleTooltip}</p>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <div className="space-y-1">
          {props.value === undefined ? (
            <Skeleton className="h-8 w-24" />
          ) : props.insufficientData ? (
            <>
              <p role="status" aria-live="polite" className="text-sm text-muted-foreground">Insufficient data</p>
              {props.insufficientDataReason && (
                <p className="text-xs text-muted-foreground">{props.insufficientDataReason}</p>
              )}
            </>
          ) : (
            <div className="text-[28px] font-bold leading-none tracking-tight">
              {props.value}
              {props.valueSuffix && (
                <span data-value-suffix className="text-[16px] font-medium text-muted-foreground ml-0.5">{props.valueSuffix}</span>
              )}
            </div>
          )}
          {props.subValue && (
            <p className="text-[11px] text-muted-foreground">{props.subValue}</p>
          )}
          {typeof props.delta === 'number' && (
            <DeltaBadge delta={props.delta} deltaFormat={props.deltaFormat} deltaLabel={props.deltaLabel} />
          )}
        </div>
        {props.trend && props.trend.length >= 2 && (
          <div aria-hidden="true" className="mt-2">
            <Sparkline data={props.trend} color={props.trendColor} />
          </div>
        )}
        {typeof props.starRating === 'number' && (
          <StarRating rating={props.starRating} subtext={props.starRatingSubtext} />
        )}
      </CardContent>
    </Card>
  )
}
