export function SkipLink(): JSX.Element {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 inline-flex items-center justify-center rounded-md border border-border bg-transparent text-sm font-medium h-9 px-3 hover:bg-muted"
    >
      Skip to content
    </a>
  )
}
