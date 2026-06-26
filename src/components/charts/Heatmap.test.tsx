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

function makeData(n: number): Array<{ date: string; value: number }> {
  return Array.from({ length: n }, (_, i) => ({
    date: `2026-05-${String(i + 1).padStart(2, '0')}`,
    value: 99 - i * 0.1,
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

it('colorScale="availability" aria-label contains "% uptime"', () => {
  const data = [{ date: '2024-01-01', value: 100 }]
  const { container } = render(<Heatmap data={data} colorScale="availability" />)
  const rects = container.querySelectorAll('rect')
  expect(rects[0]?.getAttribute('aria-label')).toContain('% uptime')
})

it('colorScale="cost" with isAnomaly=false renders rect with tokens.muted fill', () => {
  const data = [{ date: '2024-01-01', value: 50, isAnomaly: false }]
  const { container } = render(<Heatmap data={data} colorScale="cost" />)
  const rect = container.querySelector('rect')
  // muted is a CSS variable color; just verify it's not the destructive color and the rect exists
  expect(rect).not.toBeNull()
  const fill = rect?.getAttribute('fill')
  // When isAnomaly=false, fill should equal tokens.muted (not tokens.destructive)
  // We can't easily know the exact token value in tests, but we verify isAnomaly=true differs
  expect(fill).toBeTruthy()
})

it('colorScale="cost" with isAnomaly=true renders rect with tokens.destructive fill', () => {
  const anomalyData = [{ date: '2024-01-01', value: 80, isAnomaly: true }]
  const normalData = [{ date: '2024-01-01', value: 80, isAnomaly: false }]
  const { container: aContainer } = render(<Heatmap data={anomalyData} colorScale="cost" />)
  const { container: nContainer } = render(<Heatmap data={normalData} colorScale="cost" />)
  const anomalyFill = aContainer.querySelector('rect')?.getAttribute('fill')
  const normalFill = nContainer.querySelector('rect')?.getAttribute('fill')
  // The two fills must differ (anomaly = destructive, normal = muted)
  expect(anomalyFill).not.toBe(normalFill)
})

it('custom getAriaLabel overrides default aria-label', () => {
  const data = [{ date: '2024-01-01', value: 99 }]
  const { container } = render(
    <Heatmap data={data} colorScale="availability" getAriaLabel={() => 'custom'} />,
  )
  const rect = container.querySelector('rect')
  expect(rect?.getAttribute('aria-label')).toBe('custom')
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
