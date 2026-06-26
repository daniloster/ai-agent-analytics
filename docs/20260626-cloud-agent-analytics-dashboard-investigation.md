# Investigation: Cloud Agent Analytics Dashboard

**Date:** 2026-06-26
**Status:** Ready
**Scope:** Design and implementation investigation for a customer-facing, organizational-level analytics dashboard for an imaginary cloud AI coding-agent platform. Covers metric definition, product architecture, tech stack, chart library selection, and KPI catalog. Does NOT cover the agent execution platform itself, authentication/SSO, or billing infrastructure backend.

---

## 1. Executive Summary

Organizations using cloud-based AI coding agents need a unified dashboard that answers three questions simultaneously: Are we getting value from this tool? Where is money going? Is the platform reliable? Today these questions are answered by cross-referencing raw billing exports, log grep sessions, and anecdotal feedback - a slow, error-prone process that delays decision-making.

This initiative builds a production-quality, customer-facing analytics dashboard that presents org-wide usage in a progressive drill-down layout: executive KPIs at the top, team-level breakdowns in the middle, reliability indicators below, and billing detail at the bottom. Every layer is designed for a different persona but lives on a single page, so a CTO and a team lead can look at the same URL and each find what they need without filtering or switching views.

The recommended implementation uses React + TypeScript + Vite (per ARCHITECTURE.md), **Visx** (Airbnb's composable D3 primitives) as the charting library, **Preact Signals** (`@preact/signals-react`) for fine-grained UI state reactivity, TanStack Query for server state, and a fully mocked API layer (MSW + Faker.js) so the dashboard can be demonstrated and evaluated without a real backend. Visx is chosen over Recharts because this dashboard is designed to expand: every visualization must be fully accessible via keyboard, and several KPIs (heatmaps, confidence-interval overlays, retention cohort curves) require chart types that Recharts cannot produce without workarounds. A Babel plugin (`lib/babel-signals-transformer`) automatically injects `useSignals()` into every JSX-bearing component at build time, so component authors never call it manually - the same approach used in the companion codebase and documented in `ARCHITECTURE.md` Section 10.2.

---

## 2. Background & Context

### Current state

The imaginary product - hereafter called **AgentCloud** - lets software engineering teams run AI coding agents in the cloud. Engineers trigger agents via CLI, web UI, or CI integration; agents write code, run tests, open pull requests, and report results. Organizations pay a hybrid license: a per-seat monthly base fee plus token-based consumption billed against usage.

Today, AgentCloud customers have no org-level visibility. Individual users can see their own run history. Billing admins receive a monthly invoice PDF. Engineering managers have no way to compare team adoption, identify costly patterns, or connect agent usage to output quality without manual data aggregation.

### Trigger

The assignment explicitly calls for building this dashboard as a greenfield product feature. The prompt references Claude Code on the web as a product analogy - a cloud-hosted coding agent that organizations adopt at scale.

### Cost of inaction

Without this dashboard:
- Engineering managers cannot justify agent spend to finance or leadership.
- No one can detect which teams are burning tokens on failed or low-quality runs.
- Churn from disenchanted teams goes undetected until renewal time.
- Platform reliability issues are invisible until engineers complain.

### Constraints and premises

> **Premise (explicitly stated for reviewers):** The billing model assumed throughout this document is a **hybrid token + seat model**: organizations pay a monthly per-seat license fee (access cost) plus a variable token consumption charge (usage cost). This mirrors Anthropic's Claude API pricing combined with Claude Max seat licensing. All financial KPIs are derived from this model. If the actual product uses a different billing model, the financial KPI formulas in Section 3 and Appendix A must be recalculated accordingly.

- Tech stack is locked to ARCHITECTURE.md: React, TypeScript, Vite, Preact signals, shadcn/ui.
- Live-streaming dashboard updates are a v2 feature; v1 uses polling (30-second refresh).
- No access to raw conversation transcripts in the dashboard (privacy boundary).
- All API data is mocked in v1; the mock layer is designed to be replaced by real endpoints.

---

## 3. Problem Space

### Core problem

Engineering managers at organizations using AgentCloud cannot answer the question "Is this tool worth what we pay for it?" without spending hours aggregating data from multiple sources. They need a single, authoritative view of: how much we spent, what we got for it, which teams are using it effectively, and whether the platform is reliable enough to trust.

### Who is affected

| Stakeholder | How they are affected | Stakes |
|-------------|----------------------|--------|
| Engineering Manager / Team Lead | Cannot track team adoption, identify underperforming patterns, or report usage to leadership | Wastes hours on manual reporting; misses optimization opportunities |
| CTO / VP Engineering | Cannot justify ROI of the AgentCloud contract at renewal | May cancel subscription or reduce seats without data to support value |
| Billing Admin | Receives a monthly PDF invoice with no team-level cost allocation for chargeback | Cannot allocate costs to cost centers; finance friction |
| Individual Engineer | No visibility into whether their own usage patterns are typical or efficient | Cannot self-improve; no feedback loop |
| AgentCloud (the vendor) | Cannot demonstrate ROI to customers, leading to higher churn risk | Lost revenue, harder upsells |

### Root causes

1. **No org-level data aggregation.** Run data exists per-user, but nothing aggregates it across the organization into a coherent view.
2. **No quality signal connected to cost.** Token consumption is tracked, but user-rated output quality is not surfaced alongside it, so there is no way to compute cost-per-useful-output.
3. **No retention/churn instrumentation.** The platform has no concept of user engagement health - it cannot flag that a team's usage dropped 80% in two weeks.
4. **No reliability visibility.** Error rates, timeouts, and queue waits are not surfaced to customers; they only know something is wrong when engineers complain.

### Why now

The product prompt defines this as the deliverable. Additionally, as AI coding tools proliferate (GitHub Copilot Workspace, Cursor, Devin), organizations are increasingly comparing tools on measurable ROI. A dashboard that makes value legible is now a competitive differentiator at renewal time.

---

## 4. Scope & Boundaries

### In scope

- Org-level analytics dashboard (single-page, multi-section layout)
- All KPI definitions and their computation logic (see Appendix A)
- Four dashboard sections: Executive Overview, Team Breakdown, Reliability, Billing
- Date range filter (last 7 days, 30 days, 90 days, custom)
- Team filter (view one team or all teams)
- Mocked API layer with realistic generated data
- Chart library selection and implementation
- Full TypeScript type coverage
- Unit and integration tests per ARCHITECTURE.md
- Responsive layout (desktop primary, tablet secondary)

### Out of scope

- Live streaming updates (v2)
- Individual user drill-down pages (v2)
- AI-generated insight summaries / anomaly detection narration (v2)
- Alerting / notification system (separate initiative)
- Authentication, SSO, or role-based access control (assumed handled by the product shell)
- Backend API implementation (mocked in v1)
- Mobile layout (desktop-only for v1)
- Export to CSV/PDF (v2)
- Comparison against other organizations (benchmarking) - privacy/competitive concerns

### Dependencies

| Dependency | Direction | Notes |
|------------|-----------|-------|
| ARCHITECTURE.md | This initiative depends on it | All implementation decisions must comply |
| AgentCloud API (mocked) | This initiative depends on it | Mock layer replaces it in v1 |
| shadcn/ui + Tailwind CSS | This initiative depends on it | UI primitives and theming |
| Chart library (TBD - see Section 6) | This initiative depends on it | Must be compatible with React + TypeScript |
| Quality rating system | This initiative depends on it | Assumes a 1-5 star post-run quality prompt is already in the product |

---

## 5. Solution Space

### Option A: Single-page progressive dashboard (recommended)

**Description:** One long scrollable page divided into four named sections. The user lands at the top (Executive Overview) and scrolls down through progressively more detailed views. A sticky section navigation bar lets users jump to any section. All sections share the same date range and team filters, which are pinned to the top of the page.

**Pros:**
- Zero context switching - all information is in one URL, shareable with a single link.
- Natural progressive disclosure: CTO reads the top, team lead reads the middle, SRE reads reliability, billing admin reads the bottom.
- Simpler routing and state management than a multi-page app.
- Easier to print/screenshot as a single artifact for reports.

**Cons:**
- Long scroll on large orgs with many teams could feel unwieldy.
- All sections load simultaneously - heavier initial data fetch than lazy-loaded pages.

**Effort:** Medium (4-6 weeks for full v1 with mocks).
**Risk:** Section overload if we add too many KPIs; need strict discipline on what goes in each section.
**When to pick this:** When the primary use case is "send this URL to my CTO before the budget meeting" - the whole story is in one view.

### Option B: Multi-page dashboard with sidebar navigation

**Description:** Separate pages for each section (Overview, Teams, Reliability, Billing), linked from a persistent sidebar. Each page has its own data fetching and layout.

**Pros:**
- Cleaner per-page focus; less cognitive load.
- Easier to add new pages incrementally.
- Each page can have a different filter set (e.g. Reliability page has a different time window than Billing).

**Cons:**
- Loses the "progressive narrative" - user has to know where to look.
- Harder to share as a single artifact.
- More routing complexity.
- Duplicate filter/header components across pages.

**Effort:** Medium-Large (6-8 weeks for full v1).
**Risk:** Users may never discover the Reliability or Billing pages.
**When to pick this:** When each section is used by a clearly distinct persona who never needs to see the others.

### Option C: Configurable widget dashboard (grid layout)

**Description:** Users drag-and-drop KPI cards and charts into a customizable grid. Each widget is independently configurable.

**Pros:**
- Extremely flexible; every org can prioritize their own KPIs.
- Known product pattern (Datadog, Grafana).

**Cons:**
- High implementation complexity (grid library, persistence, widget configuration).
- Risk of "blank canvas" paralysis for new users.
- Far outside the scope of a v1 analytics feature.
- Persona-appropriate defaults still need to be defined, negating some flexibility benefit.

**Effort:** Large (10-14 weeks minimum).
**Risk:** Very high; not a v1 candidate.
**When to pick this:** When the product has a mature analytics offering and enterprise customers demand custom views. Not now.

---

## 6. Key Decisions

| # | Decision | Options Considered | Status | Chosen / Leaning | Rationale | Reversible? |
|---|----------|--------------------|--------|------------------|-----------|-------------|
| D-1 | Dashboard layout pattern | Single-page, Multi-page, Widget grid | Resolved | Single-page progressive (Option A) | Matches the "macro to micro" narrative the PM described; shareable by URL; simpler state | Yes, with significant refactor |
| D-2 | Chart library | Recharts, Tremor, Nivo, ECharts, Visx, Chart.js | Resolved | **Visx** (@visx/* packages) | See D-2 detail below | Yes - charting is isolated behind a component boundary |
| D-3 | Server state management | TanStack Query, SWR, custom hooks | Resolved | TanStack Query | Matches ARCHITECTURE.md "dedicated library for server state"; best devtools; stale-while-revalidate for polling | Yes |
| D-4 | Mock API strategy | MSW (Mock Service Worker), hardcoded fixtures, faker-generated in-memory | Resolved | MSW + faker | MSW intercepts real fetch calls so the mock is transparent to the app; faker produces realistic variance; switching to real API = delete the handler file | Yes - handlers are deleted at API switchover |
| D-5 | Quality signal input | Post-run 1-5 star prompt, thumbs up/down, no rating | Resolved (assumed) | 1-5 star quality prompt already in product | Required for quality-cost KPIs; if not present, quality KPIs must be dropped or deferred | No - removing it breaks ~8 KPIs |
| D-6 | Date range granularity | Last 7/30/90 days + custom, rolling windows, calendar month | Resolved | Last 7/30/90 + custom | Covers all personas: 7d for SRE, 30d for manager, 90d for CTO; simple to implement | Yes |
| D-7 | Team filter scope | Single team only, multi-select, "All teams" default | Resolved | "All teams" default + single-team drill-down | Executive view needs all teams; lead needs their team; the filter switches between these | Yes |
| D-8 | Real-time updates | WebSocket streaming, polling, none | Resolved (v1 scope) | 30-second polling via TanStack Query `refetchInterval` | Live streaming is v2; polling achieves near-real-time at low complexity | Yes - swap to WebSocket in v2 |
| D-9 | Responsive breakpoints | Desktop-only, desktop+tablet, full responsive | Resolved | Desktop primary, tablet secondary (no mobile) | Analytics dashboards are a desktop use case; tablet support for managers on iPads | Yes |
| D-10 | State management for filters | URL params, Zustand/signals, local useState | Resolved | URL search params | Filters must be shareable (paste URL to CTO); URL is the simplest sharable state | Yes |
| D-11 | Testing framework | Vitest, Jest | Resolved | Vitest | Vite-native; zero config duplication with `vite.config.ts`; 3-5x faster than Jest for this project size | No - deep Vite integration |
| D-12 | Mock data generation | Static JSON fixtures, Faker.js seeded, MSW inline | Resolved | MSW handlers + Faker.js with fixed seed | Faker.js produces realistic variance; fixed seed makes tests deterministic and prevents polling flicker | Yes |
| D-13 | Accessibility target | None, WCAG 2.1 AA, WCAG 2.1 AAA | Resolved | WCAG 2.1 AA | Minimum bar for customer-facing enterprise software; charts get `<figure>` + `<figcaption>` + `aria-label` | Yes |
| D-14 | Source folder structure | Feature-based, section-based, type-based | Resolved | Section-based: `src/components/sections/`, `src/components/kpis/`, `src/components/charts/`, `src/lib/mock/` | Aligns with ARCHITECTURE.md atomic design hierarchy; each dashboard section = one organism; chart wrappers are atoms/molecules | Yes |
| D-15 | UI state management | Preact Signals, Zustand, useState | Resolved | Preact Signals (`@preact/signals-react`) | Per ARCHITECTURE.md: signals for all mutable UI state; fine-grained reactivity means only the KPI cards subscribed to a changed filter signal re-render - chart siblings are untouched; `lib/babel-signals-transformer` injects `useSignals()` at build time so no manual calls needed | No - architecture mandate |

### D-2 Detail: Chart Library Selection (Resolved - Visx)

**Decision: Visx (`@visx/*` packages from Airbnb).**

**Why the earlier Recharts recommendation was wrong for this project:**

Recharts is the fastest path to a standard chart on screen. It is not the right tool when the goals are (a) full keyboard accessibility on every chart element, (b) visualizations that go beyond line/bar/donut, and (c) a codebase that can expand without hitting a library ceiling. Concretely, Recharts cannot produce:
- A heatmap (required for KPI-32, KPI-44) - the earlier recommendation worked around this with a CSS grid, which has no keyboard navigation, no color scale, and no interactivity.
- Confidence interval bands on the cost-per-quality-tier chart (KPI-10) - required to communicate statistical reliability of low-sample rating buckets.
- A retention cohort curve with staggered animation (KPI-36) - requires custom path interpolation.
- Full ARIA keyboard navigation within a chart - Recharts renders SVG but adds no `role`, `tabIndex`, or keyboard handlers to data elements.

Visx is not a chart library. It is a set of composable React primitives over D3's proven math layer:

| Package | What it provides |
|---------|-----------------|
| `@visx/scale` | D3 scales as typed React hooks (`scaleLinear`, `scaleBand`, `scaleTime`, etc.) |
| `@visx/shape` | SVG shape primitives: `<LinePath>`, `<AreaClosed>`, `<Bar>`, `<Arc>`, `<Pie>` |
| `@visx/axis` | `<AxisBottom>`, `<AxisLeft>` with full tick customization |
| `@visx/grid` | `<GridRows>`, `<GridColumns>` with CSS variable stroke colors |
| `@visx/tooltip` | `useTooltip` hook + `<TooltipWithBounds>` that stays in viewport |
| `@visx/brush` | Time-series zoom/selection brush with drag handles |
| `@visx/heatmap` | `<HeatmapRect>` / `<HeatmapCircle>` for proper heatmaps |
| `@visx/responsive` | `<ParentSize>` wrapper - cleaner than Recharts `ResponsiveContainer` |
| `@visx/group` | `<Group>` for SVG coordinate transforms |
| `@visx/gradient` | `<LinearGradient>` for fill gradients under area charts |
| `@visx/annotation` | Callout annotations for chart events and thresholds |

**Comparison (revised with Visx as primary candidate):**

| Library | TS quality | Bundle (gzip, tree-shaken) | UX ceiling | Full ARIA possible | Maintenance | Verdict |
|---------|-----------|---------------------------|------------|-------------------|-------------|---------|
| **Visx** | Excellent - TS-first, strict generics | ~40-80 KB (pay per package) | None - you compose anything | Yes - you own the DOM | Active (Airbnb internal use) | **Selected** |
| Recharts | Good - loose in internal payloads | ~98 KB | Hit at heatmaps, custom brushes, confidence intervals | No - library controls SVG output | Very active | Ruled out - ceiling too low for this project |
| Nivo | Excellent | ~200 KB+ | Low - rich but still bounded | Partial | Active | Ruled out - bundle too large; still a ceiling |
| ECharts | Good | ~180 KB core | Low - canvas-based | No - canvas has no DOM accessibility | Very active | Ruled out - canvas kills accessibility |
| Chart.js | Good | ~170 KB | Low - canvas-based | No - same canvas problem | Active | Ruled out - canvas kills accessibility |
| Tremor | Good | ~150 KB | Very low - opinionated | No | Removed charts in v4 | Ruled out |

**The development cost tradeoff - honest accounting:**

Visx requires more code per chart than Recharts. This cost front-loads into the first 3-4 charts and then drops sharply as the project builds its own primitive layer:

| Phase | Recharts cost | Visx cost | Why Visx cost drops |
|-------|--------------|-----------|---------------------|
| Chart 1 (area chart) | ~25 lines | ~120 lines | Building scales, axes, tooltip from scratch |
| Chart 3 (bar chart) | ~20 lines | ~60 lines | Scales and tooltip are reused utilities |
| Chart 5 (donut) | ~15 lines | ~50 lines | Primitive layer is established |
| Chart 8 (heatmap) | Impossible | ~80 lines | No workaround needed |
| Chart 10 (custom) | Blocked | ~70 lines | Any visualization is possible |

The investment in the first 3 charts pays compounding returns. Every chart after chart 4 is assembled from the project's own typed primitive library, not configured from an external API.

**Accessibility implementation with Visx:**

Because Visx gives full control of the SVG DOM, every chart gets proper accessibility:

```tsx
// Area chart data points as keyboard-navigable SVG elements
<g role="list" aria-label="Token consumption over time">
  {data.map((d, i) => (
    <circle
      key={i}
      role="listitem"
      aria-label={`${formatDate(d.date)}: ${formatTokens(d.tokens)}`}
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && showTooltip(d)}
      cx={xScale(d.date)}
      cy={yScale(d.tokens)}
      r={4}
    />
  ))}
</g>
```

This is not possible with Recharts. The library renders the SVG and does not expose the data element lifecycle.

**Theming with Visx + Tailwind:**

Visx does not impose a styling system. Colors come from CSS variables read at render time:

```tsx
const chartTokens = {
  primary: 'hsl(var(--primary))',
  muted: 'hsl(var(--muted-foreground))',
  border: 'hsl(var(--border))',
  background: 'hsl(var(--background))',
}
// Pass these to @visx/scale, @visx/shape stroke/fill props
// Dark mode is automatic - CSS variables switch, charts follow
```

**Chart type to KPI mapping (Visx implementation):**

| KPI(s) | Chart type | Visx primitives | Notes |
|--------|-----------|----------------|-------|
| KPI-01 to KPI-14 (cards) | Sparkline | `<LinePath>` + `@visx/scale` at 80px height | No axes; tooltip on hover via `useTooltip` |
| KPI-04 + KPI-05 trend | Dual-axis area + line | `<AreaClosed>` (tokens) + `<LinePath>` (cost) + two `scaleLinear` | Left/right Y axes via `<AxisLeft>` + `<AxisRight>` |
| KPI-15 | Horizontal bar | `<Bar>` + `scaleBand` (Y) + `scaleLinear` (X) | Sorted descending; animated width on mount |
| KPI-16, KPI-17 | Grouped bar | `<Bar>` per group + nested `scaleBand` | Two bars per team; tokens and cost |
| KPI-18-25 (team table) | Sortable data table | shadcn/ui `<Table>` | Not a chart - table handles sorting, color-coding |
| KPI-23 | Stacked bar | `@visx/shape` `<BarStack>` | One bar per team; segments = task types |
| KPI-26 | Error type donut | `<Pie>` + `<Arc>` + `<PieArcDatum>` | `innerRadius` for donut; animated arc transitions |
| KPI-28, KPI-29 | Stat cards | shadcn/ui `<Card>` | P50 / P95 / P99 - not a chart |
| KPI-30 | Error rate line + threshold | `<LinePath>` + `<Line>` reference at 5% | Threshold line drawn as separate `<Line>` element |
| KPI-32 | Platform availability heatmap | `@visx/heatmap` `<HeatmapRect>` | 31-day grid; `scaleSequential` color scale; keyboard-navigable cells |
| KPI-36 | Budget radial gauge | `<Pie>` rendered as a 180-degree arc | Custom `startAngle` / `endAngle` on `<Arc>` |
| KPI-37 | Projected spend callout | shadcn/ui `<Card>` + `@visx/annotation` | Annotation layer over the spend area chart |
| KPI-41 | Cost by team donut | `<Pie>` + `<Arc>` | Same primitive as KPI-26; reuses the donut utility |
| KPI-42 | Invoice history bar + trend | `<Bar>` + `<LinePath>` in same SVG | Two layers, shared X axis |
| KPI-44 | Cost anomaly calendar | `@visx/heatmap` `<HeatmapRect>` | 31-cell row; anomaly cells use `--destructive` color token |
| KPI-49 | Quality score trend | `<AreaClosed>` with 30-day moving average | `<LinearGradient>` fill; `@visx/annotation` for inflection callouts |
| KPI-10, KPI-12 (quality-cost) | Grouped bar with confidence bands | `<Bar>` + `<AreaClosed>` confidence interval overlay | Confidence band communicates low sample sizes in rating buckets |
| KPI-36 (retention) | Cohort area chart | Three `<AreaClosed>` layers (30d/60d/90d cohorts) | `scaleTime` X axis; staggered mount animation via `@visx/spring` |

**Source structure for the Visx primitive layer:**

```
src/
  components/
    charts/
      primitives/         <- reusable Visx building blocks
        useChartTokens.ts   <- reads CSS vars at runtime for dark mode
        useTooltipState.ts  <- wraps @visx/tooltip useTooltip hook
        ChartSVG.tsx        <- <ParentSize> wrapper + margin normalization
        Axis.tsx            <- typed wrappers around @visx/axis
        Grid.tsx            <- typed wrappers around @visx/grid
        Annotation.tsx      <- threshold lines and callout annotations
      AreaChart.tsx         <- built from primitives
      BarChart.tsx          <- built from primitives
      DonutChart.tsx        <- built from primitives
      Sparkline.tsx         <- built from primitives
      Heatmap.tsx           <- uses @visx/heatmap
      CohortChart.tsx       <- retention-specific, built from primitives
```

Once `primitives/` exists, each named chart (AreaChart, BarChart, etc.) is 40-80 lines of composition, not configuration.

---

## 7. Trade-offs

| Area | What we gain | What we give up | Net verdict |
|------|-------------|-----------------|-------------|
| Single-page layout | Shareable URL, progressive narrative, simpler state | Heavy initial data load, long scroll for large orgs | Acceptable - initial load is mitigated by parallel TanStack Query fetches; scroll is mitigated by sticky section nav |
| Mock API (MSW) | Full UI functionality without a real backend; demo-ready | Mock data may drift from real API contract over time | Acceptable - mock contract must be documented and kept in sync with future backend |
| 30s polling instead of WebSocket | Low complexity, no persistent connection | 30s data lag, higher server request volume | Acceptable for v1; real-time is v2 |
| Polling (quality ratings) | Enables cost-per-quality-point and acceptance-rate KPIs | Requires the product to already have a quality rating flow | Acceptable - stated as a premise; KPIs are gated on this |
| URL-based filter state | Shareable, bookmarkable, back-button works | URL can get long with custom date ranges | Acceptable - max 3-4 params, well within URL limits |
| Desktop-first layout | Optimized for the primary use case | Tablet experience is secondary; mobile is not supported | Acceptable - analytics dashboards are desktop-native |
| Visx over Recharts | No visualization ceiling; full ARIA/keyboard accessibility on every chart element; heatmaps, confidence bands, cohort curves all native | Higher per-chart initial development cost; team must build a primitive layer before iteration is fast | Acceptable - the primitive layer cost is paid once; every chart after it is faster and better than Recharts would produce |
| Visx over ECharts | SVG-based (full DOM accessibility); smaller tree-shaken bundle; React-idiomatic | ECharts handles millions of data points; Visx performance degrades above ~50K points per chart | Acceptable - agent analytics datasets are aggregated; no chart will exceed a few thousand points |
| Visx over Nivo | Lower bundle per chart (pay only for packages used); no opinionated styling system to fight; full UX control | Nivo has more pre-built chart types | Acceptable - the pre-built types Nivo offers are exactly the ones Visx can build with primitives |

---

## 8. Challenges & Risks

| Challenge | Likelihood | Impact | Mitigation Strategy |
|-----------|-----------|--------|---------------------|
| Mock data is unrealistic and fails to demonstrate insight | Med | High | Use faker + seeded random to generate correlated, realistic data (team A has high usage but low quality; team B has low usage but high quality) |
| Quality rating adoption is low (users skip the rating prompt) | Med | Med | Dashboard shows "rated runs" count alongside total; KPIs that require ratings show "insufficient data" gracefully below a threshold (e.g., <10 rated runs) |
| Chart library choice creates a hard dependency that's expensive to change | Low | Med | Isolate all chart usage behind wrapper components (`<AreaChart>`, `<BarChart>` etc.) in `src/components/charts/`; swapping the library = updating these wrappers only |
| KPI definitions are ambiguous and different personas interpret them differently | High | Med | Every KPI in the dashboard has an info tooltip with the exact formula and an example. Documented in Appendix A of this investigation. |
| Team-level data attribution is incorrect (user on multiple teams) | Med | High | Dashboard attributes a run to the team the user's primary team membership, not to the project/repo. Must be documented as a known limitation. |
| Performance: org with 500 users and 2 years of history loads slowly | Low (v1) | High | TanStack Query pagination + server-side aggregation; v1 mocks cap at 90-day window; real backend must pre-aggregate at the team level |
| CSS conflicts between shadcn/ui and chart library | Low | Med | Choose a charting library that renders pure SVG (Recharts, Nivo) to avoid Tailwind conflicts |
| Date range timezone ambiguity (org in UTC+9, billing in UTC) | Med | Med | All dates stored and displayed in UTC; UI shows "(UTC)" label; timezone conversion is v2 |
| Visx `<ParentSize>` inside CSS grid renders at 0-width on first paint | Med | Low | `@visx/responsive` `<ParentSize>` uses a ResizeObserver internally - cleaner than Recharts `ResponsiveContainer`, but still requires an explicit `min-h-[200px]` on the chart wrapper to give the observer a non-zero initial rect. |
| Seeded Faker.js without a fixed seed causes chart flicker on every 30s poll refetch | High | Med | Seed Faker.js with a hash of the current date-range string: same filter inputs = same generated data. Only changes when user adjusts the filter. |
| 15+ chart SVG instances mounted simultaneously on initial render | Med | Med | Lazy-mount charts below the fold using Intersection Observer; replace with skeleton placeholders until the section scrolls into view. Works identically with Visx and Recharts. |
| Visx primitive layer takes longer to build than anticipated (first 3 charts) | Med | Med | Scope the first implementation sprint to build the primitive layer + Section 1 (Executive Overview) only. Do not attempt all four sections in one sprint. The primitive layer is the foundation - getting it right is worth the time. |
| D3 scale math errors produce silent incorrect visualizations (axis tick miscalculation, domain clamping) | Low | High | Every chart must have a unit test that asserts the scale domain and range with known input data. Visx scales are pure functions - they are easy to unit test in isolation without rendering. |

---

## 9. Recommended Solution

### Recommendation

Build Option A: a single-page progressive analytics dashboard using React + TypeScript + Vite, with **Visx** (`@visx/*`) for visualization, TanStack Query for data fetching, MSW + Faker.js for the mock API layer, and URL search params for filter state.

### Rationale

The single-page layout directly serves the stated goal: "starting from macro view and dive in into more detailed views as we move our eyes over more charts and information." The four-section scroll pattern is the canonical implementation of this model.

Visx is chosen over Recharts because this dashboard has two non-negotiable requirements that Recharts cannot meet: full keyboard/ARIA accessibility on chart data elements, and visualization types (heatmaps, confidence-interval overlays, cohort retention curves) that Recharts cannot produce. The earlier recommendation of Recharts was correct for speed-to-first-chart but wrong for a product that will expand. A dashboard that hits a library ceiling at its eighth visualization type is a technical debt problem, not a productivity gain.

Visx's higher per-chart cost is concentrated in the first 3-4 charts. After the primitive layer (`src/components/charts/primitives/`) is established, each additional chart is 40-80 lines of composition. The resulting charts have no artificial constraints on visual design, respond correctly to any container size via `@visx/responsive`, and expose every data element to assistive technologies.

MSW is the industry standard for frontend API mocking with no coupling to UI code. TanStack Query handles polling, caching, and loading states with minimal boilerplate.

### Prerequisites

- `npm install` clean baseline in the workspace
- ARCHITECTURE.md compliance verified before first line of code
- Mock data schema finalized (Appendix A defines it)
- Quality rating feature confirmed as existing in the product (or KPIs requiring it are flagged as "coming soon")

### High-level approach

```
Phase 1 (foundation):
- Set up MSW + faker mock API handlers
- Define all TypeScript interfaces for API responses
- Build the filter bar (date range + team selector) with URL param state
- Build the section nav (sticky, scroll-linked)

Phase 2 (KPI layer):
- Build KPI card component (metric, delta, sparkline, info tooltip)
- Implement all 49 KPIs across four sections (see Appendix A)
- Wire each KPI card to its mock endpoint

Phase 3 (charts):
- Area/line charts: time-series trends
- Grouped bar charts: team comparisons
- Donut charts: distribution breakdowns
- Data table: team breakdown table with sorting

Phase 4 (quality):
- Tests per ARCHITECTURE.md
- Accessibility audit
- Responsive layout verification
```

### Success criteria

1. All four dashboard sections render with realistic mock data in under 2 seconds on localhost.
2. The date range filter changes all KPI values and chart data simultaneously within one polling cycle.
3. The team filter scopes all Team Breakdown section data to the selected team.
4. Every KPI card shows a tooltip with its exact formula and an example value.
5. Filtering to a team with no quality ratings shows "Insufficient data" rather than NaN/0.
6. All 49 KPIs are present in their designated sections (see Appendix A).
7. `tsc --noEmit` passes with zero errors.
8. `npm run test` passes with zero failures.
9. The page is navigable by keyboard only (accessibility baseline).
10. The URL updates when date range or team changes, and the state survives a page refresh.

---

## 10. Open Questions

1. **Does AgentCloud currently collect quality ratings?**
   - Why unresolved: assumed yes as a premise, but if false, ~12 KPIs need to be removed or marked "coming soon."
   - Owner: Product team / assignment evaluators.
   - Impact if unanswered: Quality-cost KPIs display "Coming soon" rather than data; the cost-per-quality-point narrative is weakened.

2. **What chart library wins the research comparison?**
   - Why unresolved: research agent running in parallel at time of writing.
   - Owner: Engineering (this investigation, D-2).
   - Impact: Affects bundle size, animation quality, and theming approach. Low risk - both leading candidates (Recharts, ECharts) are well-understood.

3. **How is team membership modeled when a user is on multiple teams?**
   - Why unresolved: the org model was specified as Org → Teams → Users but did not address multi-team membership.
   - Owner: Product/backend team.
   - Impact: If users can belong to multiple teams, run attribution is ambiguous. v1 assumes a single primary team per user.

4. **What is the exact billing period - calendar month or rolling 30 days?**
   - Why unresolved: not specified in the assignment.
   - Owner: Product/billing team.
   - Impact: Affects "current month spend," "projected month-end spend," and "budget utilization" KPIs. v1 assumes calendar month.

5. **Is there a concept of "projects" or "repositories" within a team?**
   - Why unresolved: the assignment mentions teams but not projects.
   - Owner: Product team.
   - Impact: If projects exist, a fourth drill-down level is possible (Team → Project → User). v1 omits this.

---

## 11. Glossary

| Term | Definition |
|------|-----------|
| AgentCloud | The imaginary cloud AI coding-agent platform this dashboard is built for. Analogous to Claude Code on the web. |
| Agent Run | A single execution of an AI coding agent: from trigger to completion (success or failure). Equivalent to one "job." |
| Token | The fundamental unit of LLM computation. Both the prompt sent to the model and the output it generates are measured in tokens. Billing is expressed as cost per 1,000 tokens (or per 1M tokens in modern pricing). |
| Input Tokens | Tokens in the prompt sent to the model: system instructions + conversation context + user request. |
| Output Tokens | Tokens the model generates as a response. Generally priced higher than input tokens. |
| Seat | A licensed user slot. An organization pays for N seats; N users can be active. |
| MAU | Monthly Active User. A user who triggered at least one agent run in the last 30 days. |
| DAU | Daily Active User. A user who triggered at least one agent run on a given day. |
| Adoption Rate | The percentage of licensed seats whose holder is an MAU. Example: 87 MAU / 120 seats = 72.5% adoption. |
| Quality Score | A 1-5 star rating provided by the engineer after reviewing an agent's output. Captured via an in-product prompt. |
| Acceptance Rate | The percentage of agent outputs that the engineer accepted/applied (e.g., clicked "Apply changes") rather than discarded. |
| Cost per Quality Point | Total spend divided by (run count times average quality score). Measures the unit cost of producing one unit of user-perceived quality. |
| Cost per Accepted Output | Total spend divided by the number of outputs the user accepted. The true cost of a "useful" agent result. |
| Retention Cost | Cost per MAU per month. How much it costs to keep one engineer productive on the platform for 30 days. |
| Activation | A new seat holder's first agent run. Activation rate = % of new seat holders who trigger their first run within 7 days. |
| Churn Signal | A user who had >= 5 runs/week for 4+ consecutive weeks but dropped to 0 runs in the last 14 days. |
| P95 / P99 | The 95th / 99th percentile of a latency distribution. P95 run duration = the duration below which 95% of runs complete. |
| MTTR | Mean Time To Recovery. For platform incidents: average elapsed time from first reported error to resolution. |
| Budget Utilization | Current period spend as a percentage of the organization's allocated budget. |
| Cost Allocation | The process of attributing shared costs (org-level) to individual teams for internal chargeback or reporting. |
| Chargeback | An internal accounting practice where a central cost (the AgentCloud subscription) is allocated to the business units (teams) that consumed it. |
| MSW | Mock Service Worker. A browser-level API mocking library that intercepts `fetch` calls at the service worker layer without modifying application code. |
| TanStack Query | A React server-state library (formerly React Query) that handles caching, background refetching, polling, and loading/error states. |
| Visx | A collection of composable React primitives over D3, published by Airbnb as `@visx/*` scoped packages. Not a chart library - it provides scales, shapes, axes, grids, tooltips, and brushes that are assembled into custom charts. Key packages used: `@visx/scale`, `@visx/shape`, `@visx/axis`, `@visx/grid`, `@visx/tooltip`, `@visx/heatmap`, `@visx/responsive`, `@visx/annotation`. |
| Visx primitive layer | The project's internal abstraction over Visx: `src/components/charts/primitives/`. Contains typed wrappers (`ChartSVG`, `Axis`, `Grid`, `Annotation`), the `useChartTokens` hook that reads CSS variables for dark-mode-aware colors, and the `useTooltipState` hook. Charts (`AreaChart`, `BarChart`, etc.) are composed from these primitives. |
| Preact Signals | A fine-grained reactivity system (`@preact/signals-react`) used for all mutable UI state per ARCHITECTURE.md. Signals are private to their owning model; components subscribe by reading `.value`. Only components subscribed to a changed signal re-render - unrelated chart siblings are not re-rendered. This matters on a dashboard where 15+ charts share a filter bar: changing the date range must not cause all charts to re-render in sequence. |
| `lib/babel-signals-transformer` | A Babel plugin that automatically injects `useSignals()` at the top of every React component containing JSX. Copied from the companion codebase and documented in `ARCHITECTURE.md` Section 10.2. Wired via `@vitejs/plugin-react`'s `babel.plugins` option. Not active in Vitest - tests that render components must either mock `@preact/signals-react/runtime` or call `useSignals()` explicitly. The hook it imports (`src/hooks/useSignals.ts`) is a thin wrapper over `@preact/signals-react/runtime` that can be updated independently of the signals runtime. |
| shadcn/ui | A component library built on Radix UI primitives and styled with Tailwind CSS. Used for all non-chart UI primitives. |

---

## Appendix A: KPI Catalog

All KPIs are enumerated below with their section, formula, example, and data dependencies. This catalog is the authoritative source of truth for what the dashboard must display.

### Section 1: Executive Overview (CTO / VP Engineering view)

The first section users see. Shows org-wide health at a glance. Answers: "Is the org getting value? Is usage growing? What does it cost us per productive engineer?"

---

**KPI-01: Total Agent Runs**
- **What it measures:** Number of agent executions in the selected period.
- **Formula:** `COUNT(runs WHERE org = org_id AND started_at IN period)`
- **Example:** 12,450 runs in the last 30 days.
- **Why it matters:** The most basic health signal. Flat or declining runs signals disengagement before it shows up in spend.
- **Visualization:** KPI card with sparkline showing daily run count trend.

---

**KPI-02: Active Users (MAU / DAU)**
- **What it measures:** Users with at least one run in the selected period.
- **Formula:** `COUNT(DISTINCT user_id WHERE org = org_id AND started_at IN period)`
- **Example:** 87 unique users in the last 30 days.
- **Why it matters:** Run count can be inflated by power users; active user count reveals breadth of adoption.
- **Visualization:** KPI card. Side note showing DAU/MAU ratio as engagement density.

---

**KPI-03: Seat Adoption Rate**
- **What it measures:** Fraction of licensed seats actively used in the period.
- **Formula:** `MAU / licensed_seat_count * 100`
- **Example:** 87 MAU / 120 seats = 72.5%.
- **Why it matters:** Directly tells finance how much of the seat license is being utilized.
- **Visualization:** KPI card with a donut chart showing used vs. unused seats.

---

**KPI-04: Total Token Consumption**
- **What it measures:** Sum of input + output tokens across all runs in the period.
- **Formula:** `SUM(input_tokens + output_tokens WHERE org = org_id AND period)`
- **Example:** 2.41 billion tokens in 30 days.
- **Why it matters:** Token consumption is the variable cost driver. Trends here predict spend growth.
- **Visualization:** KPI card + area chart showing input vs. output token split over time.

---

**KPI-05: Total Cost**
- **What it measures:** Total dollar spend: seat fees + token consumption charges.
- **Formula:** `(seat_count * seat_price_monthly) + (total_tokens / 1,000,000 * token_rate_per_million)`
- **Example:** $14,200 in June (120 seats @ $50 + 2.41B tokens @ $3/1M output).
- **Why it matters:** The headline number for finance and leadership.
- **Visualization:** KPI card with MoM delta. Area chart showing cumulative spend vs. budget line.

---

**KPI-06: Retention Cost (Cost per Active User)**
- **What it measures:** The average monthly cost of keeping one engineer actively using the platform.
- **Formula:** `total_monthly_cost / MAU`
- **Example:** $14,200 / 87 = $163 per active user per month.
- **Why it matters:** This is the unit economics of the tool. If an engineer saves 10 hours/month and the fully loaded hourly rate is $100, the tool must cost less than $1,000/user to be ROI-positive. $163 is well within that range. The metric makes the ROI conversation concrete.
- **Visualization:** KPI card. Trend line vs. prior period.

---

**KPI-07: Agent Success Rate**
- **What it measures:** Percentage of runs that complete without an error.
- **Formula:** `COUNT(runs WHERE status = 'success') / COUNT(runs) * 100`
- **Example:** 94.2% success rate.
- **Why it matters:** Success rate is the platform's reliability headline. Below ~90% signals systemic issues.
- **Visualization:** KPI card with trend sparkline and red/amber/green status indicator.

---

**KPI-08: Average Run Duration**
- **What it measures:** Mean elapsed time from run start to completion.
- **Formula:** `MEAN(completed_at - started_at WHERE status = 'success')`
- **Example:** 47 seconds.
- **Why it matters:** Duration is a proxy for agent complexity and user wait time. Rising duration may signal context bloat or infrastructure degradation.
- **Visualization:** KPI card + line chart showing P50/P95 trend.

---

**KPI-09: Average Quality Score**
- **What it measures:** Mean user-rated quality (1-5 stars) across all rated runs in the period.
- **Formula:** `MEAN(quality_rating WHERE quality_rating IS NOT NULL AND period)`
- **Example:** 4.1 / 5.0.
- **Why it matters:** The only direct measure of output usefulness from the user's perspective. Cost metrics are meaningless without a quality signal.
- **Visualization:** KPI card with star display and trend sparkline. Shows rated run count.
- **Data dependency:** Quality rating system must be active.

---

**KPI-10: Cost per Quality Point**
- **What it measures:** The dollar cost of producing one unit of user-perceived quality.
- **Formula:** `total_cost / (rated_run_count * average_quality_score)`
- **Example:** $14,200 / (8,200 * 4.1) = $0.422 per quality-point.
- **Why it matters:** Allows comparing efficiency across time periods or after configuration changes. "After we upgraded the model tier, cost per quality point went from $0.42 to $0.31" is a concrete ROI statement.
- **Visualization:** KPI card. Trend line (lower is better, annotate this clearly).
- **Data dependency:** Quality rating system must be active.

---

**KPI-11: Output Acceptance Rate**
- **What it measures:** Percentage of agent outputs the engineer accepted (applied to their codebase) vs. discarded.
- **Formula:** `COUNT(runs WHERE user_action = 'accepted') / COUNT(runs WITH user_action) * 100`
- **Example:** 71.4% acceptance rate.
- **Why it matters:** The ultimate utility signal. A run that produces output the engineer throws away is a waste. Acceptance rate captures this without relying on the user rating the run.
- **Visualization:** KPI card + trend sparkline.
- **Data dependency:** Product must track accept/discard actions on agent output.

---

**KPI-12: Cost per Accepted Output**
- **What it measures:** The effective cost of producing one useful result.
- **Formula:** `total_cost / COUNT(runs WHERE user_action = 'accepted')`
- **Example:** $14,200 / (12,450 * 0.714) = $1.60 per accepted output.
- **Why it matters:** This is the true unit economics of value. It collapses cost, volume, and quality into one number. "It costs us $1.60 to get the AI to produce something an engineer keeps" is the simplest ROI framing for leadership.
- **Visualization:** KPI card + trend sparkline (lower is better).
- **Data dependency:** Accept/discard tracking + cost data.

---

**KPI-13: MoM Usage Growth**
- **What it measures:** Percentage change in total runs vs. the equivalent prior period.
- **Formula:** `(runs_this_period - runs_prior_period) / runs_prior_period * 100`
- **Example:** +18.4% vs. prior 30 days.
- **Why it matters:** Growth in usage is the leading indicator of contract expansion.
- **Visualization:** KPI card with delta badge (green/red arrow).

---

**KPI-14: User Activation Rate**
- **What it measures:** Percentage of new seat holders who triggered their first run within 7 days of seat provisioning.
- **Formula:** `COUNT(users WHERE first_run_at <= provisioned_at + 7 days) / COUNT(new_users_in_period) * 100`
- **Example:** 68% of 22 new seats activated within 7 days.
- **Why it matters:** Activation rate is the conversion funnel metric - it measures whether new seats translate to new users. Low activation is a sign-up problem or an onboarding problem.
- **Visualization:** KPI card + funnel mini-chart (seats provisioned → activated → MAU).

---

### Section 2: Team Breakdown

Shows the same metrics as Section 1 but segmented by team. Allows managers to compare teams and identify outliers. The team filter scopes this section to a single team for detailed view.

---

**KPI-15: Runs per Team**
- **What it measures:** Agent execution count broken down by team.
- **Formula:** `COUNT(runs) GROUP BY team_id`
- **Example:** Platform: 3,200 | Frontend: 1,800 | Backend: 2,100 | Data: 950.
- **Why it matters:** Identifies which teams are driving usage and which are underutilizing the tool.
- **Visualization:** Grouped bar chart, sortable.

---

**KPI-16: Cost per Team**
- **What it measures:** Token consumption cost allocated to each team.
- **Formula:** `SUM(run_cost) GROUP BY team_id` (seat fees allocated pro-rata by team headcount)
- **Example:** Platform: $4,100 | Frontend: $2,300 | Backend: $2,800 | Data: $1,200.
- **Why it matters:** Enables chargeback to cost centers. Identifies teams consuming disproportionate budget.
- **Visualization:** Stacked bar chart, team vs. cost. Data table row.

---

**KPI-17: Cost per User per Team**
- **What it measures:** Average per-user cost within each team.
- **Formula:** `team_cost / team_MAU`
- **Example:** Platform Team: $4,100 / 12 = $341/user. Backend Team: $2,800 / 18 = $155/user.
- **Why it matters:** Normalizes for team size. Platform Team pays more per user than Backend - is their usage more complex, or are they inefficient?
- **Visualization:** Bar chart sorted by cost per user.

---

**KPI-18: Team Adoption Rate**
- **What it measures:** Active users as a fraction of seat count within each team.
- **Formula:** `team_MAU / team_seat_count * 100`
- **Example:** Data Team: 8 MAU / 15 seats = 53%. Frontend: 14/16 = 87.5%.
- **Why it matters:** Identifies teams where seats are wasted - candidates for seat reduction or targeted enablement.
- **Visualization:** Progress bars per team in the data table.

---

**KPI-19: Average Runs per User per Team**
- **What it measures:** Intensity of usage: how often does the typical active user run an agent within each team?
- **Formula:** `team_run_count / team_MAU`
- **Example:** Platform Team: 3,200 runs / 12 MAU = 267 runs/user. Data Team: 950/8 = 118 runs/user.
- **Why it matters:** High runs/user = heavy reliance on the tool. Low runs/user = occasional use. Both are OK, but outliers (very high or very low) prompt investigation.
- **Visualization:** Bar chart.

---

**KPI-20: Quality Score per Team**
- **What it measures:** Average user-rated quality within each team.
- **Formula:** `MEAN(quality_rating) GROUP BY team_id`
- **Example:** Frontend: 4.4/5 | Data: 3.6/5.
- **Why it matters:** Quality differences between teams may reflect different use cases, agent configurations, or prompt quality. Low-quality teams are candidates for enablement.
- **Visualization:** Ranked list with star ratings.

---

**KPI-21: Failed Run Rate per Team**
- **What it measures:** Percentage of failed runs within each team.
- **Formula:** `COUNT(failed_runs) / COUNT(runs) * 100 GROUP BY team_id`
- **Example:** Data Team: 11.2% failure rate vs. org average 5.8%.
- **Why it matters:** A team with a much higher failure rate may be triggering longer, more complex runs that hit timeouts, or may be using unsupported tool configurations.
- **Visualization:** Color-coded table column (red if > 2x org average).

---

**KPI-22: Cost per Quality Point per Team**
- **What it measures:** Unit cost of quality, segmented by team.
- **Formula:** `team_cost / (team_rated_runs * team_avg_quality_score)`
- **Example:** Frontend: $0.28/quality-point | Data: $0.71/quality-point.
- **Why it matters:** Identifies teams where the tool is not delivering value relative to its cost - candidates for training, configuration review, or model tier upgrade.
- **Visualization:** Bar chart, sorted by efficiency (ascending cost is better).

---

**KPI-23: Top Use Cases per Team**
- **What it measures:** The most frequent agent task categories initiated by each team.
- **Formula:** `TOP 5 (task_category) GROUP BY team_id`
- **Example:** Frontend: 40% UI component generation, 25% test writing, 20% refactoring.
- **Why it matters:** Reveals how different teams are using the tool. Useful for identifying cross-team best practices and tailoring enablement content.
- **Visualization:** Horizontal bar chart per team (top 5 categories).

---

**KPI-24: Churn Signals per Team**
- **What it measures:** Number of users in the team exhibiting churn behavior (active 4+ weeks ago, silent for 2+ weeks).
- **Formula:** `COUNT(users WHERE weekly_runs_4w_ago >= 5 AND weekly_runs_last_2w = 0) GROUP BY team_id`
- **Example:** Data Team: 3 churning users | Backend Team: 1.
- **Why it matters:** Early warning system. Each churning user represents a seat at risk of non-renewal.
- **Visualization:** Warning badge on the team row in the data table.

---

**KPI-25: Team-Level Cost Trend**
- **What it measures:** Week-over-week cost change for each team.
- **Formula:** `(this_week_cost - last_week_cost) / last_week_cost * 100 GROUP BY team_id`
- **Example:** Data Team: +34% WoW (anomaly).
- **Why it matters:** A sudden cost spike in one team often indicates a runaway automation or an accidental high-volume trigger.
- **Visualization:** Sparkline per team row in the data table. Red if > 2x average WoW change.

---

### Section 3: Reliability

Focused on platform health metrics. The SRE / DevOps audience. Answers: "Can we trust this tool? Are things getting better or worse?"

---

**KPI-26: Overall Error Rate**
- **What it measures:** Percentage of runs that failed (non-timeout errors).
- **Formula:** `COUNT(runs WHERE status = 'error') / COUNT(runs) * 100`
- **Example:** 3.8%.
- **Why it matters:** Headline reliability metric. Anything above 5% is problematic for a production tool.
- **Visualization:** KPI card + line chart showing 7-day moving average of error rate.

---

**KPI-27: Timeout Rate**
- **What it measures:** Percentage of runs killed for exceeding the maximum duration.
- **Formula:** `COUNT(runs WHERE status = 'timeout') / COUNT(runs) * 100`
- **Example:** 1.2%.
- **Why it matters:** Timeouts are distinct from errors - they indicate runs that are too complex or context windows that are too large, not infrastructure failures.
- **Visualization:** KPI card + trend sparkline.

---

**KPI-28: P50 / P95 / P99 Run Duration**
- **What it measures:** Latency percentiles for successful run completion.
- **Formula:** `PERCENTILE(completed_at - started_at, [50, 95, 99]) WHERE status = 'success'`
- **Example:** P50: 34s | P95: 142s | P99: 310s.
- **Why it matters:** P50 is the typical experience. P95/P99 reveal tail latency - the worst experiences a fraction of users encounter. Rising P99 without rising P50 indicates outlier runs, not general slowdown.
- **Visualization:** Three KPI cards side by side. Line chart showing all three percentiles over time.

---

**KPI-29: Queue Wait Time**
- **What it measures:** Median time from run submission to agent start (time spent waiting for a slot).
- **Formula:** `MEDIAN(agent_started_at - submitted_at)`
- **Example:** 2.1 seconds median.
- **Why it matters:** High queue wait = insufficient compute capacity. Engineers waiting 30+ seconds for an agent to start will stop using the tool.
- **Visualization:** KPI card + line chart with alert threshold line.

---

**KPI-30: Error Type Breakdown**
- **What it measures:** Distribution of error categories across failed runs.
- **Formula:** `COUNT(runs) GROUP BY error_type WHERE status = 'error'`
- **Example:** Context overflow: 45% | Tool execution failure: 30% | Rate limit: 15% | Infrastructure: 10%.
- **Why it matters:** Different error types require different responses. Context overflow = users need prompt guidance. Rate limit = capacity upgrade. Infrastructure = platform bug.
- **Visualization:** Donut chart + table with counts and percentages.

---

**KPI-31: Retry Rate**
- **What it measures:** Percentage of runs that were automatically retried at least once.
- **Formula:** `COUNT(runs WHERE retry_count > 0) / COUNT(runs) * 100`
- **Example:** 8.3%.
- **Why it matters:** High retry rate inflates token consumption (each retry uses tokens) and increases real cost without increasing value.
- **Visualization:** KPI card.

---

**KPI-32: Platform Availability**
- **What it measures:** Uptime percentage of the agent execution service.
- **Formula:** `(total_minutes - downtime_minutes) / total_minutes * 100`
- **Example:** 99.87% (10.5 minutes of downtime in 30 days).
- **Why it matters:** SLA compliance metric. Most enterprise contracts require 99.9% availability.
- **Visualization:** KPI card + calendar heatmap showing uptime by day (green/amber/red).

---

**KPI-33: Error Trend (7-day moving average)**
- **What it measures:** Direction of error rate change - improving or worsening.
- **Formula:** `Moving average of daily_error_rate over last 7 days vs. prior 7 days`
- **Example:** 7d avg: 3.2% (up from 2.8% prior 7 days) - trending worse.
- **Why it matters:** The current error rate is a snapshot; the trend tells you if the platform is getting better or worse.
- **Visualization:** Line chart with trend direction indicator.

---

**KPI-34: MTTR (Mean Time To Recovery)**
- **What it measures:** Average time from first error spike to resolution, for incidents where error rate exceeded 2x normal.
- **Formula:** `MEAN(incident_resolved_at - incident_detected_at) FOR incidents in period`
- **Example:** 24.3 minutes average MTTR.
- **Why it matters:** Fast recovery matters. An MTTR of 24 minutes vs. 4 hours is the difference between a minor inconvenience and engineers blocked for half a day.
- **Visualization:** KPI card + incident log table.

---

**KPI-35: Cost of Failed Runs**
- **What it measures:** Dollar value of token consumption that produced no successful output.
- **Formula:** `SUM(run_cost WHERE status IN ('error', 'timeout'))`
- **Example:** $680 in wasted spend on failed runs last month.
- **Why it matters:** Connects reliability to finance. Reducing error rate is not just a technical goal - it directly saves money.
- **Visualization:** KPI card. Shown in both the Reliability and Billing sections.

---

### Section 4: Billing & Financial

Focused on spend, budget, and financial projections. The billing admin / finance audience. Answers: "Are we within budget? Where is money going? What will we spend this month?"

---

**KPI-36: Current Month Spend**
- **What it measures:** Accumulated cost in the current calendar month as of today.
- **Formula:** `SUM(run_cost WHERE month = current_month) + prorated_seat_cost`
- **Example:** $9,800 as of June 26 (day 26 of 30).
- **Why it matters:** The headline for the billing admin. Is the org on track vs. budget?
- **Visualization:** KPI card with a progress bar showing spend vs. budget.

---

**KPI-37: Projected Month-End Spend**
- **What it measures:** Extrapolated total spend if current daily burn rate continues through end of month.
- **Formula:** `(current_month_spend / days_elapsed) * days_in_month`
- **Example:** ($9,800 / 26) * 30 = $11,308 projected.
- **Why it matters:** Allows proactive budget management. If projection exceeds budget, intervention is still possible with 4 days left.
- **Visualization:** KPI card. Budget line chart with "projected" dashed continuation.

---

**KPI-38: Budget Utilization**
- **What it measures:** Current month spend as a percentage of the organization's allocated budget.
- **Formula:** `current_month_spend / monthly_budget * 100`
- **Example:** $9,800 / $15,000 = 65.3% of budget used on day 26 of 30.
- **Why it matters:** 65.3% at day 26 means the org is running under budget; 95% at day 15 means overspend risk.
- **Visualization:** Gauge chart + KPI card.

---

**KPI-39: Cost per Successful Run**
- **What it measures:** Average cost of producing one successful agent output.
- **Formula:** `total_period_cost / COUNT(successful_runs)`
- **Example:** $13,520 (cost net of failed runs) / 11,720 successful runs = $1.15 per successful run.
- **Why it matters:** The unit cost of the service. Allows comparison against manual engineering cost (how long would an engineer take to do the same task?).
- **Visualization:** KPI card + trend sparkline.

---

**KPI-40: Token Rate Efficiency**
- **What it measures:** The effective cost per million tokens vs. list price, reflecting any committed use discounts.
- **Formula:** `total_token_cost / (total_tokens / 1,000,000)`
- **Example:** $3.00/1M actual vs. $4.00/1M list price = 25% discount realized.
- **Why it matters:** Enterprise contracts often include volume discounts. This KPI verifies they are being applied correctly and quantifies their value.
- **Visualization:** KPI card comparing actual rate vs. list rate.

---

**KPI-41: Cost Allocation by Team**
- **What it measures:** Spend broken down by team, formatted for chargeback to cost centers.
- **Formula:** `SUM(run_cost) GROUP BY team_id + prorated(seat_cost BY team_headcount)`
- **Example:** Platform: $4,100 (28.9%) | Frontend: $2,300 | Backend: $2,800 | Data: $1,200.
- **Why it matters:** Finance needs this for P&L allocation. Chargeback makes teams accountable for their consumption.
- **Visualization:** Donut chart + downloadable data table.

---

**KPI-42: Invoice History**
- **What it measures:** Last 6 monthly invoices with amounts and MoM change.
- **Formula:** `SELECT month, total_billed ORDER BY month DESC LIMIT 6`
- **Example:** Jun: $14,200 | May: $12,680 | Apr: $11,900 | Mar: $10,400 | Feb: $9,800 | Jan: $9,100.
- **Why it matters:** Shows spend trend at a glance. Steep upward trend prompts capacity planning conversations.
- **Visualization:** Bar chart of monthly invoices with trend line.

---

**KPI-43: Projected Annual Spend**
- **What it measures:** Full-year cost projection based on trailing 90-day burn rate.
- **Formula:** `(90_day_cost / 90) * 365`
- **Example:** ($38,780 / 90) * 365 = $157,300 projected annual spend.
- **Why it matters:** The number that appears in the renewal conversation. Finance wants to know the annual commitment.
- **Visualization:** KPI card.

---

**KPI-44: Cost Anomaly Days**
- **What it measures:** Count of days in the period where daily spend exceeded 2x the 30-day average daily spend.
- **Formula:** `COUNT(days WHERE daily_cost > 2 * avg_daily_cost_30d)`
- **Example:** 2 anomaly days in June (June 12: $1,100 vs. $430 avg; June 19: $890).
- **Why it matters:** Anomaly days often indicate automated runs triggered in error (a CI script running agents in a loop, for example). Early detection prevents surprise invoices.
- **Visualization:** KPI card + calendar heatmap with anomaly days highlighted in red.

---

**KPI-45: Cost of Failed Runs (Billing section)**
- Same as KPI-35 but shown in the billing context, directly connecting reliability to wasted spend. Cross-reference to reliability section.

---

### Section 5: Quality & Efficiency (cross-cutting, embedded in Sections 1-2)

These KPIs appear as a dedicated sub-group within the Executive and Team sections rather than a separate section.

---

**KPI-46: Quality-Cost Efficiency Score**
- **What it measures:** Composite score combining quality, acceptance, and cost into a single efficiency number.
- **Formula:** `(avg_quality_score * acceptance_rate) / cost_per_run`
- **Example:** (4.1 * 0.714) / $1.15 = 2.55 efficiency score.
- **Why it matters:** Allows comparing "is the tool more efficient this month than last month" in a single number, accounting for both quality and cost simultaneously.
- **Visualization:** KPI card with trend. Higher is better (annotated clearly).
- **Data dependency:** Quality ratings + accept/discard tracking.

---

**KPI-47: User Churn Risk Count**
- **What it measures:** Number of users in the org currently exhibiting churn signals.
- **Formula:** `COUNT(users WHERE runs_weeks_5_to_8_ago >= 5 AND runs_last_2_weeks = 0)`
- **Example:** 7 users at churn risk.
- **Why it matters:** Directly translates to seat renewal risk. Each churning user represents potential downgrade at renewal.
- **Visualization:** KPI card with list of at-risk users (by name if privacy permits, otherwise anonymized count).

---

**KPI-48: New User Cost to Activate**
- **What it measures:** Average token cost incurred during a new user's first 10 runs (the activation journey).
- **Formula:** `AVG(SUM(run_cost) WHERE user is new AND run_number <= 10)`
- **Example:** $42 average cost to bring a user to productive status (10 completed runs).
- **Why it matters:** If activation costs $42 and the monthly retention cost is $163, the org breaks even on a new seat in less than one month assuming the user becomes active. This is the "cost to acquire" analog for internal tooling.
- **Visualization:** KPI card.

---

**KPI-49: Quality Score Trend (org-wide)**
- **What it measures:** Rolling 30-day moving average of quality score - is the org getting better at using the tool over time?
- **Formula:** `MOVING_AVERAGE(daily_avg_quality_score, 30_days)`
- **Example:** Quality score rose from 3.7 in January to 4.1 in June - users are improving.
- **Why it matters:** Rising quality trend = healthy adoption. Flat or declining = the tool is not improving user skill, or user expectations are rising faster than output quality.
- **Visualization:** Line chart in the Executive section.

---

## Appendix B: Dashboard Layout Wireframe (ASCII)

```
+------------------------------------------------------------------+
| AgentCloud Analytics                [Date Range v] [Team v]       |
| [Overview] [Teams] [Reliability] [Billing]   --- sticky nav ---   |
+------------------------------------------------------------------+

SECTION 1: EXECUTIVE OVERVIEW
+------------+ +------------+ +------------+ +------------+
| Total Runs | | Active     | | Seat       | | Total      |
| 12,450     | | Users 87   | | Adoption   | | Cost       |
| +18% MoM   | | DAU: 34    | | 72.5%      | | $14,200    |
+------------+ +------------+ +------------+ +------------+

+------------+ +------------+ +------------+ +------------+
| Retention  | | Success    | | Avg Quality| | Cost/      |
| Cost $163  | | Rate 94.2% | | Score 4.1★ | | Quality Pt |
| /user/mo   | | trend ↑    | | trend ↑    | | $0.42      |
+------------+ +------------+ +------------+ +------------+

+----------------------------+ +------------------------------+
| Token Consumption (area)   | | Cost vs Budget (area)        |
| input vs output over time  | | spend, projection, budget    |
+----------------------------+ +------------------------------+

+----------------------------+ +------------------------------+
| Acceptance Rate 71.4%      | | Cost / Accepted Output $1.60 |
| (sparkline)                | | (sparkline)                  |
+----------------------------+ +------------------------------+

SECTION 2: TEAM BREAKDOWN
+------------------------------------------------------------------+
| Team           | Runs  | Cost   | Users | Adoption | Quality | ...
| Platform       | 3,200 | $4,100 | 12    | 80%      | 4.2★   | !
| Frontend       | 1,800 | $2,300 | 14    | 87.5%    | 4.4★   |
| Backend        | 2,100 | $2,800 | 18    | 75%      | 3.9★   |
| Data           | 950   | $1,200 | 8     | 53%      | 3.6★   | ⚠
+------------------------------------------------------------------+

+----------------------------+ +------------------------------+
| Cost per Team (bar)        | | Quality Score per Team (bar) |
+----------------------------+ +------------------------------+

+----------------------------+ +------------------------------+
| Runs per User (bar)        | | Top Use Cases (stacked bar)  |
+----------------------------+ +------------------------------+

SECTION 3: RELIABILITY
+------------+ +------------+ +------------+ +------------+
| Error Rate | | Timeout    | | P50 34s    | | Queue Wait |
| 3.8%       | | Rate 1.2%  | | P95 142s   | | 2.1s       |
| trend ↑↓   | |            | | P99 310s   | |            |
+------------+ +------------+ +------------+ +------------+

+----------------------------+ +------------------------------+
| Error Rate Trend (line)    | | Error Type Breakdown (donut) |
| 7d moving average          | | context/tool/ratelimit/infra |
+----------------------------+ +------------------------------+

+----------------------------+ +------------------------------+
| Platform Availability      | | Cost of Failed Runs $680     |
| Calendar heatmap           | | 4.8% of total spend          |
+----------------------------+ +------------------------------+

SECTION 4: BILLING
+------------+ +------------+ +------------+ +------------+
| Month Spend| | Projected  | | Budget     | | Annual     |
| $9,800     | | $11,308    | | 65.3%      | | Projected  |
| day 26/30  | | (dashed)   | | [======  ] | | $157,300   |
+------------+ +------------+ +------------+ +------------+

+----------------------------+ +------------------------------+
| Invoice History (bar)      | | Cost Allocation (donut)      |
| Jan-Jun monthly totals     | | by team with %               |
+----------------------------+ +------------------------------+

+----------------------------+
| Cost Anomaly Calendar      |
| heatmap, anomaly days red  |
+----------------------------+
```

---

## Appendix C: Mock API Endpoint Catalog

All endpoints return JSON. The mock layer (MSW + faker) generates realistic, correlated data for each.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analytics/overview` | GET | Org-wide KPI summary (KPI-01 through KPI-14) |
| `/api/analytics/teams` | GET | Team list with all per-team KPIs (KPI-15 through KPI-25) |
| `/api/analytics/reliability` | GET | Reliability metrics (KPI-26 through KPI-35) |
| `/api/analytics/billing` | GET | Billing and financial metrics (KPI-36 through KPI-45) |
| `/api/analytics/timeseries` | GET | Time-series data for charts (runs, tokens, cost, quality by day) |
| `/api/org/teams` | GET | Team list for the team selector filter |
| `/api/org/config` | GET | Org config: seat count, budget, billing model |

Query params common to all analytics endpoints:
- `from`: ISO date string (start of range)
- `to`: ISO date string (end of range)
- `team_id`: optional; omit for org-wide

---

*All key decisions are resolved. Document status: Ready for review.*
