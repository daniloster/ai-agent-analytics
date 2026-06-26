import type { ReadonlySignal } from "@preact/signals-react";
import { useSignal } from "@preact/signals-react";
import { localPoint } from "@visx/event";
import { Group } from "@visx/group";
import { bisectCenter } from "d3-array";
import { useMemo, useRef } from "react";
import type { ActivePoint, AnyD3Scale, AxisConfig } from "../../types/charts";
import type { AreaProps } from "./marks/Area";
import { Area } from "./marks/Area";
import type { BarProps } from "./marks/Bar";
import { Bar } from "./marks/Bar";
import type { GaugeProps } from "./marks/Gauge";
import { Gauge } from "./marks/Gauge";
import type { HeatmapMarkProps } from "./marks/HeatmapMark";
import { HeatmapMark } from "./marks/HeatmapMark";
import type { LineProps } from "./marks/Line";
import { Line } from "./marks/Line";
import type { AnnotationProps } from "./overlays/Annotation";
import { Annotation } from "./overlays/Annotation";
import type { SeriesTooltipProps } from "./overlays/SeriesTooltip";
import { SeriesTooltip } from "./overlays/SeriesTooltip";
import { AxisBottom, AxisLeft, AxisRight } from "./primitives/Axis";
import { ChartSVG } from "./primitives/ChartSVG";
import { GridColumns, GridRows } from "./primitives/Grid";
import { buildScale } from "./primitives/scales";
import { useChartTokens } from "./primitives/useChartTokens";
import { VisualizationContext } from "./VisualizationContext";

export type VisMark<
  TData extends Record<string, unknown[]>,
  TAxisId extends string = string,
> = {
  Line: (props: LineProps<keyof TData & string, TAxisId>) => JSX.Element | null;
  Area: (props: AreaProps<keyof TData & string, TAxisId>) => JSX.Element | null;
  Bar: (props: BarProps<keyof TData & string, TAxisId>) => JSX.Element | null;
  Gauge: (props: GaugeProps<keyof TData & string>) => JSX.Element | null;
  HeatmapMark: (
    props: HeatmapMarkProps<keyof TData & string>,
  ) => JSX.Element | null;
  Annotation: (props: AnnotationProps<TAxisId>) => JSX.Element | null;
  SeriesTooltip: <TSeries extends keyof TData & string>(
    props: SeriesTooltipProps<Record<string, unknown>, TSeries>,
  ) => JSX.Element | null;
};

// Module-level singleton - all chart mark components collected for render-prop dispatch.
const VIS_MARKS = {
  Line,
  Area,
  Bar,
  Gauge,
  HeatmapMark,
  Annotation,
  SeriesTooltip,
};

export interface VisualizationProps<
  TKey extends string = string,
  TPoint = unknown,
  TData extends Record<TKey, TPoint[]> = Record<TKey, TPoint[]>,
  TAxes extends AxisConfig[] = AxisConfig[],
> {
  data: ReadonlySignal<TData>;
  axes: TAxes | ((data: TData) => TAxes);
  height?: number;
  className?: string;
  ariaLabel?: string;
  children: (marks: VisMark<TData, TAxes[number]["id"]>) => React.ReactNode;
}

const DEFAULT_MARGIN = { top: 10, right: 20, bottom: 40, left: 50 };
const ZERO_MARGIN = { top: 0, right: 0, bottom: 0, left: 0 };

// InnerProps uses Record<string, unknown[]> directly - the type boundary is enforced at Visualization.
interface InnerProps {
  data: ReadonlySignal<Record<string, unknown[]>>;
  axes: AxisConfig[] | ((data: Record<string, unknown[]>) => AxisConfig[]);
  ariaLabel?: string;
  fullWidth: number;
  fullHeight: number;
  children: React.ReactNode;
}

