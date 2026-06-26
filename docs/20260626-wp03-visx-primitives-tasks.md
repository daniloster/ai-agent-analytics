# TASKS: WP-03 - Visx Primitive Layer

**SPEC:** `docs/20260626-wp03-visx-primitives-spec.md`
**Date:** 2026-06-26

---

## T-1: Shared chart types + `useChartTokens` hook

**Context**

Implements the type definitions from SPEC section 2 and the `useChartTokens` hook from SPEC section 3 (primitive layer). This task is first because every other task imports from `src/types/charts.ts` or from `src/components/charts/primitives/useChartTokens.ts`. All subsequent tasks depend on these types compiling correctly before any component is written.

Per ARCHITECTURE.md §2.1 shared types live in `src/types/`. Types that are used by more than one file in the chart system (`AxisConfig`, `ActivePoint`, `AnyD3Scale`) go in `src/types/charts.ts`. Types owned by a single module stay in that module.

`useChartTokens` reads CSS custom properties from `document.documentElement` at render time using `getComputedStyle`. It returns `ChartTokens` with all 9 color tokens defined in the SPEC.

**Requirements**

1. Create `src/types/charts.ts` exporting `AxisConfig`, `ActivePoint`, and `AnyD3Scale` as defined in SPEC section 2. These are the only types used by more than two chart modules.
2. `AxisConfig` must include all fields from SPEC section 2: `id`, `type` (`'time' | 'linear' | 'band'`), `position`, `accessor`, `domain`, `label`, `tickFormat`, `numTicks`, `hidden`.
3. `ActivePoint` must include all fields from SPEC section 2: `series`, `axis`, `datum`, `x`, `y`.
4. `AnyD3Scale` must be a union of D3 scale types that covers all three `AxisConfig.type` values: `ScaleLinear<number, number>`, `ScaleBand<string>`, `ScaleTime<number, number>`. Import these types from `'d3-scale'` (available as a transitive dependency of `@visx/scale`).
5. Create `src/types/charts.test.ts` that imports all three exported types and performs a type-level assertion that the `AxisConfig` shape matches the SPEC (use `satisfies` or a type-narrowing assertion to confirm required fields exist).
6. Create `src/components/charts/primitives/useChartTokens.ts` exporting `function useChartTokens(): ChartTokens` and the `ChartTokens` interface (co-located - only used in this file and imported by `VisualizationContext.ts`).
7. `useChartTokens` must read CSS custom properties (`--primary`, `--secondary`, `--muted-foreground`, `--border`, `--background`, `--destructive`) from `getComputedStyle(document.documentElement).getPropertyValue()` wrapped in `hsl(var(--...))` strings. `success` and `warning` must be hardcoded hex strings (`'#22c55e'` and `'#f59e0b'`) per SPEC.
8. `useChartTokens` must return an object with exactly the 9 keys defined in `ChartTokens`: `primary`, `primaryFaded`, `secondary`, `muted`, `border`, `background`, `destructive`, `success`, `warning`.
9. Create `src/components/charts/primitives/useChartTokens.test.ts` covering all scenarios in the Test Plan.
10. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- `d3-scale` is a transitive dependency of `@visx/scale` (already in `node_modules`); no `npm install` needed.
- `@types/d3-scale` is also a transitive dep and available in `node_modules/@types/d3-scale`. Import types from `'d3-scale'` - TypeScript will resolve them.
- `ChartTokens` is co-located in `useChartTokens.ts` rather than `src/types/charts.ts` because it is only imported by `VisualizationContext.ts`. Per ARCHITECTURE.md, types co-locate with the module that owns them; `src/types/` is only for types shared by more than one chart module.
- `getComputedStyle` in JSDOM returns empty strings for custom properties unless explicitly set. Mock `getComputedStyle` in the test rather than fighting JSDOM limitations.
- `useChartTokens` is a pure hook with no signals or side effects. No `useEffect`, no memoization beyond normal React render cycle.
- Do not call `document.documentElement.style.setProperty` in the hook - read only.

**Design**

```ts
// src/types/charts.ts  (new file)

import type { ScaleLinear, ScaleBand, ScaleTime } from 'd3-scale'

export type AnyD3Scale =
  | ScaleLinear<number, number>
  | ScaleBand<string>
  | ScaleTime<number, number>

export interface AxisConfig {
  id: string
  type: 'time' | 'linear' | 'band'
  position: 'bottom' | 'left' | 'right'
  accessor: (d: Record<string, unknown>) => number | string | Date
  domain?: [number, number] | 'auto'
  label?: string
  tickFormat?: (v: unknown) => string
  numTicks?: number
  hidden?: boolean
}

export interface ActivePoint {
  series: string
  axis: string
  datum: Record<string, unknown>
  x: number
  y: number
}
```

```ts
// src/components/charts/primitives/useChartTokens.ts  (new file)

export interface ChartTokens {
  primary: string
  primaryFaded: string
  secondary: string
  muted: string
  border: string
  background: string
  destructive: string
  success: string    // '#22c55e'
  warning: string    // '#f59e0b'
}

export function useChartTokens(): ChartTokens {
  // read CSS custom properties from getComputedStyle(document.documentElement)
  // wrap in 'hsl(var(--...))' strings
  // success and warning are hardcoded hex
}
```

**Acceptance criteria**

1. `import type { AxisConfig, ActivePoint, AnyD3Scale } from '../types/charts'` compiles without error from any file in `src/components/charts/`.
2. A value typed as `AxisConfig` with `type: 'time'` and all required fields passes `tsc --noEmit` without error.
3. `useChartTokens()` returns an object with exactly 9 keys matching the `ChartTokens` interface.
4. All 9 values are strings; `success === '#22c55e'`; `warning === '#f59e0b'`.
5. The 7 non-hardcoded tokens contain the substring `'hsl(var(--'` (verifiable by mocking `getComputedStyle` to return a known value and asserting the full string).
6. `npx tsc --noEmit` reports zero errors after this task.

**Test Plan**

- `src/types/charts.test.ts` (new)
  - Scenario: Type-level check - a value that satisfies `AxisConfig` with all required fields compiles (use a `const x: AxisConfig = {...}` assertion).
  - Scenario: `ActivePoint` has all 5 required fields at the type level.

- `src/components/charts/primitives/useChartTokens.test.ts` (new)
  - Scenario: Returns an object with exactly 9 keys.
  - Scenario: `success` is `'#22c55e'` and `warning` is `'#f59e0b'`.
  - Scenario: `primary` contains `'hsl(var(--primary))'` after mocking `getComputedStyle` to return the correct CSS property value. Use `vi.spyOn(window, 'getComputedStyle')` and return a fake `CSSStyleDeclaration` with `getPropertyValue` returning `' --primary'`.
  - Scenario: All non-hardcoded tokens contain the substring `'hsl(var(--'`.

**Files**

- `src/types/charts.ts` (new) - `AnyD3Scale`, `AxisConfig`, `ActivePoint` shared types
- `src/types/charts.test.ts` (new) - type-level assertions
- `src/components/charts/primitives/useChartTokens.ts` (new) - `ChartTokens` interface + hook
- `src/components/charts/primitives/useChartTokens.test.ts` (new) - token reading tests

---

## T-2: D3 scale helper utilities

**Context**

Implements `src/components/charts/primitives/scales.ts` from SPEC section 3 (primitive layer). This utility creates D3 scales from `AxisConfig` descriptors. `Visualization` (T-5) calls `buildScale(config, data, innerWidth, innerHeight)` for each axis in its `axes` prop. The scale utilities must exist before `Visualization` can be written.

SPEC test plan includes `src/components/charts/primitives/scales.test.ts` testing `scaleLinear`, `scaleBand`, and `scaleTime` outputs. These are pure functions with no React/signal dependencies - test them directly.

Read `src/types/charts.ts` (from T-1) before starting. Read `node_modules/@visx/scale/lib/index.d.ts` to understand the function signatures for `scaleLinear`, `scaleBand`, `scaleTime` from `@visx/scale`.

**Requirements**

1. Create `src/components/charts/primitives/scales.ts` exporting `function buildScale(config: AxisConfig, data: Record<string, unknown>[], innerWidth: number, innerHeight: number): AnyD3Scale`.
2. `buildScale` must return a `ScaleLinear<number, number>` when `config.type === 'linear'`, a `ScaleBand<string>` when `config.type === 'band'`, and a `ScaleTime<number, number>` when `config.type === 'time'`.
3. When `config.domain === 'auto'` or `config.domain` is absent, the domain must be computed from `data` by mapping `config.accessor` over all elements and finding `[min, max]` for `linear` and `time` types, or the distinct string values for `band` type.
4. When `config.domain` is a `[number, number]` tuple, that tuple must be used directly as the scale domain (no computation from data).
5. The range for `position: 'bottom'` axes must be `[0, innerWidth]`. The range for `position: 'left'` and `position: 'right'` axes must be `[innerHeight, 0]` (SVG coordinate flip so higher values render higher on screen).
6. `scaleBand` must set `padding(0.2)` for bar chart readability.
7. When `data` is empty and `domain` is `'auto'`, `buildScale` must return a sensible fallback scale (e.g. `scaleLinear` with domain `[0, 1]`) without throwing.
8. Create `src/components/charts/primitives/scales.test.ts` covering all scenarios in the Test Plan.
9. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- Import `scaleLinear`, `scaleBand`, `scaleTime` from `@visx/scale` (not directly from `d3-scale`). The visx wrappers accept the same arguments and return d3 scale instances typed as the d3 types.
- For `auto` domain on `linear` and `time` types, use `Math.min(...values)` and `Math.max(...values)`. This is safe for the data sizes expected (< 400 points per chart). No need for `d3-array`'s `extent`.
- For `band` type `auto` domain, cast accessor results to `string` and deduplicate with `[...new Set(values)]`.
- The SPEC says marks will access scales via `scales[axisId]` from context. Marks are responsible for casting `AnyD3Scale` to the correct specific type when calling it.
- `d3-scale`'s `ScaleTime` domain type is `[Date, Date]`. When `config.accessor` returns numbers (epoch ms) for a time axis, cast them to `Date` before passing to the scale domain.

