/**
 * SmokeBuddy Service Worker
 *
 * Responsibilities:
 * 1. Cache-first strategy for all app assets (offline support)
 * 2. Notification scheduling engine (ticker loop while session is active)
 *
 * iOS note: Push API on iOS 16.4+ requires the app to be installed to Home Screen.
 * This SW handles scheduled notifications via a polling loop after the app
 * sends SCHEDULE_NOTIFICATIONS via postMessage.
 */

const CACHE_VERSION = 'smokebuddy-v1'

// Files to pre-cache on install (Vite build outputs will be dynamic; we cache
// everything the browser requests during first load via the fetch handler)
const PRECACHE_URLS = ['/', '/index.html', '/manifest.json']

// ─── Lifecycle ────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  )
})

// ─── Fetch — cache first, network fallback ────────────────────────────────────

self.addEventListener('fetch', (event) => {
  // Only handle GET requests for same-origin assets
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached
      return fetch(event.request).then((response) => {
        // Cache successful responses for app assets
        if (response.ok && (url.pathname.startsWith('/assets/') || url.pathname === '/')) {
          const clone = response.clone()
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
    }),
  )
})

// ─── Notification Scheduler ───────────────────────────────────────────────────

/**
 * Map of eventId → array of pending notification descriptors.
 * Each descriptor: { id, label, fireAt (ms timestamp), meatLabel }
 */
const pendingNotifications = new Map()

let tickerIntervalId = null

function startTicker() {
  if (tickerIntervalId !== null) return
  tickerIntervalId = setInterval(fireDueNotifications, 30_000)
}

function stopTicker() {
  if (tickerIntervalId !== null) {
    clearInterval(tickerIntervalId)
    tickerIntervalId = null
  }
}

function fireDueNotifications() {
  const now = Date.now()
  let anyPending = false

  for (const [eventId, steps] of pendingNotifications.entries()) {
    const remaining = []
    for (const step of steps) {
      if (step.fireAt <= now) {
        self.registration.showNotification(step.title, {
          body: step.body,
          icon: '/icons/icon-192.png',
          badge: '/icons/icon-192.png',
          tag: `smokebuddy-${eventId}-${step.id}`,
          requireInteraction: false,
          data: { eventId, stepId: step.id },
        })
      } else {
        remaining.push(step)
        anyPending = true
      }
    }
    pendingNotifications.set(eventId, remaining)
  }

  if (!anyPending) stopTicker()
}

// ─── Message Handler ──────────────────────────────────────────────────────────

self.addEventListener('message', (event) => {
  const { type, eventId, steps } = event.data ?? {}

  if (type === 'SCHEDULE_NOTIFICATIONS' && eventId && Array.isArray(steps)) {
    const STEP_LABELS = {
      startFire: '🔥 Start Fire',
      addToSmoker: '🥩 Add to Smoker',
      firstSpritz: '💦 First Spritz',
      spritz: '💦 Spritz',
      checkBark: '🔍 Check Bark',
      wrap: '📦 Wrap',
      refuelSmoker: '🪵 Refuel Smoker',
      refillWaterPan: '💧 Refill Water Pan',
      removeFromSmoker: '🏁 Off Smoker',
      rest: '⏸ Rest',
      slice: '🔪 Slice',
      serve: '🍽 Serve',
    }

    const scheduled = steps
      .filter((s) => s.notificationEnabled)
      .map((s) => {
        const label = STEP_LABELS[s.label] ?? s.label
        const fireAt =
          new Date(s.scheduledAt).getTime() - (s.notifyBefore ?? 0) * 60_000
        return {
          id: s.id,
          fireAt,
          title: `SmokeBuddy — ${label}`,
          body: s.notifyBefore > 0 ? `${label} in ${s.notifyBefore} minutes` : label,
        }
      })
      .filter((s) => s.fireAt > Date.now())

    pendingNotifications.set(eventId, scheduled)

    if (scheduled.length > 0) {
      // Fire immediately once to catch any steps already due
      fireDueNotifications()
      startTicker()
    }
  }

  if (type === 'CANCEL_NOTIFICATIONS' && eventId) {
    pendingNotifications.delete(eventId)
    if (pendingNotifications.size === 0) stopTicker()
  }
})

// ─── Notification click — focus or open the app ───────────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const eventId = event.notification.data?.eventId

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        const target = eventId ? `/#dashboard?id=${eventId}` : '/'
        for (const client of clients) {
          if ('focus' in client) {
            client.postMessage({ type: 'NOTIFICATION_CLICKED', eventId })
            return client.focus()
          }
        }
        return self.clients.openWindow(target)
      }),
  )
})
