import { it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReliabilityResponse } from '../../types/api'
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
  { date: '2026-06-01', value: 100 },
  { date: '2026-06-02', value: 110 },
]

const RELIABILITY: ReliabilityResponse = {
  period: { from: '2026-06-01', to: '2026-06-30' },
  error_rate: 0.062,
  error_rate_prior: 0.041,
  timeout_rate: 0.014,
  timeout_rate_prior: 0.012,
  p50_duration_ms: 12000,
  p50_duration_ms_prior: 11000,
  p95_duration_ms: 48000,
  p95_duration_ms_prior: 45000,
  p99_duration_ms: 120000,
  p99_duration_ms_prior: 110000,
  queue_wait_ms: 3000,
  retry_rate: 0.081,
  retry_rate_prior: 0.072,
  platform_availability: 99.7,
  mttr_minutes: 42,
  mttr_minutes_prior: 50.1,
  cost_of_failed_runs: 1420,
  cost_of_failed_runs_prior: 1300,
  error_type_breakdown: [
    { type: 'model_error', count: 203, percentage: 43 },
    { type: 'timeout', count: 151, percentage: 32 },
    { type: 'tool_call_failure', count: 95, percentage: 20 },
    { type: 'other', count: 24, percentage: 5 },
  ],
  error_trend_7d: [
    { date: '2026-06-01', error_rate: 0.05 },
    { date: '2026-06-02', error_rate: 0.062 },
  ],
  timeout_rate_trend: DAILY_TREND,
  p50_duration_trend: DAILY_TREND,
  p95_duration_trend: DAILY_TREND,
  p99_duration_trend: DAILY_TREND,
  retry_rate_trend: DAILY_TREND,
  mttr_trend: DAILY_TREND,
  cost_of_failed_runs_trend: DAILY_TREND,
  availability_by_day: Array.from({ length: 7 }, (_, i) => ({
    date: `2026-06-0${i + 1}`,
    uptime_pct: 99.7,
  })),
  incidents: [
    { detected_at: '2026-06-15T10:00:00Z', resolved_at: '2026-06-15T10:42:00Z', mttr_minutes: 42, error_type: 'tool_call_failure' },
  ],
}

const RELIABILITY_NO_INCIDENTS: ReliabilityResponse = { ...RELIABILITY, incidents: [], mttr_minutes: null, mttr_minutes_prior: null }
const RELIABILITY_GOOD_ERROR: ReliabilityResponse = { ...RELIABILITY, error_rate: 0.01, error_rate_prior: 0.02 }

function mockFetch(data: ReliabilityResponse = RELIABILITY) {
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
    const infoButtons = screen.getAllByRole('button', { name: /formula and example for/i })
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
  expect(screen.queryAllByRole('button', { name: /formula and example for/i })).toHaveLength(0)
})

it('error type breakdown figure shows title "Error Type Distribution"', async () => {
  mockFetch()
  const { Reliability } = await import('./Reliability')
  render(<Reliability />, { wrapper: makeWrapper() })
  await waitFor(() => {
    expect(screen.getByText('Error Type Distribution')).toBeTruthy()
  })
})

it('error type breakdown subtitle is "Breakdown of failure causes this period"', async () => {
  mockFetch()
  const { Reliability } = await import('./Reliability')
  render(<Reliability />, { wrapper: makeWrapper() })
  await waitFor(() => {
    expect(screen.getByText('Breakdown of failure causes this period')).toBeTruthy()
  })
})

it('donut center text shows total error count', async () => {
  mockFetch()
  const { Reliability } = await import('./Reliability')
  const { container } = render(<Reliability />, { wrapper: makeWrapper() })
  await waitFor(() => {
    // Total errors = 203 + 151 + 95 + 24 = 473
    const svgTexts = container.querySelectorAll('svg text')
    const textContents = Array.from(svgTexts).map((el) => el.textContent)
    expect(textContents).toContain('473')
  })
})

it('donut center shows "errors" label', async () => {
  mockFetch()
  const { Reliability } = await import('./Reliability')
  const { container } = render(<Reliability />, { wrapper: makeWrapper() })
  await waitFor(() => {
    const svgTexts = container.querySelectorAll('svg text')
    const textContents = Array.from(svgTexts).map((el) => el.textContent)
    expect(textContents).toContain('errors')
  })
})

it('availability day boxes are rendered for each day', async () => {
  mockFetch()
  const { Reliability } = await import('./Reliability')
  const { container } = render(<Reliability />, { wrapper: makeWrapper() })
  await waitFor(() => {
    // 7 availability_by_day entries -> 7 boxes with title attributes
    const boxes = container.querySelectorAll('[title^="2026-06-0"]')
    expect(boxes.length).toBe(7)
  })
})

it('platform availability footer shows "MTD Availability"', async () => {
  mockFetch()
  const { Reliability } = await import('./Reliability')
  render(<Reliability />, { wrapper: makeWrapper() })
  await waitFor(() => {
    expect(screen.getByText(/MTD Availability/)).toBeTruthy()
  })
})

it('platform availability footer shows incident count', async () => {
  mockFetch()
  const { Reliability } = await import('./Reliability')
  render(<Reliability />, { wrapper: makeWrapper() })
  await waitFor(() => {
    expect(screen.getByText(/Incidents:/)).toBeTruthy()
  })
})

it('all 8 KpiCards have delta badges when data is loaded', async () => {
  mockFetch()
  const { Reliability } = await import('./Reliability')
  const { container } = render(<Reliability />, { wrapper: makeWrapper() })
  await waitFor(() => {
    // DeltaBadge renders a span with bg-green-50 or bg-red-50 classes
    const deltaBadges = container.querySelectorAll('.bg-green-50, .bg-red-50, .bg-muted')
    expect(deltaBadges.length).toBeGreaterThanOrEqual(7)
  })
})

it('passes axe accessibility check after data loads', async () => {
  mockFetch()
  const { Reliability } = await import('./Reliability')
  const { container } = render(<Reliability />, { wrapper: makeWrapper() })
  await waitFor(() => {
    expect(screen.getAllByRole('button', { name: /formula and example for/i }).length).toBeGreaterThan(0)
  })
  await checkA11y(container)
}, 15000)

it('donut+legend wrapper has flex-wrap so legend stacks below chart when narrow', async () => {
  mockFetch()
  const { Reliability } = await import('./Reliability')
  const { container } = render(<Reliability />, { wrapper: makeWrapper() })
  await waitFor(() => {
    const paths = container.querySelectorAll('svg path')
    expect(paths.length).toBeGreaterThan(0)
  })
  const donutWrapper = container.querySelector('.flex.flex-wrap.items-center')
  expect(donutWrapper).not.toBeNull()
})
