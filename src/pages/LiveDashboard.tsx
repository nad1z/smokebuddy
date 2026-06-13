import { useEffect, useMemo, useState, useRef } from 'react'
import { useApp } from '../store/AppContext'
import { useRouter } from '../hooks/useRouter'
import { useTimeline } from '../hooks/useTimeline'
import { useCountdown } from '../hooks/useCountdown'
import { useNotifications } from '../hooks/useNotifications'
import { useWakeLock } from '../hooks/useWakeLock'
import { NotificationScheduler } from '../services/NotificationScheduler'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { TimelineRow } from '../components/timeline/TimelineRow'
import { MEAT_LABELS, STEP_LABELS } from '../domain/types'
import { formatTime } from '../utils/time'
import type { TimelineStep } from '../domain/types'

interface Props {
  eventId: string
}

function playAlertChime() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.12)
    gain.gain.setValueAtTime(0.22, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7)
    osc.start()
    osc.stop(ctx.currentTime + 0.7)
    setTimeout(() => { try { void ctx.close() } catch { /* ignore */ } }, 1200)
  } catch {
    // AudioContext not available
  }
}

export function LiveDashboard({ eventId }: Props) {
  const { state, startSession, endSession, completeStep, uncompleteStep, setCompletedSteps, resetSessionSteps, updatePreferences } = useApp()
  const { route, navigate, back } = useRouter()
  const { isGranted, request } = useNotifications()
  const event = state.events.find(e => e.id === eventId)
  const timeline = useTimeline(event ?? null, state.preferences.spritzeEnabled)

  const session = state.activeSession?.eventId === eventId ? state.activeSession : null

  // Missed step alert state
  const [missedSteps, setMissedSteps] = useState<TimelineStep[]>([])
  const [missedDismissed, setMissedDismissed] = useState(false)

  // Wake Lock prompt state: show max 2 times per session
  const [wakeLockPromptCount, setWakeLockPromptCount] = useState(0)
  const [wakeLockPromptDismissed, setWakeLockPromptDismissed] = useState(false)
  const showWakeLockPrompt =
    !!session &&
    !state.preferences.wakeLockEnabled &&
    !wakeLockPromptDismissed &&
    wakeLockPromptCount < 2

  // After first dismissal, re-show after 10 minutes
  useEffect(() => {
    if (!wakeLockPromptDismissed || wakeLockPromptCount >= 1) return
    const t = setTimeout(() => {
      setWakeLockPromptCount(c => c + 1)
      setWakeLockPromptDismissed(false)
    }, 10 * 60 * 1000)
    return () => clearTimeout(t)
  }, [wakeLockPromptDismissed, wakeLockPromptCount])

  useWakeLock(state.preferences.wakeLockEnabled)

  // Start session automatically on mount if no active session
  useEffect(() => {
    if (!event || session) return
    void startSession(eventId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  // On mount: if URL carries completed step IDs, seed the session from them
  useEffect(() => {
    if (route.page === 'dashboard' && route.completedSteps && route.completedSteps.length > 0) {
      setCompletedSteps(route.completedSteps)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep URL in sync with current completed-step state (silent replace, no nav loop)
  useEffect(() => {
    if (!session || !eventId) return
    const steps = session.completedStepIds
    const base = `#dashboard?id=${eventId}`
    const hash = steps.length > 0 ? `${base}&steps=${steps.join(',')}` : base
    window.history.replaceState(null, '', hash)
  }, [session?.completedStepIds, eventId])

  // Request notification permission and schedule steps
  useEffect(() => {
    if (!timeline || !session) return
    if (!isGranted) {
      void request().then(perm => {
        if (perm === 'granted' && timeline) {
          void NotificationScheduler.scheduleAll(timeline.allStepsSorted, eventId)
        }
      })
    } else {
      void NotificationScheduler.scheduleAll(timeline.allStepsSorted, eventId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, timeline])

  const completedIds = new Set(session?.completedStepIds ?? [])

  const { currentStep, nextStep, allDone } = useMemo(() => {
    if (!timeline) return { currentStep: null, nextStep: null, allDone: false }
    const now = new Date()
    const pending = timeline.allStepsSorted.filter(s => !completedIds.has(s.id))
    if (pending.length === 0) return { currentStep: null, nextStep: null, allDone: true }
    // Show the first past-due step as current; nothing if nothing is due yet
    const current = pending.find(s => s.scheduledAt <= now) ?? null
    const nextStart = current ? pending.indexOf(current) + 1 : 0
    const next = pending[nextStart] ?? null
    return { currentStep: current, nextStep: next, allDone: false }
  }, [timeline, completedIds])

  // Always count down to the next upcoming step
  const countdownSeconds = useCountdown(nextStep?.scheduledAt ?? null)

  // Visibility change: detect missed steps and alert
  const completedIdsRef = useRef(completedIds)
  completedIdsRef.current = completedIds
  useEffect(() => {
    if (!timeline) return
    function handleVisibility() {
      if (document.visibilityState !== 'visible') return
      const now = new Date()
      const missed = timeline!.allStepsSorted.filter(
        s => !completedIdsRef.current.has(s.id) && s.scheduledAt <= now,
      )
      if (missed.length > 0) {
        setMissedSteps(missed)
        setMissedDismissed(false)
        playAlertChime()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [timeline])

  const meatLabels: Record<string, string> = {}
  event?.meats.forEach(m => { meatLabels[m.id] = m.label || MEAT_LABELS[m.meatType] })

  async function handleEndSession() {
    await NotificationScheduler.cancelAll(eventId)
    await endSession()
    navigate({ page: 'eventDetail', eventId })
  }

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
        <PageHeader title="Live Session" left={<button onClick={back} className="text-zinc-400 p-2">←</button>} />
        <div className="flex items-center justify-center flex-1 text-zinc-400 text-sm">
          Add meats before starting a session.
        </div>
      </div>
    )
  }

  const totalSteps = timeline.allStepsSorted.length
  const doneSteps = completedIds.size
  const progress = totalSteps > 0 ? (doneSteps / totalSteps) * 100 : 0
  const isPastEvent = new Date(event.servingTime) < new Date()

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900">
      <PageHeader
        title={event.name}
        subtitle="Live Session"
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
            onClick={() => navigate({ page: 'timeline', eventId })}
            className="text-zinc-400 hover:text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-sm"
          >
            📋
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto">
        {/* Missed steps alert */}
        {missedSteps.length > 0 && !missedDismissed && (
          <div className="mx-4 mt-4 bg-orange-500/15 border border-orange-500/40 rounded-xl px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-orange-300 font-semibold text-sm">
                  {missedSteps.length === 1
                    ? `Step missed: ${STEP_LABELS[missedSteps[0].label]}`
                    : `${missedSteps.length} steps missed while away`}
                </p>
                <p className="text-orange-200/60 text-xs mt-0.5">
                  Check the timeline and mark steps done as needed.
                </p>
              </div>
              <button
                onClick={() => setMissedDismissed(true)}
                className="text-orange-400/60 hover:text-orange-300 text-lg leading-none flex-shrink-0 p-1"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Notification warning */}
        {!isGranted && (
          <div className="mx-4 mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 text-sm">
            <p className="text-yellow-300 font-medium">Notifications disabled</p>
            <p className="text-yellow-200/60 text-xs mt-0.5">
              Add this app to your Home Screen to enable background notifications on iPhone.
            </p>
          </div>
        )}

        {/* Wake Lock prompt */}
        {showWakeLockPrompt && (
          <div className="mx-4 mt-4 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-white font-medium">Keep screen on during cook?</p>
                <p className="text-zinc-400 text-xs mt-0.5">
                  Prevents the screen from sleeping so you don't miss steps.
                </p>
                <button
                  onClick={() => {
                    updatePreferences({ wakeLockEnabled: true })
                    setWakeLockPromptDismissed(true)
                  }}
                  className="mt-2 bg-orange-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
                >
                  Enable
                </button>
              </div>
              <button
                onClick={() => {
                  setWakeLockPromptDismissed(true)
                  setWakeLockPromptCount(c => c + 1)
                }}
                className="text-zinc-500 hover:text-zinc-300 text-lg leading-none flex-shrink-0 p-1"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Past event notice */}
        {isPastEvent && !allDone && (
          <div className="mx-4 mt-4 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm">
            <p className="text-zinc-400">Serving time has passed — mark remaining steps done when ready.</p>
          </div>
        )}

        {/* Cook Complete */}
        {allDone ? (
          <div className="mx-4 mt-6 bg-green-500/10 border border-green-500/30 rounded-2xl p-6 text-center">
            <p className="text-5xl mb-3">🎉</p>
            <p className="text-white font-black text-2xl">Cook Complete!</p>
            <p className="text-green-300/70 text-sm mt-2">All steps done. Time to eat!</p>
            <button
              onClick={() => {
                resetSessionSteps()
                navigate({ page: 'dashboard', eventId })
              }}
              className="mt-4 text-zinc-400 hover:text-white text-sm underline underline-offset-2 transition-colors"
            >
              Start Fresh Session
            </button>
          </div>
        ) : (
          <>
            {/* Current task hero */}
            {currentStep ? (
              <div className="mx-4 mt-4 bg-orange-500/10 border border-orange-500/30 rounded-2xl p-5">
                <p className="text-orange-400 text-xs font-semibold uppercase tracking-widest mb-1">
                  Now
                </p>
                <p className="text-white font-black text-2xl leading-tight">
                  {STEP_LABELS[currentStep.label]}
                </p>
                {currentStep.meatEntryId && (
                  <p className="text-orange-300/70 text-sm mt-1">{meatLabels[currentStep.meatEntryId]}</p>
                )}
                <p className="text-zinc-500 text-sm mt-1">{formatTime(currentStep.scheduledAt)}</p>
                <button
                  onClick={() => completeStep(currentStep.id)}
                  className="mt-4 w-full bg-orange-500 hover:bg-orange-400 active:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors min-h-[52px]"
                >
                  Mark Done ✓
                </button>
              </div>
            ) : (
              /* Nothing due yet — show countdown to next */
              nextStep && (
                <div className="mx-4 mt-4 bg-zinc-800/60 border border-zinc-700 rounded-2xl p-5 text-center">
                  <p className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-2">
                    Up Next
                  </p>
                  <p className="text-white font-bold text-xl">{STEP_LABELS[nextStep.label]}</p>
                  {nextStep.meatEntryId && (
                    <p className="text-zinc-500 text-sm mt-0.5">{meatLabels[nextStep.meatEntryId]}</p>
                  )}
                  <p className="text-orange-300 font-black text-4xl tabular-nums mt-3">
                    {Math.floor(countdownSeconds / 3600) > 0
                      ? `${Math.floor(countdownSeconds / 3600)}h ${Math.floor((countdownSeconds % 3600) / 60)}m`
                      : Math.floor(countdownSeconds / 60) > 0
                        ? `${Math.floor(countdownSeconds / 60)}m`
                        : `${countdownSeconds}s`}
                  </p>
                  <p className="text-zinc-600 text-xs mt-1">{formatTime(nextStep.scheduledAt)}</p>
                </div>
              )
            )}

            {/* Countdown to next (when there's a current step) */}
            {currentStep && nextStep && (
              <div className="mx-4 mt-3 bg-zinc-800 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-xs font-medium">Next</p>
                  <p className="text-white font-semibold text-base">{STEP_LABELS[nextStep.label]}</p>
                  {nextStep.meatEntryId && (
                    <p className="text-zinc-500 text-xs">{meatLabels[nextStep.meatEntryId]}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-orange-300 font-black text-3xl tabular-nums">
                    {Math.floor(countdownSeconds / 3600) > 0
                      ? `${Math.floor(countdownSeconds / 3600)}h ${Math.floor((countdownSeconds % 3600) / 60)}m`
                      : Math.floor(countdownSeconds / 60) > 0
                        ? `${Math.floor(countdownSeconds / 60)}m`
                        : `${countdownSeconds}s`}
                  </p>
                  <p className="text-zinc-600 text-xs">{formatTime(nextStep.scheduledAt)}</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Progress bar */}
        <div className="mx-4 mt-3">
          <div className="flex justify-between text-xs text-zinc-500 mb-1">
            <span>{doneSteps} of {totalSteps} steps done</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 transition-all duration-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* All steps */}
        <div className="mx-4 mt-4 mb-4 space-y-1">
          <p className="text-zinc-400 text-xs font-medium uppercase tracking-widest mb-2">All Steps</p>
          {timeline.allStepsSorted.map(step => (
            <TimelineRow
              key={step.id}
              step={step}
              meatLabel={step.meatEntryId ? meatLabels[step.meatEntryId] : undefined}
              isCompleted={completedIds.has(step.id)}
              isCurrent={step.id === currentStep?.id}
              onComplete={() => completeStep(step.id)}
              onUncomplete={() => uncompleteStep(step.id)}
            />
          ))}
        </div>

        {/* End session */}
        <div className="px-4 pb-safe-bottom pb-6">
          <Button variant="secondary" fullWidth onClick={handleEndSession}>
            End Session
          </Button>
        </div>
      </div>
    </div>
  )
}
