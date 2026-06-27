# TASKS: WP-10 - Test Coverage & CI Baseline

**SPEC:** `docs/20260626-wp10-test-coverage-spec.md`
**Date:** 2026-06-26

---

## Pre-implementation audit summary

Read this section before starting any task. Several items the SPEC describes as "new" already exist.

**Already done - no work needed:**

- `package.json` `"test:coverage"` script: already `"vitest run --coverage"`. No change.
- `src/components/charts/primitives/scales.test.ts`: EXISTS - covers scaleLinear domain/range, scaleBand bandwidth > 0, scaleTime first-date mapping. Needs gap fills (T-3).
- `src/lib/kpi/formulas.test.ts`: EXISTS and comprehensive. Needs two new functions first (T-2).
- `src/lib/mock/handlers.test.ts`: EXISTS - covers all 7 endpoints. Missing team_id scoping test (T-3).
- `src/lib/filters/filterSignals.test.ts`: EXISTS - covers URL hydration, reference stability, syncFiltersToUrl. Integration test (T-4) covers the signal-to-fetch propagation chain that this file does not.
- `src/components/sections/Overview.test.tsx`: EXISTS - includes "filter change causes fetch" test (line 151). Integration test (T-4) adds team_id propagation and URL hydration to fetch scenarios.

**SPEC vs actual codebase discrepancies - read before touching formulas.ts:**

| SPEC claim                                                                      | Actual implementation                                       | Resolution                                           |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------- |
| `computeRetentionCost(1000, 0)` returns `null`                                  | Returns `0` (guarded)                                       | Do NOT change; tests pass; SPEC description is wrong |
| `computeProjectedMonthEnd(..., 0, ...)` returns `null`                          | Returns `0`                                                 | Do NOT change                                        |
| `computeErrorRateSeverity` uses `'green'`/`'amber'`/`'red'` thresholds 0.05/0.1 | Uses `'good'`/`'warning'`/`'critical'` thresholds 0.02/0.05 | Do NOT change; AC #10 uses existing values           |
| `computeBudgetUtilization`                                                      | Does NOT exist in formulas.ts                               | T-2 adds it                                          |
| `computeChurnSignal`                                                            | Does NOT exist in formulas.ts                               | T-2 adds it                                          |

---

## T-1: vitest.config.ts coverage configuration

**Context**

Implements SPEC §2 and §3 "Modified files - vitest.config.ts". The existing coverage block in `vitest.config.ts` has: `provider: 'v8'`, a global `thresholds: { lines: 80 }`, and an `include` list. The SPEC requires per-directory `functions: 80` thresholds, the `lcov` reporter for CI ingestion, and an `exclude` list instead of the bare `include` approach.

This task must be done first so CI (T-5) runs against correct thresholds.

Before starting, read `vitest.config.ts` in full to understand the existing structure before making targeted edits.

**Requirements**

1. Add `reporter: ['text', 'html', 'lcov']` to the `coverage` block.
2. Replace `thresholds: { lines: 80 }` with per-directory thresholds:
   ```ts
   thresholds: {
     'src/lib/**': { lines: 80, functions: 80 },
     'src/components/kpis/**': { lines: 80, functions: 80 },
   }
   ```
3. Replace `include: ['src/lib/**', 'src/components/kpis/**']` with `include: ['src/**/*.ts', 'src/**/*.tsx']` to collect coverage across all source files (the per-directory thresholds enforce the floor only on the two directories that matter).
4. Add `exclude: ['src/lib/mock/**', 'src/**/*.test.ts', 'src/**/*.test.tsx', 'src/**/*.d.ts', 'vitest.setup.ts']` to the coverage block.
5. Run `npm run test:coverage` and fix any threshold failures before marking this task complete.

**Technical decisions**

- `reporter: ['text', 'html', 'lcov']`: `text` prints the summary table; `html` creates a browsable report; `lcov` produces the `lcov.info` file that CI code-coverage services (Codecov, GitHub Actions coverage summary) consume.
- Per-directory thresholds: `@vitest/coverage-v8` glob-keyed thresholds (e.g. `'src/lib/**': { lines: 80, functions: 80 }`) are supported in Vitest >= 1.0 and enforce the floor only for files matching the glob. Files outside both globs are still collected but not threshold-checked.
- `include: ['src/**/*.ts', 'src/**/*.tsx']`: broadens collection beyond the two enforced directories. This allows future coverage reports on charts/sections without a config change; only the two threshold entries enforce minimums.
- `exclude`: prevents mock generators (they are high-volume seed data; lines-per-function is misleading), test files, and type declarations from inflating or deflating numbers.

