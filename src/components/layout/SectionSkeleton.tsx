export function SectionSkeleton(): JSX.Element {
  return (
    <div className="space-y-4">
      <div className="motion-safe:animate-pulse bg-muted rounded-md" style={{ height: 80 }} />
      <div className="motion-safe:animate-pulse bg-muted rounded-md" style={{ height: 200 }} />
      <div className="motion-safe:animate-pulse bg-muted rounded-md" style={{ height: 80 }} />
      <div className="motion-safe:animate-pulse bg-muted rounded-md" style={{ height: 200 }} />
    </div>
  )
}
