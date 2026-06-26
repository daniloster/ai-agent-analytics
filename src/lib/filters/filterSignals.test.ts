import { it, expect, beforeEach, vi } from 'vitest'
import { dateRange, teamId, filterQueryParams, initFiltersFromUrl, syncFiltersToUrl } from './filterSignals'

function resetSignals() {
  const to = new Date()
  const from = new Date(to)
  from.setDate(from.getDate() - 29)
  dateRange.value = {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
    preset: '30d',
  }
  teamId.value = undefined
}

beforeEach(() => {
  resetSignals()
  vi.restoreAllMocks()
})

it('initFiltersFromUrl parses all four URL params', () => {
  vi.stubGlobal('location', { search: '?from=2026-06-01&to=2026-06-26&preset=custom&team=team_002' })
  initFiltersFromUrl()
  expect(dateRange.value).toEqual({ from: '2026-06-01', to: '2026-06-26', preset: 'custom' })
  expect(teamId.value).toBe('team_002')
})

it('initFiltersFromUrl with no query string leaves signals at defaults', () => {
  vi.stubGlobal('location', { search: '' })
  const before = { ...dateRange.value }
  initFiltersFromUrl()
  expect(dateRange.value).toEqual(before)
  expect(teamId.value).toBeUndefined()
})

it('filterQueryParams returns same reference when signals unchanged', () => {
  const first = filterQueryParams.value
  const second = filterQueryParams.value
  expect(first).toBe(second)
})

it('filterQueryParams returns new reference after dateRange mutation', () => {
  const first = filterQueryParams.value
  dateRange.value = { from: '2026-01-01', to: '2026-01-31', preset: 'custom' }
  const second = filterQueryParams.value
  expect(second).not.toBe(first)
  expect(second.from).toBe('2026-01-01')
})

it('syncFiltersToUrl includes all params when teamId is set', () => {
  const replaceState = vi.fn()
  vi.stubGlobal('history', { replaceState })
  dateRange.value = { from: '2026-06-01', to: '2026-06-26', preset: 'custom' }
  teamId.value = 'team_002'
  syncFiltersToUrl()
  expect(replaceState).toHaveBeenCalledOnce()
  const url: string = replaceState.mock.calls[0][2]
  expect(url).toContain('from=2026-06-01')
  expect(url).toContain('to=2026-06-26')
  expect(url).toContain('preset=custom')
  expect(url).toContain('team=team_002')
})

it('syncFiltersToUrl omits team param when teamId is undefined', () => {
  const replaceState = vi.fn()
  vi.stubGlobal('history', { replaceState })
  teamId.value = undefined
  syncFiltersToUrl()
  const url: string = replaceState.mock.calls[0][2]
  expect(url).not.toContain('team=')
})

it('initFiltersFromUrl with malformed date param does not throw or mutate', () => {
  vi.stubGlobal('location', { search: '?from=not-a-date&to=also-bad' })
  const before = { ...dateRange.value }
  expect(() => initFiltersFromUrl()).not.toThrow()
  expect(dateRange.value).toEqual(before)
})
