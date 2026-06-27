import { describe, it, expect } from 'vitest'
import { Faker, en } from '@faker-js/faker'
import { generateBilling } from './billing'

function makeSeededFaker(seed: number): Faker {
  const faker = new Faker({ locale: [en] })
  faker.seed(seed)
  return faker
}

const STD_PARAMS = { from: '2026-06-01', to: '2026-06-30' }

describe('generateBilling', () => {
  it('invoice_history has exactly 6 entries', () => {
    const result = generateBilling(makeSeededFaker(1), STD_PARAMS)
    expect(result.invoice_history).toHaveLength(6)
  })

  it('invoice_history months are in ascending chronological order', () => {
    const result = generateBilling(makeSeededFaker(1), STD_PARAMS)
    const months = result.invoice_history.map((h) => h.month)
    for (let i = 1; i < months.length; i++) {
      expect(months[i] > months[i - 1]).toBe(true)
    }
  })

  it('cost_by_team has 4 entries and percentages sum to 100', () => {
    const result = generateBilling(makeSeededFaker(1), STD_PARAMS)
    expect(result.cost_by_team).toHaveLength(4)
    const sum = result.cost_by_team.reduce((acc: number, t) => acc + t.percentage, 0)
    expect(sum).toBe(100)
  })

  it('projected_month_end >= current_month_spend', () => {
    for (let seed = 0; seed < 10; seed++) {
      const result = generateBilling(makeSeededFaker(seed), STD_PARAMS)
      expect(result.projected_month_end).toBeGreaterThanOrEqual(result.current_month_spend)
    }
  })

  it('budget_utilization is in [0, 100]', () => {
    const result = generateBilling(makeSeededFaker(1), STD_PARAMS)
    expect(result.budget_utilization).toBeGreaterThanOrEqual(0)
    expect(result.budget_utilization).toBeLessThanOrEqual(100)
  })

  it('all cost_anomaly_days entries have a boolean is_anomaly field', () => {
    const result = generateBilling(makeSeededFaker(1), STD_PARAMS)
    for (const day of result.cost_anomaly_days) {
      expect(typeof day.is_anomaly).toBe('boolean')
    }
  })

  it('invoice_history months are in YYYY-MM format', () => {
    const result = generateBilling(makeSeededFaker(1), STD_PARAMS)
    const pattern = /^\d{4}-\d{2}$/
    for (const entry of result.invoice_history) {
      expect(entry.month).toMatch(pattern)
    }
  })

  it('current_month_spend_prior is a positive number', () => {
    const result = generateBilling(makeSeededFaker(1), STD_PARAMS)
    expect(result.current_month_spend_prior).toBeGreaterThan(0)
  })

  it('cost_per_successful_run_trend has entries matching the date range', () => {
    const result = generateBilling(makeSeededFaker(1), STD_PARAMS)
    expect(result.cost_per_successful_run_trend.length).toBe(30)
    expect(result.cost_per_successful_run_trend[0]?.date).toBe('2026-06-01')
  })

  it('token_rate_trend has entries matching the date range', () => {
    const result = generateBilling(makeSeededFaker(1), STD_PARAMS)
    expect(result.token_rate_trend.length).toBe(30)
  })

  it('cost_of_failed_runs_trend has entries matching the date range', () => {
    const result = generateBilling(makeSeededFaker(1), STD_PARAMS)
    expect(result.cost_of_failed_runs_trend.length).toBe(30)
  })

  it('new_user_activation_cost is null or positive', () => {
    for (let seed = 0; seed < 20; seed++) {
      const result = generateBilling(makeSeededFaker(seed), STD_PARAMS)
      if (result.new_user_activation_cost !== null) {
        expect(result.new_user_activation_cost).toBeGreaterThan(0)
      }
    }
  })

  it('new_user_activation_cost_trend is empty when cost is null', () => {
    for (let seed = 0; seed < 30; seed++) {
      const result = generateBilling(makeSeededFaker(seed), STD_PARAMS)
      if (result.new_user_activation_cost === null) {
        expect(result.new_user_activation_cost_trend).toHaveLength(0)
      }
    }
  })

  it('cost_anomaly_days has majority normal (green) days', () => {
    const result = generateBilling(makeSeededFaker(7), STD_PARAMS)
    const normalDays = result.cost_anomaly_days.filter(
      (d) => d.daily_cost <= d.avg_daily_cost * 1.2
    )
    expect(normalDays.length / result.cost_anomaly_days.length).toBeGreaterThanOrEqual(0.6)
  })

  it('is_anomaly is true when daily_cost > avg * 1.2', () => {
    const result = generateBilling(makeSeededFaker(1), STD_PARAMS)
    for (const d of result.cost_anomaly_days) {
      if (d.daily_cost > d.avg_daily_cost * 1.2) {
        expect(d.is_anomaly).toBe(true)
      }
    }
  })
})
