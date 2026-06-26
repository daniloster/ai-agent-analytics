import { it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChartSVG } from './ChartSVG'

// Mock ParentSize to synchronously call children with controlled dimensions
vi.mock('@visx/responsive/lib/components/ParentSize', () => ({
  default: ({ children, className, style }: {
    children: (args: { width: number; height: number }) => React.ReactNode
    className?: string
    style?: React.CSSProperties
  }) => (
    <div className={className} style={style} data-testid="parent-size">
      {children({ width: 400, height: 300 })}
    </div>
  ),
}))

beforeEach(() => {
  vi.restoreAllMocks()
})

it('outer div has class min-h-[200px]', () => {
  render(<ChartSVG>{() => <div data-testid="child" />}</ChartSVG>)
  const wrapper = screen.getByTestId('parent-size')
  expect(wrapper.className).toContain('min-h-[200px]')
})

it('children render-prop is called with dimensions', () => {
  const spy = vi.fn(() => <div />)
  render(<ChartSVG>{spy}</ChartSVG>)
  expect(spy).toHaveBeenCalledWith(400, 300)
})

it('height prop overrides measured height in render-prop', () => {
  const spy = vi.fn(() => <div />)
  render(<ChartSVG height={80}>{spy}</ChartSVG>)
  // Second argument should be the fixed height, not measured 300
  expect(spy).toHaveBeenCalledWith(400, 80)
})

it('className prop is merged onto the wrapper', () => {
  render(<ChartSVG className="my-class">{() => <div />}</ChartSVG>)
  const wrapper = screen.getByTestId('parent-size')
  expect(wrapper.className).toContain('my-class')
  expect(wrapper.className).toContain('min-h-[200px]')
})
