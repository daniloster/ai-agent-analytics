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
    savedCallback?.([{ isIntersecting, target: el } as IntersectionObserverEntry])
  }
  return { MockIO, disconnect, observe, trigger }
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.stubGlobal('IntersectionObserver', makeObserverMock().MockIO)
})

afterEach(() => {
  vi.unstubAllGlobals()
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

it('IntersectionObserver intersection on reliability sets active', () => {
  const { MockIO, trigger } = makeObserverMock()
  vi.stubGlobal('IntersectionObserver', MockIO)
  const { getByText, rerender } = render(<SectionNav />)
  trigger('reliability', true)
  rerender(<SectionNav />)
  expect(getByText('Reliability')).toHaveAttribute('aria-current', 'true')
  expect(getByText('Overview')).not.toHaveAttribute('aria-current')
})

it('clicking a link calls scrollIntoView and does not navigate', () => {
  const scrollIntoView = vi.fn()
  const el = document.createElement('section')
  el.id = 'teams'
  el.scrollIntoView = scrollIntoView
  document.body.appendChild(el)

  const { getByText } = render(<SectionNav />)
  const originalHref = window.location.href
  fireEvent.click(getByText('Teams'))
  expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' })
  expect(window.location.href).toBe(originalHref)

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
