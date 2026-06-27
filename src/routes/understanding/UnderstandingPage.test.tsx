import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { UnderstandingPage } from './UnderstandingPage'

// Mock the sidebar to avoid IntersectionObserver in jsdom
vi.mock('./components/UnderstandingSidebar', () => ({
  UnderstandingSidebar: () => <aside data-testid="sidebar" />,
}))

function renderPage() {
  return render(
    <MemoryRouter>
      <UnderstandingPage />
    </MemoryRouter>,
  )
}

describe('UnderstandingPage', () => {
  it('renders without throwing inside MemoryRouter', () => {
    expect(() => renderPage()).not.toThrow()
  })

  it('all 7 section id values are present in the DOM', () => {
    const { container } = renderPage()
    const ids = ['about', 'premise', 'kpis', 'decisions', 'tech', 'scope', 'glossary']
    for (const id of ids) {
      expect(container.querySelector(`#${id}`), `section #${id}`).not.toBeNull()
    }
  })

  it('heading "About This Dashboard" is present', () => {
    renderPage()
    expect(screen.getByText('About This Dashboard')).toBeTruthy()
  })

  it('text "hybrid token + seat model" is present', () => {
    renderPage()
    expect(screen.getAllByText(/hybrid token \+ seat model/i).length).toBeGreaterThanOrEqual(1)
  })

  it('the #premise section labels the billing model as a premise for evaluators', () => {
    renderPage()
    expect(screen.getByText(/premise for evaluators/i)).toBeTruthy()
  })

  it('exactly 38 <code> elements are present (one per KpiEntryCard formula)', () => {
    const { container } = renderPage()
    const codes = container.querySelectorAll('code')
    // TECH_DECISIONS also has code elements (packageRef)
    // Count only code elements that are inside #kpis section
    const kpisSection = container.querySelector('#kpis')
    const kpisCodes = kpisSection?.querySelectorAll('code') ?? []
    expect(kpisCodes.length).toBe(38)
  })

  it('exactly 15 aria-expanded buttons are present (one per DecisionCard toggle)', () => {
    const { container } = renderPage()
    const buttons = container.querySelectorAll('button[aria-expanded]')
    expect(buttons.length).toBe(15)
  })

  it('<dl> element is present and has at least 20 <dt> children', () => {
    const { container } = renderPage()
    const dl = container.querySelector('dl')
    expect(dl).not.toBeNull()
    const dts = dl!.querySelectorAll('dt')
    expect(dts.length).toBeGreaterThanOrEqual(20)
  })

  it('mocked sidebar is rendered', () => {
    renderPage()
    expect(screen.getByTestId('sidebar')).toBeTruthy()
  })

  it('main element has id="main-content"', () => {
    const { container } = renderPage()
    expect(container.querySelector('#main-content')).not.toBeNull()
  })

  it('KPI sections have h3 headings for overview, teams, reliability, billing', () => {
    renderPage()
    expect(screen.getByText('Overview')).toBeTruthy()
    expect(screen.getByText('Teams')).toBeTruthy()
    expect(screen.getByText('Reliability')).toBeTruthy()
    expect(screen.getByText('Billing & Financial')).toBeTruthy()
  })
})
