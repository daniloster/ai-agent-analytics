import { it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { SkipLink } from './SkipLink'

it('renders an <a> with href="#main-content"', () => {
  const { container } = render(<SkipLink />)
  const link = container.querySelector('a')
  expect(link).not.toBeNull()
  expect(link?.getAttribute('href')).toBe('#main-content')
})

it('has sr-only class on the <a>', () => {
  const { container } = render(<SkipLink />)
  const link = container.querySelector('a')
  expect(link?.className).toContain('sr-only')
})

it('has focus:not-sr-only class on the <a>', () => {
  const { container } = render(<SkipLink />)
  const link = container.querySelector('a')
  expect(link?.className).toContain('focus:not-sr-only')
})
