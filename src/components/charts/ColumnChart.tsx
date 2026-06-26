import { useMemo } from 'react'
import { LinePath } from '@visx/shape'
import { useDeepComputed } from '../../hooks/useDeepComputed'
import { Visualization } from './Visualization'
import { useVisualizationContext } from './VisualizationContext'
import { Bar } from './marks/Bar'
import { Annotation } from './overlays/Annotation'

export interface ColumnChartBar {
  label: string
  value: number
  color?: string
}

export interface ColumnChartProps {
  bars: ColumnChartBar[]
  annotation?: { value: number; label: string }
  trendLine?: boolean
  height?: number
  ariaLabel?: string
}

function ColumnTrendLine({ series, axis }: { series: string; axis: string }): JSX.Element | null {
  const { dataSignal, scales, tokens } = useVisualizationContext()

  const data = (dataSignal.value[series] ?? []) as ColumnChartBar[]
  const yScale = scales.value[axis] as ((v: unknown) => number) | undefined
  const xBandScale = scales.value['x'] as
    | ((v: unknown) => number | undefined) & { bandwidth(): number }
    | undefined

  if (!yScale || !xBandScale || data.length === 0) return null

  const bw = xBandScale.bandwidth()

  return (
    <LinePath
      data={data}
      x={(d) => (xBandScale(d.label) ?? 0) + bw / 2}
      y={(d) => yScale(d.value)}
      stroke={tokens.muted}
      strokeWidth={2}
      fill="none"
    />
  )
}

export function ColumnChart({ bars, annotation, trendLine, height, ariaLabel }: ColumnChartProps): JSX.Element {
  const dataSig = useDeepComputed(() => ({ bars: bars.map((b) => ({ ...b, bars: b.value })) }))
  const axes = useMemo(
    () => [
      {
        id: 'x',
        type: 'band' as const,
        position: 'bottom' as const,
        accessor: (d: unknown) => (d as ColumnChartBar).label,
      },
      {
        id: 'y',
        type: 'linear' as const,
        position: 'left' as const,
        accessor: (d: unknown) => (d as ColumnChartBar).value,
        domain: 'auto' as const,
      },
    ],
    [],
  )

  return (
    <Visualization data={dataSig} axes={axes} height={height} ariaLabel={ariaLabel}>
      {() => (
        <>
          <Bar series="bars" axis="y" />
          {trendLine && <ColumnTrendLine series="bars" axis="y" />}
          {annotation && (
            <Annotation axis="y" value={annotation.value} label={annotation.label} variant="warning" />
          )}
        </>
      )}
    </Visualization>
  )
}
