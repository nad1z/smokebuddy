import { useMemo } from 'react'
import type { BBQEvent, EventTimeline } from '../domain/types'
import { generateEventTimeline } from '../engine/TimelineEngine'

export function useTimeline(
  event: BBQEvent | null | undefined,
  spritzeEnabled: boolean,
): EventTimeline | null {
  return useMemo(() => {
    if (!event || event.meats.length === 0) return null
    return generateEventTimeline(event, spritzeEnabled)
  }, [event, spritzeEnabled])
}
