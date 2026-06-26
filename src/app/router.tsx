import { signal, useSignal } from "@preact/signals-react";
import { useEffect } from "react";
import { createBrowserRouter } from "react-router-dom";
import { Visualization, defineAxes } from "../components/charts/Visualization";
import type { TimeseriesPoint } from "../types/api";

const count = signal(0);

const runsAxes = defineAxes([
  {
    id: "x",
    type: "time",
    position: "bottom",
    accessor: (d) => new Date(d.date as string),
    tickFormat: (v) =>
      new Date(v as Date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    numTicks: 6,
  },
  {
    id: "y",
    type: "linear",
    position: "left",
    accessor: (d) => d.runs as number,
    label: "Runs",
  },
] as const);

const costAxes = defineAxes([
  {
    id: "x",
    type: "time",
    position: "bottom",
    accessor: (d) => new Date(d.date as string),
    tickFormat: (v) =>
      new Date(v as Date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    numTicks: 6,
  },
  {
    id: "cost",
    type: "linear",
    position: "right",
    accessor: (d) => d.cost as number,
    label: "Cost ($)",
    numTicks: 4,
  },
] as const);

function RunsChart() {
  const data = useSignal<{ runs: TimeseriesPoint[] }>({ runs: [] });
  const loading = useSignal(true);
  const error = useSignal<string | null>(null);

  useEffect(() => {
    const to = new Date().toISOString().slice(0, 10);
    const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    fetch(`/api/analytics/timeseries?from=${from}&to=${to}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<{ points: TimeseriesPoint[] }>;
      })
      .then((resp) => {
        data.value = { runs: resp.points };
        loading.value = false;
      })
      .catch((e: Error) => {
        error.value = e.message;
        loading.value = false;
      });
  }, []);

  if (loading.value) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
        Loading...
      </div>
    );
  }

  if (error.value) {
    return (
      <div className="h-[300px] flex items-center justify-center text-destructive text-sm">
        Error: {error.value}
      </div>
    );
  }

  return (
    <Visualization
      data={data}
      axes={runsAxes}
      height={300}
      ariaLabel="Agent runs over the last 30 days"
    >
      {(Vis) => (
        <>
          <Vis.Area series="runs" axis="y" />
          <Vis.Annotation
            axis="y"
            value={500}
            label="Target"
            variant="warning"
          />
        </>
      )}
    </Visualization>
  );
}

function CostChart() {
  const data = useSignal<{ cost: TimeseriesPoint[] }>({ cost: [] });
  const loading = useSignal(true);

  useEffect(() => {
    const to = new Date().toISOString().slice(0, 10);
    const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    fetch(`/api/analytics/timeseries?from=${from}&to=${to}`)
      .then((r) => r.json() as Promise<{ points: TimeseriesPoint[] }>)
      .then((resp) => {
        data.value = { cost: resp.points };
        loading.value = false;
      })
      .catch(() => {
        loading.value = false;
      });
  }, []);

  if (loading.value) {
    return (
      <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
        Loading...
      </div>
    );
  }

  return (
    <Visualization
      data={data}
      axes={costAxes}
      height={260}
      ariaLabel="Daily cost over the last 30 days"
    >
      {(Vis) => (
        <>
          <Vis.Line
            series="cost"
            axis="cost"
            color="#ea580c"
            strokeWidth={1.5}
          />
          <Vis.Annotation
            axis="cost"
            value={800}
            label="Budget/day"
            variant="destructive"
          />
        </>
      )}
    </Visualization>
  );
}

function ScaffoldPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">AI Agent Analytics</h1>
            <p className="text-muted-foreground text-sm mt-1">Last 30 days</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Count: {count.value}
            </span>
            <button
              className="px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded-md hover:opacity-90"
              onClick={() => {
                count.value++;
              }}
            >
              +1
            </button>
            <button
              className="px-3 py-1.5 border border-border text-sm rounded-md hover:bg-muted"
              onClick={() => {
                document.documentElement.classList.toggle("dark");
              }}
            >
              Toggle dark
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-base font-semibold mb-1">Agent Runs</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Daily run count with target threshold
            </p>
            <RunsChart />
          </div>

          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-base font-semibold mb-1">Daily Cost</h2>
            <p className="text-sm text-muted-foreground mb-4">
              USD cost per day with budget reference line
            </p>
            <CostChart />
          </div>
        </div>
      </div>
    </div>
  );
}

// WP-04 replaces this placeholder with the real dashboard route.
export const router = createBrowserRouter([
  {
    path: "*",
    element: <ScaffoldPage />,
  },
]);
