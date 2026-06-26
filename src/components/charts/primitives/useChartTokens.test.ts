import { it, expect, vi, beforeEach } from 'vitest'
import { useChartTokens } from './useChartTokens'

beforeEach(() => {
  vi.restoreAllMocks()
})

it('returns an object with exactly 9 keys', () => {
  const tokens = useChartTokens()
  expect(Object.keys(tokens)).toHaveLength(9)
})

it('success is #22c55e and warning is #f59e0b', () => {
  const tokens = useChartTokens()
  expect(tokens.success).toBe('#22c55e')
  expect(tokens.warning).toBe('#f59e0b')
})

it('primary token contains hsl(var(--primary))', () => {
  const tokens = useChartTokens()
  expect(tokens.primary).toBe('hsl(var(--primary))')
})

it('primaryFaded contains hsl(var(--primary) / 0.2)', () => {
  const tokens = useChartTokens()
  expect(tokens.primaryFaded).toBe('hsl(var(--primary) / 0.2)')
})

it('all non-hardcoded tokens contain hsl(var(--', () => {
  const tokens = useChartTokens()
  const cssVarTokens = [
    tokens.primary,
    tokens.primaryFaded,
    tokens.secondary,
    tokens.muted,
    tokens.border,
    tokens.background,
    tokens.destructive,
  ]
  for (const token of cssVarTokens) {
    expect(token).toContain('hsl(var(--')
  }
})
