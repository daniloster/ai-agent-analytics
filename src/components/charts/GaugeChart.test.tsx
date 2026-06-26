import { it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { GaugeChart } from './GaugeChart'
import type { ChartTokens } from './primitives/useChartTokens'

vi.mock('@visx/responsive/lib/components/ParentSize', () => ({
  default: ({ children, className, style }: {
    children: (args: { width: number; height: number }) => React.ReactNode
    className?: string
    style?: React.CSSProperties
  }) => (
    <div className={className} style={style}>
      {children({ width: 400, height: 160 })}
    </div>
  ),
}))

const TOKENS: ChartTokens = {
  primary: '#2563eb',
  primaryFaded: 'rgba(37,99,235,0.15)',
  secondary: '#0d9488',
  muted: 'hsl(var(--muted-foreground))',
  border: 'hsl(var(--border))',
  background: 'hsl(var(--background))',
  destructive: 'hsl(var(--destructive))',
  success: '#22c55e',
  warning: '#d97706',
}

it('renders two path elements (foreground + background arcs)', () => {
  const { container } = render(<GaugeChart value={65} label="65%" tokens={TOKENS} />)
  const paths = container.querySelectorAll('path')
  expect(paths.length).toBe(2)
})

it('value=91 gives foreground arc fill = tokens.destructive', () => {
  const { container } = render(<GaugeChart value={91} label="91%" tokens={TOKENS} />)
  const paths = container.querySelectorAll('path')
  expect(paths[0]?.getAttribute('fill')).toBe(TOKENS.destructive)
})

it('value=89 gives foreground arc fill = tokens.primary', () => {
  const { container } = render(<GaugeChart value={89} label="89%" tokens={TOKENS} />)
  const paths = container.querySelectorAll('path')
  expect(paths[0]?.getAttribute('fill')).toBe(TOKENS.primary)
})

it('boundary value=90 gives primary (not destructive)', () => {
  const { container } = render(<GaugeChart value={90} label="90%" tokens={TOKENS} />)
  const paths = container.querySelectorAll('path')
  expect(paths[0]?.getAttribute('fill')).toBe(TOKENS.primary)
})

it('label text is rendered inside the SVG', () => {
  const { container } = render(<GaugeChart value={65} label="65%" tokens={TOKENS} />)
  const texts = container.querySelectorAll('text')
  const labelText = Array.from(texts).find((t) => t.textContent === '65%')
  expect(labelText).not.toBeUndefined()
})

it('subLabel renders a second text element', () => {
  const { container } = render(
    <GaugeChart value={65} label="65%" subLabel="of $15,000 budget" tokens={TOKENS} />,
  )
  const texts = container.querySelectorAll('text')
  expect(texts.length).toBe(2)
})

it('absent subLabel renders only one text element', () => {
  const { container } = render(<GaugeChart value={65} label="65%" tokens={TOKENS} />)
  const texts = container.querySelectorAll('text')
  expect(texts.length).toBe(1)
})

it('value=0 does not throw', () => {
  expect(() => render(<GaugeChart value={0} label="0%" tokens={TOKENS} />)).not.toThrow()
})

it('figure element has aria-label set to the label prop', () => {
  const { container } = render(<GaugeChart value={65} label="65%" tokens={TOKENS} />)
  const figure = container.querySelector('figure')
  expect(figure?.getAttribute('aria-label')).toBe('65%')
})
