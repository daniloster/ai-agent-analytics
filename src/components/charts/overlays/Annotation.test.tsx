import { it, expect, describe } from 'vitest'
import { scaleLinear } from '@visx/scale'
import { Annotation } from './Annotation'
import { renderWithVisualizationContext } from '../test-utils'
import type { AnyD3Scale } from '../../../types/charts'

const yScale = scaleLinear<number>({ domain: [0, 10], range: [200, 0] }) as unknown as AnyD3Scale

function renderAnnotation(props?: Partial<Parameters<typeof Annotation>[0]>, extraCtx?: Record<string, unknown>) {
  return renderWithVisualizationContext(
    <Annotation axis="y" value={5} label="Threshold" {...props} />,
    {
      innerWidth: 400,
      innerHeight: 200,
      scales: { y: yScale },
      ...extraCtx,
    },
  )
}

describe('Annotation', () => {
  it('variant="destructive" applies tokens.destructive stroke', () => {
    const { container } = renderAnnotation({ variant: 'destructive' })
    const line = container.querySelector('line')
    expect(line?.getAttribute('stroke')).toBe('hsl(var(--destructive))')
  })

  it('default variant applies tokens.warning stroke', () => {
    const { container } = renderAnnotation()
    const line = container.querySelector('line')
    expect(line?.getAttribute('stroke')).toBe('#f59e0b')
  })

  it('line y-coordinate matches scale(value) output', () => {
    const { container } = renderAnnotation({ value: 5 })
    const line = container.querySelector('line')
    const expectedY = (yScale as unknown as (v: number) => number)(5)
    expect(Number(line?.getAttribute('y1'))).toBeCloseTo(expectedY)
  })

  it('label text is present as a text element', () => {
    const { container } = renderAnnotation({ label: 'Threshold' })
    const text = container.querySelector('text')
    expect(text?.textContent).toBe('Threshold')
  })

  it('innerWidth === 0 renders null', () => {
    const { container } = renderAnnotation({}, { innerWidth: 0 })
    expect(container.querySelector('g')).toBeNull()
  })
})
