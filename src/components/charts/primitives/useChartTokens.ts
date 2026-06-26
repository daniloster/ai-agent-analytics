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
    primary: '#2563eb',
    primaryFaded: 'rgba(37, 99, 235, 0.15)',
    secondary: '#0d9488',
    muted: get('--muted-foreground'),
    border: get('--border'),
    background: get('--background'),
    destructive: get('--destructive'),
    success: '#22c55e',
    warning: '#d97706',
  }
}
