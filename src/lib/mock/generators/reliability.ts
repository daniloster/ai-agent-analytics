import type { Faker } from '@faker-js/faker'
import type { FilterParams, ReliabilityResponse } from '../../../types/api'

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function buildDailyArray<T>(from: string, to: string, buildEntry: (date: string) => T): T[] {
  const result: T[] = []
  const current = new Date(from + 'T00:00:00Z')
  const end = new Date(to + 'T00:00:00Z')
  while (current <= end) {
    result.push(buildEntry(current.toISOString().slice(0, 10)))
    current.setUTCDate(current.getUTCDate() + 1)
  }
  return result
}

function buildErrorTypeBreakdown(faker: Faker): ReliabilityResponse['error_type_breakdown'] {
  const types = ['context_overflow', 'tool_failure', 'rate_limit', 'infrastructure'] as const
  const counts = types.map(() => faker.number.int({ min: 10, max: 500 }))
  const totalCount = counts.reduce((a, b) => a + b, 0)

  // Integer percentages summing to exactly 100
  const percentages: number[] = []
  let remaining = 100
  for (let i = 0; i < types.length - 1; i++) {
    const pct = Math.round((counts[i] / totalCount) * 100)
    const clamped = clamp(pct, 1, remaining - (types.length - i - 1))
    percentages.push(clamped)
    remaining -= clamped
  }
  percentages.push(remaining)

  return types.map((type, i) => ({
    type,
    count: counts[i],
    percentage: percentages[i],
  }))
}

export function generateReliability(faker: Faker, params: FilterParams): ReliabilityResponse {
  const errorRate = clamp(faker.number.float({ min: 0.5, max: 15, fractionDigits: 2 }), 0, 100)
  const errorRatePrior = clamp(faker.number.float({ min: 0.5, max: 18, fractionDigits: 2 }), 0, 100)
  const timeoutRate = clamp(faker.number.float({ min: 0.1, max: 8, fractionDigits: 2 }), 0, 100)
  const retryRate = clamp(faker.number.float({ min: 1, max: 20, fractionDigits: 2 }), 0, 100)
  const platformAvailability = clamp(faker.number.float({ min: 95, max: 99.99, fractionDigits: 3 }), 0, 100)

  const p50 = faker.number.int({ min: 1000, max: 30000 })
  const p95 = faker.number.int({ min: p50, max: p50 * 4 })
  const p99 = faker.number.int({ min: p95, max: p95 * 3 })

  const availabilityByDay = buildDailyArray(params.from, params.to, (date) => ({
    date,
    uptime_pct: clamp(faker.number.float({ min: 90, max: 100, fractionDigits: 3 }), 0, 100),
  }))

  // error_trend_7d: at least 7 entries regardless of range
  const trendDays = Math.max(7, availabilityByDay.length)
  const trendStart = new Date(params.from + 'T00:00:00Z')
  trendStart.setUTCDate(trendStart.getUTCDate() - (trendDays - availabilityByDay.length))
  const errorTrend7d = buildDailyArray(
    trendStart.toISOString().slice(0, 10),
    params.to,
    (date) => ({
      date,
      error_rate: clamp(faker.number.float({ min: 0, max: 20, fractionDigits: 2 }), 0, 100),
    }),
  )

  const incidentCount = faker.number.int({ min: 0, max: 3 })
  const incidents: ReliabilityResponse['incidents'] = []
  for (let i = 0; i < incidentCount; i++) {
    const resolved = faker.datatype.boolean()
    const mttr = resolved ? faker.number.int({ min: 5, max: 240 }) : null
    incidents.push({
      detected_at: faker.date.recent({ days: 30 }).toISOString(),
      resolved_at: resolved ? faker.date.recent({ days: 29 }).toISOString() : null,
      mttr_minutes: mttr,
      error_type: faker.helpers.arrayElement(['context_overflow', 'tool_failure', 'rate_limit', 'infrastructure']),
    })
  }

  const resolvedMttrs = incidents
    .map((inc) => inc.mttr_minutes)
    .filter((m): m is number => m !== null)
  const mttrMinutes = resolvedMttrs.length > 0
    ? resolvedMttrs.reduce((a, b) => a + b, 0) / resolvedMttrs.length
    : null

  return {
    period: { from: params.from, to: params.to },
    error_rate: errorRate,
    error_rate_prior: errorRatePrior,
    timeout_rate: timeoutRate,
    p50_duration_ms: p50,
    p95_duration_ms: p95,
    p99_duration_ms: p99,
    queue_wait_ms: faker.number.int({ min: 100, max: 5000 }),
    error_type_breakdown: buildErrorTypeBreakdown(faker),
    retry_rate: retryRate,
    platform_availability: platformAvailability,
    availability_by_day: availabilityByDay,
    error_trend_7d: errorTrend7d,
    mttr_minutes: mttrMinutes,
    incidents,
    cost_of_failed_runs: faker.number.float({ min: 10, max: 5000, fractionDigits: 2 }),
  }
}
