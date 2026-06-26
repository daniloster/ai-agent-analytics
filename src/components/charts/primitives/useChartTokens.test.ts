import { it, expect, vi, beforeEach } from 'vitest'
import { useChartTokens } from './useChartTokens'

beforeEach(() => {
  vi.restoreAllMocks()
})

it('returns an object with exactly 9 keys', () => {
  const tokens = useChartTokens()
  expect(Object.keys(tokens)).toHaveLength(9)
})

it('success is #22c55e and warning is #d97706', () => {
  const tokens = useChartTokens()
  expect(tokens.success).toBe('#22c55e')
  expect(tokens.warning).toBe('#d97706')
})

it('primary is wireframe blue #2563eb', () => {
  const tokens = useChartTokens()
  expect(tokens.primary).toBe('#2563eb')
})

it('primaryFaded uses wireframe blue with 0.15 opacity', () => {
  const tokens = useChartTokens()
  expect(tokens.primaryFaded).toBe('rgba(37, 99, 235, 0.15)')
})

it('secondary is wireframe teal #0d9488', () => {
  const tokens = useChartTokens()
  expect(tokens.secondary).toBe('#0d9488')
})

it('adaptive tokens use CSS variables for dark mode support', () => {
  const tokens = useChartTokens()
  const cssVarTokens = [tokens.muted, tokens.border, tokens.background, tokens.destructive]
  for (const token of cssVarTokens) {
    expect(token).toContain('hsl(var(--')
  }
})
