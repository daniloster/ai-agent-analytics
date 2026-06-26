# Generic Architecture Guidelines

**Version:** 1.0  
**Purpose:** Foundational principles for building web applications  
**Status:** Template for new projects

---

## 1. High-Level Architecture

### 1.1 Layered Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Client Application                        │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    Framework Layer                            │  │
│  │  (React Router, Next.js, or equivalent)                       │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐  │  │
│  │  │   Layouts    │  │   Routes     │  │   Resource Routes   │  │  │
│  │  └──────────────┘  └──────────────┘  └─────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    State Management Layer                     │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐  │  │
│  │  │  Domain      │  │  Server      │  │   Local UI State    │  │  │
│  │  │  Models      │  │  State       │  │   (useSignal)       │  │  │
│  │  └──────────────┘  └──────────────┘  └─────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    Component Layer                            │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐  │  │
│  │  │   Layouts    │  │   Organisms  │  │   Molecules/Atoms   │  │  │
│  │  └──────────────┘  └──────────────┘  └─────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           Server Layer                              │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              Backend Services                                 │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐  │  │
│  │  │   Database   │  │   Auth       │  │   Storage           │  │  │
│  │  └──────────────┘  └──────────────┘  └─────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │              API Layer                                        │  │
│  │  ┌──────────────┐  ┌──────────────┐                           │  │
│  │  │  REST/GraphQL│  │   Edge       │                           │  │
│  │  │  Endpoints   │  │   Functions  │                           │  │
│  │  └──────────────┘  └──────────────┘                           │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        External Services                            │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐        │
│  │  Third-party │  │   Analytics  │  │   Monitoring        │        │
│  │   APIs       │  │   & Logging  │  │   & Observability   │        │
│  └──────────────┘  └──────────────┘  └─────────────────────┘        │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Core Principles

1. **Separation of Concerns:** Each layer has a single responsibility
2. **Dependency Inversion:** Higher layers depend on abstractions, not implementations
3. **Testability:** Code should be designed for testing from the start
4. **Maintainability:** Code should be easy to understand and modify

---

## 2. Code Organization

### 2.1 Folder Structure

```
src/
├── app/                          # Framework layer (routing, layouts)
│   ├── (auth)/                   # Auth routes
│   ├── (dashboard)/              # Authenticated routes
│   ├── api/                      # Server-only resource routes
│   ├── layout.tsx
│   └── page.tsx
├── components/                   # UI components
│   ├── ui/                       # UI primitives (shadcn/ui, etc.)
│   ├── layout/                   # Layout components
│   └── features/                 # Feature-specific components
├── models/                       # Domain models and state
├── lib/                          # Utility functions
├── types/                        # TypeScript type definitions
├── tokens/                       # Design tokens
├── i18n/                         # Internationalisation
└── assets/                       # Static assets
```

### 2.2 Naming Conventions

**File naming:**
- Component files: `PascalCase.tsx`
- Hook files: `usePascalCase.ts` (only when truly required)
- Model files: `PascalCase.ts`
- Utility files: `camelCase.ts` (matches main export)
- Token files: `camelCase.ts` (matches main export)

**Export style:**
- Always use named exports - never default exports
- File name must match the main export name

**Case rules:**
- Component names and class names: `PascalCase`
- Function names, variable names, and file names: `camelCase`

### 2.3 Utility Extraction and Reusability

Before writing a helper function inside a module, check whether an equivalent already exists elsewhere in the codebase.

**Rule:** If the same logic appears (or is about to appear) in two or more modules, extract it into `src/utils/` as a named export. Do not copy-paste.

**Process:**
1. When implementing a function, search `src/` for the same logic first (`grep` the function name or the distinctive expression).
2. If an identical or near-identical implementation exists in another module, create a shared utility in `src/utils/` and update both call sites to import it.
3. If unsure whether two functions are equivalent, align them first, then extract.

**Scope:**
- Pure functions with no side effects are always candidates (formatters, parsers, math helpers).
- Functions that depend on React hooks, signals, or component lifecycle stay in their module.
- Do not extract a function solely because it might be reused - two confirmed usages are the threshold.

**File naming:** `src/utils/<functionName>.ts`, one primary export per file matching the file name.

**Testing:** Every file created in `src/utils/` must have a co-located test file `src/utils/<functionName>.test.ts`.

---

## 3. State Management

### 3.1 State Management Philosophy

- **Server state:** Use a dedicated library (TanStack Query, SWR, etc.)
- **Domain state:** Use signals for complex state
- **UI state:** Use signals for all mutable state, including ephemeral and component-local state. Never use `useState`.
- **No global state:** Avoid global state management libraries (Redux, Zustand)

### 3.2 Signal Architecture

**Core principles:**
1. All mutable state lives in model classes
2. Signals are private - only the owning model mutates its signals
3. Components read signals directly - no prop drilling
4. Computed values use `useDeepComputed` - always, for all return types including primitives

**Signal subscription strategy:**
- Postpone signal subscription to the most leaf nodes
- Use `useDeepComputed` to transform signals outside the React render cycle
- Only subscribe to signals that are actually rendered
- Pass computed signals down as props

**Pass signals as props, never their `.value`:**

When a parent component owns a signal and a child needs to react to it, pass the signal itself - not `.value`. The child types the prop as `ReadonlySignal<T>` and reads `.value` internally, inside JSX or `useSignalEffect`. Passing `.value` freezes the child to the value at render time and forces the parent to re-render before the child sees updates.

```tsx
// WRONG - passes the raw value; child cannot react to future changes
<LapAnalysisScreen reviewLap={selectedLap.value} />

// CORRECT - passes the signal; child subscribes reactively
<LapAnalysisScreen reviewLap={selectedLap} />
```

Prop type on the child:

```ts
interface Props {
  reviewLap: ReadonlySignal<LapData | null>
}
```

Corollary: use `useSignalEffect` (not `useEffect([dep])`) inside the child to react to signal prop changes, and `useDeepComputed` to derive computed values from them.

### 3.2.1 useDeepComputed — deep equality wrapper

The native `useComputed` from `@preact/signals-react` uses **reference equality** (`===`) when deciding whether to notify subscribers. Computations that return a new object or array reference on every evaluation — `.find()`, `.filter()`, `.map()`, object spreads — will trigger a React re-render even when the data is structurally identical to the previous value.

