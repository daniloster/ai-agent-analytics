import { Badge } from '../../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import type { KpiEntry } from '../data/kpis'

export function KpiEntryCard({ kpi }: { kpi: KpiEntry }): JSX.Element {
  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline">{kpi.id}</Badge>
          <CardTitle className="text-sm">{kpi.label}</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{kpi.whatItMeasures}</p>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0 space-y-1.5">
        <div>
          <span className="font-medium text-xs">Formula:</span>
          <code className="block bg-muted px-3 py-1.5 rounded text-xs font-mono mt-1">
            {kpi.formula}
          </code>
        </div>
        <div>
          <span className="font-medium text-xs">Example:</span>
          <p className="text-xs text-muted-foreground italic mt-1">{kpi.example}</p>
        </div>
        <div>
          <span className="font-medium text-xs">Why it matters:</span>
          <p className="text-xs mt-1">{kpi.whyItMatters}</p>
        </div>
        <div>
          <span className="font-medium text-xs">Visualization:</span>
          <p className="text-xs text-muted-foreground mt-1">{kpi.visualization}</p>
        </div>
      </CardContent>
    </Card>
  )
}
