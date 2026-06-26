import { useMemo } from 'react'
import { useDeepComputed } from '../../hooks/useDeepComputed'
import { Visualization } from './Visualization'
import { Bar } from './marks/Bar'
import { Annotation } from './overlays/Annotation'

export interface ColumnChartBar {
  label: string
  value: number
  color?: string
}

export interface ColumnChartProps {
  bars: ColumnChartBar[]
  annotation?: { value: number; label: string }
  height?: number
  ariaLabel?: string
}

export function ColumnChart({ bars, annotation, height, ariaLabel }: ColumnChartProps): JSX.Element {
  const dataSig = useDeepComputed(() => ({ bars }))
  const axes = useMemo(
    () => [
      {
        id: 'x',
        type: 'band' as const,
        position: 'bottom' as const,
        accessor: (d: unknown) => (d as ColumnChartBar).label,
      },
      {
        id: 'y',
        type: 'linear' as const,
        position: 'left' as const,
        accessor: (d: unknown) => (d as ColumnChartBar).value,
        domain: 'auto' as const,
      },
    ],
    [],
  )

  return (
    <Visualization data={dataSig} axes={axes} height={height} ariaLabel={ariaLabel}>
      {() => (
        <>
          <Bar series="bars" axis="y" />
          {annotation && (
            <Annotation axis="y" value={annotation.value} label={annotation.label} variant="warning" />
          )}
        </>
      )}
    </Visualization>
  )
}