Use `useDeepComputed` for all non-JSX, non-Skia-Path return types - primitives, plain objects, and arrays. Use `useComputed` (from `@preact/signals-react`) when the result is JSX (`ReactElement`) or contains a Skia `Path` (or any value derived from `SkPath` / `PathBuilder`).

**Rule:** Two hooks are approved for computing derived signal values in components:

- `useDeepComputed` - for primitives, plain objects, and plain arrays. Suppresses re-renders when the result is structurally identical to the previous value.
- `useComputed` - when the return type is JSX (`ReactElement`) **or** contains a Skia `SkPath`. Deep equality comparison is incorrect for both: React element trees hold function references and closures that `react-fast-compare` cannot compare reliably, and Skia `SkPath` objects are native-backed and opaque to JS equality checks. Reference equality is the right semantics for both.

Never use `useComputed` for plain primitive / object / array return types.

**Why `useDeepComputed` for primitives and objects (not `useComputed`):**
- Primitives are compared by value (`===`), so the deep-equal check is a no-op and costs nothing
- Object/array computations frequently return new references for identical data (`.map()`, `.filter()`, object spread), which would cause unnecessary re-renders with bare `useComputed`
- Prevents accidental regressions when a computation is refactored from returning a primitive to returning an object

**Why `useComputed` for JSX and Skia Path:**
- React element objects contain function references, refs, and closures - `react-fast-compare` cannot reliably compare them
- Skia `SkPath` objects are native-backed (C++ heap); JS-side `===` and deep-equal checks compare opaque handles, not path data
- Deep-comparing either is expensive and produces incorrect results
- Reference equality is correct: unchanged signal inputs return the cached reference; changed inputs produce a new JSX tree or a new path

**Implementation** (`src/hooks/useDeepComputed.ts`):

```ts
import { useComputed } from '@preact/signals-react'
import type { ReadonlySignal } from '@preact/signals-react'
import { useRef } from 'react'
import equal from 'react-fast-compare'

/**
 * Like useComputed, but suppresses re-renders when the new value is deeply
 * equal to the previous one. Use for computations that return a new object
 * or array reference on every signal change.
 *
 * Returns a ReadonlySignal<T> — the caller decides when to subscribe by
 * reading .value. This keeps subscription as late (leaf-level) as possible,
 * consistent with the signal subscription strategy in §3.2.
 *
 * How it works: the signals runtime uses === to compare a computed signal's
 * old and new value before notifying subscribers. By returning the previous
 * reference when deeply equal, the computed signal's value is unchanged by
 * reference and subscribers (React components) are not notified.
 *
 * Trade-off: one deep-equal check per signal dependency update (CPU) in
 * exchange for fewer React re-renders (less DOM reconciliation).
 *
 * Dependency: react-fast-compare (~300 B, no transitive deps)
 */
export function useDeepComputed<T>(fn: () => T): ReadonlySignal<T> {
  const prev = useRef<{ v: T } | undefined>(undefined)
  return useDeepComputed(() => {
    const next = fn()
    if (prev.current !== undefined && equal(prev.current.v, next)) {
      return prev.current.v  // stable reference — signals runtime skips notification
    }
    prev.current = { v: next }
    return next
  })
}
```

**Usage:**

```tsx
// Primitive — useDeepComputed, same as for objects (returns ReadonlySignal<boolean>)
const isSelected = useDeepComputed(() => canvasModel.selectedIds.value.includes(node.id))
// …later (when we depend on the whole object, or the signal is wrapping a primitive value)
// isSelected.value
// Using inside callback
// const report = useCallback(() => {
//   if (isSelected.value) return fetch(`/api/report`)
//   return Promise.resolve(null)
// }, [isSelected])


// Object — useDeepComputed returns ReadonlySignal<Page | null>
// Subscribe by reading .value at the leaf where it is needed
const activePage = useDeepComputed(() => canvasModel.activePage.value)
// …later (when we want a nested value of the returned signal object)
// useDeepComputed(() => activePage.value?.title).value
// Using inside callback
// const fetchActivePage = useCallback(() => fetch(`/api/page/${activePage.value.id}`), [activePage])

// Array — useDeepComputed returns ReadonlySignal<string[]>
const rootIds = useDeepComputed(() => canvasModel.rootIds.value)
// …later  (when we want to render based on the array, so we cache the render output)
// useDeepComputed(() => rootIds.value.map(id => renderNode(id))).value
// Using inside callback
// const fetchRoots = useCallback(() => fetch(`/api/roots/${rootIds.value.join(':')}`), [rootIds])
```

### 3.3 Model Pattern

**Model characteristics:**
- Owns all mutable state for a domain concept
- Exposes private signals and public computed values
- Provides mutating methods for state changes
- Supports serialization/deserialization

**Model structure:**
```ts
class DomainModel {
  // Private signals (never mutated from outside)
  private _state = signal<T>(initialValue)

  // Public computed signals (read-only)
  readonly state = computed(() => this._state.value)

  // Mutating methods (only way to change state)
  updateState(patch: Partial<T>): void {
    this._state.value = { ...this._state.value, ...patch }
  }

  // Serialization
  toSnapshot(): Snapshot {
    return { ...this._state.value }
  }

  loadSnapshot(snapshot: Snapshot): void {
    this._state.value = snapshot
  }
}
```

### 3.4 Class Method Binding

All methods defined on a class must use the **arrow function property syntax**. This binds `this` lexically at construction time, making every method safe to pass as a first-class callback without a manual `.bind(this)` wrapper.

```ts
// Wrong - prototype method loses 'this' when extracted as a callback
class AnalyserFacade {
  async init(): Promise<void> {
    await this._analyser.init()
  }
}
// onInit = facade.init  // 'this' is undefined when called outside the instance

// Correct - arrow function property, always bound to the instance
class AnalyserFacade {
  init = async (): Promise<void> => {
    await this._analyser.init()
  }
}
// onInit = facade.init  // 'this' is always the AnalyserFacade instance
```

**Exception - getters and setters:** `get`/`set` accessors must remain as prototype accessor syntax because the arrow function syntax does not support getters.

```ts
// Correct - getters stay as prototype accessors
class AiCoachAnalyser {
  get isReady(): boolean {
    return this._ctx !== null
  }
}
```

