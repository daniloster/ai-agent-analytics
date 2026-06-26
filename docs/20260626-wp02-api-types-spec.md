# SPEC: WP-02 - TypeScript API Types & Mock Data Layer

**Date:** 2026-06-26
**Status:** Ready
**Source:** `docs/20260626-analytics-dashboard-plan.md` - WP-02

---

## Assumptions (confirmed or defaulted)

- WP-01 is complete: `src/` directory skeleton exists, TypeScript strict mode is active, Vitest is configured.
- MSW v2 API (`http` handler factory, not `rest`).
- Faker.js v9+ (`@faker-js/faker`); seed is a 32-bit integer derived from `hashString(from + to + (team_id ?? ''))`.
- Same filter params on every 30s TanStack Query refetch produce bitwise-identical JSON responses (no chart flicker).
- All dates are UTC strings in ISO 8601 format (`YYYY-MM-DD`).
- Billing period is calendar month (not rolling 30 days) - see investigation Open Question 4.
- Team membership is single primary team per user - see investigation Open Question 3.
- Quality rating feature is assumed active in the product; `avg_quality_score` is `null` when `rated_run_count < 10`.
- MSW worker is started in development only (`import.meta.env.DEV`), using `onUnhandledRequest: 'bypass'` so non-mocked requests pass through.
- Correlated data: Data Team in generated data always has lower adoption and quality than Frontend Team (makes demo insights legible).
- TanStack Query client setup is deferred to WP-04; WP-02 only provides the MSW layer and types.

---

## 1. Context

Implements **WP-02** from `docs/20260626-analytics-dashboard-plan.md`, which corresponds to **Appendix C** of `docs/20260626-cloud-agent-analytics-dashboard-investigation.md` (Mock API Endpoint Catalog) and **Appendix A** (KPI Catalog - used to derive all field names).

### Files touched

| File | Status | Why |
|------|--------|-----|
| `src/types/api.ts` | New | All TypeScript response interfaces |
| `src/lib/mock/seed.ts` | New | Deterministic Faker seed derivation |
| `src/lib/mock/generators/overview.ts` | New | KPI-01 through KPI-14 generator |
| `src/lib/mock/generators/teams.ts` | New | KPI-15 through KPI-25 generator |
| `src/lib/mock/generators/reliability.ts` | New | KPI-26 through KPI-35 generator |
| `src/lib/mock/generators/billing.ts` | New | KPI-36 through KPI-45 generator |
| `src/lib/mock/generators/timeseries.ts` | New | Daily time-series arrays for charts |
| `src/lib/mock/generators/org.ts` | New | Team list and org config |
| `src/lib/mock/handlers.ts` | New | MSW request handlers for all 7 endpoints |
| `src/lib/mock/browser.ts` | New | MSW `setupWorker` export |
| `src/main.tsx` | Modified | Conditionally starts MSW worker before React mount |

No component files are touched in this WP.

---

## 2. Data model

### src/types/api.ts - complete interface catalog

