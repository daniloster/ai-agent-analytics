import { it, expect, describe } from 'vitest'
import { signal } from '@preact/signals-react'
import { scaleLinear, scaleTime, scaleBand } from '@visx/scale'
import { SeriesTooltip } from './SeriesTooltip'
import { buildMockContext, renderWithVisualizationContext } from '../test-utils'
import type { AnyD3Scale, ActivePoint } from '../../../types/charts'

const DATE = '2026-06-01'
const INPUT_VAL = 120000
const OUTPUT_VAL = 350000

const DATA = {
  input: [{ date: DATE, value: INPUT_VAL, input: INPUT_VAL }],
  output: [{ date: DATE, value: OUTPUT_VAL, output: OUTPUT_VAL }],
}

const SERIES_CFG = [
  { id: 'input', label: 'Input Tokens', color: '#0d9488' },
  { id: 'output', label: 'Output Tokens', color: '#2563eb' },
]

function makeContext(withActivePoint: boolean) {
  const xScale = scaleTime({ domain: [new Date('2026-06-01'), new Date('2026-06-02')], range: [0, 400] })
  const yScale = scaleLinear({ domain: [0, 500000], range: [200, 0] })
  const activePoint = withActivePoint
    ? signal<ActivePoint | null>({
        series: '',
        axis: 'x',
        datum: { date: DATE, value: INPUT_VAL, input: INPUT_VAL } as Record<string, unknown>,
        x: xScale(new Date(DATE + 'T00:00:00')),
        y: yScale(INPUT_VAL),
      })
    : signal<ActivePoint | null>(null)

  return buildMockContext({
    dataSignal: signal<Record<string, unknown[]>>(DATA),
    innerWidth: signal(400),
    innerHeight: signal(200),
    scales: signal<Record<string, AnyD3Scale>>({
      y: yScale as unknown as AnyD3Scale,
    }),
    baseScale: signal(xScale as unknown as AnyD3Scale),
    baseAxisAccessor: signal((d: Record<string, unknown>) => new Date((d['date'] as string) + 'T00:00:00')),
    activePoint,
  })
}

it('renders nothing when activePoint is null', () => {
  const { container } = renderWithVisualizationContext(
    <SeriesTooltip series={SERIES_CFG} />,
    makeContext(false),
  )
  expect(container.querySelectorAll('text').length).toBe(0)
  expect(container.querySelectorAll('rect').length).toBe(0)
})

describe('with active point set', () => {
  it('renders tooltip text elements', () => {
    const { container } = renderWithVisualizationContext(
      <SeriesTooltip series={SERIES_CFG} />,
      makeContext(true),
    )
    expect(container.querySelectorAll('text').length).toBeGreaterThan(0)
  })

  it('renders a tooltip background rect', () => {
    const { container } = renderWithVisualizationContext(
      <SeriesTooltip series={SERIES_CFG} />,
      makeContext(true),
    )
    expect(container.querySelector('rect')).not.toBeNull()
  })

  it('renders a crosshair line', () => {
    const { container } = renderWithVisualizationContext(
      <SeriesTooltip series={SERIES_CFG} />,
      makeContext(true),
    )
    expect(container.querySelector('line')).not.toBeNull()
  })

  it('renders a circle per series with data at the active date', () => {
    const { container } = renderWithVisualizationContext(
      <SeriesTooltip series={SERIES_CFG} />,
      makeContext(true),
    )
    const circles = container.querySelectorAll('circle')
    expect(circles.length).toBeGreaterThanOrEqual(SERIES_CFG.length)
  })

  it('renders series label text', () => {
    const { container } = renderWithVisualizationContext(
      <SeriesTooltip series={SERIES_CFG} />,
      makeContext(true),
    )
    const texts = Array.from(container.querySelectorAll('text')).map((t) => t.textContent ?? '')
    expect(texts.some((t) => t.includes('Input Tokens'))).toBe(true)
    expect(texts.some((t) => t.includes('Output Tokens'))).toBe(true)
  })

  it('uses formatValue when provided', () => {
    const formatSpy = (v: number) => `FORMATTED:${v}`
    const { container } = renderWithVisualizationContext(
      <SeriesTooltip
        series={[{ id: 'input', label: 'Input', formatValue: formatSpy }]}
      />,
      makeContext(true),
    )
    const texts = Array.from(container.querySelectorAll('text')).map((t) => t.textContent ?? '')
    expect(texts.some((t) => t.startsWith('FORMATTED:'))).toBe(true)
  })
})

describe('matchKey prop', () => {
  it('matches series data by custom key and shows raw label in header for band scale', () => {
    const bandScale = scaleBand<string>({
      domain: ['Jan', 'Feb', 'Jun (Now)'],
      range: [0, 300],
      padding: 0,
    })
    const yScale = scaleLinear({ domain: [0, 5], range: [200, 0] })

    const MONTHLY_DATA = [
      { label: 'Jan', quality: 3.8, volume: 100 },
      { label: 'Feb', quality: 4.0, volume: 120 },
      { label: 'Jun (Now)', quality: 4.2, volume: 80 },
    ]

    const activePoint = signal<ActivePoint | null>({
      series: '',
      axis: 'x',
      datum: MONTHLY_DATA[2] as unknown as Record<string, unknown>,
      x: (bandScale('Jun (Now)') ?? 0) + bandScale.bandwidth() / 2,
      y: yScale(4.2),
    })

    const ctx = buildMockContext({
      dataSignal: signal<Record<string, unknown[]>>({
        quality: MONTHLY_DATA as unknown as Record<string, unknown>[],
        volume: MONTHLY_DATA as unknown as Record<string, unknown>[],
      }),
      innerWidth: signal(300),
      innerHeight: signal(200),
      scales: signal<Record<string, AnyD3Scale>>({
        quality_y: yScale as unknown as AnyD3Scale,
        volume_y: yScale as unknown as AnyD3Scale,
      }),
      baseScale: signal(bandScale as unknown as AnyD3Scale),
      baseAxisAccessor: signal((d: Record<string, unknown>) => d['label'] as string),
      activePoint,
    })

    const { container } = renderWithVisualizationContext(
      <SeriesTooltip
        matchKey="label"
        series={[
          { id: 'quality', label: 'Avg Quality Score', axis: 'quality_y' },
          { id: 'volume', label: 'Rating Volume', axis: 'volume_y' },
        ]}
      />,
      ctx,
    )

    const texts = Array.from(container.querySelectorAll('text')).map((t) => t.textContent ?? '')
    expect(texts.some((t) => t.includes('Jun (Now)'))).toBe(true)
    expect(texts.some((t) => t.includes('Avg Quality Score'))).toBe(true)
    expect(texts.some((t) => t.includes('Rating Volume'))).toBe(true)
  })
})
