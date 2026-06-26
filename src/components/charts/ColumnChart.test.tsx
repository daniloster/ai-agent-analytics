import { it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { ColumnChart } from './ColumnChart'

vi.mock('@visx/responsive/lib/components/ParentSize', () => ({
  default: ({ children, className, style }: {
    children: (args: { width: number; height: number }) => React.ReactNode
    className?: string
    style?: React.CSSProperties
  }) => (
    <div className={className} style={style}>
      {children({ width: 400, height: 300 })}
    </div>
  ),
}))

vi.mock('@visx/axis', () => ({
  AxisBottom: vi.fn(() => null),
  AxisLeft: vi.fn(() => null),
  AxisRight: vi.fn(() => null),
}))

vi.mock('@visx/grid', () => ({
  GridRows: vi.fn(() => null),
  GridColumns: vi.fn(() => null),
}))

const BARS = [
  { label: 'A', value: 10 },
  { label: 'B', value: 20 },
]

it('renders an SVG with rect elements when given non-empty bars', () => {
  const { container } = render(<ColumnChart bars={BARS} />)
  expect(container.querySelector('svg')).not.toBeNull()
  const rects = container.querySelectorAll('rect')
  expect(rects.length).toBeGreaterThanOrEqual(2)
})

it('annotation prop renders a line element', () => {
  const { container } = render(
    <ColumnChart bars={BARS} annotation={{ value: 15, label: 'lower is better' }} />,
  )
  expect(container.querySelector('line')).not.toBeNull()
})

it('no annotation prop renders no line element', () => {
  const { container } = render(<ColumnChart bars={BARS} />)
  expect(container.querySelector('line')).toBeNull()
})

it('empty bars array does not throw', () => {
  expect(() => render(<ColumnChart bars={[]} />)).not.toThrow()
})

it('ariaLabel appears on the figure element', () => {
  const { container } = render(<ColumnChart bars={BARS} ariaLabel="Cost per team" />)
  const figure = container.querySelector('figure')
  expect(figure?.getAttribute('aria-label')).toBe('Cost per team')
})
