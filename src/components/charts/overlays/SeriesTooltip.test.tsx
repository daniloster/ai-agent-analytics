import { it, expect, describe, vi } from 'vitest'
import { signal } from '@preact/signals-react'
import { render } from '@testing-library/react'
import { SeriesTooltip } from './SeriesTooltip'
import { VisualizationContext } from '../VisualizationContext'
import { buildMockContext } from '../test-utils'
import type { ActivePoint } from '../../../types/charts'
import type { Signal } from '@preact/signals-react'

vi.mock('@visx/tooltip', () => ({
  TooltipWithBounds: vi.fn(({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip">{children}</div>
  )),
}))

type TestDatum = { v: number; label: string }

function makeAp(value: ActivePoint | null): Signal<ActivePoint | null> {
  return signal(value) as unknown as Signal<ActivePoint | null>
}

function renderTooltip(seriesProp: string, ap: Signal<ActivePoint | null>) {
  const ctx = buildMockContext({ activePoint: ap })
  return render(
    <VisualizationContext.Provider value={ctx}>
      <SeriesTooltip<TestDatum> series={seriesProp}>
        {({ datum }) => <span data-testid="content">{datum.label}</span>}
      </SeriesTooltip>
    </VisualizationContext.Provider>,
  )
}

describe('SeriesTooltip', () => {
  it('renders nothing when activePoint.value === null', () => {
    const { container } = renderTooltip('v', makeAp(null))
    expect(container.querySelector('[data-testid="tooltip"]')).toBeNull()
  })

  it('renders nothing when activePoint.value.series does not match props.series', () => {
    const { container } = renderTooltip(
      'v',
      makeAp({ series: 'other', axis: 'y', datum: { v: 10, label: 'hello' }, x: 50, y: 100 }),
    )
    expect(container.querySelector('[data-testid="tooltip"]')).toBeNull()
  })

  it('renders children with correct datum when series matches', () => {
    const datum: TestDatum = { v: 42, label: 'match' }
    const { container } = renderTooltip(
      'v',
      makeAp({ series: 'v', axis: 'y', datum, x: 50, y: 100 }),
    )
    expect(container.querySelector('[data-testid="tooltip"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="content"]')?.textContent).toBe('match')
  })

  it('children render-prop receives datum, x, y matching activePoint.value', () => {
    const datum: TestDatum = { v: 99, label: 'test' }
    const ap = makeAp({ series: 'v', axis: 'y', datum, x: 200, y: 150 })
    const received: Array<{ x: number; y: number; datum: TestDatum }> = []
    const ctx = buildMockContext({ activePoint: ap })
    render(
      <VisualizationContext.Provider value={ctx}>
        <SeriesTooltip<TestDatum> series="v">
          {(point) => {
            received.push(point)
            return <span>{point.datum.label}</span>
          }}
        </SeriesTooltip>
      </VisualizationContext.Provider>,
    )
    expect(received[0]?.datum).toEqual(datum)
    expect(received[0]?.x).toBe(200)
    expect(received[0]?.y).toBe(150)
  })
})