**Testing impact:** Arrow function fields are own instance properties and do not exist on `Class.prototype`. Tests must spy on an instance after construction - never on the prototype:

```ts
// Wrong - method is not on the prototype, spy is a no-op
vi.spyOn(MyClass.prototype, "myMethod").mockResolvedValue(undefined)

// Correct - create instance first, spy on the instance property
const instance = new MyClass()
vi.spyOn(instance, "myMethod").mockResolvedValue(undefined)
```

When the instance is created inside another class (e.g. `AnalyserFacade` creates `AiCoachAnalyser` internally), access the inner instance via a cast before calling the method under test:

```ts
const facade = new AnalyserFacade(dbStore)
vi.spyOn((facade as any)._aiCoachAnalyser, "init").mockResolvedValue(undefined)
await facade.init()
```

---

## 4. Component Architecture

### 4.1 Atomic Design Hierarchy

**Hierarchy:**
- **Layout (Page):** Top-level page structure
- **Organisms:** Domain-specific components composed of organisms and atoms
- **Molecules:** Non-domain components composed of atoms
- **Atoms:** Non-domain components with single responsibility

**Classification rules:**
- **Atoms:** Pure UI primitives (Button, Input, Dropdown)
- **Molecules:** Composed of atoms (Modal, Banner, Tooltip)
- **Organisms:** Domain components (FormationBuilder, MatchStats)
- **Layouts:** Page-level structure (DashboardPage, BuilderPage)

### 4.2 Composition Patterns

**Modal Pattern:**
```tsx
<Modal onClose={(status) => console.log(status)}>
  <Modal.Header title="Title" />
  <Modal.Content>...</Modal.Content>
  <Modal.Footer>
    <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
    <Button onClick={handleSave}>Save</Button>
  </Modal.Footer>
</Modal>
```

**Variant pattern:**
- Build variant components instead of making components complex with props
- Example: `<CollapsibleModal>` instead of `<Modal variant="collapsible">`

**Closing behavior:**
- Always make closing optional via `onClose(status: 'completed' | 'cancelled')`
- Don't bake close behavior into the component - use variants instead

### 4.3 Component Definition Style

- Always use `function ComponentName(` declarations - never arrow functions for component definitions.
- Never use `React.memo`.

```tsx
// correct
export function MyComponent({ value }: Props) {
  return <Text>{value}</Text>
}

// wrong
export const MyComponent = ({ value }: Props) => <Text>{value}</Text>
export const MyComponent = React.memo(({ value }: Props) => <Text>{value}</Text>)
```

### 4.4 Hoist Pure Functions Outside Components

Functions defined inside a component body are re-created on every render. If a function depends only on its own arguments and module-level imports - not on props, state, signals, refs, or context - define it outside the component.

**Rule:** hoist when all of these are true:
- The function takes all inputs as explicit parameters.
- It references no component-scoped variables (no closure over props, signals, `useRef`, etc.).
- It produces a deterministic output from its parameters alone.

This applies equally to render helpers (`renderItem`, `renderSectionHeader`), key extractors (`keyExtractor`), formatters (`formatTime`, `formatDistance`), and any other helper that satisfies the criteria above.

```tsx
// correct - all helpers hoisted; none close over component scope
function formatTime(ms: number): string { /* ... */ }
function keyExtractor(item: LapData): string { return item.id.toString() }
function renderItem({ item }: { item: LapData }) { return <LapRow lap={item} /> }

export function LapList({ laps }: Props) {
  return <FlatList data={laps} renderItem={renderItem} keyExtractor={keyExtractor} />
}

// wrong - re-created every render for no reason
export function LapList({ laps }: Props) {
  const keyExtractor = (item: LapData) => item.id.toString()
  const renderItem = ({ item }: { item: LapData }) => <LapRow lap={item} />
  return <FlatList data={laps} renderItem={renderItem} keyExtractor={keyExtractor} />
}
```

Functions that close over component-scoped values (props, signals, `useRef`) must stay inside the component or be expressed as `useCallback`/`useMemo` - hoisting them would break the closure.

### 4.5 Flatter React Tree

**Principle:** Prefer composition over deep nesting. Use render props and context to avoid prop drilling.

**Context pattern:**
- Context should be scoped to a feature, not the entire app
- Use feature-based context providers
- Example: `FormationBuilderProvider`, `PlayerAvatarProvider`

---

## 5. Testing Strategy

### 5.1 Testing Philosophy

- **Tests are mandatory:** Every new file added to the project must have a corresponding test file. No exceptions.
- **Maintenance**: We fix tests always after finishing a task, we don't ever let tests broken "because it will be address in the next task".
- **Co-location:** Test files live next to the code they test (`foo.ts` -> `foo.test.ts`).
- **Minimal mocking:** Only mock external dependencies (APIs, databases, third-party services). Never mock our own application code.
- **User behavior testing:** Tests should reflect what users actually do and experience, not implementation details.
- **Real-world scenarios:** Test complete user workflows, not isolated components in isolation.
- **Visual testing (optional):** If used, must be defined with clear principles and serve as a supplement, not replacement for functional tests.
- **Test Plan per task:** Every task in a TASKS file must include a **Test Plan** section that names the test files to create or modify and the specific scenarios to cover (happy path, failure path, edge cases). A task without a Test Plan section is incomplete.
- **Final step - fix all failures:** The last requirement of every task must be: run `npm run test` and fix any test failures introduced by the task before marking it complete. A task is not done until the full suite is green.

### 5.2 Unit Testing Principles

- Test pure functions and utilities directly without mocking
- For models, test public methods and computed values through the public API
- Use real data structures, not mock data
- Test edge cases and error states as they would occur in production

### 5.3 Component Testing Principles

- Test components with real data and state, not mocked props
- Use React Testing Library patterns: `render`, `screen`, `fireEvent`, `waitFor`
- Verify user-perceivable outcomes (text, visibility, focus) not internal state
- Test keyboard navigation and ARIA attributes as part of component tests

### 5.4 Integration Testing Principles

- Test complete user flows across multiple components
- Use real data loading patterns
- Verify state management through user actions
- Test error boundaries and loading states as users experience them

### 5.5 E2E Testing Principles

- Test from the user's perspective: navigate, click, type, verify outcomes
- Use real API responses (mock only when external service is unavailable)
- Test across different screen sizes and orientations
- Verify accessibility in real browser environments
- Prioritize critical user journeys over full coverage

