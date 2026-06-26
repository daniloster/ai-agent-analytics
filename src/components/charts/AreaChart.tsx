import { useDeepComputed } from '../../hooks/useDeepComputed'
import { Visualization, defineAxes } from './Visualization'
import { Area } from './marks/Area'
import { Annotation } from './overlays/Annotation'
import { useVisualizationContext } from './VisualizationContext'

export interface AreaChartSeries {
  id: string
  label: string
  data: Array<{ date: string; value: number }>
  color?: string
  dashed?: boolean
  fillOpacity?: number
}

export interface AreaChartProps {
  series: AreaChartSeries[]
  referenceLine?: { value: number; label: string; variant?: 'warning' | 'destructive' }
  height?: number
  ariaLabel?: string
}

const AREA_CHART_AXES = defineAxes([
  {
    id: 'x',
    type: 'time' as const,
    position: 'bottom' as const,
    accessor: (d) => new Date((d as { date: string }).date),
    numTicks: 5,
  },
  {
    id: 'y',
    type: 'linear' as const,
    position: 'left' as const,
    accessor: (d) => (d as { value: number }).value,
    domain: 'auto' as const,
    numTicks: 4,
  },
])

function AreaCrosshair({ series }: { series: AreaChartSeries[] }): JSX.Element | null {
  const { activePoint, baseScale, baseAxisAccessor, scales, innerHeight, tokens } = useVisualizationContext()
  const ap = activePoint.value
  if (!ap || !baseScale.value || !baseAxisAccessor.value) return null

  const datum = ap.datum as Record<string, unknown>
  const xFn = baseScale.value as (v: unknown) => number
  const x = xFn(baseAxisAccessor.value(datum))
  const h = innerHeight.value
  const yFn = scales.value['y'] as ((v: unknown) => number) | undefined

  return (
    <g pointerEvents="none">
      <line x1={x} x2={x} y1={0} y2={h} stroke={tokens.border} strokeWidth={1} />
      {yFn &&
        series.map((s) => {
          const val = datum[s.id]
          if (val === undefined || val === null) return null
          const y = yFn(val)
          if (isNaN(y)) return null
          return (
            <circle
              key={s.id}
              cx={x}
              cy={y}
              r={4}
              fill={s.color ?? tokens.primary}
              stroke="#fff"
              strokeWidth={2}
            />
          )
        })}
    </g>
  )
}

export function AreaChart({ series, referenceLine, height, ariaLabel }: AreaChartProps): JSX.Element {
  const dataSig = useDeepComputed(() =>
    Object.fromEntries(
      series.map((s) => [
        s.id,
        s.data.map((d) => ({ ...d, [s.id]: d.value })),
      ]),
    ),
  )
  return (
    <Visualization data={dataSig} axes={AREA_CHART_AXES} height={height} ariaLabel={ariaLabel}>
      {() => (
        <>
          {series.map((s) => (
            <Area key={s.id} series={s.id} axis="y" color={s.color} dashed={s.dashed} fillOpacity={s.fillOpacity} />
          ))}
          {referenceLine && (
            <Annotation
              axis="y"
              value={referenceLine.value}
              label={referenceLine.label}
              variant={referenceLine.variant ?? 'destructive'}
            />
          )}
          <AreaCrosshair series={series} />
        </>
      )}
    </Visualization>
  )
}
