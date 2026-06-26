import { it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render } from '@testing-library/react'
import { Section } from './Section'

type IOCallback = (entries: IntersectionObserverEntry[]) => void

function makeObserverMock() {
  let savedCallback: IOCallback | null = null
  const disconnect = vi.fn()
  const observe = vi.fn()

  const MockIO = vi.fn((cb: IOCallback) => {
    savedCallback = cb
    return { observe, disconnect }
  })

  function triggerIntersection(isIntersecting: boolean, target: Element) {
    savedCallback?.([{ isIntersecting, target } as IntersectionObserverEntry])
  }

  return { MockIO, disconnect, observe, triggerIntersection }
}

function renderSection(id: Parameters<typeof Section>[0]['id'] = 'overview') {
  const { MockIO, disconnect, observe, triggerIntersection } = makeObserverMock()
  vi.stubGlobal('IntersectionObserver', MockIO)
  const result = render(
    <Section id={id} labelledBy={`${id}-heading`}>
      <p>content</p>
    </Section>,
  )
  return { ...result, disconnect, observe, triggerIntersection }
}

beforeEach(() => {
  vi.restoreAllMocks()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

it('initial render shows SectionSkeleton, not children', () => {
  const { container, queryByText } = renderSection()
  expect(container.querySelector('.animate-pulse')).not.toBeNull()
  expect(queryByText('content')).toBeNull()
})

it('after IntersectionObserver fires isIntersecting=true, children render', () => {
  const { container, getByText, rerender, triggerIntersection } = renderSection()
  triggerIntersection(true, container.querySelector('section')!)
  // rerender forces React to read the now-mutated signal value
  rerender(
    <Section id="overview" labelledBy="overview-heading">
      <p>content</p>
    </Section>,
  )
  expect(getByText('content')).toBeTruthy()
  expect(container.querySelector('.animate-pulse')).toBeNull()
})

it('observer.disconnect called after intersection', () => {
  const { container, disconnect, triggerIntersection, rerender } = renderSection()
  triggerIntersection(true, container.querySelector('section')!)
  rerender(
    <Section id="overview" labelledBy="overview-heading">
      <p>content</p>
    </Section>,
  )
  expect(disconnect).toHaveBeenCalledOnce()
})

it('section element has correct id and aria-labelledby', () => {
  const { container } = renderSection('reliability')
  const section = container.querySelector('section')
  expect(section?.id).toBe('reliability')
  expect(section?.getAttribute('aria-labelledby')).toBe('reliability-heading')
})

it('isIntersecting=false does not mount children', () => {
  const { container, queryByText, rerender, triggerIntersection } = renderSection()
  triggerIntersection(false, container.querySelector('section')!)
  rerender(
    <Section id="overview" labelledBy="overview-heading">
      <p>content</p>
    </Section>,
  )
  expect(queryByText('content')).toBeNull()
  expect(container.querySelector('.animate-pulse')).not.toBeNull()
})
