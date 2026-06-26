import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table'
import { formatCurrency, formatPercent } from '../../lib/kpi/formatters'

export interface ChargebackRow {
  team_id: string
  team_name: string
  seat_cost_prorated: number
  token_cost: number
  total: number
  percentage: number
}

export interface ChargebackTableProps {
  rows: ChargebackRow[]
}

export function ChargebackTable({ rows }: ChargebackTableProps): JSX.Element {
  const sorted = [...rows].sort((a, b) => b.total - a.total)
  const sumSeat = rows.reduce((s, r) => s + r.seat_cost_prorated, 0)
  const sumToken = rows.reduce((s, r) => s + r.token_cost, 0)
  const sumTotal = rows.reduce((s, r) => s + r.total, 0)

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Team</TableHead>
          <TableHead>Seat Cost</TableHead>
          <TableHead>Token Cost</TableHead>
          <TableHead>Total</TableHead>
          <TableHead>% of Org</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((r) => (
          <TableRow key={r.team_id}>
            <TableCell>{r.team_name}</TableCell>
            <TableCell>{formatCurrency(r.seat_cost_prorated)}</TableCell>
            <TableCell>{formatCurrency(r.token_cost)}</TableCell>
            <TableCell>{formatCurrency(r.total)}</TableCell>
            <TableCell>{formatPercent(r.percentage, 1)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <tfoot>
        <TableRow>
          <TableCell className="font-bold">Organization Total</TableCell>
          <TableCell className="font-bold">{formatCurrency(sumSeat)}</TableCell>
          <TableCell className="font-bold">{formatCurrency(sumToken)}</TableCell>
          <TableCell className="font-bold">{formatCurrency(sumTotal)}</TableCell>
          <TableCell className="font-bold">100.0%</TableCell>
        </TableRow>
      </tfoot>
    </Table>
  )
}