function VisualizationInner({
  data,
  axes,
  fullWidth,
  fullHeight,
  ariaLabel,
  children,
}: InnerProps): JSX.Element {
  const tokens = useChartTokens();
  const activePoint = useSignal<ActivePoint | null>(null);
  const mousePosition = useSignal<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Read signal in render body so the component re-renders when data changes.
  const dataValue = data.value;
  const resolvedAxes =
    typeof axes === "function" ? axes(dataValue) : axes;

  const allHidden = resolvedAxes.every((a) => a.hidden);
  const margin = allHidden ? ZERO_MARGIN : DEFAULT_MARGIN;
  const innerWidth = fullWidth - margin.left - margin.right;
  const innerHeight = fullHeight - margin.top - margin.bottom;

  // useMemo with innerWidth/innerHeight as explicit deps fixes the race where
  // scales were built with innerWidth=0 before ParentSize measured the container.
  const scales = useMemo<Record<string, AnyD3Scale>>(() => {
    const flat = Object.values(dataValue).flat() as Record<string, unknown>[];
    const result: Record<string, AnyD3Scale> = {};
    for (const axis of resolvedAxes) {
      result[axis.id] = buildScale(axis, flat, innerWidth, innerHeight);
    }
    return result;
  // resolvedAxes identity is stable for constant axes; fine to depend on it.
  }, [dataValue, resolvedAxes, innerWidth, innerHeight]);

  const baseAxisConfig =
    resolvedAxes.find((a) => a.position === "bottom") ?? null;
  const baseScale = baseAxisConfig ? scales[baseAxisConfig.id] : null;

  const rawData = (Object.values(dataValue)[0] ?? []) as Record<string, unknown>[];

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const point = localPoint(svgRef.current, event);
    if (!point) return;
    mousePosition.value = { x: point.x, y: point.y };

    if (baseScale && "invert" in baseScale && baseAxisConfig) {
      const invertFn = (baseScale as { invert: (v: number) => unknown }).invert;
      const x0 = invertFn.call(baseScale, point.x - margin.left);
      const domainValues = rawData.map((d) => baseAxisConfig.accessor(d));

      let idx: number;
      if (x0 instanceof Date) {
        idx = bisectCenter(
          domainValues.map((v) =>
            v instanceof Date ? v : new Date(v as string | number),
          ) as Date[],
          x0,
        );
      } else {
        idx = bisectCenter(
          domainValues.map((v) => Number(v)),
          x0 as number,
        );
      }

      const clampedIdx = Math.max(0, Math.min(idx, rawData.length - 1));
      const datum = rawData[clampedIdx];
      if (datum) {
        const xPx = (baseScale as (v: unknown) => number)(
          baseAxisConfig.accessor(datum),
        );
        activePoint.value = {
          series: "",
          axis: baseAxisConfig.id,
          datum,
          x: xPx + margin.left,
          y: point.y,
        };
      }
    }
  };

  const handlePointerLeave = () => {
    activePoint.value = null;
    mousePosition.value = null;
  };

  return (
    <VisualizationContext.Provider
      value={{
        dataSignal: data,
        innerWidth,
        innerHeight,
        tokens,
        scales,
        baseScale,
        baseAxisAccessor: baseAxisConfig?.accessor ?? null,
        activePoint,
        mousePosition,
      }}
    >
      <figure aria-label={ariaLabel}>
        <svg
          ref={svgRef}
          width={fullWidth}
          height={fullHeight}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          {resolvedAxes.map((axis) => {
            const scale = scales[axis.id];
            if (axis.hidden || !scale) return null;
            if (axis.position === "bottom") {
              return (
                <AxisBottom
                  key={axis.id}
                  scale={scale}
                  top={innerHeight + margin.top}
                  left={margin.left}
                  tickFormat={axis.tickFormat}
                  numTicks={axis.numTicks}
                  label={axis.label}
                  tokens={tokens}
                />
              );
            }
            if (axis.position === "left") {
              return (
                <Group key={axis.id} left={margin.left} top={margin.top}>
                  <GridRows
                    scale={scale}
                    width={innerWidth}
                    height={innerHeight}
                    tokens={tokens}
                  />
                  <AxisLeft
                    scale={scale}
                    tickFormat={axis.tickFormat}
                    numTicks={axis.numTicks}
                    label={axis.label}
                    tokens={tokens}
                  />
                </Group>
              );
            }
            if (axis.position === "right") {
              return (
                <AxisRight
                  key={axis.id}
                  scale={scale}
                  top={margin.top}
                  left={margin.left + innerWidth}
                  tickFormat={axis.tickFormat}
                  numTicks={axis.numTicks}
                  label={axis.label}
                  tokens={tokens}
                />
              );
            }
            return null;
          })}
          {baseAxisConfig && !baseAxisConfig.hidden && (
            <Group left={margin.left} top={margin.top}>
              <GridColumns
                scale={scales[baseAxisConfig.id]}
                width={innerWidth}
                height={innerHeight}
                tokens={tokens}
              />
            </Group>
          )}
          <Group left={margin.left} top={margin.top}>
            {children}
          </Group>
        </svg>
      </figure>
    </VisualizationContext.Provider>
  );
}

export function defineAxes<const TAxes extends AxisConfig[]>(
  axes: TAxes,
): TAxes {
  return axes;
}

export function Visualization<
  TKey extends string,
  TPoint,
  TData extends Record<TKey, TPoint[]>,
  const TAxes extends AxisConfig[],
>(
  props: VisualizationProps<TKey, TPoint, TData, TAxes>,
): JSX.Element {
  return (
    <ChartSVG height={props.height} className={props.className}>
      {(fullWidth, fullHeight) => (
        <VisualizationInner
          data={props.data as unknown as ReadonlySignal<Record<string, unknown[]>>}
          axes={props.axes as unknown as InnerProps["axes"]}
          ariaLabel={props.ariaLabel}
          fullWidth={fullWidth}
          fullHeight={fullHeight}
        >
          {props.children(
            VIS_MARKS as unknown as VisMark<TData, TAxes[number]["id"]>,
          )}
        </VisualizationInner>
      )}
    </ChartSVG>
  );
}
