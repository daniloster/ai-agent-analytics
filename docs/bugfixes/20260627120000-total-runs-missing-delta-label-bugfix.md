# Bugfix Specification: Total Runs Card Missing "vs last month" Delta Label
**Timestamp:** 2026-06-27T12:00:00
**Status:** Approved for Implementation

### 1. Requirements & Accessibility Evaluation
- **Business/User Impact:** The Total Runs KPI card displays a delta percentage badge but no contextual label beneath it, leaving users without the comparison context ("vs last month"). The wireframe at `docs/wireframes/html/01-executive-overview.html` explicitly shows a `.kpi-sub` span with text "vs last month" alongside the delta badge.
- **Accessibility (a11y) Impact:** The `deltaLabel` text is rendered as visible `<span>` text with `text-muted-foreground` styling. No ARIA changes are needed - the label is purely supplemental visual context next to the badge, which already has sufficient text content.

### 2. Technical Specification
- **Root Cause:** `src/components/sections/Overview.tsx` renders the Total Runs `KpiCard` (line 260-272) with `delta` but without the `deltaLabel` prop. The `KpiCard` `DeltaBadge` sub-component already accepts and renders `deltaLabel` when provided - the prop is wired up in the component. The omission is purely at the call site.
- **Compliance Check:** Fix is a single-prop addition at the call site. No architectural change, no new files, no pattern deviation. Fully compliant with `ARCHITECTURE.md` and `CLAUDE.md`.

### 3. Implementation Plan
- **Proposed Changes:**
  - `src/components/sections/Overview.tsx` - Add `deltaLabel="vs last month"` to the Total Runs `KpiCard` props (line 268, after the closing `}` of the `delta` prop expression).
- **File Name & Structural Hygiene Re-evaluation:** No rename or restructure needed.

### 4. Verification & Testing Strategy
- **New Test Scenarios:**
  - `src/components/sections/Overview.test.tsx`: assert that after data loads, the text "vs last month" is present in the rendered output.
- **Regression Strategy:** `npm run test`
