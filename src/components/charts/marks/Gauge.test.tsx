import { it, expect, describe } from 'vitest'
import { signal } from '@preact/signals-react'
import type { Signal } from '@preact/signals-react'
import { Gauge } from './Gauge'
import { renderWithVisualizationContext } from '../test-utils'

function renderGauge(
  props?: Partial<Parameters<typeof Gauge>[0]>,
  dataSig?: Signal<Record<string, unknown[]>>,
  extraCtx?: Record<string, unknown>,
) {
  const data: Signal<Record<string, unknown[]>> = dataSig ?? signal<Record<string, unknown[]>>({ pct: [{ pct: 50 }] })
  return renderWithVisualizationContext(<Gauge series="pct" {...props} />, {
    dataSignal: data,
    innerWidth: 400,
    innerHeight: 200,
    ...extraCtx,
  })
}

describe('Gauge mark', () => {
  it('value above criticalThreshold uses tokens.destructive on progress arc', () => {
    const { container } = renderGauge(
      { criticalThreshold: 90 },
      signal<Record<string, unknown[]>>({ pct: [{ pct: 95 }] }),
    )
    const paths = container.querySelectorAll('path')
    const progressPath = paths[0]
    expect(progressPath?.getAttribute('fill')).toBe('hsl(var(--destructive))')
  })

  it('value below criticalThreshold uses tokens.primary on progress arc', () => {
    const { container } = renderGauge(
      { criticalThreshold: 90 },
      signal<Record<string, unknown[]>>({ pct: [{ pct: 50 }] }),
    )
    const paths = container.querySelectorAll('path')
    const progressPath = paths[0]
    expect(progressPath?.getAttribute('fill')).toBe('hsl(var(--primary))')
  })

  it('label prop renders a text element with that text', () => {
    const { container } = renderGauge({ label: 'Budget' })
    const text = container.querySelector('text')
    expect(text?.textContent).toBe('Budget')
  })

  it('innerWidth === 0 renders null', () => {
    const { container } = renderGauge({}, undefined, { innerWidth: 0 })
    expect(container.querySelector('g')).toBeNull()
  })

  it('empty data array renders null without throwing', () => {
    const emptyData = signal<Record<string, unknown[]>>({ pct: [] })
    expect(() => renderGauge({}, emptyData)).not.toThrow()
    const { container } = renderGauge({}, emptyData)
    expect(container.querySelector('g')).toBeNull()
  })

  it('progress arc has tabIndex=0 and role="listitem"', () => {
    const { container } = renderGauge()
    const paths = container.querySelectorAll('path')
    const progressPath = paths[0]
    expect(progressPath?.getAttribute('tabindex')).toBe('0')
    expect(progressPath?.getAttribute('role')).toBe('listitem')
  })
})
