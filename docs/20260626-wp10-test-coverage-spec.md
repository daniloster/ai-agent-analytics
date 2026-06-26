# SPEC: WP-10 - Test Coverage & CI Baseline

**Date:** 2026-06-26
**Working Package:** WP-10
**Depends on:** WP-05, WP-06, WP-07, WP-08
**Effort:** Medium

---

## Assumptions (confirmed or defaulted)

- Vitest is the test runner (established in WP-01; `vitest.config.ts` already exists).
- React Testing Library (`@testing-library/react`) for component tests.
- Coverage threshold: 80% line coverage and 80% function coverage on `src/lib/` and `src/components/kpis/`.
- `tsc --noEmit` must pass with zero errors.
- No E2E tests in v1 (per investigation scope boundary).
- All test files are co-located with source files per ARCHITECTURE.md §5.1: `foo.ts` -> `foo.test.ts`.
- `vitest.setup.ts` already mocks `@preact/signals-react/runtime` (established in WP-01).
- CI runs on GitHub Actions (`ubuntu-latest`).

---

## 1. Context

This WP implements the CI baseline described in WP-10 of `docs/20260626-analytics-dashboard-plan.md`.

It AUDITS test coverage across WP-01 through WP-09, FILLS any gaps (scale unit tests, KPI formula edge cases, MSW handler contract tests, filter integration test), and WIRES a GitHub Actions CI pipeline so the full suite runs automatically on every push and pull request.

No new features. No new components. Only test files and CI configuration.

**New files:**
- `.github/workflows/ci.yml` - GitHub Actions pipeline
- `src/components/charts/primitives/scales.test.ts` - D3 scale unit tests (if WP-03 did not create them)
- `src/lib/kpi/formulas.test.ts` - KPI formula completeness + edge case tests (if WP-05/07/08 gaps exist)
- `src/components/sections/integration.test.ts` - filter flow integration test

**Modified files:**
- `vitest.config.ts` - add `coverage` block with provider, thresholds, reporters
- `package.json` - add `"test:coverage"` script

**Modified test files (gap fill only, not rewrites):**
- `src/lib/mock/handlers.test.ts` - ensure all 7 handlers are covered and `team_id` scoping is verified
- `src/components/kpis/TeamTable.test.ts` - add null-quality-score sort edge case
- `src/lib/kpi/formulas.test.ts` - add division-by-zero and null-input edge cases if missing

---

## 2. Data model

No domain types. The coverage threshold configuration is the normative contract this WP enforces:

```ts
// vitest.config.ts - coverage section (added by this WP)
// coverage: {
//   provider: 'v8',
//   reporter: ['text', 'html', 'lcov'],
//   thresholds: {
//     'src/lib/**': {
//       lines: 80,
//       functions: 80,
//     },
//     'src/components/kpis/**': {
//       lines: 80,
//       functions: 80,
//     },
//   },
//   exclude: [
//     'src/lib/mock/**',      // generators are tested via handler tests, not line-by-line
//     'src/**/*.test.ts',
//     'src/**/*.d.ts',
//     'vitest.setup.ts',
//   ],
// }
```

---

## 3. Component / module design

### New files

**`.github/workflows/ci.yml`** (new)

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: ['**']
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npx eslint src/ --max-warnings 0
      - run: npm run test:coverage
      - run: npm run build
