import { HeatmapRect } from '@visx/heatmap'
import { scaleSequential } from 'd3-scale'
import { interpolateRgb } from 'd3-interpolate'
import type { ReadonlySignal } from '@preact/signals-react'
import { ParentSizeComputed } from './primitives/ParentSizeComputed'
import { useChartTokens, type ChartTokens } from './primitives/useChartTokens'

type HeatmapDatum = { date: string; value: number } & Record<string, unknown>

export interface HeatmapProps {
  data: HeatmapDatum[]
  colorScale: 'availability' | 'cost'
  height?: number
  ariaLabel?: string
  getAriaLabel?: (datum: HeatmapDatum) => string
}

interface HeatmapCanvasProps {
  data: HeatmapDatum[]
  colorScale: 'availability' | 'cost'
  width: ReadonlySignal<number>
  height: number
  tokens: ChartTokens
  getAriaLabel?: (datum: HeatmapDatum) => string
}

type WeekCol = { weekIndex: number; days: HeatmapDatum[] }

function HeatmapCanvas({ data, colorScale, width, height, tokens, getAriaLabel }: HeatmapCanvasProps): JSX.Element | null {
  const w = width.value
  if (w === 0 || data.length === 0) return null

  const numWeeks = Math.ceil(data.length / 7)
  const cellWidth = w / numWeeks
  const cellHeight = height / 7

  const weeks: WeekCol[] = []
  for (let i = 0; i < numWeeks; i++) {
    weeks.push({ weekIndex: i, days: data.slice(i * 7, i * 7 + 7) })
  }

  let getColor: (datum: HeatmapDatum) => string
  if (colorScale === 'availability') {
    const scale = scaleSequential(interpolateRgb('#ef4444', '#22c55e')).domain([0, 100])
    getColor = (datum) => scale(datum.value) ?? '#cccccc'
  } else {
    getColor = (datum) => (Boolean(datum.isAnomaly) ? tokens.destructive : tokens.muted)
  }

  const defaultAriaLabel = (datum: HeatmapDatum): string =>
    colorScale === 'availability'
      ? `${datum.date}: ${datum.value}% uptime`
      : `${datum.date}: ${datum.value}`

  const labelFor = getAriaLabel ?? defaultAriaLabel

  return (
    <svg width={w} height={height}>
      <HeatmapRect<WeekCol, HeatmapDatum>
        data={weeks}
        binWidth={cellWidth}
        binHeight={cellHeight}
        gap={2}
        xScale={(col) => col * cellWidth}
        yScale={(row) => row * cellHeight}
        bins={(col) => col.days}
        count={(day) => day.value}
        colorScale={(count) => getColor({ value: count as number, date: '' })}
      >
        {(cells) =>
          cells.flatMap((colCells) =>
            colCells.map((cell) => {
              const datum = cell.bin
              return (
                <rect
                  key={`${cell.column}-${cell.row}`}
                  x={cell.x}
                  y={cell.y}
                  width={cell.width}
                  height={cell.height}
                  fill={getColor(datum)}
                  tabIndex={0}
                  role="listitem"
                  aria-label={labelFor(datum)}
                />
              )
            }),
          )
        }
      </HeatmapRect>
    </svg>
  )
}

export function Heatmap({ data, colorScale, height = 120, ariaLabel, getAriaLabel }: HeatmapProps): JSX.Element {
  const tokens = useChartTokens()
  return (
    <figure role="img" aria-label={ariaLabel ?? 'Availability heatmap'}>
      <ParentSizeComputed heightOverride={height}>
        {(widthSig) => (
          <HeatmapCanvas
            data={data}
            colorScale={colorScale}
            width={widthSig}
            height={height}
            tokens={tokens}
            getAriaLabel={getAriaLabel}
          />
        )}
      </ParentSizeComputed>
    </figure>
  )
}
