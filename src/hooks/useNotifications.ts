import { useState, useCallback } from 'react'
import { NotificationScheduler } from '../services/NotificationScheduler'

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    'Notification' in window ? Notification.permission : 'denied',
  )

  const request = useCallback(async () => {
    const result = await NotificationScheduler.requestPermission()
    setPermission(result)
    return result
  }, [])

  const isGranted = permission === 'granted'
  const isDenied = permission === 'denied'
  const isSupported = NotificationScheduler.isSupported()

  return { permission, isGranted, isDenied, isSupported, request }
}
