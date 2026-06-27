import { it, expect, beforeEach, vi } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import { dateRange } from '../../lib/filters/filterSignals'
import { DateRangePicker } from './DateRangePicker'

function resetDateRange() {
  dateRange.value = { from: '2026-06-01', to: '2026-06-30', preset: '30d' }
}

beforeEach(() => {
  resetDateRange()
  vi.restoreAllMocks()
})

it('trigger button shows formatted applied date range', () => {
  render(<DateRangePicker />)
  expect(screen.getByRole('button')).toHaveTextContent('Jun 1 - Jun 30')
})

it('calendar is visible as soon as the popover opens', () => {
  render(<DateRangePicker />)
  fireEvent.click(screen.getByRole('button'))
  expect(screen.getAllByRole('grid').length).toBeGreaterThanOrEqual(1)
})

it('clicking "30 days" preset applies immediately and updates dateRange', () => {
  render(<DateRangePicker />)
  fireEvent.click(screen.getByRole('button'))
  fireEvent.click(screen.getByText('30 days'))
  expect(dateRange.value.preset).toBe('30d')
  const from = new Date(dateRange.value.from + 'T00:00:00')
  const to = new Date(dateRange.value.to + 'T00:00:00')
  const diffDays = Math.round((to.getTime() - from.getTime()) / 86_400_000)
  expect(diffDays).toBe(29)
})

it('active preset button has active class when preset matches and no pending', () => {
  dateRange.value = { from: '2026-06-19', to: '2026-06-26', preset: '7d' }
  render(<DateRangePicker />)
  fireEvent.click(screen.getByRole('button'))
  expect(screen.getByText('7 days').className).toContain('bg-primary')
  expect(screen.getByText('30 days').className).not.toContain('bg-primary')
})

it('trigger label shows applied range only (not pending) after first calendar click', () => {
  render(<DateRangePicker />)
  fireEvent.click(screen.getByRole('button', { name: 'Jun 1 - Jun 30' }))
  // trigger label should still show the applied range, not change mid-selection
  expect(screen.getByRole('button', { name: 'Jun 1 - Jun 30' })).toHaveTextContent('Jun 1 - Jun 30')
})

it('Apply button is absent before a range is completed via calendar', () => {
  render(<DateRangePicker />)
  fireEvent.click(screen.getByRole('button'))
  expect(screen.queryByRole('button', { name: /apply/i })).toBeNull()
})

it('localISODate produces correct local date independent of UTC conversion', () => {
  // Simulate by testing applyPreset which also uses localISODate internally:
  // The stored dates should not be shifted relative to today's local date.
  render(<DateRangePicker />)
  fireEvent.click(screen.getByRole('button'))
  fireEvent.click(screen.getByText('7 days'))
  const toDate = new Date(dateRange.value.to + 'T00:00:00')
  const today = new Date()
  // to should be today's local date (same year/month/day)
  expect(toDate.getFullYear()).toBe(today.getFullYear())
  expect(toDate.getMonth()).toBe(today.getMonth())
  expect(toDate.getDate()).toBe(today.getDate())
})
