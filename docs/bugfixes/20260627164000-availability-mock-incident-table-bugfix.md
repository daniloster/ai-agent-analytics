# Bugfix Specification: Availability Mock Distribution and Incident Table Removal
**Timestamp:** 20260627164000
**Status:** Approved for Implementation

### 1. Requirements & Accessibility Evaluation
- **Business/User Impact:** (1) Platform availability demo shows mostly red boxes (uptime 90-100 uniform = ~90% below 99.0) which misrepresents a healthy system. Fix: 80% of days should be green (>=99.9%), ~10% yellow, ~10% red. (2) Incident table below the availability heatmap is not required and should be removed.
- **Accessibility (a11y) Impact:** Removing the incident table eliminates a data table from the DOM. No replacement or equivalent is needed - incident details remain in the footer stats and day-box hover titles.

### 2. Technical Specification
- **Root Cause:** (1) `buildDailyArray` for `availability_by_day` uses `{ min: 90, max: 100 }` uniform distribution - values 90-98.999 (90% of range) render as red. (2) `{d && d.incidents.length > 0 && <IncidentTable incidents={d.incidents} />}` renders below the heatmap.
- **Compliance Check:** Both changes are minimal targeted edits. No new files. Complies with ARCHITECTURE.md and CLAUDE.md.

### 3. Implementation Plan
- **`src/lib/mock/generators/reliability.ts`**: Replace uniform `{ min: 90, max: 100 }` with a 3-zone random: 80% chance of [99.9, 100], 10% chance of [99.0, 99.9], 10% chance of [90.0, 99.0].
- **`src/components/sections/Reliability.tsx`**: Remove `{d && d.incidents.length > 0 && <IncidentTable ... />}` block and the `IncidentTable` import.
- **`src/components/sections/Reliability.test.tsx`**: Remove `incidents = [] renders no IncidentTable` and `incidents with entries renders IncidentTable` tests; update `RELIABILITY` fixture `incidents` length check if needed.

### 4. Verification & Testing Strategy
- **New Test Scenarios:** Generator test: assert that in a 30-day run, at least 70% of `uptime_pct` values are >= 99.9 (probabilistically safe with a fixed seed).
- **Regression Strategy:** `npm run test`
