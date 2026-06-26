import { it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Card, CardHeader, CardTitle, CardContent } from './card'

it('Card renders a div with rounded-lg and border classes', () => {
  const { container } = render(<Card />)
  const div = container.firstElementChild as HTMLElement
  expect(div.tagName).toBe('DIV')
  expect(div.className).toContain('rounded-lg')
  expect(div.className).toContain('border')
})

it('Card forwards additional className alongside default classes', () => {
  const { container } = render(<Card className="extra" />)
  const div = container.firstElementChild as HTMLElement
  expect(div.className).toContain('rounded-lg')
  expect(div.className).toContain('extra')
})

it('CardContent renders children inside a div', () => {
  const { container } = render(<CardContent>hello</CardContent>)
  const div = container.firstElementChild as HTMLElement
  expect(div.tagName).toBe('DIV')
  expect(div.textContent).toBe('hello')
})

it('CardTitle renders as an h3 element', () => {
  const { container } = render(<CardTitle>My Title</CardTitle>)
  const h3 = container.firstElementChild as HTMLElement
  expect(h3.tagName).toBe('H3')
  expect(h3.textContent).toBe('My Title')
})

it('CardHeader renders a div with flex class', () => {
  const { container } = render(<CardHeader />)
  const div = container.firstElementChild as HTMLElement
  expect(div.tagName).toBe('DIV')
  expect(div.className).toContain('flex')
})
