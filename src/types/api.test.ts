import { it, expect } from 'vitest'
import type {
  FilterParams,
  OrgConfig,
  OverviewResponse,
  BillingResponse,
  ReliabilityResponse,
  TeamsResponse,
  TimeseriesResponse,
} from './api'

it('FilterParams accepts without team_id', () => {
  const p: FilterParams = { from: '2026-06-01', to: '2026-06-30' }
  expect(p.from).toBe('2026-06-01')
  expect(p.team_id).toBeUndefined()
})

it('FilterParams accepts with team_id', () => {
  const p: FilterParams = { from: '2026-06-01', to: '2026-06-30', team_id: 'team_platform' }
  expect(p.team_id).toBe('team_platform')
})

it('OverviewResponse avg_quality_score accepts null', () => {
  const score: OverviewResponse['avg_quality_score'] = null
  expect(score).toBeNull()
})

it('OverviewResponse cost_per_quality_point accepts null', () => {
  const v: OverviewResponse['cost_per_quality_point'] = null
  expect(v).toBeNull()
})

it('OverviewResponse quality_cost_efficiency accepts null', () => {
  const v: OverviewResponse['quality_cost_efficiency'] = null
  expect(v).toBeNull()
})

it('BillingResponse cost_by_team is an array type', () => {
  const arr: BillingResponse['cost_by_team'] = []
  expect(Array.isArray(arr)).toBe(true)
})

it('BillingResponse invoice_history is an array type', () => {
  const arr: BillingResponse['invoice_history'] = []
  expect(Array.isArray(arr)).toBe(true)
})

it('OrgConfig billing_model is the literal hybrid_token_seat', () => {
  const model: OrgConfig['billing_model'] = 'hybrid_token_seat'
  expect(model).toBe('hybrid_token_seat')
})

it('ReliabilityResponse mttr_minutes accepts null', () => {
  const v: ReliabilityResponse['mttr_minutes'] = null
  expect(v).toBeNull()
})

it('TeamsResponse has a teams array field', () => {
  const arr: TeamsResponse['teams'] = []
  expect(Array.isArray(arr)).toBe(true)
})

it('TimeseriesResponse granularity is the literal day', () => {
  const g: TimeseriesResponse['granularity'] = 'day'
  expect(g).toBe('day')
})
