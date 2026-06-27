# Bugfix Specification: Donut Legend Overlay, Table Overflow, Sort Icon Stacking, Dashed Test Failures
**Timestamp:** 20260627204700
**Status:** Approved for Implementation

### 1. Requirements & Accessibility Evaluation
- **Business/User Impact:**
  - Bug 1: Donut legend overlays the chart at narrow card widths - unreadable, chart and legend are indistinguishable
  - Bug 2: Table content overflows its container without a scrollbar - data is hidden and unreachable on small viewports
  - Bug 3: Sort icon (▼/▲) wraps to a second line in narrow `<th>` cells - visually broken column headers, misleading affordance
  - Bug 4: 2 tests fail asserting `strokeDasharray="4 2"` but the implementation produces `"4 4"` at default strokeWidth=2

- **Accessibility (a11y) Impact:**
  - Bug 2 (table scroll): wrapping with `overflow-x-auto` preserves keyboard navigation into the table; screen readers still traverse all cells. No ARIA changes needed.
  - Bug 3 (sort header): broken text layout may confuse screen readers that read the `<th>` content as a fragmented string. Fixing layout keeps the text and icon as a single inline run.
  - No ARIA attributes are added or removed for any fix.

### 2. Technical Specification
- **Root Cause:**
  - Bug 4: A linter auto-format changed `"4 2"` in `Area.tsx:113` to the template literal `` `4 ${strokeWidth * 2}` ``. At the default `strokeWidth = props.strokeWidth ?? 2 = 2`, this produces `"4 4"`. The two failing tests assert `=== '4 2'`. Fix: update test assertions to match the current implementation output `"4 4"` (user requirement: fix tests without changing implementation).
  - Bug 1: `<div className="flex items-center gap-8">` in `Reliability.tsx:410` and `Billing.tsx:492` has no `flex-wrap`. When the card is narrow, both children (DonutChart + DonutLegend) remain on one row, DonutLegend slides over the chart.
  - Bug 2: `TeamTable`, `ChargebackTable`, and `IncidentTable` return `<Table>` directly. The `Table` component renders `<table className="w-full">` - it expands to content width when content exceeds container, but with no `overflow-x-auto` ancestor the overflow is invisible and inaccessible.
  - Bug 3: `TableHead` in `table.tsx` has no `whitespace-nowrap`. Sort indicator strings like `" ▼"` are appended inline to the header text. When `<th>` width is constrained by the table layout algorithm, the combined text wraps, putting the icon on a second line.

- **Compliance Check:**
  - All components use named exports and React functional components - compliant with ARCHITECTURE.md.
  - No class components, no default exports, no `any` introduced.
  - Test changes follow the co-location rule (`foo.ts` -> `foo.test.ts`).
  - No new files created beyond necessity.

### 3. Implementation Plan
- **Proposed Changes:**
  - `src/components/charts/marks/Area.test.tsx`: Update dashed test name and assertion from `'4 2'` to `'4 4'`
  - `src/components/charts/AreaChart.test.tsx`: Same update
  - `src/components/sections/Reliability.tsx`: Line 410 - add `flex-wrap` to donut+legend wrapper
  - `src/components/sections/Billing.tsx`: Line 492 - same
  - `src/components/ui/table.tsx`: Add `whitespace-nowrap` to `TableHead` default className
  - `src/components/kpis/TeamTable.tsx`: Wrap return in `<div className="overflow-x-auto">`
  - `src/components/kpis/ChargebackTable.tsx`: Same
  - `src/components/kpis/IncidentTable.tsx`: Same

- **File Name & Structural Hygiene Re-evaluation:** No renames needed. All files retain their scope.

### 4. Verification & Testing Strategy
- **New Test Scenarios:**
  - `src/components/sections/Reliability.test.tsx`: assert donut wrapper has `flex-wrap` class
  - `src/components/sections/Billing.test.tsx`: same
  - `src/components/ui/table.test.tsx`: assert `TableHead` renders with `whitespace-nowrap`
  - `src/components/kpis/TeamTable.test.tsx`: assert outermost container has `overflow-x-auto`
  - `src/components/kpis/ChargebackTable.test.tsx`: same
  - `src/components/kpis/IncidentTable.test.tsx`: same

- **Regression Strategy:** `npm run test`
