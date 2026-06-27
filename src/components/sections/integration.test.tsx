// @vitest-environment jsdom
import { it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  dateRange,
  teamId,
  initFiltersFromUrl,
} from '../../lib/filters/filterSignals'

vi.mock('@visx/responsive/lib/components/ParentSize', () => ({
  default: ({ children, className, style }: {
    children: (args: { width: number; height: number }) => React.ReactNode
    className?: string
    style?: React.CSSProperties
  }) => (
    <div className={className} style={style}>
      {children({ width: 400, height: 300 })}
    </div>
  ),
}))

vi.mock('@visx/axis', () => ({
  AxisBottom: vi.fn(() => null),
  AxisLeft: vi.fn(() => null),
  AxisRight: vi.fn(() => null),
}))

vi.mock('@visx/grid', () => ({
  GridRows: vi.fn(() => null),
  GridColumns: vi.fn(() => null),
}))

vi.mock('../layout/Section', () => ({
  Section: ({ children }: { id: string; labelledBy: string; children: React.ReactNode }) => (
    <section>{children}</section>
  ),
}))

const OVERVIEW: Record<string, unknown> = {
  period: { from: '2026-06-01', to: '2026-06-30' },
  total_runs: 12450,
  total_runs_prior: 10000,
  mau: 340,
  mau_prior: 300,
  dau: 120,
  seat_count: 400,
  total_tokens: 1000000,
  total_tokens_prior: 900000,
  input_tokens: 700000,
  output_tokens: 300000,
  total_cost: 14200,
  total_cost_prior: 15000,
  retention_cost: 41.76,
  retention_cost_prior: 44.60,
  retained_users_7d: 142,
  success_rate: 94.2,
  success_rate_prior: 91.0,
  avg_run_duration_ms: 47000,
  avg_quality_score: 4.1,
  avg_quality_score_prior: 3.9,
  rated_run_count: 8200,
  cost_per_quality_point: 0.422,
  cost_per_quality_point_prior: 0.480,
  acceptance_rate: 72.5,
  cost_per_accepted_output: 0.18,
  mom_usage_growth: 12.5,
  user_activation_rate: 80,
  new_users_count: 15,
  quality_cost_efficiency: 0.8,
  churn_risk_count: 5,
  new_user_activation_cost: 50.0,
  quality_score_trend: [{ date: '2026-06-01', score: 4.0 }],
}

const TIMESERIES = {
  period: { from: '2026-06-01', to: '2026-06-30' },
  granularity: 'day',
  points: [
    { date: '2026-06-01', runs: 100, tokens: 50000, input_tokens: 35000, output_tokens: 15000, cost: 450, dau: 85, avg_quality_score: 4.1, rated_run_count: 60, error_rate: 2.0 },
  ],
}

const ORG_CONFIG = {
  org_id: 'org_001',
  seat_count: 400,
  monthly_budget: 20000,
  seat_price_monthly: 50,
  token_rate_per_million: 3,
  billing_model: 'hybrid_token_seat',
}

function mockFetch(overview = OVERVIEW, ts = TIMESERIES, config = ORG_CONFIG) {
  vi.stubGlobal('fetch', vi.fn((url: string) => {
    const urlStr = String(url)
    let body: unknown
    if (urlStr.includes('/api/analytics/overview')) body = overview
    else if (urlStr.includes('/api/analytics/timeseries')) body = ts
    else if (urlStr.includes('/api/org/config')) body = config
    else body = {}
    return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }))
  }))
}

function makeWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

beforeEach(() => {
  vi.restoreAllMocks()
  dateRange.value = { from: '2026-06-01', to: '2026-06-30', preset: '30d' }
  teamId.value = undefined
})

it('URL hydration sets filter signals before first render', () => {
  vi.stubGlobal('location', { search: '?from=2026-05-01&to=2026-05-31&team=team-2' })
  initFiltersFromUrl()
  expect(dateRange.value.from).toBe('2026-05-01')
  expect(dateRange.value.to).toBe('2026-05-31')
  expect(teamId.value).toBe('team-2')
})

it('Filter signal change propagates team_id to fetch URL', async () => {
  mockFetch()
  const { Overview } = await import('./Overview')
  render(<Overview />, { wrapper: makeWrapper() })
  await waitFor(() => {
    expect(vi.mocked(fetch)).toHaveBeenCalled()
  })
  teamId.value = 'team_platform'
  await waitFor(() => {
    const calls = vi.mocked(fetch).mock.calls
    expect(calls.some((c) => String(c[0]).includes('team_id=team_platform'))).toBe(true)
  })
})

it('Date range change triggers fetch with updated from/to params', async () => {
  mockFetch()
  const { Overview } = await import('./Overview')
  render(<Overview />, { wrapper: makeWrapper() })
  await waitFor(() => {
    expect(vi.mocked(fetch)).toHaveBeenCalled()
  })
  dateRange.value = { from: '2026-01-01', to: '2026-01-31', preset: 'custom' }
  await waitFor(() => {
    const calls = vi.mocked(fetch).mock.calls
    expect(calls.some((c) => String(c[0]).includes('from=2026-01-01'))).toBe(true)
  })
})

it('Setting same filter params does not trigger an additional fetch', async () => {
  mockFetch()
  const { Overview } = await import('./Overview')
  render(<Overview />, { wrapper: makeWrapper() })
  await waitFor(() => {
    expect(vi.mocked(fetch)).toHaveBeenCalled()
  })
  const before = vi.mocked(fetch).mock.calls.length
  // Assign same values - filterQueryParams._prev memoization returns the same reference,
  // so TanStack Query sees no new query key and does not refetch.
  dateRange.value = { from: '2026-06-01', to: '2026-06-30', preset: '30d' }
  await new Promise<void>((resolve) => setTimeout(resolve, 100))
  expect(vi.mocked(fetch).mock.calls.length).toBe(before)
})