**Design**

```ts
// src/components/charts/primitives/scales.ts  (new file)

import { scaleLinear, scaleBand, scaleTime } from '@visx/scale'
import type { AnyD3Scale, AxisConfig } from '../../../types/charts'

export function buildScale(
  config: AxisConfig,
  data: Record<string, unknown>[],
  innerWidth: number,
  innerHeight: number,
): AnyD3Scale {
  // compute range based on config.position
  // compute domain from config.domain or accessor(data)
  // construct and return the appropriate d3 scale
}
```

**Acceptance criteria**

1. `buildScale({ id: 'y', type: 'linear', position: 'left', accessor: d => d.v as number, domain: [0, 100] }, [], 400, 200)` returns a scale where `scale(50) === 100` (maps 50% of domain to 50% of range, which is `[200,0]` flipped so 50 -> 100).
2. `buildScale({ id: 'x', type: 'band', position: 'bottom', accessor: d => d.k as string }, [{k:'a'},{k:'b'},{k:'c'}], 300, 200).bandwidth()` returns a positive number greater than 0.
3. `buildScale({ id: 't', type: 'time', position: 'bottom', accessor: d => new Date(d.date as string) }, [{date:'2026-01-01'},{date:'2026-01-31'}], 310, 200)` returns a scale where `scale(new Date('2026-01-01')) === 0` (start of range).
4. `buildScale` with empty `data` and `domain: 'auto'` does not throw.
5. `npx tsc --noEmit` reports zero errors after this task.

**Test Plan**

- `src/components/charts/primitives/scales.test.ts` (new)
  - Scenario: `scaleLinear` with explicit domain `[0, 100]` maps `50` to `100` (range `[200, 0]`, left position).
  - Scenario: `scaleBand` auto-domain from data produces `bandwidth() > 0` for 3-item dataset.
  - Scenario: `scaleTime` maps first date to `0` (start of range) when `domain: 'auto'`.
  - Scenario: `auto` domain on `linear` type uses the min/max of accessor values across all data points.
  - Scenario: Empty data + `auto` domain returns a scale without throwing.

**Files**

- `src/components/charts/primitives/scales.ts` (new) - `buildScale` function
- `src/components/charts/primitives/scales.test.ts` (new) - scale mapping assertions

---

## T-3: Primitive UI wrappers - `ChartSVG`, `Axis`, `Grid`

**Context**

Implements the three internal primitive components from SPEC section 3 (primitive layer): `ChartSVG`, `Axis`, and `Grid`. These are thin wrappers over `@visx/responsive`, `@visx/axis`, and `@visx/grid` respectively. `Visualization` (T-5) imports all three. These primitives are never imported directly by mark or overlay components (they are internal to the chart system).

Read `src/components/charts/primitives/useChartTokens.ts` (from T-1) before writing `Axis` and `Grid` since they apply `tokens.muted` and `tokens.border` respectively.

**Requirements**