```

All steps are sequential; any non-zero exit code fails the job and blocks merge.

**`src/components/charts/primitives/scales.test.ts`** (new, unless WP-03 already created it)

Pure D3 scale math, no rendering, no mocks required.

Tests to cover:
- `scaleLinear` with `domain([0, 100])` and `range([0, 200])`: `scale(0) === 0`, `scale(50) === 100`, `scale(100) === 200`
- `scaleLinear` clamp behavior: `scale(150)` without clamp returns 300; with clamp returns 200
- `scaleBand` bandwidth: given 4 domain items and range `[0, 400]` with `padding(0)`, bandwidth === 100
- `scaleBand` with padding: `padding(0.1)` reduces bandwidth below 100
- `scaleTime` with ISO date strings: `scale(new Date('2026-01-15'))` falls between `scale(new Date('2026-01-01'))` and `scale(new Date('2026-01-31'))`
- `scaleSequential` for heatmap: maps `[0, 1]` domain to interpolator output; `scale(0)` and `scale(1)` return distinct color strings

**`src/lib/kpi/formulas.test.ts`** (new or expanded)

Tests to cover (all KPI pure functions from `src/lib/kpi/formulas.ts`):
- `computeRetentionCost(totalCost, mau)`: standard case; `mau === 0` returns `null` (not `Infinity`); `totalCost === 0` returns `0`
- `computeCostPerQualityPoint(totalCost, ratedRunCount, avgQualityScore)`: standard case; any param `null` returns `null`; `ratedRunCount * avgQualityScore === 0` returns `null`
- `computeErrorRateSeverity(rate)`: `rate < 0.05` returns `'green'`; `rate === 0.05` returns `'amber'`; `rate > 0.1` returns `'red'` - boundary values explicitly tested
- `computeProjectedMonthEnd(currentSpend, daysElapsed, daysInMonth)`: `daysElapsed === 0` returns `null`; standard case matches formula `(currentSpend / daysElapsed) * daysInMonth`
- `computeBudgetUtilization(currentSpend, budget)`: `budget === 0` returns `null`; 65% case matches
- `computeChurnSignal(recentRuns, historicalRuns)`: user qualifies when `historicalRuns >= 5` and `recentRuns === 0`; does not qualify when `historicalRuns < 5`; does not qualify when `recentRuns > 0`
- `computeQualityCostEfficiency(avgQuality, acceptanceRate, costPerRun)`: `costPerRun === 0` returns `null`; standard case matches formula

**`src/lib/mock/handlers.test.ts`** (modified to ensure completeness)

Tests to cover for each of the 7 endpoints:
- Each handler responds with HTTP 200
- Response `Content-Type` is `application/json`
- Response body is valid JSON parseable without throwing
- All required top-level keys from the TypeScript interface are present (checked via `Object.keys`)
- `GET /api/analytics/overview` with `?from=2026-01-01&to=2026-01-31` returns `totalRuns`, `activeUsers`, `seatAdoptionRate`, `totalCost`, `avgQualityScore` (and others per `OverviewResponse` interface)
- `GET /api/analytics/teams` with `?team_id=team-1` returns only data for that team (array length 1)
- `GET /api/analytics/timeseries` returns an array where each element has `date`, `runs`, `tokens`, `cost`
- `GET /api/org/config` returns `seatCount`, `monthlyBudget`, `billingModel`

**`src/components/sections/integration.test.ts`** (new)

Full integration test: real MSW handlers + TanStack `QueryClient` + signal-backed FilterBar.

Tests to cover:
- **Filter change triggers refetch:** render `<App />` (or `<DashboardLayout>` with sections); interact with `DateRangePicker` to change from "Last 30 days" to "Last 7 days"; assert TanStack Query makes a new fetch (via `waitFor` + MSW request log or `vi.spyOn(globalThis, 'fetch')`); assert KpiCard values update
- **Stable data on same params:** render with `?from=2026-01-01&to=2026-01-31`; wait for initial render; advance `vi.advanceTimersByTime(30_000)` (trigger poll refetch); assert no visible re-render occurred (values identical - seeded faker)
- **URL hydration on mount:** navigate to `/?from=2026-05-01&to=2026-05-31&team=team-2`; assert `filterSignals.dateRange.value.from` equals `2026-05-01`; assert `filterSignals.teamId.value` equals `team-2`; assert KpiCards are fetched with those params (check MSW request URL)
- **TeamSelector change scopes data:** select "Frontend" from team selector; assert `/api/analytics/overview` request includes `?team_id=team-frontend`; assert URL updates to include `&team=team-frontend`

### Modified files

**`vitest.config.ts`** (modified) - add `coverage` block:

```ts
// coverage section to merge into existing defineConfig:
coverage: {
  provider: 'v8',
  reporter: ['text', 'html', 'lcov'],
  thresholds: {
    'src/lib/**': { lines: 80, functions: 80 },
    'src/components/kpis/**': { lines: 80, functions: 80 },
  },
  exclude: ['src/lib/mock/**', 'src/**/*.test.ts', 'src/**/*.d.ts', 'vitest.setup.ts'],
}
```

**`package.json`** (modified) - add one script to `scripts`:

```json
"test:coverage": "vitest run --coverage"
```

---

## 4. Interaction diagram

### CI pipeline

```
git push (any branch) or PR opened to main
  --> GitHub Actions: ubuntu-latest runner
  --> actions/checkout@v4 + actions/setup-node@v4 (Node 20, npm cache)
  --> npm ci
      - installs from package-lock.json exactly
      - fails: missing lock file, network error, incompatible engine
  --> npx tsc --noEmit
      - zero type errors required
      - fails: any type error (annotated in PR review)
  --> npx eslint src/ --max-warnings 0
      - zero lint warnings required
      - fails: any warning or error
  --> npm run test:coverage (= vitest run --coverage)
      - runs all test files
      - fails: any test assertion fails
      - fails: src/lib/ or src/components/kpis/ below 80% line coverage
  --> npm run build
      - Vite production build
      - fails: any build-time error (missing import, bad config, etc.)
  --> All green: required status check passes; PR can be merged
