import { Area } from './marks/Area'

export interface SparklineChartProps {
  series: string
  axis: string
  color?: string
  fillOpacity?: number
}

export function SparklineChart({ series, axis, color, fillOpacity = 0.15 }: SparklineChartProps): JSX.Element | null {
  return <Area series={series} axis={axis} color={color} fillOpacity={fillOpacity} />
}
