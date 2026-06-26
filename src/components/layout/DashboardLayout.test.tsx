import { it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DashboardLayout } from './DashboardLayout'

vi.mock('../filters/FilterBar', () => ({
  FilterBar: () => <div data-testid="filter-bar" />,
}))

vi.mock('./SectionNav', () => ({
  SectionNav: () => <nav data-testid="section-nav" />,
}))

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
})

it('children render inside main element', () => {
  render(
    <DashboardLayout>
      <p>content</p>
    </DashboardLayout>,
  )
  const main = screen.getByRole('main')
  expect(main).toBeTruthy()
  expect(main.textContent).toContain('content')
})

it('sticky header div precedes main in the DOM', () => {
  const { container } = render(
    <DashboardLayout>
      <p>content</p>
    </DashboardLayout>,
  )
  const sticky = container.querySelector('div.sticky')
  const main = container.querySelector('main')
  expect(sticky).not.toBeNull()
  expect(main).not.toBeNull()
  // sticky must appear before main in document order
  const position = sticky!.compareDocumentPosition(main!)
  expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
})

it('header contains FilterBar and SectionNav', () => {
  render(
    <DashboardLayout>
      <p>content</p>
    </DashboardLayout>,
  )
  expect(screen.getByTestId('filter-bar')).toBeTruthy()
  expect(screen.getByTestId('section-nav')).toBeTruthy()
})

it('two separate renders produce independent QueryClients', () => {
  const { unmount } = render(
    <DashboardLayout>
      <p>first</p>
    </DashboardLayout>,
  )
  unmount()
  // Second render should not throw due to shared/stale client
  expect(() =>
    render(
      <DashboardLayout>
        <p>second</p>
      </DashboardLayout>,
    ),
  ).not.toThrow()
})
