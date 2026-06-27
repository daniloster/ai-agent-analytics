import { useQuery } from '@tanstack/react-query'
import { teamId } from '../../lib/filters/filterSignals'
import type { Team } from '../../types/api'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select'
import { Skeleton } from '../ui/skeleton'

export function TeamSelector(): JSX.Element {
  const { data, isLoading } = useQuery<Team[]>({
    queryKey: ['org/teams'],
    queryFn: () => fetch('/api/org/teams').then((r) => r.json()) as Promise<Team[]>,
  })

  if (isLoading) {
    return <Skeleton className="h-9 w-36" />
  }

  const currentLabel = data?.find((t) => t.id === teamId.value)?.name ?? 'All teams'

  return (
    <Select
      value={teamId.value ?? '__all__'}
      onValueChange={(v) => { teamId.value = v === '__all__' ? undefined : v }}
    >
      <SelectTrigger aria-label={"Filter by team, currently " + currentLabel} className="h-9 w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="__all__">All teams</SelectItem>
        {data?.map((team) => (
          <SelectItem key={team.id} value={team.id}>
            {team.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
