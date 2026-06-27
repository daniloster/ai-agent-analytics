import { useQuery } from "@tanstack/react-query";
import { useDeepComputed } from "../../hooks/useDeepComputed";
import { filterQueryParams } from "../../lib/filters/filterSignals";
import { formatCurrency, formatPercent } from "../../lib/kpi/formatters";
import { computeDeltaPercent } from "../../lib/kpi/formulas";
import { teamColor } from "../../lib/team/teamColors";
import type { BillingResponse } from "../../types/api";
import { buildQueryParams } from "../../utils/buildQueryParams";
import { DonutChart } from "../charts/DonutChart";
import { DonutLegend } from "../charts/DonutLegend";
import { Visualization, defineAxes } from "../charts/Visualization";
import { ChargebackTable } from "../kpis/ChargebackTable";
import { KpiCard } from "../kpis/KpiCard";
import { Section } from "../layout/Section";
import { Skeleton } from "../ui/skeleton";

const AREA_AXES = defineAxes([
  {
    id: "x",
    type: "time" as const,
    position: "bottom" as const,
    accessor: (d) => new Date((d as { date: string }).date),
    numTicks: 5,
  },
  {
    id: "y",
    type: "linear" as const,
    position: "left" as const,
    accessor: (d) => (d as { value: number }).value,
    domain: "auto" as const,
    numTicks: 4,
  },
]);

const BAND_AXES = defineAxes([
  {
    id: "x",
    type: "band" as const,
    position: "bottom" as const,
    accessor: (d) => (d as { label: string }).label,
  },
  {
    id: "y",
    type: "linear" as const,
    position: "left" as const,
    accessor: (d) => (d as { value: number }).value,
    domain: "auto" as const,
    numTicks: 3,
  },
]);

function AnomalyDayBox({
  date,
  dailyCost,
  avgDailyCost,
}: {
  date: string;
  dailyCost: number;
  avgDailyCost: number;
}): JSX.Element {
  const parts = date.split("-");
  const label = `${parts[2]}/${parts[1]}`;

  const ratio = avgDailyCost > 0 ? dailyCost / avgDailyCost : 1;
  const overage = ratio - 1;

  let bg: string, textColor: string, borderColor: string;
  if (overage >= 0.5) {
    bg = "#fef2f2";
    textColor = "#991b1b";
    borderColor = "#fecaca";
  } else if (overage >= 0.2) {
    bg = "#fefce8";
    textColor = "#713f12";
    borderColor = "#fde68a";
  } else {
    bg = "#f0fdf4";
    textColor = "#166534";
    borderColor = "#bbf7d0";
  }

  return (
    <div
      title={`${date}: ${formatCurrency(dailyCost)} (avg ${formatCurrency(avgDailyCost)})`}
      className="flex flex-col items-center justify-center rounded gap-0.5"
      style={{
        width: 48,
        height: 48,
        background: bg,
        color: textColor,
        border: `1px solid ${borderColor}`,
        fontSize: 9,
        fontWeight: 500,
        lineHeight: "1.25",
        flexShrink: 0,
      }}
    >
      <span>{label}</span>
      <span style={{ fontSize: 8 }}>{formatCurrency(dailyCost)}</span>
    </div>
  );
}

