import { it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { Sparkline } from './Sparkline'

vi.mock('@visx/responsive/lib/components/ParentSize', () => ({
  default: ({ children, className, style }: {
    children: (args: { width: number; height: number }) => React.ReactNode
    className?: string
    style?: React.CSSProperties
  }) => (
    <div className={className} style={style}>
      {children({ width: 400, height: 40 })}
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

const DATA = [
  { date: '2026-06-01', value: 10 },
  { date: '2026-06-02', value: 20 },
]

it('renders an SVG when given non-empty data', () => {
  const { container } = render(<Sparkline data={DATA} />)
  expect(container.querySelector('svg')).not.toBeNull()
})

it('SVG contains at least one path element', () => {
  const { container } = render(<Sparkline data={DATA} />)
  const paths = container.querySelectorAll('path')
  expect(paths.length).toBeGreaterThan(0)
})

it('renders no text elements (no axis labels)', () => {
  const { container } = render(<Sparkline data={DATA} />)
  const texts = container.querySelectorAll('text')
  expect(texts.length).toBe(0)
})

it('empty data array does not throw', () => {
  expect(() => render(<Sparkline data={[]} />)).not.toThrow()
})

it('custom height prop is forwarded to the SVG container', () => {
  const { container } = render(<Sparkline data={DATA} height={60} />)
  const wrapper = container.firstElementChild as HTMLElement
  expect(wrapper.style.height).toBe('60px')
})