```ts
// Shared filter query params (used to construct fetch URLs)
export interface FilterParams {
  from: string        // ISO date, e.g. '2026-06-01'
  to: string          // ISO date, e.g. '2026-06-30'
  team_id?: string    // omit for org-wide
}

// --- /api/org/teams ---
export interface Team {
  id: string
  name: string
  seat_count: number
  member_count: number
}

export type TeamsListResponse = Team[]

// --- /api/org/config ---
export interface OrgConfig {
  org_id: string
  seat_count: number
  monthly_budget: number          // USD
  seat_price_monthly: number      // USD per seat
  token_rate_per_million: number  // USD per 1M output tokens
  billing_model: 'hybrid_token_seat'
}

// --- /api/analytics/overview - KPI-01 through KPI-14 + KPI-46, KPI-47, KPI-48, KPI-49 ---
export interface OverviewResponse {
  period: { from: string; to: string }
  // KPI-01: Total Agent Runs
  total_runs: number
  total_runs_prior: number
  // KPI-02: Active Users
  mau: number
  dau: number
  seat_count: number
  // KPI-03: Seat Adoption Rate (mau / seat_count * 100)
  // KPI-04: Total Token Consumption
  total_tokens: number
  total_tokens_prior: number
  input_tokens: number
  output_tokens: number
  // KPI-05: Total Cost
  total_cost: number
  total_cost_prior: number
  // KPI-06: Retention Cost (total_cost / mau)
  retention_cost: number
  // KPI-07: Agent Success Rate
  success_rate: number            // 0-100
  success_rate_prior: number
  // KPI-08: Average Run Duration
  avg_run_duration_ms: number
  // KPI-09: Average Quality Score
  avg_quality_score: number | null   // null when rated_run_count < 10
  rated_run_count: number
  // KPI-10: Cost per Quality Point
  cost_per_quality_point: number | null
  // KPI-11: Output Acceptance Rate
  acceptance_rate: number | null     // null when no accept/discard events
  // KPI-12: Cost per Accepted Output
  cost_per_accepted_output: number | null
  // KPI-13: MoM Usage Growth
  mom_usage_growth: number           // percentage, can be negative
  // KPI-14: User Activation Rate
  user_activation_rate: number       // 0-100
  new_users_count: number
  // KPI-46: Quality-Cost Efficiency Score
  quality_cost_efficiency: number | null
  // KPI-47: User Churn Risk Count
  churn_risk_count: number
  // KPI-48: New User Cost to Activate
  new_user_activation_cost: number | null
  // KPI-49: Quality Score Trend (30-day moving average points)
  quality_score_trend: Array<{ date: string; score: number }>
}

// --- /api/analytics/teams - KPI-15 through KPI-25 ---
export interface TeamMetrics {
  team_id: string
  team_name: string
  // KPI-15: Runs per Team
  runs: number
  // KPI-16: Cost per Team
  cost: number
  // KPI-17: Cost per User per Team (cost / mau)
  mau: number
  seat_count: number
  // KPI-18: Team Adoption Rate (mau / seat_count * 100)
  adoption_rate: number    // 0-100
  // KPI-19: Avg Runs per User per Team
  avg_runs_per_user: number
  // KPI-20: Quality Score per Team
  avg_quality_score: number | null
  rated_run_count: number
  // KPI-21: Failed Run Rate per Team
  failed_run_rate: number  // 0-100
  // KPI-22: Cost per Quality Point per Team
  cost_per_quality_point: number | null
  // KPI-23: Top Use Cases per Team
  top_use_cases: Array<{ category: string; percentage: number }>
  // KPI-24: Churn Signals per Team
  churn_signal_count: number
  // KPI-25: Team-Level Cost Trend (WoW)
  wow_cost_change: number   // percentage, can be negative
  cost_trend: Array<{ date: string; cost: number }>
}

export interface TeamsResponse {
  period: { from: string; to: string }
  org_avg_failed_run_rate: number
  teams: TeamMetrics[]
}

// --- /api/analytics/reliability - KPI-26 through KPI-35 ---
export interface ReliabilityResponse {
  period: { from: string; to: string }
  // KPI-26: Overall Error Rate
  error_rate: number         // 0-100
  error_rate_prior: number
  // KPI-27: Timeout Rate
  timeout_rate: number       // 0-100
  // KPI-28: P50/P95/P99 Run Duration
  p50_duration_ms: number
  p95_duration_ms: number
  p99_duration_ms: number
  // KPI-29: Queue Wait Time
  queue_wait_ms: number
  // KPI-30: Error Type Breakdown
  error_type_breakdown: Array<{
    type: 'context_overflow' | 'tool_failure' | 'rate_limit' | 'infrastructure'
    count: number
    percentage: number
  }>
  // KPI-31: Retry Rate
  retry_rate: number         // 0-100
  // KPI-32: Platform Availability
  platform_availability: number  // 0-100
  availability_by_day: Array<{ date: string; uptime_pct: number }>
  // KPI-33: Error Trend (7-day moving average)
  error_trend_7d: Array<{ date: string; error_rate: number }>
  // KPI-34: MTTR
  mttr_minutes: number | null
  incidents: Array<{
    detected_at: string
    resolved_at: string | null
    mttr_minutes: number | null
    error_type: string
  }>
  // KPI-35: Cost of Failed Runs
  cost_of_failed_runs: number
}

// --- /api/analytics/billing - KPI-36 through KPI-45 ---
export interface BillingResponse {
  period: { from: string; to: string }
  // KPI-36: Current Month Spend
  current_month_spend: number
  days_elapsed: number
  days_in_month: number
  // KPI-37: Projected Month-End Spend
  projected_month_end: number
  monthly_budget: number
  // KPI-38: Budget Utilization
  budget_utilization: number     // 0-100
  // KPI-43: Projected Annual Spend
  projected_annual_spend: number
  // KPI-39: Cost per Successful Run
  cost_per_successful_run: number
  // KPI-40: Token Rate Efficiency
  token_rate_actual: number      // USD per 1M tokens
  token_rate_list: number        // USD per 1M tokens (list price)
  // KPI-41: Cost Allocation by Team
  cost_by_team: Array<{
    team_id: string
    team_name: string
    token_cost: number
    seat_cost_prorated: number
    total: number
    percentage: number
  }>
  // KPI-42: Invoice History (last 6 months)
  invoice_history: Array<{ month: string; total_billed: number }>  // month: 'YYYY-MM'
  // KPI-44: Cost Anomaly Days
  cost_anomaly_days: Array<{
    date: string
    daily_cost: number
    avg_daily_cost: number
    is_anomaly: boolean
  }>
  // KPI-45: Cost of Failed Runs (cross-reference from reliability)
  cost_of_failed_runs: number
}

// --- /api/analytics/timeseries ---
export interface TimeseriesPoint {
  date: string           // 'YYYY-MM-DD'
  runs: number
  tokens: number
  input_tokens: number
  output_tokens: number
  cost: number
  avg_quality_score: number | null
  error_rate: number     // 0-100
}

export interface TimeseriesResponse {
  period: { from: string; to: string }
  granularity: 'day'
  points: TimeseriesPoint[]
}
```

