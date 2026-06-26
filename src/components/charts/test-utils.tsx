import React from 'react'
import { render } from '@testing-library/react'
import { signal } from '@preact/signals-react'
import { VisualizationContext } from './VisualizationContext'
import type { VisualizationContextValue } from './VisualizationContext'

const DEFAULT_TOKENS = {
  primary: '#2563eb',
  primaryFaded: 'rgba(37, 99, 235, 0.15)',
  secondary: '#0d9488',
  muted: 'hsl(var(--muted-foreground))',
  border: 'hsl(var(--border))',
  background: 'hsl(var(--background))',
  destructive: 'hsl(var(--destructive))',
  success: '#22c55e',
  warning: '#d97706',
}

export function buildMockContext(
  overrides?: Partial<VisualizationContextValue>,
): VisualizationContextValue {
  return {
    dataSignal: signal<Record<string, unknown[]>>({}),
    innerWidth: signal(400),
    innerHeight: signal(200),
    tokens: DEFAULT_TOKENS,
    scales: signal({}),
    baseScale: signal(null),
    baseAxisAccessor: signal(null),
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