### 5.6 Visual Testing Principles (optional)

- Use only as a supplement to functional tests, not a replacement
- Define clear thresholds for acceptable visual changes
- Review visual diffs manually before committing
- Exclude dynamic content (time, random data) from visual comparisons
- Maintain a baseline for stable components only

### 5.7 Test Coverage Targets

- Unit tests: 80%+ coverage for pure functions and utilities
- Component tests: Cover all user interactions and states
- E2E tests: Cover all critical user journeys
- Accessibility: All interactive elements validated

---

## 6. Accessibility Guidelines

### 6.1 Core Principles

Accessibility is not an afterthought — it's built into our design and development process. Our goal is to ensure that users with diverse abilities can use our applications effectively.

**Key principles:**
- **Perceivable:** All information must be presented in ways users can see, hear, or interact with
- **Operable:** All functionality must be accessible via keyboard and screen readers
- **Understandable:** Interface must be predictable and easy to comprehend
- **Robust:** Must work across assistive technologies and future browsers

### 6.2 Keyboard Navigation

**All interactive elements must be keyboard accessible:**
- Tab order follows logical visual layout
- All interactive elements receive focus
- Focus indicators are visible (minimum 2px, high contrast)
- Focus never disappears from the viewport during navigation
- No focus traps in modals or drawers

### 6.3 Screen Reader Support

**ARIA implementation:**
- Use appropriate roles (`role="application"`, `role="button"`, etc.)
- Add `aria-label` to all interactive elements
- Use `aria-live` regions for dynamic content updates
- Ensure proper heading hierarchy
- Test with screen readers (VoiceOver, NVDA, JAWS)

### 6.4 Color & Contrast

**UI components:**
- All text: minimum 4.5:1 contrast (WCAG AA)
- Large text (18pt+): minimum 3:1 contrast
- Interactive elements: minimum 44×44px touch target size
- Disabled states: reduced opacity (50%) but still distinguishable
- No color-only indicators (always paired with icons or text)

### 6.5 Motion & Animation

**Reduced motion support:**
- Respect `prefers-reduced-motion: reduce` media query
- Disable all non-essential animations when reduced motion is enabled
- Transitions must be optional or instant
- All animations under 5 seconds
- No flashing content (avoids seizure triggers)

### 6.6 Testing & Validation

**Automated testing:**
- Axe-core integration in CI/CD pipeline
- Linting rules for ARIA attributes
- Contrast checking for all color combinations

**Manual testing:**
- Keyboard-only navigation testing
- Screen reader testing on critical paths
- User testing with users who use assistive technologies

---

## 7. Monitoring & Analytics

### 7.1 Core Principles

Monitoring and analytics are built into every screen and component. The system follows three foundational principles:

1. **Breadcrumbs:** Track navigation and API interactions with contextual information
2. **Error reporting:** Capture errors and logs per screen with full context
3. **Metrics & analytics:** Measure impressions and interactions per domain component

All monitoring data includes normalized browser information and contextual attributes for correlation and analysis.

### 7.2 Default Attributes

Every monitoring event must include these default attributes:

```ts
interface MonitoringEvent {
  sessionId: string              // Unique session identifier
  pageName: string               // Current page name
  pageViewId: string             // Unique page view identifier
  eventTimestamp: string         // ISO 8601 timestamp
  // Browser normalized attributes
  agent: string                  // Browser engine name
  browser: string                // Browser name
  device: string                 // Device type (desktop, tablet, mobile)
  model: string                  // Device model (if available)
  dimension: {
    width: number                // Viewport width
    height: number               // Viewport height
  }
  // Optional context
  userId?: string                // Authenticated user ID (if available)
  url?: string                   // Current URL
  referrer?: string              // Referrer URL
}
```

### 7.3 Breadcrumbs

**Navigation tracking:**
- Log page navigation events with `pageName`, `pageViewId`, and timestamp
- Track navigation source (link click, button click, back/forward button)
- Maintain breadcrumb trail for session reconstruction

**API interaction tracking:**
- Log all API calls with endpoint, method, duration, and status
- Include request/response size for performance analysis
- Correlate with `pageViewId` and `sessionId`

### 7.4 Error Reporting

**Per-screen error tracking:**
- Errors are logged with the current `pageName` and `pageViewId`
- Include stack trace, error message, and user action context
- Group errors by type and page for analysis

**Error severity levels:**
- `critical`: Application crash or data loss risk
- `high`: Feature broken but app remains usable
- `medium`: Degraded functionality
- `low`: Minor issues with workaround

### 7.5 Metrics per Screen

**Screen metrics:**
- Page load time (from navigation to first contentful paint)
- Time to interactive (all interactive elements ready)
- API response times per screen
- Error rate per screen

### 7.6 Analytics per Screen and Component

**Impression tracking:**
- Record when a component enters the viewport for the first time in a `pageViewId`
- Use Intersection Observer API for accurate viewport detection
- Only report once per component per page view (deduplication by `componentId` + `pageViewId`)

**Interaction tracking:**
- Record all user interactions (clicks, hovers, form submissions)
- Include component hierarchy and interaction type
- Include coordinates for click events (relative to viewport)

### 7.7 Page View ID Management

**Page view lifecycle:**
- Generate new `pageViewId` on initial page load
- Generate new `pageViewId` when user navigates forward via link or button
- Refresh `pageViewId` when user returns to a previous page (back button or navigation)
- Maintain `sessionId` throughout the entire session

### 7.8 Browser Normalization

**Agent detection:**
- Chrome/Chromium: `agent = 'chrome'`
- Firefox: `agent = 'firefox'`
- Safari: `agent = 'safari'`
- Edge: `agent = 'edge'`
- Other: `agent = 'other'`

**Device detection:**
- Desktop: `device = 'desktop'`
- Tablet: `device = 'tablet'` (screen width 768px–1024px)
- Mobile: `device = 'mobile'` (screen width < 768px)

### 7.9 Implementation Strategy

**Analytics service:**
- Centralized `AnalyticsService` class in `lib/analytics.ts`
- Expose methods: `trackPageView()`, `trackImpression()`, `trackInteraction()`, `trackError()`
- Queue events for batch sending to avoid performance impact
- Support multiple destinations (analytics platform, error tracking, custom endpoints)

