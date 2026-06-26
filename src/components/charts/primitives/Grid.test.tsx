import { it, expect, vi, describe } from 'vitest'
import { render } from '@testing-library/react'
import * as VxGrid from '@visx/grid'
import { GridRows, GridColumns } from './Grid'
import type { ChartTokens } from './useChartTokens'
import { scaleLinear } from '@visx/scale'

vi.mock('@visx/grid', () => ({
  GridRows: vi.fn(() => <g data-testid="grid-rows" />),
  GridColumns: vi.fn(() => <g data-testid="grid-cols" />),
}))

const tokens: ChartTokens = {
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

const scale = scaleLinear<number>({ domain: [0, 100], range: [200, 0] })

describe('GridRows', () => {
  it('renders without throwing', () => {
    expect(() =>
      render(<svg><GridRows scale={scale} width={400} height={200} tokens={tokens} /></svg>)
    ).not.toThrow()
  })

  it('forwards tokens.border as stroke color', () => {
    render(<svg><GridRows scale={scale} width={400} height={200} tokens={tokens} /></svg>)
    expect(vi.mocked(VxGrid.GridRows)).toHaveBeenCalledWith(
      expect.objectContaining({ stroke: tokens.border }),
      expect.anything(),
    )
  })
})

describe('GridColumns', () => {
  it('renders without throwing', () => {
    expect(() =>
      render(<svg><GridColumns scale={scale} width={400} height={200} tokens={tokens} /></svg>)
    ).not.toThrow()
  })
})
