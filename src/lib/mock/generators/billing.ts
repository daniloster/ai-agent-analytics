import type { Faker } from '@faker-js/faker'
import type { FilterParams, BillingResponse } from '../../../types/api'

const TEAM_IDS = [
  { team_id: 'team_platform', team_name: 'Platform' },
  { team_id: 'team_frontend', team_name: 'Frontend' },
  { team_id: 'team_backend',  team_name: 'Backend' },
  { team_id: 'team_data',     team_name: 'Data' },
]

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function buildInvoiceHistory(faker: Faker, from: string): Array<{ month: string; total_billed: number }> {
  const history: Array<{ month: string; total_billed: number }> = []
  const base = new Date(from + 'T00:00:00Z')
  // 6 months ending at the month of `from`
  for (let i = 5; i >= 0; i--) {
    const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - i, 1))
    const month = d.toISOString().slice(0, 7)
    history.push({ month, total_billed: faker.number.float({ min: 5000, max: 30000, fractionDigits: 2 }) })
  }
  return history
}

function buildCostByTeam(faker: Faker): BillingResponse['cost_by_team'] {
  const costs = TEAM_IDS.map(() => faker.number.float({ min: 500, max: 10000, fractionDigits: 2 }))
  const totalCost = costs.reduce((a, b) => a + b, 0)

  // Integer percentages summing to exactly 100
  const percentages: number[] = []
  let remaining = 100
  for (let i = 0; i < TEAM_IDS.length - 1; i++) {
    const pct = Math.round((costs[i] / totalCost) * 100)
    const clamped = clamp(pct, 1, remaining - (TEAM_IDS.length - i - 1))
    percentages.push(clamped)
    remaining -= clamped
  }
  percentages.push(remaining)

  return TEAM_IDS.map((team, i) => ({
    team_id: team.team_id,
    team_name: team.team_name,
    token_cost: costs[i] * 0.7,
    seat_cost_prorated: costs[i] * 0.3,
    total: costs[i],
    percentage: percentages[i],
  }))
}

function buildCostAnomalyDays(faker: Faker, from: string, to: string): BillingResponse['cost_anomaly_days'] {
  const anomalyDays: BillingResponse['cost_anomaly_days'] = []
  const current = new Date(from + 'T00:00:00Z')
  const end = new Date(to + 'T00:00:00Z')
  const avgDailyCost = faker.number.float({ min: 100, max: 2000, fractionDigits: 2 })

  while (current <= end) {
    const dailyCost = faker.number.float({ min: 50, max: 4000, fractionDigits: 2 })
    const isAnomaly = dailyCost > avgDailyCost * 2 || dailyCost < avgDailyCost * 0.3
    anomalyDays.push({
      date: current.toISOString().slice(0, 10),
      daily_cost: dailyCost,
      avg_daily_cost: avgDailyCost,
      is_anomaly: isAnomaly,
    })
    current.setUTCDate(current.getUTCDate() + 1)
  }
  return anomalyDays
}

export function generateBilling(faker: Faker, params: FilterParams): BillingResponse {
  const fromDate = new Date(params.from + 'T00:00:00Z')
  const daysInMonth = new Date(Date.UTC(fromDate.getUTCFullYear(), fromDate.getUTCMonth() + 1, 0)).getUTCDate()
  const daysElapsed = clamp(fromDate.getUTCDate(), 1, daysInMonth)

  const currentMonthSpend = faker.number.float({ min: 1000, max: 20000, fractionDigits: 2 })
  const projectedMonthEnd = daysElapsed > 0
    ? (currentMonthSpend / daysElapsed) * daysInMonth
    : currentMonthSpend
  const monthlyBudget = faker.number.float({ min: 15000, max: 35000, fractionDigits: 2 })
  const budgetUtilization = clamp((currentMonthSpend / monthlyBudget) * 100, 0, 100)

  const costByTeam = buildCostByTeam(faker)
  const successfulRuns = faker.number.int({ min: 500, max: 20000 })
  const costPerSuccessfulRun = successfulRuns > 0 ? currentMonthSpend / successfulRuns : 0

  return {
    period: { from: params.from, to: params.to },
    current_month_spend: currentMonthSpend,
    days_elapsed: daysElapsed,
    days_in_month: daysInMonth,
    projected_month_end: projectedMonthEnd,
    monthly_budget: monthlyBudget,
    budget_utilization: budgetUtilization,
    projected_annual_spend: projectedMonthEnd * 12,
    cost_per_successful_run: costPerSuccessfulRun,
    token_rate_actual: faker.number.float({ min: 2.0, max: 3.5, fractionDigits: 3 }),
    token_rate_list: 3.0,
    cost_by_team: costByTeam,
    invoice_history: buildInvoiceHistory(faker, params.from),
    cost_anomaly_days: buildCostAnomalyDays(faker, params.from, params.to),
    cost_of_failed_runs: faker.number.float({ min: 10, max: 3000, fractionDigits: 2 }),
  }
}
