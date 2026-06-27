# Bugfix Specification: Runs and Cost Charts Side-by-Side
**Timestamp:** 20260627235900
**Status:** Approved for Implementation

### 1. Requirements & Accessibility Evaluation
- **Business/User Impact:** "Runs per team" and "Cost per team" stack vertically, wasting horizontal space and making comparison harder. They should sit side-by-side in a 2-column grid.
- **Accessibility (a11y) Impact:** No ARIA changes; both figures retain their aria-label and figcaption. Layout change only.

### 2. Technical Specification
- **Root Cause:** Both `<figure>` elements are direct children of the `space-y-4` flex column. No grid wrapper groups them.
- **Compliance Check:** Pure layout change in JSX; no new files, no state, no logic. Compliant with all ARCHITECTURE.md and CLAUDE.md rules.

### 3. Implementation Plan
- **`src/components/sections/TeamBreakdown.tsx`**: Wrap the two figures in `<div className="grid grid-cols-2 gap-4">`.
- **File Name & Structural Hygiene:** No renames needed.

### 4. Verification & Testing Strategy
- **New Test Scenarios:** Add assertion that both figcaptions appear inside a common grid wrapper.
- **Regression Strategy:** `npm run test`