**Design**

```ts
// vitest.config.ts  (modified - coverage block only)
coverage: {
  provider: 'v8',
  reporter: ['text', 'html', 'lcov'],
  thresholds: {
    'src/lib/**': { lines: 80, functions: 80 },
    'src/components/kpis/**': { lines: 80, functions: 80 },
  },
  include: ['src/**/*.ts', 'src/**/*.tsx'],
  exclude: [
    'src/lib/mock/**',
    'src/**/*.test.ts',
    'src/**/*.test.tsx',
    'src/**/*.d.ts',
    'vitest.setup.ts',
  ],
}
```

**Acceptance criteria**

1. `npm run test:coverage` exits 0 with all thresholds satisfied.
2. The coverage output includes a line starting with "% Lines" for both `src/lib/` and `src/components/kpis/`.
3. `vitest.config.ts` contains `reporter: ['text', 'html', 'lcov']`.
4. `vitest.config.ts` contains `'src/lib/**': { lines: 80, functions: 80 }` in the `thresholds` object.
5. `vitest.config.ts` contains the `exclude` array with `'src/lib/mock/**'`.

**Test Plan**

This task has no new test files - it configures the test runner. Acceptance is verified by running `npm run test:coverage` and inspecting the output. No additional test file is created or modified.

**Files**

- `vitest.config.ts` (modified) - adds reporter, per-directory thresholds, and exclude list

---

## T-2: Missing formula functions - computeBudgetUtilization and computeChurnSignal

**Context**

Implements SPEC §3 "formulas.test.ts" coverage for two pure functions referenced in the SPEC's test plan that do not yet exist in `src/lib/kpi/formulas.ts`. Without them, SPEC AC #9 and related tests cannot be written. Because this WP adds no features, these two functions serve purely as testable business logic expressions that the existing section components might use or will use in maintenance.

Before starting, read:

- `src/lib/kpi/formulas.ts` - add the two new functions at the end of the file in alphabetical order (after `computeTokenRateEfficiency`)
- `src/lib/kpi/formulas.test.ts` - follow the existing `describe(...) { it(...) }` pattern; add new `describe` blocks at the end

**Requirements**

1. Add `export function computeBudgetUtilization(currentSpend: number, budget: number): number | null` to `src/lib/kpi/formulas.ts`.
2. `computeBudgetUtilization` must return `null` when `budget === 0`.
3. `computeBudgetUtilization` must return `(currentSpend / budget) * 100` for non-zero `budget`.
4. Add `export function computeChurnSignal(recentRuns: number, historicalRuns: number): boolean` to `src/lib/kpi/formulas.ts`.
5. `computeChurnSignal` must return `true` when `historicalRuns >= 5 && recentRuns === 0`.
6. `computeChurnSignal` must return `false` when `historicalRuns < 5` (insufficient history).
7. `computeChurnSignal` must return `false` when `recentRuns > 0` (user still active).
8. Add a `describe('computeBudgetUtilization', ...)` block to `src/lib/kpi/formulas.test.ts` with test cases covering requirements 2-3.
9. Add a `describe('computeChurnSignal', ...)` block to `src/lib/kpi/formulas.test.ts` with test cases covering requirements 5-7.
10. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- `computeBudgetUtilization` returns `null` (not `0` or `Infinity`) when `budget === 0` because a zero budget is an unconfigured state - `0 / 0` would produce `NaN` and `x / 0` would produce `Infinity`, both of which would surface as display bugs downstream.
- `computeChurnSignal` requires `historicalRuns >= 5` to prevent false positives for new users. A user with 0 historical runs and 0 recent runs is new, not churning.
- Both functions follow the exact existing style in `formulas.ts`: single-expression guard + single-expression return. No logging, no side effects.

**Design**

