import { cn } from '../../lib/utils'

export function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>): JSX.Element {
  return <table className={cn('w-full caption-bottom text-sm', className)} {...props} />
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>): JSX.Element {
  return <thead className={cn('[&_tr]:border-b', className)} {...props} />
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>): JSX.Element {
  return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>): JSX.Element {
  return (
    <tr
      className={cn('border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted', className)}
      {...props}
    />
  )
}

export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>): JSX.Element {
  return (
    <th
      className={cn('h-12 px-4 text-left align-middle font-medium text-muted-foreground', className)}
      {...props}
    />
  )
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>): JSX.Element {
  return <td className={cn('p-4 align-middle', className)} {...props} />
}

export function TableCaption({ className, ...props }: React.HTMLAttributes<HTMLTableCaptionElement>): JSX.Element {
  return <caption className={cn('mt-4 text-sm text-muted-foreground', className)} {...props} />
}
