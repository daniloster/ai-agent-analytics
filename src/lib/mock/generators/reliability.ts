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
  const types = ['model_error', 'timeout', 'tool_call_failure', 'rate_limit', 'other'] as const
  const counts = types.map(() => faker.number.int({ min: 10, max: 500 }))
  const totalCount = counts.reduce((a, b) => a + b, 0)

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
  const timeoutRatePrior = clamp(faker.number.float({ min: 0.1, max: 10, fractionDigits: 2 }), 0, 100)
  const retryRate = clamp(faker.number.float({ min: 1, max: 20, fractionDigits: 2 }), 0, 100)
  const retryRatePrior = clamp(faker.number.float({ min: 1, max: 22, fractionDigits: 2 }), 0, 100)
  const platformAvailability = clamp(faker.number.float({ min: 95, max: 99.99, fractionDigits: 3 }), 0, 100)

  const p50 = faker.number.int({ min: 1000, max: 30000 })
  const p50Prior = faker.number.int({ min: 1000, max: 30000 })
  const p95 = faker.number.int({ min: p50, max: p50 * 4 })
  const p95Prior = faker.number.int({ min: p50Prior, max: p50Prior * 4 })
  const p99 = faker.number.int({ min: p95, max: p95 * 3 })
  const p99Prior = faker.number.int({ min: p95Prior, max: p95Prior * 3 })

  const availabilityByDay = buildDailyArray(params.from, params.to, (date) => ({
    date,
    uptime_pct: clamp(faker.number.float({ min: 90, max: 100, fractionDigits: 3 }), 0, 100),
  }))

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

  const timeoutRateTrend = buildDailyArray(params.from, params.to, (date) => ({
    date,
    value: clamp(faker.number.float({ min: 0, max: 10, fractionDigits: 2 }), 0, 100),
  }))

  const p50DurationTrend = buildDailyArray(params.from, params.to, (date) => ({
    date,
    value: faker.number.int({ min: 1000, max: 30000 }),
  }))

  const p95DurationTrend = buildDailyArray(params.from, params.to, (date) => ({
    date,
    value: faker.number.int({ min: 5000, max: 80000 }),
  }))

  const p99DurationTrend = buildDailyArray(params.from, params.to, (date) => ({
    date,
    value: faker.number.int({ min: 10000, max: 200000 }),
  }))

  const retryRateTrend = buildDailyArray(params.from, params.to, (date) => ({
    date,
    value: clamp(faker.number.float({ min: 0, max: 25, fractionDigits: 2 }), 0, 100),
  }))

  const mttrTrend = buildDailyArray(params.from, params.to, (date) => ({
    date,
    value: faker.number.int({ min: 0, max: 180 }),
  }))

  const costOfFailedRunsTrend = buildDailyArray(params.from, params.to, (date) => ({
    date,
    value: faker.number.float({ min: 0, max: 300, fractionDigits: 2 }),
  }))

  const incidentCount = faker.number.int({ min: 0, max: 3 })
  const incidents: ReliabilityResponse['incidents'] = []
  for (let i = 0; i < incidentCount; i++) {
    const resolved = faker.datatype.boolean()
    const mttr = resolved ? faker.number.int({ min: 5, max: 240 }) : null
    incidents.push({
      detected_at: faker.date.recent({ days: 30 }).toISOString(),
      resolved_at: resolved ? faker.date.recent({ days: 29 }).toISOString() : null,
      mttr_minutes: mttr,
      error_type: faker.helpers.arrayElement(['model_error', 'timeout', 'tool_call_failure', 'rate_limit', 'other']),
    })
  }

  const resolvedMttrs = incidents
    .map((inc) => inc.mttr_minutes)
    .filter((m): m is number => m !== null)
  const mttrMinutes = resolvedMttrs.length > 0
    ? resolvedMttrs.reduce((a, b) => a + b, 0) / resolvedMttrs.length
    : null
  const mttrMinutesPrior = faker.datatype.boolean()
    ? faker.number.float({ min: 5, max: 120, fractionDigits: 1 })
    : null

  const costOfFailedRuns = faker.number.float({ min: 10, max: 5000, fractionDigits: 2 })
  const costOfFailedRunsPrior = faker.number.float({ min: 10, max: 5000, fractionDigits: 2 })

  return {
    period: { from: params.from, to: params.to },
    error_rate: errorRate,
    error_rate_prior: errorRatePrior,
    timeout_rate: timeoutRate,
    timeout_rate_prior: timeoutRatePrior,
    p50_duration_ms: p50,
    p50_duration_ms_prior: p50Prior,
    p95_duration_ms: p95,
    p95_duration_ms_prior: p95Prior,
    p99_duration_ms: p99,
    p99_duration_ms_prior: p99Prior,
    queue_wait_ms: faker.number.int({ min: 100, max: 5000 }),
    error_type_breakdown: buildErrorTypeBreakdown(faker),
    retry_rate: retryRate,
    retry_rate_prior: retryRatePrior,
    platform_availability: platformAvailability,
    availability_by_day: availabilityByDay,
    error_trend_7d: errorTrend7d,
    timeout_rate_trend: timeoutRateTrend,
    p50_duration_trend: p50DurationTrend,
    p95_duration_trend: p95DurationTrend,
    p99_duration_trend: p99DurationTrend,
    retry_rate_trend: retryRateTrend,
    mttr_trend: mttrTrend,
    cost_of_failed_runs_trend: costOfFailedRunsTrend,
    mttr_minutes: mttrMinutes,
    mttr_minutes_prior: mttrMinutesPrior,
    incidents,
    cost_of_failed_runs: costOfFailedRuns,
    cost_of_failed_runs_prior: costOfFailedRunsPrior,
  }
}
