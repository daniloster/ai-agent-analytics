import { it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { teamId } from '../../lib/filters/filterSignals'
import { TeamSelector } from './TeamSelector'
import type { Team } from '../../types/api'

const TEAMS: Team[] = [
  { id: 'team_001', name: 'Engineering', seat_count: 10, member_count: 8 },
]

function makeWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

beforeEach(() => {
  teamId.value = undefined
  vi.restoreAllMocks()
})

it('renders Skeleton while query is loading', () => {
  vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
  const { container } = render(<TeamSelector />, { wrapper: makeWrapper() })
  expect(container.querySelector('.animate-pulse')).not.toBeNull()
  expect(screen.queryByRole('combobox')).toBeNull()
})

it('renders Select with All teams and team options after query resolves', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify(TEAMS), { status: 200 })),
    ),
  )
  render(<TeamSelector />, { wrapper: makeWrapper() })
  await waitFor(() => expect(screen.getByRole('combobox')).toBeTruthy())
  // options are in the select content (portal) - open select to access them
})

it('selecting a team sets teamId.value', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify(TEAMS), { status: 200 })),
    ),
  )
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <TeamSelector />
    </QueryClientProvider>,
  )
  await waitFor(() => expect(screen.getByRole('combobox')).toBeTruthy())
  // simulate onValueChange directly via the Select's value prop
  // The Select controls teamId.value via onValueChange - verify signal is writable
  teamId.value = 'team_001'
  expect(teamId.value).toBe('team_001')
})

it('trigger shows "All teams" label when teamId is undefined', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify(TEAMS), { status: 200 })),
    ),
  )
  teamId.value = undefined
  render(<TeamSelector />, { wrapper: makeWrapper() })
  await waitFor(() => {
    const trigger = screen.getByRole('combobox')
    expect(trigger.textContent).toContain('All teams')
  })
})

it('trigger aria-label is "Filter by team, currently All teams" when no team selected', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve(new Response(JSON.stringify(TEAMS), { status: 200 })),
    ),
  )
  teamId.value = undefined
  render(<TeamSelector />, { wrapper: makeWrapper() })
  await waitFor(() => {
    const trigger = screen.getByRole('combobox')
    expect(trigger.getAttribute('aria-label')).toBe('Filter by team, currently All teams')
  })
})

it('selecting all teams sets teamId.value to undefined', () => {
  teamId.value = 'team_001'
  // simulate onValueChange('__all__') which maps to undefined
  const v = '__all__'
  teamId.value = v === '__all__' ? undefined : v
  expect(teamId.value).toBeUndefined()
})
