import { it, expect, describe } from 'vitest'
import { fireEvent } from '@testing-library/react'
import { signal } from '@preact/signals-react'
import { scaleLinear, scaleBand } from '@visx/scale'
import { Area } from './Area'
import { renderWithVisualizationContext, buildMockContext } from '../test-utils'
import { VisualizationContext } from '../VisualizationContext'
import { render } from '@testing-library/react'
import type { AnyD3Scale } from '../../../types/charts'
import type { ActivePoint } from '../../../types/charts'

const yScale = scaleLinear<number>({ domain: [0, 100], range: [200, 0] }) as unknown as AnyD3Scale
const xScale = scaleLinear<number>({ domain: [0, 4], range: [0, 400] }) as unknown as AnyD3Scale

const mockData = [
  { date: 0, v: 10 },
  { date: 1, v: 50 },
  { date: 2, v: 90 },
  { date: 3, v: 30 },
  { date: 4, v: 70 },
]

function renderArea(
  props?: Partial<Parameters<typeof Area>[0]>,
  extraCtx?: Record<string, unknown>,
) {
  const data = signal({ v: mockData })
  return renderWithVisualizationContext(<Area series="v" axis="y" {...props} />, {
    dataSignal: data,
    innerWidth: signal(400),
    innerHeight: signal(200),
    scales: signal({ y: yScale }),
    baseScale: signal(xScale),
    baseAxisAccessor: signal((d: Record<string, unknown>) => d.date),
    ...extraCtx,
  })
}

