import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { signal } from '@preact/signals-react'
import { useDeepComputed } from './useDeepComputed'

describe('useDeepComputed', () => {
  it('returns a ReadonlySignal with the computed value', () => {
    const src = signal(2)
    const { result } = renderHook(() => useDeepComputed(() => src.value * 3))
    expect(result.current.value).toBe(6)
  })

  it('returns the same object reference when the new value is deeply equal', () => {
    const src = signal({ a: 1 })
    const { result } = renderHook(() =>
      useDeepComputed(() => ({ a: src.value.a }))
    )
    const firstRef = result.current.value
    act(() => {
      src.value = { a: 1 } // structurally equal, new reference
    })
    expect(result.current.value).toBe(firstRef)
  })

  it('returns a new reference when the value changes', () => {
    const src = signal(1)
    const { result } = renderHook(() =>
      useDeepComputed(() => ({ n: src.value }))
    )
    act(() => {
      src.value = 99
    })
    expect(result.current.value).toEqual({ n: 99 })
  })

  it('works with primitive return types', () => {
    const src = signal(10)
    const { result } = renderHook(() => useDeepComputed(() => src.value + 5))
    expect(result.current.value).toBe(15)
    act(() => {
      src.value = 20
    })
    expect(result.current.value).toBe(25)
  })

  it('works with array return types', () => {
    const src = signal([1, 2, 3])
    const { result } = renderHook(() => useDeepComputed(() => [...src.value]))
    const firstRef = result.current.value
    act(() => {
      src.value = [1, 2, 3] // same contents
    })
    expect(result.current.value).toBe(firstRef)
  })
})
