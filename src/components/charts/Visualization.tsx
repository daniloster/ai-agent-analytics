import { useRef } from 'react'
import { useSignal } from '@preact/signals-react'
import type { ReadonlySignal } from '@preact/signals-react'
import { localPoint } from '@visx/event'
import { bisectCenter } from 'd3-array'
import { Group } from '@visx/group'
import type { AxisConfig, ActivePoint, AnyD3Scale } from '../../types/charts'
import { buildScale } from './primitives/scales'
import { useChartTokens } from './primitives/useChartTokens'
import { ChartSVG } from './primitives/ChartSVG'
import { AxisBottom, AxisLeft, AxisRight } from './primitives/Axis'
import { GridRows, GridColumns } from './primitives/Grid'
import { VisualizationContext } from './VisualizationContext'
import { useDeepComputed } from '../../hooks/useDeepComputed'

export interface VisualizationProps<TData extends Record<string, unknown>> {
  data: ReadonlySignal<TData[]>
  axes: AxisConfig[] | ((data: TData[]) => AxisConfig[])
  height?: number
  className?: string
  ariaLabel?: string
  children: React.ReactNode
}

const DEFAULT_MARGIN = { top: 10, right: 20, bottom: 40, left: 50 }
const ZERO_MARGIN = { top: 0, right: 0, bottom: 0, left: 0 }

interface InnerProps<TData extends Record<string, unknown>> extends VisualizationProps<TData> {
  fullWidth: number
  fullHeight: number
}

function VisualizationInner<TData extends Record<string, unknown>>({
  data,
  axes,
  fullWidth,
  fullHeight,
  ariaLabel,
  children,
}: InnerProps<TData>): JSX.Element {
  const tokens = useChartTokens()
  const activePoint = useSignal<ActivePoint | null>(null)
  const mousePosition = useSignal<{ x: number; y: number } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const resolvedAxes = useDeepComputed<AxisConfig[]>(() =>
    typeof axes === 'function' ? axes(data.value as TData[]) : axes
  )

  const allHidden = resolvedAxes.value.every((a) => a.hidden)
  const margin = allHidden ? ZERO_MARGIN : DEFAULT_MARGIN
  const innerWidth = fullWidth - margin.left - margin.right
  const innerHeight = fullHeight - margin.top - margin.bottom

  const rawData = data.value as Record<string, unknown>[]

  const scales = useDeepComputed<Record<string, AnyD3Scale>>(() => {
    const result: Record<string, AnyD3Scale> = {}
    for (const axis of resolvedAxes.value) {
      result[axis.id] = buildScale(axis, data.value as Record<string, unknown>[], innerWidth, innerHeight)
    }
    return result
  })

  const baseAxisConfig = resolvedAxes.value.find((a) => a.position === 'bottom') ?? null
  const baseScale = baseAxisConfig ? scales.value[baseAxisConfig.id] : null

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return
    const point = localPoint(svgRef.current, event)
    if (!point) return
    mousePosition.value = { x: point.x, y: point.y }

    if (baseScale && 'invert' in baseScale && baseAxisConfig) {
      const invertFn = (baseScale as { invert: (v: number) => unknown }).invert
      const x0 = invertFn.call(baseScale, point.x - margin.left)
      const domainValues = rawData.map((d) => baseAxisConfig.accessor(d))

      let idx: number
      if (x0 instanceof Date) {
        idx = bisectCenter(
          domainValues.map((v) => (v instanceof Date ? v : new Date(v as string | number))) as Date[],
          x0,
        )
      } else {
        idx = bisectCenter(domainValues.map((v) => Number(v)), x0 as number)
      }

      const clampedIdx = Math.max(0, Math.min(idx, rawData.length - 1))
      const datum = rawData[clampedIdx]
      if (datum) {
        const xPx = (baseScale as (v: unknown) => number)(baseAxisConfig.accessor(datum))
        activePoint.value = {
          series: '',
          axis: baseAxisConfig.id,
          datum,
          x: xPx + margin.left,
          y: point.y,
        }
      }
    }
  }

  const handlePointerLeave = () => {
    activePoint.value = null
    mousePosition.value = null
  }

  return (
    <VisualizationContext.Provider
      value={{
        dataSignal: data as ReadonlySignal<Record<string, unknown>[]>,
        innerWidth,
        innerHeight,
        tokens,
        scales: scales.value,
        baseScale,
        baseAxisAccessor: baseAxisConfig?.accessor ?? null,
        activePoint,
        mousePosition,
      }}
    >
      <figure aria-label={ariaLabel}>
        <svg
          ref={svgRef}
          width={fullWidth}
          height={fullHeight}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          {resolvedAxes.value.map((axis) => {
            const scale = scales.value[axis.id]
            if (axis.hidden || !scale) return null
            if (axis.position === 'bottom') {
              return (
                <AxisBottom
                  key={axis.id}
                  scale={scale}
                  top={innerHeight + margin.top}
                  left={margin.left}
                  tickFormat={axis.tickFormat}
                  numTicks={axis.numTicks}
                  label={axis.label}
                  tokens={tokens}
                />
              )
            }
            if (axis.position === 'left') {
              return (
                <Group key={axis.id} left={margin.left} top={margin.top}>
                  <GridRows scale={scale} width={innerWidth} height={innerHeight} tokens={tokens} />
                  <AxisLeft
                    scale={scale}
                    tickFormat={axis.tickFormat}
                    numTicks={axis.numTicks}
                    label={axis.label}
                    tokens={tokens}
                  />
                </Group>
              )
            }
            if (axis.position === 'right') {
              return (
                <AxisRight
                  key={axis.id}
                  scale={scale}
                  top={margin.top}
                  left={margin.left + innerWidth}
                  tickFormat={axis.tickFormat}
                  numTicks={axis.numTicks}
                  label={axis.label}
                  tokens={tokens}
                />
              )
            }
            return null
          })}
          {baseAxisConfig && !baseAxisConfig.hidden && (
            <Group left={margin.left} top={margin.top}>
              <GridColumns
                scale={scales.value[baseAxisConfig.id]}
                width={innerWidth}
                height={innerHeight}
                tokens={tokens}
              />
            </Group>
          )}
          <Group left={margin.left} top={margin.top}>
            {children}
          </Group>
        </svg>
      </figure>
    </VisualizationContext.Provider>
  )
}

export function Visualization<TData extends Record<string, unknown>>(
  props: VisualizationProps<TData>,
): JSX.Element {
  return (
    <ChartSVG height={props.height} className={props.className}>
      {(fullWidth, fullHeight) => (
        <VisualizationInner {...props} fullWidth={fullWidth} fullHeight={fullHeight} />
      )}
    </ChartSVG>
  )
}
