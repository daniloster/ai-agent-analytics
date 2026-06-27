import { it, expect } from 'vitest'
import { TEAM_COLORS, teamColor } from './teamColors'

it('TEAM_COLORS has entries for all four teams', () => {
  expect(TEAM_COLORS['team_platform']).toBeDefined()
  expect(TEAM_COLORS['team_backend']).toBeDefined()
  expect(TEAM_COLORS['team_frontend']).toBeDefined()
  expect(TEAM_COLORS['team_data']).toBeDefined()
})

it('teamColor returns correct color for known team_id', () => {
  expect(teamColor('team_platform')).toBe('#3b82f6')
  expect(teamColor('team_backend')).toBe('#10b981')
  expect(teamColor('team_frontend')).toBe('#8b5cf6')
  expect(teamColor('team_data')).toBe('#f59e0b')
})

it('teamColor falls back for unknown team_id', () => {
  const result = teamColor('team_unknown')
  expect(result).toBeTruthy()
  expect(result.startsWith('#')).toBe(true)
})

it('teamColor fallback varies by index', () => {
  const c0 = teamColor('team_unknown_x', 0)
  const c1 = teamColor('team_unknown_x', 1)
  expect(c0).not.toBe(c1)
})
