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
}

export function DonutChart({ slices, ariaLabel, size = 120 }: DonutChartProps): JSX.Element {
  const tokens = useChartTokens()
  const outerRadius = size / 2 - 4
  const innerRadius = size / 4
  const fallbackColors = [tokens.primary, tokens.muted, tokens.border]

  return (
    <svg
      width={size}
      height={size}
      role="img"
      aria-label={ariaLabel ?? 'Donut chart'}
    >
      <Group top={size / 2} left={size / 2}>
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
    </svg>
  )
}
