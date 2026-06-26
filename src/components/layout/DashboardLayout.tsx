import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo } from "react";
import { FilterBar } from "../filters/FilterBar";
import { SectionNav } from "./SectionNav";

export function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { refetchInterval: 30_000, staleTime: 25_000 },
        },
      }),
    [],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <div className="sticky top-0 z-50">
        <header className="bg-card border-b border-border h-14 px-8 flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">AI Agent Analytics</span>
          <FilterBar />
        </header>
        <SectionNav />
      </div>
      <main className="px-8 py-7 max-w-[1440px] mx-auto">{children}</main>
    </QueryClientProvider>
  );
}
