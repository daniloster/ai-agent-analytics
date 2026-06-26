import { it, expect, describe } from 'vitest'
import { fireEvent } from '@testing-library/react'
import { signal } from '@preact/signals-react'
import { scaleLinear } from '@visx/scale'
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

  it('dashed={true} renders AreaClosed with strokeDasharray="4 2"', () => {
    const { container } = renderArea({ dashed: true })
    const paths = container.querySelectorAll('path')
    const dashedPath = Array.from(paths).find(
      (p) => p.getAttribute('stroke-dasharray') === '4 2',
    )
    expect(dashedPath).not.toBeUndefined()
  })

  it('dashed={false} renders no strokeDasharray attribute', () => {
    const { container } = renderArea({ dashed: false })
    const paths = container.querySelectorAll('path')
    const hasDash = Array.from(paths).some((p) => p.getAttribute('stroke-dasharray') !== null)
    expect(hasDash).toBe(false)
  })
})
