import { it, expect, describe, vi } from 'vitest'
import { signal } from '@preact/signals-react'
import { render } from '@testing-library/react'
import { MouseTooltip } from './MouseTooltip'
import { VisualizationContext } from '../VisualizationContext'
import { buildMockContext } from '../test-utils'
import type { Signal } from '@preact/signals-react'

vi.mock('@visx/tooltip', () => ({
  TooltipWithBounds: vi.fn(({ children }: { children: React.ReactNode }) => (
    <div data-testid="tooltip">{children}</div>
  )),
}))

type Pos = { x: number; y: number }

function makePos(v: Pos | null): Signal<Pos | null> {
  return signal(v) as unknown as Signal<Pos | null>
}

function renderWithPos(
  posValue: Pos | null,
  child: React.ReactNode | ((pos: Pos) => React.ReactNode),
) {
  const ctx = buildMockContext({ mousePosition: makePos(posValue) })
  return render(
    <VisualizationContext.Provider value={ctx}>
      <MouseTooltip>{child}</MouseTooltip>
    </VisualizationContext.Provider>,
  )
}

describe('MouseTooltip', () => {
  it('renders nothing when mousePosition.value === null', () => {
    const { container } = renderWithPos(null, <span>hi</span>)
    expect(container.querySelector('[data-testid="tooltip"]')).toBeNull()
  })

  it('renders children when mousePosition.value is set', () => {
    const { container } = renderWithPos(
      { x: 50, y: 100 },
      <span data-testid="content">hello</span>,
    )
    expect(container.querySelector('[data-testid="tooltip"]')).not.toBeNull()
    expect(container.querySelector('[data-testid="content"]')?.textContent).toBe('hello')
  })

  it('function children receives the correct position object', () => {
    const received: Pos[] = []
    renderWithPos({ x: 50, y: 100 }, (pos) => {
      received.push(pos)
      return <span>{pos.x}</span>
    })
    expect(received[0]).toEqual({ x: 50, y: 100 })
  })
})
