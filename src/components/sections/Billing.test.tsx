import { it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { BillingResponse } from '../../types/api'
import { checkA11y } from '../../lib/a11y/axeConfig'

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

const DAILY_TREND = [
  { date: '2026-06-01', value: 10 },
  { date: '2026-06-02', value: 12 },
]

const BILLING: BillingResponse = {
  period: { from: '2026-06-01', to: '2026-06-30' },
  current_month_spend: 9800,
  current_month_spend_prior: 8900,
  days_elapsed: 20,
  days_in_month: 30,
  projected_month_end: 14700,
  monthly_budget: 15000,
  budget_utilization: 65.3,
  projected_annual_spend: 157300,
  cost_per_successful_run: 1.21,
  cost_per_successful_run_prior: 1.35,
  cost_per_successful_run_trend: DAILY_TREND,
  token_rate_actual: 2.4,
  token_rate_actual_prior: 2.5,
  token_rate_trend: DAILY_TREND,
  token_rate_list: 3.0,
  cost_of_failed_runs: 1420,
  cost_of_failed_runs_prior: 1200,
  cost_of_failed_runs_trend: DAILY_TREND,
  new_user_activation_cost: 50.0,
  new_user_activation_cost_prior: 45.0,
  new_user_activation_cost_trend: DAILY_TREND,
  cost_by_team: [
    { team_id: 't1', team_name: 'Alpha', token_cost: 3000, seat_cost_prorated: 500, total: 3500, percentage: 35 },
    { team_id: 't2', team_name: 'Beta', token_cost: 4000, seat_cost_prorated: 600, total: 4600, percentage: 47 },
  ],
  invoice_history: [
    { month: '2025-12', total_billed: 8000 },
    { month: '2026-01', total_billed: 9000 },
    { month: '2026-02', total_billed: 8500 },
    { month: '2026-03', total_billed: 9200 },
    { month: '2026-04', total_billed: 9600 },
    { month: '2026-05', total_billed: 9800 },
  ],
  cost_anomaly_days: [
    { date: '2026-06-10', daily_cost: 800, avg_daily_cost: 450, is_anomaly: true },
    { date: '2026-06-11', daily_cost: 420, avg_daily_cost: 450, is_anomaly: false },
    { date: '2026-06-12', daily_cost: 430, avg_daily_cost: 450, is_anomaly: false },
  ],
}

const BILLING_NULL_METRICS: BillingResponse = {
  ...BILLING,
  new_user_activation_cost: null,
  new_user_activation_cost_prior: null,
  new_user_activation_cost_trend: [],
}

function mockFetch(billing: BillingResponse = BILLING) {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response(JSON.stringify(billing), { status: 200 }))),
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

it('Budget Utilization KpiCard shows percentage and combined subValue', async () => {
  mockFetch()
  const { Billing } = await import('./Billing')
  render(<Billing />, { wrapper: makeWrapper() })
  await waitFor(() => {
    expect(screen.getByText('Budget Utilization')).toBeTruthy()
    // subValue: "$9,800 of $15,000 budget"
    expect(screen.getByText(/\$9,800 of \$15,000 budget/)).toBeTruthy()
  })
})

it('invoice history ColumnChart renders bars', async () => {
  mockFetch()
  const { Billing } = await import('./Billing')
  const { container } = render(<Billing />, { wrapper: makeWrapper() })
  await waitFor(() => {
    const rects = container.querySelectorAll('svg rect')
    expect(rects.length).toBeGreaterThanOrEqual(6)
  })
})

it('anomaly calendar renders one day box per cost_anomaly_day', async () => {
  mockFetch()
  const { Billing } = await import('./Billing')
  const { container } = render(<Billing />, { wrapper: makeWrapper() })
  await waitFor(() => {
    const calendar = container.querySelector('[aria-label="Daily cost anomaly"]')
    const items = calendar?.querySelectorAll('[role="listitem"]') ?? []
    expect(items.length).toBe(BILLING.cost_anomaly_days.length)
  })
})

it('anomaly day boxes have title attribute with date and cost info', async () => {
  mockFetch()
  const { Billing } = await import('./Billing')
  const { container } = render(<Billing />, { wrapper: makeWrapper() })
  await waitFor(() => {
    const dayBox = container.querySelector('[role="listitem"] > div[title]')
    expect(dayBox).not.toBeNull()
    expect(dayBox?.getAttribute('title')).toContain('2026-06-10')
  })
})

it('anomaly footer shows correct alert count', async () => {
  mockFetch()
  const { Billing } = await import('./Billing')
  const { container } = render(<Billing />, { wrapper: makeWrapper() })
  await waitFor(() => {
    // BILLING has 1 anomaly day (2026-06-10); footer text is split across <strong> and text node
    const footer = container.querySelector('[aria-label="Cost anomaly calendar"] .border-t')
    expect(footer?.textContent).toContain('1')
    expect(footer?.textContent).toContain('anomaly alert')
  })
})

it('new_user_activation_cost = null shows "Insufficient data"', async () => {
  mockFetch(BILLING_NULL_METRICS)
  const { Billing } = await import('./Billing')
  render(<Billing />, { wrapper: makeWrapper() })
  await waitFor(() => {
    const badges = screen.getAllByText('Insufficient data')
    expect(badges.length).toBeGreaterThanOrEqual(1)
  })
})

it('cumulative spend chart renders SVG paths when billing data is loaded', async () => {
  mockFetch()
  const { Billing } = await import('./Billing')
  const { container } = render(<Billing />, { wrapper: makeWrapper() })
  await waitFor(() => {
    const figure = container.querySelector('[aria-label="Cumulative spend vs budget"]')
    expect(figure).not.toBeNull()
    const paths = figure?.querySelectorAll('path') ?? []
    expect(paths.length).toBeGreaterThanOrEqual(1)
  })
})

it('loading state renders Skeleton elements and no KpiCard buttons', async () => {
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
  const { Billing } = await import('./Billing')
  const { container } = render(<Billing />, { wrapper: makeWrapper() })
  const skeletons = container.querySelectorAll('.animate-pulse')
  expect(skeletons.length).toBeGreaterThan(0)
  expect(screen.queryAllByRole('button', { name: /formula and example for/i })).toHaveLength(0)
})

it('passes axe accessibility check after data loads', async () => {
  mockFetch()
  const { Billing } = await import('./Billing')
  const { container } = render(<Billing />, { wrapper: makeWrapper() })
  await waitFor(() => {
    expect(screen.getByText('Budget Utilization')).toBeTruthy()
  })
  await checkA11y(container)
}, 15000)

it('donut+legend wrapper has flex-wrap so legend stacks below chart when narrow', async () => {
  mockFetch()
  const { Billing } = await import('./Billing')
  const { container } = render(<Billing />, { wrapper: makeWrapper() })
  await waitFor(() => {
    expect(screen.getByText('Budget Utilization')).toBeTruthy()
  })
  const donutWrapper = container.querySelector('.flex.flex-wrap.items-center')
  expect(donutWrapper).not.toBeNull()
})
