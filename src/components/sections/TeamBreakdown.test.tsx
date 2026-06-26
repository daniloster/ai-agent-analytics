import { it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { teamId } from '../../lib/filters/filterSignals'

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

const TEAM_A = {
  team_id: 'team-a',
  team_name: 'Alpha',
  runs: 200,
  cost: 1000,
  mau: 20,
  seat_count: 25,
  adoption_rate: 0.8,
  avg_runs_per_user: 10,
  avg_quality_score: 4.2,
  rated_run_count: 50,
  failed_run_rate: 0.03,
  cost_per_quality_point: 0.5,
  top_use_cases: [{ category: 'Code', percentage: 60 }, { category: 'Docs', percentage: 40 }],
  churn_signal_count: 0,
  wow_cost_change: 0.05,
  cost_trend: [{ date: '2026-06-01', cost: 100 }, { date: '2026-06-02', cost: 120 }],
}

const TEAM_B = {
  team_id: 'team-b',
  team_name: 'Beta',
  runs: 100,
  cost: 500,
  mau: 10,
  seat_count: 15,
  adoption_rate: 0.67,
  avg_runs_per_user: 10,
  avg_quality_score: 3.8,
  rated_run_count: 30,
  failed_run_rate: 0.05,
  cost_per_quality_point: 0.7,
  top_use_cases: [{ category: 'Code', percentage: 80 }, { category: 'Review', percentage: 20 }],
  churn_signal_count: 1,
  wow_cost_change: -0.02,
  cost_trend: [{ date: '2026-06-01', cost: 50 }, { date: '2026-06-02', cost: 55 }],
}

const TEAMS_RESPONSE = {
  period: { from: '2026-06-01', to: '2026-06-30' },
  org_avg_failed_run_rate: 0.04,
  teams: [TEAM_A, TEAM_B],
}

const SINGLE_TEAM_RESPONSE = {
  period: { from: '2026-06-01', to: '2026-06-30' },
  org_avg_failed_run_rate: 0.03,
  teams: [TEAM_A],
}

const NULL_QUALITY_TEAM_RESPONSE = {
  period: { from: '2026-06-01', to: '2026-06-30' },
  org_avg_failed_run_rate: 0.03,
  teams: [{ ...TEAM_A, avg_quality_score: null, cost_per_quality_point: null }],
}

function mockFetch(response: unknown) {
  vi.stubGlobal('fetch', vi.fn(() =>
    Promise.resolve(new Response(JSON.stringify(response), { status: 200 })),
  ))
}

function makeWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

beforeEach(() => {
  vi.restoreAllMocks()
  teamId.value = undefined
})

it('org-wide view renders TeamTable and five figcaptions when teamId is undefined', async () => {
  mockFetch(TEAMS_RESPONSE)
  const { TeamBreakdown } = await import('./TeamBreakdown')
  const { container } = render(<TeamBreakdown />, { wrapper: makeWrapper() })
  await waitFor(() => {
    expect(container.querySelector('table')).not.toBeNull()
    const captions = container.querySelectorAll('figcaption')
    expect(captions).toHaveLength(5)
  })
})

it('single-team view renders 4 KpiCards and no TeamTable when teamId is set', async () => {
  teamId.value = 'team-a'
  mockFetch(SINGLE_TEAM_RESPONSE)
  const { TeamBreakdown } = await import('./TeamBreakdown')
  const { container } = render(<TeamBreakdown />, { wrapper: makeWrapper() })
  await waitFor(() => {
    expect(container.querySelector('table')).toBeNull()
    const infoButtons = container.querySelectorAll('button[aria-label="More information"]')
    expect(infoButtons).toHaveLength(4)
  })
})

it('loading state renders Skeleton elements and no table or cards', async () => {
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
  const { TeamBreakdown } = await import('./TeamBreakdown')
  const { container } = render(<TeamBreakdown />, { wrapper: makeWrapper() })
  const skeletons = container.querySelectorAll('.animate-pulse')
  expect(skeletons.length).toBeGreaterThan(0)
  expect(container.querySelector('table')).toBeNull()
  expect(container.querySelector('button[aria-label="More information"]')).toBeNull()
})

it('KPI-22 ColumnChart has annotation line when teams have non-null cost_per_quality_point', async () => {
  mockFetch(TEAMS_RESPONSE)
  const { TeamBreakdown } = await import('./TeamBreakdown')
  const { container } = render(<TeamBreakdown />, { wrapper: makeWrapper() })
  await waitFor(() => {
    expect(container.querySelector('line')).not.toBeNull()
  })
})

it('quality KpiCard shows insufficientData in single-team view when avg_quality_score is null', async () => {
  teamId.value = 'team-a'
  mockFetch(NULL_QUALITY_TEAM_RESPONSE)
  const { TeamBreakdown } = await import('./TeamBreakdown')
  render(<TeamBreakdown />, { wrapper: makeWrapper() })
  await waitFor(() => {
    const statusElements = screen.getAllByRole('status')
    expect(statusElements.some((el) => el.textContent?.includes('Insufficient data'))).toBe(true)
  })
})
