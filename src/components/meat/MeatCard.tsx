import type { MeatEntry, MeasurementSystem } from '../../domain/types'
import { MEAT_LABELS } from '../../domain/types'
import { displayTemp, displayWeight } from '../../utils/units'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'

interface Props {
  meat: MeatEntry
  onEdit: () => void
  onDelete: () => void
  measurementSystem: MeasurementSystem
}

export function MeatCard({ meat, onEdit, onDelete, measurementSystem }: Props) {
  return (
    <Card className="space-y-3">
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

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <span className="text-zinc-400">{displayWeight(meat.weightLbs, measurementSystem)}</span>
        <span className="text-zinc-400">
          Target: <span className="text-orange-400 font-medium">{displayTemp(meat.targetTempF, measurementSystem)}</span>
        </span>
        <span className="text-zinc-400">Rest: {meat.restMinutes}m</span>
        <span className="text-zinc-500 capitalize">{meat.cookMethod === 'lowAndSlow' ? 'Low & Slow' : 'Hot & Fast'}</span>
      </div>
    </Card>
  )
}
