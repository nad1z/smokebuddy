import type { TimelineStep } from '../../domain/types'
import { STEP_LABELS } from '../../domain/types'
import { formatTime } from '../../utils/time'

interface Props {
  step: TimelineStep
  meatLabel?: string
  isCompleted: boolean
  isCurrent: boolean
  onComplete?: () => void
}

export function TimelineRow({ step, meatLabel, isCompleted, isCurrent, onComplete }: Props) {
  const isPast = step.scheduledAt < new Date() && !isCurrent

  return (
    <div
      className={[
        'flex items-start gap-3 py-3 px-4 rounded-xl transition-colors',
        isCurrent ? 'bg-orange-500/10 border border-orange-500/30' : '',
        isCompleted ? 'opacity-50' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Timeline dot */}
      <div className="flex flex-col items-center pt-1 flex-shrink-0">
        <button
          onClick={onComplete}
          disabled={isCompleted || !onComplete}
          className={[
            'w-6 h-6 rounded-full border-2 flex items-center justify-center',
            'transition-colors min-w-[24px]',
            isCompleted
              ? 'bg-green-500 border-green-500 text-white'
              : isCurrent
              ? 'border-orange-500 bg-orange-500/20'
              : isPast
              ? 'border-zinc-600 bg-zinc-700'
              : 'border-zinc-600 bg-zinc-800',
            onComplete && !isCompleted ? 'cursor-pointer hover:border-orange-400' : 'cursor-default',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-label={isCompleted ? 'Completed' : 'Mark complete'}
        >
          {isCompleted && <span className="text-xs">✓</span>}
          {isCurrent && !isCompleted && <span className="w-2 h-2 rounded-full bg-orange-500 block" />}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className={[
              'text-sm font-medium',
              isCurrent ? 'text-orange-300' : isCompleted ? 'text-zinc-500' : 'text-white',
            ].join(' ')}
          >
            {STEP_LABELS[step.label]}
          </span>
          <span className="text-xs text-zinc-500 flex-shrink-0">{formatTime(step.scheduledAt)}</span>
        </div>
        {meatLabel && (
          <p className="text-xs text-zinc-500 mt-0.5">{meatLabel}</p>
        )}
      </div>
    </div>
  )
}
