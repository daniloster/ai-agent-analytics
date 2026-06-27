# Bugfix Specification: Remove Team Table Card Header and Footer
**Timestamp:** 20260628000100
**Status:** Approved for Implementation

### 1. Requirements & Accessibility Evaluation
- **Business/User Impact:** The "Team Performance" title bar, Filter/Export CSV buttons, and "Showing N teams" / Prev-Next pagination are unwanted chrome. Remove them while keeping the table column headers (TeamTable's TableHeader row).
- **Accessibility (a11y) Impact:** Removing non-functional buttons (Filter, Export CSV, Prev, Next) reduces noise for keyboard/screen-reader users. The table itself retains all column headers and ARIA semantics.

### 2. Technical Specification
- **Root Cause:** The card wrapper with header and footer was added in a prior session. The outer `<div className="rounded-lg border bg-card shadow-sm overflow-hidden">` plus its header and footer divs are the elements to remove. The `<TeamTable>` element inside is kept as-is.
- **Compliance Check:** Deletion-only change in `TeamBreakdown.tsx`. No new files, no logic, no state. Compliant with ARCHITECTURE.md and CLAUDE.md.

### 3. Implementation Plan
- **`src/components/sections/TeamBreakdown.tsx`**: Replace the entire card wrapper (outer div + header div + footer div) with just `<TeamTable teams={data.teams} orgAvgFailedRunRate={orgAvgFailedRunRate} />`. Keep the surrounding `space-y-4` container.
- **File Name & Structural Hygiene:** No renames needed.

### 4. Verification & Testing Strategy
- **New Test Scenarios:** Assert "Team Performance", "Filter", "Export CSV", "Showing" text absent; table still renders.
- **Regression Strategy:** `npm run test`
