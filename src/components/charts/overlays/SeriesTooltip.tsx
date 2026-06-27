import { useDeepComputed } from "@/hooks/useDeepComputed";
import { useVisualizationContext } from "../VisualizationContext";

export interface SeriesTooltipSeries {
  id: string;
  label: string;
  color?: string;
  formatValue?: (v: number) => string;
}

export interface SeriesTooltipProps {
  series: SeriesTooltipSeries[];
}

const TOOLTIP_W = 180;
const TOOLTIP_HEADER_H = 24;
const ROW_H = 18;
const TOOLTIP_GAP = 10;

export function SeriesTooltip({
  series,
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
  const date = primaryDatum["date"] as string | undefined;
  if (!date) return null;

  const xFn = baseScale.value as (v: unknown) => number;
  const x = xFn(baseAxisAccessor.value?.(primaryDatum) ?? primaryDatum);
  const h = innerHeight.value;
  const w = innerWidth.value;
  const yFn = scales.value.y as ((v: unknown) => number) | undefined;
  if (!yFn) return null;

  const points = series.flatMap((s) => {
    const seriesData = (dataSignal.value[s.id] ?? []) as Record<
      string,
      unknown
    >[];
    const match = seriesData.find((d) => d["date"] === date);
    if (!match) return [];
    const val = match[s.id] as number | undefined;
    if (val === undefined || val === null) return [];
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

  let formattedDate = date;
  try {
    formattedDate = new Date(date + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    // keep raw date string
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
        {formattedDate}
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