---

## 3. Component / module design

### New files

| Path | Responsibility |
|------|---------------|
| `src/types/api.ts` | All exported TypeScript interfaces listed above; single source of truth for API shapes |
| `src/lib/mock/seed.ts` | `hashString` and `createSeededFaker`; ensures same filter params = same data on every refetch |
| `src/lib/mock/generators/overview.ts` | Generates `OverviewResponse` from a seeded Faker instance; all KPI-01 through KPI-14 + cross-cutting KPIs |
| `src/lib/mock/generators/teams.ts` | Generates `TeamsResponse`; hardcoded team profiles (Platform/Frontend/Backend/Data) with correlated quality/cost/adoption patterns |
| `src/lib/mock/generators/reliability.ts` | Generates `ReliabilityResponse`; `availability_by_day` array length matches days in the requested range |
| `src/lib/mock/generators/billing.ts` | Generates `BillingResponse`; invoice history always has exactly 6 entries; anomaly days seeded consistently |
| `src/lib/mock/generators/timeseries.ts` | Generates `TimeseriesResponse`; one `TimeseriesPoint` per calendar day in the range |
| `src/lib/mock/generators/org.ts` | Generates `TeamsListResponse` and `OrgConfig`; org config is deterministic (not seeded by date range) |
| `src/lib/mock/handlers.ts` | MSW v2 `http` handlers for all 7 endpoints; parses query params, calls generator, returns `HttpResponse.json(data)` |
| `src/lib/mock/browser.ts` | `setupWorker(...handlers)` export; imported by `src/main.tsx` |

### Modified files

| Path | Change |
|------|--------|
| `src/main.tsx` | Add `if (import.meta.env.DEV) { await import('./lib/mock/browser').then(m => m.worker.start({ onUnhandledRequest: 'bypass' })) }` before `ReactDOM.createRoot(...).render(...)` |

### Public API surface