**React integration:**
- `useAnalytics()` hook for components to access analytics service
- `useViewportObserver()` hook for impression tracking
- Automatic page view tracking on route changes

**Performance considerations:**
- Debounce non-critical events
- Batch events when possible
- Use `navigator.sendBeacon()` for page unload events
- Respect `prefers-reduced-motion` for animation-related metrics

**Privacy considerations:**
- Anonymize user data where possible
- Allow users to opt out of analytics
- Respect Do Not Track header
- No PII stored in analytics events

### 7.10 Screen Analytics Pattern (React Native)

Concrete implementation used in this project. All screens must follow this pattern.

#### Logger instantiation

**Screens registered in the navigation tree** - `monitoringContext` provides `pageName` and `pageViewId` automatically:

```ts
const logger = useLogger(__filename)
```

**Screens without a navigation route** (e.g. `PaywallScreen`, rendered outside the navigator so it has no route name) - override `pageName` and `pageViewId` at module level with a stable `nanoid()`:

```ts
import { nanoid } from "nanoid/non-secure"

const pageName = "Paywall"
const pageViewId = nanoid()
const logger = Logger.for(__filename, "global").with({ pageName, pageViewId })
```

Use `nanoid/non-secure` - it works in Hermes without a crypto API and the non-secure variant is sufficient for analytics IDs.

#### Page load event

Fire once on mount in a `useEffect` with an empty dependency array:

```ts
useEffect(() => {
  logger.analytics("page_load")
}, [])
```

#### Interaction events

Synchronous interactions (navigation, opening a modal):

```ts
logger.analytics("interaction", {
  action: "tap",
  component: "Button",
  intent: "navigate_to_lap_analysis",
})
```

Async interactions (purchases, deletions, external links):

```ts
logger.asyncAnalytics(
  "interaction",
  {
    action: "tap",
    component: "Button",
    intent: "subscribe_monthly",
  },
  () => buyMonthly(),
)
```

`asyncAnalytics` appends `success: true | false` to the logged event automatically and re-throws on failure. The caller owns the `catch` block and any user-facing error alert.

#### Impression events

Fire when a modal, bottom sheet, or overlay becomes visible:

```ts
logger.analytics("impression", {
  component: "DeleteLapModal",
})
```

#### Typed enums (`src/utils/Logger.ts`)

All `action`, `component`, and `intent` values are typed union members. New values must be added to the relevant type in `src/utils/Logger.ts` before use at a call site.

| Type | Current members | Convention |
|------|-----------------|------------|
| `AnalyticsInteractionAction` | `"tap" \| "longpress"` | physical gesture |
| `AnalyticsComponent` | `"Button" \| "ModalConfirm" \| "ModalCancel" \| "DeleteLapModal"` | PascalCase UI element name |
| `AnalyticsInteractionIntent` | `"subscribe_monthly" \| "redeem_promo_code" \| ...` | snake_case user goal |

#### EventInfo conditional type

`Logger.analytics` and `Logger.asyncAnalytics` enforce the correct `info` shape at compile time via a conditional type keyed on `type`:

```ts
type EventInfo<T extends AnalyticsEventType> =
  Partial<MonitoringContext> &
  Record<string, unknown> &
  (T extends "interaction"
    ? { action: AnalyticsInteractionAction; component: AnalyticsComponent; intent: AnalyticsInteractionIntent }
    : T extends "impression"
      ? { component: AnalyticsComponent }
      : unknown)
```

TypeScript infers `T` from the `type` literal at each call site. Passing the wrong shape is a compile error.

---

## 8. Performance Guidelines

### 8.1 Signal Performance (if using signals)

- **Deep equality:** Use `useDeepComputed` for non-JSX derived values; use `useComputed` only for JSX-returning computeds (see §3.2.1)
- **Effect cleanup:** Always clean up effects that subscribe to signals
- **Memoization:** Use `useMemo` for expensive computations

### 8.2 Render Performance

- **Component splitting:** Use React.lazy for code splitting
- **Image optimization:** Use native image optimization or equivalent
- **Canvas optimization:** Use `listening: false` for non-interactive layers

### 8.3 Bundle Size

- **Tree shaking:** Import only what you need
- **Lazy loading:** Load heavy dependencies on demand
- **CDN:** Serve large assets from CDN

---

## 9. Deployment Checklist

### 9.1 Pre-Launch

- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] Error tracking connected (Sentry, etc.)
- [ ] Analytics tracking configured
- [ ] All static assets inlined or CDN configured
- [ ] SSL/HTTPS configured
- [ ] Performance monitoring configured

### 9.2 Post-Launch

- [ ] Monitor error tracking daily for first week
- [ ] Monitor performance metrics weekly
- [ ] Review analytics for user behavior patterns
- [ ] Set up billing alerts if applicable
- [ ] Monitor database query performance

---

---

## 10. Local Vendor Libraries

Two packages in `lib/` are local drop-in replacements for npm packages that cannot run as-is in this project. They are wired at the bundler and test layers so call sites use the standard npm import path unchanged.

---

### 10.1 `lib/binary-parser` - Hermes-compatible binary parser

**Why it exists.** The `binary-parser` npm package generates parsers at build time with `new Function()`. Hermes (the React Native JS engine) disallows `new Function()` at runtime, causing a hard crash. The local implementation replaces code generation with an interpreter loop that reads fields sequentially without `eval`/`new Function`.

**Wiring.** `metro.config.js` intercepts the `binary-parser` module name and redirects it to the local file:

```js
// metro.config.js
resolveRequest(context, moduleName, platform) {
  if (moduleName === 'binary-parser') {
    return {
      filePath: path.resolve(__dirname, 'lib/binary-parser/index.js'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
},
```

**Supported API.** The interpreter supports the subset used in this project:

| Category | Methods |
|----------|---------|
| Primitives | `int8`, `uint8`, `int16le/be`, `uint16le/be`, `int32le/be`, `uint32le/be`, `floatle/be`, `doublele/be` |
| Composite | `string`, `buffer`, `array` (primitive item type only), `nest` (Parser instance), `skip` |
| Config | `endianess('little'|'big')` |

**Implementation excerpt** (`lib/binary-parser/index.js`):

