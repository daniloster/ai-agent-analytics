# TASKS: WP-02 - TypeScript API Types & Mock Data Layer

**Date:** 2026-06-26
**SPEC:** `docs/20260626-wp02-api-types-spec.md`
**Status:** Ready to implement

---

## T-1: TypeScript API types

**Context**

Implements the "Data model" section of `docs/20260626-wp02-api-types-spec.md`. This is the foundation for every other task in WP-02 - generators, handlers, and all future query hooks import their return types from here. No logic lives in this file; it is a pure type declaration module.

The `src/types/` directory exists but is empty (`.gitkeep` only). This task populates it.

**Requirements**

1. Create `src/types/api.ts` exporting all 9 interfaces and 2 type aliases defined in the SPEC: `FilterParams`, `Team`, `TeamsListResponse`, `OrgConfig`, `OverviewResponse`, `TeamMetrics`, `TeamsResponse`, `ReliabilityResponse`, `BillingResponse`, `TimeseriesPoint`, `TimeseriesResponse`.
2. Every field listed in the SPEC data model section must be present with the exact name, type, and nullability shown (e.g. `avg_quality_score: number | null`).
3. The file must compile with `npx tsc --noEmit` with zero errors.
4. All exports must be named exports - no default export.
5. Create `src/types/api.test.ts` with compile-time assertions that verify the shape of key interfaces.
6. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- Type-only file: no imports, no runtime code - TypeScript interfaces are erased at compile time.
- `TeamsListResponse = Team[]` is a type alias, not an interface - this matches the SPEC exactly and avoids accidental structural differences.
- `billing_model: 'hybrid_token_seat'` uses a string literal type to constrain the value.
- The compile-time test approach for the test file: use `const _: ExpectedType = {} as ActualType` assignments - if the shape diverges, TypeScript emits a compile error caught by Vitest's type-checking pass.

**Design**

```ts
// src/types/api.ts  (new file)

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

// ... OverviewResponse, TeamMetrics, TeamsResponse,
//     ReliabilityResponse, BillingResponse,
//     TimeseriesPoint, TimeseriesResponse
// (full shapes in SPEC section 2)
```

```ts
// src/types/api.test.ts  (new file)

import type {
  FilterParams, Team, OrgConfig, OverviewResponse,
  TeamsResponse, ReliabilityResponse, BillingResponse,
  TimeseriesResponse
} from './api'

// Compile-time shape checks - each assignment fails if a required field is missing
// or has the wrong type.
it('FilterParams shape is correct', () => {
  const p: FilterParams = { from: '2026-06-01', to: '2026-06-30' }
  expect(p.from).toBe('2026-06-01')
})

it('OverviewResponse nullable fields are typed as number | null', () => {
  // TypeScript will error here if avg_quality_score is typed as number (not null)
  const score: OverviewResponse['avg_quality_score'] = null
  expect(score).toBeNull()
})

// ... repeat for each nullable field and array field across all interfaces
```

**Acceptance criteria**

1. `npx tsc --noEmit` exits 0 after the file is created.
2. `npm run test` passes on `src/types/api.test.ts`.
3. `import type { OverviewResponse } from '../types/api'` resolves without error from any file in `src/`.
4. A TypeScript file that omits a required field (e.g. `const x: OverviewResponse = {}`) produces a compile error - confirming the types are non-trivially enforced.

**Test Plan**

- `src/types/api.test.ts` (new)
  - Scenario: `FilterParams` accepts `{ from, to }` without `team_id` (optional field).
  - Scenario: `FilterParams` accepts `{ from, to, team_id }` (with optional field).
  - Scenario: `OverviewResponse['avg_quality_score']` accepts `null` (verifies `number | null`).
  - Scenario: `BillingResponse['cost_by_team']` is an array type (verifies array fields).
  - Scenario: `OrgConfig['billing_model']` is assignable from `'hybrid_token_seat'` and not from an arbitrary string.

**Files**

- `src/types/api.ts` (new) - all 9 interfaces and 2 type aliases from the SPEC
- `src/types/api.test.ts` (new) - compile-time shape assertions

---

## T-2: Seed utilities

**Context**

Implements `src/lib/mock/seed.ts` from the "Public API surface" section of the SPEC. This file provides `hashString` (djb2 hash) and `createSeededFaker`. Every generator task (T-4 through T-8) imports `createSeededFaker` to produce deterministic, filter-param-stable data. T-2 has no dependency on T-1 - it operates on primitive strings only.

The installed package is `@faker-js/faker` v8 (`^8.4.1` in `package.json`), not v9+ as the SPEC assumption states. The v8 API uses `faker.seed(n)` and `new Faker({ locale: en })` - the same call sites as v9. Use the v8 import path: `import { Faker, en } from '@faker-js/faker'`.

**Requirements**

