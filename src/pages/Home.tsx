import { useRef } from 'react'
import { useApp } from '../store/AppContext'
import { useRouter } from '../hooks/useRouter'
import { EventCard } from '../components/event/EventCard'
import { Button } from '../components/ui/Button'
import { ExportService } from '../services/ExportService'

export function Home() {
  const { state, importEvent } = useApp()
  const { navigate } = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const event = await ExportService.importEvent(file)
      await importEvent(event)
      navigate({ page: 'eventDetail', eventId: event.id })
    } catch (err) {
      alert(String(err))
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const sorted = [...state.events].sort(
    (a, b) => new Date(b.servingTime).getTime() - new Date(a.servingTime).getTime(),
  )

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900">
      {/* Header */}
      <header className="px-4 pt-safe-top pb-4 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800/80 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              🔥 SmokeBuddy
            </h1>
            <p className="text-zinc-500 text-xs tracking-wide">Mission control for BBQ</p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-zinc-500 hover:text-zinc-300 p-3 min-h-[48px] min-w-[48px] flex items-center justify-center transition-colors"
              aria-label="Import event"
              title="Import event JSON"
            >
              📥
            </button>
            <button
              onClick={() => navigate({ page: 'settings' })}
              className="text-zinc-500 hover:text-zinc-300 p-3 min-h-[48px] min-w-[48px] flex items-center justify-center transition-colors"
              aria-label="Settings"
            >
              ⚙️
            </button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImport}
        />
      </header>

      {/* Content */}
      <main className="flex-1 px-4 py-4 space-y-3 pb-safe-bottom">
        {state.loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-zinc-500 text-center">
              <p className="text-4xl mb-3">🔥</p>
              <p className="text-sm">Loading your cooks…</p>
            </div>
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <p className="text-6xl">🥩</p>
              <p className="text-white font-bold text-xl">No cooks yet</p>
              <p className="text-zinc-500 text-sm">Plan your first BBQ session below.</p>
            </div>
          </div>
        ) : (
          <>
            <p className="text-zinc-500 text-xs uppercase tracking-widest px-1">
              {sorted.length === 1 ? '1 Cook' : `${sorted.length} Cooks`}
            </p>
            {sorted.map(event => (
              <EventCard
                key={event.id}
                event={event}
                onClick={() => navigate({ page: 'eventDetail', eventId: event.id })}
              />
            ))}
          </>
        )}
      </main>

      {/* FAB */}
      <div className="sticky bottom-0 px-4 pb-safe-bottom pt-3 bg-gradient-to-t from-zinc-900 via-zinc-900/95 to-transparent">
        <Button
          fullWidth
          size="lg"
          onClick={() => navigate({ page: 'createEvent' })}
        >
          + Plan New Cook
        </Button>
      </div>
    </div>
  )
}
