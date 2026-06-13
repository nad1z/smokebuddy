import { useState } from 'react'
import { useApp } from '../store/AppContext'
import { useRouter } from '../hooks/useRouter'
import { useTimeline } from '../hooks/useTimeline'
import { PageHeader } from '../components/ui/PageHeader'
import { TimelineRow } from '../components/timeline/TimelineRow'
import { GanttChart } from '../components/timeline/GanttChart'
import { Badge } from '../components/ui/Badge'
import { MEAT_LABELS } from '../domain/types'
import { formatDateTime } from '../utils/time'

interface Props {
  eventId: string
}

export function Timeline({ eventId }: Props) {
  const { state } = useApp()
  const { navigate, back } = useRouter()
  const event = state.events.find(e => e.id === eventId)
  const timeline = useTimeline(event ?? null, state.preferences.spritzeEnabled)
  const [view, setView] = useState<'gantt' | 'steps'>('gantt')

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-900 text-zinc-400">
        Event not found.
      </div>
    )
  }

  if (!timeline) {
    return (
      <div className="flex flex-col min-h-screen bg-zinc-900">
        <PageHeader
          title="Timeline"
          left={<button onClick={back} className="text-zinc-400 p-2 min-h-[44px] min-w-[44px]">←</button>}
        />
        <div className="flex items-center justify-center flex-1 text-zinc-400 text-sm">
          Add at least one meat to generate a timeline.
        </div>
      </div>
    )
  }

  // Build a label map for meat IDs
  const meatLabels: Record<string, string> = {}
  event.meats.forEach(m => { meatLabels[m.id] = m.label || MEAT_LABELS[m.meatType] })

  const now = new Date()

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900">
      <PageHeader
        title="Timeline"
        subtitle={`Serve ${formatDateTime(new Date(event.servingTime))}`}
        left={
          <button
            onClick={back}
            className="text-zinc-400 hover:text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            ←
          </button>
        }
        right={
          <button
            onClick={() => navigate({ page: 'dashboard', eventId })}
            className="text-orange-400 font-medium text-sm py-2 px-2 min-h-[44px] flex items-center"
          >
            Live →
          </button>
        }
      />

      {/* Fire start callout */}
      <div className="mx-4 mt-4 bg-orange-500/10 border border-orange-500/30 rounded-2xl px-4 py-4 shadow-md">
        <p className="text-xs text-orange-400/80 font-semibold uppercase tracking-wide mb-0.5">Fire Start</p>
        <p className="text-white font-bold text-xl">{formatDateTime(timeline.sessionStartAt)}</p>
      </div>

      {/* View toggle */}
      <div className="flex mx-4 mt-3 bg-zinc-800/60 rounded-xl p-1 gap-1">
        <button
          onClick={() => setView('gantt')}
          className={[
            'flex-1 py-1.5 text-sm font-medium rounded-lg transition-all',
            view === 'gantt'
              ? 'bg-zinc-700 text-white shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300',
          ].join(' ')}
        >
          Gantt
        </button>
        <button
          onClick={() => setView('steps')}
          className={[
            'flex-1 py-1.5 text-sm font-medium rounded-lg transition-all',
            view === 'steps'
              ? 'bg-zinc-700 text-white shadow-sm'
              : 'text-zinc-500 hover:text-zinc-300',
          ].join(' ')}
        >
          Steps
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-safe-bottom">
        {view === 'gantt' ? (
          <GanttChart timeline={timeline} event={event} now={now} />
        ) : (
          <>
            {/* Meat legend */}
            {event.meats.length > 1 && (
              <div className="flex flex-wrap gap-2 mb-5">
                {event.meats.map(m => (
                  <Badge key={m.id} color="orange">{meatLabels[m.id]}</Badge>
                ))}
              </div>
            )}

            {/* Steps list */}
            <div className="relative">
              <div className="absolute left-[27px] top-4 bottom-4 w-px bg-zinc-700/60" aria-hidden="true" />
              <div className="space-y-0">
                {timeline.allStepsSorted.map(step => {
                  const isCompleted = step.scheduledAt < now
                  return (
                    <TimelineRow
                      key={step.id}
                      step={step}
                      meatLabel={step.meatEntryId ? meatLabels[step.meatEntryId] : undefined}
                      isCompleted={isCompleted}
                      isCurrent={false}
                    />
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
