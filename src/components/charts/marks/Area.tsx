import { AreaClosed, LinePath } from '@visx/shape'
import { LinearGradient } from '@visx/gradient'
import { useVisualizationContext } from '../VisualizationContext'
import type { ActivePoint, AnyD3Scale } from '../../../types/charts'
import type { LineProps } from './Line'

export interface AreaProps<TSeries extends string = string, TAxisId extends string = string> extends LineProps<TSeries, TAxisId> {
  fillOpacity?: number
  dashed?: boolean
  /** When true, offsets x positions by half the band width. Use when the x-axis is a band scale. */
  centered?: boolean
}

function makeActivePoint(
  series: string,
  axis: string,
  datum: Record<string, unknown>,
  xFn: (v: unknown) => number,
  yScale: (v: unknown) => number,
  baseAxisAccessor: (d: Record<string, unknown>) => unknown,
): ActivePoint {
  return {
    series,
    axis,
    datum,
    x: xFn(baseAxisAccessor(datum)),
    y: yScale(datum[series]),
  }
}

function isDefined(datum: Record<string, unknown>, series: string): boolean {
  const v = datum[series]
  return v !== null && v !== undefined && !isNaN(Number(v))
}

export function Area(props: AreaProps): JSX.Element | null {
  const {
    dataSignal,
    scales,
    baseScale,
    baseAxisAccessor,
    innerWidth,
    tokens,
    activePoint,
  } = useVisualizationContext()

  if (innerWidth.value === 0) return null

  const data = (dataSignal.value[props.series] ?? []) as Record<string, unknown>[]
  const color = props.color ?? tokens.primary
  const gradientId = `area-gradient-${props.series}`

  const yScale = scales.value[props.axis] as unknown as AnyD3Scale
  const rawXScaleFn = baseScale.value as ((v: unknown) => number) | null
  const yScaleFn = yScale as unknown as (v: unknown) => number
  const accessor = baseAxisAccessor.value

  if (!rawXScaleFn || !accessor) return null

  const bw =
    props.centered && baseScale.value !== null && 'bandwidth' in (baseScale.value as object)
      ? (baseScale.value as { bandwidth: () => number }).bandwidth() / 2
      : 0

  const xScaleFn = bw !== 0 ? (v: unknown) => rawXScaleFn(v) + bw : rawXScaleFn

  const buildPoint = (datum: Record<string, unknown>) =>
    makeActivePoint(props.series, props.axis, datum, xScaleFn, yScaleFn, accessor)

  return (
    <>
      <defs>
        <LinearGradient
          id={gradientId}
          from={color}
          to={color}
          fromOpacity={props.fillOpacity ?? 0.3}
          toOpacity={0}
          vertical
        />
      </defs>
      <AreaClosed
        data={data}
        x={(d) => xScaleFn(accessor(d))}
        y={(d) => yScaleFn(d[props.series])}
        yScale={yScale as Parameters<typeof AreaClosed>[0]['yScale']}
        fill={`url(#${gradientId})`}
        stroke="none"
        defined={(d) => isDefined(d, props.series)}
      />
      <LinePath
        data={data}
        x={(d) => xScaleFn(accessor(d))}
        y={(d) => yScaleFn(d[props.series])}
        stroke={color}
        strokeWidth={props.strokeWidth ?? 2}
        strokeDasharray={props.dashed ? '4 2' : undefined}
        fill="none"
        defined={(d) => isDefined(d, props.series)}
      />
      {data.map((datum, i) => {
        if (!isDefined(datum, props.series)) return null
        const cx = xScaleFn(accessor(datum))
        const cy = yScaleFn(datum[props.series])
        const handleActivate = () => {
          activePoint.value = buildPoint(datum)
        }
        const handleDeactivate = () => {
          activePoint.value = null
        }
        return (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={4}
            opacity={0}
            fill={color}
            tabIndex={0}
            role="listitem"
            aria-label={`${props.series}: ${datum[props.series]}`}
            onPointerEnter={handleActivate}
            onPointerLeave={handleDeactivate}
            onFocus={handleActivate}
            onBlur={handleDeactivate}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                activePoint.value = buildPoint(datum)
              } else if (e.key === 'Escape') {
                activePoint.value = null
              }
            }}
          />
        )
      })}
    </>
  )
}
