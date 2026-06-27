import { DateRangePicker } from './DateRangePicker'
import { TeamSelector } from './TeamSelector'

export function FilterBar(): JSX.Element {
  return (
    <div role="search" aria-label="Filter dashboard data" className="flex flex-wrap items-center gap-2 sm:gap-3">
      <DateRangePicker />
      <TeamSelector />
    </div>
  )
}
