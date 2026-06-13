import type { BBQEvent } from '../domain/types'

export const ExportService = {
  exportEvent(event: BBQEvent): void {
    const json = JSON.stringify(event, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `smokebuddy_${event.name.replace(/\s+/g, '_')}.json`
    a.click()
    URL.revokeObjectURL(url)
  },

  importEvent(file: File): Promise<BBQEvent> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const raw = e.target?.result as string
          const event = JSON.parse(raw) as BBQEvent
          if (!event.id || !event.name || !event.servingTime) {
            reject(new Error('Invalid SmokeBuddy event file.'))
            return
          }
          resolve(event)
        } catch {
          reject(new Error('Could not parse the file. Make sure it is a valid SmokeBuddy JSON export.'))
        }
      }
      reader.onerror = () => reject(new Error('Failed to read file.'))
      reader.readAsText(file)
    })
  },
}
