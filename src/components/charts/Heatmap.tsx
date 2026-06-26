import { HeatmapRect } from '@visx/heatmap'
import { scaleSequential } from 'd3-scale'
import { interpolateRgb } from 'd3-interpolate'
import type { ReadonlySignal } from '@preact/signals-react'
import { ParentSizeComputed } from './primitives/ParentSizeComputed'
import { useChartTokens, type ChartTokens } from './primitives/useChartTokens'

export interface HeatmapProps {
  data: Array<{ date: string; uptime_pct: number }>
  colorScale: 'availability' | 'cost'
  height?: number
  ariaLabel?: string
}

interface HeatmapCanvasProps {
  data: Array<{ date: string; uptime_pct: number }>
  colorScale: 'availability' | 'cost'
  width: ReadonlySignal<number>
  height: number
  tokens: ChartTokens
}

type DayEntry = { date: string; uptime_pct: number }
type WeekCol = { weekIndex: number; days: DayEntry[] }

function HeatmapCanvas({ data, colorScale, width, height, tokens }: HeatmapCanvasProps): JSX.Element | null {
  const w = width.value
  if (w === 0 || data.length === 0) return null

  const numWeeks = Math.ceil(data.length / 7)
  const cellWidth = w / numWeeks
  const cellHeight = height / 7

  const weeks: WeekCol[] = []
  for (let i = 0; i < numWeeks; i++) {
    weeks.push({ weekIndex: i, days: data.slice(i * 7, i * 7 + 7) })
  }

  let getColor: (v: number) => string
  if (colorScale === 'availability') {
    const scale = scaleSequential(interpolateRgb('#ef4444', '#22c55e')).domain([0, 100])
    getColor = (v) => scale(v) ?? '#cccccc'
  } else {
    const maxValue = Math.max(...data.map((d) => d.uptime_pct), 1)
    const scale = scaleSequential(interpolateRgb(tokens.background, tokens.destructive)).domain([0, maxValue])
    getColor = (v) => scale(v) ?? '#cccccc'
  }

  return (
    <svg width={w} height={height}>
      <HeatmapRect<WeekCol, DayEntry>
        data={weeks}
        binWidth={cellWidth}
        binHeight={cellHeight}
        gap={2}
        xScale={(col) => col * cellWidth}
        yScale={(row) => row * cellHeight}
        bins={(col) => col.days}
        count={(day) => day.uptime_pct}
        colorScale={(count) => getColor(count as number)}
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
                  fill={cell.color ?? getColor(datum.uptime_pct)}
                  tabIndex={0}
                  role="listitem"
                  aria-label={
                    colorScale === 'availability'
                      ? `${datum.date}: ${datum.uptime_pct}% uptime`
                      : `${datum.date}: ${datum.uptime_pct}`
                  }
                />
              )
            }),
          )
        }
      </HeatmapRect>
    </svg>
  )
}

export function Heatmap({ data, colorScale, height = 120, ariaLabel }: HeatmapProps): JSX.Element {
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
          />
        )}
      </ParentSizeComputed>
    </figure>
  )
}
