import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import * as runtime from '@preact/signals-react/runtime'
import { useSignals } from './useSignals'

describe('useSignals', () => {
  it('is callable without throwing', () => {
    expect(() => renderHook(() => useSignals())).not.toThrow()
  })

  it('delegates to @preact/signals-react/runtime useSignals exactly once per call', () => {
    const runtimeUseSignals = vi.mocked(runtime.useSignals)
    runtimeUseSignals.mockClear()
    renderHook(() => useSignals())
    expect(runtimeUseSignals).toHaveBeenCalledOnce()
  })
})
