# Wireframe 06 - /understanding Route

**Route:** `/understanding`
**Layout:** Fixed sidebar + scrollable content (does NOT reuse DashboardLayout)
**Audience:** Evaluators, interviewers, curious engineers

---

## Full Page Layout

```
╔══════════════════════════════════════════════════════════════════════════════════════════╗
║  ┌────────────────────────┐ ┌──────────────────────────────────────────────────────┐   ║
║  │  FIXED SIDEBAR (280px) │ │  SCROLLABLE CONTENT                                  │   ║
║  │                        │ │                                                      │   ║
║  │  ⬡ AgentCloud          │ │  Understanding This Dashboard                        │   ║
║  │  [← Back to Dashboard] │ │  ────────────────────────────────────────────────   │   ║
║  │                        │ │  Why this dashboard exists, every decision made,     │   ║
║  │  CONTENTS              │ │  and all 49 KPIs defined.                            │   ║
║  │  ─────────────         │ │                                                      │   ║
║  │  Problem Statement     │ │  PROBLEM STATEMENT                                   │   ║
║  │  Billing Model         │ │  ─────────────────────────────────────────────────   │   ║
║  │  KPI Catalog ▾         │ │  [content]                                           │   ║
║  │    Overview (14)        │ │                                                      │   ║
║  │    Teams (11)          │ │  BILLING MODEL PREMISE                               │   ║
║  │    Reliability (10)    │ │  ─────────────────────────────────────────────────   │   ║
║  │    Billing (10)        │ │  [content]                                           │   ║
║  │  Key Decisions         │ │                                                      │   ║
║  │  Technology Choices    │ │  KPI CATALOG                                         │   ║
║  │  In Scope              │ │  ─────────────────────────────────────────────────   │   ║
║  │  Out of Scope          │ │  [KPI cards grouped by section]                      │   ║
║  │  Glossary              │ │                                                      │   ║
║  │                        │ │  KEY DECISIONS (D-1 through D-15)                    │   ║
║  │                        │ │  ─────────────────────────────────────────────────   │   ║
║  │                        │ │  [decision table]                                    │   ║
║  │                        │ │                                                      │   ║
║  │                        │ │  TECHNOLOGY CHOICES                                  │   ║
║  │                        │ │  [tech stack detail]                                 │   ║
║  └────────────────────────┘ └──────────────────────────────────────────────────────┘   ║
╚══════════════════════════════════════════════════════════════════════════════════════════╝
```

---

## Sidebar Navigation

```
┌────────────────────────────────┐
│  ⬡ AgentCloud                  │
│  [← Back to Dashboard]        │
│                                │
│  ─────────────────────────     │
│                                │
│  ● Problem Statement          │  <- active (text-primary, left border)
│  ○ Billing Model Premise      │  <- inactive (text-muted-foreground)
│  ○ KPI Catalog                │
│      ○ Overview               │
│      ○ Team Breakdown         │
│      ○ Reliability            │
│      ○ Billing & Financial    │
│  ○ Key Decisions              │
│  ○ Technology Choices         │
│  ○ In Scope / Out of Scope    │
│  ○ Glossary                   │
│                                │
│  ─────────────────────────     │
│  49 KPIs   15 Decisions        │
└────────────────────────────────┘
```

---

## KPI Entry Card

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  KPI-10  Cost per Quality Point                               Section: Overview       │
│  ────────────────────────────────────────────────────────────────────────────────    │
│                                                                                      │
│  What it measures                                                                    │
│  The dollar cost of producing one unit of user-perceived quality.                   │
│                                                                                      │
│  Formula                                                                             │
│  ┌─────────────────────────────────────────────────────────────┐                    │
│  │  total_cost / (rated_run_count * average_quality_score)     │                    │
│  └─────────────────────────────────────────────────────────────┘                    │
│                                                                                      │
│  Example                                                                             │
│  $14,200 / (8,200 * 4.1) = $0.422 per quality-point                                │
│                                                                                      │
│  Why it matters                                                                      │
│  "After we upgraded the model tier, cost per quality point went from $0.42 to       │
│  $0.31" - a concrete ROI statement. Lower is better.                                │
│                                                                                      │
│  Data requirements                                                                   │
│  Quality rating system must be active (1-5 star post-run prompt).                  │
│                                                                                      │
│  Visualization                                                                       │
│  KPI card with trend sparkline (lower = better, annotated).                         │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Decision Entry

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  D-2   Chart Library Selection                                      Status: Resolved  │
│  ────────────────────────────────────────────────────────────────────────────────    │
│                                                                                      │
│  Options considered                                                                  │
│  Recharts, Tremor, Nivo, ECharts, Visx, Chart.js                                    │
│                                                                                      │
│  Decision                                                                            │
│  Visx (@visx/* packages from Airbnb)                                                │
│                                                                                      │
│  Rationale                                                                           │
│  Recharts cannot produce heatmaps (KPI-32, KPI-44), confidence interval bands      │
│  (KPI-10), or expose SVG data elements to keyboard/ARIA navigation. Visx gives      │
│  full SVG DOM control; every chart element gets role, tabIndex, aria-label.         │
│                                                                                      │
│  Reversible?                                                                         │
│  Yes - chart usage is isolated behind wrapper components in src/components/charts/  │
│  Swapping the library = updating wrappers only.                                     │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack Section

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  Technology Choices                                                                  │
│  ─────────────────────────────────────────────────────────────────────────────────  │
│                                                                                      │
│  Runtime & Build                                                                     │
│  React 18 + TypeScript (strict)   Vite 5   @vitejs/plugin-react                     │
│                                                                                      │
│  UI Components                                                                       │
│  shadcn/ui (Radix UI + Tailwind CSS)                                                │
│                                                                                      │
│  Charting                                                                            │
│  @visx/* (Airbnb's composable D3 primitives)                                        │
│  Selected over Recharts (hits ceiling at heatmaps), ECharts (canvas - no ARIA),     │
│  Nivo (large bundle, opinionated).                                                   │
│                                                                                      │
│  Reactivity                                                                          │
│  @preact/signals-react - fine-grained UI state. Only components subscribed to a     │
│  changed signal re-render. lib/babel-signals-transformer injects useSignals()       │
│  at build time - component authors never call it manually.                          │
│                                                                                      │
│  Server State                                                                        │
│  TanStack Query - polling (refetchInterval: 30s), caching, loading/error states.   │
│                                                                                      │
│  Mock API                                                                            │
│  MSW + Faker.js (seeded) - intercepts fetch at service worker layer.                │
│  Same filter params = same generated data (prevents polling flicker).               │
│  Switching to real API = delete handler files.                                      │
│                                                                                      │
│  Testing                                                                             │
│  Vitest + React Testing Library + axe-core (accessibility assertions)               │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Sidebar Active State Tracking

Sidebar nav active item tracks scroll via IntersectionObserver on each section heading (same mechanism as the main dashboard SectionNav, but with finer granularity since this page has more sections).

```
Scroll position: at "Key Decisions"
  ○ Problem Statement        (above viewport, inactive)
  ○ Billing Model Premise    (above viewport, inactive)
  ○ KPI Catalog              (above viewport, inactive)
      ○ Overview             (above viewport, inactive)
      ○ Team Breakdown       (above viewport, inactive)
      ○ Reliability          (above viewport, inactive)
      ○ Billing & Financial  (above viewport, inactive)
  ● Key Decisions            (in viewport, active - left border + text-primary)
  ○ Technology Choices       (below viewport, inactive)
  ○ In Scope / Out of Scope  (below viewport, inactive)
  ○ Glossary                 (below viewport, inactive)
```
