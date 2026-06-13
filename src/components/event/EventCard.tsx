import type { BBQEvent } from '../../domain/types'
import { MEAT_LABELS, SMOKER_LABELS } from '../../domain/types'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { formatDateTime } from '../../utils/time'

interface Props {
  event: BBQEvent
  onClick: () => void
}

const statusColor: Record<BBQEvent['status'], 'zinc' | 'orange' | 'green'> = {
  planned: 'zinc',
  active: 'orange',
  completed: 'green',
}

const statusLabel: Record<BBQEvent['status'], string> = {
  planned: 'Planned',
  active: 'Live',
  completed: 'Done',
}

export function EventCard({ event, onClick }: Props) {
  const serving = new Date(event.servingTime)
  const meatSummary = event.meats
    .slice(0, 3)
    .map(m => MEAT_LABELS[m.meatType])
    .join(', ')
  const meatOverflow = event.meats.length > 3 ? ` +${event.meats.length - 3}` : ''

  return (
    <Card onClick={onClick} className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-white font-bold text-lg leading-tight truncate">{event.name}</h2>
          <p className="text-zinc-400 text-sm mt-0.5">Serve {formatDateTime(serving)}</p>
        </div>
        <Badge color={statusColor[event.status]}>{statusLabel[event.status]}</Badge>
      </div>

      {event.meats.length > 0 && (
        <p className="text-zinc-300 text-sm truncate">
          {meatSummary}
          {meatOverflow && <span className="text-zinc-500">{meatOverflow}</span>}
        </p>
      )}

      <div className="flex items-center gap-2 text-zinc-500 text-xs">
        <span>{SMOKER_LABELS[event.smokerType]}</span>
        <span>·</span>
        <span>{event.targetPitTempF}°F pit</span>
        {event.guestCount > 0 && (
          <>
            <span>·</span>
            <span>{event.guestCount} guests</span>
          </>
        )}
      </div>
    </Card>
  )
}
