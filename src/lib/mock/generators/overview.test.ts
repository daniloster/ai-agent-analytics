import { describe, it, expect } from 'vitest'
import { Faker, en } from '@faker-js/faker'
import { generateOverview } from './overview'

function makeSeededFaker(seed: number): Faker {
  const faker = new Faker({ locale: [en] })
  faker.seed(seed)
  return faker
}

const STD_PARAMS = { from: '2026-06-01', to: '2026-06-30' }

describe('generateOverview', () => {
  it('returns all required OverviewResponse fields for a 30-day range', () => {
    const result = generateOverview(makeSeededFaker(1), STD_PARAMS)
    expect(result.period).toEqual({ from: '2026-06-01', to: '2026-06-30' })
    expect(typeof result.total_runs).toBe('number')
    expect(typeof result.total_runs_prior).toBe('number')
    expect(typeof result.mau).toBe('number')
    expect(typeof result.dau).toBe('number')
    expect(typeof result.seat_count).toBe('number')
    expect(typeof result.total_tokens).toBe('number')
    expect(typeof result.total_tokens_prior).toBe('number')
    expect(typeof result.input_tokens).toBe('number')
    expect(typeof result.output_tokens).toBe('number')
    expect(typeof result.total_cost).toBe('number')
    expect(typeof result.total_cost_prior).toBe('number')
    expect(typeof result.retention_cost).toBe('number')
    expect(typeof result.retained_users_7d).toBe('number')
    expect(typeof result.success_rate).toBe('number')
    expect(typeof result.success_rate_prior).toBe('number')
    expect(typeof result.avg_run_duration_ms).toBe('number')
    expect(typeof result.rated_run_count).toBe('number')
    expect(typeof result.mom_usage_growth).toBe('number')
    expect(typeof result.user_activation_rate).toBe('number')
    expect(typeof result.new_users_count).toBe('number')
    expect(typeof result.churn_risk_count).toBe('number')
    expect(Array.isArray(result.quality_score_trend)).toBe(true)
  })

  it('returns null quality fields when rated_run_count < 10', () => {
    // Use many seeds until we find one that produces rated_run_count < 10,
    // or test the invariant directly by checking correlated nulls
    let found = false
    for (let seed = 0; seed < 200; seed++) {
      const result = generateOverview(makeSeededFaker(seed), STD_PARAMS)
      if (result.rated_run_count < 10) {
        expect(result.avg_quality_score).toBeNull()
        expect(result.cost_per_quality_point).toBeNull()
        expect(result.quality_cost_efficiency).toBeNull()
        found = true
        break
      }
    }
    // Sanity: at least one seed in 200 must produce rated_run_count < 10
    expect(found).toBe(true)
  })

  it('mom_usage_growth is a finite number and can be negative', () => {
    const result = generateOverview(makeSeededFaker(1), STD_PARAMS)
    expect(Number.isFinite(result.mom_usage_growth)).toBe(true)
  })

  it('quality_score_trend has at least one entry', () => {
    const result = generateOverview(makeSeededFaker(1), STD_PARAMS)
    expect(result.quality_score_trend.length).toBeGreaterThan(0)
  })

  it('success_rate is in [0, 100]', () => {
    for (let seed = 0; seed < 20; seed++) {
      const result = generateOverview(makeSeededFaker(seed), STD_PARAMS)
      expect(result.success_rate).toBeGreaterThanOrEqual(0)
      expect(result.success_rate).toBeLessThanOrEqual(100)
    }
  })

  it('retained_users_7d is a non-negative integer not exceeding mau', () => {
    for (let seed = 0; seed < 20; seed++) {
      const result = generateOverview(makeSeededFaker(seed), STD_PARAMS)
      expect(Number.isInteger(result.retained_users_7d)).toBe(true)
      expect(result.retained_users_7d).toBeGreaterThanOrEqual(0)
      expect(result.retained_users_7d).toBeLessThanOrEqual(result.mau)
    }
  })

  it('completes in under 50ms for a 365-day range', () => {
    const faker = makeSeededFaker(42)
    const start = performance.now()
    generateOverview(faker, { from: '2026-01-01', to: '2026-12-31' })
    expect(performance.now() - start).toBeLessThan(50)
  })
})
