import { describe, it, expect } from 'vitest'
import { Faker, en } from '@faker-js/faker'
import { generateTimeseries } from './timeseries'

function makeSeededFaker(seed: number): Faker {
  const faker = new Faker({ locale: [en] })
  faker.seed(seed)
  return faker
}

const JUNE_PARAMS = { from: '2026-06-01', to: '2026-06-30' }

describe('generateTimeseries', () => {
  it('points.length equals calendar days in range (30 for June)', () => {
    const result = generateTimeseries(makeSeededFaker(1), JUNE_PARAMS)
    expect(result.points).toHaveLength(30)
  })

  it('first point date matches params.from and last matches params.to', () => {
    const result = generateTimeseries(makeSeededFaker(1), JUNE_PARAMS)
    expect(result.points[0].date).toBe('2026-06-01')
    expect(result.points[29].date).toBe('2026-06-30')
  })

  it('input_tokens + output_tokens === tokens for every point', () => {
    const result = generateTimeseries(makeSeededFaker(1), JUNE_PARAMS)
    for (const point of result.points) {
      expect(point.input_tokens + point.output_tokens).toBe(point.tokens)
    }
  })

  it('no undefined values in any TimeseriesPoint field', () => {
    const result = generateTimeseries(makeSeededFaker(1), JUNE_PARAMS)
    for (const point of result.points) {
      expect(point.date).toBeDefined()
      expect(point.runs).toBeDefined()
      expect(point.input_tokens).toBeDefined()
      expect(point.output_tokens).toBeDefined()
      expect(point.tokens).toBeDefined()
      expect(point.cost).toBeDefined()
      expect(point.dau).toBeDefined()
      expect(point.error_rate).toBeDefined()
      // avg_quality_score is allowed to be null but must be defined (not undefined)
      expect('avg_quality_score' in point).toBe(true)
    }
  })

  it('granularity is day', () => {
    const result = generateTimeseries(makeSeededFaker(1), JUNE_PARAMS)
    expect(result.granularity).toBe('day')
  })

  it('completes in under 50ms for a 365-day range', () => {
    const faker = makeSeededFaker(42)
    const start = performance.now()
    generateTimeseries(faker, { from: '2026-01-01', to: '2026-12-31' })
    expect(performance.now() - start).toBeLessThan(50)
  })
})
