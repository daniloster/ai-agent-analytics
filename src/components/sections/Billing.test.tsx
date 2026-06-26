import { it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { BillingResponse, OverviewResponse } from '../../types/api'

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

const BILLING: BillingResponse = {
  period: { from: '2026-06-01', to: '2026-06-30' },
  current_month_spend: 9800,
  days_elapsed: 20,
  days_in_month: 30,
  projected_month_end: 14700,
  monthly_budget: 15000,
  budget_utilization: 65.3,
  projected_annual_spend: 157300,
  cost_per_successful_run: 1.21,
  token_rate_actual: 2.4,
  token_rate_list: 3.0,
  cost_of_failed_runs: 1420,
  cost_by_team: [
    { team_id: 't1', team_name: 'Alpha', token_cost: 3000, seat_cost_prorated: 500, total: 3500, percentage: 35 },
    { team_id: 't2', team_name: 'Beta', token_cost: 4000, seat_cost_prorated: 600, total: 4600, percentage: 47 },
  ],
  invoice_history: [
    { month: '2026-01', total_billed: 8000 },
    { month: '2026-02', total_billed: 9000 },
    { month: '2026-03', total_billed: 8500 },
    { month: '2026-04', total_billed: 9200 },
    { month: '2026-05', total_billed: 9600 },
    { month: '2026-06', total_billed: 9800 },
  ],
  cost_anomaly_days: [
    { date: '2026-06-10', daily_cost: 800, avg_daily_cost: 450, is_anomaly: true },
    { date: '2026-06-11', daily_cost: 420, avg_daily_cost: 450, is_anomaly: false },
    { date: '2026-06-12', daily_cost: 430, avg_daily_cost: 450, is_anomaly: false },
  ],
}

const OVERVIEW: OverviewResponse = {
  period: { from: '2026-06-01', to: '2026-06-30' },
  total_runs: 12450,
  total_runs_prior: 11000,
  mau: 340,
  dau: 120,
  seat_count: 400,
  total_tokens: 5000000,
  total_tokens_prior: 4500000,
  input_tokens: 3000000,
  output_tokens: 2000000,
  total_cost: 9800,
  total_cost_prior: 9000,
  retention_cost: 28.8,
  success_rate: 94.2,
  success_rate_prior: 93.0,
  avg_run_duration_ms: 47000,
  avg_quality_score: 4.1,
  rated_run_count: 500,
  cost_per_quality_point: 0.42,
  acceptance_rate: 72.5,
  cost_per_accepted_output: 0.18,
  mom_usage_growth: 12.5,
  user_activation_rate: 85,
  new_users_count: 20,
  quality_cost_efficiency: 1.6,
  churn_risk_count: 5,
  new_user_activation_cost: 50.0,
  quality_score_trend: [],
}

const OVERVIEW_NULL_METRICS: OverviewResponse = {
  ...OVERVIEW,
  quality_cost_efficiency: null,
  new_user_activation_cost: null,
}

function mockFetch(billing: BillingResponse = BILLING, overview: OverviewResponse = OVERVIEW) {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      if (url.includes('/billing')) {
        return Promise.resolve(new Response(JSON.stringify(billing), { status: 200 }))
      }
      return Promise.resolve(new Response(JSON.stringify(overview), { status: 200 }))
    }),
  )
}

function makeWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

beforeEach(() => {
  vi.restoreAllMocks()
})

it('GaugeChart is present in the DOM', async () => {
  mockFetch()
  const { Billing } = await import('./Billing')
  const { container } = render(<Billing />, { wrapper: makeWrapper() })
  await waitFor(() => {
    const figures = container.querySelectorAll('figure[aria-label]')
    expect(figures.length).toBeGreaterThan(0)
  })
})

it('invoice history ColumnChart renders 6 bars', async () => {
  mockFetch()
  const { Billing } = await import('./Billing')
  const { container } = render(<Billing />, { wrapper: makeWrapper() })
  await waitFor(() => {
    const rects = container.querySelectorAll('svg rect')
    expect(rects.length).toBeGreaterThanOrEqual(6)
  })
})

it('cost anomaly Heatmap renders one rect per cost_anomaly_day', async () => {
  mockFetch()
  const { Billing } = await import('./Billing')
  const { container } = render(<Billing />, { wrapper: makeWrapper() })
  await waitFor(() => {
    const rects = container.querySelectorAll('svg rect[aria-label*="avg"]')
    expect(rects.length).toBe(BILLING.cost_anomaly_days.length)
  })
})

it('anomaly rect aria-label contains "avg"', async () => {
  mockFetch()
  const { Billing } = await import('./Billing')
  const { container } = render(<Billing />, { wrapper: makeWrapper() })
  await waitFor(() => {
    const anomalyRect = container.querySelector('svg rect[aria-label*="avg"]')
    expect(anomalyRect).not.toBeNull()
  })
})

it('quality_cost_efficiency = null shows "Insufficient data"', async () => {
  mockFetch(BILLING, OVERVIEW_NULL_METRICS)
  const { Billing } = await import('./Billing')
  render(<Billing />, { wrapper: makeWrapper() })
  await waitFor(() => {
    const badges = screen.getAllByText('Insufficient data')
    expect(badges.length).toBeGreaterThanOrEqual(1)
  })
})

it('new_user_activation_cost = null shows "Insufficient data"', async () => {
  mockFetch(BILLING, OVERVIEW_NULL_METRICS)
  const { Billing } = await import('./Billing')
  render(<Billing />, { wrapper: makeWrapper() })
  await waitFor(() => {
    const badges = screen.getAllByText('Insufficient data')
    expect(badges.length).toBeGreaterThanOrEqual(2)
  })
})

it('loading state renders Skeleton elements and no KpiCard buttons', async () => {
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
  const { Billing } = await import('./Billing')
  const { container } = render(<Billing />, { wrapper: makeWrapper() })
  const skeletons = container.querySelectorAll('.animate-pulse')
  expect(skeletons.length).toBeGreaterThan(0)
  expect(screen.queryAllByRole('button', { name: /more information/i })).toHaveLength(0)
})
