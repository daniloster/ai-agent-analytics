import { HeatmapRect } from '@visx/heatmap'
import { scaleSequential } from 'd3-scale'
import { interpolateRgb } from 'd3-interpolate'
import { useVisualizationContext } from '../VisualizationContext'
import type { ActivePoint } from '../../../types/charts'

export interface HeatmapMarkProps {
  series: string
  dateKey: string
  colorScale: 'availability' | 'cost'
}

type DayBin = Record<string, unknown>
type WeekColumn = { weekIndex: number; days: DayBin[] }

function buildColorScale(
  type: 'availability' | 'cost',
  maxValue: number,
  bgColor: string,
  destructiveColor: string,
): (value: number) => string {
  if (type === 'availability') {
    const scale = scaleSequential(interpolateRgb('#ef4444', '#22c55e')).domain([0, 100])
    return (v) => scale(v) ?? '#cccccc'
  }
  const scale = scaleSequential(interpolateRgb(bgColor, destructiveColor)).domain([0, maxValue])
  return (v) => scale(v) ?? '#cccccc'
}

export function HeatmapMark(props: HeatmapMarkProps): JSX.Element | null {
  const { dataSignal, innerWidth, innerHeight, tokens, activePoint } = useVisualizationContext()

  if (innerWidth === 0) return null

  const data = dataSignal.value
  if (data.length === 0) return null

  const numWeeks = Math.ceil(data.length / 7)
  const cellWidth = innerWidth / numWeeks
  const cellHeight = innerHeight / 7

  const weeks: WeekColumn[] = []
  for (let w = 0; w < numWeeks; w++) {
    weeks.push({
      weekIndex: w,
      days: data.slice(w * 7, w * 7 + 7),
    })
  }

  const maxValue =
    props.colorScale === 'cost'
      ? Math.max(...data.map((d) => Number(d[props.series]) || 0), 1)
      : 100

  const getColor = buildColorScale(
    props.colorScale,
    maxValue,
    tokens.background,
    tokens.destructive,
  )

  const makeActivePoint = (datum: DayBin, x: number, y: number): ActivePoint => ({
    series: props.series,
    axis: props.dateKey,
    datum,
    x,
    y,
  })

  return (
    <HeatmapRect<WeekColumn, DayBin>
      data={weeks}
      binWidth={cellWidth}
      binHeight={cellHeight}
      gap={2}
      xScale={(col) => col * cellWidth}
      yScale={(row) => row * cellHeight}
      bins={(col) => col.days}
      count={(day) => Number(day[props.series]) || 0}
      colorScale={(count) => getColor(count as number)}
    >
      {(cells) =>
        cells.flatMap((colCells) =>
          colCells.map((cell) => {
            const datum = cell.bin
            const handleActivate = () => {
              activePoint.value = makeActivePoint(datum, cell.x, cell.y)
            }
            const handleDeactivate = () => {
              activePoint.value = null
            }
            return (
              <rect
                key={`${cell.column}-${cell.row}`}
                x={cell.x}
                y={cell.y}
                width={cell.width}
                height={cell.height}
                fill={cell.color ?? getColor(Number(datum[props.series]) || 0)}
                tabIndex={0}
                role="listitem"
                aria-label={`${datum[props.dateKey]}: ${datum[props.series]}`}
                onPointerEnter={handleActivate}
                onPointerLeave={handleDeactivate}
                onFocus={handleActivate}
                onBlur={handleDeactivate}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    activePoint.value = makeActivePoint(datum, cell.x, cell.y)
                  } else if (e.key === 'Escape') {
                    activePoint.value = null
                  }
                }}
              />
            )
          }),
        )
      }
    </HeatmapRect>
  )
}
