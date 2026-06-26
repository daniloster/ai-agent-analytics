import { it, expect, describe } from 'vitest'
import { fireEvent } from '@testing-library/react'
import { signal } from '@preact/signals-react'
import { HeatmapMark } from './HeatmapMark'
import { renderWithVisualizationContext } from '../test-utils'
import type { ActivePoint } from '../../../types/charts'

function makeData(count: number): Record<string, unknown>[] {
  return Array.from({ length: count }, (_, i) => ({
    date: `2026-01-${String(i + 1).padStart(2, '0')}`,
    uptime: 80 + (i % 20),
  }))
}

function renderHeatmap(
  count = 31,
  props?: Partial<Parameters<typeof HeatmapMark>[0]>,
  extraCtx?: Record<string, unknown>,
) {
  const data = signal<Record<string, unknown[]>>({ uptime: makeData(count) })
  return renderWithVisualizationContext(
    <HeatmapMark series="uptime" dateKey="date" colorScale="availability" {...props} />,
    {
      dataSignal: data,
      innerWidth: signal(400),
      innerHeight: signal(200),
      ...extraCtx,
    },
  )
}

describe('HeatmapMark', () => {
  it('31 data points produce 31 rect elements', () => {
    const { container } = renderHeatmap(31)
    const rects = container.querySelectorAll('rect')
    expect(rects).toHaveLength(31)
  })

  it('7 data points produce 7 rect elements', () => {
    const { container } = renderHeatmap(7)
    const rects = container.querySelectorAll('rect')
    expect(rects).toHaveLength(7)
  })

  it('all rects have tabIndex=0 and role="listitem"', () => {
    const { container } = renderHeatmap(7)
    const rects = container.querySelectorAll('rect')
    rects.forEach((r) => {
      expect(r.getAttribute('tabindex')).toBe('0')
      expect(r.getAttribute('role')).toBe('listitem')
    })
  })

  it('first cell aria-label contains first datum date value', () => {
    const { container } = renderHeatmap(31)
    const rects = container.querySelectorAll('rect')
    expect(rects[0].getAttribute('aria-label')).toContain('2026-01-01')
  })

  it('last cell aria-label contains last datum date value', () => {
    const { container } = renderHeatmap(31)
    const rects = container.querySelectorAll('rect')
    expect(rects[30].getAttribute('aria-label')).toContain('2026-01-31')
  })

  it('pointerenter on a cell sets activePoint.value with correct datum', () => {
    const ap = signal<ActivePoint | null>(null)
    const data = makeData(7)
    const dataSig = signal<Record<string, unknown[]>>({ uptime: data })
    renderWithVisualizationContext(
      <HeatmapMark series="uptime" dateKey="date" colorScale="availability" />,
      {
        dataSignal: dataSig,
        innerWidth: signal(400),
        innerHeight: signal(200),
        activePoint: ap,
      },
    )
    const rects = document.querySelectorAll('rect')
    fireEvent.pointerEnter(rects[0])
    expect(ap.value?.series).toBe('uptime')
    expect(ap.value?.datum).toEqual(data[0])
  })

  it('innerWidth === 0 renders null', () => {
    const { container } = renderHeatmap(7, {}, { innerWidth: signal(0) })
    expect(container.querySelector('rect')).toBeNull()
  })
})
