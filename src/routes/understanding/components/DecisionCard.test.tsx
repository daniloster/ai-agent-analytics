import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DecisionCard } from './DecisionCard'
import type { DecisionEntry } from '../data/decisions'

const SAMPLE_DECISION: DecisionEntry = {
  id: 'D-2',
  decision: 'Chart library',
  options: ['Visx (low-level SVG primitives)', 'Recharts (component-based)', 'Nivo (D3-based)'],
  chosen: 'Visx + Visualization render-prop abstraction',
  rationale:
    'Visx gives direct SVG control for precise layout and accessibility. Recharts cannot produce the heatmap visualizations required.',
  reversible: true,
}

describe('DecisionCard', () => {
  it('shows decision label in collapsed state', () => {
    render(<DecisionCard decision={SAMPLE_DECISION} />)
    expect(screen.getByText('Chart library')).toBeTruthy()
  })

  it('shows chosen value in collapsed state', () => {
    render(<DecisionCard decision={SAMPLE_DECISION} />)
    expect(screen.getByText('Visx + Visualization render-prop abstraction')).toBeTruthy()
  })

  it('shows options joined with " / " in collapsed state', () => {
    render(<DecisionCard decision={SAMPLE_DECISION} />)
    expect(
      screen.getByText(
        'Visx (low-level SVG primitives) / Recharts (component-based) / Nivo (D3-based)',
      ),
    ).toBeTruthy()
  })

  it('shows a Resolved badge in collapsed state', () => {
    render(<DecisionCard decision={SAMPLE_DECISION} />)
    expect(screen.getByText('Resolved')).toBeTruthy()
  })

  it('rationale text is NOT visible on initial render', () => {
    render(<DecisionCard decision={SAMPLE_DECISION} />)
    expect(screen.queryByText(/Visx gives direct SVG control/)).toBeNull()
  })

  it('clicking the toggle button makes rationale visible', () => {
    const { rerender } = render(<DecisionCard decision={SAMPLE_DECISION} />)
    const btn = screen.getByRole('button')
    fireEvent.click(btn)
    rerender(<DecisionCard decision={SAMPLE_DECISION} />)
    expect(screen.getByText(/Visx gives direct SVG control/)).toBeTruthy()
  })

  it('clicking the toggle button again hides rationale', () => {
    const { rerender } = render(<DecisionCard decision={SAMPLE_DECISION} />)
    const btn = screen.getByRole('button')
    fireEvent.click(btn)
    rerender(<DecisionCard decision={SAMPLE_DECISION} />)
    fireEvent.click(btn)
    rerender(<DecisionCard decision={SAMPLE_DECISION} />)
    expect(screen.queryByText(/Visx gives direct SVG control/)).toBeNull()
  })

  it('aria-expanded is "false" on initial render', () => {
    render(<DecisionCard decision={SAMPLE_DECISION} />)
    const btn = screen.getByRole('button')
    expect(btn.getAttribute('aria-expanded')).toBe('false')
  })

  it('aria-expanded is "true" after first click', () => {
    const { rerender } = render(<DecisionCard decision={SAMPLE_DECISION} />)
    const btn = screen.getByRole('button')
    fireEvent.click(btn)
    rerender(<DecisionCard decision={SAMPLE_DECISION} />)
    expect(btn.getAttribute('aria-expanded')).toBe('true')
  })

  it('aria-expanded returns to "false" after second click', () => {
    const { rerender } = render(<DecisionCard decision={SAMPLE_DECISION} />)
    const btn = screen.getByRole('button')
    fireEvent.click(btn)
    rerender(<DecisionCard decision={SAMPLE_DECISION} />)
    fireEvent.click(btn)
    rerender(<DecisionCard decision={SAMPLE_DECISION} />)
    expect(btn.getAttribute('aria-expanded')).toBe('false')
  })

  it('shows Reversible: Yes when expanded and reversible is true', () => {
    const { rerender } = render(<DecisionCard decision={SAMPLE_DECISION} />)
    const btn = screen.getByRole('button')
    fireEvent.click(btn)
    rerender(<DecisionCard decision={SAMPLE_DECISION} />)
    expect(screen.getByText('Reversible: Yes')).toBeTruthy()
  })

  it('shows Reversible: No when expanded and reversible is false', () => {
    const nonReversible: DecisionEntry = { ...SAMPLE_DECISION, reversible: false }
    const { rerender } = render(<DecisionCard decision={nonReversible} />)
    const btn = screen.getByRole('button')
    fireEvent.click(btn)
    rerender(<DecisionCard decision={nonReversible} />)
    expect(screen.getByText('Reversible: No')).toBeTruthy()
  })
})