1. Create `src/components/charts/primitives/ChartSVG.tsx` exporting `function ChartSVG(props: ChartSVGProps): JSX.Element`. The component must wrap `@visx/responsive` `ParentSize` and pass `(innerWidth, innerHeight)` to a render-prop `children` callback.
2. `ChartSVG` must apply `min-h-[200px]` as a Tailwind class on the outer div that wraps `ParentSize`. This guards against `ParentSize`'s zero-width first-paint (see SPEC assumptions).
3. `ChartSVG` must accept an optional `height?: number` prop. When provided, it must override the height from `ParentSize` (pass `height` to `ParentSize`'s `style` and to the `innerHeight` argument of the render prop).
4. `ChartSVG` must accept `className?: string` and merge it onto the outer div.
5. Create `src/components/charts/primitives/Axis.tsx` exporting named `function` declarations `AxisBottom`, `AxisLeft`, `AxisRight`. Each wraps the corresponding `@visx/axis` component and applies `ChartTokens.muted` as the tick label fill color.
6. `Axis` components must accept `scale`, `top`, `left`, `tickFormat`, `numTicks`, `label` as props. Pass them through to the underlying `@visx/axis` component without transformation.
7. Create `src/components/charts/primitives/Grid.tsx` exporting named `function` declarations `GridRows` and `GridColumns`. Each wraps the corresponding `@visx/grid` component and applies `ChartTokens.border` as the stroke color.
8. All three components must use `function ComponentName(` declaration style per ARCHITECTURE.md §4.3. No arrow-function component definitions.
9. Create test files for all three components covering all scenarios in the Test Plan.
10. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- `@visx/responsive`'s `ParentSize` fires `ResizeObserver` asynchronously. In tests, mock `ResizeObserver` or use a wrapper that passes static width/height. The simplest approach: in `ChartSVG.test.tsx`, mock `ParentSize` from `@visx/responsive` to synchronously call its render-prop children with fixed dimensions `(400, 300)`.
- `ChartSVG.test.tsx` does NOT test responsive behavior - it verifies the DOM structure (`min-h-[200px]` class, children render-prop is called).
- `Axis.tsx` and `Grid.tsx` tests verify prop forwarding. Mock the underlying `@visx/axis` and `@visx/grid` components with `vi.mock()` and assert the mock was called with expected props.
- `ChartTokens` in `Axis` and `Grid` - these primitives accept `tokens: ChartTokens` as a prop (passed from `Visualization`). They do NOT call `useChartTokens()` themselves, since `Visualization` owns token computation and passes them down.
- `ChartSVGProps` type co-locates in `ChartSVG.tsx`. `AxisProps` and `GridProps` co-locate in their files.

**Design**

```ts
// src/components/charts/primitives/ChartSVG.tsx  (new file)

import type { ChartTokens } from './useChartTokens'

interface ChartSVGProps {
  height?: number
  className?: string
  children: (innerWidth: number, innerHeight: number) => React.ReactNode
}

export function ChartSVG({ height, className, children }: ChartSVGProps): JSX.Element {
  // ParentSize wrapper with min-h-[200px] on outer div
  // if height prop provided, override ParentSize's height measurement
}
```

```ts
// src/components/charts/primitives/Axis.tsx  (new file)

import type { ChartTokens } from './useChartTokens'
import type { AnyD3Scale } from '../../../types/charts'

interface AxisProps {
  scale: AnyD3Scale
  top?: number
  left?: number
  tickFormat?: (v: unknown) => string
  numTicks?: number
  label?: string
  tokens: ChartTokens
}

export function AxisBottom(props: AxisProps): JSX.Element
export function AxisLeft(props: AxisProps): JSX.Element
export function AxisRight(props: AxisProps): JSX.Element
```

```ts
// src/components/charts/primitives/Grid.tsx  (new file)

import type { AnyD3Scale } from '../../../types/charts'
import type { ChartTokens } from './useChartTokens'

interface GridProps {
  scale: AnyD3Scale
  width: number
  height: number
  numTicks?: number
  tokens: ChartTokens
}

export function GridRows(props: GridProps): JSX.Element
export function GridColumns(props: GridProps): JSX.Element
```

**Acceptance criteria**

1. `<ChartSVG>{(w, h) => <svg width={w} height={h} />}</ChartSVG>` renders a div with class `min-h-[200px]` wrapping an SVG.
2. `<ChartSVG height={80}>...</ChartSVG>` - the render-prop `h` argument equals `80`.
3. `<AxisBottom scale={...} tokens={tokens} />` renders an SVG axis element; tick labels use `tokens.muted` as fill.
4. `<GridRows scale={...} width={400} height={200} tokens={tokens} />` renders horizontal grid lines with `tokens.border` stroke.
5. `npx tsc --noEmit` reports zero errors after this task.

**Test Plan**

- `src/components/charts/primitives/ChartSVG.test.tsx` (new)
  - Scenario: Outer div has class `min-h-[200px]`.
  - Scenario: `height={80}` prop causes the render-prop to receive `80` as the height argument. Mock `ParentSize` to synchronously call children with `(400, 0)` then verify the override.
  - Scenario: `className` prop is merged onto the outer div.

- `src/components/charts/primitives/Axis.test.tsx` (new)
  - Scenario: `AxisBottom` renders without throwing when given a valid scale and tokens.
  - Scenario: `AxisLeft` renders without throwing.
  - Scenario: `tokens.muted` is forwarded to the underlying `@visx/axis` component as the tick fill color. Mock `@visx/axis` with `vi.mock('@visx/axis', () => ({ AxisBottom: vi.fn(() => null), ... }))` and assert the mock was called with `tickLabelProps` or `stroke` matching `tokens.muted`.

- `src/components/charts/primitives/Grid.test.tsx` (new)
  - Scenario: `GridRows` renders without throwing given valid scale and dimensions.
  - Scenario: `tokens.border` is forwarded as stroke to the underlying `@visx/grid` component.

**Files**

- `src/components/charts/primitives/ChartSVG.tsx` (new) - `ParentSize` wrapper with `min-h-[200px]`
- `src/components/charts/primitives/ChartSVG.test.tsx` (new) - DOM structure and height override tests
- `src/components/charts/primitives/Axis.tsx` (new) - `AxisBottom`, `AxisLeft`, `AxisRight` wrappers
- `src/components/charts/primitives/Axis.test.tsx` (new) - prop-forwarding tests
- `src/components/charts/primitives/Grid.tsx` (new) - `GridRows`, `GridColumns` wrappers
- `src/components/charts/primitives/Grid.test.tsx` (new) - prop-forwarding tests

---

## T-4: `VisualizationContext`

**Context**

Implements `src/components/charts/VisualizationContext.ts` from SPEC section 3 (Visualization root layer). This is the React context that carries all shared state from `<Visualization>` to mark and overlay children. `useVisualizationContext()` must throw a descriptive error when called outside a `<Visualization>` tree (SPEC acceptance criterion 10).

All mark and overlay tests (T-6 through T-12) will need to provide a mock `VisualizationContext.Provider` value. This task also creates `src/components/charts/test-utils.tsx` - a test-only helper that wraps a component under test in a `VisualizationContext.Provider` with configurable mock values. This avoids boilerplate in every mark test.

Read `src/types/charts.ts` (T-1) and `src/components/charts/primitives/useChartTokens.ts` (T-1) before starting.

**Requirements**

1. Create `src/components/charts/VisualizationContext.ts` that creates a React context with default value `null`.
2. Export `VisualizationContextValue` interface from this file with all fields from SPEC section 2: `dataSignal`, `innerWidth`, `innerHeight`, `tokens`, `scales`, `baseScale`, `activePoint`, `mousePosition`.
3. `activePoint` in the context must be typed as `Signal<ActivePoint | null>` (writable signal, not `ReadonlySignal`) because mark components must be able to write to it.
4. `mousePosition` in the context must be typed as `Signal<{ x: number; y: number } | null>` (writable signal).
5. Export `function useVisualizationContext(): VisualizationContextValue` - this hook reads from the context and throws an error with the message `'useVisualizationContext must be called inside a <Visualization> component'` when the context value is `null`.
6. Create `src/components/charts/test-utils.tsx` exporting `function renderWithVisualizationContext(ui: React.ReactElement, contextValue?: Partial<VisualizationContextValue>): ReturnType<typeof render>`. This helper merges the provided partial context value with a default mock context, wraps `ui` in `VisualizationContext.Provider`, and calls `render()` from `@testing-library/react`. It is imported only by test files.
7. Create `src/components/charts/VisualizationContext.test.ts` covering all scenarios in the Test Plan.
8. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- Import `Signal` from `@preact/signals-react` for the signal types. The `Signal` (mutable) vs `ReadonlySignal` distinction matters: marks must write `activePoint.value = ...`; consumers outside context only read it.
- The test-utils file is a shared test helper, not a production source file. Its function is only imported by `*.test.tsx` files. This file does NOT need its own test file per ARCHITECTURE.md §5.1 because it has no runtime behavior to test - it is a test setup utility.
- `VisualizationContextValue.dataSignal` is typed `ReadonlySignal<Record<string, unknown>[]>` (marks only read it).
- `scales` is `Record<string, AnyD3Scale>` - an empty object `{}` is a valid default for the mock context (marks that access `scales[axis]` will need to provide it in their test context override).
- `baseScale: AnyD3Scale | null` - default to `null` in mock context.
- Do not put `VisualizationContextValue` in `src/types/charts.ts` - it is owned by `VisualizationContext.ts` (only one consumer: `Visualization.tsx` and `useVisualizationContext()`).

**Design**

```ts
// src/components/charts/VisualizationContext.ts  (new file)

import { createContext, useContext } from 'react'
import type { ReadonlySignal, Signal } from '@preact/signals-react'
import type { ActivePoint, AnyD3Scale } from '../../types/charts'
import type { ChartTokens } from './primitives/useChartTokens'

export interface VisualizationContextValue {
  dataSignal: ReadonlySignal<Record<string, unknown>[]>
  innerWidth: number
  innerHeight: number
  tokens: ChartTokens
  scales: Record<string, AnyD3Scale>
  baseScale: AnyD3Scale | null
  activePoint: Signal<ActivePoint | null>
  mousePosition: Signal<{ x: number; y: number } | null>
}

export const VisualizationContext = createContext<VisualizationContextValue | null>(null)

export function useVisualizationContext(): VisualizationContextValue {
  // read context, throw descriptive error if null
}
```

```ts
// src/components/charts/test-utils.tsx  (new file - test helper only)

import { render } from '@testing-library/react'
import { signal } from '@preact/signals-react'
import { VisualizationContext } from './VisualizationContext'
import type { VisualizationContextValue } from './VisualizationContext'

const DEFAULT_MOCK_CONTEXT: VisualizationContextValue = {
  dataSignal: signal([]),
  innerWidth: 400,
  innerHeight: 200,
  tokens: { primary: 'hsl(var(--primary))', primaryFaded: 'hsl(var(--primary) / 0.2)', secondary: 'hsl(var(--secondary))', muted: 'hsl(var(--muted-foreground))', border: 'hsl(var(--border))', background: 'hsl(var(--background))', destructive: 'hsl(var(--destructive))', success: '#22c55e', warning: '#f59e0b' },
  scales: {},
  baseScale: null,
  activePoint: signal(null),
  mousePosition: signal(null),
}

export function renderWithVisualizationContext(
  ui: React.ReactElement,
  contextValue?: Partial<VisualizationContextValue>,
): ReturnType<typeof render> {
  // merge DEFAULT_MOCK_CONTEXT with contextValue, wrap in Provider
}
```

**Acceptance criteria**

1. `useVisualizationContext()` called inside a `<VisualizationContext.Provider value={mockValue}>` tree returns the provided value without throwing.
2. `useVisualizationContext()` called outside any provider throws with the message `'useVisualizationContext must be called inside a <Visualization> component'`.
3. `VisualizationContextValue` has all 8 fields from the SPEC; `activePoint` and `mousePosition` are `Signal<...>` (not `ReadonlySignal`).
4. `renderWithVisualizationContext(<MyComponent />)` (from test-utils) renders without throwing when `MyComponent` calls `useVisualizationContext()`.
5. `npx tsc --noEmit` reports zero errors after this task.

**Test Plan**

- `src/components/charts/VisualizationContext.test.ts` (new)
  - Scenario: Hook inside provider returns the provided context value.
  - Scenario: Hook outside provider throws with the exact error message `'useVisualizationContext must be called inside a <Visualization> component'`.
  - Scenario: `renderWithVisualizationContext` from test-utils renders a component that uses `useVisualizationContext()` without throwing.

**Files**

- `src/components/charts/VisualizationContext.ts` (new) - context definition + `useVisualizationContext` hook
- `src/components/charts/VisualizationContext.test.ts` (new) - throw behavior + context value tests
- `src/components/charts/test-utils.tsx` (new) - test-only render helper; no test file needed

---

## T-5: `Visualization` root component

**Context**

Implements `src/components/charts/Visualization.tsx` from SPEC section 3 (Visualization root). This is the most complex component in WP-03. It owns: D3 scale computation (using `buildScale` from T-2), `ChartSVG` mounting (T-3), signal creation for `activePoint` and `mousePosition`, SVG pointer event handling including bisect nearest-point logic, and `VisualizationContext` provision.

Read ALL of the following before writing any code:
- `src/types/charts.ts` (T-1) for `AxisConfig`, `ActivePoint`, `AnyD3Scale`
- `src/components/charts/primitives/scales.ts` (T-2) for `buildScale`
- `src/components/charts/primitives/ChartSVG.tsx` (T-3) for `ChartSVG`
- `src/components/charts/primitives/Axis.tsx` (T-3) for `AxisBottom`, `AxisLeft`, `AxisRight`
- `src/components/charts/primitives/Grid.tsx` (T-3) for `GridRows`, `GridColumns`
- `src/components/charts/primitives/useChartTokens.ts` (T-1) for `useChartTokens`
- `src/components/charts/VisualizationContext.ts` (T-4) for `VisualizationContextValue` and `VisualizationContext`

**Requirements**

1. Create `src/components/charts/Visualization.tsx` exporting `function Visualization<TData extends Record<string, unknown>>(props: VisualizationProps<TData>): JSX.Element`. Co-locate the `VisualizationProps` interface in this file.
2. `Visualization` must call `useChartTokens()` internally. No `tokens` prop is exposed to consumers.
3. `Visualization` must create `activePoint` and `mousePosition` signals using `useSignal` from `@preact/signals-react`. These signals are local to the component lifecycle.
4. `Visualization` must resolve the `axes` prop: if `axes` is a function, call `axes(data.value)` to produce `AxisConfig[]`; if it is an array, use it directly. Recompute when `data.value` changes (use `useDeepComputed` to memoize the resolved axes array).
5. `Visualization` must call `buildScale(axisConfig, data.value, innerWidth, innerHeight)` for each resolved axis config and build `scales: Record<string, AnyD3Scale>`. Recompute scales when data, axes, innerWidth, or innerHeight change.
6. `baseScale` must be the scale whose `AxisConfig.position === 'bottom'`, or `null` if none exists.
7. `Visualization` must register an SVG `onPointerMove` handler that: calls `localPoint(svgRef.current, event)` from `@visx/event` to get SVG-local coordinates; updates `mousePosition.value`; when `baseScale` is not null, calls `baseScale.invert(x)` to find the domain value at `x`, then uses `bisectCenter` from `d3-array` to find the nearest datum index, and updates `activePoint.value` with the nearest datum.
8. `Visualization` must register an SVG `onPointerLeave` handler that sets both `activePoint.value = null` and `mousePosition.value = null`.
9. `Visualization` must render `AxisBottom`, `AxisLeft`, or `AxisRight` (from `Axis.tsx`) for each axis where `config.hidden !== true`.
10. `Visualization` must render `GridRows` for `position: 'left'` axes and `GridColumns` for `position: 'bottom'` axes (when not hidden).
11. `Visualization` must provide `VisualizationContext.Provider` wrapping its children with the full `VisualizationContextValue` including computed `scales`, `baseScale`, `tokens`, `innerWidth`, `innerHeight`, `dataSignal` (the raw signal, not `.value`), `activePoint`, and `mousePosition`.
12. `Visualization` must render children inside `<Group left={margin.left} top={margin.top}>`. Use a default margin of `{ top: 10, right: 20, bottom: 40, left: 50 }`. When all axes are `hidden: true`, reduce the margin to `{ top: 0, right: 0, bottom: 0, left: 0 }`.
13. Every mark component must return `null` when `innerWidth === 0` - this is enforced by the marks themselves (T-6 through T-10), not by `Visualization`. However `Visualization` must still provide a valid context even when `innerWidth === 0` so marks can read context without errors.
14. Create `src/components/charts/Visualization.test.tsx` covering all scenarios in the Test Plan.
15. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- Use `useSignal` from `@preact/signals-react` (not `signal()` at module scope) for `activePoint` and `mousePosition` - these must be per-instance signals tied to the component lifecycle.
- `useDeepComputed` for scales and resolved axes (they are objects/arrays; reference equality would cause unnecessary re-renders on every data update).
- `bisectCenter` from `d3-array`: `import { bisectCenter } from 'd3-array'`. For a time scale, `baseScale.invert(x)` returns a `Date`; cast data dates to the same type before bisecting. For a linear scale, `baseScale.invert(x)` returns a number.
- `svgRef = useRef<SVGSVGElement>(null)` - pass to the `<svg ref={svgRef}>`. `localPoint` from `@visx/event` requires the SVG element.
- Margin computation: check `resolvedAxes.every(a => a.hidden)` - if all hidden, use zero margin. Otherwise use `{ top: 10, right: 20, bottom: 40, left: 50 }`. Expose margin as a const inside the file (not a prop).
- `innerWidth` and `innerHeight` used in context are the values AFTER subtracting margin (i.e. the drawable area). The ChartSVG render-prop provides the full dimensions; subtract margin before storing in context.
- `ScaleBand` does not have an `.invert()` method (categorical axis). The bisect logic only runs when `baseScale` is a scale with `.invert()` (i.e. `type: 'time'` or `type: 'linear'`). Guard with `'invert' in baseScale` before calling.
- In tests, mock `@visx/event` with `vi.mock('@visx/event', () => ({ localPoint: vi.fn(() => ({ x: 50, y: 100 })) }))`. Mock `ResizeObserver` if `ChartSVG` is not mocked.

**Design**

```tsx
// src/components/charts/Visualization.tsx  (new file)

import { useSignal } from '@preact/signals-react'
import type { ReadonlySignal } from '@preact/signals-react'
import { useRef } from 'react'
import { localPoint } from '@visx/event'
import { bisectCenter } from 'd3-array'
import { Group } from '@visx/group'
import type { AxisConfig, ActivePoint } from '../../types/charts'
import { buildScale } from './primitives/scales'
import { useChartTokens } from './primitives/useChartTokens'
import { ChartSVG } from './primitives/ChartSVG'
import { AxisBottom, AxisLeft, AxisRight } from './primitives/Axis'
import { GridRows, GridColumns } from './primitives/Grid'
import { VisualizationContext } from './VisualizationContext'
import { useDeepComputed } from '../../hooks/useDeepComputed'

export interface VisualizationProps<TData extends Record<string, unknown>> {
  data: ReadonlySignal<TData[]>
  axes: AxisConfig[] | ((data: TData[]) => AxisConfig[])
  height?: number
  className?: string
  ariaLabel?: string
  children: React.ReactNode
}

export function Visualization<TData extends Record<string, unknown>>(
  props: VisualizationProps<TData>,
): JSX.Element {
  // 1. tokens = useChartTokens()
  // 2. activePoint = useSignal<ActivePoint | null>(null)
  // 3. mousePosition = useSignal<{x:number;y:number}|null>(null)
  // 4. svgRef = useRef<SVGSVGElement>(null)
  // 5. resolvedAxes = useDeepComputed(() => axes is function ? axes(data.value) : axes)
  // 6. ChartSVG render prop -> (fullWidth, fullHeight) -> compute margin, innerWidth, innerHeight
  // 7. scales = useDeepComputed(() => buildScale per axis)
  // 8. baseScale = resolvedAxes.find(a => a.position === 'bottom')
  // 9. provide VisualizationContext.Provider
  // 10. SVG with onPointerMove + onPointerLeave handlers
  // 11. render non-hidden axes and grids, then children inside Group
}
```

**Acceptance criteria**

1. `<Visualization data={signal} axes={[{id:'y',type:'linear',position:'left',accessor:d=>d.v as number}]}><div data-testid="child" /></Visualization>` renders a descendant with `data-testid="child"` - children are passed through.
2. `axes` as a function: the function receives `data.value` array; returning `[{id:'x', type:'time', ...}]` causes a scale keyed `'x'` to exist in context.
3. `mousePosition.value` is updated to `{ x: 50, y: 100 }` when the SVG fires a `pointerMove` event (verify by mocking `localPoint` and asserting signal value).
4. `activePoint.value` is `null` after the SVG fires a `pointerLeave` event.
5. With a linear base scale and data `[{v:0},{v:50},{v:100}]`, pointer at midpoint between datum[0] and datum[1] sets `activePoint.value.datum` to the nearer datum (bisect behavior).
6. All `hidden: true` axes produce zero margin (children `Group` has `left={0}` and `top={0}`).
7. `<Visualization>` wrapping div has class `min-h-[200px]` (inherited from `ChartSVG`).
8. `npx tsc --noEmit` reports zero errors after this task.

**Test Plan**

- `src/components/charts/Visualization.test.tsx` (new)
  - Scenario: Children are rendered inside the Visualization tree (check for test ID).
  - Scenario: `axes` as function receives the current `data.value` array and produces scales.
  - Scenario: `mousePosition` signal updated on SVG `pointermove` (mock `localPoint`).
  - Scenario: `activePoint` set to `null` on SVG `pointerleave`.
  - Scenario: Bisect nearest-point: pointer at `x=25` between datum at pixel `0` and datum at pixel `50` sets `activePoint.datum` to datum[0] (nearer). Use a linear scale and mock `localPoint` to return `{x:25}`.
  - Scenario: All-hidden axes result in zero-margin `Group` rendering.
  - Scenario: Context provided: child component calling `useVisualizationContext()` receives non-null context with `scales`, `tokens`, `activePoint`.

**Files**

- `src/components/charts/Visualization.tsx` (new) - compound component root
- `src/components/charts/Visualization.test.tsx` (new) - scale, pointer, and context tests

---

## T-6: `Line` mark

**Context**

Implements `src/components/charts/marks/Line.tsx` from SPEC section 3 (mark layer). `Line` is the simplest continuous-series mark: it reads `dataSignal`, `scales`, and `baseScale` from `VisualizationContext` and renders a `LinePath` from `@visx/shape`. It does not write `activePoint` (no hover - that is handled by `Area` which adds circles). `Line` is used when rendering a plain line without the area fill.

Read `src/components/charts/VisualizationContext.ts` (T-4) and `src/components/charts/test-utils.tsx` (T-4) before writing. The test must use `renderWithVisualizationContext` to supply mock scales.

**Requirements**

1. Create `src/components/charts/marks/Line.tsx` exporting `function Line(props: LineProps): JSX.Element | null`. Co-locate the `LineProps` interface in this file.
2. `Line` must call `useVisualizationContext()` to read `dataSignal`, `scales`, `baseScale`, `innerWidth`, and `tokens`.
3. `Line` must return `null` immediately when `innerWidth === 0` (zero-width guard per SPEC assumption).
4. `Line` must render a `LinePath` from `@visx/shape` using `scales[props.axis]` for y-values and `baseScale` for x-values.
5. The `stroke` must default to `tokens.primary` when `props.color` is not provided.
6. `strokeWidth` must default to `2` when not provided.
7. `Line` must read `dataSignal.value` (subscribe via signals runtime) to get the data array and render the path.
8. `Line` must be a named `function` declaration, not an arrow function, per ARCHITECTURE.md §4.3.
9. Create `src/components/charts/marks/Line.test.tsx` covering all scenarios in the Test Plan.
10. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- `LinePath` from `@visx/shape` accepts `data`, `x` (accessor), `y` (accessor), `stroke`, `strokeWidth`. The x accessor calls `baseScale(axisConfig.accessor(datum))` and the y accessor calls `scales[axis](datum[series])`. Since `AnyD3Scale` is a union type, cast to the specific scale type or use a function cast: `(scales[props.axis] as (v: unknown) => number)(datum[props.series])`.
- The `dataSignal` is a `ReadonlySignal` - read `.value` to subscribe. Since this component is inside a `Visualization` tree (which is a React component with signals transform), `useSignals()` is injected automatically. In Vitest the transform does not run - tests that access `.value` directly will work because signals are synchronous.
- In tests, mock `@visx/shape`'s `LinePath` with `vi.mock('@visx/shape', ...)` or use a simple scale mock and verify the SVG path element is rendered. Prefer rendering the real `LinePath` with a controlled linear scale.

**Design**

```tsx
// src/components/charts/marks/Line.tsx  (new file)

import { LinePath } from '@visx/shape'
import { useVisualizationContext } from '../VisualizationContext'

export interface LineProps {
  series: string
  axis: string
  color?: string
  strokeWidth?: number
}

export function Line(props: LineProps): JSX.Element | null {
  const { dataSignal, scales, baseScale, innerWidth, tokens } = useVisualizationContext()
  if (innerWidth === 0) return null
  // render LinePath with data, x, y, stroke, strokeWidth
}
```

**Acceptance criteria**

1. `<Line series="v" axis="y" />` inside `renderWithVisualizationContext` with `innerWidth={400}` and a linear `y` scale renders a `<path>` element in the DOM.
2. `<Line series="v" axis="y" />` with `innerWidth={0}` in context returns `null` - no `<path>` rendered.
3. `<Line series="v" axis="y" color="red" />` renders a path with `stroke="red"`.
4. When no `color` prop, stroke defaults to `tokens.primary` from context.
5. `npx tsc --noEmit` reports zero errors after this task.

**Test Plan**

- `src/components/charts/marks/Line.test.tsx` (new)
  - Scenario: Renders a `<path>` element when `innerWidth > 0` and data is non-empty.
  - Scenario: Returns nothing (no path in DOM) when `innerWidth === 0`.
  - Scenario: `color="red"` produces a path with `stroke="red"`.
  - Scenario: No `color` prop produces stroke equal to `tokens.primary` from mock context.

**Files**

- `src/components/charts/marks/Line.tsx` (new) - `LinePath` wrapper reading from context
- `src/components/charts/marks/Line.test.tsx` (new) - render and zero-width tests

---

## T-7: `Area` mark

**Context**

Implements `src/components/charts/marks/Area.tsx` from SPEC section 3 (mark layer). `Area` is the most interaction-rich continuous-series mark: it renders an `AreaClosed` shape with a `LinearGradient` fill, overlays invisible data-point circles for keyboard/hover focus, and writes `activePoint` signal on pointer and keyboard events. Multiple `<Area>` siblings must produce distinct gradient IDs.

Read `src/components/charts/VisualizationContext.ts` (T-4), `src/components/charts/test-utils.tsx` (T-4), and `src/components/charts/marks/Line.tsx` (T-6) before starting. `Area` follows the same context-reading pattern as `Line` but adds interaction.

**Requirements**

1. Create `src/components/charts/marks/Area.tsx` exporting `function Area(props: AreaProps): JSX.Element | null`. Co-locate `AreaProps` in this file (extends `LineProps` with `fillOpacity?: number`).
2. `Area` must return `null` when `innerWidth === 0`.
3. `Area` must render an `AreaClosed` from `@visx/shape` using the same `x`/`y` accessors as `Line`.
4. `Area` must render a `LinearGradient` from `@visx/gradient` with a unique ID (`area-gradient-${props.series}` is sufficient when series keys are unique per `Visualization` instance) for the fill. The gradient must go from `color` (or `tokens.primary`) at full opacity at the top to `color` at `fillOpacity` (default `0.2`) at the bottom.
5. `Area` must overlay one `<circle>` per data point. Each circle must have `tabIndex={0}`, `role="listitem"`, `aria-label` including the series key and data value, `onPointerEnter`, `onPointerLeave`, `onFocus`, `onBlur`, and `onKeyDown` event handlers.
6. `onPointerEnter` and `onFocus` on a data circle must set `activePoint.value` to an `ActivePoint` object with the correct `series`, `axis`, `datum`, `x` (pixel x via `baseScale`), and `y` (pixel y via `scales[axis]`).
7. `onPointerLeave` and `onBlur` on a data circle must set `activePoint.value = null`.
8. `onKeyDown` must set `activePoint.value` to the same value as `onFocus` when the key is `'Enter'` or `' '` (space); set `activePoint.value = null` when the key is `'Escape'`.
9. Each circle must have `r={4}` (4px radius), `opacity={0}` for visual hiding (keyboard/pointer still works), and `fill={color || tokens.primary}`.
10. Create `src/components/charts/marks/Area.test.tsx` covering all scenarios in the Test Plan.
11. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- `AreaClosed` requires a `yScale` prop (the y scale for closing the area to the baseline). Pass `scales[props.axis]` as `yScale`.
- `LinearGradient` from `@visx/gradient` requires `id`, `from` (top color), `to` (bottom color), `fromOpacity`, `toOpacity`. Render it inside a `<defs>` element and reference it as `fill="url(#area-gradient-${props.series})"` on `AreaClosed`.
- The gradient ID collision problem: the SPEC requires "two `<Area>` siblings produce two gradient defs with distinct IDs." Using `props.series` as part of the ID is sufficient as long as series keys are unique within one `Visualization`. Document this assumption.
- In tests, mock context to provide `activePoint = signal<ActivePoint | null>(null)`. After firing `pointerenter` on a circle, read `activePoint.value` to verify it was set.
- Circles have `opacity={0}` - they are invisible but still receive pointer events and keyboard focus. This is the WCAG keyboard navigation pattern (SPEC section 4 interaction diagram, Path B/C).

**Design**

```tsx
// src/components/charts/marks/Area.tsx  (new file)

import { AreaClosed } from '@visx/shape'
import { LinearGradient } from '@visx/gradient'
import { useVisualizationContext } from '../VisualizationContext'
import type { LineProps } from './Line'

export interface AreaProps extends LineProps {
  fillOpacity?: number
}

export function Area(props: AreaProps): JSX.Element | null {
  const { dataSignal, scales, baseScale, innerWidth, tokens, activePoint } = useVisualizationContext()
  if (innerWidth === 0) return null

  const data = dataSignal.value
  const color = props.color ?? tokens.primary
  const gradientId = `area-gradient-${props.series}`

  return (
    <>
      <defs>
        <LinearGradient id={gradientId} from={color} to={color} fromOpacity={1} toOpacity={props.fillOpacity ?? 0.2} vertical />
      </defs>
      <AreaClosed
        data={data}
        x={/* baseScale(accessor(datum)) */}
        y={/* scales[props.axis](datum[props.series]) */}
        yScale={/* scales[props.axis] */}
        fill={`url(#${gradientId})`}
        stroke={color}
        strokeWidth={props.strokeWidth ?? 2}
      />
      {data.map((datum, i) => (
        <circle
          key={i}
          cx={/* x pixel */}
          cy={/* y pixel */}
          r={4}
          opacity={0}
          fill={color}
          tabIndex={0}
          role="listitem"
          aria-label={`${props.series}: ${datum[props.series]}`}
          onPointerEnter={() => { activePoint.value = { series: props.series, axis: props.axis, datum, x: /* cx */, y: /* cy */ } }}
          onPointerLeave={() => { activePoint.value = null }}
          onFocus={() => { /* same as onPointerEnter */ }}
          onBlur={() => { activePoint.value = null }}
          onKeyDown={(e) => { /* Enter/Space: set, Escape: null */ }}
        />
      ))}
    </>
  )
}
```

**Acceptance criteria**

1. `<Area series="v" axis="y" />` with 5 data points renders one `AreaClosed` path and 5 circles.
2. Two `<Area series="a" />` and `<Area series="b" />` siblings produce two `<defs>` with IDs `area-gradient-a` and `area-gradient-b` respectively.
3. `innerWidth === 0` returns null (no elements in DOM).
4. `pointerenter` on the first circle sets `activePoint.value.series === props.series` and `activePoint.value.datum === data[0]`.
5. `pointerleave` on a circle sets `activePoint.value === null`.
6. `keydown` with key `'Enter'` on a circle sets `activePoint.value` identically to `onPointerEnter`.
7. All circles have `tabIndex={0}` and `role="listitem"`.
8. `npx tsc --noEmit` reports zero errors after this task.

**Test Plan**

- `src/components/charts/marks/Area.test.tsx` (new)
  - Scenario: Renders `AreaClosed` path element and correct number of circles for given data length.
  - Scenario: Two sibling `<Area>` components produce gradient IDs based on their respective `series` props.
  - Scenario: `innerWidth === 0` renders nothing.
  - Scenario: `pointerenter` on circle sets `activePoint.value` with correct `series`, `datum`, `x`, `y`.
  - Scenario: `pointerleave` resets `activePoint.value` to `null`.
  - Scenario: `keydown` Enter sets `activePoint.value` identically to `onFocus`.
  - Scenario: All circles have `tabIndex=0` and `role="listitem"`.

**Files**

- `src/components/charts/marks/Area.tsx` (new) - `AreaClosed` + gradient + data circles with keyboard/pointer events
- `src/components/charts/marks/Area.test.tsx` (new) - interaction and accessibility tests

---

## T-8: `Bar` mark

**Context**

Implements `src/components/charts/marks/Bar.tsx` from SPEC section 3 (mark layer). `Bar` supports three rendering modes based on props: simple (one rect per datum), grouped (multiple bars per category), and stacked (stacked bars using `BarStack` from `@visx/shape`). It uses a `scaleBand` for the categorical x-axis. It writes `activePoint` on pointer/keyboard events.

Read `src/components/charts/VisualizationContext.ts` (T-4) and `src/components/charts/test-utils.tsx` (T-4) before starting. Review `@visx/shape`'s `Bar`, `BarGroup`, and `BarStack` types in `node_modules/@visx/shape/lib/index.d.ts` to understand their prop shapes before implementing.

**Requirements**

1. Create `src/components/charts/marks/Bar.tsx` exporting `function Bar(props: BarProps): JSX.Element | null`. Co-locate `BarProps` in this file.
2. `Bar` must return `null` when `innerWidth === 0`.
3. In simple mode (neither `grouped` nor `stacked`), render one `rect` per datum using dimensions from the `scaleBand` x-scale (`scales['x']`) and the y-scale (`scales[props.axis]`).
4. When `props.sortBy === 'asc'`, sort data by `datum[props.series]` ascending before rendering. When `props.sortBy === 'desc'`, sort descending. The sorted order determines left-to-right rendering position.
5. When `props.stacked === true`, render using `BarStack` from `@visx/shape` using `scales[props.axis]` as the y-scale.
6. Each rendered `rect` must have `tabIndex={0}`, `role="listitem"`, `aria-label` containing the datum value, `onPointerEnter`, `onPointerLeave`, `onFocus`, `onBlur`, and `onKeyDown` handlers with the same contract as `Area` circles (SPEC interaction Path B/C).
7. `onPointerEnter` and `onFocus` on a bar rect must set `activePoint.value` to the datum's `ActivePoint`.
8. `onPointerLeave` and `onBlur` must set `activePoint.value = null`.
9. `onKeyDown` Enter/Space sets `activePoint.value`; Escape sets `null`.
10. `color` defaults to `tokens.primary` when not provided.
11. Create `src/components/charts/marks/Bar.test.tsx` covering all scenarios in the Test Plan.
12. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- The context's `scales` must have an entry keyed `'x'` with a `scaleBand` for `Bar` to work. Marks assume the consumer has provided the correct axes. In tests, provide a mock `scaleBand` with a known `bandwidth()` and function return value.
- `sortBy` mutates a copy of the data, never the signal or original array: `const sorted = [...data].sort(...)`.
- `BarStack` requires `keys` prop (array of series keys), `xScale`, `yScale`, `color` (a function mapping key to color), and `data`. For the initial implementation, `stacked` mode renders a single series. Document that multi-series stacking requires multiple `Bar` siblings to cooperate - this coordination is out of scope; implement single-key `BarStack`.
- For grouped mode (`grouped: true`), use `BarGroup` from `@visx/shape`. For simplicity, grouped mode is intentionally left as a future enhancement in this task - implement the prop on the interface but render the same as simple mode and add a `// TODO: grouped mode` comment. Document this limitation in the task.
- Scale casting: `scales['x']` is `AnyD3Scale` but for `Bar` it must be `ScaleBand`. Cast with `scales['x'] as ScaleBand<string>` where needed.

