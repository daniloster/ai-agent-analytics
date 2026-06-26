import { GridRows as VxGridRows, GridColumns as VxGridColumns } from '@visx/grid'
import type { AnyD3Scale } from '../../../types/charts'
import type { ChartTokens } from './useChartTokens'

interface GridProps {
  scale: AnyD3Scale
  width: number
  height: number
  numTicks?: number
  tokens: ChartTokens
}

export function GridRows({ scale, width, numTicks, tokens }: GridProps): JSX.Element {
  return (
    <VxGridRows
      scale={scale as Parameters<typeof VxGridRows>[0]['scale']}
      width={width}
      numTicks={numTicks}
      stroke={tokens.background}
      strokeOpacity={1}
    />
  )
}

export function GridColumns({ scale, height, numTicks, tokens }: GridProps): JSX.Element {
  return (
    <VxGridColumns
      scale={scale as Parameters<typeof VxGridColumns>[0]['scale']}
      height={height}
      numTicks={numTicks}
      stroke={tokens.border}
      strokeOpacity={0.5}
    />
  )
}
