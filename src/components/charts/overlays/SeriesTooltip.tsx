import { useDeepComputed } from "@/hooks/useDeepComputed";
import { useVisualizationContext } from "../VisualizationContext";

export interface SeriesTooltipSeries {
  id: string;
  label: string;
  color?: string;
  formatValue?: (v: number) => string;
  /** y-axis id for this series; defaults to "y" */
  axis?: string;
}

export interface SeriesTooltipProps {
  series: SeriesTooltipSeries[];
  /** Data key used to match active point to series rows; defaults to "date" */
  matchKey?: string;
}

const TOOLTIP_W = 180;
const TOOLTIP_HEADER_H = 24;
const ROW_H = 18;
const TOOLTIP_GAP = 10;

export function SeriesTooltip({
  series,
  matchKey = "date",
}: SeriesTooltipProps): JSX.Element | null {
  const {
    activePoint,
    dataSignal,
    baseScale,
    baseAxisAccessor,
    scales,
    innerHeight,
    innerWidth,
    tokens,
  } = useVisualizationContext();

  const earlyReturn = useDeepComputed(() =>
    Boolean(!activePoint.value || !baseScale.value || !baseAxisAccessor.value),
  ).value;
  if (earlyReturn) return null;

  const primaryDatum =
    (activePoint.value?.datum as Record<string, unknown>) ?? {};
  const matchValue = primaryDatum[matchKey];
  if (matchValue === undefined || matchValue === null) return null;

  const bScale = baseScale.value;
  const halfBw =
    bScale !== null && "bandwidth" in (bScale as object)
      ? (bScale as { bandwidth: () => number }).bandwidth() / 2
      : 0;

  const xFn = bScale as (v: unknown) => number;
  const x = xFn(baseAxisAccessor.value?.(primaryDatum) ?? primaryDatum) + halfBw;
  const h = innerHeight.value;
  const w = innerWidth.value;

  const points = series.flatMap((s) => {
    const seriesData = (dataSignal.value[s.id] ?? []) as Record<
      string,
      unknown
    >[];
    const match = seriesData.find((d) => d[matchKey] === matchValue);
    if (!match) return [];
    const val = match[s.id] as number | undefined;
    if (val === undefined || val === null) return [];
    const yFn = scales.value[s.axis ?? "y"] as
      | ((v: unknown) => number)
      | undefined;
    if (!yFn) return [];
    const y = yFn(val);
    if (isNaN(y)) return [];
    return [{ s, val, y }];
  });

  if (points.length === 0) return null;

  const TOOLTIP_H = TOOLTIP_HEADER_H + points.length * ROW_H + 8;
  const tooltipX =
    x + TOOLTIP_GAP + TOOLTIP_W > w
      ? x - TOOLTIP_W - TOOLTIP_GAP
      : x + TOOLTIP_GAP;

  let headerLabel = String(matchValue);
  if (matchKey === "date") {
    try {
      headerLabel = new Date(
        (matchValue as string) + "T00:00:00",
      ).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      // keep raw value
    }
  }

  return (
    <g pointerEvents="none">
      <line
        x1={x}
        x2={x}
        y1={0}
        y2={h}
        stroke={tokens.border}
        strokeWidth={1}
      />
      {points.map(({ s, y }) => (
        <circle
          key={s.id}
          cx={x}
          cy={y}
          r={4}
          fill={s.color ?? tokens.primary}
          stroke="#fff"
          strokeWidth={2}
        />
      ))}
      <rect
        x={tooltipX}
        y={4}
        width={TOOLTIP_W}
        height={TOOLTIP_H}
        rx={4}
        fill="white"
        stroke={tokens.border}
        style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.10))" }}
      />
      <text
        x={tooltipX + 8}
        y={20}
        fontSize={10}
        fontWeight={600}
        fill={tokens.muted}
      >
        {headerLabel}
      </text>
      {points.map(({ s, val }, i) => {
        const rowY = 4 + TOOLTIP_HEADER_H + i * ROW_H;
        const display = s.formatValue
          ? s.formatValue(val)
          : val.toLocaleString("en-US", { maximumFractionDigits: 0 });
        return (
          <g key={s.id}>
            <circle
              cx={tooltipX + 10}
              cy={rowY + 6}
              r={3}
              fill={s.color ?? tokens.primary}
            />
            <text
              x={tooltipX + 19}
              y={rowY + 10}
              fontSize={10}
              fill={tokens.muted}
            >
              {s.label}
            </text>
            <text
              x={tooltipX + TOOLTIP_W - 8}
              y={rowY + 10}
              fontSize={10}
              fontWeight={600}
              fill={tokens.muted}
              textAnchor="end"
            >
              {display}
            </text>
          </g>
        );
      })}
    </g>
  );
}