1. Create `src/lib/mock/seed.ts` exporting `hashString(input: string): number` and `createSeededFaker(from: string, to: string, teamId: string | undefined): Faker`.
2. `hashString` must implement the djb2 algorithm: initialize `hash = 5381`, for each character `hash = ((hash << 5) + hash) + charCode`, return `hash >>> 0` (unsigned 32-bit).
3. `hashString` must return the same number for the same input string across calls.
4. `createSeededFaker` must compute `seed = hashString(from + to + (teamId ?? ''))`, call `faker.seed(seed)`, and return the `Faker` instance.
5. Create `src/lib/mock/seed.test.ts` covering all scenarios in the Test Plan section below.
6. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- djb2 is specified by the SPEC (see Interaction diagram - Seed derivation section). Do not substitute MurmurHash or any other algorithm.
- `hash >>> 0` converts the signed 32-bit result of bitwise operations to an unsigned 32-bit integer, ensuring the seed is always non-negative - Faker requires a non-negative seed.
- Import `Faker` and `en` from `'@faker-js/faker'` (v8 named exports). The v8 API: `const faker = new Faker({ locale: [en] }); faker.seed(n)`.
- The function returns the Faker instance (not just the seed) so callers do not need to know the seed derivation.

**Design**

```ts
// src/lib/mock/seed.ts  (new file)

import { Faker, en } from '@faker-js/faker'

export function hashString(input: string): number {
  // djb2 algorithm
  let hash = 5381
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) + input.charCodeAt(i)
  }
  return hash >>> 0
}

export function createSeededFaker(
  from: string,
  to: string,
  teamId: string | undefined
): Faker {
  // seed derived from filter params - same params = same data on every refetch
  const seed = hashString(from + to + (teamId ?? ''))
  const faker = new Faker({ locale: [en] })
  faker.seed(seed)
  return faker
}
```

**Acceptance criteria**

1. `hashString('abc') === hashString('abc')` - same input, same output.
2. `hashString('abc') !== hashString('abd')` - single character difference changes output.
3. `hashString('')` returns a non-negative number (not NaN, not negative).
4. `hashString` return value is always in range `[0, 2^32 - 1]`.
5. `createSeededFaker('2026-06-01', '2026-06-30', undefined)` returns a Faker instance with a defined `number.int()` method.
6. Two calls to `createSeededFaker` with identical params produce Faker instances that generate the same first value from `faker.number.int()`.

**Test Plan**

- `src/lib/mock/seed.test.ts` (new)
  - Scenario: `hashString('abc')` called twice returns the same number.
  - Scenario: `hashString('abc')` and `hashString('abd')` return different numbers.
  - Scenario: `hashString('')` returns a non-negative integer.
  - Scenario: `hashString` return value satisfies `n >= 0 && n <= 4294967295`.
  - Scenario: Two `createSeededFaker` calls with identical `(from, to, teamId)` produce Faker instances that output the same `faker.number.int()` first result.
  - Scenario: `createSeededFaker` with `teamId = undefined` vs `teamId = 'team_001'` produce different seeds (different first `faker.number.int()` result).

**Files**

- `src/lib/mock/seed.ts` (new) - `hashString` and `createSeededFaker`
- `src/lib/mock/seed.test.ts` (new) - determinism and correctness tests

---

## T-3: Org generators

**Context**

Implements `src/lib/mock/generators/org.ts` from the "New files" table in the SPEC. This generator is intentionally deterministic (not seeded by date range) - `generateTeamsList` always returns the same 4 teams and `generateOrgConfig` always returns the same org config. It must be ready before T-9 (handlers) but can be built independently of T-4 through T-8. Depends on T-1 for the `TeamsListResponse`, `Team`, and `OrgConfig` return types.

**Requirements**

1. Create `src/lib/mock/generators/org.ts` exporting `generateTeamsList(): TeamsListResponse` and `generateOrgConfig(): OrgConfig`.
2. `generateTeamsList` must return exactly 4 team objects representing Platform, Frontend, Backend, and Data teams. Team `id` values must be stable strings (e.g. `'team_platform'`, `'team_frontend'`, `'team_backend'`, `'team_data'`).
3. Each `Team` object must include `id`, `name`, `seat_count`, and `member_count` fields matching the `Team` interface from `src/types/api.ts`.
4. `generateOrgConfig` must return an `OrgConfig` with `billing_model: 'hybrid_token_seat'` and plausible numeric values for `monthly_budget`, `seat_price_monthly`, and `token_rate_per_million`.
5. `org_id` in the returned `OrgConfig` must be a non-empty string.
6. Create `src/lib/mock/generators/org.test.ts` covering all scenarios in the Test Plan section below.
7. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- No Faker dependency - all values are hardcoded. This guarantees the narrative (4 named teams) is stable regardless of any seeding.
- `seat_count` in `OrgConfig` must equal the sum of all team `seat_count` values in `TeamsListResponse` (org-level seat count is the sum of team seats).
- Team IDs are used as `team_id` query param values in subsequent filter requests (T-9 handlers). Use simple, stable strings - not UUIDs.

**Design**

```ts
// src/lib/mock/generators/org.ts  (new file)

import type { TeamsListResponse, OrgConfig } from '../../types/api'

const TEAMS = [
  { id: 'team_platform', name: 'Platform', seat_count: 18, member_count: 14 },
  { id: 'team_frontend', name: 'Frontend', seat_count: 22, member_count: 20 },
  { id: 'team_backend',  name: 'Backend',  seat_count: 20, member_count: 16 },
  { id: 'team_data',     name: 'Data',     seat_count: 15, member_count: 8  },
] as const

export function generateTeamsList(): TeamsListResponse {
  // returns a fresh array copy - callers may not mutate the module constant
}

export function generateOrgConfig(): OrgConfig {
  // seat_count = sum of all team seat_count values
}
```

