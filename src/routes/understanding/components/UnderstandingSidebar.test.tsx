import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { UnderstandingSidebar } from './UnderstandingSidebar'

// Section elements for IntersectionObserver to observe
function mountSections() {
  const ids = ['about', 'premise', 'kpis', 'decisions', 'tech', 'scope', 'glossary']
  ids.forEach((id) => {
    const el = document.createElement('section')
    el.id = id
    document.body.appendChild(el)
  })
  return () => {
    ids.forEach((id) => {
      document.getElementById(id)?.remove()
    })
  }
}

let disconnectSpy: ReturnType<typeof vi.fn>
let observeSpy: ReturnType<typeof vi.fn>

beforeEach(() => {
  disconnectSpy = vi.fn()
  observeSpy = vi.fn()
  const MockIO = vi.fn().mockImplementation(() => ({
    observe: observeSpy,
    disconnect: disconnectSpy,
    unobserve: vi.fn(),
  }))
  vi.stubGlobal('IntersectionObserver', MockIO)
  // jsdom does not implement scrollIntoView
  window.HTMLElement.prototype.scrollIntoView = vi.fn()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function renderSidebar() {
  const cleanup = mountSections()
  const result = render(
    <MemoryRouter>
      <UnderstandingSidebar />
    </MemoryRouter>,
  )
  return { ...result, cleanup }
}

describe('UnderstandingSidebar', () => {
  it('renders exactly 7 anchor links inside the nav', () => {
    const { cleanup } = renderSidebar()
    const nav = screen.getByRole('navigation', { name: 'Page navigation' })
    const links = nav.querySelectorAll('a')
    expect(links.length).toBe(7)
    cleanup()
  })

  it('"Back to Dashboard" link points to "/"', () => {
    const { cleanup } = renderSidebar()
    const backLink = screen.getByText('Back to Dashboard')
    expect(backLink.closest('a')?.getAttribute('href')).toBe('/')
    cleanup()
  })

  it('"About This Dashboard" link has aria-current="true" on initial render', () => {
    const { cleanup } = renderSidebar()
    const nav = screen.getByRole('navigation', { name: 'Page navigation' })
    const aboutLink = nav.querySelector('a[href="#about"]')
    expect(aboutLink?.getAttribute('aria-current')).toBe('true')
    cleanup()
  })

  it('other links do NOT have aria-current on initial render', () => {
    const { cleanup } = renderSidebar()
    const nav = screen.getByRole('navigation', { name: 'Page navigation' })
    const kpisLink = nav.querySelector('a[href="#kpis"]')
    expect(kpisLink?.getAttribute('aria-current')).toBeNull()
    cleanup()
  })

  it('clicking "KPI & Metric Catalog" calls scrollIntoView on the kpis element', () => {
    const { cleanup } = renderSidebar()
    const kpisEl = document.getElementById('kpis')
    const scrollSpy = vi.fn()
    if (kpisEl) kpisEl.scrollIntoView = scrollSpy

    const nav = screen.getByRole('navigation', { name: 'Page navigation' })
    const kpisLink = nav.querySelector('a[href="#kpis"]') as HTMLElement
    fireEvent.click(kpisLink)

    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth' })
    cleanup()
  })

  it('after clicking "KPI & Metric Catalog", that link gets aria-current="true"', () => {
    const { rerender, cleanup } = renderSidebar()
    const nav = screen.getByRole('navigation', { name: 'Page navigation' })
    const kpisLink = nav.querySelector('a[href="#kpis"]') as HTMLElement
    fireEvent.click(kpisLink)
    rerender(
      <MemoryRouter>
        <UnderstandingSidebar />
      </MemoryRouter>,
    )
    expect(kpisLink.getAttribute('aria-current')).toBe('true')
    cleanup()
  })

  it('IntersectionObserver is disconnected on unmount', () => {
    const { unmount, cleanup } = renderSidebar()
    unmount()
    expect(disconnectSpy).toHaveBeenCalled()
    cleanup()
  })

  it('aside element has "fixed" and "w-60" in its className', () => {
    const { container, cleanup } = renderSidebar()
    const aside = container.querySelector('aside')
    expect(aside?.className).toContain('fixed')
    expect(aside?.className).toContain('w-60')
    cleanup()
  })
})
