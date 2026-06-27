export const TEAM_COLORS: Record<string, string> = {
  team_platform: '#3b82f6',
  team_backend: '#10b981',
  team_frontend: '#8b5cf6',
  team_data: '#f59e0b',
}

const FALLBACK_COLORS = ['#6366f1', '#14b8a6', '#ec4899', '#84cc16']

export function teamColor(teamId: string, index = 0): string {
  return TEAM_COLORS[teamId] ?? FALLBACK_COLORS[index % FALLBACK_COLORS.length] ?? '#6366f1'
}
