import type { TimelineStep } from '../domain/types'

export type SingleGroup = { type: 'single'; step: TimelineStep }
export type SpritzGroup = {
  type: 'spritz'
  meatEntryId: string | null
  steps: TimelineStep[]
  intervalMinutes: number
  startTime: Date
  endTime: Date
}
export type StepGroup = SingleGroup | SpritzGroup

function isSpritz(label: string): boolean {
  return label === 'spritz' || label === 'firstSpritz'
}

export function groupSteps(steps: TimelineStep[]): StepGroup[] {
  const groups: StepGroup[] = []
  let i = 0
  while (i < steps.length) {
    const step = steps[i]
    if (!isSpritz(step.label)) {
      groups.push({ type: 'single', step })
      i++
      continue
    }
    // Collect all consecutive spritz steps for the same meat
    const meatId = step.meatEntryId
    const spritzSteps: TimelineStep[] = [step]
    let j = i + 1
    while (j < steps.length && isSpritz(steps[j].label) && steps[j].meatEntryId === meatId) {
      spritzSteps.push(steps[j])
      j++
    }
    let intervalMinutes = 60
    if (spritzSteps.length >= 2) {
      intervalMinutes = Math.round(
        (spritzSteps[1].scheduledAt.getTime() - spritzSteps[0].scheduledAt.getTime()) / 60_000,
      )
    }
    groups.push({
      type: 'spritz',
      meatEntryId: meatId,
      steps: spritzSteps,
      intervalMinutes,
      startTime: spritzSteps[0].scheduledAt,
      endTime: spritzSteps[spritzSteps.length - 1].scheduledAt,
    })
    i = j
  }
  return groups
}
