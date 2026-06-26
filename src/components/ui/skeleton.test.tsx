import { it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Skeleton } from './skeleton'

it('renders a div with animate-pulse class', () => {
  const { container } = render(<Skeleton />)
  const div = container.firstElementChild
  expect(div?.tagName).toBe('DIV')
  expect(div?.className).toContain('animate-pulse')
})

it('merges additional className prop', () => {
  const { container } = render(<Skeleton className="h-9 w-36" />)
  const div = container.firstElementChild
  expect(div?.className).toContain('h-9')
  expect(div?.className).toContain('w-36')
  expect(div?.className).toContain('animate-pulse')
})