```ts
// src/lib/mock/generators/org.test.ts  (new file)

import { generateTeamsList, generateOrgConfig } from './org'

describe('generateTeamsList', () => {
  it('returns exactly 4 teams', ...)
  it('each team has id, name, seat_count, member_count', ...)
  it('all team ids are unique', ...)
  it('returns a fresh array on each call (not mutating module state)', ...)
})

describe('generateOrgConfig', () => {
  it('billing_model is hybrid_token_seat', ...)
  it('seat_count equals sum of team seat counts', ...)
  it('org_id is a non-empty string', ...)
})
```

**Acceptance criteria**

1. `generateTeamsList()` returns an array of exactly 4 items.
2. Every team object passes the `Team` interface shape check: all of `id`, `name`, `seat_count`, `member_count` are present and correctly typed.
3. All 4 team `id` values are unique strings.
4. `generateOrgConfig().billing_model === 'hybrid_token_seat'`.
5. `generateOrgConfig().seat_count` equals the sum of `seat_count` from all 4 teams in `generateTeamsList()`.
6. Two calls to `generateTeamsList()` return arrays that are equal in content but are not the same object reference (defensive copy).

**Test Plan**

- `src/lib/mock/generators/org.test.ts` (new)
  - Scenario: `generateTeamsList()` returns 4 items with correct shape.
  - Scenario: All team `id` values are unique.
  - Scenario: Two calls return different array references (not the same object).
  - Scenario: `generateOrgConfig().billing_model` equals `'hybrid_token_seat'`.
  - Scenario: `generateOrgConfig().seat_count` equals sum of all team `seat_count` values.
  - Scenario: `generateOrgConfig().org_id` is a non-empty string.

**Files**

- `src/lib/mock/generators/org.ts` (new) - hardcoded team list and org config generators
- `src/lib/mock/generators/org.test.ts` (new) - shape and determinism tests

---

## T-4: Overview generator

**Context**

Implements `src/lib/mock/generators/overview.ts` from the SPEC. This generator produces the `OverviewResponse` shape covering KPI-01 through KPI-14 plus KPI-46, KPI-47, KPI-48, and KPI-49. It is the most field-dense generator. Depends on T-1 for types and T-2 for `Faker`. Read `src/types/api.ts` and `src/lib/mock/seed.ts` before starting.

The generator must handle the `rated_run_count < 10` edge case: when `rated_run_count` is below 10, `avg_quality_score`, `cost_per_quality_point`, and `quality_cost_efficiency` must all be `null`.

**Requirements**

1. Create `src/lib/mock/generators/overview.ts` exporting `generateOverview(faker: Faker, params: FilterParams): OverviewResponse`.
2. All fields listed in `OverviewResponse` in `src/types/api.ts` must be present in the returned object with correct types.
3. When `rated_run_count < 10`, `avg_quality_score`, `cost_per_quality_point`, `quality_cost_efficiency`, and `cost_per_quality_point` must all be `null`.
4. `quality_score_trend` must be a non-empty array of `{ date: string; score: number }` objects with dates in ascending order.
5. `success_rate` and `success_rate_prior` must be in the range `[0, 100]`.
6. `acceptance_rate` is `null` when the Faker-generated accept event count is zero.
7. `mom_usage_growth` is a number that can be negative (do not clamp to `[0, ...]`).
8. Create `src/lib/mock/generators/overview.test.ts` covering all scenarios in the Test Plan section below.
9. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- Do not re-seed inside the generator - the Faker instance passed in is already seeded by the caller (`handlers.ts` via `createSeededFaker`). Calling `faker.seed()` again would break determinism.
- Generate `quality_score_trend` by iterating the date range from `params.from` to `params.to` (one entry per day or per 3 days to keep the array compact). Use `new Date(params.from)` and increment by `86400 * 1000` ms per step.
- `retention_cost = total_cost / mau` - derive it, do not generate it independently (ensures internal consistency).
- All rates (percentages) must be clamped to `[0, 100]` after Faker generation to prevent out-of-range values.

**Design**

```ts
// src/lib/mock/generators/overview.ts  (new file)

import type { Faker } from '@faker-js/faker'
import type { FilterParams, OverviewResponse } from '../../types/api'

export function generateOverview(faker: Faker, params: FilterParams): OverviewResponse {
  // Generate base counts
  const totalRuns = faker.number.int({ min: 1000, max: 50000 })
  const mau = faker.number.int({ min: 10, max: 500 })
  // ...generate all other fields
  
  // Quality null guard - must be checked before assembling the return value
  const ratedRunCount = faker.number.int({ min: 0, max: totalRuns })
  const qualityFields = ratedRunCount >= 10
    ? { avg_quality_score: faker.number.float({ min: 1, max: 5, fractionDigits: 2 }), ... }
    : { avg_quality_score: null, cost_per_quality_point: null, quality_cost_efficiency: null }

  return {
    period: { from: params.from, to: params.to },
    total_runs: totalRuns,
    // ...all other fields
    ...qualityFields,
    quality_score_trend: buildTrend(faker, params.from, params.to),
  }
}

function buildTrend(
  faker: Faker,
  from: string,
  to: string
): Array<{ date: string; score: number }> {
  // one entry per day in range, score in [1, 5]
}
```

