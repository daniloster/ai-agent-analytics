import { it, expect, describe } from 'vitest'
import { signal } from '@preact/signals-react'
import { scaleLinear } from '@visx/scale'
import { Line } from './Line'
import { renderWithVisualizationContext } from '../test-utils'
import type { AnyD3Scale } from '../../../types/charts'

const yScale = scaleLinear<number>({ domain: [0, 100], range: [200, 0] }) as unknown as AnyD3Scale
const xScale = scaleLinear<number>({ domain: [0, 4], range: [0, 400] }) as unknown as AnyD3Scale

const mockData = [
  { date: 0, v: 10 },
  { date: 1, v: 50 },
  { date: 2, v: 90 },
]

function renderLine(props?: Partial<Parameters<typeof Line>[0]>, extraCtx?: Record<string, unknown>) {
  const data = signal(mockData)
  return renderWithVisualizationContext(
    <Line series="v" axis="y" {...props} />,
    {
      dataSignal: data,
      innerWidth: 400,
      innerHeight: 200,
      scales: { y: yScale },
      baseScale: xScale,
      baseAxisAccessor: (d: Record<string, unknown>) => d.date,
      ...extraCtx,
    },
  )
}

describe('Line mark', () => {
  it('renders a <path> element when innerWidth > 0 and data is non-empty', () => {
    const { container } = renderLine()
    expect(container.querySelector('path')).not.toBeNull()
  })

  it('returns nothing (no path) when innerWidth === 0', () => {
    const { container } = renderLine({}, { innerWidth: 0 })
    expect(container.querySelector('path')).toBeNull()
  })

  it('color="red" produces a path with stroke="red"', () => {
    const { container } = renderLine({ color: 'red' })
    const path = container.querySelector('path')
    expect(path?.getAttribute('stroke')).toBe('red')
  })

  it('no color prop defaults stroke to tokens.primary', () => {
    const { container } = renderLine()
    const path = container.querySelector('path')
    expect(path?.getAttribute('stroke')).toBe('hsl(var(--primary))')
  })
})