```js
'use strict';

/**
 * Hermes-compatible Parser — drop-in replacement for the `binary-parser` npm
 * package. Uses an interpreter loop instead of `new Function()`, which Hermes
 * blocks at runtime.
 *
 * Supports the subset of the binary-parser API used in this project:
 *   int8, uint8, int16le/be, uint16le/be, int32le/be, uint32le/be,
 *   floatle/be, doublele/be, string, buffer, array (primitive type),
 *   nest (Parser instance), skip, endianess
 */

const { Buffer } = require('buffer');

const PRIMITIVE_SIZE = {
  int8: 1,   uint8: 1,
  int16le: 2, int16be: 2, uint16le: 2, uint16be: 2,
  int32le: 4, int32be: 4, uint32le: 4, uint32be: 4,
  int64le: 8, int64be: 8, uint64le: 8, uint64be: 8,
  floatle: 4, floatbe: 4,
  doublele: 8, doublebe: 8,
};

function readPrimitive(view, offset, type) {
  switch (type) {
    case 'int8':     return view.getInt8(offset);
    case 'uint8':    return view.getUint8(offset);
    case 'int16le':  return view.getInt16(offset, true);
    case 'int16be':  return view.getInt16(offset, false);
    case 'uint16le': return view.getUint16(offset, true);
    case 'uint16be': return view.getUint16(offset, false);
    case 'int32le':  return view.getInt32(offset, true);
    case 'int32be':  return view.getInt32(offset, false);
    case 'uint32le': return view.getUint32(offset, true);
    case 'uint32be': return view.getUint32(offset, false);
    case 'floatle':  return view.getFloat32(offset, true);
    case 'floatbe':  return view.getFloat32(offset, false);
    case 'doublele': return view.getFloat64(offset, true);
    case 'doublebe': return view.getFloat64(offset, false);
    default: throw new Error(`[Parser] Unknown primitive type: ${type}`);
  }
}

class Parser {
  constructor() {
    this._fields = [];
    this._endian = 'le';
  }

  endianess(e) {
    this._endian = e === 'little' ? 'le' : 'be';
    return this;
  }

  _addField(type, name, options) {
    this._fields.push({ type, name, options: options || {} });
    return this;
  }

  // Primitive field helpers
  int8(name, opts)     { return this._addField('int8', name, opts); }
  uint8(name, opts)    { return this._addField('uint8', name, opts); }
  int16le(name, opts)  { return this._addField('int16le', name, opts); }
  int16be(name, opts)  { return this._addField('int16be', name, opts); }
  uint16le(name, opts) { return this._addField('uint16le', name, opts); }
  uint16be(name, opts) { return this._addField('uint16be', name, opts); }
  int32le(name, opts)  { return this._addField('int32le', name, opts); }
  int32be(name, opts)  { return this._addField('int32be', name, opts); }
  uint32le(name, opts) { return this._addField('uint32le', name, opts); }
  uint32be(name, opts) { return this._addField('uint32be', name, opts); }
  floatle(name, opts)  { return this._addField('floatle', name, opts); }
  floatbe(name, opts)  { return this._addField('floatbe', name, opts); }
  doublele(name, opts) { return this._addField('doublele', name, opts); }
  doublebe(name, opts) { return this._addField('doublebe', name, opts); }

  // Composite field helpers
  string(name, opts) { return this._addField('string', name, opts); }
  buffer(name, opts) { return this._addField('buffer', name, opts); }
  array(name, opts)  { return this._addField('array', name, opts); }
  nest(name, opts)   { return this._addField('nest', name, opts); }
  skip(n)            { return this._addField('skip', null, { length: n }); }

  /**
   * Internal interpreter. Returns { result, offset } where offset is the
   * byte position after the last field consumed — used by `nest` to advance
   * the parent parser's cursor.
   */
  _parseAt(buf, startOffset) {
    // DataView offset is relative to its own start (buf.byteOffset already
    // baked in), so our `offset` variable stays relative to buf[0].
    const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
    let offset = startOffset;
    const result = {};

    for (const field of this._fields) {
      const { type, name, options } = field;

      if (type === 'skip') {
        offset += options.length;
        continue;
      }

      if (PRIMITIVE_SIZE[type] !== undefined) {
        result[name] = readPrimitive(view, offset, type);
        offset += PRIMITIVE_SIZE[type];
        continue;
      }

      switch (type) {
        case 'string': {
          const len = options.length;
          let str = buf.slice(offset, offset + len).toString(options.encoding || 'utf8');
          if (options.stripNull) str = str.replace(/\0/g, '').trim();
          result[name] = str;
          offset += len;
          break;
        }

        case 'buffer': {
          const len = options.length;
          result[name] = Buffer.from(buf.slice(offset, offset + len));
          offset += len;
          break;
        }

        case 'array': {
          const itemType = options.type;
          const count = options.length;
          const itemSize = PRIMITIVE_SIZE[itemType];
          if (itemSize == null) throw new Error(`[Parser] Array item type not a primitive: ${itemType}`);
          const arr = new Array(count);
          for (let i = 0; i < count; i++) {
            arr[i] = readPrimitive(view, offset, itemType);
            offset += itemSize;
          }
          result[name] = arr;
          break;
        }

        case 'nest': {
          const sub = options.type._parseAt(buf, offset);
          result[name] = sub.result;
          offset = sub.offset;
          break;
        }

        default:
          throw new Error(`[Parser] Unsupported field type: ${type}`);
      }
    }

    return { result, offset };
  }

  parse(buffer) {
    const buf = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    return this._parseAt(buf, 0).result;
  }
}

exports.Parser = Parser;
```

**Implementation excerpt** (`lib/binary-parser/index.js`):

