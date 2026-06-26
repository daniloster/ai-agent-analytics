import type { Faker } from '@faker-js/faker'
import type { FilterParams, TeamsResponse, TeamMetrics } from '../../../types/api'

type TeamProfile = {
  team_id: string
  team_name: string
  seat_count: number
  adoptionRange: { min: number; max: number }
  qualityRange: { min: number; max: number }
  failedRunRange: { min: number; max: number }
  runsRange: { min: number; max: number }
  churnMultiplier: number
}

const TEAM_PROFILES: TeamProfile[] = [
  {
    team_id: 'team_platform',
    team_name: 'Platform',
    seat_count: 18,
    adoptionRange: { min: 70, max: 95 },
    qualityRange: { min: 42, max: 50 },
    failedRunRange: { min: 2, max: 10 },
    runsRange: { min: 3000, max: 15000 },
    churnMultiplier: 1,
  },
  {
    team_id: 'team_frontend',
    team_name: 'Frontend',
    seat_count: 22,
    adoptionRange: { min: 78, max: 95 },
    qualityRange: { min: 44, max: 50 },
    failedRunRange: { min: 1, max: 8 },
    runsRange: { min: 2000, max: 12000 },
    churnMultiplier: 1,
  },
  {
    team_id: 'team_backend',
    team_name: 'Backend',
    seat_count: 20,
    adoptionRange: { min: 55, max: 75 },
    qualityRange: { min: 35, max: 45 },
    failedRunRange: { min: 5, max: 15 },
    runsRange: { min: 1500, max: 10000 },
    churnMultiplier: 2,
  },
  {
    team_id: 'team_data',
    team_name: 'Data',
    seat_count: 15,
    adoptionRange: { min: 40, max: 62 },
    qualityRange: { min: 28, max: 40 },
    failedRunRange: { min: 10, max: 25 },
    runsRange: { min: 500, max: 5000 },
    churnMultiplier: 4,
  },
]

const USE_CASE_CATEGORIES = [
  'Code Generation',
  'Code Review',
  'Documentation',
  'Debugging',
  'Test Writing',
  'Data Analysis',
]

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function buildCostTrend(faker: Faker, from: string, to: string): Array<{ date: string; cost: number }> {
  const trend: Array<{ date: string; cost: number }> = []
  const current = new Date(from + 'T00:00:00Z')
  const end = new Date(to + 'T00:00:00Z')
  while (current <= end) {
    trend.push({
      date: current.toISOString().slice(0, 10),
      cost: faker.number.float({ min: 10, max: 2000, fractionDigits: 2 }),
    })
    current.setUTCDate(current.getUTCDate() + 1)
  }
  return trend
}

function buildTopUseCases(faker: Faker): Array<{ category: string; percentage: number }> {
  const n = faker.number.int({ min: 3, max: USE_CASE_CATEGORIES.length })
  const categories = faker.helpers.shuffle([...USE_CASE_CATEGORIES]).slice(0, n)
  // Integer percentages summing to 100
  const buckets: number[] = []
  let remaining = 100
  for (let i = 0; i < categories.length - 1; i++) {
    const portion = faker.number.int({ min: 5, max: Math.floor(remaining / (categories.length - i)) + 10 })
    const clamped = clamp(portion, 5, remaining - (categories.length - i - 1) * 5)
    buckets.push(clamped)
    remaining -= clamped
  }
  buckets.push(remaining)
  return categories.map((category, i) => ({ category, percentage: buckets[i] }))
}

function generateTeamMetrics(faker: Faker, profile: TeamProfile, params: FilterParams): TeamMetrics {
  const mau = faker.number.int({ min: Math.floor(profile.seat_count * 0.3), max: profile.seat_count })
  const adoptionRate = clamp(
    faker.number.int(profile.adoptionRange),
    0,
    100,
  )
  const runs = faker.number.int(profile.runsRange)
  const cost = faker.number.float({ min: 200, max: 15000, fractionDigits: 2 })
  const avgRunsPerUser = mau > 0 ? Math.round(runs / mau) : 0
  const failedRunRate = clamp(faker.number.int(profile.failedRunRange), 0, 100)
  const ratedRunCount = faker.number.int({ min: 0, max: Math.floor(runs * 0.5) })
  const hasQuality = ratedRunCount >= 10
  const rawQuality = faker.number.int(profile.qualityRange)
  const avgQualityScore = hasQuality ? rawQuality / 10 : null
  const costPerQualityPoint = hasQuality && avgQualityScore !== null
    ? faker.number.float({ min: 0.5, max: 30, fractionDigits: 2 })
    : null
  const frontendChurnBase = faker.number.int({ min: 0, max: 3 })
  const churnSignalCount = Math.round(frontendChurnBase * profile.churnMultiplier)
  const wowCostChange = faker.number.float({ min: -15, max: 25, fractionDigits: 1 })

  return {
    team_id: profile.team_id,
    team_name: profile.team_name,
    runs,
    cost,
    mau,
    seat_count: profile.seat_count,
    adoption_rate: adoptionRate,
    avg_runs_per_user: avgRunsPerUser,
    avg_quality_score: avgQualityScore,
    rated_run_count: ratedRunCount,
    failed_run_rate: failedRunRate,
    cost_per_quality_point: costPerQualityPoint,
    top_use_cases: buildTopUseCases(faker),
    churn_signal_count: churnSignalCount,
    wow_cost_change: wowCostChange,
    cost_trend: buildCostTrend(faker, params.from, params.to),
  }
}

export function generateTeams(faker: Faker, params: FilterParams): TeamsResponse {
  const teams = TEAM_PROFILES.map((profile) => generateTeamMetrics(faker, profile, params))

  const totalRuns = teams.reduce((sum, t) => sum + t.runs, 0)
  const orgAvgFailedRunRate = totalRuns > 0
    ? teams.reduce((sum, t) => sum + t.failed_run_rate * t.runs, 0) / totalRuns
    : 0

  return {
    period: { from: params.from, to: params.to },
    org_avg_failed_run_rate: orgAvgFailedRunRate,
    teams,
  }
}
