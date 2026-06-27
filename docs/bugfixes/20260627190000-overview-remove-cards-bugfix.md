# Bugfix Specification: Overview - Remove Unwanted Cards and Chart Sections
**Timestamp:** 2026-06-27T19:00:00
**Status:** Approved for Implementation

### 1. Requirements & Accessibility Evaluation
- **Business/User Impact:** The Overview page contains six visual elements that are no longer required: the Seat Adoption donut chart, the Activation Funnel bar chart, and four KPI cards (Acceptance Rate, Cost/Accepted Output, Avg Run Duration, MoM Usage Growth). Removing them reduces visual noise and focuses the dashboard on the most actionable metrics.
- **Accessibility (a11y) Impact:** Two `<figure>` elements with `aria-label` attributes are removed. No remaining elements are affected.

### 2. Technical Specification
- **Root Cause:** Design decision - these elements are present but no longer wanted.
- **Elements to remove:**
  - Row 4: `<figure aria-label="Seat adoption">` (DonutChart) and `<figure aria-label="Activation funnel">` (BarChart) + their grid wrapper
  - Row 5: KpiCards for Acceptance Rate, Cost/Accepted Output, Avg Run Duration, MoM Usage Growth + grid wrapper
- **Dead code to clean up:**
  - `DonutChart` import (unused after removal)
  - `BarChart` import (unused after removal)
  - `formatDuration` import (unused after removal)
  - `computeCostPerAcceptedOutput` import (unused after removal)
  - `costPerAcceptedOutput` local variable (unused)
  - `activatedCount` local variable (unused)
- **Compliance Check:** Pure deletion. No new patterns introduced.

### 3. Implementation Plan
- **Proposed Changes:**
  - `src/components/sections/Overview.tsx` - Remove rows 4 and 5, dead imports, and dead locals.
- **File Name & Structural Hygiene Re-evaluation:** No rename needed.

### 4. Verification & Testing Strategy
- **Updated Test Scenarios:**
  - `Overview.test.tsx`: Update "renders exactly 12 KpiCard instances" to expect 8 (12 - 4 removed cards).
- **Regression Strategy:** `npm run test`
