import { useSignal } from '@preact/signals-react'
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
  barHeight?: number
  formatValue?: (v: number) => string
}

export function BarChart({ bars, maxValue, ariaLabel, barHeight = 28, formatValue }: BarChartProps): JSX.Element {
  const tokens = useChartTokens()
  const announceText = useSignal('')
  const max = maxValue ?? (bars.length > 0 ? Math.max(...bars.map((b) => b.value)) : 1)

  return (
    <div role="list" aria-label={ariaLabel ?? 'Bar chart'} className="space-y-2">
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{announceText.value}</div>
      {bars.map((bar, i) => (
        <div
          key={i}
          role="listitem"
          tabIndex={0}
          className="flex items-center gap-2"
          onFocus={() => { announceText.value = bar.label + ': ' + bar.value }}
          onBlur={() => { announceText.value = '' }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); announceText.value = bar.label + ': ' + bar.value } }}
        >
          <span className="w-20 shrink-0 text-sm text-muted-foreground truncate">{bar.label}</span>
          <div className="flex-1">
            <div
              style={{
                width: `${(bar.value / max) * 100}%`,
                height: `${barHeight}px`,
                background: bar.color ?? tokens.primary,
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: '8px',
                minWidth: '40px',
              }}
            >
              <span className="text-sm font-medium text-white whitespace-nowrap">
                {formatValue ? formatValue(bar.value) : bar.value.toLocaleString('en-US')}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
