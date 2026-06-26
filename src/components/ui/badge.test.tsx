import { it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Badge } from './badge'

it('variant="destructive" has bg-destructive class', () => {
  const { container } = render(<Badge variant="destructive">3 signals</Badge>)
  expect(container.querySelector('span')!.className).toContain('bg-destructive')
})

it('default variant (no prop) has bg-primary class', () => {
  const { container } = render(<Badge>label</Badge>)
  expect(container.querySelector('span')!.className).toContain('bg-primary')
})

it('variant="secondary" has bg-secondary class', () => {
  const { container } = render(<Badge variant="secondary">label</Badge>)
  expect(container.querySelector('span')!.className).toContain('bg-secondary')
})
