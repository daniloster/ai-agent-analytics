import { describe, it, expect } from 'vitest'
import { Faker, en } from '@faker-js/faker'
import { generateReliability } from './reliability'

function makeSeededFaker(seed: number): Faker {
  const faker = new Faker({ locale: [en] })
  faker.seed(seed)
  return faker
}

describe('generateReliability', () => {
  it('availability_by_day has 30 entries for June', () => {
    const result = generateReliability(makeSeededFaker(1), { from: '2026-06-01', to: '2026-06-30' })
    expect(result.availability_by_day).toHaveLength(30)
  })

  it('availability_by_day has 1 entry for a single-day range', () => {
    const result = generateReliability(makeSeededFaker(1), { from: '2026-01-01', to: '2026-01-01' })
    expect(result.availability_by_day).toHaveLength(1)
  })

  it('each uptime_pct is in [0, 100]', () => {
    const result = generateReliability(makeSeededFaker(1), { from: '2026-06-01', to: '2026-06-30' })
    for (const entry of result.availability_by_day) {
      expect(entry.uptime_pct).toBeGreaterThanOrEqual(0)
      expect(entry.uptime_pct).toBeLessThanOrEqual(100)
    }
  })

  it('error_type_breakdown percentages sum to exactly 100', () => {
    for (let seed = 0; seed < 10; seed++) {
      const result = generateReliability(makeSeededFaker(seed), { from: '2026-06-01', to: '2026-06-30' })
      const sum = result.error_type_breakdown.reduce((acc: number, e) => acc + e.percentage, 0)
      expect(sum).toBe(100)
    }
  })

  it('error_type_breakdown contains all 5 required types', () => {
    const result = generateReliability(makeSeededFaker(1), { from: '2026-06-01', to: '2026-06-30' })
    const types = result.error_type_breakdown.map((e) => e.type)
    expect(types).toContain('model_error')
    expect(types).toContain('timeout')
    expect(types).toContain('tool_call_failure')
    expect(types).toContain('rate_limit')
    expect(types).toContain('other')
  })

  it('error_trend_7d has at least 7 entries', () => {
    const result = generateReliability(makeSeededFaker(1), { from: '2026-06-01', to: '2026-06-30' })
    expect(result.error_trend_7d.length).toBeGreaterThanOrEqual(7)
  })

  it('mttr_minutes is null when incidents array is empty', () => {
    // Try multiple seeds until we get one with no incidents
    let found = false
    for (let seed = 0; seed < 100; seed++) {
      const result = generateReliability(makeSeededFaker(seed), { from: '2026-06-01', to: '2026-06-30' })
      if (result.incidents.length === 0) {
        expect(result.mttr_minutes).toBeNull()
        found = true
        break
      }
    }
    expect(found).toBe(true)
  })

  it('majority of availability_by_day entries are >= 99.9 (green zone)', () => {
    // Fixed seed - deterministic check that distribution is mostly green
    const result = generateReliability(makeSeededFaker(7), { from: '2026-06-01', to: '2026-06-30' })
    const greenCount = result.availability_by_day.filter((d) => d.uptime_pct >= 99.9).length
    expect(greenCount / result.availability_by_day.length).toBeGreaterThanOrEqual(0.6)
  })

  it('completes in under 50ms for a 365-day range', () => {
    const faker = makeSeededFaker(42)
    const start = performance.now()
    generateReliability(faker, { from: '2026-01-01', to: '2026-12-31' })
    expect(performance.now() - start).toBeLessThan(50)
  })
})
