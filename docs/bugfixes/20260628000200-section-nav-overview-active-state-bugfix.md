# Bugfix Specification: SectionNav Overview Active State on Scroll-Back
**Timestamp:** 20260628000200
**Status:** Approved for Implementation

### 1. Requirements & Accessibility Evaluation
- **Business/User Impact:** When the user scrolls down just enough to trigger the SectionNav to switch from Overview to Teams, then scrolls back up, the active section stays on "Teams" instead of reverting to "Overview". The nav tab appears misleading - it shows Teams as active while the user is viewing Overview content.
- **Accessibility (a11y) Impact:** The `aria-current="true"` attribute stays on the Teams link after scrolling back up. Screen-reader users navigating the SectionNav will hear "Teams, current" even when they are positioned at the Overview section. The fix restores the correct `aria-current` to Overview on scroll-back, ensuring the nav correctly communicates the user's current section to assistive technology.

### 2. Technical Specification
- **Root Cause:** `IntersectionObserver` only fires when an element's intersection state *changes* (crosses a threshold). When the user scrolls minimally:
  1. Overview was already `isIntersecting: true` before the scroll (it was fully visible).
  2. Teams crosses the 0.4 threshold → IO fires for Teams with `isIntersecting: true` → `activeSection = "teams"`.
  3. User scrolls back up → Overview was NEVER `isIntersecting: false`, so its intersection state hasn't changed, so the IO does NOT re-fire `isIntersecting: true` for Overview.
  4. Result: `activeSection` stays "teams" indefinitely.

  The scroll event handler only sets `userHasScrolled.current = true` and does nothing else, so there is no fallback to detect "we are back at the top".

- **Compliance Check:**
  - `SectionNav` is a functional component with named export - compliant with ARCHITECTURE.md.
  - The fix uses `activeSection` (a signal from `useSignal`) - no new state, stays within existing signal ownership.
  - The fix modifies only the existing scroll `useEffect` - no new hooks or abstractions needed.
  - Test lives in `SectionNav.test.tsx` (co-located) - compliant.

### 3. Implementation Plan
- **Proposed Changes:**
  - `src/components/layout/SectionNav.tsx`: In the scroll `useEffect` handler, after setting `userHasScrolled.current = true`, check `window.scrollY < 100`. If true, force `activeSection.value = "overview"` and call `setSectionInUrl("overview")`. This handles the case where IO won't re-fire for Overview because it never left the viewport.
  - `src/components/layout/SectionNav.test.tsx`: Add one new test covering the scroll-back-to-overview bug scenario.

- **File Name & Structural Hygiene Re-evaluation:** No renaming or restructuring required. The fix is contained within the existing scroll `useEffect`.

### 4. Verification & Testing Strategy
- **New Test Scenarios:**
  - Test: After IO sets Teams active, firing a scroll event (scrollY=0 in jsdom, which is < 100) must restore Overview as active.
  - This test fails before the fix (no scroll-back logic exists) and passes after.

- **Regression Strategy:** `npm run test`
