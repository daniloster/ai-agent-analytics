import { it, expect, describe } from 'vitest'
import { buildScale } from './scales'
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
