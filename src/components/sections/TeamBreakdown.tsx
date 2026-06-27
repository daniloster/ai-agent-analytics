import { useQuery } from "@tanstack/react-query";
import { useDeepComputed } from "../../hooks/useDeepComputed";
import { filterQueryParams, teamId } from "../../lib/filters/filterSignals";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatQuality,
} from "../../lib/kpi/formatters";
import { teamColor } from "../../lib/team/teamColors";
import type { TeamsResponse } from "../../types/api";
import { BarChart } from "../charts/BarChart";
import { Visualization, defineAxes } from "../charts/Visualization";
import { KpiCard } from "../kpis/KpiCard";
import { TeamTable } from "../kpis/TeamTable";
import { Section } from "../layout/Section";
import { Skeleton } from "../ui/skeleton";

const QUALITY_LINE_COLOR = "#7c3aed";
const QUALITY_COLUMN_COLOR = "#2563eb55";

interface TeamQualityPoint {
  label: string;
  quality: number;
  volume: number;
}

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

function buildTeamQualityAxes(data: Record<string, unknown[]>) {
  const pts = (data["quality"] ?? []) as TeamQualityPoint[];
  const qValues = pts.map((p) => p.quality).filter((v): v is number => v !== null);
  const minQ = qValues.length > 0 ? Math.min(...qValues) : 1;
  const maxQ = qValues.length > 0 ? Math.max(...qValues) : 5;
  const paddedMin = Math.max(0, Math.floor((minQ - 0.5) * 2) / 2);
  // Extra headroom so DataLabels above the tallest bar are not clipped
  const paddedMax = Math.min(5.5, maxQ + 0.5);
  return [
    {
      id: "x",
      type: "band" as const,
      position: "bottom" as const,
      accessor: (d: Record<string, unknown>) =>
        (d as unknown as TeamQualityPoint).label,
    },
    {
      id: "quality_y",
      type: "linear" as const,
      position: "left" as const,
      accessor: (d: Record<string, unknown>) =>
        (d as unknown as TeamQualityPoint).quality ?? 0,
      domain: [paddedMin, paddedMax] as [number, number],
      numTicks: 3,
    },
    {
      id: "volume_y",
      type: "linear" as const,
      position: "right" as const,
      accessor: (d: Record<string, unknown>) =>
        (d as unknown as TeamQualityPoint).volume,
      hidden: true,
      numTicks: 3,
    },
  ];
}

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

  const teamQualityDataSig = useDeepComputed(() => {
    const teams = data?.teams ?? [];
    const qualified = [...teams]
      .filter((t) => t.avg_quality_score !== null)
      .sort((a, b) => (b.avg_quality_score ?? 0) - (a.avg_quality_score ?? 0));
    const pts: TeamQualityPoint[] = qualified.map((t) => ({
      label: t.team_name,
      quality: t.avg_quality_score as number,
      volume: t.rated_run_count,
    }));
    if (pts.length === 0) return {} as Record<string, TeamQualityPoint[]>;
    return { quality: pts, volume: pts };
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
        (() => {
          const team = data?.teams[0];
          if (!team) return null;
          const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#8b5cf6"];
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <KpiCard
                  label="Runs"
                  value={formatNumber(team.runs)}
                  formulaTooltip="Total number of AI agent runs for this team."
                  exampleTooltip="e.g. 1,234 runs"
                  trendColor={teamColor(team.team_id)}
                />
                <KpiCard
                  label="Cost"
                  value={formatCurrency(team.cost)}
                  formulaTooltip="Total API spend for this team in the selected period."
                  exampleTooltip="e.g. $500.00"
                  trendColor={teamColor(team.team_id)}
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
                  trendColor={teamColor(team.team_id)}
                />
                <KpiCard
                  label="Failed Rate"
                  value={formatPercent(team.failed_run_rate * 100)}
                  formulaTooltip="Percentage of runs that failed for this team."
                  exampleTooltip="e.g. 3.0%"
                  trendColor={teamColor(team.team_id)}
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
                  {(Viz) => (
                    <Viz.SparklineChart
                      series="trend"
                      axis="y"
                      color={teamColor(team.team_id)}
                    />
                  )}
                </Visualization>
              </figure>
            </div>
          );
        })()
      ) : (
        data && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
              <TeamTable
                teams={data.teams}
                orgAvgFailedRunRate={orgAvgFailedRunRate}
              />
              <div className="px-6 py-3 border-t text-[13px] text-muted-foreground">
                Showing {data.teams.length} teams
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <figure
                className="rounded-lg border bg-card shadow-sm p-6"
                aria-label="Runs per team"
              >
                <figcaption className="mb-4">
                  <p className="text-[14px] font-semibold text-foreground">
                    Runs per team
                  </p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    Total agent runs this period
                  </p>
                </figcaption>
                <BarChart
                  bars={[...data.teams]
                    .sort((a, b) => b.runs - a.runs)
                    .map((t) => ({
                      label: t.team_name,
                      value: t.runs,
                      color: teamColor(t.team_id),
                    }))}
                  formatValue={formatNumber}
                  barHeight={28}
                />
                <p className="text-[12px] text-muted-foreground mt-3 text-right">
                  Total&nbsp;&nbsp;
                  <span className="font-medium text-foreground">
                    {formatNumber(data.teams.reduce((s, t) => s + t.runs, 0))} runs
                  </span>
                </p>
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
                    Total token + infrastructure costs
                  </p>
                </figcaption>
                <BarChart
                  bars={[...data.teams]
                    .sort((a, b) => b.cost - a.cost)
                    .map((t) => ({
                      label: t.team_name,
                      value: t.cost,
                      color: teamColor(t.team_id),
                    }))}
                  formatValue={formatCurrency}
                  barHeight={28}
                />
                <p className="text-[12px] text-muted-foreground mt-3 text-right">
                  Total&nbsp;&nbsp;
                  <span className="font-medium text-foreground">
                    {formatCurrency(data.teams.reduce((s, t) => s + t.cost, 0))}
                  </span>
                </p>
              </figure>
            </div>

            <figure
              className="rounded-lg border bg-card shadow-sm p-6"
              aria-label="Quality score per team"
            >
              <figcaption className="mb-4">
                <p className="text-[14px] font-semibold text-foreground">
                  Quality score per team
                </p>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Average human-rated quality (1-5 scale)
                </p>
              </figcaption>
              <Visualization
                data={teamQualityDataSig}
                axes={buildTeamQualityAxes}
                ariaLabel="Quality score per team"
              >
                {(Viz) => (
                  <>
                    <Viz.ColumnChart
                      series="volume"
                      axis="volume_y"
                      color={QUALITY_COLUMN_COLOR}
                    />
                    <Viz.AreaChart
                      series="quality"
                      axis="quality_y"
                      color={QUALITY_LINE_COLOR}
                      centered
                    />
                    <Viz.DataLabels
                      series="quality"
                      axis="quality_y"
                      format={(v) => v.toFixed(1)}
                      centered
                    />
                    <Viz.SeriesTooltip
                      matchKey="label"
                      series={[
                        {
                          id: "quality",
                          label: "Avg Quality Score",
                          color: QUALITY_LINE_COLOR,
                          axis: "quality_y",
                          formatValue: (v) => v.toFixed(1),
                        },
                        {
                          id: "volume",
                          label: "Rating Volume",
                          color: QUALITY_COLUMN_COLOR,
                          axis: "volume_y",
                          formatValue: (v) => formatNumber(Math.round(v)),
                        },
                      ]}
                    />
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
