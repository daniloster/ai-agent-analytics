import type { ScaleLinear, ScaleBand, ScaleTime } from 'd3-scale'

export type AnyD3Scale =
  | ScaleLinear<number, number>
  | ScaleBand<string>
  | ScaleTime<number, number>

export interface AxisConfig<TId extends string = string> {
  id: TId
  type: 'time' | 'linear' | 'band'
  position: 'bottom' | 'left' | 'right'
  accessor: (d: Record<string, unknown>) => number | string | Date
  domain?: [number, number] | 'auto'
  label?: string
  tickFormat?: (v: unknown) => string
  numTicks?: number
  hidden?: boolean
}

export interface ActivePoint {
  series: string
  axis: string
  datum: Record<string, unknown>
  x: number
  y: number
}