```ts
// src/lib/kpi/formulas.ts  (modified - append after computeTokenRateEfficiency)

export function computeBudgetUtilization(
  currentSpend: number,
  budget: number,
): number | null;
// Guard: if (budget === 0) return null
// Returns: (currentSpend / budget) * 100

export function computeChurnSignal(
  recentRuns: number,
  historicalRuns: number,
): boolean;
// Returns: historicalRuns >= 5 && recentRuns === 0
```

```ts
// src/lib/kpi/formulas.test.ts  (modified - append new describe blocks)

describe("computeBudgetUtilization", () => {
  it("returns null when budget is 0"); // zero guard
  it("returns 65 when spend is 13000 budget 20000"); // standard case: 13000/20000*100=65
  it("returns 0 when currentSpend is 0 and budget > 0"); // zero spend edge
  it("returns > 100 when over budget"); // overspend case
});

describe("computeChurnSignal", () => {
  it("returns true when historicalRuns >= 5 and recentRuns === 0");
  it("returns false when historicalRuns < 5"); // insufficient history (e.g. new user)
  it("returns false when recentRuns > 0"); // still active
  it("returns false when historicalRuns === 4 and recentRuns === 0"); // boundary: exactly 4 < 5
  it("returns true when historicalRuns === 5 and recentRuns === 0"); // boundary: exactly 5 >= 5
});
```

**Acceptance criteria**

1. `computeBudgetUtilization(13000, 20000)` returns `65.0`.
2. `computeBudgetUtilization(1000, 0)` returns `null`.
3. `computeBudgetUtilization(0, 20000)` returns `0`.
4. `computeBudgetUtilization(25000, 20000)` returns `125.0` (over budget).
5. `computeChurnSignal(0, 10)` returns `true`.
6. `computeChurnSignal(0, 4)` returns `false` (boundary: 4 < 5).
7. `computeChurnSignal(0, 5)` returns `true` (boundary: exactly 5).
8. `computeChurnSignal(1, 10)` returns `false` (still active).

**Test Plan**

- `src/lib/kpi/formulas.test.ts` (modified)
  - Scenario: `computeBudgetUtilization(13000, 20000)` equals 65.
  - Scenario: `computeBudgetUtilization(1000, 0)` returns null.
  - Scenario: `computeBudgetUtilization(0, 20000)` returns 0.
  - Scenario: `computeBudgetUtilization(25000, 20000)` returns 125.
  - Scenario: `computeChurnSignal(0, 10)` returns true.
  - Scenario: `computeChurnSignal(0, 4)` returns false (below threshold).
  - Scenario: `computeChurnSignal(0, 5)` returns true (at threshold).
  - Scenario: `computeChurnSignal(1, 10)` returns false (still active).

**Files**

- `src/lib/kpi/formulas.ts` (modified) - adds `computeBudgetUtilization` and `computeChurnSignal`
- `src/lib/kpi/formulas.test.ts` (modified) - adds two describe blocks with boundary and edge case tests

---

## T-3: Scale test gap fill and handlers team_id scoping test

**Context**

Implements SPEC §3 gap fills for two existing test files. `scales.test.ts` (from WP-03) already covers `scaleLinear` domain/range, `scaleBand` bandwidth > 0, and `scaleTime` first-date mapping, but is missing: scaleLinear clamp behavior, exact scaleBand bandwidth arithmetic, and `scaleSequential` color interpolation. `handlers.test.ts` already covers all 7 endpoints but is missing the `team_id` query param scoping behavior.

These two test files are grouped here because both are small gap-fills that require no new source code and no new dependencies.

Before starting, read:

- `src/components/charts/primitives/scales.test.ts` - understand which cases already exist; do not duplicate them
- `src/components/charts/primitives/scales.ts` - `buildScale()` only supports `band`, `time`, and `linear`; does NOT support `scaleSequential`. For scaleLinear clamp and scaleSequential tests, import directly from `@visx/scale` and `d3-scale`/`d3-interpolate`
- `src/lib/mock/handlers.test.ts` - understand which handler tests already exist; add only the `team_id` case
- `src/lib/mock/generators/teams.ts` (first 40 lines already read) - verify that `team_id` in params causes the generator to return only that team's data (check the `generateTeams` function)

**Requirements - scales.test.ts**

