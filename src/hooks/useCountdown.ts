import { useState, useEffect } from 'react'
import { secondsUntil } from '../utils/time'

export function useCountdown(target: Date | null): number {
  const [seconds, setSeconds] = useState(target ? secondsUntil(target) : 0)

  useEffect(() => {
    if (!target) {
      setSeconds(0)
      return
    }
    setSeconds(secondsUntil(target))
    const id = setInterval(() => {
      setSeconds(secondsUntil(target))
    }, 1000)
    return () => clearInterval(id)
  }, [target])

  return seconds
}
