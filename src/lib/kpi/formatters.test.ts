import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatTokens,
  formatPercent,
  formatDuration,
  formatQuality,
  formatNumber,
} from './formatters'

describe('formatCurrency', () => {
  it('formats sub-dollar values with 2 decimals', () => {
    expect(formatCurrency(0.42)).toBe('$0.42')
  })

  it('formats thousands with comma separator', () => {
    expect(formatCurrency(14200)).toBe('$14,200')
  })

  it('formats millions with one decimal', () => {
    expect(formatCurrency(1_400_000)).toBe('$1.4M')
  })

  it('formats values in the 1-999 range with 2 decimals', () => {
    expect(formatCurrency(42.5)).toBe('$42.50')
  })
})

describe('formatTokens', () => {
  it('formats thousands', () => {
    expect(formatTokens(842_000)).toBe('842K')
  })

  it('formats whole millions without decimals', () => {
    expect(formatTokens(241_000_000)).toBe('241M')
  })

  it('formats fractional millions with one decimal', () => {
    expect(formatTokens(1_400_000)).toBe('1.4M')
  })

  it('formats billions with 2 decimals', () => {
    expect(formatTokens(2_410_000_000)).toBe('2.41B')
  })

  it('formats values below 1000 as locale integer', () => {
    expect(formatTokens(500)).toBe('500')
  })
})

describe('formatPercent', () => {
  it('formats with 1 decimal by default', () => {
    expect(formatPercent(72.5)).toBe('72.5%')
  })

  it('formats with 0 decimals when specified', () => {
    expect(formatPercent(72.5, 0)).toBe('73%')
  })
})

describe('formatDuration', () => {
  it('formats seconds only when under 60s', () => {
    expect(formatDuration(47_000)).toBe('47s')
  })

  it('formats minutes and seconds when 60s or more', () => {
    expect(formatDuration(123_000)).toBe('2m 3s')
  })

  it('formats exactly 60s as 1m 0s', () => {
    expect(formatDuration(60_000)).toBe('1m 0s')
  })
})

describe('formatNumber', () => {
  it('formats with thousands separator', () => {
    expect(formatNumber(12450)).toBe('12,450')
  })

  it('formats numbers below 1000 without separator', () => {
    expect(formatNumber(500)).toBe('500')
  })
})

describe('formatQuality', () => {
  it('formats score with one decimal and /5.0 suffix', () => {
    expect(formatQuality(4.1)).toBe('4.1 / 5.0')
  })

  it('formats whole number score with one decimal', () => {
    expect(formatQuality(5)).toBe('5.0 / 5.0')
  })
})