**Design**

```tsx
// src/components/charts/marks/Bar.tsx  (new file)

import { Bar as VxBar } from '@visx/shape'
import { useVisualizationContext } from '../VisualizationContext'
import type { ScaleBand } from 'd3-scale'

export interface BarProps {
  series: string
  axis: string
  grouped?: boolean
  stacked?: boolean
  color?: string
  sortBy?: 'asc' | 'desc'
}

export function Bar(props: BarProps): JSX.Element | null {
  const { dataSignal, scales, innerWidth, innerHeight, tokens, activePoint } = useVisualizationContext()
  if (innerWidth === 0) return null

  const data = dataSignal.value
  const sorted = props.sortBy
    ? [...data].sort((a, b) => props.sortBy === 'asc' ? (a[props.series] as number) - (b[props.series] as number) : (b[props.series] as number) - (a[props.series] as number))
    : data

  const xScale = scales['x'] as ScaleBand<string>
  // render rects using xScale and scales[props.axis]
}
```

**Acceptance criteria**

1. `<Bar series="runs" axis="y" />` with 4 data points renders 4 `rect` elements.
2. `<Bar series="runs" axis="y" sortBy="desc" />` renders rects in descending order: the rect for the datum with the highest `runs` value has the smallest `x` position (leftmost).
3. Each `rect` has `tabIndex={0}` and `role="listitem"`.
4. `pointerenter` on a rect sets `activePoint.value.datum` to the corresponding datum.
5. `<Bar series="runs" axis="y" stacked />` renders without throwing.
6. `innerWidth === 0` renders null.
7. `npx tsc --noEmit` reports zero errors after this task.