**Acceptance criteria**

1. `generateOverview(faker, { from: '2026-06-01', to: '2026-06-30' })` returns an object where all required `OverviewResponse` fields are present and not `undefined`.
2. When `rated_run_count < 10` in the generated output, `avg_quality_score === null`, `cost_per_quality_point === null`, and `quality_cost_efficiency === null`.
3. `quality_score_trend` is a non-empty array where every element has a `date` string and a `score` number.
4. `success_rate` is a number in `[0, 100]`.
5. Two calls with the same `faker` instance (re-seeded identically before each call) return identical JSON strings.
6. The function completes in under 50ms (performance guard against O(n^2) date iteration).

**Test Plan**

- `src/lib/mock/generators/overview.test.ts` (new)
  - Scenario: All required fields present with correct types for a standard 30-day range.
  - Scenario: `avg_quality_score` is `null` when test forces `rated_run_count < 10` (construct a seeded faker that produces this outcome, or test the null-guard branch directly).
  - Scenario: `mom_usage_growth` is a finite number (can be negative).
  - Scenario: `quality_score_trend` array has at least one entry.
  - Scenario: `success_rate` is in `[0, 100]`.
  - Scenario: Function executes in under 50ms for a 365-day range (performance guard).

**Files**

- `src/lib/mock/generators/overview.ts` (new) - `generateOverview` function
- `src/lib/mock/generators/overview.test.ts` (new) - shape, null-guard, and performance tests

---

## T-5: Teams generator

**Context**

Implements `src/lib/mock/generators/teams.ts` from the SPEC. Produces a `TeamsResponse` with exactly 4 team entries following the correlated profile table in SPEC section 3. The Data Team must always have a lower `adoption_rate` than the Frontend Team; these profiles are hardcoded offsets, not purely random. Depends on T-1 and T-2. Read `src/types/api.ts` before starting.

**Requirements**

1. Create `src/lib/mock/generators/teams.ts` exporting `generateTeams(faker: Faker, params: FilterParams): TeamsResponse`.
2. The returned `teams` array must contain exactly 4 entries, one per team (Platform, Frontend, Backend, Data), with `team_id` values matching those hardcoded in `src/lib/mock/generators/org.ts` (`'team_platform'`, `'team_frontend'`, `'team_backend'`, `'team_data'`).
3. Each `TeamMetrics` object must include all fields from the `TeamMetrics` interface in `src/types/api.ts`.
4. The Data Team's `adoption_rate` must always be lower than the Frontend Team's `adoption_rate` regardless of the Faker seed.
5. Each team's `top_use_cases` percentages must sum to approximately 100% (within 1% tolerance due to floating point).
6. `failed_run_rate` for every team must be in `[0, 100]`.
7. `org_avg_failed_run_rate` must be the weighted average of team `failed_run_rate` values (weighted by `runs`).
8. Create `src/lib/mock/generators/teams.test.ts` covering all scenarios in the Test Plan section below.
9. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- Use fixed baseline profiles per team, then add Faker noise. Example: Platform `adoption_rate = clamp(faker.number.int({ min: 70, max: 95 }), 0, 100)`, Data `adoption_rate = clamp(faker.number.int({ min: 40, max: 65 }), 0, 100)`. The non-overlapping ranges guarantee the narrative invariant without post-hoc clamping.
- `cost_trend` is an array of `{ date: string; cost: number }` with one entry per day in the requested range. Same approach as `quality_score_trend` in T-4.
- `churn_signal_count` for the Data Team must be hardcoded to be at least 2x the Frontend Team's value. Use multiplier after Faker generation.

**Design**

```ts
// src/lib/mock/generators/teams.ts  (new file)

import type { Faker } from '@faker-js/faker'
import type { FilterParams, TeamsResponse, TeamMetrics } from '../../types/api'

type TeamProfile = {
  team_id: string
  team_name: string
  adoptionRange: { min: number; max: number }
  qualityRange: { min: number; max: number }
  // ...other per-team constraints
}

const TEAM_PROFILES: TeamProfile[] = [
  { team_id: 'team_platform', team_name: 'Platform', adoptionRange: { min: 70, max: 95 }, ... },
  { team_id: 'team_frontend', team_name: 'Frontend', adoptionRange: { min: 75, max: 95 }, ... },
  { team_id: 'team_backend',  team_name: 'Backend',  adoptionRange: { min: 55, max: 75 }, ... },
  { team_id: 'team_data',     team_name: 'Data',     adoptionRange: { min: 40, max: 62 }, ... },
]

export function generateTeams(faker: Faker, params: FilterParams): TeamsResponse {
  // generate each team using its profile, then compute org_avg_failed_run_rate
}

function generateTeamMetrics(faker: Faker, profile: TeamProfile, params: FilterParams): TeamMetrics {
  // use profile ranges to produce correlated metrics
}
```

**Acceptance criteria**

1. `generateTeams(faker, params).teams.length === 4`.
2. All 4 `team_id` values are unique strings.
3. Data Team `adoption_rate < Frontend Team adoption_rate` for any Faker seed.
4. Each team's `top_use_cases` percentages sum to within 1 of 100 (i.e. `Math.abs(sum - 100) < 1`).
5. `failed_run_rate` for every team is in `[0, 100]`.
6. `org_avg_failed_run_rate` is a number (not NaN).

