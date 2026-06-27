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

it('SkipLink is rendered before sticky header div', () => {
  const { container } = render(
    <DashboardLayout>
      <p>content</p>
    </DashboardLayout>,
  )
  const skipLink = container.querySelector('a[href="#main-content"]')
  const sticky = container.querySelector('div.sticky')
  expect(skipLink).not.toBeNull()
  const position = skipLink!.compareDocumentPosition(sticky!)
  expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
})

it('main element has id="main-content" and tabIndex -1', () => {
  const { container } = render(
    <DashboardLayout>
      <p>content</p>
    </DashboardLayout>,
  )
  const main = container.querySelector('main')
  expect(main?.id).toBe('main-content')
  expect(main?.tabIndex).toBe(-1)
})

it('header className contains flex-wrap for mobile layout', () => {
  const { container } = render(
    <DashboardLayout>
      <p>content</p>
    </DashboardLayout>,
  )
  const header = container.querySelector('header')
  expect(header?.className).toContain('flex-wrap')
  expect(header?.className).toContain('sm:px-8')
})

it('main className contains px-4 and lg:px-8 for responsive padding', () => {
  const { container } = render(
    <DashboardLayout>
      <p>content</p>
    </DashboardLayout>,
  )
  const main = container.querySelector('main')
  expect(main?.className).toContain('px-4')
  expect(main?.className).toContain('lg:px-8')
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
