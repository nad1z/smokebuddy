import type { BBQEvent, MeatEntry, TimelineStep, MeatTimeline, EventTimeline } from '../domain/types'
import { SMOKERS_WITH_WATER_PAN } from '../domain/types'
import { getCookProfile } from '../domain/cookProfiles'
import { subtractMinutes, addMinutes } from '../utils/time'

const WATER_PAN_REFILL_EVERY_MINUTES = 240

function makeStep(
  meatEntryId: string | null,
  label: TimelineStep['label'],
  scheduledAt: Date,
  durationMinutes = 0,
  stepKey: string,
): TimelineStep {
  return {
    id: stepKey,
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
  const profile = getCookProfile(meat.meatType)
  const steps: TimelineStep[] = []

  // ── Work backwards from serving time ──────────────────────────────────────

  const serveAt = servingTime
  const restMinutes = profile.restMinutes
  // Rest ends at serving time; off-smoker = rest start
  const restStart = subtractMinutes(serveAt, restMinutes)
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

  // serve / rest / off smoker (no separate slice step)
  steps.push(makeStep(meat.id, 'serve', serveAt, 0, `${meat.id}_serve`))
  steps.push(makeStep(meat.id, 'rest', restStart, restMinutes, `${meat.id}_rest`))
  steps.push(makeStep(meat.id, 'removeFromSmoker', offSmokerAt, 0, `${meat.id}_removeFromSmoker`))

  // wrap
  if (hasWrap && wrapAt) {
    steps.push(makeStep(meat.id, 'wrap', wrapAt, 5, `${meat.id}_wrap`))
    // check bark ~15 min before wrap
    steps.push(makeStep(meat.id, 'checkBark', subtractMinutes(wrapAt, 15), 2, `${meat.id}_checkBark`))
  }

  // add to smoker
  steps.push(makeStep(meat.id, 'addToSmoker', addToSmokerAt, 5, `${meat.id}_addToSmoker`))

  // spritze during unwrapped phase (optional)
  if (spritzeEnabled && profile.spritzeEveryMinutes > 0) {
    const firstSpritzOffset = profile.spritzeEveryMinutes
    const firstSpritzAt = addMinutes(addToSmokerAt, firstSpritzOffset)
    const wrapOrOffSmoker = wrapAt ?? offSmokerAt

    if (firstSpritzAt < wrapOrOffSmoker) {
      steps.push(makeStep(meat.id, 'firstSpritz', firstSpritzAt, 2, `${meat.id}_firstSpritz`))
    }

    let nextSpritz = addMinutes(firstSpritzAt, profile.spritzeEveryMinutes)
    let spritzCounter = 0
    while (nextSpritz < subtractMinutes(wrapOrOffSmoker, 30)) {
      steps.push(makeStep(meat.id, 'spritz', nextSpritz, 2, `${meat.id}_spritz_${spritzCounter}`))
      spritzCounter++
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
    const profile = getCookProfile(m.meatType)
    const bestProfile = getCookProfile(best.meatType)
    return profile.preheatMinutes > bestProfile.preheatMinutes ? m : best
  }, event.meats[0])

  const preheatMinutes = getCookProfile(meatWithLongestPreheat.meatType).preheatMinutes

  const startFireAt = subtractMinutes(earliestAddToSmoker.scheduledAt, preheatMinutes)
  steps.push(makeStep(null, 'startFire', startFireAt, preheatMinutes, 'event_startFire'))

  // Water pan refill for smokers that use one
  if (SMOKERS_WITH_WATER_PAN.includes(event.smokerType)) {
    let waterAt = addMinutes(startFireAt, WATER_PAN_REFILL_EVERY_MINUTES + 30)
    let waterCounter = 0
    while (waterAt < subtractMinutes(servingTime, 60)) {
      steps.push(makeStep(null, 'refillWaterPan', waterAt, 3, `event_refillWaterPan_${waterCounter}`))
      waterCounter++
      waterAt = addMinutes(waterAt, WATER_PAN_REFILL_EVERY_MINUTES)
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
