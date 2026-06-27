import { Pie } from '@visx/shape'
import { useVisualizationContext } from '../VisualizationContext'

export interface GaugeProps<TSeries extends string = string> {
  series: TSeries
  domain?: [number, number]
  criticalThreshold?: number
  label?: string
}

export function Gauge(props: GaugeProps): JSX.Element | null {
  const { dataSignal, innerWidth, innerHeight, tokens } = useVisualizationContext()

  const width = innerWidth.value
  const height = innerHeight.value

  if (width === 0) return null

  const data = (dataSignal.value[props.series] ?? []) as Record<string, unknown>[]
  if (data.length === 0) return null

  const value = data[0][props.series] as number
  const [, domainMax] = props.domain ?? [0, 100]
  const threshold = props.criticalThreshold ?? 90
  const progressColor = value > threshold ? tokens.destructive : tokens.primary

  const cx = width / 2
  const cy = height
  const radius = Math.min(width / 2, height) * 0.9
  const innerRadius = radius * 0.6

  const pieData = [value, Math.max(0, domainMax - value)]

  return (
    <g>
      <Pie
        data={pieData}
        pieValue={(d) => d}
        outerRadius={radius}
        innerRadius={innerRadius}
        startAngle={-Math.PI / 2}
        endAngle={Math.PI / 2}
        pieSort={null}
        pieSortValues={null}
        top={cy}
        left={cx}
      >
        {({ arcs, path }) =>
          arcs.map((arc, i) => {
            const fill = i === 0 ? progressColor : tokens.muted
            const d = path(arc) ?? ''
            if (i === 0) {
              return (
                <path
                  key={i}
                  d={d}
                  fill={fill}
                  tabIndex={0}
                  aria-label={`${props.series}: ${value} of ${domainMax}`}
                />
              )
            }
            return <path key={i} d={d} fill={fill} />
          })
        }
      </Pie>
      {props.label && (
        <text x={cx} y={cy} textAnchor="middle" dy="-0.5em" fill={tokens.muted}>
          {props.label}
        </text>
      )}
    </g>
  )
}
