import { it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FilterBar } from './FilterBar'

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      {children}
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
})

it('renders without error when wrapped in QueryClientProvider', () => {
  expect(() => render(<FilterBar />, { wrapper })).not.toThrow()
})

it('container div has flex class', () => {
  const { container } = render(<FilterBar />, { wrapper })
  const div = container.firstElementChild
  expect(div?.className).toContain('flex')
})

it('wrapper has role="search"', () => {
  const { container } = render(<FilterBar />, { wrapper })
  expect(container.firstElementChild?.getAttribute('role')).toBe('search')
})

it('wrapper has aria-label "Filter dashboard data"', () => {
  const { container } = render(<FilterBar />, { wrapper })
  expect(container.firstElementChild?.getAttribute('aria-label')).toBe('Filter dashboard data')
})

it('DateRangePicker appears before TeamSelector in DOM', () => {
  const { container } = render(<FilterBar />, { wrapper })
  const children = Array.from(container.firstElementChild?.children ?? [])
  // DateRangePicker renders a button; TeamSelector renders skeleton (animate-pulse) while loading
  const firstChild = children[0]
  const secondChild = children[1]
  expect(firstChild?.tagName).toBe('BUTTON')
  expect(secondChild?.className).toContain('animate-pulse')
})
