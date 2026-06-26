import { it, expect } from 'vitest'
import { buildQueryParams } from './buildQueryParams'

it('produces correct query string without team_id', () => {
  const result = buildQueryParams({ from: '2024-01-01', to: '2024-01-31' })
  expect(result).toContain('from=2024-01-01')
  expect(result).toContain('to=2024-01-31')
  expect(result).not.toContain('team_id')
})

it('includes team_id when provided', () => {
  const result = buildQueryParams({ from: '2024-01-01', to: '2024-01-31', team_id: 'team_abc' })
  expect(result).toContain('team_id=team_abc')
})

it('omits team_id when undefined', () => {
  const result = buildQueryParams({ from: '2024-01-01', to: '2024-01-31', team_id: undefined })
  expect(result).not.toContain('team_id')
})