```

### Test dependency graph (mocking requirements)

```
No mocks needed (pure functions):
  src/lib/kpi/formulas.test.ts
  src/components/charts/primitives/scales.test.ts
  src/lib/mock/seed.test.ts
  src/lib/utils/*.test.ts

Requires vitest.setup.ts signal mock only:
  src/components/kpis/KpiCard.test.ts
  src/components/kpis/TeamTable.test.ts
  src/components/charts/Sparkline.test.ts
  src/components/charts/AreaChart.test.ts
  src/components/charts/BarChart.test.ts
  src/components/charts/DonutChart.test.ts
  src/components/charts/Heatmap.test.ts

Requires MSW worker + TanStack QueryClient wrapper:
  src/lib/mock/handlers.test.ts
  src/components/sections/integration.test.ts
  src/components/sections/ExecutiveOverview.test.ts
  src/components/sections/TeamBreakdown.test.ts
  src/components/sections/Reliability.test.ts
  src/components/sections/Billing.test.ts
```

---

## 5. Acceptance criteria

1. `npm run test:coverage` exits 0 with all test assertions passing.
2. Vitest coverage report shows `src/lib/` at >= 80% line coverage.
3. Vitest coverage report shows `src/components/kpis/` at >= 80% line coverage.
4. `npx tsc --noEmit` exits 0 with zero type errors.
5. `npx eslint src/ --max-warnings 0` exits 0.
6. `npm run build` exits 0 and produces a non-empty `dist/` directory containing `index.html`.
7. `.github/workflows/ci.yml` is present and triggers on push to any branch and on PR to main.
8. Scale unit test: `scaleLinear` with `domain([0, 100])` and `range([0, 200])` maps `50 --> 100` exactly.
9. `computeRetentionCost(1000, 0)` returns `null`, not `Infinity` or `NaN`.
10. `computeErrorRateSeverity(0.05)` returns `'amber'` (boundary at exactly 5%).
11. All 7 MSW handlers respond HTTP 200 with valid JSON containing all required keys.
12. Integration test: changing date range from "Last 30 days" to "Last 7 days" causes TanStack Query to issue a new fetch with updated `from` / `to` params.
13. Integration test: mounting with `?from=2026-05-01&to=2026-05-31&team=team-2` hydrates `filterSignals.dateRange` and `filterSignals.teamId` correctly before first render.
14. `src/components/sections/integration.test.ts` passes in under 5 seconds (MSW handlers are synchronous in test environment; no real network calls).

---

## 6. Out of scope

- E2E tests (v2 per investigation scope)
- Visual regression testing / screenshot diffing
- Performance benchmarks or load testing
- Cross-browser automated testing
- Coverage thresholds for `src/components/sections/` (integration-level components; harder to isolate; covered by integration tests)
- Coverage thresholds for `src/components/charts/` (visual components; function coverage is less meaningful than behavior tests)
- Mutation testing

---

## Test plan

| File | What it tests |
|------|---------------|
| `src/components/charts/primitives/scales.test.ts` (new or verify from WP-03) | `scaleLinear` domain/range/clamp; `scaleBand` bandwidth with and without padding; `scaleTime` date mapping; `scaleSequential` heatmap color interpolation |
| `src/lib/kpi/formulas.test.ts` (new or expanded) | All KPI formula functions: standard cases, `null` input returns `null`, division-by-zero returns `null`, boundary values for severity thresholds |
| `src/lib/mock/handlers.test.ts` (modified) | All 7 endpoints return 200 with valid JSON; required top-level keys present; `team_id` param scopes team endpoint to 1 result |
| `src/components/sections/integration.test.ts` (new) | Date range change triggers refetch with new params; same params produce stable data across poll interval; URL hydration sets signals before render; team selection scopes API params and updates URL |
