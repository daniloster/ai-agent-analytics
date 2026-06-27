import { KPI_CATALOG } from './data/kpis'
import { KEY_DECISIONS } from './data/decisions'
import { TECH_DECISIONS } from './data/techStack'
import { IN_SCOPE, OUT_OF_SCOPE } from './data/scope'
import { UnderstandingSidebar } from './components/UnderstandingSidebar'
import { KpiEntryCard } from './components/KpiEntryCard'
import { DecisionCard } from './components/DecisionCard'

// Hoisted - runs once at import time, no re-grouping on every render.
const BY_SECTION = {
  overview:    KPI_CATALOG.filter(k => k.section === 'overview'),
  teams:       KPI_CATALOG.filter(k => k.section === 'teams'),
  reliability: KPI_CATALOG.filter(k => k.section === 'reliability'),
  billing:     KPI_CATALOG.filter(k => k.section === 'billing'),
}

const GLOSSARY_TERMS: Array<{ term: string; definition: string }> = [
  { term: 'MAU', definition: 'Monthly Active User - a distinct user who triggered at least one agent run in the selected period.' },
  { term: 'DAU', definition: 'Daily Active User - a distinct user who triggered at least one agent run on a given calendar day.' },
  { term: 'Retention Cost', definition: 'Total period cost divided by the number of users active in the trailing 7 days. Measures the cost of keeping recently engaged users.' },
  { term: 'Quality Score', definition: 'Mean user-rated output quality on a 1-5 scale across all rated runs. Null when fewer than 10 runs have been rated.' },
  { term: 'Token Rate Efficiency', definition: 'Effective cost per million tokens (actual vs. list price). A lower actual rate means a larger volume discount is being realized.' },
  { term: 'MTTR', definition: 'Mean Time to Recovery - average elapsed minutes from when a platform incident was detected to when it was resolved.' },
  { term: 'P50', definition: '50th percentile (median) of run duration - the midpoint latency experienced by half of runs.' },
  { term: 'P95', definition: '95th percentile of run duration - the slowest experience for 5% of runs. Rising P95 without rising P50 indicates outlier run types.' },
  { term: 'P99', definition: '99th percentile of run duration - tail latency representing the worst 1% of runs.' },
  { term: 'Seat Adoption', definition: 'Fraction of provisioned licensed seats (seat_count) used during the period: mau / seat_count * 100.' },
  { term: 'Churn Signal', definition: 'A flag on a user or team that had >= 5 runs/week for 4+ consecutive weeks but 0 runs in the last 2 weeks. Indicates potential disengagement before it shows in spend numbers.' },
  { term: 'Cost Anomaly', definition: 'A day where daily_cost exceeds the 30-day average by more than 20%. Tiers: amber +20-50%, red >+50%.' },
  { term: 'Cost per Quality Point', definition: 'total_cost / (rated_run_count * avg_quality_score). Collapses cost and quality into a single comparable number for ROI conversations.' },
  { term: 'Cost per Successful Run', definition: 'current_month_spend / successful_run_count. The clearest unit economics metric for an AI agent platform.' },
  { term: '7-Day Retention Window', definition: 'The trailing 7-day window at the end of the selected period used to count retained_users_7d. Shorter than the full MAU window to catch early disengagement.' },
  { term: 'WoW', definition: 'Week over Week - comparing a metric to the same metric from 7 days prior.' },
  { term: 'MoM', definition: 'Month over Month - comparing a metric to the same metric from 30 days prior (or same calendar month last month).' },
  { term: 'seat_count', definition: 'The total number of licensed seats provisioned to the org. Used as the denominator in the Seat Adoption calculation.' },
  { term: 'rated_run_count', definition: 'The number of agent runs where the user provided an explicit quality rating (1-5). Used to gate Quality Score and Cost per Quality Point.' },
  { term: 'Budget Utilization', definition: 'current_month_spend / monthly_budget * 100. Shows what fraction of the monthly budget has been consumed month-to-date.' },
  { term: 'Hybrid Token + Seat Model', definition: 'The billing premise: orgs pay a fixed per-seat license fee for provisioned users PLUS a variable token consumption charge based on actual API usage.' },
  { term: 'Projected Month-End', definition: '(current_month_spend / days_elapsed) * days_in_month. A linear extrapolation of the current spend rate to the end of the month.' },
  { term: 'Error Rate Severity', definition: 'A three-tier classification of platform health: good (<2% error rate), warning (2-5%), critical (>5%).' },
]

