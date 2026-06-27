import { useQuery } from "@tanstack/react-query";
import { useDeepComputed } from "../../hooks/useDeepComputed";
import { filterQueryParams, teamId } from "../../lib/filters/filterSignals";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatQuality,
} from "../../lib/kpi/formatters";
import type { TeamsResponse } from "../../types/api";
import { BarChart } from "../charts/BarChart";
import { ColumnChart } from "../charts/ColumnChart";
import { Annotation } from "../charts/overlays/Annotation";
import { SparklineChart } from "../charts/SparklineChart";
import { Visualization, defineAxes } from "../charts/Visualization";
import { KpiCard } from "../kpis/KpiCard";
import { TeamTable } from "../kpis/TeamTable";
import { Section } from "../layout/Section";
import { Skeleton } from "../ui/skeleton";

const COLORS = [
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#3b82f6",
  "#8b5cf6",
];

const SPARKLINE_AXES = defineAxes([
  {
    id: "x",
    type: "time" as const,
    position: "bottom" as const,
    accessor: (d) => new Date((d as { date: string }).date),
    hidden: true,
  },
  {
    id: "y",
    type: "linear" as const,
    position: "left" as const,
    accessor: (d) => (d as { value: number }).value,
    hidden: true,
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

export function TeamBreakdown(): JSX.Element {
  const params = filterQueryParams.value;

  const query = useQuery<TeamsResponse>({
    queryKey: ["teams", params],
    queryFn: () => {
      const sp = new URLSearchParams({ from: params.from, to: params.to });
      if (params.team_id) sp.set("team_id", params.team_id);
      return fetch("/api/analytics/teams?" + sp.toString()).then(
        (r) => r.json() as Promise<TeamsResponse>,
      );
    },
  });

  const currentTeamId = useDeepComputed(() => teamId.value);

  const data = query.data;

  const orgAvgFailedRunRate = data?.org_avg_failed_run_rate ?? 0;

  const nonNullQuality = data
    ? data.teams.filter((t) => t.cost_per_quality_point !== null)
    : [];
  const avgCostPerQualityPoint =
    nonNullQuality.length > 0
      ? Math.round(
          nonNullQuality.reduce(
            (sum, t) => sum + (t.cost_per_quality_point ?? 0),
            0,
          ) / nonNullQuality.length,
        )
      : null;

  // Data signals for chart consumers
  const sparklineDataSig = useDeepComputed(() => {
    const team = data?.teams[0];
    if (!team || currentTeamId.value === undefined) {
      return {
        trend: [] as Array<{ date: string; value: number; trend: number }>,
      };
    }
    return {
      trend: team.cost_trend.map((p) => ({
        date: p.date,
        value: p.cost,
        trend: p.cost,
      })),
    };
  });

  const qualityScoreDataSig = useDeepComputed(() => {
    const teams = data?.teams ?? [];
    const qualified = [...teams]
      .filter((t) => t.avg_quality_score !== null)
      .sort((a, b) => (b.avg_quality_score ?? 0) - (a.avg_quality_score ?? 0));
    return {
      scores: qualified.map((t) => ({
        label: t.team_name,
        value: t.avg_quality_score as number,
        scores: t.avg_quality_score as number,
      })),
    };
  });

  const cpqDataSig = useDeepComputed(() => {
    const teams = data?.teams ?? [];
    const qualified = [...teams]
      .filter((t) => t.cost_per_quality_point !== null)
      .sort(
        (a, b) =>
          (a.cost_per_quality_point ?? Infinity) -
          (b.cost_per_quality_point ?? Infinity),
      );
    return {
      cpq: qualified.map((t) => ({
        label: t.team_name,
        value: t.cost_per_quality_point as number,
        cpq: t.cost_per_quality_point as number,
      })),
    };
  });

  return (
    <Section id="teams" labelledBy="teams-heading">
      <div className="mb-6">
        <h2
          id="teams-heading"
          className="text-[22px] font-bold tracking-tight text-foreground"
        >
          Teams
        </h2>
        <p className="text-[13px] text-muted-foreground mt-1">
          Usage and cost breakdown by team
        </p>
      </div>

      {query.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : currentTeamId.value !== undefined ? (
        // Single-team detail view
        (() => {
          const team = data?.teams[0];
          if (!team) return null;
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <KpiCard
                  label="Runs"
                  value={formatNumber(team.runs)}
                  formulaTooltip="Total number of AI agent runs for this team."
                  exampleTooltip="e.g. 1,234 runs"
                  trendColor="#7c3aed"
                />
                <KpiCard
                  label="Cost"
                  value={formatCurrency(team.cost)}
                  formulaTooltip="Total API spend for this team in the selected period."
                  exampleTooltip="e.g. $500.00"
                  trendColor="#7c3aed"
                />
                <KpiCard
                  label="Quality Score"
                  value={
                    team.avg_quality_score !== null
                      ? formatQuality(team.avg_quality_score)
                      : ""
                  }
                  insufficientData={team.avg_quality_score === null}
                  insufficientDataReason={
                    team.avg_quality_score === null
                      ? "Fewer than 10 rated runs"
                      : undefined
                  }
                  formulaTooltip="Average quality score from rated runs (1-5 scale)."
                  exampleTooltip="e.g. 4.2 / 5.0"
                  trendColor="#7c3aed"
                />
                <KpiCard
                  label="Failed Rate"
                  value={formatPercent(team.failed_run_rate * 100)}
                  formulaTooltip="Percentage of runs that failed for this team."
                  exampleTooltip="e.g. 3.0%"
                  trendColor="#7c3aed"
                />
              </div>

              <figure>
                <figcaption className="text-sm font-medium mb-2">
                  Use cases
                </figcaption>
                <div role="list">
                  <div role="listitem">
                    <div className="flex h-6 rounded overflow-hidden">
                      {team.top_use_cases.map((seg, i) => (
                        <div
                          key={seg.category}
                          aria-label={seg.category}
                          style={{
                            width: seg.percentage + "%",
                            background: COLORS[i % COLORS.length],
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </figure>

              <figure>
                <figcaption className="text-sm font-medium mb-2">
                  Cost trend
                </figcaption>
                <Visualization
                  data={sparklineDataSig}
                  axes={SPARKLINE_AXES}
                  height={80}
                >
                  {() => <SparklineChart series="trend" axis="y" />}
                </Visualization>
              </figure>
            </div>
          );
        })()
      ) : (
        // Org-wide view
        data && (
          <div className="space-y-4">
            <TeamTable
              teams={data.teams}
              orgAvgFailedRunRate={orgAvgFailedRunRate}
            />

            <figure
              className="rounded-lg border bg-card shadow-sm p-6"
              aria-label="Runs per team"
            >
              <figcaption className="mb-4">
                <p className="text-[14px] font-semibold text-foreground">
                  Runs per team
                </p>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Total runs sorted by volume
                </p>
              </figcaption>
              <BarChart
                bars={[...data.teams]
                  .sort((a, b) => b.runs - a.runs)
                  .map((t) => ({ label: t.team_name, value: t.runs }))}
              />
            </figure>

            <figure
              className="rounded-lg border bg-card shadow-sm p-6"
              aria-label="Cost per team"
            >
              <figcaption className="mb-4">
                <p className="text-[14px] font-semibold text-foreground">
                  Cost per team
                </p>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Total API spend sorted by cost
                </p>
              </figcaption>
              <BarChart
                bars={[...data.teams]
                  .sort((a, b) => b.cost - a.cost)
                  .map((t) => ({ label: t.team_name, value: t.cost }))}
              />
            </figure>

            <figure
              className="rounded-lg border bg-card shadow-sm p-6"
              aria-label="Quality score per team"
            >
              <figcaption className="mb-4">
                <p className="text-[14px] font-semibold text-foreground">
                  Quality score per team
                </p>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Average rated quality scores
                </p>
              </figcaption>
              <Visualization
                data={qualityScoreDataSig}
                axes={BAND_AXES}
                ariaLabel="Quality score per team"
              >
                {() => <ColumnChart series="scores" axis="y" />}
              </Visualization>
            </figure>

            <figure
              className="rounded-lg border bg-card shadow-sm p-6"
              aria-label="Use cases by team"
            >
              <figcaption className="mb-4">
                <p className="text-[14px] font-semibold text-foreground">
                  Use cases by team
                </p>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Category distribution per team
                </p>
              </figcaption>
              <div role="list" className="space-y-2">
                {data.teams.map((team) => (
                  <div key={team.team_id} role="listitem">
                    <div className="text-xs text-muted-foreground mb-1">
                      {team.team_name}
                    </div>
                    <div className="flex h-6 rounded overflow-hidden">
                      {team.top_use_cases.map((seg, i) => (
                        <div
                          key={seg.category}
                          aria-label={seg.category}
                          style={{
                            width: seg.percentage + "%",
                            background: COLORS[i % COLORS.length],
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </figure>

            <figure
              className="rounded-lg border bg-card shadow-sm p-6"
              aria-label="Cost per quality point"
            >
              <figcaption className="mb-4">
                <p className="text-[14px] font-semibold text-foreground">
                  Cost per quality point
                </p>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Lower is better
                </p>
              </figcaption>
              <Visualization
                data={cpqDataSig}
                axes={BAND_AXES}
                ariaLabel="Cost per quality point"
              >
                {() => (
                  <>
                    <ColumnChart series="cpq" axis="y" />
                    {avgCostPerQualityPoint !== null && (
                      <Annotation
                        axis="y"
                        value={avgCostPerQualityPoint}
                        label="lower is better"
                        variant="warning"
                      />
                    )}
                  </>
                )}
              </Visualization>
            </figure>
          </div>
        )
      )}
    </Section>
  );
}
