import type { TeamsListResponse, OrgConfig } from '../../../types/api'

const TEAMS = [
  { id: 'team_platform', name: 'Platform', seat_count: 18, member_count: 14 },
  { id: 'team_frontend', name: 'Frontend', seat_count: 22, member_count: 20 },
  { id: 'team_backend',  name: 'Backend',  seat_count: 20, member_count: 16 },
  { id: 'team_data',     name: 'Data',     seat_count: 15, member_count: 8  },
] as const

const TOTAL_SEATS = TEAMS.reduce((sum, t) => sum + t.seat_count, 0)

export function generateTeamsList(): TeamsListResponse {
  return TEAMS.map(t => ({ ...t }))
}

export function generateOrgConfig(): OrgConfig {
  return {
    org_id: 'org_acme',
    seat_count: TOTAL_SEATS,
    monthly_budget: 25000,
    seat_price_monthly: 40,
    token_rate_per_million: 3.0,
    billing_model: 'hybrid_token_seat',
  }
}
