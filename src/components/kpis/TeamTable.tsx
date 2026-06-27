import { useSignal } from "@preact/signals-react";
import { useDeepComputed } from "../../hooks/useDeepComputed";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from "../../lib/kpi/formatters";
import { teamColor } from "../../lib/team/teamColors";
import type { TeamMetrics } from "../../types/api";
import { SparklineChart } from "../charts/SparklineChart";
import { Visualization, defineAxes } from "../charts/Visualization";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

type SortKey =
  | "runs"
  | "cost"
  | "mau"
  | "adoption_rate"
  | "avg_quality_score"
  | "failed_run_rate"
  | "cost_per_quality_point"
  | "wow_cost_change";

type SortDirection = "asc" | "desc";

export interface TeamTableProps {
  teams: TeamMetrics[];
  orgAvgFailedRunRate: number;
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

function compareFn(
  key: SortKey,
  dir: SortDirection,
): (a: TeamMetrics, b: TeamMetrics) => number {
  return (a, b) => {
    const av = a[key];
    const bv = b[key];
    if (av === null && bv === null) return 0;
    if (av === null) return 1;
    if (bv === null) return -1;
    const diff = (av as number) - (bv as number);
    return dir === "asc" ? diff : -diff;
  };
}

function failedRateColorClass(rate: number): string {
  if (rate < 0.05) return "text-green-600";
  if (rate < 0.1) return "text-orange-500";
  return "text-red-600";
}

function StarRating({ score }: { score: number }): JSX.Element {
  const filled = Math.round(score);
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className="text-base leading-none"
          style={{ color: i < filled ? "#f59e0b" : "#d1d5db" }}
          aria-hidden="true"
        >
          &#9733;
        </span>
      ))}
      <span className="text-xs text-muted-foreground ml-1">
        {score.toFixed(1)}
      </span>
    </span>
  );
}

function TeamRow({ team }: { team: TeamMetrics }): JSX.Element {
  const trendDataSig = useDeepComputed(() => ({
    trend: team.cost_trend.map((p) => ({
      date: p.date,
      value: p.cost,
      trend: p.cost,
    })),
  }));

  return (
    <TableRow>
      <TableCell>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: teamColor(team.team_id) }}
            />
            <span className="font-medium text-sm">{team.team_name}</span>
          </div>
          {team.churn_signal_count > 0 && (
            <Badge
              className="text-[10px] h-5 w-fit px-1.5 py-0 bg-amber-100 text-amber-700 border border-amber-200"
              variant="secondary"
            >
              Churn Risk
            </Badge>
          )}
        </div>
      </TableCell>

      <TableCell>
        <div className="flex flex-col gap-0.5">
          <span>{formatNumber(team.runs)}</span>
          {team.wow_runs_change < 0 && (
            <span className="text-[11px] text-orange-500 font-medium">
              -{Math.abs(Math.round(team.wow_runs_change))}% WoW
            </span>
          )}
        </div>
      </TableCell>

      <TableCell>{formatCurrency(team.cost)}</TableCell>

      <TableCell>
        <div className="flex flex-col gap-0.5">
          <span>{formatNumber(team.mau)}</span>
          {team.mau_prior !== team.mau && (
            <span className="text-[11px] text-muted-foreground">
              was {formatNumber(team.mau_prior)}
            </span>
          )}
        </div>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-8 shrink-0">
            {Math.round(team.adoption_rate)}%
          </span>
          <div className="flex-1 min-w-[60px]">
            <Progress
              value={team.adoption_rate}
              fill={teamColor(team.team_id)}
            />
          </div>
        </div>
      </TableCell>

      <TableCell>
        {team.avg_quality_score !== null ? (
          <StarRating score={team.avg_quality_score} />
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>

      <TableCell className={failedRateColorClass(team.failed_run_rate)}>
        {formatPercent(team.failed_run_rate)}
      </TableCell>

      <TableCell style={{ maxWidth: "160px", width: "160px" }}>
        <Visualization data={trendDataSig} axes={SPARKLINE_AXES} height={40}>
          {() => (
            <SparklineChart
              series="trend"
              axis="y"
              color={teamColor(team.team_id)}
            />
          )}
        </Visualization>
      </TableCell>
    </TableRow>
  );
}

export function TeamTable({
  teams,
  orgAvgFailedRunRate: _orgAvgFailedRunRate,
}: TeamTableProps): JSX.Element {
  const sortKey = useSignal<SortKey>("runs");
  const sortDir = useSignal<SortDirection>("desc");

  const sortedTeams = useDeepComputed(() =>
    [...teams].sort(compareFn(sortKey.value, sortDir.value)),
  );

  function handleSort(key: SortKey): void {
    if (sortKey.value === key) {
      sortDir.value = sortDir.value === "desc" ? "asc" : "desc";
    } else {
      sortKey.value = key;
      sortDir.value = "desc";
    }
  }

  function sortIndicator(key: SortKey): string {
    if (sortKey.value !== key) return "";
    return sortDir.value === "desc" ? " ▼" : " ▲";
  }

  const rows = sortedTeams.value;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Team</TableHead>
          <TableHead
            className="cursor-pointer"
            onClick={() => handleSort("runs")}
          >
            Runs{sortIndicator("runs")}
          </TableHead>
          <TableHead
            className="cursor-pointer"
            onClick={() => handleSort("cost")}
          >
            Cost{sortIndicator("cost")}
          </TableHead>
          <TableHead
            className="cursor-pointer"
            onClick={() => handleSort("mau")}
          >
            Users{sortIndicator("mau")}
          </TableHead>
          <TableHead
            className="cursor-pointer"
            onClick={() => handleSort("adoption_rate")}
          >
            Adoption{sortIndicator("adoption_rate")}
          </TableHead>
          <TableHead
            className="cursor-pointer"
            onClick={() => handleSort("avg_quality_score")}
          >
            Quality{sortIndicator("avg_quality_score")}
          </TableHead>
          <TableHead
            className="cursor-pointer"
            onClick={() => handleSort("failed_run_rate")}
          >
            Failure Rate{sortIndicator("failed_run_rate")}
          </TableHead>
          <TableHead>WoW Trend</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((team) => (
          <TeamRow key={team.team_id} team={team} />
        ))}
      </TableBody>
    </Table>
  );
}
