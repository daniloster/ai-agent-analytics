import { TooltipWithBounds } from '@visx/tooltip'
import { useVisualizationContext } from '../VisualizationContext'

export interface MouseTooltipProps {
  children: React.ReactNode | ((pos: { x: number; y: number }) => React.ReactNode)
}

export function MouseTooltip(props: MouseTooltipProps): JSX.Element | null {
  const { mousePosition } = useVisualizationContext()
  const pos = mousePosition.value
  if (!pos) return null

  return (
    <TooltipWithBounds top={pos.y} left={pos.x}>
      {typeof props.children === 'function' ? props.children({ x: pos.x, y: pos.y }) : props.children}
    </TooltipWithBounds>
  )
}
