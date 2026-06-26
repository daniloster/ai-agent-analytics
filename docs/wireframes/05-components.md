# Wireframe 05 - Component Library

Reusable components used across all four dashboard sections.

---

## KPI Card - All States

### Default (metric + delta + sparkline)

```
┌──────────────────────────────────┐
│ Total Runs                   [?] │  <- label (text-sm text-muted-foreground)
│                                  │     [?] opens formula tooltip
│ 12,450                           │  <- value (text-3xl font-bold tabular-nums)
│ ↑ +18.4%  vs prior 30 days       │  <- delta badge (green arrow + %)
│                                  │
│ ▁▂▃▄▄▅▆▇█▇                       │  <- sparkline (80px tall, no axes)
└──────────────────────────────────┘
```

### With Progress Bar (budget utilization)

```
┌──────────────────────────────────┐
│ Budget Utilization           [?] │
│                                  │
│ 65.3%                            │
│ ↑ On track - 4 days remaining    │
│                                  │
│ [██████████████████░░░░░░░░░░░]  │  <- progress bar (shadcn/ui Progress)
│  $9,800 used of $15,000          │
└──────────────────────────────────┘
```

### Loading Skeleton

```
┌──────────────────────────────────┐
│ ░░░░░░░░░░░░░░░              ░░  │  <- label shimmer
│                                  │
│ ░░░░░░░░                         │  <- value shimmer (wide)
│ ░░░░░░░░░░░░░░░░░░               │  <- delta shimmer
│                                  │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   │  <- sparkline shimmer
└──────────────────────────────────┘
  (Tailwind animate-pulse on all bg-muted blocks)
```

### Insufficient Data (quality KPIs, < 10 rated runs)

```
┌──────────────────────────────────┐
│ Avg Quality Score            [?] │
│                                  │
│  - -                             │  <- em-dash placeholder value
│                                  │
│  [role="status"]                 │
│  Insufficient data               │
│  7 rated runs · need 10+         │
│                                  │
└──────────────────────────────────┘
  aria-live="polite" so screen readers announce when data becomes available.
```

### Delta Badge Variants

```
  ↑ +18.4%   (text-green-600, bg-green-50)   <- positive metric going up (good)
  ↓ -4.1%    (text-green-600, bg-green-50)   <- cost/error going down (also good)
  ↑ +34.0%   (text-red-600,   bg-red-50)     <- cost spiking up (bad - Data Team)
  ↓ -12.0%   (text-red-600,   bg-red-50)     <- usage going down (bad)
  → stable   (text-muted-foreground)          <- within ±2% of prior period
```

### Status Dot Variants (reliability cards)

```
  [● green]   < threshold (healthy)
  [▲ amber]   approaching threshold (warn)
  [■ red]     exceeded threshold (critical)
  (Tailwind: green-500, amber-500, red-500 filled circle - 8px)
```

---

## Filter Bar

### Default

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  ⬡ AgentCloud Analytics                [◷ Last 30 days ▾]  [⊞ All Teams ▾]          │
│                                                              [Understanding ↗]       │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

### With Custom Date Range Active

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  ⬡ AgentCloud Analytics     [◷ Jun 1 - Jun 26, 2026 ✕]  [⊞ All Teams ▾]            │
│                                                            [Understanding ↗]         │
└──────────────────────────────────────────────────────────────────────────────────────┘
  ✕ clears custom range and resets to "Last 30 days"
```

### With Team Filtered

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  ⬡ AgentCloud Analytics         [◷ Last 30 days ▾]  [⊞ Data Team ✕]                │
│                                                       [Understanding ↗]              │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Section Navigation

### At Top of Page (all inactive)

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│   Overview    Teams    Reliability    Billing                                        │
│   (all text-muted-foreground, no underline, 16px font)                               │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

### Scrolled to Teams Section

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│   Overview    Teams    Reliability    Billing                                        │
│              ───────                                                                  │
│   (active: text-primary, 2px bottom border, font-medium)                             │
│   (inactive: text-muted-foreground, no border)                                       │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

### Keyboard Focus State

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│   Overview    [ Teams ]    Reliability    Billing                                    │
│              [          ]                                                             │
│   (focus: 2px ring-offset-2 ring-primary outline, standard shadcn/ui focus style)   │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Section Header

```
▐ Team Breakdown                              Jun 1 - Jun 30, 2026 · Data Team
──────────────────────────────────────────────────────────────────────────────
  (left: text-xl font-semibold, border-l-4 border-primary, pl-3)
  (right: text-sm text-muted-foreground)
  (bottom: 1px solid border, mb-6)
```

---

## Chart Wrapper (figure + figcaption pattern)

```
<figure aria-label="Token Consumption area chart, Jun 1-30 2026">
  ┌──────────────────────────────────────────────────────────────┐
  │ Token Consumption                                        [?] │
  │                                                              │
  │  [CHART SVG - role="img" + accessible data points]          │
  │                                                              │
  └──────────────────────────────────────────────────────────────┘
  <figcaption class="sr-only">
    Area chart showing daily token consumption from Jun 1 to Jun 30.
    Peak: 2.4B tokens on Jun 28. Trend: steadily increasing.
  </figcaption>
</figure>
```

---

## Chart Tooltip

```
          ┌────────────────────────┐
  Hover   │ Jun 15, 2026           │
  or      │ ─────────────────────  │
  focus   │ Output tokens: 1.42B   │
  on      │ Input tokens:  0.61B   │
  element │ Total:         2.03B   │
          └────────────────────────┘
  (TooltipWithBounds from @visx/tooltip - stays within viewport)
  (Keyboard: Enter/Space on data point opens; Escape closes)
```

---

## 30-Second Polling Indicator

```
  Last updated 16:03 UTC  ·  [○ refreshing...]  <- animated dot during refetch
  Last updated 16:03 UTC  ·  Refreshes in 28s   <- idle state
  Last updated 16:03 UTC  ·  [! Retry]          <- error state (click to retry)
```

Location: dashboard footer, text-xs text-muted-foreground.
