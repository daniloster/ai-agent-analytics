import { it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

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

const RELIABILITY = {
  period: { from: '2026-06-01', to: '2026-06-30' },
  error_rate: 0.062,
  error_rate_prior: 0.041,
  timeout_rate: 0.014,
  p50_duration_ms: 12000,
  p95_duration_ms: 48000,
  p99_duration_ms: 120000,
  queue_wait_ms: 3000,
  retry_rate: 0.081,
  platform_availability: 0.997,
  mttr_minutes: 42,
  cost_of_failed_runs: 1420,
  error_type_breakdown: [
    { type: 'context_overflow', count: 120, percentage: 40 },
    { type: 'tool_failure', count: 90, percentage: 30 },
    { type: 'rate_limit', count: 60, percentage: 20 },
    { type: 'infrastructure', count: 30, percentage: 10 },
  ],
  error_trend_7d: [
    { date: '2026-06-01', error_rate: 0.05 },
    { date: '2026-06-02', error_rate: 0.062 },
  ],
  availability_by_day: Array.from({ length: 7 }, (_, i) => ({
    date: `2026-06-0${i + 1}`,
    uptime_pct: 99.7,
  })),
  incidents: [
    { detected_at: '2026-06-15T10:00:00Z', resolved_at: '2026-06-15T10:42:00Z', mttr_minutes: 42, error_type: 'tool_failure' },
  ],
}

const RELIABILITY_NO_INCIDENTS = { ...RELIABILITY, incidents: [], mttr_minutes: null }
const RELIABILITY_GOOD_ERROR = { ...RELIABILITY, error_rate: 0.01, error_rate_prior: 0.02 }

function mockFetch(data = RELIABILITY) {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify(data), { status: 200 })),
    ),
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

it('query success renders 8 KpiCards', async () => {
  mockFetch()
  const { Reliability } = await import('./Reliability')
  render(<Reliability />, { wrapper: makeWrapper() })
  await waitFor(() => {
    const infoButtons = screen.getAllByRole('button', { name: /more information/i })
    expect(infoButtons).toHaveLength(8)
  })
})

it('Error Rate card has red status dot when error_rate >= 0.05', async () => {
  mockFetch()
  const { Reliability } = await import('./Reliability')
  const { container } = render(<Reliability />, { wrapper: makeWrapper() })
  await waitFor(() => {
    expect(container.querySelector('.bg-red-500')).not.toBeNull()
  })
})

it('Error Rate card has green status dot when error_rate < 0.02', async () => {
  mockFetch(RELIABILITY_GOOD_ERROR)
  const { Reliability } = await import('./Reliability')
  const { container } = render(<Reliability />, { wrapper: makeWrapper() })
  await waitFor(() => {
    expect(container.querySelector('.bg-emerald-500')).not.toBeNull()
  })
})

it('AreaChart is present in the DOM', async () => {
  mockFetch()
  const { Reliability } = await import('./Reliability')
  const { container } = render(<Reliability />, { wrapper: makeWrapper() })
  await waitFor(() => {
    expect(container.querySelector('svg')).not.toBeNull()
  })
})

it('DonutChart is present in the DOM', async () => {
  mockFetch()
  const { Reliability } = await import('./Reliability')
  const { container } = render(<Reliability />, { wrapper: makeWrapper() })
  await waitFor(() => {
    const paths = container.querySelectorAll('svg path')
    expect(paths.length).toBeGreaterThan(0)
  })
})

it('incidents = [] renders no IncidentTable', async () => {
  mockFetch(RELIABILITY_NO_INCIDENTS)
  const { Reliability } = await import('./Reliability')
  const { container } = render(<Reliability />, { wrapper: makeWrapper() })
  await waitFor(() => {
    // No <caption> means no IncidentTable
    expect(container.querySelector('caption')).toBeNull()
  })
})

it('incidents with entries renders IncidentTable', async () => {
  mockFetch()
  const { Reliability } = await import('./Reliability')
  const { container } = render(<Reliability />, { wrapper: makeWrapper() })
  await waitFor(() => {
    expect(container.querySelector('caption')).not.toBeNull()
  })
})

it('MTTR KpiCard shows "No incidents" when mttr_minutes is null', async () => {
  mockFetch(RELIABILITY_NO_INCIDENTS)
  const { Reliability } = await import('./Reliability')
  render(<Reliability />, { wrapper: makeWrapper() })
  await waitFor(() => {
    expect(screen.getByText('No incidents')).toBeTruthy()
  })
})

it('loading state renders Skeleton elements, no KpiCards', async () => {
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
  const { Reliability } = await import('./Reliability')
  const { container } = render(<Reliability />, { wrapper: makeWrapper() })
  const skeletons = container.querySelectorAll('.animate-pulse')
  expect(skeletons.length).toBeGreaterThan(0)
  expect(screen.queryAllByRole('button', { name: /more information/i })).toHaveLength(0)
})
