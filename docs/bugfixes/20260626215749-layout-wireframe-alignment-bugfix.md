# Bugfix Specification: Layout & Wireframe Alignment
**Timestamp:** 20260626215749
**Status:** Approved for Implementation

---

### 1. Requirements & Accessibility Evaluation

- **Business/User Impact:** Dashboard does not match the approved wireframe design. Incorrect page padding, header height, nav tab style, KPI card value sizing, missing chart card containers, and wrong axis label size all compound into a dashboard that looks generic and unpolished.
- **Accessibility (a11y) Impact:** Nav active state is conveyed only via color (`text-primary`) with no structural/focus indicator. Fix adds `aria-current="page"` (already present) and a visible underline border so it is not color-only. KPI card value increase from 24px to 28px improves readability. No ARIA regressions introduced.

---

### 2. Technical Specification

**Root Cause (6 distinct issues):**

1. **CSS tokens** - `index.css` uses shadcn defaults, not the wireframe design system. `--primary` is near-black (`222.2 47.4% 11.2%`) instead of blue (`#2563eb`). `--foreground`, `--muted-foreground`, and `--border` are slightly off. The whole visual language diverges.

2. **DashboardLayout** - Header has no explicit height (no `h-14`), no horizontal padding (`px-8`). Main content area has no padding or max-width. FilterBar is inside header but not aligned right.

3. **SectionNav** - Active tab uses `text-primary font-medium` with no bottom border indicator. Nav links have no explicit padding or font-size. Looks like plain links, not a tab bar.

4. **KpiCard** - Value uses `text-2xl` (24px) instead of 28px. No `letter-spacing: -1px`. `CardHeader`/`CardContent` have default `p-6` shadcn padding instead of the wireframe's 20px. `DeltaBadge` uses `rounded` instead of `rounded-full` and uses Tailwind emerald/red rather than the exact wireframe hex colors.

5. **Chart containers (Overview.tsx)** - Charts are wrapped in bare `<figure>` elements with a plain `<figcaption>`. The wireframe wraps each chart in a white card (`bg-white border border-border rounded-lg shadow-sm p-6`) with a `font-semibold` title and a `text-muted-foreground text-xs` subtitle.

6. **Axis font size** - `Axis.tsx` uses `fontSize: 11` for tick labels. Wireframe specifies `font-size: 10px`.

**Compliance Check:** All changes are CSS/className/prop changes only. No new files required. All components remain functional. No ARCHITECTURE.md rules violated (functional components, named exports, no class components).

---

### 3. Implementation Plan

**File: `src/index.css`**
- Update CSS custom properties to match wireframe hex tokens:
  - `--foreground`: `240 10% 3.9%` (= #09090b)
  - `--card-foreground`: `240 10% 3.9%`
  - `--popover-foreground`: `240 10% 3.9%`
  - `--primary`: `217 91% 60%` (= #2563eb)
  - `--primary-foreground`: `0 0% 100%` (white text on blue)
  - `--secondary`: `177 44% 31%` (= #0d9488 teal)
  - `--muted-foreground`: `240 4% 46%` (= #71717a)
  - `--border`: `240 5% 90%` (= #e4e4e7)
  - `--input`: `240 5% 90%`
  - `--ring`: `217 91% 60%`

**File: `src/components/layout/DashboardLayout.tsx`**
- Header: add `h-14 px-8 flex items-center justify-between`, add logo span, move FilterBar to right
- Main: add `px-8 py-7 max-w-[1440px] mx-auto`

**File: `src/components/layout/SectionNav.tsx`**
- Nav container: `flex border-b border-border px-8`
- Per tab: `px-4 py-3 text-[13px] font-medium border-b-2 -mb-px` with active `border-zinc-900 text-zinc-900` / inactive `border-transparent text-muted-foreground`

**File: `src/components/kpis/KpiCard.tsx`**
- Override `CardHeader` padding: `className="p-5"`
- Override `CardContent` padding: `className="px-5 pb-5 pt-0"`
- Value `div`: `text-[28px] font-bold leading-none tracking-tight` (was `text-2xl font-bold`)
- `DeltaBadge`: `rounded-full` (was `rounded`), inline style colors matching wireframe

**File: `src/components/sections/Overview.tsx`**
- Wrap each `<figure>` in a card container: `<div className="rounded-lg border bg-card shadow-sm">`
- Move `<figcaption>` inside the card as title+subtitle with proper typography

**File: `src/components/charts/primitives/Axis.tsx`**
- Change all three axis `tickLabelProps` from `fontSize: 11` to `fontSize: 10`

**File Name & Structural Hygiene:** No renames needed. No structural re-arrangement required.

---

### 4. Verification & Testing Strategy

- **New Test Scenarios:**
  - `KpiCard.test.tsx` (existing): verify value text is present (content test - no change needed since tests query text, not font-size)
  - `DashboardLayout.test.tsx` (existing, if present): no structural breaks
  - Visual check: `npm run dev` + browser inspection of spacing, colors, nav tab active underline

- **Regression Strategy:** `npm run test`

---
