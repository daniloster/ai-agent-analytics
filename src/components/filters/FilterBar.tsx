import { DateRangePicker } from './DateRangePicker'
import { TeamSelector } from './TeamSelector'

export function FilterBar(): JSX.Element {
  return (
    <div className="flex items-center gap-3">
      <DateRangePicker />
      <TeamSelector />
    </div>
  )
}
