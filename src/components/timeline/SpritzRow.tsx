import type { SpritzGroup } from '../../utils/groupSteps'
import { formatTime } from '../../utils/time'

interface Props {
  group: SpritzGroup
  meatLabel?: string
  completedIds: Set<string>
  isCurrent: boolean
  onCompleteAll?: () => void
  onUncompleteAll?: () => void
}

export function SpritzRow({ group, meatLabel, completedIds, isCurrent, onCompleteAll, onUncompleteAll }: Props) {
  const total = group.steps.length
  const done = group.steps.filter(s => completedIds.has(s.id)).length
  const allDone = done === total
  const noneDone = done === 0
  const partial = !allDone && !noneDone

  return (
    <div
      className={[
        'flex items-start gap-3 py-3 px-4 rounded-xl transition-all',
        isCurrent ? 'bg-orange-500/10 border border-orange-500/30 shadow-sm' : '',
        allDone ? 'opacity-40' : '',
      ].filter(Boolean).join(' ')}
    >
      {/* Dot */}
      <div className="flex flex-col items-center pt-0.5 flex-shrink-0 relative z-10">
        <button
          onClick={allDone ? onUncompleteAll : onCompleteAll}
          disabled={allDone ? !onUncompleteAll : !onCompleteAll}
          className={[
            'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all min-w-[24px]',
            allDone
              ? 'bg-green-500 border-green-500 text-white hover:bg-red-500 hover:border-red-500 shadow-sm cursor-pointer'
              : partial
              ? 'border-amber-400 bg-amber-400/20 cursor-pointer hover:border-orange-400'
              : isCurrent
              ? 'border-orange-500 bg-orange-500/20 shadow-sm shadow-orange-500/30 cursor-pointer hover:border-orange-400'
              : onCompleteAll
              ? 'border-zinc-600 bg-zinc-800 cursor-pointer hover:border-orange-400'
              : 'border-zinc-600 bg-zinc-800 cursor-default',
          ].filter(Boolean).join(' ')}
          aria-label={allDone ? 'Undo all spritz' : 'Mark all spritz done'}
          title={allDone ? 'Tap to undo' : `${done}/${total} done`}
        >
          {allDone && <span className="text-xs">✓</span>}
          {partial && <span className="w-2 h-2 rounded-full bg-amber-400 block" />}
          {isCurrent && noneDone && <span className="w-2 h-2 rounded-full bg-orange-500 block" />}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-1">
        <div className="flex items-center justify-between gap-2">
          <span className={[
            'text-sm font-semibold',
            allDone ? 'text-zinc-500' : isCurrent ? 'text-orange-300' : 'text-white',
          ].join(' ')}>
            💦 Spritz
          </span>
          <span className="text-xs text-zinc-500 tabular-nums flex-shrink-0">
            {formatTime(group.startTime)} – {formatTime(group.endTime)}
          </span>
        </div>
        <p className="text-xs text-zinc-500 mt-0.5">
          Hydrate every {group.intervalMinutes} min · {total}×
          {partial ? ` · ${done}/${total} done` : ''}
        </p>
        {meatLabel && (
          <p className="text-xs text-zinc-600 mt-0.5">{meatLabel}</p>
        )}
      </div>
    </div>
  )
}
