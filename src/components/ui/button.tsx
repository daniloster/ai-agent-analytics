import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost'
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  default: 'bg-primary text-primary-foreground hover:opacity-90',
  outline: 'border border-border bg-transparent hover:bg-muted',
  ghost: 'bg-transparent hover:bg-muted',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ variant = 'default', className, ...props }, ref) {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-3 transition-colors disabled:opacity-50',
          variantClasses[variant],
          className,
        )}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
