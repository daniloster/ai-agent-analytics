import type { Faker } from '@faker-js/faker'
import type { FilterParams, OverviewResponse } from '../../../types/api'

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function buildDailyDates(from: string, to: string): string[] {
  const dates: string[] = []
  const current = new Date(from + 'T00:00:00Z')
  const end = new Date(to + 'T00:00:00Z')
  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10))
    current.setUTCDate(current.getUTCDate() + 1)
  }
  return dates
}

export function generateOverview(faker: Faker, params: FilterParams): OverviewResponse {
  const totalRuns = faker.number.int({ min: 1000, max: 50000 })
  const totalRunsPrior = faker.number.int({ min: 800, max: 45000 })
  const mau = faker.number.int({ min: 10, max: 500 })
  const mauPrior = faker.number.int({ min: 8, max: 480 })
  const dau = faker.number.int({ min: 1, max: mau })
  const seatCount = faker.number.int({ min: mau, max: mau + 100 })

  const inputTokens = faker.number.int({ min: 50000, max: 5000000 })
  const outputTokens = faker.number.int({ min: 20000, max: 2000000 })
  const totalTokens = inputTokens + outputTokens
  const totalTokensPrior = faker.number.int({ min: 40000, max: 4500000 })

  const totalCost = faker.number.float({ min: 100, max: 50000, fractionDigits: 2 })
  const totalCostPrior = faker.number.float({ min: 80, max: 48000, fractionDigits: 2 })

  // Users who re-engaged within the last 7 days of the period (7-day retention window).
  const retentionRate7d = faker.number.float({ min: 0.2, max: 0.7, fractionDigits: 2 })
  const retained_users_7d = Math.round(mau * retentionRate7d)
  const retentionCost = retained_users_7d > 0 ? totalCost / retained_users_7d : 0

  const successRate = clamp(faker.number.float({ min: 60, max: 99, fractionDigits: 1 }), 0, 100)
  const successRatePrior = clamp(faker.number.float({ min: 55, max: 99, fractionDigits: 1 }), 0, 100)
  const avgRunDurationMs = faker.number.int({ min: 1000, max: 120000 })

  const ratedRunCount = faker.number.int({ min: 0, max: Math.floor(totalRuns * 0.8) })
  const hasQualityData = ratedRunCount >= 10
  const avgQualityScore = hasQualityData
    ? faker.number.float({ min: 1, max: 5, fractionDigits: 2 })
    : null
  const costPerQualityPoint = hasQualityData && avgQualityScore !== null
    ? faker.number.float({ min: 0.5, max: 50, fractionDigits: 2 })
    : null
  const qualityCostEfficiency = hasQualityData && avgQualityScore !== null && totalCost > 0
    ? faker.number.float({ min: 0.01, max: 1, fractionDigits: 4 })
    : null

  const acceptEvents = faker.number.int({ min: 0, max: 1000 })
  const acceptanceRate = acceptEvents > 0
    ? clamp(faker.number.float({ min: 40, max: 95, fractionDigits: 1 }), 0, 100)
    : null
  const costPerAcceptedOutput = acceptanceRate !== null
    ? faker.number.float({ min: 0.1, max: 10, fractionDigits: 3 })
    : null

  const momUsageGrowth = faker.number.float({ min: -20, max: 40, fractionDigits: 1 })
  const userActivationRate = clamp(faker.number.float({ min: 10, max: 90, fractionDigits: 1 }), 0, 100)
  const newUsersCount = faker.number.int({ min: 0, max: 50 })
  const churnRiskCount = faker.number.int({ min: 0, max: 20 })
  const newUserActivationCost = newUsersCount > 0
    ? faker.number.float({ min: 5, max: 200, fractionDigits: 2 })
    : null

  const allDates = buildDailyDates(params.from, params.to)
  // sample every 3rd day to keep trend compact, but always include at least one entry
  const trendDates = allDates.filter((_, i) => i % 3 === 0)
  if (trendDates.length === 0 && allDates.length > 0) {
    trendDates.push(allDates[0])
  }
  const qualityScoreTrend = trendDates.map((date) => ({
    date,
    score: faker.number.float({ min: 1, max: 5, fractionDigits: 2 }),
  }))

  return {
    period: { from: params.from, to: params.to },
    total_runs: totalRuns,
    total_runs_prior: totalRunsPrior,
    mau,
    mau_prior: mauPrior,
    dau,
    seat_count: seatCount,
    total_tokens: totalTokens,
    total_tokens_prior: totalTokensPrior,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    total_cost: totalCost,
    total_cost_prior: totalCostPrior,
    retention_cost: retentionCost,
    retained_users_7d,
    success_rate: successRate,
    success_rate_prior: successRatePrior,
    avg_run_duration_ms: avgRunDurationMs,
    avg_quality_score: avgQualityScore,
    rated_run_count: ratedRunCount,
    cost_per_quality_point: costPerQualityPoint,
    acceptance_rate: acceptanceRate,
    cost_per_accepted_output: costPerAcceptedOutput,
    mom_usage_growth: momUsageGrowth,
    user_activation_rate: userActivationRate,
    new_users_count: newUsersCount,
    quality_cost_efficiency: qualityCostEfficiency,
    churn_risk_count: churnRiskCount,
    new_user_activation_cost: newUserActivationCost,
    quality_score_trend: qualityScoreTrend,
  }
}
