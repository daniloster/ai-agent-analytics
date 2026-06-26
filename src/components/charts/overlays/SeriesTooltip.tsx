import { TooltipWithBounds } from '@visx/tooltip'
import { useVisualizationContext } from '../VisualizationContext'

export interface SeriesTooltipProps<TData extends Record<string, unknown>> {
  series: string
  children: (point: { datum: TData; x: number; y: number }) => React.ReactNode
}

export function SeriesTooltip<TData extends Record<string, unknown>>(
  props: SeriesTooltipProps<TData>,
): JSX.Element | null {
  const { activePoint } = useVisualizationContext()
  const ap = activePoint.value
  if (!ap || ap.series !== props.series) return null

  return (
    <TooltipWithBounds top={ap.y} left={ap.x}>
      {props.children({ datum: ap.datum as TData, x: ap.x, y: ap.y })}
    </TooltipWithBounds>
  )
}
