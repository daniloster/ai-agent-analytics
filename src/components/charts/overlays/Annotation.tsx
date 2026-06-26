import { useVisualizationContext } from '../VisualizationContext'

export interface AnnotationProps<TAxisId extends string = string> {
  axis: TAxisId
  value: number
  label: string
  variant?: 'warning' | 'destructive'
}

export function Annotation(props: AnnotationProps): JSX.Element | null {
  const { scales, innerWidth, tokens } = useVisualizationContext()

  const width = innerWidth.value
  if (width === 0) return null

  const scale = scales.value[props.axis] as (v: number) => number
  const yPx = scale(props.value)
  const color = props.variant === 'destructive' ? tokens.destructive : tokens.warning

  return (
    <g>
      <line x1={0} x2={width} y1={yPx} y2={yPx} stroke={color} strokeDasharray="4 2" />
      <text x={width} y={yPx - 4} textAnchor="end" fill={color} fontSize={11}>
        {props.label}
      </text>
    </g>
  )
}
