import { it, expect } from 'vitest'
import { signal } from '@preact/signals-react'
import { scaleLinear, scaleTime } from '@visx/scale'
import { SparklineChart } from './SparklineChart'
import { buildMockContext, renderWithVisualizationContext } from './test-utils'
import type { AnyD3Scale } from '../../types/charts'

const DATA = [
  { date: '2026-06-01', value: 10, trend: 10 },
  { date: '2026-06-02', value: 20, trend: 20 },
]

const BASE_CTX = buildMockContext({
  dataSignal: signal<Record<string, unknown[]>>({ trend: DATA }),
  innerWidth: signal(400),
  innerHeight: signal(40),
  scales: signal<Record<string, AnyD3Scale>>({
    y: scaleLinear({ domain: [0, 30], range: [40, 0] }) as unknown as AnyD3Scale,
  }),
  baseScale: signal(
    scaleTime({ domain: [new Date('2026-06-01'), new Date('2026-06-02')], range: [0, 400] }) as unknown as AnyD3Scale,
  ),
  baseAxisAccessor: signal((d: Record<string, unknown>) => new Date((d['date'] as string) + 'T00:00:00')),
})

it('renders path elements for trend data', () => {
  const { container } = renderWithVisualizationContext(
    <SparklineChart series="trend" axis="y" />,
    BASE_CTX,
  )
  expect(container.querySelectorAll('path').length).toBeGreaterThan(0)
})

it('returns null when innerWidth is 0', () => {
  const { container } = renderWithVisualizationContext(
    <SparklineChart series="trend" axis="y" />,
    { ...BASE_CTX, innerWidth: signal(0) },
  )
  expect(container.querySelectorAll('path').length).toBe(0)
})

it('default fillOpacity is 0.15', () => {
  const { container } = renderWithVisualizationContext(
    <SparklineChart series="trend" axis="y" />,
    BASE_CTX,
  )
  const fromStop = Array.from(container.querySelectorAll('stop')).find(
    (s) => s.getAttribute('offset') === '0%',
  )
  expect(Number(fromStop?.getAttribute('stop-opacity'))).toBeCloseTo(0.15)
})

it('custom fillOpacity is forwarded', () => {
  const { container } = renderWithVisualizationContext(
    <SparklineChart series="trend" axis="y" fillOpacity={0.4} />,
    BASE_CTX,
  )
  const fromStop = Array.from(container.querySelectorAll('stop')).find(
    (s) => s.getAttribute('offset') === '0%',
  )
  expect(Number(fromStop?.getAttribute('stop-opacity'))).toBeCloseTo(0.4)
})

it('empty data does not throw', () => {
  const ctx = { ...BASE_CTX, dataSignal: signal<Record<string, unknown[]>>({ trend: [] }) }
  expect(() =>
    renderWithVisualizationContext(<SparklineChart series="trend" axis="y" />, ctx),
  ).not.toThrow()
})

it('paths have non-empty d attributes with no NaN', () => {
  const { container } = renderWithVisualizationContext(
    <SparklineChart series="trend" axis="y" />,
    BASE_CTX,
  )
  container.querySelectorAll('path').forEach((p) => {
    const d = p.getAttribute('d') ?? ''
    expect(d.length).toBeGreaterThan(0)
    expect(d).not.toContain('NaN')
  })
})
