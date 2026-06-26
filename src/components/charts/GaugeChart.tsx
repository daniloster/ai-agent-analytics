import { Pie } from '@visx/shape'
import type { ReadonlySignal } from '@preact/signals-react'
import { ParentSizeComputed } from './primitives/ParentSizeComputed'
import type { ChartTokens } from './primitives/useChartTokens'

export interface GaugeChartProps {
  value: number
  label: string
  subLabel?: string
  tokens: ChartTokens
  height?: number
}

interface GaugeCanvasProps {
  value: number
  label: string
  subLabel?: string
  tokens: ChartTokens
  width: ReadonlySignal<number>
  height: number
}

// Inner component — Babel transformer injects useSignals() here for reactive width.
function GaugeCanvas({ value, label, subLabel, tokens, width, height }: GaugeCanvasProps): JSX.Element | null {
  const w = width.value
  if (w === 0) return null

  const cx = w / 2
  const cy = height
  const outerRadius = Math.min(cx, cy) * 0.85
  const innerRadius = outerRadius * 0.65
  const progressColor = value > 90 ? tokens.destructive : tokens.primary

  return (
    <svg width={w} height={height}>
      <Pie
        data={[value, Math.max(0, 100 - value)]}
        pieValue={(d) => d}
        outerRadius={outerRadius}
        innerRadius={innerRadius}
        startAngle={-Math.PI / 2}
        endAngle={Math.PI / 2}
        top={cy}
        left={cx}
        pieSort={null}
        pieSortValues={null}
      >
        {({ arcs, path }) =>
          arcs.map((arc, i) => {
            const fill = i === 0 ? progressColor : tokens.muted
            const d = path(arc) ?? ''
            return <path key={i} d={d} fill={fill} />
          })
        }
      </Pie>
      <text x={cx} y={cy} dy="-0.5em" textAnchor="middle" fontWeight="bold" fill={tokens.primary}>
        {label}
      </text>
      {subLabel && (
        <text x={cx} y={cy} dy="1.2em" textAnchor="middle" fontSize={12} fill={tokens.muted}>
          {subLabel}
        </text>
      )}
    </svg>
  )
}

export function GaugeChart({ value, label, subLabel, tokens, height = 160 }: GaugeChartProps): JSX.Element {
  return (
    <figure aria-label={label}>
      <ParentSizeComputed heightOverride={height}>
        {(widthSig) => (
          <GaugeCanvas
            value={value}
            label={label}
            subLabel={subLabel}
            tokens={tokens}
            width={widthSig}
            height={height}
          />
        )}
      </ParentSizeComputed>
    </figure>
  )
}
