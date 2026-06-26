import { it, expect, vi, describe } from 'vitest'
import { render } from '@testing-library/react'
import * as VxAxis from '@visx/axis'
import { AxisBottom, AxisLeft, AxisRight } from './Axis'
import type { ChartTokens } from './useChartTokens'
import { scaleLinear } from '@visx/scale'

vi.mock('@visx/axis', () => ({
  AxisBottom: vi.fn(() => <g data-testid="axis-bottom" />),
  AxisLeft: vi.fn(() => <g data-testid="axis-left" />),
  AxisRight: vi.fn(() => <g data-testid="axis-right" />),
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

describe('AxisBottom', () => {
  it('renders without throwing', () => {
    expect(() =>
      render(<svg><AxisBottom scale={scale} tokens={tokens} /></svg>)
    ).not.toThrow()
  })

  it('forwards tokens.muted as tick fill color', () => {
    render(<svg><AxisBottom scale={scale} tokens={tokens} /></svg>)
    expect(vi.mocked(VxAxis.AxisBottom)).toHaveBeenCalledWith(
      expect.objectContaining({
        tickLabelProps: expect.objectContaining({ fill: tokens.muted }),
        stroke: tokens.muted,
        tickStroke: tokens.muted,
      }),
      expect.anything(),
    )
  })
})

describe('AxisLeft', () => {
  it('renders without throwing', () => {
    expect(() =>
      render(<svg><AxisLeft scale={scale} tokens={tokens} /></svg>)
    ).not.toThrow()
  })
})

describe('AxisRight', () => {
  it('renders without throwing', () => {
    expect(() =>
      render(<svg><AxisRight scale={scale} tokens={tokens} /></svg>)
    ).not.toThrow()
  })
})
