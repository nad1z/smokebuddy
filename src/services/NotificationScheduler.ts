import type { TimelineStep } from '../domain/types'
import { STEP_LABELS } from '../domain/types'
import { subtractMinutes } from '../utils/time'

export type SerializableStep = {
  id: string
  label: TimelineStep['label']
  scheduledAt: string    // ISO string for SW postMessage
  meatEntryId: string | null
  notifyBefore: number
  notificationEnabled: boolean
}

function toSerializable(step: TimelineStep): SerializableStep {
  return {
    id: step.id,
    label: step.label,
    scheduledAt: step.scheduledAt.toISOString(),
    meatEntryId: step.meatEntryId,
    notifyBefore: step.notifyBefore,
    notificationEnabled: step.notificationEnabled,
  }
}

export const NotificationScheduler = {
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) return 'denied'
    if (Notification.permission !== 'default') return Notification.permission
    return Notification.requestPermission()
  },

  isSupported(): boolean {
    return 'Notification' in window && 'serviceWorker' in navigator
  },

  async scheduleAll(steps: TimelineStep[], eventId: string): Promise<void> {
    if (Notification.permission !== 'granted') return

    const sw = await navigator.serviceWorker.ready
    const serialized = steps
      .filter(s => s.notificationEnabled)
      .map(toSerializable)

    sw.active?.postMessage({
      type: 'SCHEDULE_NOTIFICATIONS',
      eventId,
      steps: serialized,
    })
  },

  async cancelAll(eventId: string): Promise<void> {
    const sw = await navigator.serviceWorker.ready
    sw.active?.postMessage({ type: 'CANCEL_NOTIFICATIONS', eventId })
  },

  /** Fire an immediate local notification (fallback if SW isn't active). */
  showImmediate(title: string, body: string): void {
    if (Notification.permission !== 'granted') return
    new Notification(title, { body, icon: '/icons/icon-192.png' })
  },

  getFireTime(step: TimelineStep): Date {
    return step.notifyBefore > 0
      ? subtractMinutes(step.scheduledAt, step.notifyBefore)
      : step.scheduledAt
  },

  getNotificationText(step: TimelineStep, meatLabel?: string): { title: string; body: string } {
    const label = STEP_LABELS[step.label]
    const prefix = meatLabel ? `${meatLabel}: ` : ''
    return {
      title: `SmokeBuddy — ${prefix}${label}`,
      body: step.notifyBefore > 0
        ? `${label} in ${step.notifyBefore} minutes`
        : `Time to ${label.replace(/^[^\s]+\s/, '').toLowerCase()}`,
    }
  },
}
