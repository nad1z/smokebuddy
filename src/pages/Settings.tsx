import { useApp } from '../store/AppContext'
import { useRouter } from '../hooks/useRouter'
import { useNotifications } from '../hooks/useNotifications'
import { PageHeader } from '../components/ui/PageHeader'
import type { MeasurementSystem } from '../domain/types'

export function Settings() {
  const { state, updatePreferences } = useApp()
  const { back } = useRouter()
  const { isGranted, isSupported, request } = useNotifications()
  const prefs = state.preferences

  function toggle(key: 'notificationsEnabled' | 'spritzeEnabled' | 'wakeLockEnabled' | 'overnightModeEnabled') {
    updatePreferences({ [key]: !prefs[key] })
  }

  const wakeLockSupported = 'wakeLock' in navigator

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900">
      <PageHeader
        title="Settings"
        left={
          <button
            onClick={back}
            className="text-zinc-400 hover:text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            ←
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6 pb-safe-bottom">
        {/* Units */}
        <section>
          <h2 className="text-xs text-zinc-500 uppercase tracking-widest mb-3 px-1">Units</h2>
          <div className="bg-zinc-800/80 rounded-2xl divide-y divide-zinc-700/60 border border-zinc-700/40 shadow-md">
            <div className="flex items-center justify-between p-4 min-h-[56px]">
              <div>
                <p className="text-white">Measurement System</p>
                <p className="text-zinc-500 text-xs">Temperature, weight &amp; more</p>
              </div>
              <div className="flex bg-zinc-700 rounded-lg p-0.5">
                {(['metric', 'imperial'] as MeasurementSystem[]).map(system => (
                  <button
                    key={system}
                    onClick={() => updatePreferences({ measurementSystem: system })}
                    className={[
                      'px-4 py-1.5 rounded-md text-sm font-medium transition-colors min-w-[80px] min-h-[36px]',
                      prefs.measurementSystem === system
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-white',
                    ].join(' ')}
                  >
                    {system === 'metric' ? '°C · kg' : '°F · lbs'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section>
          <h2 className="text-xs text-zinc-500 uppercase tracking-widest mb-3 px-1">Notifications</h2>
          <div className="bg-zinc-800/80 rounded-2xl divide-y divide-zinc-700/60 border border-zinc-700/40 shadow-md">
            <div className="flex items-center justify-between p-4 min-h-[56px]">
              <div>
                <p className="text-white">Enable Notifications</p>
                {!isSupported && (
                  <p className="text-zinc-500 text-xs">Not supported in this browser</p>
                )}
                {isSupported && !isGranted && (
                  <button onClick={() => void request()} className="text-orange-400 text-xs underline">
                    Grant permission
                  </button>
                )}
                {isGranted && (
                  <p className="text-green-400 text-xs">Permission granted ✓</p>
                )}
              </div>
              <button
                onClick={() => toggle('notificationsEnabled')}
                disabled={!isSupported}
                className={[
                  'relative w-12 h-7 rounded-full transition-colors',
                  prefs.notificationsEnabled && isGranted ? 'bg-orange-500' : 'bg-zinc-600',
                  !isSupported ? 'opacity-40 cursor-not-allowed' : '',
                ].join(' ')}
                aria-label="Toggle notifications"
              >
                <span
                  className={[
                    'absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all',
                    prefs.notificationsEnabled && isGranted ? 'left-[calc(100%-26px)]' : 'left-0.5',
                  ].join(' ')}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 min-h-[56px]">
              <div>
                <p className="text-white">Overnight Mode</p>
                <p className="text-zinc-500 text-xs">Silence notifications 11pm–7am</p>
              </div>
              <button
                onClick={() => toggle('overnightModeEnabled')}
                className={[
                  'relative w-12 h-7 rounded-full transition-colors',
                  prefs.overnightModeEnabled ? 'bg-orange-500' : 'bg-zinc-600',
                ].join(' ')}
                aria-label="Toggle overnight mode"
              >
                <span
                  className={[
                    'absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all',
                    prefs.overnightModeEnabled ? 'left-[calc(100%-26px)]' : 'left-0.5',
                  ].join(' ')}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-4 min-h-[56px]">
              <div>
                <p className="text-white">Spritz Reminders</p>
                <p className="text-zinc-500 text-xs">Notify every 60–90 min to spritz</p>
              </div>
              <button
                onClick={() => toggle('spritzeEnabled')}
                className={[
                  'relative w-12 h-7 rounded-full transition-colors',
                  prefs.spritzeEnabled ? 'bg-orange-500' : 'bg-zinc-600',
                ].join(' ')}
                aria-label="Toggle spritz reminders"
              >
                <span
                  className={[
                    'absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all',
                    prefs.spritzeEnabled ? 'left-[calc(100%-26px)]' : 'left-0.5',
                  ].join(' ')}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Session */}
        <section>
          <h2 className="text-xs text-zinc-500 uppercase tracking-widest mb-3 px-1">Session</h2>
          <div className="bg-zinc-800/80 rounded-2xl divide-y divide-zinc-700/60 border border-zinc-700/40 shadow-md">
            <div className="flex items-center justify-between p-4 min-h-[56px]">
              <div>
                <p className="text-white">Keep Screen On</p>
                {!wakeLockSupported ? (
                  <p className="text-zinc-500 text-xs">Not supported in this browser</p>
                ) : (
                  <p className="text-zinc-500 text-xs">Prevents sleep during active sessions</p>
                )}
              </div>
              <button
                onClick={() => toggle('wakeLockEnabled')}
                disabled={!wakeLockSupported}
                className={[
                  'relative w-12 h-7 rounded-full transition-colors',
                  prefs.wakeLockEnabled && wakeLockSupported ? 'bg-orange-500' : 'bg-zinc-600',
                  !wakeLockSupported ? 'opacity-40 cursor-not-allowed' : '',
                ].join(' ')}
                aria-label="Toggle wake lock"
              >
                <span
                  className={[
                    'absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-all',
                    prefs.wakeLockEnabled && wakeLockSupported ? 'left-[calc(100%-26px)]' : 'left-0.5',
                  ].join(' ')}
                />
              </button>
            </div>
          </div>
        </section>

        {/* iOS instructions */}
        <section className="bg-zinc-800/60 border border-zinc-700/40 rounded-2xl p-4 text-sm text-zinc-400 space-y-2 shadow-md">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">📱</span>
            <p className="font-semibold text-zinc-200 text-base">iPhone Notifications</p>
          </div>
          <p className="text-zinc-400 text-sm">For notifications to work when your phone screen is off:</p>
          <ol className="list-decimal list-inside space-y-1.5 text-xs text-zinc-400 pl-1">
            <li>Tap the Share button in Safari</li>
            <li>Tap "Add to Home Screen"</li>
            <li>Open SmokeBuddy from your Home Screen</li>
            <li>Grant notification permission when prompted</li>
          </ol>
          <p className="text-xs text-zinc-600 pt-1">Requires iOS 16.4 or later.</p>
        </section>

        <p className="text-center text-zinc-600 text-xs pb-4">SmokeBuddy v0.1.0</p>
      </div>
    </div>
  )
}
