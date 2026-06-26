import type { ReadonlySignal } from "@preact/signals-react";
import { useComputed, useSignal } from "@preact/signals-react";
import { localPoint } from "@visx/event";
import { Group } from "@visx/group";
import { bisectCenter } from "d3-array";
import { useMemo, useRef } from "react";
import { useDeepComputed } from "../../hooks/useDeepComputed";
import { useLiveSignal } from "../../hooks/useLiveSignal";
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

const ZERO_MARGIN = { top: 0, right: 0, bottom: 0, left: 0 };

type AxesValue = AxisConfig[] | ((data: Record<string, unknown[]>) => AxisConfig[]);

// InnerProps uses signals for all dimension/layout inputs.
interface InnerProps {
  data: ReadonlySignal<Record<string, unknown[]>>;
  axes: ReadonlySignal<AxesValue>;
  ariaLabel?: string;
  fullWidth: ReadonlySignal<number>;
  fullHeight: ReadonlySignal<number>;
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

  // Resolve axes - if a function, call with current data; deep-equal to suppress spurious updates.
  const resolvedAxes = useDeepComputed(() => {
    const axesVal = axes.value;
    return typeof axesVal === "function" ? axesVal(data.value) : axesVal;
  });

  const allHiddenSig = useComputed(() =>
    resolvedAxes.value.every((a) => a.hidden),
  );
  const marginSig = useComputed(() => {
    if (allHiddenSig.value) return ZERO_MARGIN;
    const hasRight = resolvedAxes.value.some(
      (a) => a.position === 'right' && !a.hidden,
    );
    return { top: 10, right: hasRight ? 55 : 20, bottom: 40, left: 72 };
  });

  // Inner dimensions are derived from outer signal dims and margin.
  const innerWidthSig = useComputed(
    () => fullWidth.value - marginSig.value.left - marginSig.value.right,
  );
  const innerHeightSig = useComputed(
    () => fullHeight.value - marginSig.value.top - marginSig.value.bottom,
  );

  // Scales - deep-equal check suppresses downstream updates when domain/range didn't change.
  const scalesSig = useDeepComputed<Record<string, AnyD3Scale>>(() => {
    const flat = Object.values(data.value).flat() as Record<string, unknown>[];
    const result: Record<string, AnyD3Scale> = {};
    for (const axis of resolvedAxes.value) {
      result[axis.id] = buildScale(
        axis,
        flat,
        innerWidthSig.value,
        innerHeightSig.value,
      );
    }
    return result;
  });

  const baseAxisConfigSig = useDeepComputed(
    () => resolvedAxes.value.find((a) => a.position === "bottom") ?? null,
  );
  const baseScaleSig = useComputed(() => {
    const cfg = baseAxisConfigSig.value;
    return cfg ? (scalesSig.value[cfg.id] ?? null) : null;
  });
  const baseAxisAccessorSig = useComputed(
    () => baseAxisConfigSig.value?.accessor ?? null,
  );

  // Stable context value - all deps are signal object refs (never recreated), so this memo
  // fires once per mount and the context reference never changes. Consumers react via signals.
  const contextValue = useMemo(
    () => ({
      dataSignal: data,
      innerWidth: innerWidthSig,
      innerHeight: innerHeightSig,
      tokens,
      scales: scalesSig,
      baseScale: baseScaleSig,
      baseAxisAccessor: baseAxisAccessorSig,
      activePoint,
      mousePosition,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const point = localPoint(svgRef.current, event);
    if (!point) return;
    mousePosition.value = { x: point.x, y: point.y };

    const baseAxisCfg = baseAxisConfigSig.value;
    const bScale = baseScaleSig.value;
    const margin = marginSig.value;

    if (bScale && "invert" in bScale && baseAxisCfg) {
      const invertFn = (bScale as { invert: (v: number) => unknown }).invert;
      const x0 = invertFn.call(bScale, point.x - margin.left);
      const rawData = (Object.values(data.value)[0] ?? []) as Record<
        string,
        unknown
      >[];
      const domainValues = rawData.map((d) => baseAxisCfg.accessor(d));

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
        const xPx = (bScale as (v: unknown) => number)(
          baseAxisCfg.accessor(datum),
        );
        activePoint.value = {
          series: "",
          axis: baseAxisCfg.id,
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

  // Read signal values for render. The Babel signals transform tracks these reads and
  // re-renders VisualizationInner when any of the underlying signals change.
  const axes_ = resolvedAxes.value;
  const margin = marginSig.value;
  const scales = scalesSig.value;
  const innerWidth = innerWidthSig.value;
  const innerHeight = innerHeightSig.value;
  const baseAxisCfg = baseAxisConfigSig.value;

  return (
    <VisualizationContext.Provider value={contextValue}>
      <figure aria-label={ariaLabel}>
        <svg
          ref={svgRef}
          width={innerWidth + margin.left + margin.right}
          height={innerHeight + margin.top + margin.bottom}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          {axes_.map((axis) => {
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
          {baseAxisCfg && !baseAxisCfg.hidden && (
            <Group left={margin.left} top={margin.top}>
              <GridColumns
                scale={scales[baseAxisCfg.id]}
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
  // Convert the axes prop to a stable signal so VisualizationInner can track it via useDeepComputed.
  const axesSig = useLiveSignal(props.axes as AxesValue);

  return (
    <ChartSVG height={props.height} className={props.className}>
      {(fullWidthSig, fullHeightSig) => (
        <VisualizationInner
          data={props.data as unknown as ReadonlySignal<Record<string, unknown[]>>}
          axes={axesSig}
          ariaLabel={props.ariaLabel}
          fullWidth={fullWidthSig}
          fullHeight={fullHeightSig}
        >
          {props.children(
            VIS_MARKS as unknown as VisMark<TData, TAxes[number]["id"]>,
          )}
        </VisualizationInner>
      )}
    </ChartSVG>
  );
}
