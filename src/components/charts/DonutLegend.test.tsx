import { it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DonutLegend } from './DonutLegend'

const ITEMS = [
  { color: '#ef4444', title: 'Model Error', renderDetail: () => '43% - 203 errors' },
  { color: '#f97316', title: 'Timeout', renderDetail: () => '32% - 151 errors' },
]

it('renders one list item per entry', () => {
  const { container } = render(<DonutLegend items={ITEMS} />)
  const items = container.querySelectorAll('li')
  expect(items).toHaveLength(2)
})

it('renders the title text for each item', () => {
  render(<DonutLegend items={ITEMS} />)
  expect(screen.getByText('Model Error')).toBeTruthy()
  expect(screen.getByText('Timeout')).toBeTruthy()
})

it('applies the color to each swatch span', () => {
  const { container } = render(<DonutLegend items={ITEMS} />)
  const swatches = container.querySelectorAll('[aria-hidden="true"]')
  expect(swatches[0]).toHaveStyle({ background: '#ef4444' })
  expect(swatches[1]).toHaveStyle({ background: '#f97316' })
})

it('calls renderDetail and renders its output', () => {
  render(<DonutLegend items={ITEMS} />)
  expect(screen.getByText('43% - 203 errors')).toBeTruthy()
})

it('renders nothing for an empty items array', () => {
  const { container } = render(<DonutLegend items={[]} />)
  expect(container.querySelectorAll('li')).toHaveLength(0)
})
