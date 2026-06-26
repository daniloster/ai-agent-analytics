import ParentSize from '@visx/responsive/lib/components/ParentSize'
import type { ReadonlySignal } from '@preact/signals-react'
import { useComputed } from '@preact/signals-react'
import { useLiveSignal } from '../../../hooks/useLiveSignal'

interface InnerProps {
  width: number
  height: number
  heightOverride: number | undefined
  children: (width: ReadonlySignal<number>, height: ReadonlySignal<number>) => React.ReactNode
}

// Inner component needed so hooks can be called outside of a callback.
function ParentSizeComputedInner({ width, height, heightOverride, children }: InnerProps): JSX.Element {
  const widthSig = useLiveSignal(width)
  const measuredHeightSig = useLiveSignal(height)
  const overrideSig = useLiveSignal(heightOverride)
  // Apply fixed height override if provided, otherwise use measured height.
  const heightSig = useComputed(() => overrideSig.value ?? measuredHeightSig.value)
  return <>{children(widthSig, heightSig)}</>
}

export interface ParentSizeComputedProps {
  className?: string
  style?: React.CSSProperties
  initialSize?: { width?: number; height?: number }
  heightOverride?: number
  children: (width: ReadonlySignal<number>, height: ReadonlySignal<number>) => React.ReactNode
}

export function ParentSizeComputed({
  className,
  style,
  initialSize,
  heightOverride,
  children,
}: ParentSizeComputedProps): JSX.Element {
  return (
    <ParentSize className={className} style={style} initialSize={initialSize}>
      {({ width, height }) => (
        <ParentSizeComputedInner
          width={width}
          height={height}
          heightOverride={heightOverride}
        >
          {children}
        </ParentSizeComputedInner>
      )}
    </ParentSize>
  )
}
