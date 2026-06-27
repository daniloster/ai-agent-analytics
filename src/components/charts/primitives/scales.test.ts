import { it, expect, describe } from 'vitest'
import { buildScale } from './scales'
import { scaleLinear, scaleBand } from '@visx/scale'
import { scaleSequential } from 'd3-scale'
import { interpolateRgb } from 'd3-interpolate'
import type { AxisConfig } from '../../../types/charts'

const linearLeft: AxisConfig = {
  id: 'y',
  type: 'linear',
  position: 'left',
  accessor: (d) => d.v as number,
  domain: [0, 100],
}

describe('scaleLinear', () => {
  it('explicit domain [0,100] maps 50 to 100 (range [200,0])', () => {
    const scale = buildScale(linearLeft, [], 400, 200)
    // range [200, 0], domain [0, 100]: 50% -> 100
    expect((scale as (v: number) => number)(50)).toBe(100)
  })

  it('auto domain includes 0 as baseline and uses max of accessor values', () => {
    const config: AxisConfig = { ...linearLeft, domain: 'auto' }
    const data = [{ v: 10 }, { v: 20 }, { v: 30 }]
    const scale = buildScale(config, data, 400, 200) as (v: number) => number
    // domain is [0, 30] (0 included), range [200, 0]
    expect(scale(0)).toBeCloseTo(200)
    expect(scale(30)).toBeCloseTo(0)
  })

  it('empty data with auto domain does not throw', () => {
    const config: AxisConfig = { ...linearLeft, domain: 'auto' }
    expect(() => buildScale(config, [], 400, 200)).not.toThrow()
  })

  it('clamp(true) returns range max when input exceeds domain max', () => {
    const scale = scaleLinear({ domain: [0, 100], range: [0, 200] }).clamp(true)
    expect(scale(150)).toBe(200)
  })

  it('without clamp, extrapolates beyond range', () => {
    const scale = scaleLinear({ domain: [0, 100], range: [0, 200] })
    expect(scale(150)).toBe(300)
  })
})

describe('scaleBand', () => {
  it('bandwidth() > 0 for 3-item dataset', () => {
    const config: AxisConfig = {
      id: 'x',
      type: 'band',
      position: 'bottom',
      accessor: (d) => d.k as string,
    }
    const data = [{ k: 'a' }, { k: 'b' }, { k: 'c' }]
    const scale = buildScale(config, data, 300, 200)
    expect((scale as { bandwidth(): number }).bandwidth()).toBeGreaterThan(0)
  })

  it('bandwidth() === 100 for 4-item domain, range [0,400], padding 0', () => {
    const scale = scaleBand({ domain: ['a', 'b', 'c', 'd'], range: [0, 400], padding: 0 })
    expect(scale.bandwidth()).toBe(100)
  })

  it('bandwidth() < 100 for 4-item domain, range [0,400], padding 0.1', () => {
    const scale = scaleBand({ domain: ['a', 'b', 'c', 'd'], range: [0, 400], padding: 0.1 })
    expect(scale.bandwidth()).toBeLessThan(100)
  })
})

describe('scaleSequential', () => {
  it('returns an rgb string for domain start', () => {
    const scale = scaleSequential(interpolateRgb('#ff0000', '#00ff00')).domain([0, 1])
    expect(scale(0)).toMatch(/^rgb/)
  })

  it('returns a different string for domain end vs domain start', () => {
    const scale = scaleSequential(interpolateRgb('#ff0000', '#00ff00')).domain([0, 1])
    expect(scale(0)).not.toBe(scale(1))
  })
})

describe('scaleTime', () => {
  it('maps first date to 0 (start of range) with auto domain', () => {
    const config: AxisConfig = {
      id: 't',
      type: 'time',
      position: 'bottom',
      accessor: (d) => new Date(d.date as string),
    }
    const data = [{ date: '2026-01-01' }, { date: '2026-01-31' }]
    const scale = buildScale(config, data, 310, 200) as (v: Date) => number
    expect(scale(new Date('2026-01-01'))).toBeCloseTo(0)
  })

  it('empty data with auto domain does not throw', () => {
    const config: AxisConfig = {
      id: 't',
      type: 'time',
      position: 'bottom',
      accessor: (d) => new Date(d.date as string),
    }
    expect(() => buildScale(config, [], 310, 200)).not.toThrow()
  })
})
