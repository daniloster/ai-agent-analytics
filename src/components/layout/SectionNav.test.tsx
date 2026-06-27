import { it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { SectionNav } from './SectionNav'

type IOCallback = (entries: IntersectionObserverEntry[]) => void

function makeObserverMock() {
  let savedCallback: IOCallback | null = null
  const disconnect = vi.fn()
  const observe = vi.fn()
  const MockIO = vi.fn((cb: IOCallback) => {
    savedCallback = cb
    return { observe, disconnect }
  })
  function trigger(id: string, isIntersecting: boolean) {
    const el = document.createElement('section')
    el.id = id
    savedCallback?.([{ isIntersecting, target: el } as unknown as IntersectionObserverEntry])
  }
  return { MockIO, disconnect, observe, trigger }
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.stubGlobal('IntersectionObserver', makeObserverMock().MockIO)
})

afterEach(() => {
  vi.unstubAllGlobals()
  window.history.replaceState({}, '', '/')
})

it('renders four anchors with correct href and text', () => {
  const { getAllByRole } = render(<SectionNav />)
  const links = getAllByRole('link')
  expect(links).toHaveLength(4)
  expect(links[0]).toHaveAttribute('href', '#overview')
  expect(links[0]).toHaveTextContent('Overview')
  expect(links[1]).toHaveAttribute('href', '#teams')
  expect(links[2]).toHaveAttribute('href', '#reliability')
  expect(links[3]).toHaveAttribute('href', '#billing')
  expect(links[3]).toHaveTextContent('Billing')
})

it('Overview link has aria-current on initial render', () => {
  const { getByText } = render(<SectionNav />)
  expect(getByText('Overview')).toHaveAttribute('aria-current', 'true')
  expect(getByText('Teams')).not.toHaveAttribute('aria-current')
  expect(getByText('Reliability')).not.toHaveAttribute('aria-current')
})

it('IntersectionObserver intersection on reliability sets active after user scrolls', () => {
  const { MockIO, trigger } = makeObserverMock()
  vi.stubGlobal('IntersectionObserver', MockIO)
  const { getByText, rerender } = render(<SectionNav />)
  // simulate user scroll to unlock IO-driven updates
  fireEvent.scroll(window)
  trigger('reliability', true)
  rerender(<SectionNav />)
  expect(getByText('Reliability')).toHaveAttribute('aria-current', 'true')
  expect(getByText('Overview')).not.toHaveAttribute('aria-current')
})

it('IntersectionObserver is ignored before user scrolls (preserves URL param on mount)', () => {
  const { MockIO, trigger } = makeObserverMock()
  vi.stubGlobal('IntersectionObserver', MockIO)
  const { getByText, rerender } = render(<SectionNav />)
  // trigger without scrolling first — should be ignored
  trigger('teams', true)
  rerender(<SectionNav />)
  expect(getByText('Overview')).toHaveAttribute('aria-current', 'true')
  expect(getByText('Teams')).not.toHaveAttribute('aria-current')
})

it('clicking a link calls scrollIntoView and does not hard-navigate', () => {
  const scrollIntoView = vi.fn()
  const el = document.createElement('section')
  el.id = 'teams'
  el.scrollIntoView = scrollIntoView
  document.body.appendChild(el)

  const { getByText } = render(<SectionNav />)
  const originalPathname = window.location.pathname
  fireEvent.click(getByText('Teams'))
  expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' })
  // pathname unchanged - only query param updated
  expect(window.location.pathname).toBe(originalPathname)

  document.body.removeChild(el)
})

it('isIntersecting=false does not change active section', () => {
  const { MockIO, trigger } = makeObserverMock()
  vi.stubGlobal('IntersectionObserver', MockIO)
  const { getByText, rerender } = render(<SectionNav />)
  trigger('billing', false)
  rerender(<SectionNav />)
  expect(getByText('Overview')).toHaveAttribute('aria-current', 'true')
  expect(getByText('Billing')).not.toHaveAttribute('aria-current')
})

it('clicking Overview calls window.scrollTo(top:0) instead of scrollIntoView', () => {
  const scrollTo = vi.fn()
  vi.stubGlobal('scrollTo', scrollTo)
  const { getByText } = render(<SectionNav />)
  fireEvent.click(getByText('Overview'))
  expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' })
})

it('clicking a link updates the section URL param', () => {
  const el = document.createElement('section')
  el.id = 'reliability'
  el.scrollIntoView = vi.fn()
  document.body.appendChild(el)

  const { getByText } = render(<SectionNav />)
  fireEvent.click(getByText('Reliability'))
  expect(new URLSearchParams(window.location.search).get('section')).toBe('reliability')

  document.body.removeChild(el)
})

it('nav has aria-label "Dashboard navigation"', () => {
  const { container } = render(<SectionNav />)
  const nav = container.querySelector('nav')
  expect(nav?.getAttribute('aria-label')).toBe('Dashboard navigation')
})

it('ul has aria-label "Dashboard sections"', () => {
  const { container } = render(<SectionNav />)
  const ul = container.querySelector('ul')
  expect(ul?.getAttribute('aria-label')).toBe('Dashboard sections')
})

it('each link is wrapped in a li element', () => {
  const { getAllByRole } = render(<SectionNav />)
  const links = getAllByRole('link')
  for (const link of links) {
    expect(link.parentElement?.tagName).toBe('LI')
  }
})

it('nav className contains overflow-x-auto for mobile scrolling', () => {
  const { container } = render(<SectionNav />)
  const nav = container.querySelector('nav')
  expect(nav?.className).toContain('overflow-x-auto')
})

it('reads initial active section from URL param', () => {
  window.history.replaceState({}, '', '?section=billing')
  const { getByText } = render(<SectionNav />)
  expect(getByText('Billing')).toHaveAttribute('aria-current', 'true')
  expect(getByText('Overview')).not.toHaveAttribute('aria-current')
  window.history.replaceState({}, '', '/')
})
