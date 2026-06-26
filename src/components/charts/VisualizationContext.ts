import { createContext, useContext } from 'react'
import type { ReadonlySignal, Signal } from '@preact/signals-react'
import type { ActivePoint, AnyD3Scale } from '../../types/charts'
import type { ChartTokens } from './primitives/useChartTokens'

export interface VisualizationContextValue {
  dataSignal: ReadonlySignal<Record<string, unknown[]>>
  innerWidth: ReadonlySignal<number>
  innerHeight: ReadonlySignal<number>
  tokens: ChartTokens
  scales: ReadonlySignal<Record<string, AnyD3Scale>>
  baseScale: ReadonlySignal<AnyD3Scale | null>
  // accessor from the base (position:'bottom') AxisConfig so marks can compute x pixel positions
  baseAxisAccessor: ReadonlySignal<((d: Record<string, unknown>) => unknown) | null>
  activePoint: Signal<ActivePoint | null>
  mousePosition: Signal<{ x: number; y: number } | null>
}

export const VisualizationContext = createContext<VisualizationContextValue | null>(null)

export function useVisualizationContext(): VisualizationContextValue {
  const ctx = useContext(VisualizationContext)
  if (ctx === null) {
    throw new Error('useVisualizationContext must be called inside a <Visualization> component')
  }
  return ctx
}
