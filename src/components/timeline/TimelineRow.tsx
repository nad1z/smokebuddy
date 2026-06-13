import type { TimelineStep } from '../../domain/types'
import { STEP_LABELS } from '../../domain/types'
import { formatTime } from '../../utils/time'

interface Props {
  step: TimelineStep
  meatLabel?: string
  isCompleted: boolean
  isCurrent: boolean
  onComplete?: () => void
  onUncomplete?: () => void
}

export function TimelineRow({ step, meatLabel, isCompleted, isCurrent, onComplete, onUncomplete }: Props) {
  const isPast = step.scheduledAt < new Date() && !isCurrent

  return (
    <div
      className={[
        'flex items-start gap-3 py-3 px-4 rounded-xl transition-all',
        isCurrent ? 'bg-orange-500/10 border border-orange-500/30 shadow-sm' : '',
        isCompleted ? 'opacity-40' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Timeline dot — sits over the connecting line */}
      <div className="flex flex-col items-center pt-0.5 flex-shrink-0 relative z-10">
        <button
          onClick={isCompleted ? onUncomplete : onComplete}
          disabled={isCompleted ? !onUncomplete : !onComplete}
          className={[
            'w-6 h-6 rounded-full border-2 flex items-center justify-center',
            'transition-all min-w-[24px]',
            isCompleted
              ? 'bg-green-500 border-green-500 text-white hover:bg-red-500 hover:border-red-500 shadow-sm'
              : isCurrent
              ? 'border-orange-500 bg-orange-500/20 shadow-sm shadow-orange-500/30'
              : isPast
              ? 'border-zinc-600 bg-zinc-700/80'
              : 'border-zinc-600 bg-zinc-800',
            isCompleted && onUncomplete
              ? 'cursor-pointer'
              : !isCompleted && onComplete
              ? 'cursor-pointer hover:border-orange-400'
              : 'cursor-default',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-label={isCompleted ? 'Undo complete' : 'Mark complete'}
          title={isCompleted ? 'Tap to undo' : undefined}
        >
          {isCompleted && <span className="text-xs">✓</span>}
          {isCurrent && !isCompleted && <span className="w-2 h-2 rounded-full bg-orange-500 block" />}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-1">
        <div className="flex items-center justify-between gap-2">
          <span
            className={[
              'text-sm font-semibold',
              isCurrent ? 'text-orange-300' : isCompleted ? 'text-zinc-500' : 'text-white',
            ].join(' ')}
          >
            {STEP_LABELS[step.label]}
          </span>
          <span className={[
            'text-xs font-medium flex-shrink-0 tabular-nums',
            isCurrent ? 'text-orange-400' : 'text-zinc-500',
          ].join(' ')}>
            {formatTime(step.scheduledAt)}
          </span>
        </div>
        {meatLabel && (
          <p className="text-xs text-zinc-600 mt-0.5">{meatLabel}</p>
        )}
      </div>
    </div>
  )
}