```ts
/// <reference types="node" />

export interface ParserOptions {
  length?: number | string | ((item: any) => number);
  assert?: number | string | ((item: number | string) => boolean);
  lengthInBytes?: number | string | ((item: any) => number);
  type?: string | Parser;
  formatter?: (item: any) => any;
  encoding?: string;
  readUntil?: 'eof' | ((item: any, buffer: Buffer) => boolean);
  greedy?: boolean;
  choices?: { [key: number]: string | Parser };
  defaultChoice?: string | Parser;
  zeroTerminated?: boolean;
  clone?: boolean;
  stripNull?: boolean;
  key?: string;
  tag?: string | ((item: any) => number);
  offset?: number | string | ((item: any) => number);
  wrapper?: (buffer: Buffer) => Buffer;
}

type PrimitiveTypes =
  | 'uint8' | 'uint16le' | 'uint16be' | 'uint32le' | 'uint32be'
  | 'uint64le' | 'uint64be'
  | 'int8' | 'int16le' | 'int16be' | 'int32le' | 'int32be'
  | 'int64le' | 'int64be'
  | 'floatle' | 'floatbe'
  | 'doublele' | 'doublebe';

type ComplexTypes =
  | 'bit' | 'string' | 'buffer' | 'array' | 'choice'
  | 'nest' | 'seek' | 'pointer' | 'saveOffset' | 'wrapper' | '';

type Types = PrimitiveTypes | ComplexTypes;
type Endianness = 'be' | 'le';

export declare class Parser {
  varName: string;
  type: Types;
  options: ParserOptions;
  endian: Endianness;
  useContextVariables: boolean;

  constructor();
  static start(): Parser;

  uint8(varName: string, options?: ParserOptions): this;
  uint16(varName: string, options?: ParserOptions): this;
  uint16le(varName: string, options?: ParserOptions): this;
  uint16be(varName: string, options?: ParserOptions): this;
  uint32(varName: string, options?: ParserOptions): this;
  uint32le(varName: string, options?: ParserOptions): this;
  uint32be(varName: string, options?: ParserOptions): this;
  int8(varName: string, options?: ParserOptions): this;
  int16(varName: string, options?: ParserOptions): this;
  int16le(varName: string, options?: ParserOptions): this;
  int16be(varName: string, options?: ParserOptions): this;
  int32(varName: string, options?: ParserOptions): this;
  int32le(varName: string, options?: ParserOptions): this;
  int32be(varName: string, options?: ParserOptions): this;
  int64(varName: string, options?: ParserOptions): this;
  int64le(varName: string, options?: ParserOptions): this;
  int64be(varName: string, options?: ParserOptions): this;
  uint64(varName: string, options?: ParserOptions): this;
  uint64le(varName: string, options?: ParserOptions): this;
  uint64be(varName: string, options?: ParserOptions): this;
  floatle(varName: string, options?: ParserOptions): this;
  floatbe(varName: string, options?: ParserOptions): this;
  doublele(varName: string, options?: ParserOptions): this;
  doublebe(varName: string, options?: ParserOptions): this;
  skip(length: ParserOptions['length'], options?: ParserOptions): this;
  utf16le(varName: string, options: ParserOptions): this;
  string(varName: string, options: ParserOptions): this;
  buffer(varName: string, options: ParserOptions): this;
  array(varName: string, options: ParserOptions): this;
  nest(varName: string | ParserOptions, options?: ParserOptions): this;
  endianness(endianness: 'little' | 'big'): this;
  endianess(endianess: 'little' | 'big'): this;
  compile(): void;
  sizeOf(): number;
  parse(buffer: Buffer | Uint8Array): any;
}
```

**`ACRemoteTelemetryParser`** (`src/api/telemetry/parser/ACRemoteTelemetryParser.ts`) is the base class for all telemetry packet parsers. It extends `Parser` and adds:
- A `utf16le(name, opts)` field method - reads raw bytes then decodes as UTF-16 LE on `parse()` (required for ACC car/track name strings).
- A `patch()` wrapper that intercepts `parse()` to run the UTF-16 decoding step after the base parse completes.
- A typed `fromBuffer<T>(buffer: Buffer): T` entry point.

Concrete parsers (e.g. `RTCarInfoParser`) extend `ACRemoteTelemetryParser`, chain field declarations in their constructor, and use the inherited `fromBuffer` to produce typed results:

```ts
export class RTCarInfoParser extends ACRemoteTelemetryParser<TelemetryPacketCar> {
  constructor() {
    super();
    this.endianess('little')
      .floatle('speedKmh')   // Offset: 8
      .floatle('gas')        // Offset: 56
      .floatle('brake')      // Offset: 60
      .floatle('carPositionNormalized') // Offset: 308
      .nest('carCoordinates', {
        type: new Parser().endianess('little').floatle('x').floatle('y').floatle('z')
      });
    // ...all other fields
  }
}
```

---

### 10.2 `lib/babel-signals-transformer` - automatic `useSignals` injection

**Why it exists.** `@preact/signals-react` requires every React component that reads `.value` on a signal to call `useSignals()` at the top of its render. Doing this manually on every component is error-prone and creates noise. The transformer injects the call automatically at build time so components stay clean.

**Wiring.** `babel.config.js` loads the transformer as a plugin after `@react-native/babel-preset`:

```js
// babel.config.js
const signalsTransformerModule = path.resolve(__dirname, './lib/babel-signals-transformer/index.js');

module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [[signalsTransformerModule, {}]],
};
```

**Implementation excerpt** (`lib/babel-signals-transformer/index.js`):

