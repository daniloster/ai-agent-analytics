# Wireframe 03 - Reliability (Section 3)

**KPIs:** KPI-26 through KPI-35
**Audience:** SRE, DevOps, Engineering Managers
**Query:** GET /api/analytics/reliability + GET /api/analytics/timeseries

---

## Full Section Layout

```
▐ Reliability                                      Jun 1 - Jun 30, 2026 · All Teams
────────────────────────────────────────────────────────────────────────────────────

ROW 1 - Headline Health Metrics (4 KPI cards)
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│ Error Rate       [?]│ │ Timeout Rate     [?]│ │ Latency Pctiles  [?]│ │ Queue Wait       [?]│
│                     │ │                     │ │                     │ │                     │
│ 3.8%    [● amber]   │ │ 1.2%    [● green]   │ │ P50:   34s          │ │ 2.1s                │
│ ↑ +0.6pp vs prior   │ │ → stable            │ │ P95:  142s          │ │ ↓ -0.3s vs prior    │
│ 7d MA: 3.2%         │ │ 7d MA: 1.1%         │ │ P99:  310s          │ │ [● green]           │
│ ▂▃▃▄▄▅▅▅▆▅          │ │ ▁▁▂▂▁▁▂▂▁▂          │ │ ↑ P99 trending up   │ │ ▂▂▁▁▂▂▁▁▁▂          │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘ └─────────────────────┘

  Status thresholds:
  Error Rate:  green < 2%  |  amber 2-5%  |  red > 5%
  Queue Wait:  green < 5s  |  amber 5-15s |  red > 15s

ROW 2 - Error Trend + Error Type Breakdown
┌────────────────────────────────────────┐ ┌────────────────────────────────────────┐
│ Error Rate Trend (7-day MA)        [?] │ │ Error Type Breakdown               [?] │
│ With 5% threshold reference line       │ │ 30-day period                          │
│                                        │ │                                        │
│  10% ┤                                 │ │     ╭────────────╮                     │
│   8% ┤                                 │ │    ╱ Context      ╲                    │
│   6% ┤                                 │ │   │  Overflow 45%  │                   │
│   5% ┤ ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ ← threshold     │                   │
│   4% ┤              ╭─────────────     │ │   │ Tool Fail  30% │                   │
│   3% ┤─────────────╯                   │ │    ╲ Rate Lmt 15% ╱                    │
│   2% ┤                                 │ │     ╰─── Infra 10%╯                    │
│   0% └────────────────────────────     │ │                                        │
│       Jun 1  Jun 8  Jun 15  Jun 22     │ │  ■ Context Overflow  45%  (537 runs)   │
│  ━━ 7d moving avg   ╌╌ 5% threshold   │ │  ■ Tool Exec Failure 30%  (358 runs)   │
│  [trending toward threshold - amber]   │ │  ■ Rate Limit        15%  (179 runs)   │
│                                        │ │  ■ Infrastructure    10%  (119 runs)   │
└────────────────────────────────────────┘ └────────────────────────────────────────┘

ROW 3 - Availability Heatmap (full width)
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ Platform Availability - June 2026                                                [?] │
│ 99.87% uptime · 10.5 min downtime this month                                        │
│                                                                                      │
│  Su Mo Tu We Th Fr Sa   Su Mo Tu We Th Fr Sa   Su Mo Tu We Th Fr Sa   Su Mo Tu We   │
│  ■  ■  ■  ■  ■  ■  ■    ■  ■  ■  ▪  ■  ■  ■    ■  ■  ■  ■  ■  ■  ■    ■  ■  ■  ■  │
│  1  2  3  4  5  6  7    8  9  10 11 12 13 14   15 16 17 18 19 20 21   22 23 24 25  │
│                              ↑                                                       │
│                              Jun 11: 99.3%  (downtime incident 10.5 min)            │
│                                                                                      │
│  ■ 100%     ▪ 99.0-99.9%     □ 95.0-99.0%     ░ < 95%                              │
│                                                                                      │
│  Keyboard: Tab to navigate cells, Enter/Space to show day detail                    │
└──────────────────────────────────────────────────────────────────────────────────────┘

ROW 4 - Secondary Metrics (4 KPI cards)
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│ Retry Rate       [?]│ │ MTTR             [?]│ │ Cost of Failed   [?]│ │ P99 Trend        [?]│
│                     │ │                     │ │ Runs                │ │                     │
│ 8.3%                │ │ 24.3 min            │ │ $680                │ │ 310s                │
│ ↑ +1.1pp (watch)    │ │ 1 incident          │ │ 4.8% of total spend │ │ ↑ +42s trending up  │
│                     │ │ this period         │ │ ↑ +$120 vs prior    │ │ [amber - watch]     │
│ ▁▂▂▃▃▄▄▅▅▆          │ │ Jun 11: 10.5 min    │ │ ▂▂▃▃▄▄▅▅▆▇          │ │ ▃▄▄▅▅▆▆▇▇█          │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘ └─────────────────────┘

ROW 5 - Incident Log (shown when incidents exist)
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ Incident Log - June 2026                                                             │
│ ─────────────────────────────────────────────────────────────────────────────────── │
│ Detected              Error Type           Runs Affected    MTTR                    │
│ Jun 11, 09:14 UTC     Infrastructure       ~23 runs         10.5 min                │
│ ─────────────────────────────────────────────────────────────────────────────────── │
│ No other incidents in this period.                                                   │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Heatmap Cell - Tooltip (on hover / focus)

```
            ┌──────────────────────────────┐
 Cell: ▪    │ June 11, 2026                │
            │ ─────────────────────────    │
            │ Availability:  99.3%         │
            │ Downtime:      10.5 min      │
            │ Incident type: Infrastructure│
            │ Resolved:      09:25 UTC     │
            └──────────────────────────────┘
```

---

## Error Rate Card - Threshold States

```
Below 2%:           Between 2-5%:        Above 5%:
┌─────────────┐     ┌─────────────┐      ┌─────────────┐
│ Error Rate  │     │ Error Rate  │      │ Error Rate  │
│ [● green]   │     │ [▲ amber]   │      │ [■ red]     │
│ 1.2%        │     │ 3.8%        │      │ 7.1%        │
└─────────────┘     └─────────────┘      └─────────────┘
```

---

## Latency Card - P50/P95/P99 Detail

```
┌─────────────────────────────────┐
│ Run Duration Latency        [?] │
│                                 │
│  P50   34s   ━━━━━░░░░░░░░░░░   │
│  P95  142s   ━━━━━━━━━━░░░░░░   │
│  P99  310s   ━━━━━━━━━━━━━━░░   │
│                                 │
│  P99 trending ↑ +42s vs prior   │
│  period. Context bloat likely.  │
└─────────────────────────────────┘
```
