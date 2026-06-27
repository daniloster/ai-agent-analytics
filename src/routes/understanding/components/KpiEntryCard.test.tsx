import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KpiEntryCard } from './KpiEntryCard'
import type { KpiEntry } from '../data/kpis'

const SAMPLE_ENTRY: KpiEntry = {
  id: 'O-05',
  section: 'overview',
  label: '7-Day Retention Cost',
  whatItMeasures: 'Total period cost divided by the number of retained users.',
  formula: 'total_cost / retained_users_7d',
  example: 'e.g. $100.00 / user; down from $118.00',
  whyItMatters: 'Unit economics of retention.',
  visualization: 'KPI card with inverted delta + purple sparkline.',
}

const SAMPLE_ENTRY_2: KpiEntry = {
  id: 'B-04',
  section: 'billing',
  label: 'Cost per Successful Run',
  whatItMeasures: 'Average cost of producing one successfully completed agent output.',
  formula: 'current_month_spend / successful_run_count',
  example: 'e.g. $1.21 per successful run; -$0.08 WoW',
  whyItMatters: 'The clearest unit economics metric.',
  visualization: 'KPI card with inverted currency delta.',
}

describe('KpiEntryCard', () => {
  it('renders kpi.id in a Badge element', () => {
    render(<KpiEntryCard kpi={SAMPLE_ENTRY} />)
    expect(screen.getByText('O-05')).toBeTruthy()
  })

  it('renders kpi.label as the card title', () => {
    render(<KpiEntryCard kpi={SAMPLE_ENTRY} />)
    expect(screen.getByText('7-Day Retention Cost')).toBeTruthy()
  })

  it('renders kpi.formula inside a <code> element', () => {
    const { container } = render(<KpiEntryCard kpi={SAMPLE_ENTRY} />)
    const code = container.querySelector('code')
    expect(code).toBeTruthy()
    expect(code!.textContent).toContain('total_cost / retained_users_7d')
  })

  it('renders kpi.example text in the output', () => {
    render(<KpiEntryCard kpi={SAMPLE_ENTRY} />)
    expect(screen.getByText(/\$100\.00 \/ user/)).toBeTruthy()
  })

  it('renders kpi.whyItMatters text in the output', () => {
    render(<KpiEntryCard kpi={SAMPLE_ENTRY} />)
    expect(screen.getByText('Unit economics of retention.')).toBeTruthy()
  })

  it('renders kpi.visualization text in the output', () => {
    render(<KpiEntryCard kpi={SAMPLE_ENTRY} />)
    expect(screen.getByText(/KPI card with inverted delta/)).toBeTruthy()
  })

  it('rendering two different entries produces two distinct id values', () => {
    const { unmount } = render(<KpiEntryCard kpi={SAMPLE_ENTRY} />)
    expect(screen.getByText('O-05')).toBeTruthy()
    unmount()
    render(<KpiEntryCard kpi={SAMPLE_ENTRY_2} />)
    expect(screen.getByText('B-04')).toBeTruthy()
  })

  it('formula with null-related text in the string does not throw', () => {
    const entry: KpiEntry = {
      ...SAMPLE_ENTRY,
      formula: 'total_cost / (rated_run_count * avg_quality_score) -- null when rated_run_count < 10',
    }
    expect(() => render(<KpiEntryCard kpi={entry} />)).not.toThrow()
  })
})
