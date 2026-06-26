export interface ChartTokens {
  primary: string
  primaryFaded: string
  secondary: string
  muted: string
  border: string
  background: string
  destructive: string
  success: string
  warning: string
}

export function useChartTokens(): ChartTokens {
  const get = (name: string) => `hsl(var(${name}))`

  return {
    primary: get('--primary'),
    primaryFaded: 'hsl(var(--primary) / 0.2)',
    secondary: get('--secondary'),
    muted: get('--muted-foreground'),
    border: get('--border'),
    background: get('--background'),
    destructive: get('--destructive'),
    success: '#22c55e',
    warning: '#f59e0b',
  }
}
