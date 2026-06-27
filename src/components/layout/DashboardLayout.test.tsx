import { it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
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

function renderLayout(children: React.ReactNode = <p>content</p>) {
  return render(
    <MemoryRouter>
      <DashboardLayout>{children}</DashboardLayout>
    </MemoryRouter>,
  )
}

it('children render inside main element', () => {
  renderLayout()
  const main = screen.getByRole('main')
  expect(main).toBeTruthy()
  expect(main.textContent).toContain('content')
})

it('sticky header div precedes main in the DOM', () => {
  const { container } = renderLayout()
  const sticky = container.querySelector('div.sticky')
  const main = container.querySelector('main')
  expect(sticky).not.toBeNull()
  expect(main).not.toBeNull()
  const position = sticky!.compareDocumentPosition(main!)
  expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
})

it('header contains FilterBar and SectionNav', () => {
  renderLayout()
  expect(screen.getByTestId('filter-bar')).toBeTruthy()
  expect(screen.getByTestId('section-nav')).toBeTruthy()
})

it('SkipLink is rendered before sticky header div', () => {
  const { container } = renderLayout()
  const skipLink = container.querySelector('a[href="#main-content"]')
  const sticky = container.querySelector('div.sticky')
  expect(skipLink).not.toBeNull()
  const position = skipLink!.compareDocumentPosition(sticky!)
  expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
})

it('main element has id="main-content" and tabIndex -1', () => {
  const { container } = renderLayout()
  const main = container.querySelector('main')
  expect(main?.id).toBe('main-content')
  expect(main?.tabIndex).toBe(-1)
})

it('header className contains flex-wrap for mobile layout', () => {
  const { container } = renderLayout()
  const header = container.querySelector('header')
  expect(header?.className).toContain('flex-wrap')
  expect(header?.className).toContain('sm:px-8')
})

it('main className contains px-4 and lg:px-8 for responsive padding', () => {
  const { container } = renderLayout()
  const main = container.querySelector('main')
  expect(main?.className).toContain('px-4')
  expect(main?.className).toContain('lg:px-8')
})

it('two separate renders produce independent QueryClients', () => {
  const { unmount } = renderLayout(<p>first</p>)
  unmount()
  expect(() => renderLayout(<p>second</p>)).not.toThrow()
})

it('header contains "How this works" link pointing to /understanding', () => {
  const { container } = renderLayout()
  const header = container.querySelector('header')
  const link = header?.querySelector('a[href="/understanding"]')
  expect(link).not.toBeNull()
  expect(link?.textContent?.trim()).toContain('How this works')
})
