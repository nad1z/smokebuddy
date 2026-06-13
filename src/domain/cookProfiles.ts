import type { MeatType } from './types'

export interface CookProfile {
  minutesPerLb: number
  minCookMinutes: number
  wrapAtTempF: number | null
  postWrapMinutes: number
  restMinutes: number
  preheatMinutes: number
  spritzeEveryMinutes: number
  defaultTargetTempF: number
}

const profiles: Record<MeatType, CookProfile> = {
  beefRibs: {
    minutesPerLb: 60,
    minCookMinutes: 480,
    wrapAtTempF: 170,
    postWrapMinutes: 90,
    restMinutes: 45,
    preheatMinutes: 60,
    spritzeEveryMinutes: 60,
    defaultTargetTempF: 205,
  },
  brisket: {
    minutesPerLb: 75,
    minCookMinutes: 480,
    wrapAtTempF: 165,
    postWrapMinutes: 120,
    restMinutes: 120,
    preheatMinutes: 60,
    spritzeEveryMinutes: 60,
    defaultTargetTempF: 203,
  },
  lamb: {
    minutesPerLb: 50,
    minCookMinutes: 180,
    wrapAtTempF: null,
    postWrapMinutes: 0,
    restMinutes: 20,
    preheatMinutes: 45,
    spritzeEveryMinutes: 60,
    defaultTargetTempF: 195,
  },
  chicken: {
    minutesPerLb: 45,
    minCookMinutes: 90,
    wrapAtTempF: null,
    postWrapMinutes: 0,
    restMinutes: 10,
    preheatMinutes: 45,
    spritzeEveryMinutes: 0,
    defaultTargetTempF: 165,
  },
  turkey: {
    minutesPerLb: 35,
    minCookMinutes: 180,
    wrapAtTempF: null,
    postWrapMinutes: 0,
    restMinutes: 30,
    preheatMinutes: 60,
    spritzeEveryMinutes: 90,
    defaultTargetTempF: 165,
  },
  ribs: {
    minutesPerLb: 0,
    minCookMinutes: 360,
    wrapAtTempF: null,
    postWrapMinutes: 120,
    restMinutes: 20,
    preheatMinutes: 45,
    spritzeEveryMinutes: 60,
    defaultTargetTempF: 203,
  },
  porkButt: {
    minutesPerLb: 90,
    minCookMinutes: 480,
    wrapAtTempF: 165,
    postWrapMinutes: 90,
    restMinutes: 60,
    preheatMinutes: 60,
    spritzeEveryMinutes: 90,
    defaultTargetTempF: 200,
  },
  sausage: {
    minutesPerLb: 0,
    minCookMinutes: 120,
    wrapAtTempF: null,
    postWrapMinutes: 0,
    restMinutes: 5,
    preheatMinutes: 30,
    spritzeEveryMinutes: 0,
    defaultTargetTempF: 160,
  },
}

export function getCookProfile(meatType: MeatType): CookProfile {
  return profiles[meatType]
}

export function getDefaultTargetTempF(meatType: MeatType): number {
  return profiles[meatType].defaultTargetTempF
}

export function getRestMinutes(meatType: MeatType): number {
  return profiles[meatType].restMinutes
}
