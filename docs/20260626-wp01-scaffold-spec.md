# SPEC: WP-01 - Project Scaffold & Infrastructure

**Date:** 2026-06-26
**Status:** Ready
**Source:** `docs/20260626-analytics-dashboard-plan.md` - WP-01

---

## Assumptions (confirmed or defaulted)

- Greenfield project - no package.json, no src/ directory exists yet.
- Bundler: Vite with `@vitejs/plugin-react` (ARCHITECTURE.md mandate).
- Signals transformer wired via Vite's `babel.plugins` option (not Metro/babel.config.js).
- shadcn/ui style: `default`, base color: `slate`.
- TypeScript strict mode with zero `any`.
- Vitest is the test runner; the babel-signals-transformer is NOT applied in Vitest.
- `vitest.setup.ts` mocks `@preact/signals-react/runtime` globally so component tests work without the transformer.
- Tailwind dark mode via CSS variables (shadcn/ui convention) so chart tokens switch automatically.
- ESLint flat config (`eslint.config.js`) with React + TypeScript rules.
- All `@visx/*` packages installed upfront (tree-shaken at build time).

---

## 1. Context

Implements **WP-01** from `docs/20260626-analytics-dashboard-plan.md`.

This is a greenfield initialization. No existing files are touched - every file listed below is new. The output of this WP is the base on which every subsequent WP builds. WP-02 through WP-10 all depend on this scaffold being correct.

Key architectural constraints from `ARCHITECTURE.md`:
- Section 10.2: `lib/babel-signals-transformer` must be wired via `@vitejs/plugin-react` `babel.plugins`.
- Section 3.2: All mutable UI state uses Preact signals; `useDeepComputed` for all non-JSX derived values.
- Section 4.3: Components use `function ComponentName(` declarations - never arrow functions.
- Section 5.1: Every new file must have a co-located test file.

---

## 2. Data model

No domain data model for WP-01. Configuration file shapes only.

