import { describe, it, expect } from 'vitest'
import { generateEventTimeline } from './TimelineEngine'
import type { BBQEvent } from '../domain/types'
import { generateId } from '../utils/uuid'

function makeBrisketEvent(servingTime: string): BBQEvent {
  return {
    id: generateId(),
    name: 'Test Cook',
    date: servingTime.slice(0, 10),
    servingTime,
    guestCount: 4,
    smokerType: 'offsetStickBurner',
    targetPitTempF: 250,
    fuelType: 'wood',
    notes: '',
    status: 'planned',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    meats: [
      {
        id: generateId(),
        meatType: 'brisket',
        weightLbs: 12,
        targetTempF: 203,
        label: 'Brisket',
      },
    ],
  }
}

describe('TimelineEngine', () => {
  it('generates a startFire step before addToSmoker', () => {
    const event = makeBrisketEvent('2025-01-01T18:00:00')
    const timeline = generateEventTimeline(event, true)
    const startFire = timeline.eventSteps.find(s => s.label === 'startFire')
    const addToSmoker = timeline.meatTimelines[0].steps.find(s => s.label === 'addToSmoker')
    expect(startFire).toBeDefined()
    expect(addToSmoker).toBeDefined()
    expect(startFire!.scheduledAt.getTime()).toBeLessThan(addToSmoker!.scheduledAt.getTime())
  })

  it('serve step is at servingTime', () => {
    const servingTime = '2025-01-01T18:00:00'
    const event = makeBrisketEvent(servingTime)
    const timeline = generateEventTimeline(event, true)
    const serve = timeline.eventSteps.find(s => s.label === 'serve')
    expect(serve).toBeDefined()
    expect(serve!.scheduledAt.toISOString()).toBe(new Date(servingTime).toISOString())
  })

  it('rest step ends before serve step', () => {
    const event = makeBrisketEvent('2025-01-01T18:00:00')
    const timeline = generateEventTimeline(event, true)
    const rest = timeline.meatTimelines[0].steps.find(s => s.label === 'rest')!
    const serve = timeline.eventSteps.find(s => s.label === 'serve')!
    expect(rest.scheduledAt.getTime()).toBeLessThan(serve.scheduledAt.getTime())
  })

  it('wrap step comes before removeFromSmoker', () => {
    const event = makeBrisketEvent('2025-01-01T18:00:00')
    const timeline = generateEventTimeline(event, true)
    const steps = timeline.meatTimelines[0].steps
    const wrap = steps.find(s => s.label === 'wrap')!
    const off = steps.find(s => s.label === 'removeFromSmoker')!
    expect(wrap.scheduledAt.getTime()).toBeLessThan(off.scheduledAt.getTime())
  })

  it('allStepsSorted is in chronological order', () => {
    const event = makeBrisketEvent('2025-01-01T18:00:00')
    const timeline = generateEventTimeline(event, true)
    const times = timeline.allStepsSorted.map(s => s.scheduledAt.getTime())
    for (let i = 1; i < times.length; i++) {
      expect(times[i]).toBeGreaterThanOrEqual(times[i - 1])
    }
  })

  it('session starts before serving time', () => {
    const event = makeBrisketEvent('2025-01-01T18:00:00')
    const timeline = generateEventTimeline(event, true)
    expect(timeline.sessionStartAt.getTime()).toBeLessThan(new Date('2025-01-01T18:00:00').getTime())
  })

  it('spritz steps only appear during unwrapped phase', () => {
    const event = makeBrisketEvent('2025-01-01T18:00:00')
    const timeline = generateEventTimeline(event, true)
    const steps = timeline.meatTimelines[0].steps
    const wrapAt = steps.find(s => s.label === 'wrap')?.scheduledAt
    const addAt = steps.find(s => s.label === 'addToSmoker')?.scheduledAt
    const spritzSteps = steps.filter(s => s.label === 'spritz' || s.label === 'firstSpritz')
    spritzSteps.forEach(s => {
      if (addAt) expect(s.scheduledAt.getTime()).toBeGreaterThan(addAt.getTime())
      if (wrapAt) expect(s.scheduledAt.getTime()).toBeLessThan(wrapAt.getTime())
    })
  })

  it('generates water pan steps for offset smoker', () => {
    const event = makeBrisketEvent('2025-01-01T18:00:00')
    const timeline = generateEventTimeline(event, false)
    const waterSteps = timeline.eventSteps.filter(s => s.label === 'refillWaterPan')
    expect(waterSteps.length).toBeGreaterThan(0)
  })

  it('multi-meat: single serve step at event serving time', () => {
    const servingTime = '2025-01-01T18:00:00'
    const event: BBQEvent = {
      ...makeBrisketEvent(servingTime),
      meats: [
        { id: generateId(), meatType: 'brisket', weightLbs: 12, targetTempF: 203, label: 'Brisket' },
        { id: generateId(), meatType: 'chicken', weightLbs: 4, targetTempF: 165, label: 'Chicken' },
      ],
    }
    const timeline = generateEventTimeline(event, false)
    const serveSteps = timeline.eventSteps.filter(s => s.label === 'serve')
    expect(serveSteps.length).toBe(1)
    expect(serveSteps[0].scheduledAt.getTime()).toBe(new Date(servingTime).getTime())
  })
})
