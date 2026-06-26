import { it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Progress } from './progress'

it('value={68} renders inner div with width: 68%', () => {
  const { container } = render(<Progress value={68} />)
  expect(container.innerHTML).toContain('width: 68%')
})

it('value={110} clamps to width: 100%', () => {
  const { container } = render(<Progress value={110} />)
  expect(container.innerHTML).toContain('width: 100%')
})

it('value={-5} clamps to width: 0%', () => {
  const { container } = render(<Progress value={-5} />)
  expect(container.innerHTML).toContain('width: 0%')
})
