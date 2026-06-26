import { useComputed } from '@preact/signals-react'
import type { ReadonlySignal } from '@preact/signals-react'
import { useRef } from 'react'
import equal from 'react-fast-compare'

// See ARCHITECTURE.md §3.2.1 for rationale.
// Use for all non-JSX derived values (primitives, objects, arrays).
// Do NOT use when returning JSX - use useComputed from @preact/signals-react directly.
export function useDeepComputed<T>(fn: () => T): ReadonlySignal<T> {
  const prev = useRef<{ v: T } | undefined>(undefined)
  return useComputed(() => {
    const next = fn()
    if (prev.current !== undefined && equal(prev.current.v, next)) {
      return prev.current.v
    }
    prev.current = { v: next }
    return next
  })
}
