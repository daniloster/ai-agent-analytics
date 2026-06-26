import { describe, it, expect } from 'vitest'
import {
  computeRetentionCost,
  computeCostPerQualityPoint,
  computeCostPerAcceptedOutput,
  computeQualityCostEfficiency,
  computeProjectedMonthEnd,
  computeDeltaPercent,
  computeErrorRateSeverity,
  computeProjectedAnnualSpend,
  computeTokenRateEfficiency,
  computeCostPerSuccessfulRun,
} from './formulas'

describe('computeRetentionCost', () => {
  it('returns totalCost / mau for valid inputs', () => {
    expect(computeRetentionCost(14200, 340)).toBeCloseTo(41.76, 2)
  })

  it('returns 0 when mau is 0', () => {
    expect(computeRetentionCost(14200, 0)).toBe(0)
  })
})

describe('computeCostPerQualityPoint', () => {
  it('returns correct value for known inputs', () => {
    const result = computeCostPerQualityPoint(14200, 8200, 4.1)
    expect(result).not.toBeNull()
    expect(result as number).toBeGreaterThan(0.421)
    expect(result as number).toBeLessThan(0.423)
  })

  it('returns null when avgQualityScore is null', () => {
    expect(computeCostPerQualityPoint(14200, 8200, null)).toBeNull()
  })

  it('returns null when ratedRunCount < 10', () => {
    expect(computeCostPerQualityPoint(14200, 5, 4.1)).toBeNull()
  })

  it('returns null when ratedRunCount is exactly 9', () => {
    expect(computeCostPerQualityPoint(14200, 9, 4.1)).toBeNull()
  })

  it('returns value when ratedRunCount is exactly 10', () => {
    expect(computeCostPerQualityPoint(14200, 10, 4.1)).not.toBeNull()
  })
})

describe('computeCostPerAcceptedOutput', () => {
  it('returns null when acceptanceRate is null', () => {
    expect(computeCostPerAcceptedOutput(14200, 8200, null)).toBeNull()
  })

  it('returns correct value for known inputs', () => {
    const result = computeCostPerAcceptedOutput(1000, 100, 0.5)
    expect(result).toBeCloseTo(20, 5)
  })
})

describe('computeQualityCostEfficiency', () => {
  it('returns null when avgQuality is null', () => {
    expect(computeQualityCostEfficiency(null, 0.8, 5)).toBeNull()
  })

  it('returns null when acceptanceRate is null', () => {
    expect(computeQualityCostEfficiency(4.1, null, 5)).toBeNull()
  })

  it('returns correct value for known inputs', () => {
    const result = computeQualityCostEfficiency(4.0, 0.8, 2.0)
    expect(result).toBeCloseTo(1.6, 5)
  })
})

describe('computeProjectedMonthEnd', () => {
  it('returns proportional projection', () => {
    expect(computeProjectedMonthEnd(300, 10, 30)).toBe(900)
  })

  it('returns 0 when daysElapsed is 0', () => {
    expect(computeProjectedMonthEnd(0, 0, 30)).toBe(0)
  })
})

describe('computeDeltaPercent', () => {
  it('returns positive delta', () => {
    expect(computeDeltaPercent(120, 100)).toBe(20)
  })

  it('returns negative delta', () => {
    expect(computeDeltaPercent(80, 100)).toBe(-20)
  })

  it('returns 0 for equal values', () => {
    expect(computeDeltaPercent(100, 100)).toBe(0)
  })

  it('returns 0 when prior is 0', () => {
    expect(computeDeltaPercent(100, 0)).toBe(0)
  })
})

describe('computeErrorRateSeverity', () => {
  it('returns good for errorRate < 0.02', () => {
    expect(computeErrorRateSeverity(0.01)).toBe('good')
  })

  it('returns warning at boundary 0.02 (inclusive)', () => {
    expect(computeErrorRateSeverity(0.02)).toBe('warning')
  })

  it('returns warning for errorRate between 0.02 and 0.05', () => {
    expect(computeErrorRateSeverity(0.03)).toBe('warning')
  })

  it('returns critical at boundary 0.05 (inclusive)', () => {
    expect(computeErrorRateSeverity(0.05)).toBe('critical')
  })

  it('returns critical for errorRate > 0.05', () => {
    expect(computeErrorRateSeverity(0.06)).toBe('critical')
  })
})

describe('computeProjectedAnnualSpend', () => {
  it('returns (cost90d / 90) * 365 for a known input', () => {
    expect(computeProjectedAnnualSpend(38780)).toBeCloseTo((38780 / 90) * 365, 5)
  })

  it('returns 0 when cost90d is 0', () => {
    expect(computeProjectedAnnualSpend(0)).toBe(0)
  })
})

describe('computeTokenRateEfficiency', () => {
  it('returns totalTokenCost / (totalTokens / 1_000_000) for known inputs', () => {
    expect(computeTokenRateEfficiency(3, 1_000_000)).toBeCloseTo(3.0, 5)
  })

  it('returns 0 when totalTokens is 0 (zero guard)', () => {
    expect(computeTokenRateEfficiency(0, 0)).toBe(0)
  })
})

describe('computeCostPerSuccessfulRun', () => {
  it('returns totalCost / successfulRunCount for known inputs', () => {
    expect(computeCostPerSuccessfulRun(14200, 11720)).toBeCloseTo(14200 / 11720, 5)
  })

  it('returns 0 when successfulRunCount is 0 (zero guard)', () => {
    expect(computeCostPerSuccessfulRun(0, 0)).toBe(0)
  })
})
