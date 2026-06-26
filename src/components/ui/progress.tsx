import { cn } from '../../lib/utils'

export interface ProgressProps {
  value: number
  className?: string
}

export function Progress({ value, className }: ProgressProps): JSX.Element {
  return (
    <div className={cn('relative h-2 w-full overflow-hidden rounded-full bg-secondary', className)}>
      <div
        className="h-full bg-primary transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}