export function UnderstandingPage(): JSX.Element {
  return (
    <div className="flex min-h-screen bg-background">
      <UnderstandingSidebar />
      <main id="main-content" tabIndex={-1} className="flex-1 ml-60 px-8 py-10 max-w-4xl">

        {/* ── About ──────────────────────────────────────────────────────── */}
        <section id="about" className="mb-16">
          <h2 className="text-2xl font-bold mb-4">About This Dashboard</h2>
          <p className="text-sm text-muted-foreground mb-4">
            The AI Agent Analytics dashboard gives engineering leaders, finance teams, and
            platform operators a single view of how an AI coding agent platform is being
            used across their organization. It surfaces 38 KPIs across four domains: usage
            and adoption (Overview), team-level comparison (Teams), platform reliability
            (Reliability), and spend management (Billing).
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            The dashboard is designed for three primary audiences:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5 mb-4">
            <li><strong>Engineering leaders</strong> - track adoption, quality trends, and platform reliability across teams.</li>
            <li><strong>Finance and procurement teams</strong> - monitor spend against budget, project annual commitments, and allocate costs by team.</li>
            <li><strong>Platform operators</strong> - diagnose reliability incidents, investigate error type distributions, and catch cost anomalies early.</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            All data is generated by a mock API (MSW + Faker.js) that produces realistic correlated
            data varying by date range and team filter. No real agent telemetry or backend is required.
          </p>
        </section>

        {/* ── Billing Model Premise ───────────────────────────────────────── */}
        <section id="premise" className="mb-16">
          <h2 className="text-2xl font-bold mb-4">Billing Model Premise</h2>
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 mb-4">
            <p className="text-xs font-medium text-amber-800">
              This is a premise for evaluators, not a production billing guarantee.
              The billing model described here is an assumption made to make the financial
              KPIs coherent; actual enterprise billing terms vary by contract.
            </p>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            The dashboard assumes a <strong>hybrid token + seat model</strong>:
          </p>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5 mb-4">
            <li>
              <strong>Seat license (fixed):</strong> Orgs pay a per-user monthly fee for each
              provisioned seat, regardless of usage. This is the <code>seat_count</code> in the
              org configuration. Seat adoption tracks whether licensed seats are producing value.
            </li>
            <li>
              <strong>Token consumption (variable):</strong> Each agent run consumes input and
              output tokens billed at a per-million-token rate. The listed rate is $3.00/1M
              tokens; volume discounts reduce the effective rate, which is tracked by the
              Token Rate Efficiency KPI.
            </li>
          </ul>
          <p className="text-sm text-muted-foreground">
            Together, these two cost components appear throughout the Billing section as total
            spend, per-team allocations, and unit economics metrics. The premise is grounded in
            common enterprise AI platform pricing structures but should not be taken as a binding
            commercial term.
          </p>
        </section>

        {/* ── KPI Catalog ─────────────────────────────────────────────────── */}
        <section id="kpis" className="mb-16">
          <h2 className="text-2xl font-bold mb-6">KPI & Metric Catalog</h2>
          <p className="text-sm text-muted-foreground mb-6">
            The dashboard renders 38 KPI surfaces across four sections. Each entry below
            documents what the metric measures, how it is calculated, a realistic example
            value, and the visualization used to display it.
          </p>

          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Overview</h3>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {BY_SECTION.overview.map(kpi => <KpiEntryCard key={kpi.id} kpi={kpi} />)}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Teams</h3>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {BY_SECTION.teams.map(kpi => <KpiEntryCard key={kpi.id} kpi={kpi} />)}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Reliability</h3>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {BY_SECTION.reliability.map(kpi => <KpiEntryCard key={kpi.id} kpi={kpi} />)}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4">Billing & Financial</h3>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {BY_SECTION.billing.map(kpi => <KpiEntryCard key={kpi.id} kpi={kpi} />)}
            </div>
          </div>
        </section>

        {/* ── Key Technical Decisions ──────────────────────────────────────── */}
        <section id="decisions" className="mb-16">
          <h2 className="text-2xl font-bold mb-4">Key Technical Decisions</h2>
          <p className="text-sm text-muted-foreground mb-6">
            These are the 15 design decisions that most shaped the architecture, component
            structure, and developer experience of this dashboard. Click any card to reveal
            the rationale and alternatives considered.
          </p>
          <ul role="list" className="space-y-3">
            {KEY_DECISIONS.map(d => (
              <li key={d.id}>
                <DecisionCard decision={d} />
              </li>
            ))}
          </ul>
        </section>

        {/* ── Technology Choices ───────────────────────────────────────────── */}
        <section id="tech" className="mb-16">
          <h2 className="text-2xl font-bold mb-4">Technology Choices</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Each library was chosen deliberately with specific alternatives ruled out.
          </p>
          <div className="space-y-4">
            {TECH_DECISIONS.map((td) => (
              <div key={td.area} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      {td.area}
                    </p>
                    <p className="text-sm font-semibold">{td.choice}</p>
                    {td.packageRef && (
                      <code className="text-xs text-muted-foreground mt-0.5 block">{td.packageRef}</code>
                    )}
                  </div>
                  {td.ruledOut.length > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Ruled out:</p>
                      <p className="text-xs text-muted-foreground">{td.ruledOut.join(', ')}</p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2">{td.rationale}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Scope ────────────────────────────────────────────────────────── */}
        <section id="scope" className="mb-16">
          <h2 className="text-2xl font-bold mb-4">Scope: v1</h2>
          <p className="text-sm text-muted-foreground mb-6">
            What this dashboard includes and what it deliberately does not.
          </p>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div>
              <h3 className="text-base font-semibold text-green-700 mb-3">In Scope</h3>
              <ul className="space-y-3">
                {IN_SCOPE.map((entry) => (
                  <li key={entry.item} className="text-sm">
                    <p className="font-medium">{entry.item}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">{entry.rationale}</p>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-base font-semibold text-red-700 mb-3">Out of Scope</h3>
              <ul className="space-y-3">
                {OUT_OF_SCOPE.map((entry) => (
                  <li key={entry.item} className="text-sm">
                    <p className="font-medium">{entry.item}</p>
                    <p className="text-muted-foreground text-xs mt-0.5">{entry.rationale}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── Glossary ─────────────────────────────────────────────────────── */}
        <section id="glossary" className="mb-16">
          <h2 className="text-2xl font-bold mb-4">Glossary</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Key terms used throughout the dashboard and this documentation.
          </p>
          <dl className="space-y-4">
            {GLOSSARY_TERMS.map(({ term, definition }) => (
              <div key={term}>
                <dt className="text-sm font-semibold">{term}</dt>
                <dd className="text-sm text-muted-foreground mt-0.5">{definition}</dd>
              </div>
            ))}
          </dl>
        </section>

      </main>
    </div>
  )
}
