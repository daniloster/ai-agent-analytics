export interface FilterParams {
  from: string
  to: string
  team_id?: string
}

export interface Team {
  id: string
  name: string
  seat_count: number
  member_count: number
}

export type TeamsListResponse = Team[]

export interface OrgConfig {
  org_id: string
  seat_count: number
  monthly_budget: number
  seat_price_monthly: number
  token_rate_per_million: number
  billing_model: 'hybrid_token_seat'
}

export interface OverviewResponse {
  period: { from: string; to: string }
  total_runs: number
  total_runs_prior: number
  mau: number
  mau_prior: number
  dau: number
  seat_count: number
  total_tokens: number
  total_tokens_prior: number
  input_tokens: number
  output_tokens: number
  total_cost: number
  total_cost_prior: number
  retention_cost: number
  retention_cost_prior: number
  retained_users_7d: number
  success_rate: number
  success_rate_prior: number
  avg_run_duration_ms: number
  avg_quality_score: number | null
  avg_quality_score_prior: number | null
  rated_run_count: number
  cost_per_quality_point: number | null
  cost_per_quality_point_prior: number | null
  acceptance_rate: number | null
  cost_per_accepted_output: number | null
  mom_usage_growth: number
  user_activation_rate: number
  new_users_count: number
  quality_cost_efficiency: number | null
  churn_risk_count: number
  new_user_activation_cost: number | null
  quality_score_trend: Array<{ date: string; score: number }>
}

export interface TeamMetrics {
  team_id: string
  team_name: string
  runs: number
  cost: number
  mau: number
  seat_count: number
  adoption_rate: number
  avg_runs_per_user: number
  avg_quality_score: number | null
  rated_run_count: number
  failed_run_rate: number
  cost_per_quality_point: number | null
  top_use_cases: Array<{ category: string; percentage: number }>
  churn_signal_count: number
  wow_cost_change: number
  wow_runs_change: number
  mau_prior: number
  cost_trend: Array<{ date: string; cost: number }>
}

export interface TeamsResponse {
  period: { from: string; to: string }
  org_avg_failed_run_rate: number
  teams: TeamMetrics[]
}

export interface ReliabilityResponse {
  period: { from: string; to: string }
  error_rate: number
  error_rate_prior: number
  timeout_rate: number
  p50_duration_ms: number
  p95_duration_ms: number
  p99_duration_ms: number
  queue_wait_ms: number
  error_type_breakdown: Array<{
    type: 'context_overflow' | 'tool_failure' | 'rate_limit' | 'infrastructure'
    count: number
    percentage: number
  }>
  retry_rate: number
  platform_availability: number
  availability_by_day: Array<{ date: string; uptime_pct: number }>
  error_trend_7d: Array<{ date: string; error_rate: number }>
  mttr_minutes: number | null
  incidents: Array<{
    detected_at: string
    resolved_at: string | null
    mttr_minutes: number | null
    error_type: string
  }>
  cost_of_failed_runs: number
}

export interface BillingResponse {
  period: { from: string; to: string }
  current_month_spend: number
  days_elapsed: number
  days_in_month: number
  projected_month_end: number
  monthly_budget: number
  budget_utilization: number
  projected_annual_spend: number
  cost_per_successful_run: number
  token_rate_actual: number
  token_rate_list: number
  cost_by_team: Array<{
    team_id: string
    team_name: string
    token_cost: number
    seat_cost_prorated: number
    total: number
    percentage: number
  }>
  invoice_history: Array<{ month: string; total_billed: number }>
  cost_anomaly_days: Array<{
    date: string
    daily_cost: number
    avg_daily_cost: number
    is_anomaly: boolean
  }>
  cost_of_failed_runs: number
}

export interface TimeseriesPoint {
  date: string
  runs: number
  tokens: number
  input_tokens: number
  output_tokens: number
  cost: number
  dau: number
  avg_quality_score: number | null
  rated_run_count: number
  error_rate: number
}

export interface TimeseriesResponse {
  period: { from: string; to: string }
  granularity: 'day'
  points: TimeseriesPoint[]
}