**Test Plan**

- `src/components/charts/marks/Bar.test.tsx` (new)
  - Scenario: 4 data points produce 4 rect elements.
  - Scenario: `sortBy="desc"` renders rects with decreasing `x` position (or height proportional to value in descending order).
  - Scenario: All rects have `tabIndex=0` and `role="listitem"`.
  - Scenario: `pointerenter` on a rect updates `activePoint.value` correctly.
  - Scenario: `innerWidth === 0` returns null.
  - Scenario: `stacked` mode renders without throwing.

**Files**

- `src/components/charts/marks/Bar.tsx` (new) - bar chart mark with sort and keyboard events
- `src/components/charts/marks/Bar.test.tsx` (new) - sort order, accessibility, and interaction tests

---

## T-9: `Gauge` mark

**Context**

Implements `src/components/charts/marks/Gauge.tsx` from SPEC section 3 (mark layer). `Gauge` renders a 180-degree semicircle arc using `Pie` from `@visx/shape`. It reads `data.value[0][series]` to get the current KPI value and switches arc stroke color to `tokens.destructive` when the value exceeds `criticalThreshold`.

Read `src/components/charts/VisualizationContext.ts` (T-4) and `src/components/charts/test-utils.tsx` (T-4) before starting. The SPEC notes that for gauge use cases, `data` is a single-element array wrapping the KPI value object.

