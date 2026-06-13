/** Subtract minutes from a Date, returning a new Date. */
export function subtractMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() - minutes * 60_000)
}

/** Add minutes to a Date, returning a new Date. */
export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000)
}

/** Format a Date as HH:MM (24h) — uses en-GB for consistent 24h output on iOS. */
export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(date)
}

/** Format a Date as "Fri Jun 13". */
export function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(date)
}

/** Format a Date as "Fri Jun 13 at 18:30". */
export function formatDateTime(date: Date): string {
  return `${formatShortDate(date)} at ${formatTime(date)}`
}

/** Return the remaining seconds between now and a future date (clamped to 0). */
export function secondsUntil(target: Date): number {
  return Math.max(0, Math.floor((target.getTime() - Date.now()) / 1000))
}

/** Format a duration in seconds as "2h 15m" or "45m" or "30s". */
export function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0s'
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  if (m > 0 && s > 0) return `${m}m ${s}s`
  if (m > 0) return `${m}m`
  return `${s}s`
}

/** Combine a YYYY-MM-DD date string and HH:MM time string into a Date. */
export function combineDateAndTime(dateStr: string, timeStr: string): Date {
  return new Date(`${dateStr}T${timeStr}`)
}

/** Extract YYYY-MM-DD from a Date in local time. */
export function toDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Extract HH:MM from a Date in local time. */
export function toTimeString(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}
