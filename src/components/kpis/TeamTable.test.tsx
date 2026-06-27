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
    mau_prior: 20,
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
    wow_runs_change: 0,
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

it('Churn Risk badge visible under team name when churn_signal_count > 0', () => {
  const team = makeTeam({ churn_signal_count: 1 })
  render(<TeamTable teams={[team]} orgAvgFailedRunRate={0.05} />)
  expect(screen.getByText('Churn Risk')).toBeTruthy()
})

it('Churn Risk badge visible when count = 3', () => {
  const team = makeTeam({ churn_signal_count: 3 })
  render(<TeamTable teams={[team]} orgAvgFailedRunRate={0.05} />)
  expect(screen.getByText('Churn Risk')).toBeTruthy()
})

it('Churn Risk badge absent when count = 0', () => {
  const team = makeTeam({ churn_signal_count: 0 })
  render(<TeamTable teams={[team]} orgAvgFailedRunRate={0.05} />)
  expect(screen.queryByText('Churn Risk')).toBeNull()
})

it('WoW negative runs indicator visible when wow_runs_change < 0', () => {
  const team = makeTeam({ wow_runs_change: -12.5 })
  const { container } = render(<TeamTable teams={[team]} orgAvgFailedRunRate={0.05} />)
  // Math.round(-12.5) = -12 in JS (rounds toward +Infinity)
  expect(container.textContent).toContain('-12% WoW')
})

it('WoW negative runs indicator absent in table body when wow_runs_change >= 0', () => {
  const team = makeTeam({ wow_runs_change: 5 })
  const { container } = render(<TeamTable teams={[team]} orgAvgFailedRunRate={0.05} />)
  // "WoW Trend" header exists but body should not contain "% WoW"
  expect(container.querySelector('tbody')?.textContent).not.toContain('% WoW')
})

it('"was N" shown under Users when mau_prior differs from mau', () => {
  const team = makeTeam({ mau: 20, mau_prior: 18 })
  const { container } = render(<TeamTable teams={[team]} orgAvgFailedRunRate={0.05} />)
  expect(container.textContent).toContain('was 18')
})

it('"was N" absent when mau_prior equals mau', () => {
  const team = makeTeam({ mau: 20, mau_prior: 20 })
  const { container } = render(<TeamTable teams={[team]} orgAvgFailedRunRate={0.05} />)
  expect(container.textContent).not.toContain('was')
})

it('green text when failed_run_rate < 5% (below green threshold)', () => {
  const team = makeTeam({ failed_run_rate: 0.03 })
  const { container } = render(<TeamTable teams={[team]} orgAvgFailedRunRate={0.05} />)
  const cells = container.querySelectorAll('td')
  expect(Array.from(cells).some((c) => c.className.includes('text-green-600'))).toBe(true)
})

it('orange text when failed_run_rate is between 5% and 10%', () => {
  const team = makeTeam({ failed_run_rate: 0.09 })
  const { container } = render(<TeamTable teams={[team]} orgAvgFailedRunRate={0.05} />)
  const cells = container.querySelectorAll('td')
  expect(Array.from(cells).some((c) => c.className.includes('text-orange-500'))).toBe(true)
})

it('red text when failed_run_rate >= 10%', () => {
  const team = makeTeam({ failed_run_rate: 0.12 })
  const { container } = render(<TeamTable teams={[team]} orgAvgFailedRunRate={0.05} />)
  const cells = container.querySelectorAll('td')
  expect(Array.from(cells).some((c) => c.className.includes('text-red-600'))).toBe(true)
})

it('orange text when failed_run_rate is exactly at 5% boundary', () => {
  const team = makeTeam({ failed_run_rate: 0.05 })
  const { container } = render(<TeamTable teams={[team]} orgAvgFailedRunRate={0.05} />)
  const cells = container.querySelectorAll('td')
  expect(Array.from(cells).some((c) => c.className.includes('text-orange-500'))).toBe(true)
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
  expect(names[0]).toContain('Alpha')
  expect(names[1]).toContain('Gamma')
  expect(names[2]).toContain('Beta')
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
  expect(names[0]).toContain('Gamma')
  expect(names[1]).toContain('Alpha')
  expect(names[2]).toContain('Beta')
})

it('adoption progress bar rendered per row', () => {
  const { container } = render(<TeamTable teams={[TEAM_A, TEAM_B]} orgAvgFailedRunRate={0.05} />)
  const progressBars = container.querySelectorAll('.h-2.w-full')
  expect(progressBars.length).toBeGreaterThanOrEqual(2)
})

it('star rating rendered for non-null quality score', () => {
  const team = makeTeam({ avg_quality_score: 4.2 })
  const { container } = render(<TeamTable teams={[team]} orgAvgFailedRunRate={0.05} />)
  expect(container.textContent).toContain('4.2')
  // 5 star glyphs (aria-hidden)
  const stars = container.querySelectorAll('[aria-hidden="true"]')
  expect(stars.length).toBeGreaterThanOrEqual(5)
})

it('dash shown for null quality score', () => {
  const team = makeTeam({ avg_quality_score: null })
  const { container } = render(<TeamTable teams={[team]} orgAvgFailedRunRate={0.05} />)
  expect(container.textContent).toContain('-')
})

it('Churn column no longer rendered', () => {
  const { container } = render(<TeamTable teams={[TEAM_A]} orgAvgFailedRunRate={0.05} />)
  const headers = container.querySelectorAll('th')
  const headerTexts = Array.from(headers).map((h) => h.textContent)
  expect(headerTexts.some((t) => t?.toLowerCase().includes('churn'))).toBe(false)
})
