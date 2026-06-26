export function buildQueryParams(params: { from: string; to: string; team_id?: string }): string {
  const sp = new URLSearchParams({ from: params.from, to: params.to })
  if (params.team_id) sp.set('team_id', params.team_id)
  return sp.toString()
}