```js
// signals-local-transform.js
const nodePath = require('path');
const { addNamed } = require('@babel/helper-module-imports');

const LOG_PREFIX = '[signals-transform]';

function log(...args) {
  console.log(LOG_PREFIX, ...args);
}

module.exports = function(babel) {
  const { types: t, template } = babel;

  const wrapTemplate = template.statements(`
    USE_SIGNALS();
    LOGGING
    BODY
  `);

  function getUseSignalsId(state) {
    const filename = state.file.opts.filename || "";
    const normalizedFilename = filename.replace(/\\/g, '/');
    
    // 1. Identify the absolute path to your hook
    // We find the 'src' directory and point to hooks/useSignals
    const srcRoot = normalizedFilename.split('/src/')[0] + '/src';
    const targetHookPath = nodePath.join(srcRoot, 'hooks', 'useSignals');

    // 2. Calculate the relative path from the current file to the hook
    let relativeHookPath = nodePath.relative(nodePath.dirname(normalizedFilename), targetHookPath);

    // 3. Ensure the path starts with './' or '../' for Babel/Metro compatibility
    if (!relativeHookPath.startsWith('.')) {
      relativeHookPath = './' + relativeHookPath;
    }
    // Remove extension if present (.ts, .tsx, .js)
    relativeHookPath = relativeHookPath.replace(/\.(ts|tsx|js|jsx)$/, '');
    // Normalize slashes for Windows compatibility
    relativeHookPath = relativeHookPath.replace(/\\/g, '/');

    const cacheKey = `local-useSignals-hook`;
    const added = !state.get(cacheKey);
    
    const id = addNamed(
      state.file.path,
      'useSignals',
      relativeHookPath,
      { nameHint: 'useSignals' }
    );
    
    state.set(cacheKey, id);
    return { id, added };
  }

  return {
    name: "signals-local-transform",
    pre() {
      // Initialize file-specific tracking
      this.fileComponents = [];
      this.importAdded = false;
      this.isTransformed = false;
    },
    visitor: {
      "FunctionDeclaration|ArrowFunctionExpression|FunctionExpression"(fnPath, state) {
        const filename = state.file.opts.filename || "";
        const normalizedPath = filename.replace(/\\/g, '/');
        
        if (!normalizedPath.includes('/src/') || normalizedPath.includes('node_modules')) return;
        if (fnPath.getData('_transformedBySignals')) return;

        const shortFile = normalizedPath.split('/src/').pop();

        // --- IDENTIFICATION LOGIC ---
        let name = null;

        // 1. Direct function name: function FuelStrategy() {}
        if (fnPath.node.id) {
          name = fnPath.node.id.name;
        } 
        
        // 2. Variable declaration: const FuelStrategy = () => {} or const FuelStrategy: React.FC = ...
        if (!name) {
          const variableParent = fnPath.findParent(p => p.isVariableDeclarator());
          if (variableParent && variableParent.node.id.type === 'Identifier') {
            name = variableParent.node.id.name;
          }
        }

        // 3. Export Default fallback
        if (!name && (fnPath.parentPath.isExportDefaultDeclaration() || fnPath.parentPath.parentPath.isExportDefaultDeclaration())) {
          name = nodePath.parse(filename).name;
        }

        // 4. Assignment: FuelStrategy = () => {}
        if (!name && fnPath.parentPath.isAssignmentExpression()) {
          const left = fnPath.parentPath.node.left;
          if (left.type === 'Identifier') name = left.name;
        }

        const isComponent = name && /^[A-Z]/.test(name);
        if (!isComponent) return;

        // --- JSX CHECK ---
        let hasJSX = false;
        fnPath.traverse({
          JSXElement(innerPath) { hasJSX = true; innerPath.stop(); },
          JSXFragment(innerPath) { hasJSX = true; innerPath.stop(); },
          Function(innerPath) { innerPath.skip(); } // Don't look for JSX in sub-functions
        });

        if (!hasJSX) return;

        log(`  TRANSFORMING "${name}" in ${shortFile}`);

        try {
          fnPath.setData('_transformedBySignals', true);
          const useSignalsId = getUseSignalsId(state);
          if (useSignalsId.added) this.importAdded = true;

          const bodyPath = fnPath.get("body");

          const bodyNodes = bodyPath.isBlockStatement() 
            ? bodyPath.node.body 
            : [t.returnStatement(bodyPath.node)];

          const wrapped = wrapTemplate({
            USE_SIGNALS: useSignalsId.id,
            BODY: bodyNodes,
            LOGGING: t.expressionStatement(
              t.callExpression(t.memberExpression(t.identifier('console'), t.identifier('log')), [
                t.stringLiteral(`${LOG_PREFIX} Tracking signals for component '${name}' with '${useSignalsId.id.name}()'`)
              ])
            ),
          });

          bodyPath.replaceWith(t.blockStatement(wrapped));
          this.fileComponents.push(name);
          this.isTransformed = true;
          log(`    OK - "${name}" transformed successfully`);
        } catch (err) {
          log(`    ERROR transforming "${name}" in ${shortFile}: ${err.message}`);
          log(`    Stack: ${err.stack}`);
        }
      }
    },
    post(state) {
      // At the end of each file, if we did work, add it to the summary
      if (this.isTransformed) {
        const filename = state.opts.filename || "unknown";
        const shortFile = filename.replace(/\\/g, '/').split('/src/').pop();

        // log('\n\n')
        // log(`--- TRANSFORMED SOURCE: ${shortFile} ---`);
        // log(state.path.toString()); 
        // log(`--- END SOURCE ---\n\n`);
      }
    }
  };
};
```

The transformer is NOT applied in Vitest. Vitest uses its own module resolver (controlled by `vitest.config.ts` `resolve.alias`) and does not run `babel.config.js` plugins.

**How it works.** The Babel visitor fires on every `FunctionDeclaration`, `ArrowFunctionExpression`, and `FunctionExpression` inside `src/`. For each function it:

1. Determines the component name by inspecting the function's own `id`, parent `VariableDeclarator`, `export default`, or assignment left-hand side.
2. Skips anything that does not start with an uppercase letter (not a React component).
3. Traverses the function body to check whether it contains JSX. Skips functions with no JSX.
4. For JSX-bearing PascalCase functions, inserts a `useSignals()` call at the top of the function body using `@babel/helper-module-imports` to add a named import from the local hook path.

**Effective transform** - what the transformer produces for a component at `src/screens/Foo.tsx`:

```ts
// source written by developer
export function Foo() {
  return <Text>{mySignal.value}</Text>
}

// output after transform (import path is relative, computed at build time)
import { useSignals as useSignals_1 } from '../hooks/useSignals'

export function Foo() {
  useSignals_1()
  console.log("[signals-transform] Tracking signals for component 'Foo' with 'useSignals_1()'")
  return <Text>{mySignal.value}</Text>
}
```

**`src/hooks/useSignals.ts`** is the hook that the transformer imports. It is a thin wrapper that delegates to the official `@preact/signals-react/runtime` entry point:

```ts
import { useSignals as useRuntimeSignals } from "@preact/signals-react/runtime";

export function useSignals() {
  useRuntimeSignals();
}
```

This indirection allows the transformer to import from a stable local path (`src/hooks/useSignals`) that can be updated independently of the signals runtime.

**Rules for component authors:**
- Write components normally - no manual `useSignals()` call needed.
- The transform applies only to functions in `src/` (not `node_modules`).
- A function is transformed only if it has a PascalCase name AND contains JSX - utility functions, hooks (`use*`), and render helpers that return primitives are not touched.
- In Vitest, the transform does not run. Tests that import screen or component files must mock all native/third-party imports via `vi.mock()` in `vitest.setup.ts` since the transformer is not present to handle them.

*End of Generic Architecture Guidelines v1.0*