**Test Plan**

- `src/lib/mock/generators/teams.test.ts` (new)
  - Scenario: `teams` array has exactly 4 entries.
  - Scenario: Each `team_id` is unique.
  - Scenario: Data Team `adoption_rate` is lower than Frontend Team `adoption_rate`.
  - Scenario: `top_use_cases` percentages sum to approximately 100% per team.
  - Scenario: `failed_run_rate` is in `[0, 100]` for all teams.
  - Scenario: `churn_signal_count` for Data Team is at least 2x Frontend Team.

**Files**

- `src/lib/mock/generators/teams.ts` (new) - `generateTeams` with correlated team profiles
- `src/lib/mock/generators/teams.test.ts` (new) - profile invariant and shape tests

---

## T-6: Reliability generator

**Context**

Implements `src/lib/mock/generators/reliability.ts` from the SPEC. Produces a `ReliabilityResponse` covering KPI-26 through KPI-35. The key constraint is that `availability_by_day` must contain exactly one entry per calendar day in the requested date range. Depends on T-1 and T-2.

**Requirements**

1. Create `src/lib/mock/generators/reliability.ts` exporting `generateReliability(faker: Faker, params: FilterParams): ReliabilityResponse`.
2. `availability_by_day` must have exactly one entry per calendar day between `params.from` and `params.to` inclusive. Entry count = `dayCount(from, to)`.
3. Each `availability_by_day` entry's `uptime_pct` must be in `[0, 100]`.
4. `error_type_breakdown` must cover all 4 types: `'context_overflow'`, `'tool_failure'`, `'rate_limit'`, `'infrastructure'`. Their `percentage` values must sum to 100 (integer arithmetic, not floating point - assign remainder to the last bucket).
5. `error_trend_7d` must be an array of `{ date: string; error_rate: number }` with at least 7 entries.
6. `mttr_minutes` must be `null` when `incidents` array is empty.
7. All rate fields (`error_rate`, `timeout_rate`, `retry_rate`, `platform_availability`) must be in `[0, 100]`.
8. Create `src/lib/mock/generators/reliability.test.ts` covering all scenarios in the Test Plan section below.
9. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- Calendar day count: `Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000) + 1`. Do not use a third-party date library - plain Date arithmetic is sufficient.
- Integer percentage summation for `error_type_breakdown`: generate 3 random breakdowns summing to at most 97, then assign the remainder to the 4th bucket. This avoids floating point drift.
- `mttr_minutes` when incidents exist: average of `incident.mttr_minutes` values, `null` for incidents where `resolved_at` is null.

**Design**

```ts
// src/lib/mock/generators/reliability.ts  (new file)

import type { Faker } from '@faker-js/faker'
import type { FilterParams, ReliabilityResponse } from '../../types/api'

export function generateReliability(faker: Faker, params: FilterParams): ReliabilityResponse {
  // availability_by_day: one entry per calendar day
  // error_type_breakdown: 4 buckets summing to 100
  // incidents: 0-3 entries with resolved_at possibly null
}

function buildDailyArray<T>(
  from: string,
  to: string,
  buildEntry: (date: string) => T
): T[] {
  // iterate calendar days from `from` to `to` inclusive
}
```

**Acceptance criteria**

1. `generateReliability(faker, { from: '2026-06-01', to: '2026-06-30' }).availability_by_day.length === 30`.
2. `generateReliability(faker, { from: '2026-01-01', to: '2026-01-01' }).availability_by_day.length === 1`.
3. Every `uptime_pct` in `availability_by_day` is in `[0, 100]`.
4. `error_type_breakdown` contains all 4 required type strings.
5. Sum of `error_type_breakdown[*].percentage` equals exactly 100.
6. `mttr_minutes === null` when `incidents` is an empty array.
7. Function executes in under 50ms for a 365-day range.

**Test Plan**

- `src/lib/mock/generators/reliability.test.ts` (new)
  - Scenario: `availability_by_day` length equals calendar days in range (30 for June).
  - Scenario: Single-day range produces `availability_by_day` with 1 entry.
  - Scenario: Each `uptime_pct` is in `[0, 100]`.
  - Scenario: `error_type_breakdown` percentages sum to exactly 100.
  - Scenario: `mttr_minutes` is `null` when `incidents` array is empty.
  - Scenario: Performance: 365-day range completes under 50ms.

**Files**

- `src/lib/mock/generators/reliability.ts` (new) - `generateReliability` with day-accurate arrays
- `src/lib/mock/generators/reliability.test.ts` (new) - length invariant and edge case tests

---

## T-7: Billing generator

**Context**

Implements `src/lib/mock/generators/billing.ts` from the SPEC. Produces a `BillingResponse` covering KPI-36 through KPI-45. Two invariants are non-negotiable: `invoice_history` always has exactly 6 entries, and `cost_by_team` percentages sum to 100. Depends on T-1 and T-2.

**Requirements**

