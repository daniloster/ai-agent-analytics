export interface TechDecision {
  area: string
  choice: string
  ruledOut: string[]
  rationale: string
  packageRef?: string
}

export const TECH_DECISIONS: TechDecision[] = [
  {
    area: 'Chart library',
    choice: 'Visx + Visualization render-prop abstraction',
    ruledOut: ['Recharts', 'Nivo', 'ECharts', 'Chart.js', 'Tremor'],
    rationale:
      'Visx provides low-level SVG primitives with full control over accessibility (ARIA table pattern beneath each chart) and custom layouts (availability calendar, anomaly calendar, dual-axis charts). Recharts and Nivo offer less escape-hatch control; Chart.js uses canvas which is inaccessible to screen readers; Tremor does not support the heatmap-style calendar views.',
    packageRef: '@visx/scale @visx/shape @visx/axis @visx/group @visx/text',
  },
  {
    area: 'State management (UI state)',
    choice: 'Preact Signals (@preact/signals-react)',
    ruledOut: ['React useState', 'Zustand', 'Redux Toolkit', 'Jotai'],
    rationale:
      'Signals provide granular subscriptions: only components that read a specific signal re-render when it changes. For a dense dashboard with 38 KPI surfaces, this prevents the cascading re-render problem that useState + Context creates when filter state updates. useSignal replaces useState everywhere per ARCHITECTURE.md.',
    packageRef: '@preact/signals-react',
  },
  {
    area: 'Server state and data fetching',
    choice: 'TanStack Query (React Query)',
    ruledOut: ['SWR', 'RTK Query', 'Apollo Client', 'Manual useEffect fetching'],
    rationale:
      'TanStack Query provides stale-while-revalidate caching, automatic background refetch, and declarative loading/error state with minimal boilerplate. Its query key system maps directly to the URL filter params (date range + team_id), making cache invalidation predictable. RTK Query requires Redux; SWR lacks the built-in devtools and parallel query deduplication used in this project.',
    packageRef: '@tanstack/react-query',
  },
  {
    area: 'Mock API (development and testing)',
    choice: 'MSW (Mock Service Worker) + Faker.js',
    ruledOut: ['JSON Server', 'Static fixture files', 'Hardcoded component data', 'Mirage.js'],
    rationale:
      'MSW intercepts fetch at the Service Worker layer so the app code is identical in development and production - only the network changes. Faker.js generators produce correlated realistic data that varies by filter combination (changing the date range produces different numbers), making the demo indistinguishable from a real backend. Static fixtures cannot demonstrate filter behavior.',
    packageRef: 'msw @faker-js/faker',
  },
  {
    area: 'Deep equality for computed signals',
    choice: 'react-fast-compare',
    ruledOut: ['Lodash isEqual', 'JSON.stringify comparison', 'Reference equality (no library)'],
    rationale:
      'Signal computations returning arrays or objects produce new references on every evaluation even when structurally unchanged. react-fast-compare is ~300B with no transitive dependencies and correctly handles React synthetic events (unlike lodash isEqual). Used inside useDeepComputed to suppress re-renders when computed signal output is structurally identical to the previous value.',
    packageRef: 'react-fast-compare',
  },
  {
    area: 'UI component primitives',
    choice: 'shadcn/ui (Radix UI + Tailwind)',
    ruledOut: ['Mantine', 'Ant Design', 'Material UI', 'Headless UI alone', 'Custom from scratch'],
    rationale:
      'shadcn/ui components are copied into src/components/ui/ (owned, not a dependency), making customization unconditional. Radix UI primitives beneath each component provide WAI-ARIA compliance (Dialog, DropdownMenu, Popover) without custom focus trap or keyboard navigation code. Tailwind class-based styling integrates with the project\'s design token system.',
    packageRef: 'shadcn/ui (radix-ui + tailwindcss)',
  },
  {
    area: 'Test framework',
    choice: 'Vitest + React Testing Library',
    ruledOut: ['Jest', 'Playwright component tests', 'Storybook interaction tests', 'Cypress component tests'],
    rationale:
      'Vitest runs in the same Vite pipeline as the dev and build steps, sharing configuration and eliminating a separate Jest transform config. React Testing Library encourages testing user-visible behavior rather than implementation details. The never-mock-application-code rule (only external boundaries via MSW) keeps tests close to real usage.',
    packageRef: 'vitest @testing-library/react @testing-library/user-event',
  },
  {
    area: 'URL filter state persistence',
    choice: 'React Router useSearchParams',
    ruledOut: ['React Context (session-only)', 'localStorage', 'Zustand with URL sync plugin'],
    rationale:
      'Filter state (date range, team_id) must survive page refresh and be shareable via link - a core analytics use case. URL search params are the only mechanism satisfying both requirements. React Router v6 useSearchParams handles encoding/decoding; initFiltersFromUrl() bootstraps signals on mount from the current URL.',
    packageRef: 'react-router-dom',
  },
]
