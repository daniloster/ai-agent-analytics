import { it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChartSVG } from './ChartSVG'
import type { ReadonlySignal } from '@preact/signals-react'

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

it('children render-prop is called with width and height signals', () => {
  let capturedWidth: ReadonlySignal<number> | undefined
  let capturedHeight: ReadonlySignal<number> | undefined
  render(
    <ChartSVG>
      {(w, h) => {
        capturedWidth = w
        capturedHeight = h
        return <div />
      }}
    </ChartSVG>,
  )
  expect(capturedWidth?.value).toBe(400)
  expect(capturedHeight?.value).toBe(300)
})

it('height prop overrides measured height in the height signal', () => {
  let capturedHeight: ReadonlySignal<number> | undefined
  render(
    <ChartSVG height={80}>
      {(_, h) => {
        capturedHeight = h
        return <div />
      }}
    </ChartSVG>,
  )
  expect(capturedHeight?.value).toBe(80)
})

it('className prop is merged onto the wrapper', () => {
  render(<ChartSVG className="my-class">{() => <div />}</ChartSVG>)
  const wrapper = screen.getByTestId('parent-size')
  expect(wrapper.className).toContain('my-class')
  expect(wrapper.className).toContain('min-h-[200px]')
})