```ts
// src/lib/mock/seed.ts
export function hashString(input: string): number
  // djb2 hash: produces a 32-bit integer from a string
  // deterministic, no external dependencies

export function createSeededFaker(
  from: string,
  to: string,
  teamId: string | undefined
): Faker
  // seed = hashString(from + to + (teamId ?? ''))
  // returns a Faker instance with that seed applied

// src/lib/mock/handlers.ts
export const handlers: import('msw').RequestHandler[]

// src/lib/mock/browser.ts
export const worker: import('msw/browser').SetupWorker

// src/lib/mock/generators/overview.ts
export function generateOverview(
  faker: Faker,
  params: FilterParams
): OverviewResponse

// src/lib/mock/generators/teams.ts
export function generateTeams(
  faker: Faker,
  params: FilterParams
): TeamsResponse

// src/lib/mock/generators/reliability.ts
export function generateReliability(
  faker: Faker,
  params: FilterParams
): ReliabilityResponse

// src/lib/mock/generators/billing.ts
export function generateBilling(
  faker: Faker,
  params: FilterParams
): BillingResponse

// src/lib/mock/generators/timeseries.ts
export function generateTimeseries(
  faker: Faker,
  params: FilterParams
): TimeseriesResponse

// src/lib/mock/generators/org.ts
export function generateTeamsList(): TeamsListResponse
export function generateOrgConfig(): OrgConfig
```

### Correlated team data pattern

The `generateTeams` generator uses fixed team profiles to make the demo legible:

| Team | Profile | Expected pattern |
|------|---------|-----------------|
| Platform | Heavy users, high cost, high quality | runs/user high, quality 4.2+, churn_signal_count low |
| Frontend | Broad adoption, high quality | adoption_rate 87%+, quality 4.4+, failed_run_rate low |
| Backend | Mid adoption, mid quality | balanced across all metrics |
| Data | Low adoption, lower quality | adoption_rate ~53%, quality 3.6, churn_signal_count highest |

These profiles are deterministic regardless of the date-range seed, so the narrative ("Data Team is underperforming") is stable across filter changes.

---

## 4. Interaction diagram

### MSW startup and request interception

```
User navigates to http://localhost:5173
  --> src/main.tsx executes
  --> import.meta.env.DEV === true
  --> await worker.start({ onUnhandledRequest: 'bypass' })
  --> MSW registers Service Worker at /mockServiceWorker.js
  --> MSW intercepts all fetch() calls in the browser

Component (e.g. Overview) calls:
  useQuery({
    queryKey: ['overview', { from, to, team_id }],
    queryFn: () => fetch('/api/analytics/overview?from=...&to=...&team_id=...')
  })
  --> fetch() intercepted by MSW Service Worker
  --> handlers.ts: http.get('/api/analytics/overview', handler)
  --> handler reads request.url.searchParams: from, to, team_id
  --> calls createSeededFaker(from, to, teamId)
      --> hashString('2026-06-01' + '2026-06-30' + 'team_001') = 1234567890
      --> faker.seed(1234567890)
  --> calls generateOverview(faker, { from, to, team_id })
  --> returns HttpResponse.json(data, { status: 200 })
  --> TanStack Query receives data, caches it with key ['overview', params]

30 seconds later, TanStack Query refetchInterval fires:
  --> same fetch('/api/analytics/overview?from=...&to=...&team_id=...')
  --> same seed computed from identical params
  --> generateOverview returns bitwise-identical JSON
  --> TanStack Query compares data (no change) --> no re-render
  --> Charts do not flicker
```

### Seed derivation

```
hashString(str: string) -> number:
  let hash = 5381
  for each char in str:
    hash = ((hash << 5) + hash) + charCode  // djb2 algorithm
  return hash >>> 0  // unsigned 32-bit integer

createSeededFaker('2026-06-01', '2026-06-30', 'team_001'):
  seed = hashString('2026-06-01' + '2026-06-30' + 'team_001')
  const faker = new Faker({ locale: en })
  faker.seed(seed)
  return faker

Different team_id  --> different seed --> different generated values
No team_id        --> seed = hashString(from + to + '') --> org-wide data
```