**Requirements**

1. Create `src/components/charts/marks/Gauge.tsx` exporting `function Gauge(props: GaugeProps): JSX.Element | null`. Co-locate `GaugeProps` in this file.
2. `Gauge` must return `null` when `innerWidth === 0`.
3. `Gauge` must read `data.value[0][props.series]` from `dataSignal.value` to get the current value. If `dataSignal.value` is empty, return null.
4. The arc must be a 180-degree semicircle: `startAngle = -Math.PI / 2`, `endAngle = Math.PI / 2`.
5. The filled arc (progress) must span from `startAngle` to `startAngle + (value / domainMax) * Math.PI`. The background arc fills the remainder.
6. `domain` defaults to `[0, 100]` when not provided.
7. When `value > criticalThreshold` (default `90`), the progress arc stroke/fill must use `tokens.destructive`. Otherwise use `tokens.primary`.
8. When `props.label` is provided, render a `<text>` element centered in the gauge displaying the label.
9. The arc must have `tabIndex={0}`, `role="listitem"`, `aria-label` containing the value and domain.
10. Create `src/components/charts/marks/Gauge.test.tsx` covering all scenarios in the Test Plan.
11. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- Use `Pie` from `@visx/shape` with two arcs: one for the progress fill (data arc) and one for the background track. Or, compute arc paths manually using `d3-shape`'s `arc` function (simpler for a semicircle). Using `Pie` is preferred since the SPEC names it.
- Center the gauge in the available `innerWidth x innerHeight` space: `cx = innerWidth / 2`, `cy = innerHeight`. Radius: `Math.min(innerWidth / 2, innerHeight) * 0.9`.
- For the `Pie` approach: provide two-element data array `[value, domainMax - value]` to `Pie` with `startAngle` and `endAngle` props. The first arc segment is the progress; the second is the background.
- `tokens.muted` for the background arc color.
- `label` text: `<text x={cx} y={cy} textAnchor="middle" dy="-0.5em">` centered in the gauge.
- In tests, provide `dataSignal = signal([{ pct: 95 }])` via `renderWithVisualizationContext`.

**Design**

```tsx
// src/components/charts/marks/Gauge.tsx  (new file)

import { Pie } from '@visx/shape'
import { useVisualizationContext } from '../VisualizationContext'

export interface GaugeProps {
  series: string
  domain?: [number, number]
  criticalThreshold?: number
  label?: string
}

export function Gauge(props: GaugeProps): JSX.Element | null {
  const { dataSignal, innerWidth, innerHeight, tokens } = useVisualizationContext()
  if (innerWidth === 0) return null
  const data = dataSignal.value
  if (data.length === 0) return null

  const value = data[0][props.series] as number
  const [, domainMax] = props.domain ?? [0, 100]
  const threshold = props.criticalThreshold ?? 90
  const color = value > threshold ? tokens.destructive : tokens.primary
  // render Pie with semicircle constraint and label
}
```

**Acceptance criteria**

