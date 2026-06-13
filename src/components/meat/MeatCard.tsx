import type { MeatEntry } from '../../domain/types'
import { MEAT_LABELS } from '../../domain/types'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'

interface Props {
  meat: MeatEntry
  onEdit: () => void
  onDelete: () => void
  tempUnit: 'F' | 'C'
}

export function MeatCard({ meat, onEdit, onDelete, tempUnit }: Props) {
  const targetDisplay =
    tempUnit === 'C'
      ? `${Math.round(((meat.targetTempF - 32) * 5) / 9)}°C`
      : `${meat.targetTempF}°F`

  return (
    <Card className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-white font-semibold truncate">{meat.label}</span>
          <Badge color="orange">{MEAT_LABELS[meat.meatType]}</Badge>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={onEdit}
            className="text-zinc-400 hover:text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Edit meat"
          >
            ✏️
          </button>
          <button
            onClick={onDelete}
            className="text-zinc-400 hover:text-red-400 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Delete meat"
          >
            🗑
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-sm text-zinc-400">
        <span>{meat.weightLbs} lbs</span>
        <span>·</span>
        <span>Target: {targetDisplay}</span>
        <span>·</span>
        <span>Rest: {meat.restMinutes}m</span>
        <span>·</span>
        <span className="capitalize">{meat.cookMethod === 'lowAndSlow' ? 'Low & Slow' : 'Hot & Fast'}</span>
      </div>
    </Card>
  )
}
