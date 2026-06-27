export interface DecisionEntry {
  id: string
  decision: string
  options: string[]
  chosen: string
  rationale: string
  reversible: boolean
}

export const KEY_DECISIONS: DecisionEntry[] = [
  {
    id: 'D-1',
    decision: 'Dashboard layout pattern',
    options: [
      'Single-page with progressive scroll sections',
      'Multi-page SPA with sidebar routing',
      'Tab-based navigation with lazy sections',
    ],
    chosen: 'Single-page with progressive scroll sections',
    rationale:
      'Analytics dashboards are most effective when all KPIs are scannable in a continuous scroll rather than requiring tab-switching. A single-page layout also eliminates route-level loading states and simplifies the URL filter state (one URL carries all active filters for all sections simultaneously).',
    reversible: true,
  },
  {
    id: 'D-2',
    decision: 'Chart library',
    options: [
      'Visx (low-level SVG primitives)',
      'Recharts (component-based)',
      'Nivo (D3-based with rich defaults)',
      'Chart.js (canvas-based)',
      'Tremor (Tailwind-native charts)',
    ],
    chosen: 'Visx + Visualization render-prop abstraction',
    rationale:
      'This dashboard requires full keyboard/ARIA accessibility on chart data elements and heatmap visualizations that Recharts cannot produce. Visx gives direct SVG control for precise layout. A Visualization render-prop abstraction (src/components/charts/Visualization.tsx) wraps Visx primitives so section components never call Visx directly, keeping chart internals replaceable.',
    reversible: true,
  },
  {
    id: 'D-3',
    decision: 'State management approach',
    options: [
      'Preact Signals (useSignal for local, signal() for shared)',
      'React useState + Context',
      'Zustand global store',
      'Redux Toolkit',
    ],
    chosen: 'Preact Signals (useSignal for local state)',
    rationale:
      'Signals provide granular subscriptions without re-rendering parent components when a child signal changes. For a dashboard with many concurrent KPI cards, this prevents cascading re-renders when filter state updates. useSignal replaces useState everywhere per ARCHITECTURE.md; no global store is used since all shared state is URL-derived filter state.',
    reversible: false,
  },
  {
    id: 'D-4',
    decision: 'Server state and data fetching',
    options: [
      'TanStack Query (React Query) with MSW mock handlers',
      'SWR with custom fetch wrappers',
      'RTK Query (Redux Toolkit Query)',
      'Manual useEffect + useState fetching',
    ],
    chosen: 'TanStack Query with MSW + Faker.js mock handlers',
    rationale:
      'TanStack Query provides automatic background refetch, stale-while-revalidate caching, and declarative loading/error states with no boilerplate. MSW intercepts fetch at the Service Worker level so the app code is identical in development and production - only the network layer changes. Faker.js generates realistic correlated data without a real backend.',
    reversible: true,
  },
  {
    id: 'D-5',
    decision: 'Filter state persistence',
    options: [
      'URL search params (persistent, shareable)',
      'React Context (session-only, not shareable)',
      'localStorage (persistent, not shareable)',
      'Zustand with URL sync plugin',
    ],
    chosen: 'URL search params via React Router useSearchParams',
    rationale:
      'Filter state (date range, team selection) must survive page refresh and be shareable via link - a core analytics workflow. URL search params are the only approach that satisfies both. React Router\'s useSearchParams handles encoding/decoding; initFiltersFromUrl() initializes signals from the URL on mount.',
    reversible: true,
  },
  {
    id: 'D-6',
    decision: 'Mock data architecture',
    options: [
      'MSW Service Worker with Faker.js handlers',
      'Static JSON fixtures committed to the repo',
      'JSON Server local REST server',
      'Hardcoded objects in component files',
    ],
    chosen: 'MSW Service Worker + Faker.js seeded generators',
    rationale:
      'Static JSON fixtures go stale and do not vary across filter combinations, making it impossible to demonstrate the dashboard\'s filter behavior. MSW handlers call Faker.js generators that produce correlated data (e.g. a team with high runs also has proportionally higher cost) in response to actual API calls, making the demo indistinguishable from a live backend.',
    reversible: true,
  },
  {
    id: 'D-7',
    decision: 'Component organization within a route',
    options: [
      'Co-located components in src/routes/<route>/components/',
      'All components in src/components/ regardless of route',
      'Feature-based folders at the repo root level',
    ],
    chosen: 'Co-located components in src/routes/<route>/components/',
    rationale:
      'Route-specific components (KpiEntryCard, DecisionCard, UnderstandingSidebar) have no reuse outside their route. Co-locating them with the route makes the dependency graph explicit and allows the entire route to be deleted as a unit without leaving orphaned components in the shared components/ tree.',
    reversible: true,
  },
  {
    id: 'D-8',
    decision: 'KPI formula implementation location',
    options: [
      'Pure functions in src/lib/kpi/formulas.ts',
      'Inline computations inside MSW handlers',
      'Computed inside TanStack Query select callbacks',
    ],
    chosen: 'Pure functions in src/lib/kpi/formulas.ts',
    rationale:
      'KPI formulas (computeRetentionCost, computeCostPerQualityPoint, etc.) need to be unit-tested in isolation and potentially reused across the mock generator and the /understanding documentation page. Pure functions with no side effects are the only approach that enables this. Inline computations in handlers or select callbacks cannot be tested without mocking the entire query stack.',
    reversible: true,
  },
  {
    id: 'D-9',
    decision: 'Deep equality for signal-derived computed values',
    options: [
      'useDeepComputed (react-fast-compare wrapper)',
      'useComputed (Preact Signals built-in, reference equality)',
      'useMemo (React built-in)',
    ],
    chosen: 'useDeepComputed for all non-JSX computed values',
    rationale:
      'Signal computations that return arrays or objects (e.g. filtered team list) produce a new reference on every tick even when the data is structurally identical. useComputed with reference equality would re-render all consumers on every signal update. useDeepComputed wraps useComputed with react-fast-compare to suppress re-renders when the result is structurally unchanged.',
    reversible: true,
  },
  {
    id: 'D-10',
    decision: 'Chart accessibility pattern',
    options: [
      'ARIA table pattern (role="table", role="row", role="cell") beneath each chart',
      'aria-label on the SVG container only',
      'Caption text below each chart',
      'No explicit accessibility (skip for v1)',
    ],
    chosen: 'ARIA table pattern rendered as visually hidden sibling to the SVG',
    rationale:
      'SVG charts are opaque to screen readers unless explicitly made accessible. The ARIA table pattern (a visually hidden <table> with role="table" containing the chart data) is the only approach that gives screen reader users the same information as sighted users. aria-label on the SVG container only announces a title; it does not provide access to individual data points.',
    reversible: true,
  },
  {
    id: 'D-11',
    decision: 'Sidebar navigation type for /understanding',
    options: [
      'IntersectionObserver-driven active section highlight + smooth scroll',
      'URL hash routing (e.g. /understanding#kpis)',
      'React Router nested routes per section',
    ],
    chosen: 'IntersectionObserver + smooth scroll, no URL hash updates',
    rationale:
      'URL hash routing would require each section to be a distinct route, complicating the static-page model. Nested routes add QueryClient complexity for a page with no async data. IntersectionObserver + scrollIntoView gives the same UX (sidebar tracks scroll position, clicking a link scrolls to the section) without touching the URL, which keeps the /understanding route URL clean and bookmark-friendly.',
    reversible: true,
  },
  {
    id: 'D-12',
    decision: 'TypeScript strict mode',
    options: [
      'strict: true (all strict flags enabled)',
      'strictNullChecks only',
      'No strict mode (loose TypeScript)',
    ],
    chosen: 'strict: true',
    rationale:
      'Strict mode catches null-dereference bugs that are the most common source of runtime errors in analytics dashboards (e.g. accessing .value on a potentially null quality score). The up-front cost of annotating nullable fields pays off immediately when adding new KPI cards that reference optional API fields.',
    reversible: false,
  },
  {
    id: 'D-13',
    decision: 'Component definition style',
    options: [
      'function declaration: export function Foo()',
      'arrow function const: export const Foo = () =>',
      'React.forwardRef wrapper',
    ],
    chosen: 'function declaration (export function Foo)',
    rationale:
      'Function declarations are hoisted, readable in stack traces by their actual name, and play well with the Babel signals transformer that identifies React components by their PascalCase function name. Arrow function components defined as const require the transformer to find the parent VariableDeclarator to determine the name, which is more fragile. ARCHITECTURE.md mandates function declarations; no exceptions.',
    reversible: false,
  },
  {
    id: 'D-14',
    decision: 'Test framework and mock strategy',
    options: [
      'Vitest + React Testing Library (component tests) + MSW for integration',
      'Jest + Enzyme (legacy)',
      'Playwright component tests only',
      'Storybook interaction tests',
    ],
    chosen: 'Vitest + React Testing Library; never mock application code',
    rationale:
      'Vitest runs in the same Vite pipeline used for dev/build, eliminating a separate Jest transform config. React Testing Library encourages testing user-visible behavior rather than implementation details. The "never mock application code" rule means stores, signals, and utility functions are tested with real instances - only external boundaries (API calls intercepted by MSW) are mocked.',
    reversible: true,
  },
  {
    id: 'D-15',
    decision: 'UI component library',
    options: [
      'shadcn/ui (Radix UI + Tailwind, copy-into-repo)',
      'Mantine (full-featured, opinionated)',
      'Ant Design (enterprise-focused)',
      'Build from scratch',
    ],
    chosen: 'shadcn/ui',
    rationale:
      'shadcn/ui components are owned by the project (copied into src/components/ui/) rather than imported from a package, making customization straightforward. The Radix UI primitives beneath each component provide accessibility (ARIA roles, keyboard navigation) by default. The Tailwind-based styling integrates natively with the project\'s design token system.',
    reversible: true,
  },
]
