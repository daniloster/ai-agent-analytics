import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableCaption } from '../ui/table'
import { Badge } from '../ui/badge'

export interface IncidentRow {
  detected_at: string
  resolved_at: string | null
  mttr_minutes: number | null
  error_type: string
}

export interface IncidentTableProps {
  incidents: IncidentRow[]
}

export function IncidentTable({ incidents }: IncidentTableProps): JSX.Element {
  const sorted = [...incidents].sort((a, b) => b.detected_at.localeCompare(a.detected_at))
  const n = incidents.length

  return (
    <div className="overflow-x-auto">
    <Table>
      <TableCaption>{n === 1 ? '1 incident' : `${n} incidents`}</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Detected At</TableHead>
          <TableHead>Resolved At</TableHead>
          <TableHead>MTTR</TableHead>
          <TableHead>Error Type</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((row, i) => (
          <TableRow key={i}>
            <TableCell>{new Date(row.detected_at).toLocaleString()}</TableCell>
            <TableCell>
              {row.resolved_at
                ? new Date(row.resolved_at).toLocaleString()
                : <span className="text-amber-600">Unresolved</span>}
            </TableCell>
            <TableCell>{row.mttr_minutes !== null ? `${row.mttr_minutes} min` : '-'}</TableCell>
            <TableCell><Badge variant="secondary">{row.error_type}</Badge></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
    </div>
  )
}