1. Create `src/lib/mock/generators/billing.ts` exporting `generateBilling(faker: Faker, params: FilterParams): BillingResponse`.
2. `invoice_history` must always contain exactly 6 entries with `month` strings in `'YYYY-MM'` format, ordered from oldest to newest.
3. `cost_by_team` must contain exactly 4 entries (one per team) using the same `team_id` values as `src/lib/mock/generators/org.ts`. Their `percentage` values must sum to 100 (use integer bucketing, same approach as T-6).
4. `projected_month_end` must be greater than or equal to `current_month_spend`.
5. `budget_utilization` must be in `[0, 100]`.
6. `cost_anomaly_days` must be an array of objects with a boolean `is_anomaly` field (never `undefined`).
7. Each `cost_anomaly_days` entry's `date` must fall within `params.from` to `params.to`.
8. Create `src/lib/mock/generators/billing.test.ts` covering all scenarios in the Test Plan section below.
9. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- `invoice_history` months are computed by stepping 6 months backward from the month containing `params.from`. Use integer arithmetic on `new Date(params.from)` - subtract 1 month at a time using `setMonth(getMonth() - i)`.
- `days_elapsed` and `days_in_month` derive from `params.from` (current month start) and `params.to`. If the range spans multiple months, use the month of `params.from`.
- `projected_month_end = current_month_spend / days_elapsed * days_in_month` when `days_elapsed > 0`.

**Design**

```ts
// src/lib/mock/generators/billing.ts  (new file)

import type { Faker } from '@faker-js/faker'
import type { FilterParams, BillingResponse } from '../../types/api'

export function generateBilling(faker: Faker, params: FilterParams): BillingResponse {
  // invoice_history: 6 months stepping back from params.from
  // cost_by_team: 4 entries with percentage sum = 100
  // cost_anomaly_days: subset of days in range with is_anomaly boolean
}

function buildInvoiceHistory(faker: Faker, from: string): Array<{ month: string; total_billed: number }> {
  // last 6 calendar months ending at the month of `from`
}
```

**Acceptance criteria**

1. `generateBilling(faker, params).invoice_history.length === 6`.
2. `invoice_history` months are in ascending chronological order.
3. `cost_by_team` has 4 entries and percentages sum to 100.
4. `projected_month_end >= current_month_spend`.
5. `budget_utilization` is in `[0, 100]`.
6. Every `cost_anomaly_days` entry has a boolean `is_anomaly` field.

**Test Plan**

- `src/lib/mock/generators/billing.test.ts` (new)
  - Scenario: `invoice_history` has exactly 6 entries.
  - Scenario: `invoice_history` months are in ascending order (oldest first).
  - Scenario: `cost_by_team` percentages sum to 100.
  - Scenario: `projected_month_end >= current_month_spend`.
  - Scenario: `budget_utilization` is in `[0, 100]`.
  - Scenario: All `cost_anomaly_days` entries have a boolean `is_anomaly` field (not `undefined`).

**Files**

- `src/lib/mock/generators/billing.ts` (new) - `generateBilling` with 6-month invoice history
- `src/lib/mock/generators/billing.test.ts` (new) - count invariant and range tests

---

## T-8: Timeseries generator

**Context**

Implements `src/lib/mock/generators/timeseries.ts` from the SPEC. Produces a `TimeseriesResponse` with one `TimeseriesPoint` per calendar day in the requested range. The critical internal invariant: `input_tokens + output_tokens === tokens` per point. Depends on T-1 and T-2.

**Requirements**

1. Create `src/lib/mock/generators/timeseries.ts` exporting `generateTimeseries(faker: Faker, params: FilterParams): TimeseriesResponse`.
2. `points` must contain exactly one entry per calendar day between `params.from` and `params.to` inclusive.
3. Each `TimeseriesPoint` must include all fields from the `TimeseriesPoint` interface in `src/types/api.ts`.
4. For every point: `point.input_tokens + point.output_tokens === point.tokens` (no rounding drift - generate `input_tokens` and `output_tokens` first, then set `tokens = input_tokens + output_tokens`).
5. `avg_quality_score` per point is `null` for approximately 20% of days (simulate days with fewer than 10 rated runs).
6. `error_rate` per point must be in `[0, 100]`.
7. `granularity` must always be `'day'` in the returned object.
8. Create `src/lib/mock/generators/timeseries.test.ts` covering all scenarios in the Test Plan section below.
9. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- Day iteration: reuse the `buildDailyArray` pattern from T-6 if that function is extracted to a shared utility. If not extracted, implement the same inline iteration.
- `null` for `avg_quality_score`: use `faker.number.int({ min: 0, max: 4 }) === 0` (20% chance). This keeps the null distribution deterministic.
- Do not import from `reliability.ts` - both files may share the day-iteration pattern but must not create a circular dependency.

**Design**

```ts
// src/lib/mock/generators/timeseries.ts  (new file)

import type { Faker } from '@faker-js/faker'
import type { FilterParams, TimeseriesResponse, TimeseriesPoint } from '../../types/api'

export function generateTimeseries(faker: Faker, params: FilterParams): TimeseriesResponse {
  // one TimeseriesPoint per calendar day in range
}

function buildPoint(faker: Faker, date: string): TimeseriesPoint {
  const inputTokens = faker.number.int({ min: 10000, max: 500000 })
  const outputTokens = faker.number.int({ min: 5000, max: 200000 })
  return {
    date,
    runs: faker.number.int({ min: 10, max: 2000 }),
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    tokens: inputTokens + outputTokens,  // invariant: must equal sum
    // ...
  }
}
```

