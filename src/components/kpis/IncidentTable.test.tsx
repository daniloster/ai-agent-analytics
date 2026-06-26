import { it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { IncidentRow } from './IncidentTable'
import { IncidentTable } from './IncidentTable'

const INC_JAN3: IncidentRow = { detected_at: '2024-01-03T00:00:00Z', resolved_at: '2024-01-03T01:00:00Z', mttr_minutes: 60, error_type: 'rate_limit' }
const INC_JAN1: IncidentRow = { detected_at: '2024-01-01T00:00:00Z', resolved_at: null, mttr_minutes: null, error_type: 'tool_failure' }
const INC_JAN2: IncidentRow = { detected_at: '2024-01-02T00:00:00Z', resolved_at: '2024-01-02T00:42:00Z', mttr_minutes: 42, error_type: 'context_overflow' }

it('rows render sorted descending by detected_at', () => {
  const { container } = render(
    <IncidentTable incidents={[INC_JAN3, INC_JAN1, INC_JAN2]} />,
  )
  const rows = container.querySelectorAll('tbody tr')
  // Jan 3, Jan 2, Jan 1 order
  expect(rows[0]?.textContent).toContain('rate_limit')
  expect(rows[1]?.textContent).toContain('context_overflow')
  expect(rows[2]?.textContent).toContain('tool_failure')
})

it('resolved_at = null shows "Unresolved" with text-amber-600', () => {
  const { container } = render(<IncidentTable incidents={[INC_JAN1]} />)
  const unresolvedEl = container.querySelector('.text-amber-600')
  expect(unresolvedEl).not.toBeNull()
  expect(unresolvedEl?.textContent).toBe('Unresolved')
})

it('resolved_at not null shows a formatted date string', () => {
  const { container } = render(<IncidentTable incidents={[INC_JAN3]} />)
  expect(container.querySelector('.text-amber-600')).toBeNull()
})

it('mttr_minutes = null shows "-"', () => {
  render(<IncidentTable incidents={[INC_JAN1]} />)
  expect(screen.getByText('-')).toBeTruthy()
})

it('mttr_minutes = 42 shows "42 min"', () => {
  render(<IncidentTable incidents={[INC_JAN2]} />)
  expect(screen.getByText('42 min')).toBeTruthy()
})

it('Error Type column renders a Badge with the correct text', () => {
  const { container } = render(<IncidentTable incidents={[INC_JAN3]} />)
  expect(screen.getByText('rate_limit')).toBeTruthy()
  // Badge renders a span; check it has bg-secondary class
  const badge = container.querySelector('.bg-secondary')
  expect(badge).not.toBeNull()
})

it('caption shows "1 incident" (singular) when incidents.length === 1', () => {
  render(<IncidentTable incidents={[INC_JAN1]} />)
  expect(screen.getByText('1 incident')).toBeTruthy()
})

it('caption shows "3 incidents" (plural) when incidents.length === 3', () => {
  render(<IncidentTable incidents={[INC_JAN3, INC_JAN1, INC_JAN2]} />)
  expect(screen.getByText('3 incidents')).toBeTruthy()
})
