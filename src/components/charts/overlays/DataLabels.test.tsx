import { describe, it, expect } from 'vitest'
import { signal } from '@preact/signals-react'
import { scaleLinear, scaleBand } from '@visx/scale'
import { DataLabels } from './DataLabels'
import { renderWithVisualizationContext } from '../test-utils'
import type { AnyD3Scale } from '../../../types/charts'

const yScale = scaleLinear<number>({ domain: [0, 5], range: [200, 0] }) as unknown as AnyD3Scale
const xScale = scaleLinear<number>({ domain: [0, 4], range: [0, 400] }) as unknown as AnyD3Scale

const mockData = [
  { date: 0, quality: 3.7 },
  { date: 1, quality: 4.0 },
  { date: 2, quality: null },
  { date: 3, quality: 4.1 },
]

describe('DataLabels overlay', () => {
  it('renders one text per non-null data point', () => {
    const data = signal({ quality: mockData })
    const { container } = renderWithVisualizationContext(
      <DataLabels series="quality" axis="y" />,
      {
        dataSignal: data,
        innerWidth: signal(400),
        innerHeight: signal(200),
        scales: signal({ y: yScale }),
        baseScale: signal(xScale),
        baseAxisAccessor: signal((d: Record<string, unknown>) => d.date),
      },
    )
    const texts = container.querySelectorAll('text')
    expect(texts).toHaveLength(3)
  })

  it('skips null values', () => {
    const data = signal({ quality: [{ date: 0, quality: null }] })
    const { container } = renderWithVisualizationContext(
      <DataLabels series="quality" axis="y" />,
      {
        dataSignal: data,
        innerWidth: signal(400),
        innerHeight: signal(200),
        scales: signal({ y: yScale }),
        baseScale: signal(xScale),
        baseAxisAccessor: signal((d: Record<string, unknown>) => d.date),
      },
    )
    expect(container.querySelectorAll('text')).toHaveLength(0)
  })

  it('applies custom format function', () => {
    const data = signal({ quality: [{ date: 0, quality: 4.123 }] })
    const { container } = renderWithVisualizationContext(
      <DataLabels series="quality" axis="y" format={(v) => v.toFixed(1)} />,
      {
        dataSignal: data,
        innerWidth: signal(400),
        innerHeight: signal(200),
        scales: signal({ y: yScale }),
        baseScale: signal(xScale),
        baseAxisAccessor: signal((d: Record<string, unknown>) => d.date),
      },
    )
    const text = container.querySelector('text')
    expect(text?.textContent).toBe('4.1')
  })

  it('centered=true offsets x by bandwidth/2 for band scale', () => {
    const bandScale = scaleBand<string>({
      domain: ['Jan', 'Feb'],
      range: [0, 200],
      padding: 0,
    }) as unknown as AnyD3Scale

    const pts = [
      { label: 'Jan', quality: 3.7 },
      { label: 'Feb', quality: 4.0 },
    ]
    const data = signal({ quality: pts })

    const { container: noCenter } = renderWithVisualizationContext(
      <DataLabels series="quality" axis="y" centered={false} />,
      {
        dataSignal: data,
        innerWidth: signal(200),
        innerHeight: signal(200),
        scales: signal({ y: yScale }),
        baseScale: signal(bandScale),
        baseAxisAccessor: signal((d: Record<string, unknown>) => d.label),
      },
    )
    const { container: withCenter } = renderWithVisualizationContext(
      <DataLabels series="quality" axis="y" centered />,
      {
        dataSignal: data,
        innerWidth: signal(200),
        innerHeight: signal(200),
        scales: signal({ y: yScale }),
        baseScale: signal(bandScale),
        baseAxisAccessor: signal((d: Record<string, unknown>) => d.label),
      },
    )

    const bw = (bandScale as unknown as { bandwidth: () => number }).bandwidth()
    const xsNoCenter = Array.from(noCenter.querySelectorAll('text')).map(t =>
      parseFloat(t.getAttribute('x') ?? '0'),
    )
    const xsWithCenter = Array.from(withCenter.querySelectorAll('text')).map(t =>
      parseFloat(t.getAttribute('x') ?? '0'),
    )

    xsNoCenter.forEach((x, i) => {
      expect(xsWithCenter[i]).toBeCloseTo(x + bw / 2, 2)
    })
  })

  it('returns null when no base scale', () => {
    const data = signal({ quality: mockData })
    const { container } = renderWithVisualizationContext(
      <DataLabels series="quality" axis="y" />,
      {
        dataSignal: data,
        innerWidth: signal(400),
        innerHeight: signal(200),
        scales: signal({ y: yScale }),
        baseScale: signal(null),
        baseAxisAccessor: signal(null),
      },
    )
    expect(container.querySelectorAll('text')).toHaveLength(0)
  })
})