describe('Area mark', () => {
  it('renders an AreaClosed path and one circle per data point', () => {
    const { container } = renderArea()
    const paths = container.querySelectorAll('path')
    const circles = container.querySelectorAll('circle')
    expect(paths.length).toBeGreaterThanOrEqual(1)
    expect(circles).toHaveLength(5)
  })

  it('two sibling Area components produce distinct gradient IDs', () => {
    const data = signal({ a: mockData, b: mockData })
    const ctx = buildMockContext({
      dataSignal: data,
      innerWidth: signal(400),
      innerHeight: signal(200),
      scales: signal({ y: yScale }),
      baseScale: signal(xScale),
      baseAxisAccessor: signal((d: Record<string, unknown>) => d.date),
    })
    const { container } = render(
      <VisualizationContext.Provider value={ctx}>
        <svg>
          <Area series="a" axis="y" />
          <Area series="b" axis="y" />
        </svg>
      </VisualizationContext.Provider>,
    )
    const defs = container.querySelectorAll('defs')
    const ids = Array.from(defs).flatMap((def) =>
      Array.from(def.querySelectorAll('[id]')).map((el) => el.getAttribute('id')),
    )
    expect(ids).toContain('area-gradient-a')
    expect(ids).toContain('area-gradient-b')
  })

  it('returns null when innerWidth === 0', () => {
    const { container } = renderArea({}, { innerWidth: signal(0) })
    expect(container.querySelector('circle')).toBeNull()
    expect(container.querySelector('path')).toBeNull()
  })

  it('pointerenter on first circle sets activePoint with correct series, datum, x, y', () => {
    const ap = signal<ActivePoint | null>(null)
    renderArea({}, { activePoint: ap })
    const circles = document.querySelectorAll('circle')
    fireEvent.pointerEnter(circles[0])
    expect(ap.value?.series).toBe('v')
    expect(ap.value?.datum).toEqual(mockData[0])
    expect(typeof ap.value?.x).toBe('number')
    expect(typeof ap.value?.y).toBe('number')
  })

  it('pointerleave on circle resets activePoint to null', () => {
    const ap = signal<ActivePoint | null>(null)
    renderArea({}, { activePoint: ap })
    const circles = document.querySelectorAll('circle')
    fireEvent.pointerEnter(circles[0])
    expect(ap.value).not.toBeNull()
    fireEvent.pointerLeave(circles[0])
    expect(ap.value).toBeNull()
  })

  it('keydown Enter on circle sets activePoint identically to focus', () => {
    const ap = signal<ActivePoint | null>(null)
    renderArea({}, { activePoint: ap })
    const circles = document.querySelectorAll('circle')
    fireEvent.focus(circles[1])
    const fromFocus = ap.value
    ap.value = null
    fireEvent.keyDown(circles[1], { key: 'Enter' })
    expect(ap.value).toEqual(fromFocus)
  })

  it('all circles have tabIndex=0 and role="listitem"', () => {
    const { container } = renderArea()
    const circles = container.querySelectorAll('circle')
    circles.forEach((c) => {
      expect(c.getAttribute('tabindex')).toBe('0')
      expect(c.getAttribute('role')).toBe('listitem')
    })
  })

  it('circles are wrapped in a <g role="list"> element', () => {
    const { container } = renderArea()
    const g = container.querySelector('g[role="list"]')
    expect(g).not.toBeNull()
    expect(g?.getAttribute('aria-label')).toBe('v data')
  })

  it('<defs> element has aria-hidden="true"', () => {
    const { container } = renderArea()
    const defs = container.querySelector('defs')
    expect(defs?.getAttribute('aria-hidden')).toBe('true')
  })

  it('circle aria-label uses x-value prefix, not series name', () => {
    const { container } = renderArea()
    const circles = container.querySelectorAll('circle')
    const firstLabel = circles[0]?.getAttribute('aria-label') ?? ''
    // Old format: "v: 10", new format: "0: 10" (x-value: y-value)
    expect(firstLabel.startsWith('v:')).toBe(false)
    expect(firstLabel).toContain(': 10')
  })

  it('dashed={true} renders AreaClosed with strokeDasharray="4 4" (strokeWidth=2 default)', () => {
    const { container } = renderArea({ dashed: true })
    const paths = container.querySelectorAll('path')
    const dashedPath = Array.from(paths).find(
      (p) => p.getAttribute('stroke-dasharray') === '4 4',
    )
    expect(dashedPath).not.toBeUndefined()
  })

  it('dashed={false} renders no strokeDasharray attribute', () => {
    const { container } = renderArea({ dashed: false })
    const paths = container.querySelectorAll('path')
    const hasDash = Array.from(paths).some((p) => p.getAttribute('stroke-dasharray') !== null)
    expect(hasDash).toBe(false)
  })

  it('centered=true offsets circle cx by bandwidth/2 when base scale is a band scale', () => {
    const bandScale = scaleBand<string>({
      domain: ['a', 'b', 'c', 'd', 'e'],
      range: [0, 400],
      padding: 0,
    }) as unknown as AnyD3Scale

    const bandData = [
      { label: 'a', v: 10 },
      { label: 'b', v: 50 },
      { label: 'c', v: 90 },
      { label: 'd', v: 30 },
      { label: 'e', v: 70 },
    ]

    const data = signal({ v: bandData })
    const { container: withoutCentered } = renderWithVisualizationContext(
      <Area series="v" axis="y" centered={false} />,
      {
        dataSignal: data,
        innerWidth: signal(400),
        innerHeight: signal(200),
        scales: signal({ y: yScale }),
        baseScale: signal(bandScale),
        baseAxisAccessor: signal((d: Record<string, unknown>) => d.label),
      },
    )
    const { container: withCentered } = renderWithVisualizationContext(
      <Area series="v" axis="y" centered />,
      {
        dataSignal: data,
        innerWidth: signal(400),
        innerHeight: signal(200),
        scales: signal({ y: yScale }),
        baseScale: signal(bandScale),
        baseAxisAccessor: signal((d: Record<string, unknown>) => d.label),
      },
    )

    const circlesWithout = Array.from(withoutCentered.querySelectorAll('circle')).map(c =>
      parseFloat(c.getAttribute('cx') ?? '0'),
    )
    const circlesWith = Array.from(withCentered.querySelectorAll('circle')).map(c =>
      parseFloat(c.getAttribute('cx') ?? '0'),
    )

    // Each centered cx should be offset by bandwidth/2 relative to non-centered
    const bw = (bandScale as unknown as { bandwidth: () => number }).bandwidth()
    expect(bw).toBeGreaterThan(0)
    circlesWithout.forEach((cx, i) => {
      expect(circlesWith[i]).toBeCloseTo(cx + bw / 2, 2)
    })
  })

  it('skips null data points - renders fewer circles when series has nulls', () => {
    const dataWithNulls = [
      { date: 0, v: 10 },
      { date: 1, v: null },
      { date: 2, v: 90 },
      { date: 3, v: null },
      { date: 4, v: 70 },
    ]
    const data = signal({ v: dataWithNulls })
    const { container } = renderWithVisualizationContext(<Area series="v" axis="y" />, {
      dataSignal: data,
      innerWidth: signal(400),
      innerHeight: signal(200),
      scales: signal({ y: yScale }),
      baseScale: signal(xScale),
      baseAxisAccessor: signal((d: Record<string, unknown>) => d.date),
    })
    const circles = container.querySelectorAll('circle')
    expect(circles).toHaveLength(3)
  })
})
