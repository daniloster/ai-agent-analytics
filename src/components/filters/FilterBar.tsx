import { DateRangePicker } from './DateRangePicker'
import { TeamSelector } from './TeamSelector'

export function FilterBar(): JSX.Element {
  return (
    <div role="search" aria-label="Filter dashboard data" className="flex items-center gap-3">
      <DateRangePicker />
      <TeamSelector />
    </div>
  )
}
