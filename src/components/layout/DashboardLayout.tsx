import { useMemo } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { FilterBar } from '../filters/FilterBar'
import { SectionNav } from './SectionNav'

export function DashboardLayout({ children }: { children: React.ReactNode }): JSX.Element {
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: { queries: { refetchInterval: 30_000, staleTime: 25_000 } },
      }),
    [],
  )

  return (
    <QueryClientProvider client={queryClient}>
      <div className="sticky top-0 z-50 bg-background border-b">
        <FilterBar />
        <SectionNav />
      </div>
      <main>{children}</main>
    </QueryClientProvider>
  )
}
