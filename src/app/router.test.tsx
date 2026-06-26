import { it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Mock heavy dependencies to isolate DashboardRoute
vi.mock('../lib/filters/filterSignals', () => ({
  initFiltersFromUrl: vi.fn(),
  syncFiltersToUrl: vi.fn(),
  dateRange: { value: { from: '2026-06-01', to: '2026-06-30', preset: '30d' } },
  teamId: { value: undefined },
  filterQueryParams: { value: { from: '2026-06-01', to: '2026-06-30', team_id: undefined } },
}))

vi.mock('../components/layout/DashboardLayout', () => ({
  DashboardLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-layout">{children}</div>
  ),
}))

vi.mock('../components/layout/Section', () => ({
  Section: ({ id, children }: { id: string; children: React.ReactNode }) => (
    <section id={id}>{children}</section>
  ),
}))

vi.mock('../components/sections/Overview', () => ({
  Overview: () => (
    <section id="overview">
      <h2>Overview</h2>
    </section>
  ),
}))

vi.mock('../components/sections/TeamBreakdown', () => ({
  TeamBreakdown: () => (
    <section id="teams">
      <h2>Teams</h2>
    </section>
  ),
}))

vi.mock('../components/sections/Reliability', () => ({
  Reliability: () => (
    <section id="reliability">
      <h2>Reliability</h2>
    </section>
  ),
}))

vi.mock('@preact/signals-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@preact/signals-react')>()
  return {
    ...actual,
    useSignalEffect: vi.fn(),
  }
})

const { initFiltersFromUrl } = await import('../lib/filters/filterSignals')

beforeEach(() => {
  vi.clearAllMocks()
})

// Import DashboardRoute indirectly via the router module
async function renderDashboardRoute() {
  const { router } = await import('./router')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const routeEl = (router.routes[0] as any).element as React.ReactNode
  return render(
    <MemoryRouter>
      {routeEl}
    </MemoryRouter>,
  )
}

it('calls initFiltersFromUrl on mount', async () => {
  await renderDashboardRoute()
  expect(initFiltersFromUrl).toHaveBeenCalledOnce()
})

it('renders all four section headings', async () => {
  await renderDashboardRoute()
  expect(screen.getByText('Overview')).toBeTruthy()
  expect(screen.getByText('Teams')).toBeTruthy()
  expect(screen.getByText('Reliability')).toBeTruthy()
  expect(screen.getByText('Billing')).toBeTruthy()
})

it('DashboardLayout wraps the content (main element present)', async () => {
  await renderDashboardRoute()
  expect(screen.getByTestId('dashboard-layout')).toBeTruthy()
})