1. Add a test inside the existing `describe('scaleLinear', ...)` block: `import { scaleLinear } from '@visx/scale'` at the top of the file; verify `scaleLinear({ domain: [0, 100], range: [0, 200] }).clamp(true)(150)` returns `200` (clamp keeps value at range max).
2. Add a test inside the existing `describe('scaleLinear', ...)` block: without clamp, `scaleLinear({ domain: [0, 100], range: [0, 200] })(150)` returns `300` (linear extrapolation).
3. Add a test inside the existing `describe('scaleBand', ...)` block: `import { scaleBand } from '@visx/scale'`; `scaleBand({ domain: ['a', 'b', 'c', 'd'], range: [0, 400], padding: 0 }).bandwidth()` returns `100` exactly.
4. Add a test inside the existing `describe('scaleBand', ...)` block: `scaleBand({ domain: ['a', 'b', 'c', 'd'], range: [0, 400], padding: 0.1 }).bandwidth()` returns a value strictly less than `100`.
5. Add a new `describe('scaleSequential', ...)` block with two tests:
   - Import `scaleSequential` from `d3-scale` and `interpolateRgb` from `d3-interpolate`.
   - `scaleSequential(interpolateRgb('#ff0000', '#00ff00')).domain([0, 1])(0)` returns a string that matches `'rgb(255, 0, 0)'` (or the equivalent parsed form; use `.startsWith('rgb')` if exact format is uncertain).
   - `scaleSequential(interpolateRgb('#ff0000', '#00ff00')).domain([0, 1])(0)` is a different string from `(...)(1)` (verify domain endpoints produce distinct colors).

**Requirements - handlers.test.ts**

6. Inside the existing `describe('GET /api/analytics/teams', ...)` block, add a test: fetch `/api/analytics/teams?from=2026-06-01&to=2026-06-30&team_id=team_platform`; assert `res.status === 200`; assert the response teams array has length `1`; assert the single team's `team_id` equals `'team_platform'`.
7. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- `@visx/scale` re-exports D3 scale factories. Importing from `@visx/scale` is consistent with the rest of the codebase; do NOT import from `d3-scale` for `scaleLinear` and `scaleBand` - use `@visx/scale`. Only `scaleSequential` must come from `d3-scale` because `@visx/scale` does not re-export it.
- `d3-interpolate` is already installed as a transitive dependency (used by `Heatmap.tsx`). No `npm install` needed.
- scaleLinear clamp: `buildScale()` does not expose the `.clamp()` method (no callers need it). These tests validate raw D3 behavior that chart consumers might use directly; they document invariants, not `buildScale` internals.
- scaleSequential color output format: `interpolateRgb` returns CSS-style `'rgb(R, G, B)'` strings in D3 v7. Using `.startsWith('rgb')` is more robust than matching exact numeric values since floating-point rounding may vary.
- team_id scoping: the `generateTeams` generator filters TEAM_PROFILES by `params.team_id` when set. The test confirms this filtering produces exactly 1 result.

**Design**

```ts
// src/components/charts/primitives/scales.test.ts  (modified)
import { scaleLinear, scaleBand } from "@visx/scale";
import { scaleSequential } from "d3-scale";
import { interpolateRgb } from "d3-interpolate";

// Inside describe('scaleLinear'):
// it('clamp(true) returns range max when input exceeds domain max')
// it('without clamp, extrapolates beyond range')

// Inside describe('scaleBand'):
// it('bandwidth() === 100 for 4-item domain, range [0,400], padding 0')
// it('bandwidth() < 100 for 4-item domain, range [0,400], padding 0.1')

// New describe('scaleSequential'):
// it('returns an rgb string for domain start')
// it('returns a different string for domain end vs domain start')
```

```ts
// src/lib/mock/handlers.test.ts  (modified)

// Inside describe('GET /api/analytics/teams'):
// it('returns 1 team when team_id=team_platform is provided')
```

**Acceptance criteria**

1. `scaleLinear({ domain: [0, 100], range: [0, 200] }).clamp(true)(150)` returns `200`.
2. `scaleLinear({ domain: [0, 100], range: [0, 200] })(150)` returns `300`.
3. `scaleBand({ domain: ['a','b','c','d'], range: [0, 400], padding: 0 }).bandwidth()` returns `100`.
4. `scaleBand({ domain: ['a','b','c','d'], range: [0, 400], padding: 0.1 }).bandwidth()` is less than `100`.
5. `scaleSequential(interpolateRgb(...)).domain([0,1])(0)` starts with `'rgb'`.
6. Domain start and domain end of scaleSequential produce different color strings.
7. `GET /api/analytics/teams?...&team_id=team_platform` returns a JSON object whose `teams` array has length `1` and whose first element has `team_id === 'team_platform'`.

