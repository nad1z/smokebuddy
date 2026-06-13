import { useApp } from '../store/AppContext'
import { useRouter } from '../hooks/useRouter'
import { useTimeline } from '../hooks/useTimeline'
import { PageHeader } from '../components/ui/PageHeader'
import { TimelineRow } from '../components/timeline/TimelineRow'
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
      <div className="mx-4 mt-4 bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-3">
        <p className="text-xs text-orange-400 font-medium">Fire Start</p>
        <p className="text-white font-bold text-lg">{formatDateTime(timeline.sessionStartAt)}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-safe-bottom">
        {/* Meat legend */}
        {event.meats.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {event.meats.map(m => (
              <Badge key={m.id} color="orange">{meatLabels[m.id]}</Badge>
            ))}
          </div>
        )}

        {/* Steps */}
        <div className="space-y-1">
          {timeline.allStepsSorted.map(step => {
            const isCompleted = step.scheduledAt < now
            const isCurrent = false
            return (
              <TimelineRow
                key={step.id}
                step={step}
                meatLabel={step.meatEntryId ? meatLabels[step.meatEntryId] : undefined}
                isCompleted={isCompleted}
                isCurrent={isCurrent}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
