import { it, expect, beforeEach } from 'vitest'
import { render, fireEvent, screen } from '@testing-library/react'
import { dateRange } from '../../lib/filters/filterSignals'
import { DateRangePicker } from './DateRangePicker'

function resetDateRange() {
  dateRange.value = { from: '2026-06-01', to: '2026-06-30', preset: '30d' }
}

beforeEach(() => {
  resetDateRange()
})

it('trigger button shows formatted date range from signal', () => {
  render(<DateRangePicker />)
  expect(screen.getByRole('button')).toHaveTextContent('Jun 1 - Jun 30')
})

it('clicking "30 days" sets dateRange with correct preset and date range', () => {
  render(<DateRangePicker />)
  fireEvent.click(screen.getByRole('button'))
  fireEvent.click(screen.getByText('30 days'))
  expect(dateRange.value.preset).toBe('30d')
  const fromDate = new Date(dateRange.value.from + 'T00:00:00')
  const toDate = new Date(dateRange.value.to + 'T00:00:00')
  const diffDays = Math.round((toDate.getTime() - fromDate.getTime()) / 86_400_000)
  expect(diffDays).toBe(29)
})

it('active preset button has active class; others do not', () => {
  dateRange.value = { from: '2026-06-19', to: '2026-06-26', preset: '7d' }
  render(<DateRangePicker />)
  fireEvent.click(screen.getByRole('button'))
  expect(screen.getByText('7 days').className).toContain('bg-primary')
  expect(screen.getByText('30 days').className).not.toContain('bg-primary')
})

it('clicking "Custom" sets dateRange preset to custom', () => {
  render(<DateRangePicker />)
  fireEvent.click(screen.getByRole('button'))
  fireEvent.click(screen.getByText('Custom'))
  expect(dateRange.value.preset).toBe('custom')
})

it('calendar pickers visible when preset is custom', () => {
  dateRange.value = { from: '2026-06-01', to: '2026-06-30', preset: 'custom' }
  render(<DateRangePicker />)
  fireEvent.click(screen.getByRole('button'))
  const grids = screen.getAllByRole('grid')
  expect(grids.length).toBeGreaterThanOrEqual(2)
})

it('calendar pickers absent when preset is non-custom', () => {
  render(<DateRangePicker />)
  fireEvent.click(screen.getByRole('button'))
  expect(screen.queryAllByRole('grid')).toHaveLength(0)
})