**Test Plan**

- `src/components/charts/primitives/scales.test.ts` (modified)
  - Scenario: clamp behavior on scaleLinear (2 new cases).
  - Scenario: exact scaleBand bandwidth with padding 0 equals 100.
  - Scenario: scaleBand bandwidth with padding 0.1 is below 100.
  - Scenario: scaleSequential returns rgb strings; endpoints differ.

- `src/lib/mock/handlers.test.ts` (modified)
  - Scenario: team_id query param returns exactly 1 team with matching id.

**Files**

- `src/components/charts/primitives/scales.test.ts` (modified) - four new test cases across three describe blocks
- `src/lib/mock/handlers.test.ts` (modified) - one new test case in the teams describe block

---

## T-4: Filter-to-fetch integration test

**Context**

Implements SPEC §3 "`src/components/sections/integration.test.ts`" (new file) and SPEC AC #12, #13, #14. The file tests that filter signal changes propagate all the way to API fetch calls - a chain that spans `filterSignals.ts` → `filterQueryParams` computed signal → TanStack Query → `fetch()`. This chain is partially tested by `filterSignals.test.ts` (signals only) and `Overview.test.tsx` (renders and checks re-fetch), but neither verifies that `team_id` appears in the fetch URL or that `initFiltersFromUrl` params appear in the initial fetch URL.

Follow the EXACT pattern from `src/components/sections/Overview.test.tsx`: same mocks (`@visx/responsive`, `@visx/axis`, `@visx/grid`, `../layout/Section`), same `vi.stubGlobal('fetch', ...)` approach, same `makeWrapper()` function.

Before starting, read:

- `src/components/sections/Overview.test.tsx` in full - copy the mock block, `mockFetch`, and `makeWrapper` patterns verbatim
- `src/lib/filters/filterSignals.ts` - `initFiltersFromUrl()` reads `window.location.search`; use `vi.stubGlobal('location', { search: '...' })` to control it
- `src/lib/filters/filterSignals.test.ts` - understand which signal scenarios are ALREADY tested there; do not duplicate them

**Requirements**

1. Create `src/components/sections/integration.test.ts`.
2. Add the same `vi.mock` blocks for `@visx/responsive/lib/components/ParentSize`, `@visx/axis`, `@visx/grid`, and `../layout/Section` that appear in `Overview.test.tsx`.
3. Define the same `mockFetch` helper (accepting optional overrides, using `vi.stubGlobal('fetch', vi.fn(...))`) and `makeWrapper()` function from `Overview.test.tsx`.
4. Add a `beforeEach` that calls `vi.restoreAllMocks()` AND resets the filter signals to their defaults: `dateRange.value = { from: '2026-06-01', to: '2026-06-30', preset: '30d' }; teamId.value = undefined`.
5. Add test: **"URL hydration sets filter signals before first render"** - stub `location.search` to `'?from=2026-05-01&to=2026-05-31&team=team-2'`, call `initFiltersFromUrl()`, verify `dateRange.value.from === '2026-05-01'`, `dateRange.value.to === '2026-05-31'`, `teamId.value === 'team-2'` (no rendering required; pure signal assertion).
6. Add test: **"Filter signal change propagates team_id to fetch URL"** - call `mockFetch()`, render `<Overview>`, await initial fetch, set `teamId.value = 'team_platform'`, await a subsequent fetch, assert that at least one `fetch` call's URL argument includes `'team_id=team_platform'`.
7. Add test: **"Date range change triggers fetch with new from/to params"** - call `mockFetch()`, render `<Overview>`, await initial fetch, change `dateRange.value` to a different range, await subsequent fetch, assert at least one call URL includes the new `from` date.
8. Add test: **"Same filter params do not cause an additional fetch"** - call `mockFetch()`, render `<Overview>`, await initial fetch, record call count, set `filterQueryParams.value` (the computed signal) to the same value by setting `dateRange.value` to the same from/to (no mutation), assert call count has not increased.
9. The test file must use `// @vitest-environment jsdom` comment as the first line (to match section test environment).
10. All four tests must complete in under 5 seconds.
11. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- `vi.stubGlobal('fetch', ...)` instead of MSW: the existing section test pattern uses `vi.stubGlobal`, which is simpler and faster for jsdom. Using MSW in jsdom requires a service worker; `vi.stubGlobal` avoids that setup and matches the existing pattern. URL checking is done by inspecting `vi.mocked(fetch).mock.calls[n][0]`.
- `beforeEach` signal reset: the filter signals are module-level singletons. Tests that mutate `dateRange.value` or `teamId.value` pollute subsequent tests unless explicitly reset. The `beforeEach` must reset to known values after EACH test.
- Requirement 8 ("same params, no extra fetch"): TanStack Query deduplicates requests for the same query key. Setting `dateRange.value` to the same `{ from, to, preset }` keeps `filterQueryParams.value` at the same reference (per `filterSignals.ts` `_prev` memoization), so no new query key is produced and no re-fetch occurs.
- Importing `Overview`: use dynamic `await import('./Overview')` inside each test (same as `Overview.test.tsx` line 111) so each test gets a fresh module registration.

