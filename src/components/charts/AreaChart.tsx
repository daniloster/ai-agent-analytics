import { useDeepComputed } from '../../hooks/useDeepComputed'
import { Visualization, defineAxes } from './Visualization'
import { Area } from './marks/Area'
import { Annotation } from './overlays/Annotation'

export interface AreaChartSeries {
  id: string
  label: string
  data: Array<{ date: string; value: number }>
  color?: string
  dashed?: boolean
}

export interface AreaChartProps {
  series: AreaChartSeries[]
  referenceLine?: { value: number; label: string }
  height?: number
  ariaLabel?: string
}

const AREA_CHART_AXES = defineAxes([
  {
    id: 'x',
    type: 'time' as const,
    position: 'bottom' as const,
    accessor: (d) => new Date((d as { date: string }).date),
  },
  {
    id: 'y',
    type: 'linear' as const,
    position: 'left' as const,
    accessor: (d) => (d as { value: number }).value,
    domain: 'auto' as const,
  },
])

export function AreaChart({ series, referenceLine, height, ariaLabel }: AreaChartProps): JSX.Element {
  const dataSig = useDeepComputed(() =>
    Object.fromEntries(series.map((s) => [s.id, s.data])),
  )
  return (
    <Visualization data={dataSig} axes={AREA_CHART_AXES} height={height} ariaLabel={ariaLabel}>
      {() => (
        <>
          {series.map((s) => (
            <Area key={s.id} series={s.id} axis="y" color={s.color} dashed={s.dashed} />
          ))}
          {referenceLine && (
            <Annotation
              axis="y"
              value={referenceLine.value}
              label={referenceLine.label}
              variant="warning"
            />
          )}
        </>
      )}
    </Visualization>
  )
}
