import { Pie } from '@visx/shape'
import { Group } from '@visx/group'
import { useChartTokens } from './primitives/useChartTokens'

export interface DonutChartSlice {
  label: string
  value: number
  color?: string
}

export interface DonutChartProps {
  slices: DonutChartSlice[]
  ariaLabel?: string
  size?: number
  centerLine1?: string
  centerLine2?: string
}

export function DonutChart({ slices, ariaLabel, size = 120, centerLine1, centerLine2 }: DonutChartProps): JSX.Element {
  const tokens = useChartTokens()
  const outerRadius = size / 2 - 4
  const innerRadius = size / 4
  const fallbackColors = [tokens.primary, tokens.muted, tokens.border]
  const cx = size / 2
  const cy = size / 2

  return (
    <svg
      width={size}
      height={size}
      role="img"
      aria-label={ariaLabel ?? 'Donut chart'}
    >
      <Group top={cy} left={cx}>
        <Pie
          data={slices}
          pieValue={(d) => d.value}
          outerRadius={outerRadius}
          innerRadius={innerRadius}
          pieSort={null}
          pieSortValues={null}
        >
          {({ arcs, path }) =>
            arcs.map((arc, i) => {
              const fill = slices[i]?.color ?? fallbackColors[i] ?? tokens.border
              const d = path(arc) ?? ''
              return <path key={i} d={d} fill={fill} />
            })
          }
        </Pie>
      </Group>
      {centerLine1 && (
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          dominantBaseline="auto"
          fontSize={Math.round(size / 8)}
          fontWeight={700}
          fill="currentColor"
          aria-hidden="true"
        >
          {centerLine1}
        </text>
      )}
      {centerLine2 && (
        <text
          x={cx}
          y={cy + Math.round(size / 10)}
          textAnchor="middle"
          dominantBaseline="hanging"
          fontSize={Math.round(size / 14)}
          fill="#6b7280"
          aria-hidden="true"
        >
          {centerLine2}
        </text>
      )}
    </svg>
  )
}
