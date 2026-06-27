export type KpiSection = 'overview' | 'teams' | 'reliability' | 'billing'

export interface KpiEntry {
  id: string
  section: KpiSection
  label: string
  whatItMeasures: string
  formula: string
  example: string
  whyItMatters: string
  visualization: string
}

export const KPI_CATALOG: KpiEntry[] = [
  // ── Overview (O-01 through O-11) ────────────────────────────────────────
  {
    id: 'O-01',
    section: 'overview',
    label: 'Total Runs',
    whatItMeasures:
      'Count of every AI agent execution that started in the selected period, regardless of outcome (success, error, or timeout).',
    formula: 'COUNT(runs WHERE org = org_id AND started_at BETWEEN from AND to)',
    example: 'e.g. 12,450 runs; +18.4% vs prior 30 days',
    whyItMatters:
      'The most basic health signal. A flat or declining trend signals user disengagement before it appears in spend numbers.',
    visualization:
      'KPI card with percentage delta badge (green = growth) + purple sparkline of daily run count.',
  },
  {
    id: 'O-02',
    section: 'overview',
    label: 'Active Users',
    whatItMeasures:
      'Count of distinct users who triggered at least one run in the selected period (MAU equivalent).',
    formula: 'COUNT(DISTINCT user_id WHERE org = org_id AND started_at IN period)',
    example: 'e.g. 340 users; was 315 prior period (+7.9%)',
    whyItMatters:
      'Run count can be inflated by a small number of power users. Active user count reveals the true breadth of adoption across the org.',
    visualization: 'KPI card with percentage delta + purple sparkline of DAU over time.',
  },
  {
    id: 'O-03',
    section: 'overview',
    label: 'Seat Adoption',
    whatItMeasures: 'Fraction of provisioned licensed seats actively used during the period.',
    formula: 'mau / seat_count * 100',
    example: 'e.g. 85.0% (340 of 400 seats); +25 users vs prior period',
    whyItMatters:
      'Directly quantifies how much of the seat license cost is producing value. Low adoption = wasted license spend; candidates for seat reduction or targeted enablement.',
    visualization:
      'KPI card with absolute seat-count delta + label showing "X / Y seats" + purple sparkline.',
  },
  {
    id: 'O-04',
    section: 'overview',
    label: 'Total Cost',
    whatItMeasures:
      'Total API token consumption cost for the org in the selected period. Does not include seat license fees.',
    formula: 'SUM(run_cost WHERE org = org_id AND period)',
    example: 'e.g. $14,200; -3.1% vs prior period (improving)',
    whyItMatters:
      'Headline spend number for finance and leadership. Paired with the Token Usage chart to understand what is driving cost.',
    visualization:
      'KPI card with inverted delta (lower cost = green) + purple sparkline of daily cost.',
  },
  {
    id: 'O-05',
    section: 'overview',
    label: '7-Day Retention Cost',
    whatItMeasures:
      'Total period cost divided by the number of users who were active in the last 7 days of the selected period window.',
    formula: 'total_cost / retained_users_7d',
    example: 'e.g. $100.00 / user; down from $118.00 ("improving efficiency")',
    whyItMatters:
      'Unit economics of retention. A 7-day trailing window catches users who might be drifting before they churn fully. Lower cost per retained user signals better value delivery per dollar spent.',
    visualization:
      'KPI card with inverted delta + "improving / degrading efficiency" label + purple sparkline.',
  },
  {
    id: 'O-06',
    section: 'overview',
    label: 'Agent Success Rate',
    whatItMeasures: 'Percentage of agent runs that completed without a terminal error.',
    formula: 'COUNT(runs WHERE status = "success") / COUNT(runs) * 100',
    example: 'e.g. 94.2%; status dot = green (error rate ~5.8%, amber threshold)',
    whyItMatters:
      'Platform reliability headline. Sustained success rate below ~90% signals systemic platform issues requiring investigation.',
    visualization:
      'KPI card with colored status dot (green/amber/red) + percentage delta + purple sparkline of daily success rate.',
  },
  {
    id: 'O-07',
    section: 'overview',
    label: 'Quality Score',
    whatItMeasures:
      'Mean user-rated output quality (1-5 scale) across all rated runs in the period. Shows null and "Insufficient data" badge when rated_run_count < 10.',
    formula: 'MEAN(quality_rating WHERE quality_rating IS NOT NULL)',
    example: 'e.g. 4.1 / 5.0; based on 2,340 rated runs; +0.3 vs prior period',
    whyItMatters:
      'The only direct measure of output usefulness from the user\'s perspective. Cost metrics alone are meaningless without a quality signal.',
    visualization:
      'KPI card with formatQuality() value, star rating display, rated run count subtext, decimal delta.',
  },
  {
    id: 'O-08',
    section: 'overview',
    label: 'Cost / Quality Point',
    whatItMeasures:
      'Dollar cost of producing one unit of user-perceived quality across the period.',
    formula: 'total_cost / (rated_run_count * avg_quality_score)',
    example: 'e.g. $0.42 per quality point; down from $0.56 ("improving efficiency")',
    whyItMatters:
      'Collapses cost and quality into a single comparable number. "After upgrading the model tier, cost per quality point went from $0.56 to $0.42" is a concrete ROI statement.',
    visualization:
      'KPI card with inverted delta + "improving/degrading efficiency" label + purple sparkline (quality-days only).',
  },
  {
    id: 'O-09',
    section: 'overview',
    label: 'Token Usage Over Time',
    whatItMeasures:
      'Daily input and output token consumption as two separate area series, revealing the cost composition and trend over the selected period.',
    formula: 'SUM(input_tokens) per day and SUM(output_tokens) per day',
    example:
      'e.g. Input: 1.8B tokens/30d; Output: 0.61B tokens/30d; tooltip shows each day\'s split',
    whyItMatters:
      'Token consumption is the variable cost driver. The input/output split reveals whether cost growth is from longer prompts (context bloat) or longer responses (generation overhead).',
    visualization:
      'Dual-series AreaChart inside Visualization; legend in card header with color swatches; SeriesTooltip on hover showing both values with formatTokens.',
  },
  {
    id: 'O-10',
    section: 'overview',
    label: 'Cost vs. Budget',
    whatItMeasures:
      'Month-to-date cumulative spend as a solid area, projected continuation to month-end as a dashed area, and the monthly budget as a flat annotation line.',
    formula:
      'Actual: cumulative SUM(daily_cost) for dates <= today; Projected: (cum_cost / days_actual) * remaining_days extrapolated forward',
    example:
      'e.g. Day 26 cumulative: $9,800; projected month-end: $11,308; budget: $15,000 (65.3% utilized)',
    whyItMatters:
      'Enables proactive budget management. If the projection crosses the budget line with 4 days remaining, intervention is still possible.',
    visualization:
      'AreaChart for both series + Annotation axis="y" value={monthly_budget} + SeriesTooltip.',
  },
  {
    id: 'O-11',
    section: 'overview',
    label: 'Quality Score Trend',
    whatItMeasures:
      '6-month monthly trajectory of average quality score (line + area) overlaid on the rating volume per month (columns), showing whether output quality is improving over time.',
    formula:
      'Monthly MEAN(avg_quality_score) and SUM(rated_run_count) aggregated by calendar month over 6 months',
    example:
      'e.g. Jan 3.7 (420 rated) | Feb 3.8 (510) | Mar 3.9 (680) | Apr 4.0 (730) | May 4.1 (820) | Jun 4.1 (840)',
    whyItMatters:
      'Answers "is the org getting better at using the tool over time?" A rising quality trend shows users learning and improving prompts. The volume column confirms statistical meaningfulness.',
    visualization:
      'ColumnChart (volume) + AreaChart (quality) + DataLabels with SeriesTooltip.',
  },

  // ── Teams (T-01 through T-05) ────────────────────────────────────────────
  {
    id: 'T-01',
    section: 'teams',
    label: 'Team Breakdown Table',
    whatItMeasures:
      'Side-by-side comparison of all teams across 8 dimensions in a sortable table: runs, cost, users, adoption, quality, failure rate, WoW trend, and churn signal.',
    formula:
      'Per team: COUNT(runs), SUM(run_cost), COUNT(DISTINCT user_id), mau/seat_count*100, MEAN(quality_rating), COUNT(failed)/COUNT(runs)',
    example:
      'e.g. Platform | 12,450 runs | $4,100 | 12 users (was 11) | 80% | 4.2 stars | 3.2% | sparkline',
    whyItMatters:
      'The canonical all-teams comparison. Shows which teams are productive, cost-efficient, and improving vs which need enablement or investigation.',
    visualization:
      'shadcn/ui Table + Progress bar for adoption + StarRating for quality + inline Visualization sparkline per row for cost trend.',
  },
  {
    id: 'T-02',
    section: 'teams',
    label: 'Runs per Team',
    whatItMeasures:
      'Total agent run count for each team in the period, sorted descending.',
    formula: 'COUNT(runs) GROUP BY team_id ORDER BY runs DESC',
    example:
      'e.g. Platform 12,450 | Backend 8,200 | Frontend 6,100 | Data 3,900 | Total 30,650 runs',
    whyItMatters:
      'Identifies which teams are driving usage volume and which are underutilizing the tool.',
    visualization:
      'Horizontal BarChart, team-colored bars, formatNumber labels, total in footer.',
  },
  {
    id: 'T-03',
    section: 'teams',
    label: 'Cost per Team',
    whatItMeasures: 'Total API spend per team in the period, sorted descending.',
    formula: 'SUM(run_cost) GROUP BY team_id ORDER BY cost DESC',
    example:
      'e.g. Platform $4,100 | Backend $2,800 | Frontend $2,300 | Data $1,200 | Total $10,400',
    whyItMatters:
      'Enables cost center chargeback and identifies teams consuming disproportionate budget relative to their run count.',
    visualization:
      'Horizontal BarChart, team-colored bars, formatCurrency labels, total in footer.',
  },
  {
    id: 'T-04',
    section: 'teams',
    label: 'Quality Score per Team',
    whatItMeasures:
      'Average user-rated output quality per team, ordered by quality descending, overlaid with per-team rating volume.',
    formula:
      'MEAN(quality_rating) GROUP BY team_id (null when rated_run_count < 10); COUNT(rated_runs) GROUP BY team_id',
    example:
      'e.g. Frontend 4.4 (1,200 rated) | Platform 4.2 (890) | Backend 3.9 (640) | Data - (insufficient)',
    whyItMatters:
      'Quality differences between teams may reflect different use cases, prompt quality, or agent configuration. Identifies teams needing enablement vs those with best practices to share.',
    visualization:
      'Dual-series: ColumnChart (volume) + AreaChart (quality) + DataLabels + SeriesTooltip.',
  },
  {
    id: 'T-05',
    section: 'teams',
    label: 'Single-Team Drill-Down',
    whatItMeasures:
      'Detailed view of one team\'s metrics when a specific team is selected: 4 KPI cards (runs, cost, quality, failure rate), use-case distribution bar, and cost trend sparkline.',
    formula:
      'Same formulas as overview KPIs but scoped to team_id; use_cases as proportional segment widths summing to 100%',
    example:
      'e.g. Platform: 12,450 runs | $4,100 | 4.2★ | 3.2% failed | Code Gen 40% / Code Review 25% / Docs 20% / Debug 15%',
    whyItMatters:
      'Enables team leads to understand their team\'s specific cost and quality profile without being distracted by org-wide comparisons.',
    visualization:
      '4-column KpiCard grid + proportional stacked bar (colored divs, role="list") + 80px Visualization sparkline.',
  },

  // ── Reliability (R-01 through R-11) ──────────────────────────────────────
  {
    id: 'R-01',
    section: 'reliability',
    label: 'Error Rate',
    whatItMeasures:
      'Percentage of agent runs that terminated with a non-timeout error in the period.',
    formula: 'COUNT(runs WHERE status = "error") / COUNT(runs) * 100',
    example: 'e.g. 3.8%; amber status dot; -0.6% vs prior period (improving)',
    whyItMatters:
      'Headline reliability metric. Anything above 5% is problematic for a production tool that engineers depend on daily.',
    visualization:
      'KPI card with colored status dot (computeErrorRateSeverity), inverted delta, purple (or red) sparkline from error_trend_7d.',
  },
  {
    id: 'R-02',
    section: 'reliability',
    label: 'Timeout Rate',
    whatItMeasures: 'Percentage of runs killed for exceeding the maximum allowed duration.',
    formula: 'COUNT(runs WHERE status = "timeout") / COUNT(runs) * 100',
    example: 'e.g. 1.2%; -0.3% vs prior (improving)',
    whyItMatters:
      'Distinct from errors - timeouts indicate runs that are too complex or context windows too large, not infrastructure failures. Requires prompt engineering remediation, not API reliability work.',
    visualization: 'KPI card with inverted delta + purple sparkline.',
  },
  {
    id: 'R-03',
    section: 'reliability',
    label: 'P50 Duration (with Queue Wait)',
    whatItMeasures:
      'Median run duration (50th percentile) from agent start to completion, with median queue wait shown as a subValue.',
    formula:
      'P50: PERCENTILE(completed_at - started_at, 50) WHERE status = "success"; Queue wait: MEDIAN(agent_started_at - submitted_at)',
    example: 'e.g. P50: 12s | Queue wait: 2.1s | -1s vs prior (improving)',
    whyItMatters:
      'The typical user experience. Queue wait specifically flags capacity constraints - engineers waiting > 30s before their agent starts will stop using the tool.',
    visualization:
      'KPI card with P50 as main value, queue wait as subValue, inverted delta, purple sparkline from p50_duration_trend.',
  },
  {
    id: 'R-04',
    section: 'reliability',
    label: 'P95 Duration',
    whatItMeasures:
      '95th percentile run duration - the slowest experience for 5% of runs.',
    formula: 'PERCENTILE(completed_at - started_at, 95) WHERE status = "success"',
    example: 'e.g. 48s; +2s vs prior (degrading)',
    whyItMatters:
      'Rising P95 without rising P50 indicates outlier runs (long contexts, complex tasks), not general platform slowdown. The divergence between P50 and P95 is the meaningful signal.',
    visualization: 'KPI card with inverted delta + purple sparkline from p95_duration_trend.',
  },
  {
    id: 'R-05',
    section: 'reliability',
    label: 'P99 Duration',
    whatItMeasures: '99th percentile run duration - tail latency experienced by the worst 1% of runs.',
    formula: 'PERCENTILE(completed_at - started_at, 99) WHERE status = "success"',
    example: 'e.g. 120s; -5s vs prior (improving)',
    whyItMatters:
      'P99 represents the worst-case outlier. A P99 of 2 minutes vs a P50 of 12 seconds (a 10x tail) might indicate a category of run type that needs a separate timeout or queue tier.',
    visualization: 'KPI card with inverted delta + purple sparkline from p99_duration_trend.',
  },
  {
    id: 'R-06',
    section: 'reliability',
    label: 'Retry Rate',
    whatItMeasures:
      'Percentage of runs that were automatically retried at least once by the platform.',
    formula: 'COUNT(runs WHERE retry_count > 0) / COUNT(runs) * 100',
    example: 'e.g. 8.1%; -1.2% vs prior (improving)',
    whyItMatters:
      'Each automatic retry consumes an additional full set of tokens without producing additional user value. High retry rate is a hidden tax on spend.',
    visualization:
      'KPI card with inverted delta + purple sparkline (values * 100 for display).',
  },
  {
    id: 'R-07',
    section: 'reliability',
    label: 'MTTR',
    whatItMeasures:
      'Mean time to recovery for platform incidents - average elapsed minutes from error spike detection to resolution.',
    formula:
      'MEAN(resolved_at - detected_at) FOR incidents WHERE resolved_at IS NOT NULL',
    example:
      'e.g. 42.0 min; -25.3 min vs prior (improving); or "No incidents" when none occurred',
    whyItMatters:
      'Fast recovery is the difference between a 42-minute disruption (mildly inconvenient) and a 4-hour outage (engineers blocked, deadline missed).',
    visualization:
      'KPI card with inverted delta (or no delta when no incidents) + purple sparkline from mttr_trend.',
  },
  {
    id: 'R-08',
    section: 'reliability',
    label: 'Cost of Failed Runs',
    whatItMeasures:
      'Total dollar value of token consumption spent on runs that produced no successful output.',
    formula: 'SUM(run_cost WHERE status IN ("error", "timeout"))',
    example: 'e.g. $1,420; -8.2% vs prior (improving)',
    whyItMatters:
      'Bridges platform reliability to financial impact. Reducing error rate is not just a technical goal - each failed run is a billed API call that produced no value.',
    visualization: 'KPI card with inverted delta + purple sparkline.',
  },
  {
    id: 'R-09',
    section: 'reliability',
    label: 'Error Rate Trend',
    whatItMeasures:
      '7-day rolling error rate as a time series, with a reference line at the 5% alert threshold.',
    formula:
      'Daily error rates from error_trend_7d (7-day moving average computed server-side)',
    example:
      'e.g. 7-day trend from 4.1% down to 3.8%; blue area; 5% threshold line visible above the data',
    whyItMatters:
      'The current error rate is a snapshot; the trend tells you if the platform is improving or worsening. A downward slope = healthy; an upward slope approaching 5% = action required.',
    visualization:
      'AreaChart + Annotation axis="y" value={0.05} label="5% threshold" + SeriesTooltip.',
  },
  {
    id: 'R-10',
    section: 'reliability',
    label: 'Error Type Breakdown',
    whatItMeasures:
      'Distribution of failure causes across all failed runs in the period: model_error, timeout, tool_call_failure, rate_limit, other.',
    formula: 'COUNT(runs) GROUP BY error_type WHERE status = "error"',
    example:
      'e.g. Model Error 35% (250) | Timeout 28% (198) | Tool Call Failure 20% (142) | Rate Limit 10% (71) | Other 7% (50)',
    whyItMatters:
      'Different error types require completely different responses. Context overflow = prompt engineering. Rate limits = capacity upgrade. Model errors = API reliability issue.',
    visualization:
      'DonutChart with colored slices, total count in center, DonutLegend showing percentage and count per type.',
  },
  {
    id: 'R-11',
    section: 'reliability',
    label: 'Platform Availability Calendar',
    whatItMeasures:
      'Daily uptime percentage for each day in the selected period, with a summary footer showing overall availability, incident count, longest incident, and MTTR.',
    formula:
      '(total_minutes - downtime_minutes) / total_minutes * 100 per calendar day',
    example:
      'e.g. 26 green boxes, 3 amber, 1 red | 99.87% MTD | 2 incidents | Longest: 42 min (Jun 19)',
    whyItMatters:
      'SLA compliance metric. The calendar format shows incident clustering that a single percentage cannot - three red days in a row vs scattered amber = sustained outage vs sporadic issues.',
    visualization:
      'Custom AvailabilityDayBox components (48x48px divs) in flex-wrap container; color tiers: green >= 99.9%, amber 99.0-99.9%, red < 99.0%; summary row below.',
  },

  // ── Billing (B-01 through B-11) ──────────────────────────────────────────
  {
    id: 'B-01',
    section: 'billing',
    label: 'Budget Utilization',
    whatItMeasures:
      'Current month-to-date spend as a percentage of the org\'s monthly budget, with remaining budget displayed as the delta.',
    formula: 'current_month_spend / monthly_budget * 100',
    example:
      'e.g. 65.3% | $9,800 of $15,000 budget | $5,200 budget remaining',
    whyItMatters:
      'At-a-glance budget health check. A billing admin can see in one number whether the org is on track or at risk of overspend.',
    visualization:
      'KPI card with currency delta (budget remaining, green when positive) + subValue + purple sparkline.',
  },
  {
    id: 'B-02',
    section: 'billing',
    label: 'Projected Annual Spend',
    whatItMeasures:
      'Full-year spend projection based on the current month\'s projected month-end cost annualized.',
    formula:
      'projected_month_end * 12; where projected_month_end = (current_month_spend / days_elapsed) * days_in_month',
    example: 'e.g. $157,300 projected; $22,700 under annual budget ($180,000)',
    whyItMatters:
      'The number that appears in the renewal conversation. CFOs and procurement teams need the annual commitment figure, not the monthly.',
    visualization:
      'KPI card with currency delta (under/over annual budget) + purple sparkline of invoice history.',
  },
  {
    id: 'B-03',
    section: 'billing',
    label: 'New User Activation Cost',
    whatItMeasures:
      'Average cost attributable to onboarding new users in the period - the investment required to bring one new seat holder to their first productive runs.',
    formula:
      'API-computed cost slice attributed to users in their activation window (first N runs); null when no new users activated',
    example: 'e.g. $50.00 activation cost; -$8.20 WoW (improving)',
    whyItMatters:
      'If onboarding costs $50 and monthly retention costs $100/user, the org recoups the investment in the first month of active use. Rising activation cost signals onboarding friction.',
    visualization:
      'KPI card with inverted currency delta + "Insufficient data" fallback + purple sparkline.',
  },
  {
    id: 'B-04',
    section: 'billing',
    label: 'Cost per Successful Run',
    whatItMeasures:
      'Average cost of producing one successfully completed agent output.',
    formula: 'current_month_spend / successful_run_count',
    example: 'e.g. $1.21 per successful run; -$0.08 WoW (improving)',
    whyItMatters:
      'The clearest unit economics metric. "Each useful agent result costs us $1.21" grounds the ROI conversation. Compare against: how long would an engineer take to do the same task manually?',
    visualization:
      'KPI card with inverted currency delta + purple sparkline.',
  },
  {
    id: 'B-05',
    section: 'billing',
    label: 'Token Rate Efficiency',
    whatItMeasures:
      'Effective cost per million tokens vs. the published list price, quantifying any volume discount or pricing tier benefit realized.',
    formula: 'total_token_cost / (total_tokens / 1_000_000)',
    example: 'e.g. $2.40/1M actual | 20.0% below list ($3.00/1M)',
    whyItMatters:
      'Enterprise contracts often include volume discounts. This KPI verifies the discount is being applied correctly and quantifies its annual value.',
    visualization:
      'KPI card with subValue showing discount percentage + inverted delta + purple sparkline.',
  },
  {
    id: 'B-06',
    section: 'billing',
    label: 'Cost of Failed Runs (Billing)',
    whatItMeasures:
      'API spend on failed runs (same calculation as R-08) presented in the billing context with an additional percentage-of-spend subValue.',
    formula: 'SUM(run_cost WHERE status IN ("error", "timeout"))',
    example: 'e.g. $1,420 | 5.1% of period spend; -8.2% WoW (improving)',
    whyItMatters:
      '"5.1% of spend produced zero output" is a financial statement that motivates reliability investment. Makes the reliability-finance connection explicit in the billing section.',
    visualization:
      'KPI card with subValue (% of spend) + inverted percentage delta + purple sparkline.',
  },
  {
    id: 'B-07',
    section: 'billing',
    label: 'Cumulative Spend vs. Budget',
    whatItMeasures:
      'Month-by-month cumulative spend from invoice history (actual) extended with a projected point for the current month, versus the monthly budget annotation.',
    formula:
      'Actual: billing.invoice_history[] monthly totals; Projected: last closed month + projected_month_end as dashed extension',
    example:
      'e.g. Monthly trend Jan-May ($9,100 -> $14,200) + dashed Jun projection to $11,308 + flat Budget line at $15,000',
    whyItMatters:
      'Shows the billing arc over time. The dashed projection makes the expected month-end visible before the invoice is issued.',
    visualization:
      'Dual-series AreaChart (solid actual + dashed projected) + Annotation axis="y" value={monthly_budget} + SeriesTooltip.',
  },
  {
    id: 'B-08',
    section: 'billing',
    label: 'Invoice History',
    whatItMeasures:
      'The last 6 closed monthly invoices as a column chart showing spend trend over 6 months.',
    formula:
      'SELECT month, total_billed FROM invoice_history ORDER BY month ASC (6 entries)',
    example:
      'e.g. Jan $9,100 | Feb $9,800 | Mar $10,400 | Apr $11,900 | May $12,680 | Jun in-flight',
    whyItMatters:
      'Shows the spending trajectory at a glance. A steeply rising trend prompts capacity planning and contract renegotiation conversations.',
    visualization:
      'ColumnChart on a band X-axis + SeriesTooltip with formatCurrency per bar.',
  },
  {
    id: 'B-09',
    section: 'billing',
    label: 'Cost by Team (Donut)',
    whatItMeasures:
      'Proportional distribution of total period spend across teams, combining token consumption costs and prorated seat license costs.',
    formula:
      'Per team: token_cost + seat_cost_prorated; percentage: integer share summing to 100 across all teams',
    example:
      'e.g. Platform 28% ($4,100) | Backend 22% ($3,200) | Frontend 19% ($2,800) | Data 11% ($1,600)',
    whyItMatters:
      'Finance needs this proportional view for P&L allocation. "Platform team consumed 28% of our AI spend" is how cost center managers report to finance.',
    visualization:
      'DonutChart (160px) with team-colored slices + DonutLegend showing percentage and formatted total per team.',
  },
  {
    id: 'B-10',
    section: 'billing',
    label: 'Cost Chargeback Table',
    whatItMeasures:
      'Line-item cost breakdown formatted for internal chargeback reporting: each team\'s token cost, prorated seat cost, total, and percentage of org spend.',
    formula:
      'Same source as B-09 (billing.cost_by_team[]) presented as a table for copy-paste into finance reports',
    example:
      'e.g. Platform | $1,230 (seat) | $2,870 (token) | $4,100 | 28%',
    whyItMatters:
      'The donut (B-09) shows proportion visually; the chargeback table provides the exact numbers a billing admin needs to file cost allocation reports.',
    visualization:
      'shadcn/ui Table rendered by ChargebackTable component with formatCurrency and one-decimal percentages.',
  },
  {
    id: 'B-11',
    section: 'billing',
    label: 'Cost Anomaly Calendar',
    whatItMeasures:
      'Daily spend for every day in the period with color-coded anomaly severity tiers: normal (<= +20% of avg), elevated (+20-50%), anomaly (> +50%).',
    formula:
      'ratio = daily_cost / avg_daily_cost; green <= 1.2, amber 1.2-1.5, red > 1.5',
    example:
      'e.g. 26 green boxes, 3 amber, 2 red | 5 anomaly alerts this period | Avg $430/day',
    whyItMatters:
      'A runaway CI script triggering agents in a loop will show up as a cluster of red boxes immediately, days before the invoice arrives.',
    visualization:
      'Custom AnomalyDayBox components (48x48px divs) in flex-wrap container; inline title tooltip; anomaly count + average in summary row below.',
  },
]
