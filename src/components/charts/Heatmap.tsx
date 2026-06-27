import { HeatmapRect } from '@visx/heatmap'
import { scaleSequential } from 'd3-scale'
import { interpolateRgb } from 'd3-interpolate'
import { useRef } from 'react'
import { useSignal } from '@preact/signals-react'
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
  ariaLabel?: string
  getAriaLabel?: (datum: HeatmapDatum) => string
}

type WeekCol = { weekIndex: number; days: HeatmapDatum[] }

function HeatmapCanvas({ data, colorScale, width, height, tokens, ariaLabel, getAriaLabel }: HeatmapCanvasProps): JSX.Element | null {
  const w = width.value
  if (w === 0 || data.length === 0) return null

  const focusedIdx = useSignal(0)
  const announceText = useSignal('')
  const cellRefs = useRef<Map<number, SVGRectElement>>(new Map())
  const totalCells = data.length

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
    <>
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
            <g role="list" aria-label={ariaLabel ?? 'Heatmap data'}>
              {cells.flatMap((colCells, colIdx) =>
                colCells.map((cell, rowIdx) => {
                  const datum = cell.bin
                  const linearIdx = colIdx * 7 + rowIdx
                  const cellAriaLabel = labelFor(datum)
                  const handleKeyDown = (e: React.KeyboardEvent) => {
                    let newIdx: number | null = null
                    if (e.key === 'ArrowRight') { e.preventDefault(); newIdx = Math.min(totalCells - 1, linearIdx + 7) }
                    else if (e.key === 'ArrowLeft') { e.preventDefault(); newIdx = Math.max(0, linearIdx - 7) }
                    else if (e.key === 'ArrowDown') { e.preventDefault(); newIdx = Math.min(totalCells - 1, linearIdx + 1) }
                    else if (e.key === 'ArrowUp') { e.preventDefault(); newIdx = Math.max(0, linearIdx - 1) }
                    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); announceText.value = cellAriaLabel }
                    else if (e.key === 'Escape') { announceText.value = '' }
                    if (newIdx !== null) { focusedIdx.value = newIdx; cellRefs.current.get(newIdx)?.focus() }
                  }
                  return (
                    <rect
                      key={`${cell.column}-${cell.row}`}
                      ref={(el) => { if (el) cellRefs.current.set(linearIdx, el); else cellRefs.current.delete(linearIdx) }}
                      x={cell.x}
                      y={cell.y}
                      width={cell.width}
                      height={cell.height}
                      fill={getColor(datum)}
                      tabIndex={focusedIdx.value === linearIdx ? 0 : -1}
                      role="listitem"
                      aria-label={cellAriaLabel}
                      onFocus={() => { focusedIdx.value = linearIdx }}
                      onBlur={() => {}}
                      onKeyDown={handleKeyDown}
                    />
                  )
                })
              )}
            </g>
          }
        </HeatmapRect>
      </svg>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">{announceText.value}</div>
    </>
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
            ariaLabel={ariaLabel}
            getAriaLabel={getAriaLabel}
          />
        )}
      </ParentSizeComputed>
    </figure>
  )
}
