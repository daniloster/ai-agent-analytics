import { Area } from './marks/Area'
import type { AreaProps } from './marks/Area'

export type AreaChartProps = AreaProps

export function AreaChart(props: AreaChartProps): JSX.Element | null {
  return <Area {...props} />
}
