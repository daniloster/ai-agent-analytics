import { it, expect, describe } from 'vitest'
import { renderHook } from '@testing-library/react'
import React from 'react'
import { VisualizationContext, useVisualizationContext } from './VisualizationContext'
import { buildMockContext, renderWithVisualizationContext } from './test-utils'

describe('useVisualizationContext outside provider', () => {
  it('throws with descriptive error message', () => {
    expect(() =>
      renderHook(() => useVisualizationContext())
    ).toThrow('useVisualizationContext must be called inside a <Visualization> component')
  })
})

describe('useVisualizationContext inside provider', () => {
  it('returns the provided context value', () => {
    const mockValue = buildMockContext({ innerWidth: 800 })
    const wrapper = ({ children }: { children: React.ReactNode }) =>
      React.createElement(VisualizationContext.Provider, { value: mockValue }, children)

    const { result } = renderHook(() => useVisualizationContext(), { wrapper })
    expect(result.current.innerWidth).toBe(800)
    expect(result.current.tokens.success).toBe('#22c55e')
  })
})

describe('renderWithVisualizationContext from test-utils', () => {
  it('renders a component that uses useVisualizationContext without throwing', () => {
    function Consumer() {
      const ctx = useVisualizationContext()
      return React.createElement('div', { 'data-testid': 'width' }, String(ctx.innerWidth))
    }

    expect(() =>
      renderWithVisualizationContext(React.createElement(Consumer))
    ).not.toThrow()
  })

  it('activePoint and mousePosition are writable signals', () => {
    const ctx = buildMockContext()
    expect(typeof ctx.activePoint).toBe('object')
    ctx.activePoint.value = {
      series: 'v',
      axis: 'y',
      datum: { v: 1 },
      x: 10,
      y: 20,
    }
    expect(ctx.activePoint.value?.series).toBe('v')

    ctx.mousePosition.value = { x: 5, y: 5 }
    expect(ctx.mousePosition.value).toEqual({ x: 5, y: 5 })
  })
})

it('VisualizationContextValue has all 8 required fields', () => {
  const ctx = buildMockContext()
  expect(ctx).toHaveProperty('dataSignal')
  expect(ctx).toHaveProperty('innerWidth')
  expect(ctx).toHaveProperty('innerHeight')
  expect(ctx).toHaveProperty('tokens')
  expect(ctx).toHaveProperty('scales')
  expect(ctx).toHaveProperty('baseScale')
  expect(ctx).toHaveProperty('activePoint')
  expect(ctx).toHaveProperty('mousePosition')
})
