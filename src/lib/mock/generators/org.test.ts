import { describe, it, expect } from 'vitest'
import { generateTeamsList, generateOrgConfig } from './org'

describe('generateTeamsList', () => {
  it('returns exactly 4 teams', () => {
    expect(generateTeamsList()).toHaveLength(4)
  })

  it('each team has id, name, seat_count, member_count', () => {
    for (const team of generateTeamsList()) {
      expect(typeof team.id).toBe('string')
      expect(typeof team.name).toBe('string')
      expect(typeof team.seat_count).toBe('number')
      expect(typeof team.member_count).toBe('number')
    }
  })

  it('all team ids are unique', () => {
    const ids = generateTeamsList().map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('returns a fresh array on each call', () => {
    const a = generateTeamsList()
    const b = generateTeamsList()
    expect(a).not.toBe(b)
    expect(a).toEqual(b)
  })
})

describe('generateOrgConfig', () => {
  it('billing_model is hybrid_token_seat', () => {
    expect(generateOrgConfig().billing_model).toBe('hybrid_token_seat')
  })

  it('seat_count equals sum of all team seat_count values', () => {
    const teamTotal = generateTeamsList().reduce((sum: number, t) => sum + t.seat_count, 0)
    expect(generateOrgConfig().seat_count).toBe(teamTotal)
  })

  it('org_id is a non-empty string', () => {
    const { org_id } = generateOrgConfig()
    expect(typeof org_id).toBe('string')
    expect(org_id.length).toBeGreaterThan(0)
  })
})
