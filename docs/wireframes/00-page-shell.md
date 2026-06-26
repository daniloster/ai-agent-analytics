# Wireframe 00 - Page Shell

**Scope:** Sticky header, section navigation, filter bar, overall scroll structure.
**Viewport:** 1440px | Content max-width: 1280px | Desktop primary, tablet secondary.

---

## Design Principles

- Single URL, progressive disclosure: macro -> micro as you scroll.
- Filters pin to the top; changing them updates all sections simultaneously.
- Section nav tracks scroll position; active item updates as user passes section headers.
- Charts below the fold are skeleton-replaced until IntersectionObserver fires.

---

## Page Structure

```
╔══════════════════════════════════════════════════════════════════════════════════════╗
║  STICKY HEADER  (z-index: 100, background: bg-background, border-bottom)             ║
║  ┌──────────────────────────────────────────────────────────────────────────────┐   ║
║  │  ⬡ AgentCloud Analytics            [◷ Last 30 days ▾]  [⊞ All Teams ▾]     │   ║
║  │                                                          [Understanding ↗]   │   ║
║  └──────────────────────────────────────────────────────────────────────────────┘   ║
║  ┌──────────────────────────────────────────────────────────────────────────────┐   ║
║  │  [ Overview ]  [ Teams ]  [ Reliability ]  [ Billing ]                       │   ║
║  │    ─────────   (section nav - active item has underline + text-primary)       │   ║
║  └──────────────────────────────────────────────────────────────────────────────┘   ║
╠══════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                      ║
║  ▐ Overview                                                                          ║
║  ── ── ── ── ── ── ── ── ── ── (section anchor: #overview)                          ║
║  [14 KPI cards + 4 charts]                                                           ║
║                                                                                      ║
║  ▐ Team Breakdown                                                                    ║
║  ── ── ── ── ── ── ── ── ── ── (section anchor: #teams)                             ║
║  [team table + 4 charts]                                                             ║
║                                                                                      ║
║  ▐ Reliability                                                                       ║
║  ── ── ── ── ── ── ── ── ── ── (section anchor: #reliability)                       ║
║  [4 KPI cards + 3 charts + heatmap]                                                  ║
║                                                                                      ║
║  ▐ Billing & Financial                                                               ║
║  ── ── ── ── ── ── ── ── ── ── (section anchor: #billing)                           ║
║  [4 KPI cards + 4 charts + table]                                                    ║
║                                                                                      ║
║  ─────────────────────────────────────────────────────────────────────────────────  ║
║  Last updated Jun 26, 2026 16:03 UTC  ·  Auto-refreshes every 30s                   ║
╚══════════════════════════════════════════════════════════════════════════════════════╝
```

---

## Header - Default (at top of page)

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  ⬡ AgentCloud Analytics                                                              │
│                                          [◷ Last 30 days ▾]  [⊞ All Teams ▾]        │
│                                                                [Understanding ↗]     │
├──────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│   Overview      Teams      Reliability      Billing                                  │
│   ────────      (inactive nav items - muted text, no underline)                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Header - Scrolled to "Reliability" section

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│  ⬡ AgentCloud Analytics            [◷ Last 30 days ▾]  [⊞ All Teams ▾]              │
├──────────────────────────────────────────────────────────────────────────────────────┤
│   Overview      Teams      Reliability      Billing                                  │
│                             ───────────                                              │
│                             (active: text-primary, underline, bold)                  │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Filter Bar - Date Range Picker (open)

```
                        ┌──────────────────────────────────┐
[◷ Last 30 days ▾] -->  │ (●) Last 7 days                  │
                        │ (●) Last 30 days   ← selected    │
                        │ (○) Last 90 days                  │
                        │ ─────────────────────────         │
                        │ (○) Custom range                  │
                        │     [Jun 1, 2026] to [Jun 26]     │
                        │     [  Apply  ]                   │
                        └──────────────────────────────────┘
```

## Filter Bar - Team Selector (open)

```
                    ┌────────────────────────────┐
[⊞ All Teams ▾] --> │ [  Search teams...       ] │
                    │ ─────────────────────────   │
                    │ (●) All Teams ← selected    │
                    │ (○) Platform Team           │
                    │ (○) Frontend Team           │
                    │ (○) Backend Team            │
                    │ (○) Data Team               │
                    └────────────────────────────┘
```

---

## Section Headers (component)

```
▐ Overview                           Jun 1 - Jun 30, 2026 · All Teams
─────────────────────────────────────────────────────────────────────
```

Specs:
- Left: section title (text-xl font-semibold)
- Right: active filter summary (text-sm text-muted-foreground)
- Bottom: 1px border, 24px margin-bottom

---

## Section Skeleton (below-fold, before IntersectionObserver fires)

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                      │
│  ░░░░░░░░░░░░░░░░░   ░░░░░░░░░░░░░░░░░   ░░░░░░░░░░░░░░░░░   ░░░░░░░░░░░░░░░░░   │
│  ░░░░░░░░░░░░░░░░░   ░░░░░░░░░░░░░░░░░   ░░░░░░░░░░░░░░░░░   ░░░░░░░░░░░░░░░░░   │
│  ░░░░░░░░░░░░░░░░░   ░░░░░░░░░░░░░░░░░   ░░░░░░░░░░░░░░░░░   ░░░░░░░░░░░░░░░░░   │
│                                                                                      │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│                                                                                      │
└──────────────────────────────────────────────────────────────────────────────────────┘
  (Tailwind animate-pulse on bg-muted rounded blocks, matching card/chart proportions)
```

---

## Responsive Breakpoints

| Breakpoint | Layout change |
|------------|--------------|
| >= 1280px  | Full layout as wireframed |
| 1024-1279px| 2-col KPI cards (from 4-col), charts full-width |
| 768-1023px | 2-col KPI cards, charts stack vertically |
| < 768px    | Not supported (analytics is desktop-native) |
