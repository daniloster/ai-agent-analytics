import { format } from 'date-fns'
import { dateRange } from '../../lib/filters/filterSignals'
import type { DatePreset } from '../../lib/filters/filterSignals'
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover'
import { Calendar } from '../ui/calendar'
import { Button } from '../ui/button'

const PRESETS: Array<{ label: string; preset: DatePreset; daysBack: number }> = [
  { label: '7 days', preset: '7d', daysBack: 6 },
  { label: '30 days', preset: '30d', daysBack: 29 },
  { label: '90 days', preset: '90d', daysBack: 89 },
  { label: 'Custom', preset: 'custom', daysBack: 0 },
]

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function applyPreset(preset: DatePreset, daysBack: number): void {
  if (preset === 'custom') {
    dateRange.value = { ...dateRange.value, preset: 'custom' }
    return
  }
  const to = new Date()
  const from = new Date(to)
  from.setDate(from.getDate() - daysBack)
  dateRange.value = { from: toISODate(from), to: toISODate(to), preset }
}

export function DateRangePicker(): JSX.Element {
  const { from, to, preset } = dateRange.value
  const triggerLabel =
    format(new Date(from + 'T00:00:00'), 'MMM d') +
    ' - ' +
    format(new Date(to + 'T00:00:00'), 'MMM d')

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-9 px-3 text-sm">
          {triggerLabel}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3">
        <div className="flex gap-1 mb-3">
          {PRESETS.map((p) => (
            <button
              key={p.preset}
              onClick={() => applyPreset(p.preset, p.daysBack)}
              className={
                preset === p.preset
                  ? 'px-2 py-1 text-xs rounded bg-primary text-primary-foreground'
                  : 'px-2 py-1 text-xs rounded border border-border hover:bg-muted'
              }
            >
              {p.label}
            </button>
          ))}
        </div>
        {preset === 'custom' && (
          <div className="flex gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">From</p>
              <Calendar
                mode="single"
                selected={new Date(from + 'T00:00:00')}
                onSelect={(date) => {
                  if (date) {
                    dateRange.value = { ...dateRange.value, from: toISODate(date) }
                  }
                }}
              />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">To</p>
              <Calendar
                mode="single"
                selected={new Date(to + 'T00:00:00')}
                onSelect={(date) => {
                  if (date) {
                    dateRange.value = { ...dateRange.value, to: toISODate(date) }
                  }
                }}
              />
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
