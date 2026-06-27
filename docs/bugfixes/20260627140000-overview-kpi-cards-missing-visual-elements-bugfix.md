# Bugfix Specification: Overview KPI Cards Missing Visual Elements

**Timestamp:** 20260627140000
**Status:** Approved for Implementation

### 1. Requirements & Accessibility Evaluation

- **Business/User Impact:** The first 8 KPI cards in the Overview section are missing visual elements shown in the wireframe (`docs/wireframes/html/01-executive-overview.html`). The wireframe specifies 7 cards should display a small sparkline chart (axes hidden, trend-only) and 1 card (Quality Score) should display a 5-star rating with yellow fill proportional to the score. Without these, the cards feel information-sparse and the quality score lacks an at-a-glance visual encoding.

- **Accessibility (a11y) Impact:**
  - Sparklines are purely decorative trend indicators - they carry no data the user cannot read from the numeric value and delta badge. They are rendered inside `<Visualization>` which wraps a `<figure aria-label="...">`. Hidden axes and no tooltip needed for these micro-charts.
  - Star rating must have an accessible label. The visible ★/☆ glyphs are `aria-hidden="true"`. A wrapping `<div aria-label="Rating: X out of 5 stars">` provides the equivalent text for screen readers.

---

### 2. Technical Specification

- **Root Cause:** The KPI cards in `Overview.tsx` are missing `trend` props on the cards that have per-day timeseries backing data, and the Quality Score card is missing a star-rating visual. `KpiCard` already supports a `trend` prop (renders `SparklineChart` via `Visualization`), but no trend data is wired in for the overview cards. `KpiCard` has no `starRating` prop at all.

- **Data availability audit** (against `TimeseriesPoint`):
  - Total Runs → `p.runs` ✓
  - Total Cost → `p.cost` ✓
  - Success Rate → `100 - p.error_rate` ✓
  - Quality Score → `d.avg_quality_score` (single value, not per-day) → stars
  - Monthly Active Users, Seat Adoption, Retention Cost, Cost/Quality Pt → **no per-day data in `TimeseriesPoint`**; sparklines cannot be added without fabricating metrics.

- **Compliance Check:**
  - ARCHITECTURE.md §4.3: Component style - function declarations, named exports. `StarRating` sub-component hoisted above `KpiCard`.
  - ARCHITECTURE.md §4.4: Hoist pure data - star fill logic is a pure function, defined outside the component.
  - CLAUDE.md: No features beyond the ask. No new files unless strictly necessary. No progress bars or other wireframe elements not explicitly requested.

---

### 3. Implementation Plan

#### `src/components/kpis/KpiCard.tsx`

Add two optional props to `KpiCardProps`:
- `starRating?: number | null` - 1-5 numeric score; renders star visualization when a `number`
- `starRatingSubtext?: string` - optional line below the stars (e.g., "Based on 8,200 rated runs")

Add private `StarRating` sub-component (hoisted above `KpiCard`):
- Renders 5 `★` glyphs: `Math.round(rating)` filled in `#f59e0b` (amber), remainder in `#d4d4d8` (zinc-300)
- Wrapping `<div>` carries `aria-label="Rating: X.X out of 5 stars"`; glyphs are `aria-hidden="true"`

Render order inside `CardContent`: existing value/delta block → trend sparkline (if `trend`) → stars (if `typeof starRating === 'number'`)

#### `src/components/sections/Overview.tsx`

Wire `trend` + `trendColor` onto 3 KpiCards from `ts?.points`:

| Card | Field | Color |
|------|-------|-------|
| Total Runs | `p.runs` | `#2563eb` |
| Total Cost | `p.cost` | `#ea580c` |
| Success Rate | `100 - p.error_rate` | `#16a34a` |

Wire `starRating` + `starRatingSubtext` onto Quality Score KpiCard:
- `starRating={d ? d.avg_quality_score : undefined}`
- `starRatingSubtext={d && d.avg_quality_score !== null ? `Based on ${formatNumber(d.rated_run_count)} rated runs` : undefined}`

**Not implemented** (no per-day timeseries data): Monthly Active Users, Seat Adoption, Retention Cost, Cost/Quality Pt sparklines.

#### `src/components/kpis/KpiCard.test.tsx`

Add tests for `starRating`:
- Renders correct count of filled stars (amber color) and empty stars (grey)
- `starRatingSubtext` text appears when provided
- No stars rendered when `starRating` is `null`
- No stars rendered when `starRating` is `undefined`
- Stars do not render when `insufficientData=true` (guarded by the `typeof === 'number'` check - `null` is not a number)

- **File Name & Structural Hygiene Re-evaluation:** No renames. `StarRating` is private to `KpiCard.tsx` (not exported) so no new file needed.

---

### 4. Verification & Testing Strategy

- **New Test Scenarios:**
  - `KpiCard.test.tsx` - new `starRating` suite covering filled count, empty count, subtext, null, undefined
  - `Overview.test.tsx` - verify that after data loads the Total Runs, Total Cost, and Success Rate cards contain `<svg>` elements (sparkline present)

- **Regression Strategy:** `npm run test`
