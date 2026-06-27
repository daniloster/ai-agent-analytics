import { describe, it, expect } from 'vitest'
import { aggregateQualityMonthly } from './aggregateQualityMonthly'
import type { TimeseriesPoint } from '../types/api'

function pt(date: string, avg_quality_score: number | null, rated_run_count = 100): TimeseriesPoint {
  return {
    date,
    runs: 200,
    tokens: 50000,
    input_tokens: 35000,
    output_tokens: 15000,
    cost: 100,
    dau: 50,
    avg_quality_score,
    rated_run_count,
    error_rate: 2,
  }
}

describe('aggregateQualityMonthly', () => {
  it('returns empty array for empty input', () => {
    expect(aggregateQualityMonthly([], '2026-06-27')).toEqual([])
  })

  it('groups a single complete month into one bucket', () => {
    const pts = [
      pt('2026-05-01', 4.0, 100),
      pt('2026-05-15', 4.2, 200),
      pt('2026-05-31', 3.8, 150),
    ]
    const result = aggregateQualityMonthly(pts, '2026-05-31')
    expect(result).toHaveLength(1)
    expect(result[0]!.label).toBe('May')
    expect(result[0]!.quality).toBeCloseTo((4.0 + 4.2 + 3.8) / 3, 5)
    expect(result[0]!.volume).toBe(450)
  })

  it('labels last partial month as (Now) with all data aggregated when to is mid-month', () => {
    const pts = [
      pt('2026-06-01', 3.9, 100),
      pt('2026-06-15', 4.0, 150),
      pt('2026-06-27', 4.1, 80),
    ]
    const result = aggregateQualityMonthly(pts, '2026-06-27')
    expect(result).toHaveLength(1)
    expect(result[0]!.label).toBe('Jun (Now)')
    expect(result[0]!.quality).toBeCloseTo((3.9 + 4.0 + 4.1) / 3, 5)
    expect(result[0]!.volume).toBe(330)
  })

  it('does not split when to is the last day of the month', () => {
    const pts = [
      pt('2026-06-01', 4.0, 100),
      pt('2026-06-30', 4.2, 120),
    ]
    const result = aggregateQualityMonthly(pts, '2026-06-30')
    expect(result).toHaveLength(1)
    expect(result[0]!.label).toBe('Jun')
  })

  it('handles multiple months in chronological order', () => {
    const pts = [
      pt('2026-01-10', 3.5, 100),
      pt('2026-02-10', 3.7, 110),
      pt('2026-03-10', 3.9, 120),
      pt('2026-06-01', 4.0, 90),
      pt('2026-06-27', 4.1, 80),
    ]
    const result = aggregateQualityMonthly(pts, '2026-06-27')
    expect(result[0]!.label).toBe('Jan')
    expect(result[1]!.label).toBe('Feb')
    expect(result[2]!.label).toBe('Mar')
    expect(result[3]!.label).toBe('Jun (Now)')
    expect(result).toHaveLength(4)
  })

  it('returns null quality for months with no non-null quality data', () => {
    const pts = [
      pt('2026-05-01', null, 50),
      pt('2026-05-15', null, 70),
    ]
    const result = aggregateQualityMonthly(pts, '2026-05-31')
    expect(result[0]!.quality).toBeNull()
    expect(result[0]!.volume).toBe(120)
  })

  it('averages only non-null quality values within a month', () => {
    const pts = [
      pt('2026-05-01', null, 50),
      pt('2026-05-10', 4.0, 100),
      pt('2026-05-20', 4.4, 80),
    ]
    const result = aggregateQualityMonthly(pts, '2026-05-31')
    expect(result[0]!.quality).toBeCloseTo((4.0 + 4.4) / 2, 5)
  })

  it('labels single-day partial month as (Now)', () => {
    const pts = [pt('2026-06-27', 4.1, 80)]
    const result = aggregateQualityMonthly(pts, '2026-06-27')
    expect(result).toHaveLength(1)
    expect(result[0]!.label).toBe('Jun (Now)')
    expect(result[0]!.quality).toBe(4.1)
    expect(result[0]!.volume).toBe(80)
  })
})
