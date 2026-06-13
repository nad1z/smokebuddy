import type { BBQEvent, MeatEntry, TimelineStep, MeatTimeline, EventTimeline } from '../domain/types'
import { SMOKERS_WITH_WATER_PAN } from '../domain/types'
import { getCookProfile } from '../domain/cookProfiles'
import { subtractMinutes, addMinutes } from '../utils/time'
import { generateId } from '../utils/uuid'

const REFUEL_EVERY_MINUTES = 240   // 4 hours
const SLICE_DURATION_MINUTES = 15

function makeStep(
  meatEntryId: string | null,
  label: TimelineStep['label'],
  scheduledAt: Date,
  durationMinutes = 0,
): TimelineStep {
  return {
    id: generateId(),
    meatEntryId,
    label,
    scheduledAt,
    durationMinutes,
    completed: false,
    completedAt: null,
    notifyBefore: 0,
    notificationEnabled: true,
  }
}

function generateMeatTimeline(
  meat: MeatEntry,
  servingTime: Date,
  spritzeEnabled: boolean,
): MeatTimeline {
  const profile = getCookProfile(meat.meatType, meat.cookMethod)
  const steps: TimelineStep[] = []

  // ── Work backwards from serving time ──────────────────────────────────────

  const serveAt = servingTime
  const sliceAt = subtractMinutes(serveAt, SLICE_DURATION_MINUTES)
  const restStart = subtractMinutes(sliceAt, meat.restMinutes)
  const offSmokerAt = restStart

  // Total cook minutes (weight-based, with floor)
  const cookMinutes = Math.max(
    profile.minCookMinutes,
    Math.round(meat.weightLbs * profile.minutesPerLb),
  )

  // If a wrap applies, the cook is split: unwrapped phase + post-wrap phase
  const hasWrap = profile.wrapAtTempF !== null
  const unwrappedCookMinutes = hasWrap
    ? cookMinutes - profile.postWrapMinutes
    : cookMinutes

  const wrapAt = hasWrap ? subtractMinutes(offSmokerAt, profile.postWrapMinutes) : null
  const addToSmokerAt = hasWrap
    ? subtractMinutes(wrapAt!, unwrappedCookMinutes)
    : subtractMinutes(offSmokerAt, cookMinutes)

  // ── Build steps ───────────────────────────────────────────────────────────

  // serve / slice / rest / off smoker
  steps.push(makeStep(meat.id, 'serve', serveAt, 0))
  steps.push(makeStep(meat.id, 'slice', sliceAt, SLICE_DURATION_MINUTES))
  steps.push(makeStep(meat.id, 'rest', restStart, meat.restMinutes))
  steps.push(makeStep(meat.id, 'removeFromSmoker', offSmokerAt, 0))

  // wrap
  if (hasWrap && wrapAt) {
    steps.push(makeStep(meat.id, 'wrap', wrapAt, 5))
    // check bark ~15 min before wrap
    steps.push(makeStep(meat.id, 'checkBark', subtractMinutes(wrapAt, 15), 2))
  }

  // add to smoker
  steps.push(makeStep(meat.id, 'addToSmoker', addToSmokerAt, 5))

  // spritze during unwrapped phase
  if (spritzeEnabled && profile.spritzeEveryMinutes > 0) {
    const firstSpritzOffset = profile.spritzeEveryMinutes
    const firstSpritzAt = addMinutes(addToSmokerAt, firstSpritzOffset)
    const wrapOrOffSmoker = wrapAt ?? offSmokerAt

    if (firstSpritzAt < wrapOrOffSmoker) {
      steps.push(makeStep(meat.id, 'firstSpritz', firstSpritzAt, 2))
    }

    let nextSpritz = addMinutes(firstSpritzAt, profile.spritzeEveryMinutes)
    while (nextSpritz < subtractMinutes(wrapOrOffSmoker, 30)) {
      steps.push(makeStep(meat.id, 'spritz', nextSpritz, 2))
      nextSpritz = addMinutes(nextSpritz, profile.spritzeEveryMinutes)
    }
  }

  return { meatEntryId: meat.id, steps }
}

function generateEventSteps(
  event: BBQEvent,
  meatTimelines: MeatTimeline[],
  servingTime: Date,
): TimelineStep[] {
  const steps: TimelineStep[] = []

  // Find earliest addToSmoker across all meats → preheat before that
  const allSteps = meatTimelines.flatMap(t => t.steps)
  const addToSmokerSteps = allSteps.filter(s => s.label === 'addToSmoker')

  if (addToSmokerSteps.length === 0) return steps

  const earliestAddToSmoker = addToSmokerSteps.reduce((earliest, s) =>
    s.scheduledAt < earliest.scheduledAt ? s : earliest,
  )

  // Pick preheat duration from the largest/longest profile
  const meatWithLongestPreheat = event.meats.reduce((best, m) => {
    const profile = getCookProfile(m.meatType, m.cookMethod)
    const bestProfile = getCookProfile(best.meatType, best.cookMethod)
    return profile.preheatMinutes > bestProfile.preheatMinutes ? m : best
  }, event.meats[0])

  const preheatMinutes = getCookProfile(
    meatWithLongestPreheat.meatType,
    meatWithLongestPreheat.cookMethod,
  ).preheatMinutes

  const startFireAt = subtractMinutes(earliestAddToSmoker.scheduledAt, preheatMinutes)
  steps.push(makeStep(null, 'startFire', startFireAt, preheatMinutes))

  // Refuel every 4 hours from fire start until last meat is done
  const lastStep = allSteps.reduce((last, s) =>
    s.scheduledAt > last.scheduledAt ? s : last,
  )
  let refuelAt = addMinutes(startFireAt, REFUEL_EVERY_MINUTES)
  while (refuelAt < lastStep.scheduledAt) {
    steps.push(makeStep(null, 'refuelSmoker', refuelAt, 5))
    refuelAt = addMinutes(refuelAt, REFUEL_EVERY_MINUTES)
  }

  // Water pan refill for smokers that use one
  if (SMOKERS_WITH_WATER_PAN.includes(event.smokerType)) {
    let waterAt = addMinutes(startFireAt, REFUEL_EVERY_MINUTES + 30)
    while (waterAt < subtractMinutes(servingTime, 60)) {
      steps.push(makeStep(null, 'refillWaterPan', waterAt, 3))
      waterAt = addMinutes(waterAt, REFUEL_EVERY_MINUTES)
    }
  }

  return steps
}

export function generateEventTimeline(
  event: BBQEvent,
  spritzeEnabled: boolean,
): EventTimeline {
  const servingTime = new Date(event.servingTime)

  const meatTimelines = event.meats.map(meat =>
    generateMeatTimeline(meat, servingTime, spritzeEnabled),
  )

  const eventSteps = generateEventSteps(event, meatTimelines, servingTime)

  const allStepsSorted = [
    ...eventSteps,
    ...meatTimelines.flatMap(t => t.steps),
  ].sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())

  const sessionStartAt =
    eventSteps.find(s => s.label === 'startFire')?.scheduledAt ?? servingTime

  return { eventSteps, meatTimelines, allStepsSorted, sessionStartAt }
}