1. `<Gauge series="pct" />` with `data = [{ pct: 95 }]` and `criticalThreshold={90}` renders an arc with fill equal to `tokens.destructive`.
2. `<Gauge series="pct" />` with `data = [{ pct: 50 }]` renders an arc with fill equal to `tokens.primary`.
3. `<Gauge series="pct" label="Budget" />` renders a `<text>` element containing `"Budget"`.
4. `innerWidth === 0` renders null.
5. Empty `data` renders null without throwing.
6. Arc element has `tabIndex={0}` and `role="listitem"`.
7. `npx tsc --noEmit` reports zero errors after this task.

**Test Plan**

- `src/components/charts/marks/Gauge.test.tsx` (new)
  - Scenario: Value above `criticalThreshold` uses `tokens.destructive` color on the progress arc.
  - Scenario: Value below `criticalThreshold` uses `tokens.primary` color.
  - Scenario: `label` prop renders a `<text>` element with that text.
  - Scenario: `innerWidth === 0` renders null.
  - Scenario: Empty data array renders null.
  - Scenario: Arc element has `tabIndex=0` and `role="listitem"`.

**Files**

- `src/components/charts/marks/Gauge.tsx` (new) - semicircle arc with critical threshold color switching
- `src/components/charts/marks/Gauge.test.tsx` (new) - color, label, and edge case tests

---

## T-10: `HeatmapMark`

**Context**

Implements `src/components/charts/marks/HeatmapMark.tsx` from SPEC section 3 (mark layer). `HeatmapMark` renders a grid of colored rectangles using `HeatmapRect` from `@visx/heatmap`. Data points are chunked into 7-day columns. Cell color is determined by a `scaleSequential` color scale keyed by `colorScale` prop.

Read `src/components/charts/VisualizationContext.ts` (T-4) and `src/components/charts/test-utils.tsx` (T-4). Review `node_modules/@visx/heatmap/lib/index.d.ts` for `HeatmapRect` prop shapes before writing.

**Requirements**

1. Create `src/components/charts/marks/HeatmapMark.tsx` exporting `function HeatmapMark(props: HeatmapMarkProps): JSX.Element | null`. Co-locate `HeatmapMarkProps` in this file.
2. `HeatmapMark` must return `null` when `innerWidth === 0`.
3. `HeatmapMark` must chunk `dataSignal.value` into groups of 7 (weeks) using array slicing. The first group is days 0-6, the second is 7-13, etc.
4. For `colorScale === 'availability'`: use `scaleSequential` from `@visx/scale` with domain `[0, 100]` and interpolator from `'#22c55e'` (100% uptime, green) to `'#ef4444'` (0% uptime, red). Note the inverted range: higher uptime = greener.
5. For `colorScale === 'cost'`: use `scaleSequential` with domain `[0, maxValue]` (computed from data) and interpolator from `tokens.background` to `tokens.destructive`.
6. Each cell `rect` rendered by `HeatmapRect` must have `tabIndex={0}`, `role="listitem"`, and `aria-label` containing the `dateKey` value and the `series` value for that datum.
7. Each cell must have `onPointerEnter`, `onPointerLeave`, `onFocus`, `onBlur`, and `onKeyDown` handlers following the same `activePoint` contract as `Bar` (SPEC interaction Path B/C).
8. The first cell's `aria-label` must contain the earliest date value; the last cell's `aria-label` must contain the latest date value (order mirrors data order).
9. Create `src/components/charts/marks/HeatmapMark.test.tsx` covering all scenarios in the Test Plan.
10. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- `HeatmapRect` from `@visx/heatmap` expects `data` in the format `Array<{ bin: string; bins: Array<{ bin: string; count: number }> }>`. Structure the 7-day chunks accordingly: outer array = week columns, inner `bins` = daily rows within the week.
- Cell size: `cellWidth = innerWidth / numWeeks`, `cellHeight = innerHeight / 7`. Compute `numWeeks = Math.ceil(data.length / 7)`.
- `scaleSequential` interpolator: use `d3-interpolate`'s `interpolateRgb` or write inline: `t => interpolateColor(t)`. The simplest approach is to import `scaleSequential` from `@visx/scale` and pass a color interpolator function.
- For `'availability'` color scale, the semantic is: `0` uptime = `#ef4444`, `100` uptime = `#22c55e`. Use `scaleSequential([0, 100], d3.interpolateRgb('#ef4444', '#22c55e'))` (lower domain = red, upper = green).
- `d3-interpolate` is a transitive dep of `@visx/gradient`. Verify it exists in `node_modules` before importing. Alternatively, implement a simple RGB interpolator without d3: `(t: number) => ...`.
- In tests: provide 31 data points; verify 31 rendered `rect` elements.

**Design**

```tsx
// src/components/charts/marks/HeatmapMark.tsx  (new file)

import { HeatmapRect } from '@visx/heatmap'
import { scaleSequential, scaleBand } from '@visx/scale'
import { useVisualizationContext } from '../VisualizationContext'

export interface HeatmapMarkProps {
  series: string
  dateKey: string
  colorScale: 'availability' | 'cost'
}

export function HeatmapMark(props: HeatmapMarkProps): JSX.Element | null {
  const { dataSignal, innerWidth, innerHeight, tokens, activePoint } = useVisualizationContext()
  if (innerWidth === 0) return null

  const data = dataSignal.value
  // chunk into 7-day bins
  // build color scale
  // render HeatmapRect with interaction handlers on each bin cell
}
```

**Acceptance criteria**

1. 31 data points → 31 `rect` elements in the DOM.
2. 7 data points → 7 `rect` elements.
3. All `rect` elements have `tabIndex={0}` and `role="listitem"`.
4. First cell `aria-label` contains `data[0][dateKey]`; last cell `aria-label` contains `data[30][dateKey]` for 31-element data.
5. `pointerenter` on a cell sets `activePoint.value.datum` to the corresponding datum.
6. `colorScale === 'availability'` with `series` value `0` produces a fill closer to `#ef4444` (red); value `100` produces fill closer to `#22c55e` (green).
7. `innerWidth === 0` renders null.
8. `npx tsc --noEmit` reports zero errors after this task.

**Test Plan**

- `src/components/charts/marks/HeatmapMark.test.tsx` (new)
  - Scenario: 31 data points produce 31 rect elements.
  - Scenario: All rects have `tabIndex=0` and `role="listitem"`.
  - Scenario: First cell `aria-label` contains the first datum's date value.
  - Scenario: Last cell `aria-label` contains the last datum's date value.
  - Scenario: `pointerenter` updates `activePoint.value` correctly.
  - Scenario: `innerWidth === 0` renders null.

**Files**

- `src/components/charts/marks/HeatmapMark.tsx` (new) - `HeatmapRect` wrapper with color scales and interaction
- `src/components/charts/marks/HeatmapMark.test.tsx` (new) - count, accessibility, and interaction tests

---

## T-11: `SeriesTooltip` overlay

**Context**

Implements `src/components/charts/overlays/SeriesTooltip.tsx` from SPEC section 3 (overlay layer). `SeriesTooltip` reads `activePoint` from context and renders its children render-prop when `activePoint.value?.series === props.series`. It uses `TooltipWithBounds` from `@visx/tooltip` for boundary-safe positioning.

Read `src/components/charts/VisualizationContext.ts` (T-4) and `src/components/charts/test-utils.tsx` (T-4) before starting. Review `node_modules/@visx/tooltip/lib/index.d.ts` for `TooltipWithBounds` props.

**Requirements**

1. Create `src/components/charts/overlays/SeriesTooltip.tsx` exporting `function SeriesTooltip<TData extends Record<string, unknown>>(props: SeriesTooltipProps<TData>): JSX.Element | null`. Co-locate `SeriesTooltipProps` in this file.
2. `SeriesTooltip` must read `activePoint` from `useVisualizationContext()`.
3. When `activePoint.value === null`, return `null`.
4. When `activePoint.value.series !== props.series`, return `null`.
5. When `activePoint.value.series === props.series`, render `TooltipWithBounds` from `@visx/tooltip` at position `(activePoint.value.x, activePoint.value.y)`.
6. Inside `TooltipWithBounds`, call `props.children({ datum: activePoint.value.datum as TData, x: activePoint.value.x, y: activePoint.value.y })`.
7. `SeriesTooltipProps.children` must be typed as `(point: { datum: TData; x: number; y: number }) => React.ReactNode`.
8. Create `src/components/charts/overlays/SeriesTooltip.test.tsx` covering all scenarios in the Test Plan.
9. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- `@visx/tooltip`'s `TooltipWithBounds` renders in a portal and requires a container with `position: relative`. In tests, this may render outside the test container. The simplest approach: mock `TooltipWithBounds` with `vi.mock('@visx/tooltip', () => ({ TooltipWithBounds: vi.fn(({ children }) => <div>{children}</div>) }))` and assert the children function is called with correct arguments.
- `activePoint` is a `Signal` - in tests, set its value directly (`activePoint.value = { ... }`) after calling `renderWithVisualizationContext`. Then assert DOM state.
- The tooltip is conditional on two checks: `series` match AND non-null `activePoint`. The test must cover both the matching and non-matching cases.

**Design**

