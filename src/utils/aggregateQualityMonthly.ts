import type { TimeseriesPoint } from '../types/api'

export interface MonthlyQualityPoint {
  label: string
  quality: number | null
  volume: number
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function isLastDayOfMonth(dateStr: string): boolean {
  const d = new Date(dateStr + 'T00:00:00Z')
  const next = new Date(d)
  next.setUTCDate(d.getUTCDate() + 1)
  return next.getUTCDate() === 1
}

function avgQuality(pts: TimeseriesPoint[]): number | null {
  const valid = pts.filter(p => p.avg_quality_score !== null)
  if (valid.length === 0) return null
  return valid.reduce((s, p) => s + p.avg_quality_score!, 0) / valid.length
}

function sumVolume(pts: TimeseriesPoint[]): number {
  return pts.reduce((s, p) => s + p.rated_run_count, 0)
}

/**
 * Aggregates daily timeseries points into monthly quality trend buckets.
 *
 * Groups all points by calendar month (YYYY-MM). For the month that contains
 * `to`, if `to` is not the last day of that month, all points in that month
 * are merged into a single "(Now)" bucket labeled "Mon (Now)" - representing
 * the current in-progress month up to the selected period end.
 * All other months become a single labeled bucket ("Jan", "Feb", etc.).
 *
 * Results are sorted chronologically.
 */
export function aggregateQualityMonthly(
  points: TimeseriesPoint[],
  to: string,
): MonthlyQualityPoint[] {
  if (points.length === 0) return []

  const byMonth = new Map<string, TimeseriesPoint[]>()
  for (const pt of points) {
    const key = pt.date.slice(0, 7)
    if (!byMonth.has(key)) byMonth.set(key, [])
    byMonth.get(key)!.push(pt)
  }

  const sortedMonths = [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b))
  const toMonth = to.slice(0, 7)
  const partial = !isLastDayOfMonth(to)
  const result: MonthlyQualityPoint[] = []

  for (const [monthKey, pts] of sortedMonths) {
    const month0 = parseInt(monthKey.slice(5, 7)) - 1
    const label = MONTH_SHORT[month0] ?? monthKey

    if (monthKey === toMonth && partial) {
      result.push({
        label: `${label} (Now)`,
        quality: avgQuality(pts),
        volume: sumVolume(pts),
      })
    } else {
      result.push({
        label,
        quality: avgQuality(pts),
        volume: sumVolume(pts),
      })
    }
  }

  return result
}
