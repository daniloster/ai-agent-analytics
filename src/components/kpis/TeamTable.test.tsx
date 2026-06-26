import { it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { TeamMetrics } from '../../types/api'
import { TeamTable } from './TeamTable'

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

function makeTeam(overrides: Partial<TeamMetrics> = {}): TeamMetrics {
  return {
    team_id: 'team-1',
    team_name: 'Alpha',
    runs: 100,
    cost: 500,
    mau: 20,
    seat_count: 25,
    adoption_rate: 0.8,
    avg_runs_per_user: 5,
    avg_quality_score: 4.2,
    rated_run_count: 50,
    failed_run_rate: 0.03,
    cost_per_quality_point: 0.5,
    top_use_cases: [{ category: 'Code', percentage: 60 }],
    churn_signal_count: 0,
    wow_cost_change: 0.05,
    cost_trend: [{ date: '2026-06-01', cost: 100 }],
    ...overrides,
  }
}

const TEAM_A = makeTeam({ team_id: 'a', team_name: 'Alpha', runs: 200, cost: 1000 })
const TEAM_B = makeTeam({ team_id: 'b', team_name: 'Beta', runs: 100, cost: 500 })

beforeEach(() => {
  vi.clearAllMocks()
})

it('renders correct number of rows for given teams array', () => {
  const { container } = render(<TeamTable teams={[TEAM_A, TEAM_B]} orgAvgFailedRunRate={0.05} />)
  expect(container.querySelectorAll('tbody tr')).toHaveLength(2)
})

it('Runs column sort descending by default: rows in desc order, header shows ▼', () => {
  const { container } = render(<TeamTable teams={[TEAM_B, TEAM_A]} orgAvgFailedRunRate={0.05} />)
  const rows = container.querySelectorAll('tbody tr')
  expect(rows[0]?.textContent).toContain('Alpha')  // 200 runs first (default desc)
  expect(screen.getByText(/^Runs/).textContent).toContain('▼')
})

it('Runs column sort ascending on click: header shows ▲ after rerender', () => {
  const { container, rerender } = render(<TeamTable teams={[TEAM_A, TEAM_B]} orgAvgFailedRunRate={0.05} />)
  const runsHeader = screen.getByText(/^Runs/)
  fireEvent.click(runsHeader)
  rerender(<TeamTable teams={[TEAM_A, TEAM_B]} orgAvgFailedRunRate={0.05} />)
  expect(screen.getByText(/^Runs/).textContent).toContain('▲')
  const rows = container.querySelectorAll('tbody tr')
  expect(rows[0]?.textContent).toContain('Beta')  // 100 runs first in asc
})

it('Cost column header click changes active sort column', () => {
  const { rerender } = render(<TeamTable teams={[TEAM_A, TEAM_B]} orgAvgFailedRunRate={0.05} />)
  fireEvent.click(screen.getByText(/^Cost/))
  rerender(<TeamTable teams={[TEAM_A, TEAM_B]} orgAvgFailedRunRate={0.05} />)
  expect(screen.getByText(/^Cost/).textContent).toContain('▼')
})

it('churn badge visible with singular text when count = 1', () => {
  const team = makeTeam({ churn_signal_count: 1 })
  render(<TeamTable teams={[team]} orgAvgFailedRunRate={0.05} />)
  expect(screen.getByText('1 churn signal')).toBeTruthy()
})

it('churn badge visible with plural text when count = 3', () => {
  const team = makeTeam({ churn_signal_count: 3 })
  render(<TeamTable teams={[team]} orgAvgFailedRunRate={0.05} />)
  expect(screen.getByText('3 churn signals')).toBeTruthy()
})

it('churn badge absent when count = 0', () => {
  const team = makeTeam({ churn_signal_count: 0 })
  render(<TeamTable teams={[team]} orgAvgFailedRunRate={0.05} />)
  expect(screen.queryByText(/churn signal/)).toBeNull()
})

it('red cell when failed_run_rate > 2x orgAvgFailedRunRate', () => {
  const team = makeTeam({ failed_run_rate: 0.12 })
  const { container } = render(<TeamTable teams={[team]} orgAvgFailedRunRate={0.058} />)
  const cells = container.querySelectorAll('td')
  expect(Array.from(cells).some((c) => c.className.includes('bg-red-100'))).toBe(true)
})

it('amber cell when failed_run_rate > 1.5x but not > 2x orgAvgFailedRunRate', () => {
  const team = makeTeam({ failed_run_rate: 0.09 })
  const { container } = render(<TeamTable teams={[team]} orgAvgFailedRunRate={0.058} />)
  const cells = container.querySelectorAll('td')
  expect(Array.from(cells).some((c) => c.className.includes('bg-amber-100'))).toBe(true)
})

it('no color class when at or below 1.5x orgAvgFailedRunRate', () => {
  const team = makeTeam({ failed_run_rate: 0.05 })
  const { container } = render(<TeamTable teams={[team]} orgAvgFailedRunRate={0.058} />)
  const cells = container.querySelectorAll('td')
  expect(Array.from(cells).some((c) => c.className.includes('bg-red-100'))).toBe(false)
  expect(Array.from(cells).some((c) => c.className.includes('bg-amber-100'))).toBe(false)
})

it('null avg_quality_score sorts to end in descending sort', () => {
  const teamA = makeTeam({ team_id: 'a', team_name: 'Alpha', avg_quality_score: 4.4 })
  const teamB = makeTeam({ team_id: 'b', team_name: 'Beta', avg_quality_score: null })
  const teamC = makeTeam({ team_id: 'c', team_name: 'Gamma', avg_quality_score: 3.6 })
  const { container, rerender } = render(
    <TeamTable teams={[teamA, teamB, teamC]} orgAvgFailedRunRate={0.05} />,
  )
  fireEvent.click(screen.getByText(/^Quality/))
  rerender(<TeamTable teams={[teamA, teamB, teamC]} orgAvgFailedRunRate={0.05} />)
  const rows = container.querySelectorAll('tbody tr')
  const names = Array.from(rows).map((r) => r.querySelector('td')?.textContent)
  expect(names).toEqual(['Alpha', 'Gamma', 'Beta'])
})

it('null avg_quality_score sorts to end in ascending sort', () => {
  const teamA = makeTeam({ team_id: 'a', team_name: 'Alpha', avg_quality_score: 4.4 })
  const teamB = makeTeam({ team_id: 'b', team_name: 'Beta', avg_quality_score: null })
  const teamC = makeTeam({ team_id: 'c', team_name: 'Gamma', avg_quality_score: 3.6 })
  const { container, rerender } = render(
    <TeamTable teams={[teamA, teamB, teamC]} orgAvgFailedRunRate={0.05} />,
  )
  const teams = [teamA, teamB, teamC]
  fireEvent.click(screen.getByText(/^Quality/))
  rerender(<TeamTable teams={teams} orgAvgFailedRunRate={0.05} />)
  fireEvent.click(screen.getByText(/^Quality/))
  rerender(<TeamTable teams={teams} orgAvgFailedRunRate={0.05} />)
  const rows = container.querySelectorAll('tbody tr')
  const names = Array.from(rows).map((r) => r.querySelector('td')?.textContent)
  expect(names).toEqual(['Gamma', 'Alpha', 'Beta'])
})

it('adoption progress bar rendered per row', () => {
  const { container } = render(<TeamTable teams={[TEAM_A, TEAM_B]} orgAvgFailedRunRate={0.05} />)
  const progressContainers = container.querySelectorAll('.bg-secondary')
  expect(progressContainers.length).toBeGreaterThanOrEqual(2)
})
