import React from 'react'
import { render } from '@testing-library/react'
import { signal } from '@preact/signals-react'
import { VisualizationContext } from './VisualizationContext'
import type { VisualizationContextValue } from './VisualizationContext'

const DEFAULT_TOKENS = {
  primary: 'hsl(var(--primary))',
  primaryFaded: 'hsl(var(--primary) / 0.2)',
  secondary: 'hsl(var(--secondary))',
  muted: 'hsl(var(--muted-foreground))',
  border: 'hsl(var(--border))',
  background: 'hsl(var(--background))',
  destructive: 'hsl(var(--destructive))',
  success: '#22c55e',
  warning: '#f59e0b',
}

export function buildMockContext(
  overrides?: Partial<VisualizationContextValue>,
): VisualizationContextValue {
  return {
    dataSignal: signal<Record<string, unknown[]>>({}),
    innerWidth: 400,
    innerHeight: 200,
    tokens: DEFAULT_TOKENS,
    scales: {},
    baseScale: null,
    baseAxisAccessor: null,
    activePoint: signal(null),
    mousePosition: signal(null),
    ...overrides,
  }
}

export function renderWithVisualizationContext(
  ui: React.ReactElement,
  contextValue?: Partial<VisualizationContextValue>,
): ReturnType<typeof render> {
  const value = buildMockContext(contextValue)
  return render(
    <VisualizationContext.Provider value={value}>
      {ui}
    </VisualizationContext.Provider>,
  )
}
