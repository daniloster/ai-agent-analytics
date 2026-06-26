import { scaleLinear, scaleBand, scaleTime } from '@visx/scale'
import type { AnyD3Scale, AxisConfig } from '../../../types/charts'

export function buildScale(
  config: AxisConfig,
  data: Record<string, unknown>[],
  innerWidth: number,
  innerHeight: number,
): AnyD3Scale {
  const range: [number, number] =
    config.position === 'bottom' ? [0, innerWidth] : [innerHeight, 0]

  if (config.type === 'band') {
    const values =
      config.domain === 'auto' || !config.domain
        ? [...new Set(data.map((d) => String(config.accessor(d))))]
        : []
    const domain =
      config.domain === 'auto' || !config.domain ? values : []
    return scaleBand<string>({ domain, range, padding: 0.2 })
  }

  if (config.type === 'time') {
    if (config.domain && config.domain !== 'auto') {
      const [min, max] = config.domain
      return scaleTime<number>({ domain: [new Date(min), new Date(max)], range })
    }
    if (data.length === 0) {
      return scaleTime<number>({ domain: [new Date(0), new Date(1)], range })
    }
    const dates = data.map((d) => {
      const v = config.accessor(d)
      return v instanceof Date ? v : new Date(v as string | number)
    })
    const min = new Date(Math.min(...dates.map((d) => d.getTime())))
    const max = new Date(Math.max(...dates.map((d) => d.getTime())))
    return scaleTime<number>({ domain: [min, max], range })
  }

  // linear
  if (config.domain && config.domain !== 'auto') {
    return scaleLinear<number>({ domain: config.domain, range })
  }
  if (data.length === 0) {
    return scaleLinear<number>({ domain: [0, 1], range })
  }
  const values = data.map((d) => Number(config.accessor(d)))
  const min = Math.min(...values)
  const max = Math.max(...values)
  return scaleLinear<number>({ domain: [min, max], range })
}
