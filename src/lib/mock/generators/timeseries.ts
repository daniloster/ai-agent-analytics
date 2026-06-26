import type { Faker } from '@faker-js/faker'
import type { FilterParams, TimeseriesResponse, TimeseriesPoint } from '../../../types/api'

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function buildPoint(faker: Faker, date: string): TimeseriesPoint {
  const inputTokens = faker.number.int({ min: 10000, max: 500000 })
  const outputTokens = faker.number.int({ min: 5000, max: 200000 })
  const isNull = faker.number.int({ min: 0, max: 4 }) === 0
  return {
    date,
    runs: faker.number.int({ min: 10, max: 2000 }),
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    tokens: inputTokens + outputTokens,
    cost: faker.number.float({ min: 5, max: 2000, fractionDigits: 2 }),
    avg_quality_score: isNull ? null : faker.number.float({ min: 1, max: 5, fractionDigits: 2 }),
    error_rate: clamp(faker.number.float({ min: 0, max: 20, fractionDigits: 2 }), 0, 100),
  }
}

export function generateTimeseries(faker: Faker, params: FilterParams): TimeseriesResponse {
  const points: TimeseriesPoint[] = []
  const current = new Date(params.from + 'T00:00:00Z')
  const end = new Date(params.to + 'T00:00:00Z')
  while (current <= end) {
    points.push(buildPoint(faker, current.toISOString().slice(0, 10)))
    current.setUTCDate(current.getUTCDate() + 1)
  }
  return {
    period: { from: params.from, to: params.to },
    granularity: 'day',
    points,
  }
}
