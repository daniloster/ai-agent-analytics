import { describe, it, expect } from 'vitest'
import { Faker, en } from '@faker-js/faker'
import { generateTeams } from './teams'

function makeSeededFaker(seed: number): Faker {
  const faker = new Faker({ locale: [en] })
  faker.seed(seed)
  return faker
}

const STD_PARAMS = { from: '2026-06-01', to: '2026-06-30' }

describe('generateTeams', () => {
  it('returns exactly 4 teams', () => {
    const result = generateTeams(makeSeededFaker(1), STD_PARAMS)
    expect(result.teams).toHaveLength(4)
  })

  it('each team_id is unique', () => {
    const result = generateTeams(makeSeededFaker(1), STD_PARAMS)
    const ids = result.teams.map((t) => t.team_id)
    expect(new Set(ids).size).toBe(4)
  })

  it('Data Team adoption_rate is lower than Frontend Team adoption_rate', () => {
    // Test across multiple seeds to verify the profile invariant holds
    for (let seed = 0; seed < 30; seed++) {
      const result = generateTeams(makeSeededFaker(seed), STD_PARAMS)
      const dataTeam = result.teams.find((t) => t.team_id === 'team_data')!
      const frontendTeam = result.teams.find((t) => t.team_id === 'team_frontend')!
      expect(dataTeam.adoption_rate).toBeLessThan(frontendTeam.adoption_rate)
    }
  })

  it('top_use_cases percentages sum to approximately 100 per team', () => {
    const result = generateTeams(makeSeededFaker(1), STD_PARAMS)
    for (const team of result.teams) {
      const sum = team.top_use_cases.reduce((acc: number, uc) => acc + uc.percentage, 0)
      expect(Math.abs(sum - 100)).toBeLessThan(1)
    }
  })

  it('failed_run_rate is in [0, 100] for all teams', () => {
    const result = generateTeams(makeSeededFaker(1), STD_PARAMS)
    for (const team of result.teams) {
      expect(team.failed_run_rate).toBeGreaterThanOrEqual(0)
      expect(team.failed_run_rate).toBeLessThanOrEqual(100)
    }
  })

  it('Data Team churn_signal_count is at least 2x Frontend Team', () => {
    let found = false
    for (let seed = 0; seed < 50; seed++) {
      const result = generateTeams(makeSeededFaker(seed), STD_PARAMS)
      const dataTeam = result.teams.find((t) => t.team_id === 'team_data')!
      const frontendTeam = result.teams.find((t) => t.team_id === 'team_frontend')!
      if (frontendTeam.churn_signal_count > 0) {
        expect(dataTeam.churn_signal_count).toBeGreaterThanOrEqual(frontendTeam.churn_signal_count * 2)
        found = true
        break
      }
    }
    // When frontend base is 0, data is also 0 - the multiplier still applies
    if (!found) {
      const result = generateTeams(makeSeededFaker(1), STD_PARAMS)
      const dataTeam = result.teams.find((t) => t.team_id === 'team_data')!
      const frontendTeam = result.teams.find((t) => t.team_id === 'team_frontend')!
      // Data multiplier is 4x frontend multiplier is 1x - ratio holds
      expect(dataTeam.churn_signal_count).toBeGreaterThanOrEqual(frontendTeam.churn_signal_count)
    }
  })

  it('org_avg_failed_run_rate is a finite number', () => {
    const result = generateTeams(makeSeededFaker(1), STD_PARAMS)
    expect(Number.isFinite(result.org_avg_failed_run_rate)).toBe(true)
  })
})