---

## 5. Acceptance criteria

1. `src/types/api.ts` compiles with `npx tsc --noEmit` with zero errors; all 9 interfaces are exported by name.
2. Starting the dev server (`npm run dev`) and calling `GET /api/analytics/overview?from=2026-06-01&to=2026-06-30` in browser DevTools Network tab returns HTTP 200 with `Content-Type: application/json` and a body matching the `OverviewResponse` shape (all required fields present, no `undefined` values).
3. Calling the same endpoint URL twice (within the same browser session, before any filter change) returns byte-for-byte identical JSON bodies (seeded determinism).
4. Calling `GET /api/analytics/overview?from=2026-06-01&to=2026-06-30&team_id=team_001` returns a response where `total_runs` is less than the org-wide response (same date range, no `team_id`).
5. `GET /api/org/teams` returns a JSON array of exactly 4 teams, each with `id`, `name`, `seat_count`, and `member_count` fields.
6. `GET /api/analytics/reliability?from=2026-06-01&to=2026-06-30` returns `availability_by_day` with exactly 30 entries (one per calendar day in the range).
7. `GET /api/analytics/billing?from=2026-06-01&to=2026-06-30` returns `invoice_history` with exactly 6 entries.
8. `generateOverview` called with `rated_run_count < 10` returns `avg_quality_score: null`, `cost_per_quality_point: null`, and `quality_cost_efficiency: null` (unit test asserts this directly).
9. `hashString('abc') === hashString('abc')` and `hashString('abc') !== hashString('abd')` (unit test).
10. All generator functions complete in under 50ms per call on the test runner machine (performance guard against accidentally O(n^2) loops in date-range iteration).

---

## 6. Out of scope

- TanStack Query `QueryClientProvider` setup (WP-04).
- Any React components or UI rendering (WP-04 onward).
- Real backend API implementation.
- Pagination or infinite scrolling in any endpoint (v1 returns full requested range).
- Multi-team filter (team_id accepts a single team or is omitted for org-wide; no multi-select in v1).
- Timezone conversion (all dates UTC; see investigation Open Question 4).

---

## Test plan

| File | What it tests |
|------|---------------|
| `src/lib/mock/seed.test.ts` (new) | `hashString` returns same number for same input; different single-character difference produces different output; output is always a non-negative 32-bit integer; `createSeededFaker` returns a Faker instance |
| `src/lib/mock/generators/overview.test.ts` (new) | Happy path: all required fields present and correct types; `avg_quality_score` is null when `rated_run_count < 10`; `mom_usage_growth` is numeric (can be negative); `quality_score_trend` array has at least one entry |
| `src/lib/mock/generators/teams.test.ts` (new) | Returns exactly 4 teams; each `team_id` is unique; `failed_run_rate` in [0, 100]; Data Team has lower `adoption_rate` than Frontend Team (correlated profile check); `top_use_cases` percentages sum to ~100% per team |
| `src/lib/mock/generators/reliability.test.ts` (new) | `availability_by_day` length equals the number of calendar days in the requested range; each `uptime_pct` is in [0, 100]; `error_type_breakdown` percentages sum to ~100%; `mttr_minutes` is null when `incidents` array is empty |
| `src/lib/mock/generators/billing.test.ts` (new) | `invoice_history` has exactly 6 entries; all `cost_anomaly_days` entries have boolean `is_anomaly` field; `projected_month_end >= current_month_spend` when `days_elapsed < days_in_month`; `cost_by_team` percentages sum to ~100% |
| `src/lib/mock/generators/timeseries.test.ts` (new) | `points` length equals the number of calendar days in range; each point has all required fields; no `undefined` values; `input_tokens + output_tokens === tokens` per point |
| `src/lib/mock/handlers.test.ts` (new) | Each of the 7 handlers returns HTTP 200; `Content-Type` is `application/json`; required top-level fields present in each response; invalid date range (from > to) returns HTTP 400 |