export function Billing(): JSX.Element {
  const params = filterQueryParams.value;

  const billingQuery = useQuery<BillingResponse>({
    queryKey: ["billing", params],
    queryFn: () =>
      fetch("/api/analytics/billing?" + buildQueryParams(params)).then((r) => {
        if (!r.ok) throw new Error(r.statusText);
        return r.json() as Promise<BillingResponse>;
      }),
  });

  const billing = billingQuery.data;
  const isLoading = billingQuery.isLoading;

  // Spend area series for cumulative chart
  const spendSeries = (() => {
    if (!billing) return [];
    const ih = billing.invoice_history;
    const last = ih[ih.length - 1];
    const currentMonthStart = billing.period.to.slice(0, 7) + "-01";
    const actualSeries = {
      id: "actual",
      label: "Actual",
      color: undefined as string | undefined,
      formatValue: formatCurrency,
      dashed: undefined as boolean | undefined,
      fillOpacity: undefined as number | undefined,
      data: ih.map((h) => ({ date: h.month + "-01", value: h.total_billed })),
    };
    const projectedSeries = last
      ? {
          id: "projected",
          label: "Projected",
          color: undefined as string | undefined,
          formatValue: formatCurrency,
          dashed: true,
          fillOpacity: undefined as number | undefined,
          data: [
            { date: last.month + "-01", value: last.total_billed },
            { date: currentMonthStart, value: billing.projected_month_end },
          ],
        }
      : null;
    return projectedSeries ? [actualSeries, projectedSeries] : [actualSeries];
  })();

  // Reading filterQueryParams.value here gives preact a signal dep so the computed
  // goes stale when the filter changes, forcing re-evaluation with fresh billing data.
  const spendDataSig = useDeepComputed(() => {
    void filterQueryParams.value;
    const result: Record<
      string,
      Array<{ date: string; value: number; [k: string]: unknown }>
    > = {};
    for (const s of spendSeries) {
      result[s.id] = s.data.map((d) => ({ ...d, [s.id]: d.value }));
    }
    return result;
  });

  const invoiceDataSig = useDeepComputed(() => {
    void filterQueryParams.value;
    return {
      bars: billing
        ? billing.invoice_history.map((h) => ({
            label: h.month,
            value: h.total_billed,
            bars: h.total_billed,
          }))
        : ([] as Array<{ label: string; value: number; bars: number }>),
    };
  });

  // Derived values
  const budgetRemaining = billing
    ? billing.monthly_budget - billing.current_month_spend
    : 0;
  const annualBudget = billing ? billing.monthly_budget * 12 : 0;
  const annualDelta = billing
    ? annualBudget - billing.projected_annual_spend
    : 0;
  const anomalyCount = billing
    ? billing.cost_anomaly_days.filter((d) => d.is_anomaly).length
    : 0;

  // Period spend sparkline derived from daily cost anomaly data
  const periodSpendTrend = billing
    ? billing.cost_anomaly_days.map((d) => ({
        date: d.date,
        value: d.daily_cost,
      }))
    : undefined;

  return (
    <Section id="billing" labelledBy="billing-heading">
      <div className="mb-6">
        <h2
          id="billing-heading"
          className="text-[22px] font-bold tracking-tight text-foreground"
        >
          Billing & Financial
        </h2>
        <p className="text-[13px] text-muted-foreground mt-1">
          Spend tracking, budget utilization, and cost analysis
        </p>
      </div>

      {isLoading ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </>
      ) : (
        <>
          {/* Row 1: Budget Utilization, Projected Annual Spend, New User Activation Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <KpiCard
              label="Budget Utilization"
              value={
                billing
                  ? formatPercent(billing.budget_utilization, 1)
                  : undefined
              }
              subValue={
                billing
                  ? `${formatCurrency(billing.current_month_spend)} of ${formatCurrency(billing.monthly_budget)} budget`
                  : undefined
              }
              delta={billing ? budgetRemaining : undefined}
              deltaFormat="currency"
              deltaLabel="budget remaining"
              trend={periodSpendTrend}
              trendColor="#7c3aed"
              formulaTooltip="Percentage of monthly budget consumed so far, with daily spend trend."
              exampleTooltip="e.g. 65.3%"
            />
            <KpiCard
              label="Projected Annual Spend"
              value={
                billing
                  ? formatCurrency(billing.projected_annual_spend)
                  : undefined
              }
              delta={billing ? annualDelta : undefined}
              deltaFormat="currency"
              deltaLabel={
                billing
                  ? annualDelta >= 0
                    ? "under budget"
                    : "above budget risk"
                  : undefined
              }
              trend={
                billing
                  ? billing.invoice_history.map((h) => ({
                      date: h.month + "-01",
                      value: h.total_billed,
                    }))
                  : undefined
              }
              trendColor="#7c3aed"
              formulaTooltip="Annualized spend based on current burn rate vs. annual budget."
              exampleTooltip="e.g. $157,300"
            />
            <KpiCard
              label="New User Activation Cost"
              value={
                billing && billing.new_user_activation_cost !== null
                  ? formatCurrency(billing.new_user_activation_cost)
                  : billing
                    ? ""
                    : undefined
              }
              insufficientData={
                billing ? billing.new_user_activation_cost === null : undefined
              }
              delta={
                billing &&
                billing.new_user_activation_cost !== null &&
                billing.new_user_activation_cost_prior !== null
                  ? -computeDeltaPercent(
                      billing.new_user_activation_cost,
                      billing.new_user_activation_cost_prior,
                    )
                  : undefined
              }
              deltaLabel="WoW"
              trend={
                billing && billing.new_user_activation_cost !== null
                  ? billing.new_user_activation_cost_trend
                  : undefined
              }
              trendColor="#7c3aed"
              formulaTooltip="Total cost attributed to onboarding new users."
              exampleTooltip="e.g. $50.00"
            />
            {/* Row 2: Cost per Successful Run, Token Rate Efficiency, Cost of Failed Runs */}
            <KpiCard
              label="Cost per Successful Run"
              value={
                billing
                  ? formatCurrency(billing.cost_per_successful_run)
                  : undefined
              }
              delta={
                billing
                  ? -computeDeltaPercent(
                      billing.cost_per_successful_run,
                      billing.cost_per_successful_run_prior,
                    )
                  : undefined
              }
              deltaLabel="WoW"
              trend={
                billing ? billing.cost_per_successful_run_trend : undefined
              }
              trendColor="#7c3aed"
              formulaTooltip="Total cost divided by the number of successful runs."
              exampleTooltip="e.g. $1.21"
            />
            <KpiCard
              label="Token Rate Efficiency"
              value={
                billing
                  ? `${formatCurrency(billing.token_rate_actual)}/1M`
                  : undefined
              }
              subValue={
                billing
                  ? `${formatPercent(((billing.token_rate_list - billing.token_rate_actual) / billing.token_rate_list) * 100, 1)} below list (${formatCurrency(billing.token_rate_list)}/1M)`
                  : undefined
              }
              delta={
                billing
                  ? -computeDeltaPercent(
                      billing.token_rate_actual,
                      billing.token_rate_actual_prior,
                    )
                  : undefined
              }
              deltaLabel="WoW"
              trend={billing ? billing.token_rate_trend : undefined}
              trendColor="#7c3aed"
              formulaTooltip="Effective token rate vs. list price."
              exampleTooltip="e.g. $2.40/1M"
            />
            <KpiCard
              label="Cost of Failed Runs"
              value={
                billing
                  ? formatCurrency(billing.cost_of_failed_runs)
                  : undefined
              }
              subValue={
                billing && billing.current_month_spend > 0
                  ? `${formatPercent((billing.cost_of_failed_runs / billing.current_month_spend) * 100, 1)} of period spend`
                  : "0.0% of period spend"
              }
              delta={
                billing
                  ? -computeDeltaPercent(
                      billing.cost_of_failed_runs,
                      billing.cost_of_failed_runs_prior,
                    )
                  : undefined
              }
              deltaLabel="WoW"
              trend={billing ? billing.cost_of_failed_runs_trend : undefined}
              trendColor="#7c3aed"
              formulaTooltip="API spend on runs that ultimately failed."
              exampleTooltip="e.g. $1,420"
            />
          </div>

          {/* Row 3: Cumulative Spend vs Budget + Invoice History */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <figure
              className="rounded-lg border bg-card shadow-sm p-6"
              aria-label="Cumulative spend vs budget"
            >
              <div className="mb-4">
                <p className="text-[14px] font-semibold text-foreground">
                  Cumulative spend vs budget
                </p>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Monthly actual and projected spend
                </p>
              </div>
              <Visualization
                data={spendDataSig}
                axes={AREA_AXES}
                ariaLabel="Cumulative spend vs budget"
              >
                {(Viz) => (
                  <>
                    {spendSeries.map((s) => (
                      <Viz.AreaChart
                        key={s.id}
                        series={s.id}
                        axis="y"
                        color={s.color}
                        dashed={s.dashed}
                        fillOpacity={s.fillOpacity}
                      />
                    ))}
                    {billing && (
                      <Viz.Annotation
                        axis="y"
                        value={billing.monthly_budget}
                        label="Budget"
                      />
                    )}
                    <Viz.SeriesTooltip
                      series={spendSeries.map((s) => ({
                        id: s.id,
                        label: s.label,
                        color: s.color,
                        dashed: s.dashed,
                        formatValue: s.formatValue,
                      }))}
                    />
                  </>
                )}
              </Visualization>
            </figure>
            <figure
              className="rounded-lg border bg-card shadow-sm p-6"
              aria-label="Invoice history"
            >
              <div className="mb-4">
                <p className="text-[14px] font-semibold text-foreground">
                  Invoice history
                </p>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Monthly billed amounts
                </p>
              </div>
              <Visualization
                data={invoiceDataSig}
                axes={BAND_AXES}
                ariaLabel="Invoice history"
              >
                {(Viz) => (
                  <>
                    <Viz.ColumnChart series="bars" axis="y" />
                    <Viz.SeriesTooltip
                      matchKey="label"
                      series={[
                        {
                          id: "bars",
                          label: "Monthly Billed",
                          formatValue: formatCurrency,
                        },
                      ]}
                    />
                  </>
                )}
              </Visualization>
            </figure>
          </div>

          {/* Row 4: Team cost allocation DonutChart + ChargebackTable */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <figure
              className="rounded-lg border bg-card shadow-sm p-6"
              aria-label="Cost by team"
            >
              <div className="mb-4">
                <p className="text-[14px] font-semibold text-foreground">
                  Cost by team
                </p>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Token and seat cost allocation
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-6">
                <DonutChart
                  slices={
                    billing
                      ? billing.cost_by_team.map((t, i) => ({
                          label: t.team_name,
                          value: t.total,
                          color: teamColor(t.team_id, i),
                        }))
                      : []
                  }
                  size={160}
                  ariaLabel="Cost by team"
                />
                {billing && (
                  <DonutLegend
                    items={billing.cost_by_team.map((t, i) => ({
                      color: teamColor(t.team_id, i),
                      title: t.team_name,
                      renderDetail: () => (
                        <>
                          <span>{t.percentage}%</span>
                          <span className="text-foreground font-medium">
                            {" "}
                            - {formatCurrency(t.total)}
                          </span>
                        </>
                      ),
                    }))}
                  />
                )}
              </div>
            </figure>
            <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b">
                <p className="text-[14px] font-semibold text-foreground">
                  Cost chargeback
                </p>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Team cost breakdown by seat and token usage
                </p>
              </div>
              <ChargebackTable rows={billing ? billing.cost_by_team : []} />
            </div>
          </div>

          {/* Row 5: Cost anomaly calendar */}
          <div className="mt-4">
            <figure
              className="rounded-lg border bg-card shadow-sm p-6"
              aria-label="Cost anomaly calendar"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[14px] font-semibold text-foreground">
                    Cost anomaly calendar
                  </p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    Days with anomalous spend highlighted
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-shrink-0 mt-0.5">
                  <span className="flex items-center gap-1">
                    <span
                      className="inline-block w-3 h-3 rounded-sm"
                      style={{
                        background: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                      }}
                    />
                    Normal
                  </span>
                  <span className="flex items-center gap-1">
                    <span
                      className="inline-block w-3 h-3 rounded-sm"
                      style={{
                        background: "#fefce8",
                        border: "1px solid #fde68a",
                      }}
                    />
                    +20-50%
                  </span>
                  <span className="flex items-center gap-1">
                    <span
                      className="inline-block w-3 h-3 rounded-sm"
                      style={{
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                      }}
                    />
                    &gt;+50%
                  </span>
                </div>
              </div>
              <div
                className="flex flex-wrap gap-1"
                role="list"
                aria-label="Daily cost anomaly"
              >
                {billing &&
                  billing.cost_anomaly_days.map((day) => (
                    <div key={day.date} role="listitem">
                      <AnomalyDayBox
                        date={day.date}
                        dailyCost={day.daily_cost}
                        avgDailyCost={day.avg_daily_cost}
                      />
                    </div>
                  ))}
              </div>
              {billing && (
                <div className="flex items-center gap-x-6 mt-4 pt-4 border-t text-[13px] text-muted-foreground">
                  <span>
                    <strong className="text-foreground">{anomalyCount}</strong>{" "}
                    anomaly alert{anomalyCount !== 1 ? "s" : ""} this period
                  </span>
                  <span>
                    Avg daily cost:{" "}
                    <strong className="text-foreground">
                      {billing.cost_anomaly_days.length > 0
                        ? formatCurrency(
                            billing.cost_anomaly_days.reduce(
                              (s, d) => s + d.daily_cost,
                              0,
                            ) / billing.cost_anomaly_days.length,
                          )
                        : "-"}
                    </strong>
                  </span>
                </div>
              )}
            </figure>
          </div>
        </>
      )}
    </Section>
  );
}
