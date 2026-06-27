import { it, expect, describe } from 'vitest'
import { signal } from '@preact/signals-react'
import { scaleLinear, scaleTime } from '@visx/scale'
import { AreaChart } from './AreaChart'
import { buildMockContext, renderWithVisualizationContext } from './test-utils'
import type { AnyD3Scale } from '../../types/charts'

const DATE = '2026-06-01'
const MOCK_DATA = [{ date: DATE, value: 100, cost: 100 }]

const BASE_CTX = buildMockContext({
  dataSignal: signal<Record<string, unknown[]>>({ cost: MOCK_DATA }),
  innerWidth: signal(400),
  innerHeight: signal(200),
  scales: signal<Record<string, AnyD3Scale>>({
    y: scaleLinear({ domain: [0, 500], range: [200, 0] }) as unknown as AnyD3Scale,
  }),
  baseScale: signal(
    scaleTime({ domain: [new Date('2026-06-01'), new Date('2026-06-02')], range: [0, 400] }) as unknown as AnyD3Scale,
  ),
  baseAxisAccessor: signal((d: Record<string, unknown>) => new Date((d['date'] as string) + 'T00:00:00')),
})

it('renders path elements for a valid series', () => {
  const { container } = renderWithVisualizationContext(<AreaChart series="cost" axis="y" />, BASE_CTX)
  expect(container.querySelectorAll('path').length).toBeGreaterThan(0)
})

it('returns null when innerWidth is 0', () => {
  const { container } = renderWithVisualizationContext(
    <AreaChart series="cost" axis="y" />,
    { ...BASE_CTX, innerWidth: signal(0) },
  )
  expect(container.querySelectorAll('path').length).toBe(0)
})

it('dashed prop adds stroke-dasharray="4 4" to the stroke path (strokeWidth=2 default)', () => {
  const { container } = renderWithVisualizationContext(
    <AreaChart series="cost" axis="y" dashed={true} />,
    BASE_CTX,
  )
  const paths = Array.from(container.querySelectorAll('path'))
  expect(paths.some((p) => p.getAttribute('stroke-dasharray') === '4 4')).toBe(true)
})

it('no dashed prop produces no stroke-dasharray on any path', () => {
  const { container } = renderWithVisualizationContext(
    <AreaChart series="cost" axis="y" />,
    BASE_CTX,
  )
  const paths = Array.from(container.querySelectorAll('path'))
  expect(paths.some((p) => p.getAttribute('stroke-dasharray') !== null)).toBe(false)
})

it('fillOpacity sets gradient from-stop stop-opacity', () => {
  const { container } = renderWithVisualizationContext(
    <AreaChart series="cost" axis="y" fillOpacity={0.05} />,
    BASE_CTX,
  )
  const fromStop = Array.from(container.querySelectorAll('stop')).find(
    (s) => s.getAttribute('offset') === '0%',
  )
  expect(Number(fromStop?.getAttribute('stop-opacity'))).toBeCloseTo(0.05)
})

it('default fillOpacity is 0.3', () => {
  const { container } = renderWithVisualizationContext(
    <AreaChart series="cost" axis="y" />,
    BASE_CTX,
  )
  const fromStop = Array.from(container.querySelectorAll('stop')).find(
    (s) => s.getAttribute('offset') === '0%',
  )
  expect(Number(fromStop?.getAttribute('stop-opacity'))).toBeCloseTo(0.3)
})

it('empty series data does not throw', () => {
  const ctx = { ...BASE_CTX, dataSignal: signal<Record<string, unknown[]>>({ cost: [] }) }
  expect(() => renderWithVisualizationContext(<AreaChart series="cost" axis="y" />, ctx)).not.toThrow()
})

it('missing series key renders without throwing', () => {
  expect(() =>
    renderWithVisualizationContext(<AreaChart series="nonexistent" axis="y" />, BASE_CTX),
  ).not.toThrow()
})

describe('rendered paths are valid SVG', () => {
  it('stroke paths have non-empty d attribute with no NaN', () => {
    const { container } = renderWithVisualizationContext(
      <AreaChart series="cost" axis="y" />,
      BASE_CTX,
    )
    const strokePaths = Array.from(container.querySelectorAll('path')).filter(
      (p) => p.getAttribute('stroke') !== null,
    )
    expect(strokePaths.length).toBeGreaterThan(0)
    strokePaths.forEach((p) => {
      const d = p.getAttribute('d') ?? ''
      expect(d.length).toBeGreaterThan(0)
      expect(d).not.toContain('NaN')
    })
  })
})
