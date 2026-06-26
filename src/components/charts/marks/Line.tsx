import { LinePath } from '@visx/shape'
import { useVisualizationContext } from '../VisualizationContext'

export interface LineProps {
  series: string
  axis: string
  color?: string
  strokeWidth?: number
}

export function Line({ series, axis, color, strokeWidth = 2 }: LineProps): JSX.Element | null {
  const { dataSignal, scales, baseScale, baseAxisAccessor, innerWidth, tokens } = useVisualizationContext()

  if (innerWidth === 0) return null

  const data = dataSignal.value
  const yScale = scales[axis] as ((v: unknown) => number) | undefined
  const xScale = baseScale as ((v: unknown) => number) | null

  if (!yScale || !xScale || !baseAxisAccessor) return null

  return (
    <LinePath
      data={data}
      x={(d) => xScale(baseAxisAccessor(d))}
      y={(d) => yScale(d[series])}
      stroke={color ?? tokens.primary}
      strokeWidth={strokeWidth}
      fill="none"
    />
  )
}
