import { LinePath } from '@visx/shape'
import { useVisualizationContext } from './VisualizationContext'
import { Bar } from './marks/Bar'
import type { BarProps } from './marks/Bar'
import type { AnyD3Scale } from '../../types/charts'

export type ColumnChartProps = BarProps

export function ColumnChart(props: ColumnChartProps): JSX.Element | null {
  return <Bar {...props} />
}

export function ColumnTrendLine({ series, axis }: { series: string; axis: string }): JSX.Element | null {
  const { dataSignal, scales, tokens } = useVisualizationContext()

  const data = (dataSignal.value[series] ?? []) as Record<string, unknown>[]
  const yScale = scales.value[axis] as unknown as AnyD3Scale
  const xBandScale = scales.value['x'] as
    | ((v: unknown) => number | undefined) & { bandwidth(): number }
    | undefined

  if (!yScale || !xBandScale || data.length === 0) return null

  const yScaleFn = yScale as unknown as (v: unknown) => number
  const bw = xBandScale.bandwidth()

  return (
    <LinePath
      data={data}
      x={(d) => (xBandScale(d['label']) ?? 0) + bw / 2}
      y={(d) => yScaleFn(d[series])}
      stroke={tokens.muted}
      strokeWidth={2}
      fill="none"
    />
  )
}