**Design**

```ts
// src/components/sections/integration.test.ts  (new file)
// @vitest-environment jsdom

import { it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  dateRange,
  teamId,
  initFiltersFromUrl,
} from "../../lib/filters/filterSignals";

// Same 4 vi.mock blocks as Overview.test.tsx

const OVERVIEW = {
  /* same fixture as Overview.test.tsx */
};
const TIMESERIES = {
  /* same fixture */
};
const ORG_CONFIG = {
  /* same fixture */
};

function mockFetch(
  overview = OVERVIEW,
  ts = TIMESERIES,
  config = ORG_CONFIG,
): void;
// vi.stubGlobal('fetch', vi.fn((url: string) => { ... }))

function makeWrapper(): React.ComponentType<{ children: React.ReactNode }>;
// new QueryClient({ defaultOptions: { queries: { retry: false } } })
// returns QueryClientProvider wrapper

beforeEach(() => {
  vi.restoreAllMocks();
  dateRange.value = { from: "2026-06-01", to: "2026-06-30", preset: "30d" };
  teamId.value = undefined;
});

it("URL hydration sets filter signals before first render", () => {
  // vi.stubGlobal('location', { search: '?from=2026-05-01&to=2026-05-31&team=team-2' })
  // initFiltersFromUrl()
  // expect(dateRange.value.from).toBe('2026-05-01')
  // expect(teamId.value).toBe('team-2')
});

it("team_id signal change includes team_id in fetch URL", async () => {
  // mockFetch(); render Overview; await initial fetch
  // teamId.value = 'team_platform'
  // await waitFor(() => expect some fetch call URL to include 'team_id=team_platform')
});

it("date range change triggers fetch with updated params", async () => {
  // mockFetch(); render Overview; await initial fetch
  // dateRange.value = { from: '2026-01-01', to: '2026-01-31', preset: 'custom' }
  // await waitFor(() => expect some fetch call URL to include 'from=2026-01-01')
});

it("setting same filter params does not trigger an additional fetch", async () => {
  // mockFetch(); render Overview; await initial fetch
  // const before = vi.mocked(fetch).mock.calls.length
  // set dateRange.value to identical from/to/preset as the current default
  // dateRange.value = { from: '2026-06-01', to: '2026-06-30', preset: '30d' }
  // await a short wait (so any hypothetical refetch would have happened)
  // expect(vi.mocked(fetch).mock.calls.length).toBe(before)
});
```

**Acceptance criteria**

1. After `initFiltersFromUrl()` with `'?from=2026-05-01&to=2026-05-31&team=team-2'`, `dateRange.value.from === '2026-05-01'` and `teamId.value === 'team-2'`.
2. After setting `teamId.value = 'team_platform'` in the rendered Overview, at least one `fetch` call URL includes `'team_id=team_platform'`.
3. After changing `dateRange.value.from` to `'2026-01-01'`, at least one `fetch` call URL includes `'from=2026-01-01'`.
4. Setting `dateRange.value` to the same object-equivalent values as the default does not increase the `fetch` call count.
5. All four test cases in the file pass without throwing.
6. The file completes in under 5 seconds (verified by Vitest output; no external network calls).

