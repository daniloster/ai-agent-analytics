import { signal, computed } from '@preact/signals-react'
import type { Signal, ReadonlySignal } from '@preact/signals-react'

export type DatePreset = '7d' | '30d' | '90d' | 'custom'

export interface DateRange {
  from: string   // YYYY-MM-DD
  to: string     // YYYY-MM-DD
  preset: DatePreset
}

export interface FilterQueryParams {
  from: string
  to: string
  team_id: string | undefined
}

export type SectionId = 'overview' | 'teams' | 'reliability' | 'billing'

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function defaultDateRange(): DateRange {
  const to = new Date()
  const from = new Date(to)
  from.setDate(from.getDate() - 29)
  return { from: toISODate(from), to: toISODate(to), preset: '30d' }
}

export const dateRange: Signal<DateRange> = signal(defaultDateRange())
export const teamId: Signal<string | undefined> = signal(undefined)

// Prev-reference check: return the same object when structurally equal,
// preventing TanStack Query from treating it as a new key.
let _prev: FilterQueryParams | undefined

export const filterQueryParams: ReadonlySignal<FilterQueryParams> = computed((): FilterQueryParams => {
  const next: FilterQueryParams = {
    from: dateRange.value.from,
    to: dateRange.value.to,
    team_id: teamId.value,
  }
  if (
    _prev !== undefined &&
    _prev.from === next.from &&
    _prev.to === next.to &&
    _prev.team_id === next.team_id
  ) {
    return _prev
  }
  _prev = next
  return next
})

export function initFiltersFromUrl(): void {
  const params = new URLSearchParams(window.location.search)
  const from = params.get('from') ?? ''
  const to = params.get('to') ?? ''
  const preset = params.get('preset') ?? ''
  const team = params.get('team') ?? ''

  if (ISO_DATE_RE.test(from) && ISO_DATE_RE.test(to)) {
    const resolvedPreset: DatePreset =
      preset === '7d' || preset === '30d' || preset === '90d' || preset === 'custom'
        ? preset
        : 'custom'
    dateRange.value = { from, to, preset: resolvedPreset }
  }

  if (team) {
    teamId.value = team
  }
}

export function syncFiltersToUrl(): void {
  const { from, to, preset } = dateRange.value
  const team = teamId.value
  const params = new URLSearchParams({ from, to, preset })
  if (team !== undefined) {
    params.set('team', team)
  }
  history.replaceState({}, '', '?' + params.toString())
}
