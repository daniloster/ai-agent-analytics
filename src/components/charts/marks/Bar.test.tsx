import { it, expect, describe } from 'vitest'
import { fireEvent } from '@testing-library/react'
import { signal } from '@preact/signals-react'
import { scaleBand, scaleLinear } from '@visx/scale'
import { Bar } from './Bar'
import { renderWithVisualizationContext } from '../test-utils'
import type { AnyD3Scale } from '../../../types/charts'
import type { ActivePoint } from '../../../types/charts'

const categories = ['a', 'b', 'c', 'd']

const xScale = scaleBand<string>({
  domain: categories,
  range: [0, 400],
  padding: 0,
}) as unknown as AnyD3Scale

const yScale = scaleLinear<number>({
  domain: [0, 100],
  range: [200, 0],
}) as unknown as AnyD3Scale

const mockData = [
  { cat: 'a', runs: 10 },
  { cat: 'b', runs: 50 },
  { cat: 'c', runs: 30 },
  { cat: 'd', runs: 90 },
]

function renderBar(
  props?: Partial<Parameters<typeof Bar>[0]>,
  extraCtx?: Record<string, unknown>,
) {
  const data = signal({ runs: mockData })
  return renderWithVisualizationContext(<Bar series="runs" axis="y" {...props} />, {
    dataSignal: data,
    innerWidth: 400,
    innerHeight: 200,
    scales: { x: xScale, y: yScale },
    baseAxisAccessor: (d: Record<string, unknown>) => d.cat,
    ...extraCtx,
  })
}

describe('Bar mark', () => {
  it('renders one rect per data point in simple mode', () => {
    const { container } = renderBar()
    const rects = container.querySelectorAll('rect')
    expect(rects).toHaveLength(4)
  })

  it('sortBy="desc" puts highest-value datum leftmost (smallest x)', () => {
    const { container } = renderBar({ sortBy: 'desc' })
    const rects = Array.from(container.querySelectorAll('rect'))
    const xValues = rects.map((r) => Number(r.getAttribute('x')))
    // rects should be in ascending x order; the first rect belongs to runs=90 (highest)
    const heights = rects.map((r) => Number(r.getAttribute('height')))
    // heights in a descending-sorted bar chart go from largest to smallest (left to right)
    for (let i = 0; i < heights.length - 1; i++) {
      expect(heights[i]).toBeGreaterThanOrEqual(heights[i + 1])
    }
    // leftmost rect (x=0 or smallest x) has largest height
    const leftmostIdx = xValues.indexOf(Math.min(...xValues))
    expect(heights[leftmostIdx]).toBe(Math.max(...heights))
  })

  it('all rects have tabIndex=0 and role="listitem"', () => {
    const { container } = renderBar()
    const rects = container.querySelectorAll('rect')
    rects.forEach((r) => {
      expect(r.getAttribute('tabindex')).toBe('0')
      expect(r.getAttribute('role')).toBe('listitem')
    })
  })

  it('pointerenter on a rect sets activePoint.value with correct datum', () => {
    const ap = signal<ActivePoint | null>(null)
    const { container } = renderBar({}, { activePoint: ap })
    const rects = container.querySelectorAll('rect')
    fireEvent.pointerEnter(rects[0])
    expect(ap.value?.series).toBe('runs')
    expect(ap.value?.datum).toEqual(mockData[0])
  })

  it('innerWidth === 0 renders nothing', () => {
    const { container } = renderBar({}, { innerWidth: 0 })
    expect(container.querySelector('rect')).toBeNull()
  })

  it('stacked mode renders without throwing', () => {
    expect(() => renderBar({ stacked: true })).not.toThrow()
  })
})
