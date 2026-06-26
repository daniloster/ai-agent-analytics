import { useDeepComputed } from '../../hooks/useDeepComputed'
import { Visualization, defineAxes } from './Visualization'
import { Area } from './marks/Area'

export interface SparklineProps {
  data: Array<{ date: string; value: number }>
  color?: string
  height?: number
}

const SPARKLINE_AXES = defineAxes([
  {
    id: 'x',
    type: 'time' as const,
    position: 'bottom' as const,
    accessor: (d) => new Date((d as { date: string }).date),
    hidden: true,
  },
  {
    id: 'y',
    type: 'linear' as const,
    position: 'left' as const,
    accessor: (d) => (d as { value: number }).value,
    hidden: true,
  },
])

export function Sparkline({ data, color, height = 40 }: SparklineProps): JSX.Element {
  const dataSig = useDeepComputed(() => ({ trend: data }))
  return (
    <Visualization data={dataSig} axes={SPARKLINE_AXES} height={height}>
      {() => <Area series="trend" axis="y" color={color} fillOpacity={0.15} />}
    </Visualization>
  )
}
