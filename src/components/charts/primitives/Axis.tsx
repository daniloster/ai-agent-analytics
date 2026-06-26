import { AxisBottom as VxAxisBottom, AxisLeft as VxAxisLeft, AxisRight as VxAxisRight } from '@visx/axis'
import type { ChartTokens } from './useChartTokens'
import type { AnyD3Scale } from '../../../types/charts'

interface AxisProps {
  scale: AnyD3Scale
  top?: number
  left?: number
  tickFormat?: (v: unknown) => string
  numTicks?: number
  label?: string
  tokens: ChartTokens
}

export function AxisBottom({ scale, top, left, tickFormat, numTicks, label, tokens }: AxisProps): JSX.Element {
  return (
    <VxAxisBottom
      scale={scale as Parameters<typeof VxAxisBottom>[0]['scale']}
      top={top}
      left={left}
      tickFormat={tickFormat as ((value: unknown, index: number) => string) | undefined}
      numTicks={numTicks}
      label={label}
      tickLabelProps={{ fill: tokens.muted, fontSize: 10 }}
      stroke={tokens.muted}
      tickStroke={tokens.muted}
      hideAxisLine={true}
      hideTicks={true}
    />
  )
}

export function AxisLeft({ scale, top, left, tickFormat, numTicks, label, tokens }: AxisProps): JSX.Element {
  return (
    <VxAxisLeft
      scale={scale as Parameters<typeof VxAxisLeft>[0]['scale']}
      top={top}
      left={left}
      tickFormat={tickFormat as ((value: unknown, index: number) => string) | undefined}
      numTicks={numTicks}
      label={label}
      tickLabelProps={{ fill: tokens.muted, fontSize: 10 }}
      stroke={tokens.muted}
      tickStroke={tokens.muted}
      hideAxisLine={true}
      hideTicks={true}
    />
  )
}

export function AxisRight({ scale, top, left, tickFormat, numTicks, label, tokens }: AxisProps): JSX.Element {
  return (
    <VxAxisRight
      scale={scale as Parameters<typeof VxAxisRight>[0]['scale']}
      top={top}
      left={left}
      tickFormat={tickFormat as ((value: unknown, index: number) => string) | undefined}
      numTicks={numTicks}
      label={label}
      tickLabelProps={{ fill: tokens.muted, fontSize: 10 }}
      stroke={tokens.muted}
      tickStroke={tokens.muted}
    />
  )
}
