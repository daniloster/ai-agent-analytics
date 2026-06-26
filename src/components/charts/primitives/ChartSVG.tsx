import ParentSize from '@visx/responsive/lib/components/ParentSize'

interface ChartSVGProps {
  height?: number
  className?: string
  children: (innerWidth: number, innerHeight: number) => React.ReactNode
}

export function ChartSVG({ height, className, children }: ChartSVGProps): JSX.Element {
  const outerClass = ['min-h-[200px]', className].filter(Boolean).join(' ')
  return (
    <ParentSize
      className={outerClass}
      initialSize={height !== undefined ? { height } : undefined}
      style={height !== undefined ? { height } : undefined}
    >
      {({ width, height: measuredHeight }) =>
        width > 0 ? children(width, height ?? measuredHeight) : null
      }
    </ParentSize>
  )
}
