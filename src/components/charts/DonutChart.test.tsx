import { it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { DonutChart } from './DonutChart'

const TWO_SLICES = [
  { label: 'Active', value: 70 },
  { label: 'Unused', value: 30 },
]

it('renders an SVG with role="img"', () => {
  const { container } = render(<DonutChart slices={TWO_SLICES} />)
  const svg = container.querySelector('svg')
  expect(svg).not.toBeNull()
  expect(svg?.getAttribute('role')).toBe('img')
})

it('two slices render two path elements', () => {
  const { container } = render(<DonutChart slices={TWO_SLICES} />)
  const paths = container.querySelectorAll('path')
  expect(paths.length).toBe(2)
})

it('empty slices array does not throw', () => {
  expect(() => render(<DonutChart slices={[]} />)).not.toThrow()
})
