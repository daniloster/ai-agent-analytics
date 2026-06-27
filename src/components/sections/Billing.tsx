import { useQuery } from "@tanstack/react-query";
import { useDeepComputed } from "../../hooks/useDeepComputed";
import { filterQueryParams } from "../../lib/filters/filterSignals";
import { formatCurrency, formatPercent } from "../../lib/kpi/formatters";
import type { BillingResponse, OverviewResponse } from "../../types/api";
import { buildQueryParams } from "../../utils/buildQueryParams";
import { AreaChart } from "../charts/AreaChart";
import { ColumnChart, ColumnTrendLine } from "../charts/ColumnChart";
import { DonutChart } from "../charts/DonutChart";
import { GaugeChart } from "../charts/GaugeChart";
import { Heatmap } from "../charts/Heatmap";
import { Annotation } from "../charts/overlays/Annotation";
import { SeriesTooltip } from "../charts/overlays/SeriesTooltip";
import { useChartTokens } from "../charts/primitives/useChartTokens";
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
  },
]);

export function Billing(): JSX.Element {
  const params = filterQueryParams.value;
  const tokens = useChartTokens();

  const billingQuery = useQuery<BillingResponse>({
    queryKey: ["billing", params],
    queryFn: () =>
      fetch("/api/analytics/billing?" + buildQueryParams(params)).then(
        (r) => r.json() as Promise<BillingResponse>,
      ),
  });

  const overviewQuery = useQuery<OverviewResponse>({
    queryKey: ["overview", params],
    queryFn: () =>
      fetch("/api/analytics/overview?" + buildQueryParams(params)).then(
        (r) => r.json() as Promise<OverviewResponse>,
      ),
  });

  const billing = billingQuery.data;
  const overview = overviewQuery.data;
  const isLoading = billingQuery.isLoading || overviewQuery.isLoading;

  // Build spend area series config from billing data
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

  const spendDataSig = useDeepComputed(() => {
    const result: Record<
      string,
      Array<{ date: string; value: number; [k: string]: unknown }>
    > = {};
    for (const s of spendSeries) {
      result[s.id] = s.data.map((d) => ({ ...d, [s.id]: d.value }));
    }
    return result;
  });

  const invoiceDataSig = useDeepComputed(() => ({
    bars: billing
      ? billing.invoice_history.map((h) => ({
          label: h.month,
          value: h.total_billed,
          bars: h.total_billed,
        }))
      : ([] as Array<{ label: string; value: number; bars: number }>),
  }));

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
          <div className="grid grid-cols-4 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </>
      ) : (
        <>
          {/* Row 1: Current Month Spend, Projected Month-End, GaugeChart, Projected Annual */}
          <div className="grid grid-cols-4 gap-4">
            <KpiCard
              label="Current Month Spend"
              value={
                billing
                  ? formatCurrency(billing.current_month_spend)
                  : undefined
              }
              subValue={
                billing
                  ? `of ${formatCurrency(billing.monthly_budget)} budget`
                  : undefined
              }
              formulaTooltip="Total API spend so far this month."
              exampleTooltip="e.g. $9,800"
              trendColor="#7c3aed"
            />
            <KpiCard
              label="Projected Month-End"
              value={
                billing
                  ? formatCurrency(billing.projected_month_end)
                  : undefined
              }
              subValue={
                billing
                  ? `Day ${billing.days_elapsed} of ${billing.days_in_month}`
                  : undefined
              }
              formulaTooltip="Projected total spend by end of month at current burn rate."
              exampleTooltip="e.g. $14,200"
              trendColor="#7c3aed"
            />
            {billing && (
              <GaugeChart
                value={billing.budget_utilization}
                label={formatPercent(billing.budget_utilization, 1)}
                subLabel={`of ${formatCurrency(billing.monthly_budget)} budget`}
                tokens={tokens}
              />
            )}
            <KpiCard
              label="Projected Annual Spend"
              value={
                billing
                  ? formatCurrency(billing.projected_annual_spend)
                  : undefined
              }
              formulaTooltip="Annualized spend based on current 90-day average."
              exampleTooltip="e.g. $157,300"
              trendColor="#7c3aed"
            />
          </div>

          {/* Row 2: Cumulative Spend vs Budget + Invoice History */}
          <div className="grid grid-cols-2 gap-4 mt-4">
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
                {() => (
                  <>
                    {spendSeries.map((s) => (
                      <AreaChart
                        key={s.id}
                        series={s.id}
                        axis="y"
                        color={s.color}
                        dashed={s.dashed}
                        fillOpacity={s.fillOpacity}
                      />
                    ))}
                    {billing && (
                      <Annotation
                        axis="y"
                        value={billing.monthly_budget}
                        label="Budget"
                      />
                    )}
                    <SeriesTooltip
                      series={spendSeries.map((s) => ({
                        id: s.id,
                        label: s.label,
                        color: s.color,
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
                {() => (
                  <>
                    <ColumnChart series="bars" axis="y" />
                    <ColumnTrendLine series="bars" axis="y" />
                  </>
                )}
              </Visualization>
            </figure>
          </div>

          {/* Row 3: Team cost allocation DonutChart + ChargebackTable */}
          <div className="grid grid-cols-2 gap-4 mt-4">
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
              <DonutChart
                slices={
                  billing
                    ? billing.cost_by_team.map((t) => ({
                        label: t.team_name,
                        value: t.total,
                      }))
                    : []
                }
                ariaLabel="Cost by team"
              />
            </figure>
            <ChargebackTable rows={billing ? billing.cost_by_team : []} />
          </div>

          {/* Row 4: Cost anomaly Heatmap */}
          <div className="mt-4">
            <figure
              className="rounded-lg border bg-card shadow-sm p-6"
              aria-label="Cost anomaly calendar"
            >
              <div className="mb-4">
                <p className="text-[14px] font-semibold text-foreground">
                  Cost anomaly calendar
                </p>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Days with anomalous spend highlighted
                </p>
              </div>
              <Heatmap
                data={
                  billing
                    ? billing.cost_anomaly_days.map((d) => ({
                        date: d.date,
                        value: d.daily_cost,
                        isAnomaly: d.is_anomaly,
                        avgDailyCost: d.avg_daily_cost,
                      }))
                    : []
                }
                colorScale="cost"
                ariaLabel="Cost anomaly calendar"
                getAriaLabel={(d) =>
                  `${d.date}: $${d.value.toFixed(0)} (avg $${Number(d.avgDailyCost).toFixed(0)})`
                }
              />
            </figure>
          </div>

          {/* Row 5: Cost per Successful Run, Token Rate Efficiency, Cost of Failed Runs */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <KpiCard
              label="Cost per Successful Run"
              value={
                billing
                  ? formatCurrency(billing.cost_per_successful_run)
                  : undefined
              }
              formulaTooltip="Total cost divided by the number of successful runs."
              exampleTooltip="e.g. $1.21"
              trendColor="#7c3aed"
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
              formulaTooltip="Effective token rate vs. list price."
              exampleTooltip="e.g. $2.40/1M"
              trendColor="#7c3aed"
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
                  ? `${formatPercent((billing.cost_of_failed_runs / billing.current_month_spend) * 100, 1)} of monthly spend`
                  : "0.0% of monthly spend"
              }
              formulaTooltip="API spend on runs that ultimately failed."
              exampleTooltip="e.g. $1,420"
              trendColor="#7c3aed"
            />
          </div>

          {/* Row 6: Quality-Cost Efficiency, User Churn Risk, New User Activation Cost */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <KpiCard
              label="Quality-Cost Efficiency"
              value={
                overview && overview.quality_cost_efficiency !== null
                  ? overview.quality_cost_efficiency.toFixed(2)
                  : overview
                    ? ""
                    : undefined
              }
              insufficientData={
                overview ? overview.quality_cost_efficiency === null : undefined
              }
              formulaTooltip="(avg_quality * acceptance_rate) / cost_per_run."
              exampleTooltip="e.g. 1.60"
              trendColor="#7c3aed"
            />
            <KpiCard
              label="Churn Risk Users"
              value={overview ? String(overview.churn_risk_count) : undefined}
              formulaTooltip="Users showing declining engagement patterns."
              exampleTooltip="e.g. 5"
              trendColor="#7c3aed"
            />
            <KpiCard
              label="New User Activation Cost"
              value={
                overview && overview.new_user_activation_cost !== null
                  ? formatCurrency(overview.new_user_activation_cost)
                  : overview
                    ? ""
                    : undefined
              }
              insufficientData={
                overview
                  ? overview.new_user_activation_cost === null
                  : undefined
              }
              formulaTooltip="Total cost attributed to onboarding new users."
              exampleTooltip="e.g. $50.00"
              trendColor="#7c3aed"
            />
          </div>
        </>
      )}
    </Section>
  );
}
