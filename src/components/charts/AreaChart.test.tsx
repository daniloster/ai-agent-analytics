import { it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { AreaChart } from './AreaChart'

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

const SERIES_ONE = [
  { id: 'cost', label: 'Cost', data: [{ date: '2026-06-01', value: 100 }, { date: '2026-06-02', value: 200 }] },
]

const SERIES_TWO = [
  { id: 'input', label: 'Input', data: [{ date: '2026-06-01', value: 100 }, { date: '2026-06-02', value: 150 }] },
  { id: 'output', label: 'Output', data: [{ date: '2026-06-01', value: 50 }, { date: '2026-06-02', value: 80 }] },
]

it('single-series renders SVG with a path element', () => {
  const { container } = render(<AreaChart series={SERIES_ONE} />)
  expect(container.querySelector('svg')).not.toBeNull()
  expect(container.querySelector('path')).not.toBeNull()
})

it('two-series renders two path elements', () => {
  const { container } = render(<AreaChart series={SERIES_TWO} />)
  const paths = container.querySelectorAll('path')
  expect(paths.length).toBeGreaterThanOrEqual(2)
})

it('referenceLine prop renders a line element', () => {
  const { container } = render(
    <AreaChart series={SERIES_ONE} referenceLine={{ value: 150, label: 'Budget' }} />,
  )
  expect(container.querySelector('line')).not.toBeNull()
})

it('no referenceLine renders no line element', () => {
  const { container } = render(<AreaChart series={SERIES_ONE} />)
  expect(container.querySelector('line')).toBeNull()
})

it('empty series array does not throw', () => {
  expect(() => render(<AreaChart series={[]} />)).not.toThrow()
})

it('series with dashed:true produces a path with stroke-dasharray="4 2"', () => {
  const dashedSeries = [
    { id: 'actual', label: 'Actual', data: [{ date: '2026-06-01', value: 100 }] },
    { id: 'projected', label: 'Projected', data: [{ date: '2026-06-02', value: 200 }], dashed: true },
  ]
  const { container } = render(<AreaChart series={dashedSeries} />)
  const paths = container.querySelectorAll('path')
  const dashedPath = Array.from(paths).find(
    (p) => p.getAttribute('stroke-dasharray') === '4 2',
  )
  expect(dashedPath).not.toBeUndefined()
})

it('series without dashed prop produces a path with no stroke-dasharray', () => {
  const { container } = render(<AreaChart series={SERIES_ONE} />)
  const paths = container.querySelectorAll('path')
  const hasDash = Array.from(paths).some((p) => p.getAttribute('stroke-dasharray') !== null)
  expect(hasDash).toBe(false)
})
