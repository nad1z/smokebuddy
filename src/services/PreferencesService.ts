import type { UserPreferences } from '../domain/types'

const KEY = 'smokebuddy_prefs'

const defaults: UserPreferences = {
  temperatureUnit: 'F',
  theme: 'dark',
  notificationsEnabled: true,
  defaultNotifyBeforeMinutes: 5,
  spritzeEnabled: true,
  wakeLockEnabled: false,
}

export const PreferencesService = {
  load(): UserPreferences {
    try {
      const raw = localStorage.getItem(KEY)
      if (!raw) return { ...defaults }
      return { ...defaults, ...JSON.parse(raw) } as UserPreferences
    } catch {
      return { ...defaults }
    }
  },

  save(prefs: UserPreferences): void {
    localStorage.setItem(KEY, JSON.stringify(prefs))
  },

  update(partial: Partial<UserPreferences>): UserPreferences {
    const current = PreferencesService.load()
    const updated = { ...current, ...partial }
    PreferencesService.save(updated)
    return updated
  },
}
