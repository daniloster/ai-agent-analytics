import { useChartTokens } from './primitives/useChartTokens'

export interface BarChartBar {
  label: string
  value: number
  color?: string
}

export interface BarChartProps {
  bars: BarChartBar[]
  maxValue?: number
  ariaLabel?: string
  height?: number
}

export function BarChart({ bars, maxValue, ariaLabel }: BarChartProps): JSX.Element {
  const tokens = useChartTokens()
  const max = maxValue ?? (bars.length > 0 ? Math.max(...bars.map((b) => b.value)) : 1)

  return (
    <div role="list" aria-label={ariaLabel ?? 'Bar chart'} className="space-y-2">
      {bars.map((bar, i) => (
        <div key={i} role="listitem" className="flex items-center gap-2">
          <span className="w-24 shrink-0 text-sm text-muted-foreground">{bar.label}</span>
          <div className="flex-1">
            <div
              style={{
                width: `${(bar.value / max) * 100}%`,
                height: '8px',
                background: bar.color ?? tokens.primary,
                borderRadius: '2px',
              }}
            />
          </div>
          <span className="w-16 text-right text-sm">{bar.value}</span>
        </div>
      ))}
    </div>
  )
}
