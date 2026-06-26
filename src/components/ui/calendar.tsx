import { DayPicker } from 'react-day-picker'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from './button'

type CalendarProps = React.ComponentProps<typeof DayPicker>

export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps): JSX.Element {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col',
        month: 'space-y-4',
        month_caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium',
        nav: 'space-x-1 flex items-center',
        button_previous: 'absolute left-1',
        button_next: 'absolute right-1',
        month_grid: 'w-full border-collapse space-y-1',
        weekdays: 'flex',
        weekday: 'text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]',
        week: 'flex w-full mt-2',
        day: 'h-9 w-9 text-center text-sm p-0 relative',
        day_button: cn(
          'h-9 w-9 p-0 font-normal rounded-md hover:bg-accent hover:text-accent-foreground',
          'focus:outline-none focus:ring-2 focus:ring-ring',
        ),
        selected: '[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary',
        today: '[&>button]:bg-accent [&>button]:text-accent-foreground',
        outside: '[&>button]:text-muted-foreground [&>button]:opacity-50',
        disabled: '[&>button]:text-muted-foreground [&>button]:opacity-50',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left' ? (
            <Button variant="ghost" className="h-7 w-7 p-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant="ghost" className="h-7 w-7 p-0">
              <ChevronRight className="h-4 w-4" />
            </Button>
          ),
      }}
      {...props}
    />
  )
}