### vite.config.ts shape

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const signalsTransformer = path.resolve(__dirname, './lib/babel-signals-transformer/index.js')

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [[signalsTransformer, {}]],
      },
    }),
  ],
  server: {
    host: true,      // bind 0.0.0.0 for Docker access
    port: 5173,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### vitest.config.ts shape

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],   // NO babel-signals-transformer plugin
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      thresholds: {
        lines: 80,
      },
      include: ['src/lib/**', 'src/components/kpis/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### tsconfig.json key compiler options

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### src/hooks/useSignals.ts type signature

```ts
// Thin wrapper over @preact/signals-react/runtime.
// The babel-signals-transformer imports this path at build time.
// Keeping it as a local wrapper allows the runtime to be updated
// independently of the transformer's import path.
export function useSignals(): void
```

### src/hooks/useDeepComputed.ts type signature

Implemented using [`react-fast-compare@^3.2.0`](https://npmx.dev/package/react-fast-compare/v/%5E3.2.0) for structural equality checks. `react-fast-compare` is a ~300 B deep-equality function with no transitive dependencies. It is called once per signal dependency update to compare the new computed value against the previous one; when they are structurally identical, the previous reference is returned so the signals runtime skips subscriber notification and React skips re-render.

```ts
import { useComputed } from '@preact/signals-react'
import type { ReadonlySignal } from '@preact/signals-react'
import { useRef } from 'react'
import equal from 'react-fast-compare'   // ^3.2.0

// See ARCHITECTURE.md Section 3.2.1 for full rationale.
// Use for all non-JSX, non-SkiaPath computed values (primitives, objects, arrays).
// Do NOT use for JSX-returning computeds - use useComputed from @preact/signals-react directly.
export function useDeepComputed<T>(fn: () => T): ReadonlySignal<T>
```

---

## 3. Component / module design

### New files

| Path | Responsibility |
|------|---------------|
| `package.json` | Project metadata, scripts (`dev`, `build`, `test`, `lint`), all dependencies |
| `vite.config.ts` | Vite bundler config with babel-signals-transformer plugin and server host binding |
| `tsconfig.json` | TypeScript strict config for src/ |
| `tsconfig.node.json` | TypeScript config for vite.config.ts and other Node tooling files |
| `eslint.config.js` | ESLint flat config with `@typescript-eslint` + `eslint-plugin-react-hooks` |
| `tailwind.config.ts` | Tailwind v3 config with shadcn/ui CSS variable preset and content paths |
| `postcss.config.js` | PostCSS with `tailwindcss` and `autoprefixer` plugins |
| `components.json` | shadcn/ui CLI config: style=default, rsc=false, tsx=true, tailwind.cssVariables=true |
| `index.html` | Vite entry HTML with `<div id="root">` |
| `vitest.config.ts` | Vitest config - no babel transformer, jsdom environment, vitest.setup.ts |
| `vitest.setup.ts` | Global test setup: vi.mock for `@preact/signals-react/runtime`, `@testing-library/jest-dom` matchers |
| `src/main.tsx` | React root render; MSW worker start placeholder (wired fully in WP-02) |
| `src/App.tsx` | Renders `<RouterProvider router={router} />` where `router` is imported from `src/app/router.tsx`; `router.tsx` is created in WP-04 |
| `src/app/router.tsx` | Placeholder `createBrowserRouter` with a single catch-all route rendering a static "scaffold" div; WP-04 replaces this with the real dashboard route |
| `src/index.css` | Tailwind base + shadcn/ui CSS variable definitions for light and dark themes |
| `src/hooks/useSignals.ts` | Thin wrapper over `@preact/signals-react/runtime`; imported by the transformer |
| `src/hooks/useDeepComputed.ts` | Deep-equal computed signal wrapper (ARCHITECTURE.md Section 3.2.1) |

### Directory skeleton (empty `.gitkeep` files)

```
src/
  app/                        <- framework layer (routing)
  components/
    charts/
      primitives/    <- WP-03
    sections/        <- WP-05 through WP-08
    kpis/            <- WP-05 through WP-08
    layout/          <- WP-04
    filters/         <- WP-04
  routes/
    understanding/   <- WP-11
  lib/
    mock/
      generators/    <- WP-02
    kpi/             <- WP-05 through WP-08
  hooks/
  types/
```

### Packages to install (production dependencies)

```
react react-dom
react-router-dom             # SPA routing: / (dashboard) and /understanding
@preact/signals-react
@tanstack/react-query
msw
@faker-js/faker
react-fast-compare@^3.2.0   # powers useDeepComputed - see ARCHITECTURE.md §3.2.1
@visx/scale @visx/shape @visx/axis @visx/grid @visx/tooltip
@visx/heatmap @visx/responsive @visx/group @visx/gradient @visx/annotation
```

### Packages to install (dev dependencies)

```
typescript vite @vitejs/plugin-react
@types/react @types/react-dom
vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
eslint @eslint/js typescript-eslint eslint-plugin-react-hooks
tailwindcss postcss autoprefixer
@axe-core/react
@babel/helper-module-imports
```

### Public API surface

```ts
// src/hooks/useSignals.ts
export function useSignals(): void

// src/hooks/useDeepComputed.ts
export function useDeepComputed<T>(fn: () => T): ReadonlySignal<T>
```

---

## 4. Interaction diagram

### Build-time: Babel transform pipeline

```
Developer writes src/components/SomeComponent.tsx
  --> Vite dev server / build
  --> @vitejs/plugin-react processes file through Babel
  --> babel.plugins includes [lib/babel-signals-transformer/index.js, {}]
  --> Transformer visitor fires on FunctionDeclaration|ArrowFunctionExpression|FunctionExpression
  --> Checks: name starts with uppercase (PascalCase) AND body contains JSX
  --> If both true: injects useSignals() call at top of function body
  --> Adds import { useSignals } from '../hooks/useSignals' (relative, computed at build time)
  --> Logs: [signals-transform] TRANSFORMING "SomeComponent" in components/SomeComponent.tsx

Output (what the bundler sees, not what the developer writes):
  import { useSignals as useSignals_1 } from '../hooks/useSignals'
  export function SomeComponent() {
    useSignals_1()
    // original body
  }
```

### Test-time: Vitest pipeline (NO transformer)

```
src/**/*.test.ts(x)
  --> Vitest (reads vitest.config.ts)
  --> @vitejs/plugin-react WITHOUT babel-signals-transformer (not in vitest.config.ts plugins)
  --> vitest.setup.ts runs before each test file:
      vi.mock('@preact/signals-react/runtime', () => ({ useSignals: vi.fn() }))
      import '@testing-library/jest-dom'
  --> Test file imports component; component imports useSignals from src/hooks/useSignals.ts
  --> src/hooks/useSignals.ts calls @preact/signals-react/runtime's useSignals (mocked)
  --> No crash; tests run normally
```

### Runtime: Signal reactivity flow

```
signal declared in owning model: const _count = signal(0)
  --> Component reads _count.value inside JSX
  --> @preact/signals-react runtime (via useSignals()) tracks the read
  --> On signal update: _count.value = 1
  --> Only components subscribed to _count re-render
  --> Sibling components that do not read _count are NOT re-rendered
```

---

## 5. Acceptance criteria

1. `npm run dev` starts the Vite dev server on port 5173 with hot module replacement; editing `src/App.tsx` updates the browser without a full page reload.
2. `npm run build` produces a clean `dist/` folder with zero TypeScript errors and no build warnings.
3. `npx tsc --noEmit` reports zero errors.
4. `npm run test` runs Vitest and passes with zero failures.
5. Opening `http://localhost:5173` shows a placeholder page containing a click counter; clicking the increment button increases the count displayed (confirms signals are reactive in the browser).
6. The Vite dev server console logs `[signals-transform] TRANSFORMING "App"` when `src/App.tsx` is first loaded, confirming the babel-signals-transformer is wired.
7. Toggling dark mode on the placeholder page causes the `--primary`, `--muted-foreground`, `--border`, and `--background` CSS variables to switch values (confirm with browser DevTools Computed panel).
8. `npm run test` does not throw `"useSignals is not a function"` or any `@preact/signals-react/runtime` import error (confirms the vitest.setup.ts mock is effective).
9. `npm run lint` (or `npx eslint src/`) completes with zero errors on the initial src/ files.
10. `lib/babel-signals-transformer/index.js` (already in the repo) is referenced correctly by `vite.config.ts` - the `path.resolve(__dirname, './lib/babel-signals-transformer/index.js')` path resolves to an existing file.

---

## 6. Out of scope

- Mock data generators and MSW handlers (WP-02).
- Any chart or visualization components (WP-03).
- Dashboard layout shell, filter bar, or section navigation (WP-04).
- TanStack Query client provider setup (WP-04).
- Individual shadcn/ui component installation (`npx shadcn add button`, etc.) - installed per-WP as first needed.
- Any KPI business logic or formula implementations (WP-05 onward).

---

## Test plan

| File | What it tests |
|------|---------------|
| `src/hooks/useSignals.test.ts` (new) | `useSignals` is callable; the mocked `@preact/signals-react/runtime` `useSignals` is called exactly once when `useSignals()` is invoked |
| `src/hooks/useDeepComputed.test.ts` (new) | Returns a `ReadonlySignal`; does not re-notify when fn returns structurally identical object (deep-equal suppression); does notify when value changes |
