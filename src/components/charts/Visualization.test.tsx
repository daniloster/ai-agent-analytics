import { it, expect, vi, describe, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { signal } from '@preact/signals-react'
import * as VxGrid from '@visx/grid'
import { Visualization } from './Visualization'
import { useVisualizationContext } from './VisualizationContext'
import type { AxisConfig } from '../../types/charts'

// Mock ParentSize to synchronously provide fixed dimensions
vi.mock('@visx/responsive/lib/components/ParentSize', () => ({
  default: ({ children, className, style }: {
    children: (args: { width: number; height: number }) => React.ReactNode
    className?: string
    style?: React.CSSProperties
  }) => (
    <div className={className} style={style}>
      {children({ width: 400, height: 300 })}
    </div>
  ),
}))

// Mock @visx/event localPoint
vi.mock('@visx/event', () => ({
  localPoint: vi.fn(() => ({ x: 50, y: 100 })),
}))

// Mock @visx/axis to avoid SVG rendering issues
vi.mock('@visx/axis', () => ({
  AxisBottom: vi.fn(() => null),
  AxisLeft: vi.fn(() => null),
  AxisRight: vi.fn(() => null),
}))

// Mock @visx/grid
vi.mock('@visx/grid', () => ({
  GridRows: vi.fn(() => null),
  GridColumns: vi.fn(() => null),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

const linearAxes: AxisConfig[] = [
  { id: 'y', type: 'linear', position: 'left', accessor: (d) => d.v as number, domain: [0, 100] },
]

function ContextConsumer() {
  const ctx = useVisualizationContext()
  return (
    <div
      data-testid="consumer"
      data-inner-width={ctx.innerWidth.value}
      data-has-scales={String(Object.keys(ctx.scales.value).length > 0)}
    />
  )
}

describe('Visualization children and context', () => {
  it('renders children and provides context', () => {
    const data = signal({ y: [{ v: 50 }] })
    render(
      <Visualization data={data} axes={linearAxes}>
        {() => <ContextConsumer />}
      </Visualization>
    )
    const consumer = screen.getByTestId('consumer')
    expect(consumer).toBeTruthy()
    expect(consumer.getAttribute('data-has-scales')).toBe('true')
  })

  it('provides non-zero innerWidth when fullWidth > 0', () => {
    const data = signal({ y: [{ v: 50 }] })
    render(
      <Visualization data={data} axes={linearAxes}>
        {() => <ContextConsumer />}
      </Visualization>
    )
    const consumer = screen.getByTestId('consumer')
    expect(Number(consumer.getAttribute('data-inner-width'))).toBeGreaterThan(0)
  })
})

describe('axes as function', () => {
  it('function receives data.value and produces scales', () => {
    const data = signal({ y: [{ v: 10 }, { v: 20 }] })
    const axesFn = vi.fn((_d: unknown) => linearAxes)
    render(
      <Visualization data={data} axes={axesFn}>
        {() => <ContextConsumer />}
      </Visualization>
    )
    expect(axesFn).toHaveBeenCalledWith({ y: [{ v: 10 }, { v: 20 }] })
    expect(screen.getByTestId('consumer').getAttribute('data-has-scales')).toBe('true')
  })
})

describe('all-hidden axes margin', () => {
  it('zero-margin axes result in innerWidth == fullWidth', () => {
    const hiddenAxes: AxisConfig[] = [
      { id: 'x', type: 'time', position: 'bottom', accessor: (d) => d.date as string, hidden: true },
      { id: 'y', type: 'linear', position: 'left', accessor: (d) => d.v as number, hidden: true },
    ]
    const data = signal({ y: [{ date: '2026-01-01', v: 1 }] })
    render(
      <Visualization data={data} axes={hiddenAxes}>
        {() => <ContextConsumer />}
      </Visualization>
    )
    const consumer = screen.getByTestId('consumer')
    // fullWidth from mock is 400, no margin subtracted -> innerWidth = 400
    expect(Number(consumer.getAttribute('data-inner-width'))).toBe(400)
  })
})

describe('GridColumns not rendered', () => {
  it('never calls GridColumns', () => {
    const data = signal({ y: [{ v: 50 }] })
    render(
      <Visualization data={data} axes={linearAxes}>
        {() => null}
      </Visualization>
    )
    expect(vi.mocked(VxGrid.GridColumns)).not.toHaveBeenCalled()
  })
})

describe('SVG pointer events', () => {
  it('mousePosition signal updated on SVG pointermove', async () => {
    const { localPoint } = await import('@visx/event')
    vi.mocked(localPoint).mockReturnValue({ x: 50, y: 100 } as ReturnType<typeof localPoint>)

    function SignalCapture() {
      useVisualizationContext()
      return null
    }

    const data = signal({ y: [{ v: 50 }] })
    const { container } = render(
      <Visualization data={data} axes={linearAxes}>
        {() => <SignalCapture />}
      </Visualization>
    )

    const svg = container.querySelector('svg')!
    fireEvent.pointerMove(svg)

    expect(localPoint).toHaveBeenCalled()
  })

  it('activePoint set to null on SVG pointerleave', () => {
    let capturedActivePoint: unknown = 'not-checked'

    function SignalCapture() {
      const ctx = useVisualizationContext()
      capturedActivePoint = ctx.activePoint.value
      return null
    }

    const data = signal({ y: [{ v: 50 }] })
    const { container } = render(
      <Visualization data={data} axes={linearAxes}>
        {() => <SignalCapture />}
      </Visualization>
    )

    const svg = container.querySelector('svg')!
    fireEvent.pointerLeave(svg)
    expect(capturedActivePoint).toBeNull()
  })
})
