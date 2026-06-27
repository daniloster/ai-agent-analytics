# Bugfix Specification: DateRangePicker Wrong Range + UX Redesign
**Timestamp:** 20260627183000
**Status:** Approved for Implementation

### 1. Requirements & Accessibility Evaluation
- **Business/User Impact:** (1) Calendar range selection produces incorrect dates (shifted back 1+ days) in UTC+ timezones. (2) Clicking the first date of a custom range adjusts the existing applied range rather than starting a fresh selection. (3) Changes to the date filter apply immediately without confirmation, changing dashboard data while the user is still picking.
- **Accessibility (a11y) Impact:** `aria-live="polite"` region inside the popover announces the pending selection ("Select end date" / "Apr 1 - Apr 30") so screen readers track progress without requiring visual inspection. Apply button has explicit `aria-label`. Dismiss via Escape clears pending and closes popover naturally via Radix Popover.

### 2. Technical Specification
- **Root Cause (wrong dates):** `toISODate` calls `d.toISOString().slice(0, 10)` which formats in UTC. DayPicker creates dates at local midnight (`new Date(y, m, d)`). In any UTC+ timezone, local midnight is the previous UTC day, so the stored ISO string is off by 1 day.
- **Root Cause (range reset):** When `selected` has both `from` and `to` set, DayPicker's `addToRange` extends the existing range on click instead of starting fresh. The first click moves `from` (if the new date is before `from`) or `to` (if after `from`), never resets. This means the first click appears to jump to a different range mid-flight. Fix: pass `resetOnSelect={pending.value === null}` to Calendar — when there is no in-progress pending selection, the first click always resets to `{ from: date, to: undefined }`.
- **UX redesign (per industry research):** Presets apply instantly and close the popover. Calendar is always visible. Custom selection is a two-step flow: first click starts a fresh pending range (`resetOnSelect`); second click completes it. A pending summary line and Apply/Cancel footer appear below the calendar once both dates are selected. The trigger label shows the *applied* range only — never the in-progress pending range.
- **Compliance Check:** `useSignal` for local component state is the pattern used throughout the project (SectionNav, etc.). No new abstractions introduced.

### 3. Implementation Plan
- **`src/components/filters/DateRangePicker.tsx`** - Full rewrite:
  - `localISODate(d)` replaces `toISODate(d)` — uses `getFullYear()/getMonth()/getDate()` (local, not UTC).
  - `useSignal<DayPickerDateRange | null>(null)` for `pending` (transient calendar state).
  - `useSignal<boolean>(false)` for `isOpen` (controlled Popover, needed to close on preset/apply).
  - `handleOpenChange` clears `pending` on dismiss.
  - `handleCalendarSelect` stores `range` into `pending` only (never touches `dateRange` signal directly).
  - `Calendar` receives `resetOnSelect={pending.value === null}` so first click always starts fresh.
  - Footer row with pending summary + Apply/Cancel appears only when `pending.value?.to` is defined.
  - `applyPreset`: clears pending, writes to `dateRange`, closes popover.
  - `applyPending`: converts pending dates via `localISODate`, writes to `dateRange`, clears pending, closes popover.
- **`src/components/filters/DateRangePicker.test.tsx`** - Update tests for new flow.
- **File System Hygiene Re-evaluation:** No renames needed.

### 4. Verification & Testing Strategy
- **New Test Scenarios:**
  - Calendar is visible when popover opens without clicking any preset.
  - First calendar click sets pending from, no trigger label change.
  - Second calendar click sets pending to, Apply footer appears.
  - Apply commits pending to dateRange and closes (signal update verifiable).
  - Preset applies immediately without pending state.
  - `localISODate` returns correct local date regardless of UTC offset.
- **Regression Strategy:**
  ```bash
  npm run test
  ```
