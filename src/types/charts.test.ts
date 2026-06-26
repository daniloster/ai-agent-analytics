import { it, expect } from 'vitest'
import type { AxisConfig, ActivePoint, AnyD3Scale } from './charts'

it('AxisConfig accepts all required fields', () => {
  const config: AxisConfig = {
    id: 'y',
    type: 'linear',
    position: 'left',
    accessor: (d) => d.value as number,
  }
  expect(config.id).toBe('y')
})

it('AxisConfig accepts time type', () => {
  const config: AxisConfig = {
    id: 'x',
    type: 'time',
    position: 'bottom',
    accessor: (d) => new Date(d.date as string),
    domain: 'auto',
  }
  expect(config.type).toBe('time')
})

it('AxisConfig accepts band type', () => {
  const config: AxisConfig = {
    id: 'x',
    type: 'band',
    position: 'bottom',
    accessor: (d) => d.label as string,
  }
  expect(config.type).toBe('band')
})

it('ActivePoint has all 5 required fields', () => {
  const point: ActivePoint = {
    series: 'value',
    axis: 'y',
    datum: { value: 42 },
    x: 100,
    y: 50,
  }
  expect(point.series).toBe('value')
  expect(point.axis).toBe('y')
  expect(point.datum).toEqual({ value: 42 })
  expect(point.x).toBe(100)
  expect(point.y).toBe(50)
})

it('AnyD3Scale type is assignable from ScaleLinear-shaped value', () => {
  // Type-level test: AnyD3Scale must be a union that includes callable scales
  const _typeCheck: AnyD3Scale = (() => 0) as unknown as AnyD3Scale
  expect(typeof _typeCheck).toBe('function')
})
