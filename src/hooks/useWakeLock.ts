import { useEffect, useRef, useCallback, useState } from 'react'

export function useWakeLock(enabled: boolean) {
  const lockRef = useRef<WakeLockSentinel | null>(null)
  const [active, setActive] = useState(false)
  const [supported] = useState(() => 'wakeLock' in navigator)

  const acquire = useCallback(async () => {
    if (!supported || !enabled || lockRef.current) return
    try {
      lockRef.current = await navigator.wakeLock.request('screen')
      lockRef.current.addEventListener('release', () => {
        lockRef.current = null
        setActive(false)
      })
      setActive(true)
    } catch {
      // Permission denied or not available (e.g. page not visible)
    }
  }, [supported, enabled])

  const release = useCallback(async () => {
    if (!lockRef.current) return
    try {
      await lockRef.current.release()
    } catch {
      // ignore
    }
    lockRef.current = null
    setActive(false)
  }, [])

  useEffect(() => {
    if (!enabled || !supported) {
      void release()
      return
    }
    void acquire()

    function handleVisibility() {
      if (document.visibilityState === 'visible') void acquire()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      void release()
    }
  }, [enabled, supported, acquire, release])

  return { active, supported }
}
