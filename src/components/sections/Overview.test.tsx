import { it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { dateRange } from '../../lib/filters/filterSignals'

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
  rated_run_count: 8200,
  cost_per_quality_point: 0.422,
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

const OVERVIEW_NO_QUALITY = { ...OVERVIEW, avg_quality_score: null, cost_per_quality_point: null, rated_run_count: 5 }

const TIMESERIES = {
  period: { from: '2026-06-01', to: '2026-06-30' },
  granularity: 'day',
  points: [
    { date: '2026-06-01', runs: 100, tokens: 50000, input_tokens: 35000, output_tokens: 15000, cost: 450, dau: 85, avg_quality_score: 4.1, error_rate: 2.0 },
    { date: '2026-06-02', runs: 120, tokens: 60000, input_tokens: 42000, output_tokens: 18000, cost: 520, dau: 90, avg_quality_score: 4.2, error_rate: 1.5 },
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
})

it('renders exactly 12 KpiCard instances when API returns full OverviewResponse', async () => {
  mockFetch()
  const { Overview } = await import('./Overview')
  render(<Overview />, { wrapper: makeWrapper() })
  await waitFor(() => {
    // Each KpiCard renders a "More information" button; KPI-04 and KPI-14 are charts
    const infoButtons = screen.getAllByRole('button', { name: /more information/i })
    expect(infoButtons).toHaveLength(12)
  })
})

it('Retention Cost KpiCard is labelled "7 Days Retention Cost"', async () => {
  mockFetch()
  const { Overview } = await import('./Overview')
  render(<Overview />, { wrapper: makeWrapper() })
  await waitFor(() => {
    expect(screen.getByText('7 Days Retention Cost')).toBeTruthy()
  })
})

it('KPI-09 shows insufficientData when avg_quality_score is null', async () => {
  mockFetch(OVERVIEW_NO_QUALITY)
  const { Overview } = await import('./Overview')
  render(<Overview />, { wrapper: makeWrapper() })
  await waitFor(() => {
    const statusElements = screen.getAllByRole('status')
    expect(statusElements.length).toBeGreaterThan(0)
    expect(statusElements[0]?.textContent).toContain('Insufficient data')
  })
})

it('all KpiCard value props are undefined (Skeleton) while queries are loading', async () => {
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
  const { Overview } = await import('./Overview')
  const { container } = render(<Overview />, { wrapper: makeWrapper() })
  // Skeleton elements should be present
  const skeletons = container.querySelectorAll('.animate-pulse')
  expect(skeletons.length).toBeGreaterThan(0)
})

it('token area chart renders two Area series when timeseries data is present', async () => {
  mockFetch()
  const { Overview } = await import('./Overview')
  const { container } = render(<Overview />, { wrapper: makeWrapper() })
  await waitFor(() => {
    const paths = container.querySelectorAll('svg path')
    // At minimum, the two Area series (input_tokens, output_tokens) each render a path
    expect(paths.length).toBeGreaterThanOrEqual(2)
  })
})

it('Retention Cost card renders "/user" value suffix', async () => {
  mockFetch()
  const { Overview } = await import('./Overview')
  render(<Overview />, { wrapper: makeWrapper() })
  await waitFor(() => {
    expect(screen.getByText('/user')).toBeTruthy()
  })
})

it('Retention Cost card renders efficiency delta label', async () => {
  mockFetch()
  const { Overview } = await import('./Overview')
  render(<Overview />, { wrapper: makeWrapper() })
  await waitFor(() => {
    const label = screen.queryByText('improving efficiency') ?? screen.queryByText('degrading efficiency')
    expect(label).not.toBeNull()
  })
})

it('Seat Adoption card renders seats deltaLabel in "N / M seats" format', async () => {
  mockFetch()
  const { Overview } = await import('./Overview')
  render(<Overview />, { wrapper: makeWrapper() })
  await waitFor(() => {
    // OVERVIEW has mau=340, seat_count=400 => "340 / 400 seats"
    expect(screen.getByText('340 / 400 seats')).toBeTruthy()
  })
})

it('Active Users card is labelled "Active Users" not "Monthly Active Users"', async () => {
  mockFetch()
  const { Overview } = await import('./Overview')
  render(<Overview />, { wrapper: makeWrapper() })
  await waitFor(() => {
    expect(screen.getByText('Active Users')).toBeTruthy()
    expect(screen.queryByText('Monthly Active Users')).toBeNull()
  })
})

it('Active Users card renders "vs previous period" delta label', async () => {
  mockFetch()
  const { Overview } = await import('./Overview')
  render(<Overview />, { wrapper: makeWrapper() })
  await waitFor(() => {
    expect(screen.getByText('vs previous period')).toBeTruthy()
  })
})

it('Active Users card does not render "DAU:" subvalue', async () => {
  mockFetch()
  const { Overview } = await import('./Overview')
  render(<Overview />, { wrapper: makeWrapper() })
  await waitFor(() => {
    expect(screen.queryByText(/DAU:/)).toBeNull()
  })
})

it('Total Runs card renders "vs last month" delta label', async () => {
  mockFetch()
  const { Overview } = await import('./Overview')
  render(<Overview />, { wrapper: makeWrapper() })
  await waitFor(() => {
    expect(screen.getByText('vs last month')).toBeTruthy()
  })
})

it('filter change causes fetch to be called again with new params', async () => {
  mockFetch()
  const { Overview } = await import('./Overview')
  const wrapper = makeWrapper()
  const { rerender } = render(<Overview />, { wrapper })
  await waitFor(() => {
    expect(vi.mocked(fetch)).toHaveBeenCalled()
  })
  const callsBefore = vi.mocked(fetch).mock.calls.length
  // Change the filter signal
  dateRange.value = { from: '2026-05-01', to: '2026-05-31', preset: 'custom' }
  rerender(<Overview />)
  await waitFor(() => {
    expect(vi.mocked(fetch).mock.calls.length).toBeGreaterThan(callsBefore)
  })
  // Reset signal
  dateRange.value = { from: '2026-06-01', to: '2026-06-30', preset: '30d' }
})
