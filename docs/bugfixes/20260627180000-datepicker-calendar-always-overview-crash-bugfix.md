# Bugfix Specification: DateRangePicker Calendar Always-Visible + Overview Crash
**Timestamp:** 20260627180000
**Status:** Approved for Implementation

### 1. Requirements & Accessibility Evaluation
- **Business/User Impact:** (1) Calendar is only shown when the 'Custom' preset is selected; users expect it always visible. Shortcut buttons (7d/30d/90d) don't reflect the selected range on the calendar. (2) Selecting from > to in the calendar crashes the entire app with "Cannot read properties of undefined (reading 'map')".
- **Accessibility (a11y) Impact:** Using `mode="range"` on Calendar gives screen readers proper ARIA range selection semantics built in to react-day-picker. The crash leaves keyboard users with no way to recover without refresh.

### 2. Technical Specification
- **Root Cause (Calendar):** `DateRangePicker` wraps the two `Calendar` elements in `{preset === 'custom' && ...}`. `mode="single"` is used with no range highlighting. The 'Custom' preset button only switches the preset flag; it adds no value.
- **Root Cause (Overview crash):** `queryFn` for `timeseries` and `overview` queries do not check `response.ok`. The mock handler returns `{ error: 'Invalid date range' }` with HTTP 400 when `from > to`. TanStack Query resolves the query (no throw) so `ts = { error: '...' }`. `ts` is truthy and defined, so `ts?.points` returns `undefined`. Every `ts?.points.map(...)` call then runs `undefined.map(...)` which throws. Same applies to `for (const p of ts.points)` and `ts.points.filter(...)` inside the costSeries IIFE.
- **Compliance Check:** All changes are functional corrections. No new abstractions. queryFn `response.ok` check is standard defensive API practice. Calendar redesign stays within the same component file.

### 3. Implementation Plan
- **`src/components/filters/DateRangePicker.tsx`:**
  - Remove 'Custom' from PRESETS (keep 7d, 30d, 90d).
  - Remove `{preset === 'custom' && ...}` guard.
  - Replace two `mode="single"` Calendars with one `Calendar mode="range" numberOfMonths={2}`.
  - `selected` prop is `{ from: new Date(from), to: new Date(to) }`.
  - `onSelect` maps `DateRange | undefined` back to signal: `from=range.from, to=range.to ?? range.from`.
  - `defaultMonth` points to the from date.
- **`src/components/ui/calendar.tsx`:**
  - Add `range_start`, `range_end`, `range_middle` classNames for range mode visual highlighting.
- **`src/components/sections/Overview.tsx`:**
  - Add `response.ok` guard in both `timeseries` queryFns and `overview` queryFn — throw on non-2xx so TanStack Query puts query in error state and `ts`/`d` stay `undefined`.
- **`src/components/filters/DateRangePicker.test.tsx`:**
  - Remove "clicking Custom sets dateRange preset to custom" test (no Custom button).
  - Remove "calendar pickers absent when preset is non-custom" test.
  - Update "calendar pickers visible when preset is custom" → "calendar is always visible".
  - Add "onSelect with range sets dateRange.from and dateRange.to".
- **File System Hygiene Re-evaluation:** No renames needed.

### 4. Verification & Testing Strategy
- **New Test Scenarios:**
  - Calendar renders immediately without pressing any preset button.
  - Selecting a range via `onSelect` sets `dateRange.from` and `dateRange.to`.
- **Regression Strategy:**
  ```bash
  npm run test
  ```