**Acceptance criteria**

1. `generateTimeseries(faker, { from: '2026-06-01', to: '2026-06-30' }).points.length === 30`.
2. `points[0].date === '2026-06-01'` and `points[29].date === '2026-06-30'`.
3. For every point: `point.input_tokens + point.output_tokens === point.tokens`.
4. No `TimeseriesPoint` field is `undefined`.
5. `granularity === 'day'` in the returned response.
6. Function executes in under 50ms for a 365-day range.

**Test Plan**

- `src/lib/mock/generators/timeseries.test.ts` (new)
  - Scenario: `points.length` equals calendar days in range.
  - Scenario: First and last point dates match `params.from` and `params.to`.
  - Scenario: `input_tokens + output_tokens === tokens` for every point.
  - Scenario: No `undefined` values in any `TimeseriesPoint` field.
  - Scenario: `granularity === 'day'`.
  - Scenario: Performance: 365-day range completes under 50ms.

**Files**

- `src/lib/mock/generators/timeseries.ts` (new) - `generateTimeseries` with per-day points
- `src/lib/mock/generators/timeseries.test.ts` (new) - length, token invariant, and performance tests

---

## T-9: MSW handlers, browser export, and main.tsx wiring

**Context**

Implements `src/lib/mock/handlers.ts`, `src/lib/mock/browser.ts`, and modifies `src/main.tsx`. This task wires all generators into MSW v2 HTTP handlers and registers the Service Worker so the dev server intercepts fetch calls. Must be done last - it depends on all generator tasks (T-3 through T-8) and the types (T-1).

Read `src/main.tsx` before modifying it. The commented-out MSW block at lines 6-10 is the intended location for the worker start code.

Before running the handlers in the browser, the MSW Service Worker file must be initialized: run `npx msw init public/ --save` from the project root to copy `mockServiceWorker.js` into `public/`. This is a one-time setup step required for MSW browser mode.

**Requirements**

1. Create `src/lib/mock/handlers.ts` exporting `handlers: RequestHandler[]` with one MSW v2 `http.get` handler per endpoint:
   - `GET /api/org/teams`
   - `GET /api/org/config`
   - `GET /api/analytics/overview`
   - `GET /api/analytics/teams`
   - `GET /api/analytics/reliability`
   - `GET /api/analytics/billing`
   - `GET /api/analytics/timeseries`
