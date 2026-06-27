import { it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { DonutChart } from './DonutChart'

const TWO_SLICES = [
  { label: 'Active', value: 70 },
  { label: 'Unused', value: 30 },
]

it('renders an SVG without role="img"', () => {
  const { container } = render(<DonutChart slices={TWO_SLICES} />)
  const svg = container.querySelector('svg')
  expect(svg).not.toBeNull()
  expect(svg?.getAttribute('role')).not.toBe('img')
})

it('two slices render two path elements', () => {
  const { container } = render(<DonutChart slices={TWO_SLICES} />)
  const paths = container.querySelectorAll('path')
  expect(paths.length).toBe(2)
})

it('inner Group has role="list"', () => {
  const { container } = render(<DonutChart slices={TWO_SLICES} />)
  const group = container.querySelector('g[role="list"]')
  expect(group).not.toBeNull()
})

it('each arc path has role="listitem" and tabIndex=0', () => {
  const { container } = render(<DonutChart slices={TWO_SLICES} />)
  const paths = container.querySelectorAll('path[role="listitem"]')
  expect(paths.length).toBe(2)
  paths.forEach((p) => {
    expect(p.getAttribute('tabindex')).toBe('0')
  })
})

it('first arc aria-label is "Active: 70.0%"', () => {
  const { container } = render(<DonutChart slices={TWO_SLICES} />)
  const paths = container.querySelectorAll('path[role="listitem"]')
  expect(paths[0]?.getAttribute('aria-label')).toBe('Active: 70.0%')
})

it('empty slices array does not throw', () => {
  expect(() => render(<DonutChart slices={[]} />)).not.toThrow()
})
