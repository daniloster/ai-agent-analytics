export function computeRetentionCost(totalCost: number, mau: number): number {
  if (mau === 0) return 0
  return totalCost / mau
}

export function computeCostPerQualityPoint(
  totalCost: number,
  ratedRunCount: number,
  avgQualityScore: number | null,
): number | null {
  if (avgQualityScore === null || ratedRunCount < 10) return null
  return totalCost / (ratedRunCount * avgQualityScore)
}

export function computeCostPerAcceptedOutput(
  totalCost: number,
  runCount: number,
  acceptanceRate: number | null,
): number | null {
  if (acceptanceRate === null) return null
  return totalCost / (runCount * acceptanceRate)
}

export function computeQualityCostEfficiency(
  avgQuality: number | null,
  acceptanceRate: number | null,
  costPerRun: number,
): number | null {
  if (avgQuality === null || acceptanceRate === null) return null
  return (avgQuality * acceptanceRate) / costPerRun
}

export function computeProjectedMonthEnd(
  currentSpend: number,
  daysElapsed: number,
  daysInMonth: number,
): number {
  if (daysElapsed === 0) return 0
  return (currentSpend / daysElapsed) * daysInMonth
}

export function computeDeltaPercent(current: number, prior: number): number {
  if (prior === 0) return 0
  return ((current - prior) / prior) * 100
}

export type ErrorRateSeverity = 'good' | 'warning' | 'critical'

export function computeErrorRateSeverity(errorRate: number): ErrorRateSeverity {
  if (errorRate < 0.02) return 'good'
  if (errorRate < 0.05) return 'warning'
  return 'critical'
}