```tsx
// src/components/charts/overlays/SeriesTooltip.tsx  (new file)

import { TooltipWithBounds } from '@visx/tooltip'
import { useVisualizationContext } from '../VisualizationContext'

export interface SeriesTooltipProps<TData extends Record<string, unknown>> {
  series: string
  axis: string
  children: (point: { datum: TData; x: number; y: number }) => React.ReactNode
}

export function SeriesTooltip<TData extends Record<string, unknown>>(
  props: SeriesTooltipProps<TData>,
): JSX.Element | null {
  const { activePoint } = useVisualizationContext()
  const ap = activePoint.value
  if (!ap || ap.series !== props.series) return null

  return (
    <TooltipWithBounds top={ap.y} left={ap.x}>
      {props.children({ datum: ap.datum as TData, x: ap.x, y: ap.y })}
    </TooltipWithBounds>
  )
}
```

**Acceptance criteria**

1. `activePoint.value === null` → `SeriesTooltip` renders nothing.
2. `activePoint.value.series === 'other'` while `props.series === 'v'` → `SeriesTooltip` renders nothing.
3. `activePoint.value.series === 'v'` while `props.series === 'v'` → children render-prop is called with `datum` equal to `activePoint.value.datum`.
4. `TooltipWithBounds` is positioned at `top={activePoint.value.y}` and `left={activePoint.value.x}`.
5. `npx tsc --noEmit` reports zero errors after this task.

**Test Plan**

- `src/components/charts/overlays/SeriesTooltip.test.tsx` (new)
  - Scenario: Renders nothing when `activePoint.value === null`.
  - Scenario: Renders nothing when `activePoint.value.series` does not match `props.series`.
  - Scenario: Renders children with correct datum when series matches.
  - Scenario: Children render-prop receives `{ datum, x, y }` matching `activePoint.value`.

**Files**

- `src/components/charts/overlays/SeriesTooltip.tsx` (new) - conditional tooltip that reads `activePoint` signal
- `src/components/charts/overlays/SeriesTooltip.test.tsx` (new) - null, mismatch, and match scenarios

---

## T-12: `MouseTooltip` and `Annotation` overlays

**Context**

Implements `src/components/charts/overlays/MouseTooltip.tsx` and `src/components/charts/overlays/Annotation.tsx` from SPEC section 3 (overlay layer). Both are simpler overlays: `MouseTooltip` follows `mousePosition` signal; `Annotation` draws a horizontal reference line at a threshold value. Grouped into one task since both are small and overlay-independent of each other.

Read `src/components/charts/VisualizationContext.ts` (T-4) and `src/components/charts/test-utils.tsx` (T-4) before starting.

**Requirements**

1. Create `src/components/charts/overlays/MouseTooltip.tsx` exporting `function MouseTooltip(props: MouseTooltipProps): JSX.Element | null`. Co-locate `MouseTooltipProps` in this file.
2. `MouseTooltip` must read `mousePosition` from `useVisualizationContext()`. Return `null` when `mousePosition.value === null`.
3. When `mousePosition.value` is set, render `TooltipWithBounds` at `(mousePosition.value.x, mousePosition.value.y)`.
4. If `props.children` is a function, call it with `{ x: mousePosition.value.x, y: mousePosition.value.y }` and render the result. If `children` is not a function, render it directly as static JSX.
5. Create `src/components/charts/overlays/Annotation.tsx` exporting `function Annotation(props: AnnotationProps): JSX.Element | null`. Co-locate `AnnotationProps` in this file.
6. `Annotation` must return `null` when `innerWidth === 0`.
7. `Annotation` must read `scales[props.axis]` from context and call `scale(props.value)` to get the pixel y-coordinate. Cast the scale return to `number`.
8. `Annotation` must render a horizontal `<line>` from `x1={0}` to `x2={innerWidth}` at `y1={pixelY}` and `y2={pixelY}`.
9. The line stroke must be `tokens.warning` when `variant === 'warning'` (default) and `tokens.destructive` when `variant === 'destructive'`.
10. `Annotation` must render a `<text>` element at `x={innerWidth}` and `y={pixelY - 4}` displaying `props.label`. Text fill color matches the line stroke color.
11. All: `function ComponentName(` declaration style per ARCHITECTURE.md §4.3. No arrow-function component definitions.
12. Create test files for both components covering all scenarios in the Test Plan.
13. Run `npm run test` and fix any test failures introduced by this task before marking it complete.

**Technical decisions**

- `MouseTooltip` uses the same `TooltipWithBounds` as `SeriesTooltip`. Mock it the same way in tests.
- `Annotation` uses `<line>` and `<text>` SVG primitives directly - no `@visx/annotation` library component needed. The SPEC mentions `@visx/annotation` but a plain SVG `<line>` is simpler and avoids extra API surface.
- `children` type for `MouseTooltip`: `React.ReactNode | ((pos: { x: number; y: number }) => React.ReactNode)`. Check `typeof children === 'function'` at runtime before calling.
- For `Annotation` scale call: `const yPx = (scales[props.axis] as (v: number) => number)(props.value)`. Cast is needed because `AnyD3Scale` is a union.

**Design**

```tsx
// src/components/charts/overlays/MouseTooltip.tsx  (new file)

import { TooltipWithBounds } from '@visx/tooltip'
import { useVisualizationContext } from '../VisualizationContext'

export interface MouseTooltipProps {
  children: React.ReactNode | ((pos: { x: number; y: number }) => React.ReactNode)
}

export function MouseTooltip(props: MouseTooltipProps): JSX.Element | null {
  const { mousePosition } = useVisualizationContext()
  const pos = mousePosition.value
  if (!pos) return null
  return (
    <TooltipWithBounds top={pos.y} left={pos.x}>
      {typeof props.children === 'function' ? props.children({ x: pos.x, y: pos.y }) : props.children}
    </TooltipWithBounds>
  )
}
```

```tsx
// src/components/charts/overlays/Annotation.tsx  (new file)

import { useVisualizationContext } from '../VisualizationContext'

export interface AnnotationProps {
  axis: string
  value: number
  label: string
  variant?: 'warning' | 'destructive'
}

export function Annotation(props: AnnotationProps): JSX.Element | null {
  const { scales, innerWidth, innerHeight, tokens } = useVisualizationContext()
  if (innerWidth === 0) return null
  const scale = scales[props.axis] as (v: number) => number
  const yPx = scale(props.value)
  const color = props.variant === 'destructive' ? tokens.destructive : tokens.warning
  return (
    <g>
      <line x1={0} x2={innerWidth} y1={yPx} y2={yPx} stroke={color} strokeDasharray="4 2" />
      <text x={innerWidth} y={yPx - 4} textAnchor="end" fill={color} fontSize={11}>{props.label}</text>
    </g>
  )
}
```

**Acceptance criteria**

1. `mousePosition.value === null` → `MouseTooltip` renders nothing.
2. `mousePosition.value = { x: 50, y: 100 }` → `MouseTooltip` renders children at those coordinates.
3. `children` as a function receives `{ x: 50, y: 100 }` when `mousePosition` is set.
4. `<Annotation axis="y" value={5} label="Threshold" variant="destructive" />` renders a `<line>` with stroke equal to `tokens.destructive`.
5. The `<line>` y-coordinate equals `scale(5)` output from the mock scale.
6. A `<text>` element with content `"Threshold"` is present in the DOM.
7. `<Annotation>` with `innerWidth === 0` renders null.
8. `npx tsc --noEmit` reports zero errors after this task.

**Test Plan**

- `src/components/charts/overlays/MouseTooltip.test.tsx` (new)
  - Scenario: `mousePosition.value === null` renders nothing.
  - Scenario: `mousePosition.value = { x: 50, y: 100 }` renders children.
  - Scenario: Function children receives the correct position object.

- `src/components/charts/overlays/Annotation.test.tsx` (new)
  - Scenario: `variant="destructive"` applies `tokens.destructive` stroke to the line element.
  - Scenario: `variant="warning"` (default) applies `tokens.warning` stroke.
  - Scenario: Line y-coordinate matches `scale(props.value)` output.
  - Scenario: Label text is present as a `<text>` element.
  - Scenario: `innerWidth === 0` renders null.

**Files**

- `src/components/charts/overlays/MouseTooltip.tsx` (new) - follows `mousePosition` signal; renders at cursor
- `src/components/charts/overlays/MouseTooltip.test.tsx` (new) - null and render scenarios
- `src/components/charts/overlays/Annotation.tsx` (new) - horizontal reference line with label
- `src/components/charts/overlays/Annotation.test.tsx` (new) - color variant, scale position, and edge case tests

---

## Implementation order table

| Done | Priority | Task | Depends on | Effort |
|------|----------|------|------------|--------|
| [x]  | 1        | T-1: Shared chart types + useChartTokens | - | Small |
| [x]  | 2        | T-2: D3 scale helpers | T-1 | Small |
| [x]  | 3        | T-3: ChartSVG, Axis, Grid primitives | T-1 | Medium |
| [x]  | 4        | T-4: VisualizationContext | T-1 | Small |
| [x]  | 5        | T-5: Visualization root | T-2, T-3, T-4 | Large |
| [x]  | 6        | T-6: Line mark | T-5 | Small |
| [ ]  | 7        | T-7: Area mark | T-5 | Medium |
| [ ]  | 8        | T-8: Bar mark | T-5 | Medium |
| [ ]  | 9        | T-9: Gauge mark | T-5 | Small |
| [ ]  | 10       | T-10: HeatmapMark | T-5 | Medium |
| [ ]  | 11       | T-11: SeriesTooltip overlay | T-5 | Medium |
| [ ]  | 12       | T-12: MouseTooltip + Annotation overlays | T-5 | Small |