**Test Plan**

- `src/components/sections/integration.test.ts` (new)
  - Scenario: URL hydration hydrates both `dateRange` and `teamId` signals.
  - Scenario: `teamId` change propagates `team_id=` to fetch URL.
  - Scenario: `dateRange` change propagates new `from=` to fetch URL.
  - Scenario: identical params do not trigger an additional fetch.

**Files**

- `src/components/sections/integration.test.ts` (new) - four integration test cases verifying signal-to-fetch URL propagation

---

## T-5: GitHub Actions CI pipeline

**Context**

Implements SPEC §3 "`.github/workflows/ci.yml`" (new file). This is the CI configuration that runs on every push and every PR to main. It must be created after T-1 so the `npm run test:coverage` step enforces the correct per-directory thresholds.

No source code changes. No test changes. Only a YAML file.

**Requirements**

1. Create `.github/workflows/ci.yml`.
2. The `on` block must trigger on `push` to any branch (`branches: ['**']`) and on `pull_request` to `main`.
3. The job must be named `ci` and run on `ubuntu-latest`.
4. The steps must run in this exact order:
   - `actions/checkout@v4`
   - `actions/setup-node@v4` with `node-version: '20'` and `cache: 'npm'`
   - `run: npm ci`
   - `run: npx tsc --noEmit`
   - `run: npx eslint src/ --max-warnings 0`
   - `run: npm run test:coverage`
   - `run: npm run build`
5. Each `run` step must NOT have an explicit `name` key (the command text serves as the step label in GitHub Actions).
6. Any non-zero exit code from any step must fail the job (this is default GitHub Actions behavior; no `continue-on-error` allowed).
7. Run `npm run test` to confirm no test file is broken before marking this task complete.

**Technical decisions**

- `actions/checkout@v4` and `actions/setup-node@v4`: pinned to `v4` as specified in the SPEC. Do not use `@latest` (unpredictable).
- `cache: 'npm'` on setup-node: caches `~/.npm` between runs using the `package-lock.json` hash. Significantly reduces install time on repeated pushes.
- `npm ci` (not `npm install`): installs from lock file exactly, fails if lock file is stale. Required for deterministic CI.
- `npx eslint src/ --max-warnings 0`: fails on any warning. If lint currently produces warnings (run `npm run lint` to check), those must be resolved before this step works.
- Step order: lint before test because lint is faster and catches trivial errors early. Build after test to confirm the production artifact is producible.

**Design**

```yaml
# .github/workflows/ci.yml  (new file)
name: CI
on:
  push:
    branches: ["**"]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npx eslint src/ --max-warnings 0
      - run: npm run test:coverage
      - run: npm run build
```

**Acceptance criteria**

1. `.github/workflows/ci.yml` exists.
2. The file contains `on: push: branches: ['**']`.
3. The file contains `on: pull_request: branches: [main]`.
4. The file contains `runs-on: ubuntu-latest`.
5. The `uses: actions/setup-node@v4` step has `node-version: '20'` and `cache: 'npm'`.
6. Steps appear in this order: checkout, setup-node, `npm ci`, `tsc`, `eslint`, `test:coverage`, `build`.
7. `npm run test` passes locally (confirms the workflow references a working test script).

**Test Plan**

No test file is created for the CI workflow itself. Acceptance is verified by reading the YAML file content. The final step (run `npm run test`) confirms no regressions were introduced.

**Files**

- `.github/workflows/ci.yml` (new) - GitHub Actions pipeline: checkout, node setup, install, type-check, lint, test:coverage, build

---

## Implementation order table

| Done | Priority | Task                                               | Depends on | Effort |
| ---- | -------- | -------------------------------------------------- | ---------- | ------ |
| [x]  | 1        | T-1: vitest.config.ts coverage config              | -          | Small  |
| [x]  | 2        | T-2: computeBudgetUtilization + computeChurnSignal | -          | Small  |
| [x]  | 3        | T-3: Scale test gaps + handlers team_id test       | -          | Small  |
| [ ]  | 4        | T-4: Filter-to-fetch integration test              | T-2        | Medium |
| [ ]  | 5        | ~T-5: GitHub Actions CI pipeline~                  | T-1        | Small  |

**Skip:** T-5
