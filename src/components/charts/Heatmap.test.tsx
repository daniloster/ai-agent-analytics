import { it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { Heatmap } from './Heatmap'

vi.mock('@visx/responsive/lib/components/ParentSize', () => ({
  default: ({ children, className, style }: {
    children: (args: { width: number; height: number }) => React.ReactNode
    className?: string
    style?: React.CSSProperties
  }) => (
    <div className={className} style={style}>
      {children({ width: 400, height: 120 })}
    </div>
  ),
}))

function makeData(n: number): Array<{ date: string; uptime_pct: number }> {
  return Array.from({ length: n }, (_, i) => ({
    date: `2026-05-${String(i + 1).padStart(2, '0')}`,
    uptime_pct: 99 - i * 0.1,
  }))
}

it('empty data renders figure without throwing', () => {
  expect(() => render(<Heatmap data={[]} colorScale="availability" />)).not.toThrow()
  const { container } = render(<Heatmap data={[]} colorScale="availability" />)
  expect(container.querySelector('figure')).not.toBeNull()
})

it('30-entry data renders 30 rect elements', () => {
  const { container } = render(<Heatmap data={makeData(30)} colorScale="availability" />)
  const rects = container.querySelectorAll('rect')
  expect(rects).toHaveLength(30)
})

it('each rect has the correct aria-label format for availability', () => {
  const data = makeData(3)
  const { container } = render(<Heatmap data={data} colorScale="availability" />)
  const rects = container.querySelectorAll('rect')
  expect(rects[0]?.getAttribute('aria-label')).toBe(`${data[0].date}: ${data[0].uptime_pct}% uptime`)
  expect(rects[1]?.getAttribute('aria-label')).toBe(`${data[1].date}: ${data[1].uptime_pct}% uptime`)
})

it('ariaLabel prop is forwarded to the figure element', () => {
  const { container } = render(
    <Heatmap data={makeData(7)} colorScale="availability" ariaLabel="My custom label" />,
  )
  const figure = container.querySelector('figure')
  expect(figure?.getAttribute('aria-label')).toBe('My custom label')
})

it('figure has default aria-label when prop is omitted', () => {
  const { container } = render(<Heatmap data={[]} colorScale="availability" />)
  const figure = container.querySelector('figure')
  expect(figure?.getAttribute('aria-label')).toBe('Availability heatmap')
})
