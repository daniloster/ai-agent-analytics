import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useMemo } from "react";
import { FilterBar } from "../filters/FilterBar";
import { SectionNav } from "./SectionNav";
import { SkipLink } from "./SkipLink";

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
      <SkipLink />
      <div className="sticky top-0 z-50">
        <header className="bg-card border-b border-border min-h-14 h-auto flex flex-wrap items-center justify-between gap-x-4 px-4 py-2 sm:px-8 sm:h-14 sm:flex-nowrap sm:py-0">
          <span className="text-sm font-semibold text-foreground">
            AI Agent Analytics
          </span>
          <FilterBar />
        </header>
        <SectionNav />
      </div>
      <main id="main-content" tabIndex={-1} className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-7 max-w-[1440px] mx-auto flex flex-col gap-4 sm:gap-6 lg:gap-8">
        {children}
      </main>
    </QueryClientProvider>
  );
}
