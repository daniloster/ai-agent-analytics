import { it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { SectionSkeleton } from './SectionSkeleton'

it('renders exactly 4 divs with animate-pulse', () => {
  const { container } = render(<SectionSkeleton />)
  const divs = container.querySelectorAll('div.animate-pulse')
  expect(divs).toHaveLength(4)
})

it('first and third div have height 80, second and fourth have height 200', () => {
  const { container } = render(<SectionSkeleton />)
  const divs = container.querySelectorAll('div.animate-pulse')
  expect((divs[0] as HTMLElement).style.height).toBe('80px')
  expect((divs[1] as HTMLElement).style.height).toBe('200px')
  expect((divs[2] as HTMLElement).style.height).toBe('80px')
  expect((divs[3] as HTMLElement).style.height).toBe('200px')
})
