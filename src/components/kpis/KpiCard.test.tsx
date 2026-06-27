import { it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { KpiCard } from './KpiCard'

beforeEach(() => {
  vi.clearAllMocks()
})

const BASE_PROPS = {
  label: 'Total Runs',
  value: '12,450',
  formulaTooltip: 'Total runs formula',
  exampleTooltip: 'e.g. 12,450 runs',
}

it('renders label and value text when both are provided', () => {
  render(<KpiCard {...BASE_PROPS} />)
  expect(screen.getByText('Total Runs')).toBeTruthy()
  expect(screen.getByText('12,450')).toBeTruthy()
})

it('renders Skeleton when value is undefined', () => {
  const { container } = render(<KpiCard {...BASE_PROPS} value={undefined} />)
  expect(container.querySelector('.animate-pulse')).not.toBeNull()
  expect(screen.queryByText('12,450')).toBeNull()
})

it('positive delta renders green badge with + prefix', () => {
  const { container } = render(<KpiCard {...BASE_PROPS} delta={18.4} />)
  expect(screen.getByText('+18.4%')).toBeTruthy()
  const badge = container.querySelector('.bg-green-50')
  expect(badge).not.toBeNull()
})

it('negative delta renders red badge with - prefix', () => {
  const { container } = render(<KpiCard {...BASE_PROPS} delta={-3.2} />)
  expect(screen.getByText('-3.2%')).toBeTruthy()
  const badge = container.querySelector('.bg-red-50')
  expect(badge).not.toBeNull()
})

it('undefined delta renders no badge', () => {
  const { container } = render(<KpiCard {...BASE_PROPS} delta={undefined} />)
  expect(container.querySelector('.bg-green-50')).toBeNull()
  expect(container.querySelector('.bg-red-50')).toBeNull()
})

it('insufficientData=true renders status span with Insufficient data', () => {
  render(<KpiCard {...BASE_PROPS} insufficientData={true} />)
  const status = screen.getByRole('status')
  expect(status).toBeTruthy()
  expect(status.textContent).toContain('Insufficient data')
  expect(screen.queryByText('12,450')).toBeNull()
})

it('insufficientData=true with reason renders the reason text', () => {
  render(
    <KpiCard
      {...BASE_PROPS}
      insufficientData={true}
      insufficientDataReason="Need 10+ rated runs"
    />,
  )
  expect(screen.getByText('Need 10+ rated runs')).toBeTruthy()
})

it('clicking info button renders formulaTooltip text in the DOM', () => {
  const { rerender } = render(<KpiCard {...BASE_PROPS} />)
  const btn = screen.getByRole('button', { name: /more information/i })
  fireEvent.click(btn)
  rerender(<KpiCard {...BASE_PROPS} />)
  expect(screen.getByText('Total runs formula')).toBeTruthy()
})

it('trend array with 2+ points renders an SVG sparkline', () => {
  const trend = [{ date: '2026-06-01', value: 10 }, { date: '2026-06-02', value: 20 }]
  const { container } = render(<KpiCard {...BASE_PROPS} trend={trend} />)
  expect(container.querySelector('svg')).not.toBeNull()
})

it('no trend prop renders no SVG element', () => {
  const { container } = render(<KpiCard {...BASE_PROPS} />)
  expect(container.querySelector('svg')).toBeNull()
})

it('statusDot="critical" renders a span with bg-red-500', () => {
  const { container } = render(<KpiCard {...BASE_PROPS} statusDot="critical" />)
  expect(container.querySelector('.bg-red-500')).not.toBeNull()
})

it('statusDot="warning" renders a span with bg-amber-500', () => {
  const { container } = render(<KpiCard {...BASE_PROPS} statusDot="warning" />)
  expect(container.querySelector('.bg-amber-500')).not.toBeNull()
})

it('statusDot="good" renders a span with bg-emerald-500', () => {
  const { container } = render(<KpiCard {...BASE_PROPS} statusDot="good" />)
  expect(container.querySelector('.bg-emerald-500')).not.toBeNull()
})

it('no statusDot prop renders no dot element', () => {
  const { container } = render(<KpiCard {...BASE_PROPS} />)
  expect(container.querySelector('.bg-red-500')).toBeNull()
  expect(container.querySelector('.bg-amber-500')).toBeNull()
  expect(container.querySelector('.bg-emerald-500')).toBeNull()
})

it('dot span has aria-hidden="true"', () => {
  const { container } = render(<KpiCard {...BASE_PROPS} statusDot="good" />)
  const dot = container.querySelector('.bg-emerald-500')
  expect(dot?.getAttribute('aria-hidden')).toBe('true')
})

it('starRating=4.1 fills 82% of the star container', () => {
  const { container } = render(<KpiCard {...BASE_PROPS} starRating={4.1} />)
  const overlay = container.querySelector('[data-star-fill]') as HTMLElement | null
  expect(overlay).not.toBeNull()
  expect(overlay?.style.width).toBe('82%')
})

it('starRating=1.2 fills 24% (1 full + 20% of 2nd star)', () => {
  const { container } = render(<KpiCard {...BASE_PROPS} starRating={1.2} />)
  const overlay = container.querySelector('[data-star-fill]') as HTMLElement | null
  expect(overlay).not.toBeNull()
  expect(overlay?.style.width).toBe('24%')
})

it('starRating renders wrapper with aria-label containing the score', () => {
  render(<KpiCard {...BASE_PROPS} starRating={4.1} />)
  expect(screen.getByLabelText(/4\.1 out of 5/i)).toBeTruthy()
})

it('starRatingSubtext renders below stars when provided', () => {
  render(<KpiCard {...BASE_PROPS} starRating={4.1} starRatingSubtext="Based on 8,200 rated runs" />)
  expect(screen.getByText('Based on 8,200 rated runs')).toBeTruthy()
})

it('starRating=null renders no stars', () => {
  const { container } = render(<KpiCard {...BASE_PROPS} starRating={null} />)
  expect(container.querySelectorAll('[data-star-fill]').length).toBe(0)
})

it('no starRating prop renders no stars', () => {
  const { container } = render(<KpiCard {...BASE_PROPS} />)
  expect(container.querySelectorAll('[data-star-fill]').length).toBe(0)
})
