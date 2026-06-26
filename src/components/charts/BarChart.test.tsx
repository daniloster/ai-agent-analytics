import { it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { BarChart } from './BarChart'

const BARS = [
  { label: 'Provisioned', value: 500 },
  { label: 'Activated', value: 340 },
  { label: 'MAU', value: 280 },
]

it('renders a div with role="list" and three role="listitem" items', () => {
  const { container } = render(<BarChart bars={BARS} />)
  const list = container.querySelector('[role="list"]')
  expect(list).not.toBeNull()
  const items = container.querySelectorAll('[role="listitem"]')
  expect(items.length).toBe(3)
})

it('first (largest) bar has width: 100%', () => {
  const { container } = render(<BarChart bars={BARS} />)
  const items = container.querySelectorAll('[role="listitem"]')
  const firstBarFill = items[0]?.querySelector('[style]') as HTMLElement | null
  expect(firstBarFill?.style.width).toBe('100%')
})

it('second bar width is proportional to its value', () => {
  const { container } = render(<BarChart bars={BARS} />)
  const items = container.querySelectorAll('[role="listitem"]')
  const secondBarFill = items[1]?.querySelector('[style]') as HTMLElement | null
  // 340 / 500 = 68%
  expect(secondBarFill?.style.width).toBe('68%')
})

it('empty bars array does not throw', () => {
  expect(() => render(<BarChart bars={[]} />)).not.toThrow()
})
