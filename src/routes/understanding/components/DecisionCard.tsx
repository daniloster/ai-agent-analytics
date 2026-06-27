import { useSignal } from '@preact/signals-react'
import { Badge } from '../../../components/ui/badge'
import { Card, CardContent, CardHeader } from '../../../components/ui/card'
import type { DecisionEntry } from '../data/decisions'

function ChevronDown(): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

export function DecisionCard({ decision }: { decision: DecisionEntry }): JSX.Element {
  const open = useSignal<boolean>(false)

  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">{decision.id}</Badge>
            <span className="text-sm font-medium">{decision.decision}</span>
            <Badge>Resolved</Badge>
          </div>
          <button
            aria-expanded={open.value}
            aria-label={`Toggle rationale for ${decision.decision}`}
            className="flex-shrink-0 p-1 rounded hover:bg-muted text-muted-foreground"
            onClick={() => { open.value = !open.value }}
          >
            <span
              style={{
                display: 'inline-block',
                transform: open.value ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
              }}
            >
              <ChevronDown />
            </span>
          </button>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0 space-y-1.5">
        <div className="flex gap-4 flex-wrap">
          <div>
            <span className="font-medium text-xs">Chosen:</span>
            <p className="text-xs mt-0.5">{decision.chosen}</p>
          </div>
          <div>
            <span className="font-medium text-xs">Options:</span>
            <p className="text-xs text-muted-foreground mt-0.5">{decision.options.join(' / ')}</p>
          </div>
        </div>
        {open.value && (
          <div className="mt-2 space-y-1.5 border-t pt-2">
            <p className="text-sm text-muted-foreground">{decision.rationale}</p>
            <p className="text-xs font-medium">
              Reversible: {decision.reversible ? 'Yes' : 'No'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
