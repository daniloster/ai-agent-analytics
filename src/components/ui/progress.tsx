import { cn } from "../../lib/utils";

export interface ProgressProps {
  value: number;
  className?: string;
  fill?: string;
}

export function Progress({ value, className, fill }: ProgressProps): JSX.Element {
  return (
    <div
      className={cn("relative h-2 w-full overflow-hidden rounded-full", className)}
      style={{ backgroundColor: "#f4f4f5" }}
    >
      <div
        className="h-full transition-all"
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          backgroundColor: fill ?? "hsl(var(--primary))",
        }}
      />
    </div>
  );
}
