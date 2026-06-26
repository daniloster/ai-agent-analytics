import { LinePath } from '@visx/shape'
import { useVisualizationContext } from '../VisualizationContext'

export interface LineProps<TSeries extends string = string, TAxisId extends string = string> {
  series: TSeries
  axis: TAxisId
  color?: string
  strokeWidth?: number
}

export function Line({ series, axis, color, strokeWidth = 2 }: LineProps): JSX.Element | null {
  const { dataSignal, scales, baseScale, baseAxisAccessor, innerWidth, tokens } = useVisualizationContext()

  if (innerWidth.value === 0) return null

  const data = (dataSignal.value[series] ?? []) as Record<string, unknown>[]
  const yScale = scales.value[axis] as ((v: unknown) => number) | undefined
  const xScale = baseScale.value as ((v: unknown) => number) | null
  const accessor = baseAxisAccessor.value

  if (!yScale || !xScale || !accessor) return null

  return (
    <LinePath
      data={data}
      x={(d) => xScale(accessor(d))}
      y={(d) => yScale(d[series])}
      stroke={color ?? tokens.primary}
      strokeWidth={strokeWidth}
      fill="none"
    />
  )
}
