import { BarStack } from '@visx/shape'
import { useVisualizationContext } from '../VisualizationContext'
import type { ScaleBand } from 'd3-scale'
import type { ActivePoint, AnyD3Scale } from '../../../types/charts'

export interface BarProps<TSeries extends string = string, TAxisId extends string = string> {
  series: TSeries
  axis: TAxisId
  grouped?: boolean   // TODO: grouped mode (BarGroup) — not yet implemented, renders as simple
  stacked?: boolean
  color?: string
  sortBy?: 'asc' | 'desc'
}

function computeActivePoint(
  series: string,
  axis: string,
  datum: Record<string, unknown>,
  xPos: number,
  yPos: number,
): ActivePoint {
  return { series, axis, datum, x: xPos, y: yPos }
}

export function Bar(props: BarProps): JSX.Element | null {
  const {
    dataSignal,
    scales,
    baseAxisAccessor,
    innerWidth,
    innerHeight,
    tokens,
    activePoint,
  } = useVisualizationContext()

  if (innerWidth === 0) return null

  const data = (dataSignal.value[props.series] ?? []) as Record<string, unknown>[]
  const color = props.color ?? tokens.primary

  const sorted = props.sortBy
    ? [...data].sort((a, b) =>
        props.sortBy === 'asc'
          ? (a[props.series] as number) - (b[props.series] as number)
          : (b[props.series] as number) - (a[props.series] as number),
      )
    : data

  const xScale = scales['x'] as ScaleBand<string>
  const yScale = scales[props.axis] as unknown as AnyD3Scale
  const yScaleFn = yScale as unknown as (v: unknown) => number

  const getX = (datum: Record<string, unknown>, i: number): number => {
    if (props.sortBy) {
      return i * xScale.step()
    }
    const cat = baseAxisAccessor ? (baseAxisAccessor(datum) as string) : String(i)
    return xScale(cat) ?? 0
  }

  if (props.stacked) {
    const stackedXScale = xScale as unknown as Parameters<typeof BarStack>[0]['xScale']
    const stackedYScale = yScale as unknown as Parameters<typeof BarStack>[0]['yScale']
    return (
      <BarStack
        data={sorted as Record<string, number>[]}
        keys={[props.series]}
        x={(d) => {
          const cat = baseAxisAccessor ? (baseAxisAccessor(d as Record<string, unknown>) as string) : ''
          return cat
        }}
        xScale={stackedXScale}
        yScale={stackedYScale}
        color={() => color}
      >
        {(barStacks) =>
          barStacks.flatMap((barStack) =>
            barStack.bars.map((bar) => (
              <rect
                key={`stack-${barStack.index}-${bar.index}`}
                x={bar.x}
                y={bar.y}
                width={bar.width}
                height={bar.height}
                fill={bar.color}
                tabIndex={0}
                role="listitem"
                aria-label={`${props.series}: ${(bar.bar.data as Record<string, unknown>)[props.series]}`}
                onPointerEnter={() => {
                  activePoint.value = computeActivePoint(props.series, props.axis, bar.bar.data as Record<string, unknown>, bar.x, bar.y)
                }}
                onPointerLeave={() => { activePoint.value = null }}
                onFocus={() => {
                  activePoint.value = computeActivePoint(props.series, props.axis, bar.bar.data as Record<string, unknown>, bar.x, bar.y)
                }}
                onBlur={() => { activePoint.value = null }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    activePoint.value = computeActivePoint(props.series, props.axis, bar.bar.data as Record<string, unknown>, bar.x, bar.y)
                  } else if (e.key === 'Escape') {
                    activePoint.value = null
                  }
                }}
              />
            )),
          )
        }
      </BarStack>
    )
  }

  return (
    <>
      {sorted.map((datum, i) => {
        const x = getX(datum, i)
        const y = yScaleFn(datum[props.series])
        const barWidth = xScale.bandwidth()
        const barHeight = innerHeight - y
        const handleActivate = () => {
          activePoint.value = computeActivePoint(props.series, props.axis, datum, x, y)
        }
        const handleDeactivate = () => { activePoint.value = null }
        return (
          <rect
            key={i}
            x={x}
            y={y}
            width={barWidth}
            height={barHeight}
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
                activePoint.value = computeActivePoint(props.series, props.axis, datum, x, y)
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
