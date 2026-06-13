import { useState, useEffect } from 'react'
import { useApp } from '../store/AppContext'
import { useRouter } from '../hooks/useRouter'
import { useTimeline } from '../hooks/useTimeline'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { MeatCard } from '../components/meat/MeatCard'
import { SMOKER_LABELS, FUEL_LABELS } from '../domain/types'
import { formatDateTime, formatDuration } from '../utils/time'
import { displayTemp } from '../utils/units'
import { ExportService } from '../services/ExportService'

interface Props {
  eventId: string
}

export function EventDetail({ eventId }: Props) {
  const { state, updateEvent, deleteEvent } = useApp()
  const { navigate, back } = useRouter()
  const event = state.events.find(e => e.id === eventId)
  const timeline = useTimeline(event ?? null, state.preferences.spritzeEnabled)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const isPastEvent = new Date(event?.servingTime ?? 0) < new Date()
  const hasActiveSession = state.activeSession?.eventId === eventId

  // Auto-reset delete confirm after 4 seconds
  useEffect(() => {
    if (!confirmDelete) return
    const t = setTimeout(() => setConfirmDelete(false), 4000)
    return () => clearTimeout(t)
  }, [confirmDelete])

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-900 text-zinc-400">
        Event not found.
      </div>
    )
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    await deleteEvent(eventId)
    navigate({ page: 'home' })
  }

  async function handleDeleteMeat(meatId: string) {
    const updated = { ...event!, meats: event!.meats.filter(m => m.id !== meatId) }
    await updateEvent(updated)
  }

  const sessionDuration = timeline
    ? Math.round(
        (new Date(event.servingTime).getTime() - timeline.sessionStartAt.getTime()) / 60_000,
      )
    : 0

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900">
      <PageHeader
        title={event.name}
        subtitle={formatDateTime(new Date(event.servingTime))}
        left={
          <button
            onClick={back}
            className="text-zinc-400 hover:text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            ←
          </button>
        }
        right={
          <div className="flex items-center">
            <button
              onClick={() => navigate({ page: 'editEvent', eventId })}
              className="text-zinc-400 hover:text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-sm"
              title="Edit event"
            >
              ✏️
            </button>
            <button
              onClick={() => ExportService.exportEvent(event)}
              className="text-zinc-400 hover:text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Export as JSON"
            >
              📤
            </button>
            <button
              onClick={() => navigate({ page: 'settings' })}
              className="text-zinc-400 hover:text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Settings"
            >
              ⚙️
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-safe-bottom">
        {isPastEvent && !hasActiveSession && (
          <div className="bg-zinc-800/60 border border-zinc-700/50 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
            <span className="text-zinc-500">⏱</span>
            <p className="text-zinc-400">This event's serving time has passed.</p>
          </div>
        )}
        {/* Summary */}
        <Card>
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-wide mb-0.5">Smoker</p>
              <p className="text-white font-semibold">{SMOKER_LABELS[event.smokerType]}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-wide mb-0.5">Fuel</p>
              <p className="text-white font-semibold">{FUEL_LABELS[event.fuelType]}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-wide mb-0.5">Pit Temp</p>
              <p className="text-orange-400 font-bold text-base">{displayTemp(event.targetPitTempF, state.preferences.measurementSystem)}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs uppercase tracking-wide mb-0.5">Guests</p>
              <p className="text-white font-semibold">{event.guestCount}</p>
            </div>
            {timeline && (
              <>
                <div>
                  <p className="text-zinc-500 text-xs uppercase tracking-wide mb-0.5">Fire start</p>
                  <p className="text-orange-300 font-semibold">
                    {formatDateTime(timeline.sessionStartAt)}
                  </p>
                </div>
                <div>
                  <p className="text-zinc-500 text-xs uppercase tracking-wide mb-0.5">Total duration</p>
                  <p className="text-white font-semibold">{formatDuration(sessionDuration * 60)}</p>
                </div>
              </>
            )}
          </div>
          {event.notes && (
            <p className="text-zinc-400 text-sm mt-4 pt-4 border-t border-zinc-700/60">{event.notes}</p>
          )}
        </Card>

        {/* Meats */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-bold text-base">
              Meats
              {event.meats.length > 0 && (
                <span className="ml-2 text-zinc-500 text-sm font-normal">({event.meats.length})</span>
              )}
            </h2>
            <button
              onClick={() => navigate({ page: 'addMeat', eventId })}
              className="text-orange-400 hover:text-orange-300 text-sm font-semibold py-2 px-2 min-h-[44px] flex items-center transition-colors"
            >
              + Add Meat
            </button>
          </div>
          {event.meats.length === 0 ? (
            <Card className="text-center py-8">
              <p className="text-4xl mb-3">🥩</p>
              <p className="text-zinc-400 text-sm font-medium">No meats added yet</p>
              <button
                onClick={() => navigate({ page: 'addMeat', eventId })}
                className="text-orange-400 text-sm mt-3 font-semibold underline underline-offset-2"
              >
                Add your first meat
              </button>
            </Card>
          ) : (
            <div className="space-y-2">
              {event.meats.map(meat => (
                <MeatCard
                  key={meat.id}
                  meat={meat}
                  measurementSystem={state.preferences.measurementSystem}
                  onEdit={() => navigate({ page: 'addMeat', eventId, meatId: meat.id })}
                  onDelete={() => handleDeleteMeat(meat.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-1 pb-2">
          {event.meats.length > 0 && (
            <>
              <Button
                fullWidth
                size="lg"
                onClick={() => navigate({ page: 'timeline', eventId })}
                variant="secondary"
              >
                📋 View Timeline
              </Button>
              <Button
                fullWidth
                size="lg"
                onClick={() => navigate({ page: 'dashboard', eventId })}
              >
                🔥 Start Session
              </Button>
            </>
          )}

          <button
            onClick={handleDelete}
            className={[
              'w-full py-3 text-sm rounded-xl transition-all min-h-[44px]',
              confirmDelete
                ? 'bg-red-600 text-white font-semibold shadow-md'
                : 'text-red-500/70 hover:text-red-400 hover:bg-red-500/10',
            ].join(' ')}
          >
            {confirmDelete ? 'Tap again to confirm delete' : 'Delete Event'}
          </button>
        </div>
      </div>
    </div>
  )
}
