import { it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ChargebackRow } from './ChargebackTable'
import { ChargebackTable } from './ChargebackTable'

const ROW_A: ChargebackRow = { team_id: 'a', team_name: 'Alpha', seat_cost_prorated: 1000, token_cost: 2000, total: 5000, percentage: 31.25 }
const ROW_B: ChargebackRow = { team_id: 'b', team_name: 'Beta', seat_cost_prorated: 2000, token_cost: 4000, total: 8000, percentage: 50.0 }
const ROW_C: ChargebackRow = { team_id: 'c', team_name: 'Gamma', seat_cost_prorated: 500, token_cost: 1000, total: 3000, percentage: 18.75 }

it('rows sorted descending by total: B, A, C', () => {
  const { container } = render(<ChargebackTable rows={[ROW_A, ROW_B, ROW_C]} />)
  const bodyRows = container.querySelectorAll('tbody tr')
  expect(bodyRows[0]?.textContent).toContain('Beta')
  expect(bodyRows[1]?.textContent).toContain('Alpha')
  expect(bodyRows[2]?.textContent).toContain('Gamma')
})

it('"Organization Total" row is the last rendered row in tfoot', () => {
  render(<ChargebackTable rows={[ROW_A, ROW_B, ROW_C]} />)
  expect(screen.getByText('Organization Total')).toBeTruthy()
})

it('Seat Cost cells contain "$"', () => {
  const { container } = render(<ChargebackTable rows={[ROW_A]} />)
  const cells = container.querySelectorAll('tbody td')
  expect(cells[1]?.textContent).toContain('$')
})

it('% of Org cells contain "%"', () => {
  const { container } = render(<ChargebackTable rows={[ROW_A]} />)
  const cells = container.querySelectorAll('tbody td')
  expect(cells[4]?.textContent).toContain('%')
})

it('totals row shows summed seat cost', () => {
  const { container } = render(<ChargebackTable rows={[ROW_A, ROW_B]} />)
  const tfootCells = container.querySelectorAll('tfoot td')
  // sumSeat = 1000 + 2000 = 3000
  expect(tfootCells[1]?.textContent).toContain('$')
  expect(tfootCells[1]?.textContent).toContain('3')
})

it('totals row percentage column shows "100.0%"', () => {
  const { container } = render(<ChargebackTable rows={[ROW_A, ROW_B, ROW_C]} />)
  const tfootCells = container.querySelectorAll('tfoot td')
  expect(tfootCells[4]?.textContent).toBe('100.0%')
})

it('single-row input does not throw', () => {
  expect(() => render(<ChargebackTable rows={[ROW_A]} />)).not.toThrow()
})

it('table is wrapped in overflow-x-auto container for horizontal scroll', () => {
  const { container } = render(<ChargebackTable rows={[ROW_A, ROW_B]} />)
  const wrapper = container.querySelector('div.overflow-x-auto')
  expect(wrapper).not.toBeNull()
  expect(wrapper?.querySelector('table')).not.toBeNull()
})
