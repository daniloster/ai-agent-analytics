import { useSignal } from '@preact/signals-react'
import type { DateRange as DayPickerDateRange } from 'react-day-picker'
import { format } from 'date-fns'
import { dateRange } from '../../lib/filters/filterSignals'
import type { DatePreset } from '../../lib/filters/filterSignals'
import { Popover, PopoverTrigger, PopoverContent, PopoverClose } from '../ui/popover'
import { Calendar } from '../ui/calendar'
import { Button } from '../ui/button'

const PRESETS: Array<{ label: string; preset: DatePreset; daysBack: number }> = [
  { label: '7 days', preset: '7d', daysBack: 6 },
  { label: '30 days', preset: '30d', daysBack: 29 },
  { label: '90 days', preset: '90d', daysBack: 89 },
]

// Uses local date components to avoid UTC-midnight shifting in UTC+ timezones.
function localISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function DateRangePicker(): JSX.Element {
  const { from, to, preset } = dateRange.value
  const fromDate = new Date(from + 'T00:00:00')
  const toDate = new Date(to + 'T00:00:00')

  // null = no pending; { from, to: undefined } = first date picked; { from, to } = ready to apply
  const pending = useSignal<DayPickerDateRange | null>(null)

  const triggerLabel = format(fromDate, 'MMM d') + ' - ' + format(toDate, 'MMM d')

  // Calendar reflects pending selection when active, otherwise the applied range.
  const calendarSelected: DayPickerDateRange = pending.value ?? { from: fromDate, to: toDate }

  function handleCalendarSelect(range: DayPickerDateRange | undefined): void {
    if (!range?.from) {
      pending.value = null
      return
    }
    pending.value = { from: range.from, to: range.to }
  }

  function applyPending(): void {
    if (!pending.value?.from) return
    const newFrom = localISODate(pending.value.from)
    const newTo = pending.value.to ? localISODate(pending.value.to) : newFrom
    dateRange.value = { from: newFrom, to: newTo, preset: 'custom' }
    pending.value = null
  }

  function applyPreset(p: DatePreset, daysBack: number): void {
    pending.value = null
    const to = new Date()
    const from = new Date(to)
    from.setDate(from.getDate() - daysBack)
    dateRange.value = { from: localISODate(from), to: localISODate(to), preset: p }
  }

  const isPendingPartial = !!pending.value?.from && !pending.value?.to
  const isPendingComplete = !!pending.value?.from && !!pending.value?.to

  return (
    <Popover onOpenChange={(open) => { if (!open) pending.value = null }}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 px-3 text-sm">
          {triggerLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3">
        <div className="flex gap-1 mb-3">
          {PRESETS.map((p) => (
            <PopoverClose key={p.preset} asChild>
              <button
                onClick={() => applyPreset(p.preset, p.daysBack)}
                className={
                  preset === p.preset && !pending.value
                    ? 'px-2 py-1 text-xs rounded bg-primary text-primary-foreground'
                    : 'px-2 py-1 text-xs rounded border border-border hover:bg-muted'
                }
              >
                {p.label}
              </button>
            </PopoverClose>
          ))}
        </div>
        <Calendar
          mode="range"
          selected={calendarSelected}
          onSelect={handleCalendarSelect}
          numberOfMonths={2}
          defaultMonth={fromDate}
          resetOnSelect={!pending.value}
        />
        {isPendingPartial && (
          <p className="mt-2 text-xs text-muted-foreground" aria-live="polite">
            Select end date
          </p>
        )}
        {isPendingComplete && pending.value?.from && pending.value?.to && (
          <div className="mt-3 pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2" aria-live="polite">
              {format(pending.value.from, 'MMM d, yyyy')} – {format(pending.value.to, 'MMM d, yyyy')}
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => { pending.value = null }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <PopoverClose asChild>
                <button
                  aria-label="Apply custom date range"
                  onClick={applyPending}
                  className="px-3 py-1 text-xs rounded bg-primary text-primary-foreground hover:opacity-90"
                >
                  Apply
                </button>
              </PopoverClose>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