2. Each analytics handler must parse `from`, `to`, and `team_id` from `request.url.searchParams`, call `createSeededFaker(from, to, teamId)`, call the corresponding generator, and return `HttpResponse.json(data, { status: 200 })`.
3. Each analytics handler must return `HttpResponse.json({ error: 'Invalid date range' }, { status: 400 })` when `from` or `to` is missing or when `from > to` (lexicographic string comparison on ISO dates is valid).
4. The `/api/org/teams` and `/api/org/config` handlers must call `generateTeamsList()` and `generateOrgConfig()` respectively (no seeded Faker needed - these are deterministic).
5. Create `src/lib/mock/browser.ts` exporting `worker: SetupWorker` as `export const worker = setupWorker(...handlers)`.
6. Modify `src/main.tsx` to uncomment and activate the MSW worker start block: `if (import.meta.env.DEV) { const { worker } = await import('./lib/mock/browser'); await worker.start({ onUnhandledRequest: 'bypass' }) }`. The `createRoot(...).render(...)` call must happen only after the await resolves (convert the top-level block to an async IIFE or use top-level await if the vite config supports it).
7. Create `src/lib/mock/handlers.test.ts` covering all scenarios in the Test Plan section below.
8. Run `npx msw init public/ --save` to generate `public/mockServiceWorker.js`.
9. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- MSW v2 API: use `http.get('/api/...', async ({ request }) => { ... })` from `'msw'`. Return `HttpResponse.json(data)` from `'msw'`. Do not use the v1 `rest` API.
- Handler tests: use `setupServer(...handlers)` from `'msw/node'` in Vitest (not the browser `setupWorker`). Call `server.listen()` in `beforeAll`, `server.resetHandlers()` in `afterEach`, `server.close()` in `afterAll`. Then use the native `fetch` (available in Vitest's jsdom environment) to make requests and assert on the response.
- `src/main.tsx` uses top-level `await` which requires `"moduleResolution": "bundler"` or equivalent in `tsconfig.json`. Check `tsconfig.json` before modifying - if top-level await is not supported, wrap in `async function main() { ... }; main()`.
- Do not add a `msw` handler for non-existent endpoints - `onUnhandledRequest: 'bypass'` ensures they pass through.
- `public/mockServiceWorker.js` is generated by `npx msw init` - add it to `.gitignore` OR commit it to the repo. The SPEC does not specify; commit it so the project works without a setup step.

**Design**

```ts
// src/lib/mock/handlers.ts  (new file)

import { http, HttpResponse } from 'msw'
import { createSeededFaker } from './seed'
import { generateOverview } from './generators/overview'
import { generateTeams } from './generators/teams'
import { generateReliability } from './generators/reliability'
import { generateBilling } from './generators/billing'
import { generateTimeseries } from './generators/timeseries'
import { generateTeamsList, generateOrgConfig } from './generators/org'
import type { FilterParams } from '../../types/api'

function parseParams(url: URL): FilterParams | null {
  // extract from, to, team_id; return null if from/to missing or from > to
}

export const handlers = [
  http.get('/api/org/teams', () => HttpResponse.json(generateTeamsList())),

  http.get('/api/org/config', () => HttpResponse.json(generateOrgConfig())),

  http.get('/api/analytics/overview', ({ request }) => {
    const params = parseParams(new URL(request.url))
    if (!params) return HttpResponse.json({ error: 'Invalid date range' }, { status: 400 })
    const faker = createSeededFaker(params.from, params.to, params.team_id)
    return HttpResponse.json(generateOverview(faker, params))
  }),

  // ... other analytics handlers follow same pattern
]
```

```ts
// src/lib/mock/browser.ts  (new file)

import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)
```

```ts
// src/main.tsx  (modified)

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App'

async function main() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./lib/mock/browser')
    await worker.start({ onUnhandledRequest: 'bypass' })
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

main()
```

```ts
// src/lib/mock/handlers.test.ts  (new file)

import { setupServer } from 'msw/node'
import { handlers } from './handlers'

const server = setupServer(...handlers)

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('GET /api/org/teams', () => {
  it('returns 200 with an array of 4 teams', async () => { ... })
})

describe('GET /api/analytics/overview', () => {
  it('returns 200 with all required fields', async () => { ... })
  it('returns 400 when from > to', async () => { ... })
  it('returns 400 when from param is missing', async () => { ... })
})

// ... repeat for each of the 7 endpoints
```

**Acceptance criteria**

1. `GET /api/org/teams` (via `fetch` in the test environment) returns HTTP 200 with a JSON array of 4 objects each having `id`, `name`, `seat_count`, `member_count`.
2. `GET /api/analytics/overview?from=2026-06-01&to=2026-06-30` returns HTTP 200 with `Content-Type: application/json` and all top-level fields from `OverviewResponse` present.
3. `GET /api/analytics/overview?from=2026-06-30&to=2026-06-01` (from > to) returns HTTP 400.
4. `GET /api/analytics/overview?to=2026-06-30` (missing `from`) returns HTTP 400.
5. `GET /api/analytics/reliability?from=2026-06-01&to=2026-06-30` returns `availability_by_day` with 30 entries.
6. `GET /api/analytics/billing?from=2026-06-01&to=2026-06-30` returns `invoice_history` with 6 entries.
7. Two calls to the same analytics endpoint URL return identical JSON strings (determinism check).
8. `npm run dev` starts without errors and the browser Network tab shows MSW intercepting `/api/analytics/overview`.

**Test Plan**

- `src/lib/mock/handlers.test.ts` (new)
  - Scenario: `GET /api/org/teams` returns 200 with 4-item array.
  - Scenario: `GET /api/org/config` returns 200 with `billing_model: 'hybrid_token_seat'`.
  - Scenario: `GET /api/analytics/overview?from=2026-06-01&to=2026-06-30` returns 200 with all required top-level fields.
  - Scenario: `GET /api/analytics/overview` with `from > to` returns 400.
  - Scenario: `GET /api/analytics/overview` with missing `from` param returns 400.
  - Scenario: `GET /api/analytics/teams?from=2026-06-01&to=2026-06-30` returns 200 with `teams` array of length 4.
  - Scenario: `GET /api/analytics/reliability?from=2026-06-01&to=2026-06-30` returns 200 with `availability_by_day` length 30.
  - Scenario: `GET /api/analytics/billing?from=2026-06-01&to=2026-06-30` returns 200 with `invoice_history` length 6.
  - Scenario: `GET /api/analytics/timeseries?from=2026-06-01&to=2026-06-30` returns 200 with `points` length 30.
  - Scenario: Same URL called twice returns identical JSON bodies.

**Files**

- `src/lib/mock/handlers.ts` (new) - 7 MSW v2 `http.get` handlers
- `src/lib/mock/browser.ts` (new) - `setupWorker` export
- `src/lib/mock/handlers.test.ts` (new) - `setupServer`-based handler tests
- `src/main.tsx` (modified) - conditional MSW worker start before React mount
- `public/mockServiceWorker.js` (generated) - MSW Service Worker (via `npx msw init public/ --save`)

---

## Implementation order table

| Done | Priority | Task | Depends on | Effort |
|------|----------|------|------------|--------|
| [x]  | 1        | T-1: TypeScript API types | - | Small |
| [ ]  | 2        | T-2: Seed utilities | - | Small |
| [ ]  | 3        | T-3: Org generators | T-1 | Small |
| [ ]  | 4        | T-4: Overview generator | T-1, T-2 | Medium |
| [ ]  | 5        | T-5: Teams generator | T-1, T-2 | Medium |
| [ ]  | 6        | T-6: Reliability generator | T-1, T-2 | Medium |
| [ ]  | 7        | T-7: Billing generator | T-1, T-2 | Medium |
| [ ]  | 8        | T-8: Timeseries generator | T-1, T-2 | Small |
| [ ]  | 9        | T-9: MSW handlers, browser, main.tsx | T-1, T-2, T-3, T-4, T-5, T-6, T-7, T-8 | Medium |
