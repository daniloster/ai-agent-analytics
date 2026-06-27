import { useVisualizationContext } from '../VisualizationContext'
import type { AnyD3Scale } from '../../../types/charts'

export interface DataLabelsProps {
  series: string
  axis: string
  format?: (v: number) => string
  /** When true, offsets x positions by half the band width. Use when the x-axis is a band scale. */
  centered?: boolean
}

export function DataLabels({ series, axis, format, centered }: DataLabelsProps): JSX.Element | null {
  const { dataSignal, scales, baseScale, baseAxisAccessor, tokens } = useVisualizationContext()

  const data = (dataSignal.value[series] ?? []) as Record<string, unknown>[]
  const yScale = scales.value[axis] as unknown as AnyD3Scale
  const rawXScaleFn = baseScale.value as ((v: unknown) => number) | null
  const accessor = baseAxisAccessor.value

  if (!rawXScaleFn || !accessor || !yScale) return null

  const bw =
    centered && baseScale.value !== null && 'bandwidth' in (baseScale.value as object)
      ? (baseScale.value as { bandwidth: () => number }).bandwidth() / 2
      : 0

  const xScaleFn = bw !== 0 ? (v: unknown) => rawXScaleFn(v) + bw : rawXScaleFn
  const yScaleFn = yScale as unknown as (v: unknown) => number

  return (
    <>
      {data.map((datum, i) => {
        const v = datum[series]
        if (v === null || v === undefined || isNaN(Number(v))) return null
        const cx = xScaleFn(accessor(datum))
        const cy = yScaleFn(v)
        const text = format ? format(v as number) : String(Math.round((v as number) * 10) / 10)
        return (
          <text
            key={i}
            x={cx}
            y={cy - 8}
            textAnchor="middle"
            fontSize={11}
            fill={tokens.muted}
            pointerEvents="none"
          >
            {text}
          </text>
        )
      })}
    </>
  )
}
