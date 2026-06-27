import { it, expect } from 'vitest'
import { signal } from '@preact/signals-react'
import { scaleBand, scaleLinear } from '@visx/scale'
import { ColumnChart, ColumnTrendLine } from './ColumnChart'
import { buildMockContext, renderWithVisualizationContext } from './test-utils'
import type { AnyD3Scale } from '../../types/charts'

const DATA = [
  { label: 'A', value: 10, bars: 10 },
  { label: 'B', value: 20, bars: 20 },
]

const BASE_CTX = buildMockContext({
  dataSignal: signal<Record<string, unknown[]>>({ bars: DATA }),
  innerWidth: signal(400),
  innerHeight: signal(200),
  scales: signal<Record<string, AnyD3Scale>>({
    x: scaleBand({ domain: ['A', 'B'], range: [0, 400], padding: 0.1 }) as unknown as AnyD3Scale,
    y: scaleLinear({ domain: [0, 30], range: [200, 0] }) as unknown as AnyD3Scale,
  }),
  baseAxisAccessor: signal((d: Record<string, unknown>) => d['label'] as string),
  baseScale: signal(null),
})

it('renders rect elements for each data point', () => {
  const { container } = renderWithVisualizationContext(
    <ColumnChart series="bars" axis="y" />,
    BASE_CTX,
  )
  const rects = container.querySelectorAll('rect')
  expect(rects.length).toBeGreaterThanOrEqual(DATA.length)
})

it('bar rects have finite non-negative heights', () => {
  const { container } = renderWithVisualizationContext(
    <ColumnChart series="bars" axis="y" />,
    BASE_CTX,
  )
  container.querySelectorAll('rect').forEach((rect) => {
    const h = parseFloat(rect.getAttribute('height') ?? 'NaN')
    expect(isFinite(h)).toBe(true)
    expect(h).toBeGreaterThanOrEqual(0)
  })
})

it('returns null when innerWidth is 0', () => {
  const { container } = renderWithVisualizationContext(
    <ColumnChart series="bars" axis="y" />,
    { ...BASE_CTX, innerWidth: signal(0) },
  )
  expect(container.querySelectorAll('rect').length).toBe(0)
})

it('empty series data does not throw', () => {
  const ctx = { ...BASE_CTX, dataSignal: signal<Record<string, unknown[]>>({ bars: [] }) }
  expect(() =>
    renderWithVisualizationContext(<ColumnChart series="bars" axis="y" />, ctx),
  ).not.toThrow()
})

it('ColumnTrendLine renders a path element', () => {
  const { container } = renderWithVisualizationContext(
    <ColumnTrendLine series="bars" axis="y" />,
    BASE_CTX,
  )
  expect(container.querySelector('path')).not.toBeNull()
})

it('ColumnTrendLine path has a non-empty d attribute', () => {
  const { container } = renderWithVisualizationContext(
    <ColumnTrendLine series="bars" axis="y" />,
    BASE_CTX,
  )
  const path = container.querySelector('path')
  expect(path?.getAttribute('d')).toBeTruthy()
})

it('ColumnTrendLine returns null for empty data', () => {
  const ctx = { ...BASE_CTX, dataSignal: signal<Record<string, unknown[]>>({ bars: [] }) }
  const { container } = renderWithVisualizationContext(
    <ColumnTrendLine series="bars" axis="y" />,
    ctx,
  )
  expect(container.querySelector('path')).toBeNull()
})
