import type { ReadonlySignal } from "@preact/signals-react";
import { ParentSizeComputed } from "./ParentSizeComputed";

interface ChartSVGProps {
  height?: number;
  className?: string;
  children: (
    innerWidth: ReadonlySignal<number>,
    innerHeight: ReadonlySignal<number>,
  ) => React.ReactNode;
}

export function ChartSVG({
  height,
  className,
  children,
}: ChartSVGProps): JSX.Element {
  const outerClass = [`min-h-[${height ?? 200}px]`, className]
    .filter(Boolean)
    .join(" ");
  return (
    <ParentSizeComputed
      className={outerClass}
      initialSize={height !== undefined ? { height } : undefined}
      style={height !== undefined ? { height } : undefined}
      heightOverride={height}
    >
      {(widthSig, heightSig) =>
        widthSig.value > 0 ? children(widthSig, heightSig) : null
      }
    </ParentSizeComputed>
  );
}
