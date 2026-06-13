import type { MeatType, CookMethod } from './types'

export interface CookProfile {
  /** Minutes per pound at pit temp. Conservative (longer) estimate. */
  minutesPerLb: number
  /** Minimum cook minutes regardless of weight */
  minCookMinutes: number
  /** Internal temp (°F) at which to wrap, or null to skip wrap step */
  wrapAtTempF: number | null
  /** Minutes between wrap and removing from smoker (post-wrap cook time) */
  postWrapMinutes: number
  /** Rest minutes after pulling from smoker */
  restMinutes: number
  /** Minutes for smoker to reach target pit temp */
  preheatMinutes: number
  /** How often to spritz during unwrapped cook phase (0 = skip) */
  spritzeEveryMinutes: number
  /** Default target internal temp (°F) */
  defaultTargetTempF: number
}

type ProfileKey = `${MeatType}_${CookMethod}`

const profiles: Record<ProfileKey, CookProfile> = {
  brisket_lowAndSlow: {
    minutesPerLb: 75,
    minCookMinutes: 480,
    wrapAtTempF: 165,
    postWrapMinutes: 120,
    restMinutes: 120,
    preheatMinutes: 60,
    spritzeEveryMinutes: 60,
    defaultTargetTempF: 203,
  },
  brisket_hotAndFast: {
    minutesPerLb: 45,
    minCookMinutes: 240,
    wrapAtTempF: 170,
    postWrapMinutes: 90,
    restMinutes: 60,
    preheatMinutes: 45,
    spritzeEveryMinutes: 60,
    defaultTargetTempF: 203,
  },
  porkButt_lowAndSlow: {
    minutesPerLb: 90,
    minCookMinutes: 480,
    wrapAtTempF: 165,
    postWrapMinutes: 90,
    restMinutes: 60,
    preheatMinutes: 60,
    spritzeEveryMinutes: 90,
    defaultTargetTempF: 200,
  },
  porkButt_hotAndFast: {
    minutesPerLb: 50,
    minCookMinutes: 240,
    wrapAtTempF: 170,
    postWrapMinutes: 60,
    restMinutes: 30,
    preheatMinutes: 45,
    spritzeEveryMinutes: 60,
    defaultTargetTempF: 200,
  },
  ribs_lowAndSlow: {
    minutesPerLb: 0,
    minCookMinutes: 360,      // 3-2-1 method base
    wrapAtTempF: null,
    postWrapMinutes: 120,     // 2h wrapped
    restMinutes: 20,
    preheatMinutes: 45,
    spritzeEveryMinutes: 60,
    defaultTargetTempF: 203,
  },
  ribs_hotAndFast: {
    minutesPerLb: 0,
    minCookMinutes: 240,
    wrapAtTempF: null,
    postWrapMinutes: 60,
    restMinutes: 15,
    preheatMinutes: 30,
    spritzeEveryMinutes: 45,
    defaultTargetTempF: 200,
  },
  chicken_lowAndSlow: {
    minutesPerLb: 45,
    minCookMinutes: 90,
    wrapAtTempF: null,
    postWrapMinutes: 0,
    restMinutes: 10,
    preheatMinutes: 45,
    spritzeEveryMinutes: 0,
    defaultTargetTempF: 165,
  },
  chicken_hotAndFast: {
    minutesPerLb: 30,
    minCookMinutes: 60,
    wrapAtTempF: null,
    postWrapMinutes: 0,
    restMinutes: 10,
    preheatMinutes: 20,
    spritzeEveryMinutes: 0,
    defaultTargetTempF: 165,
  },
  turkey_lowAndSlow: {
    minutesPerLb: 35,
    minCookMinutes: 180,
    wrapAtTempF: null,
    postWrapMinutes: 0,
    restMinutes: 30,
    preheatMinutes: 60,
    spritzeEveryMinutes: 90,
    defaultTargetTempF: 165,
  },
  turkey_hotAndFast: {
    minutesPerLb: 20,
    minCookMinutes: 120,
    wrapAtTempF: null,
    postWrapMinutes: 0,
    restMinutes: 20,
    preheatMinutes: 30,
    spritzeEveryMinutes: 60,
    defaultTargetTempF: 165,
  },
  sausage_lowAndSlow: {
    minutesPerLb: 0,
    minCookMinutes: 120,
    wrapAtTempF: null,
    postWrapMinutes: 0,
    restMinutes: 5,
    preheatMinutes: 30,
    spritzeEveryMinutes: 0,
    defaultTargetTempF: 160,
  },
  sausage_hotAndFast: {
    minutesPerLb: 0,
    minCookMinutes: 60,
    wrapAtTempF: null,
    postWrapMinutes: 0,
    restMinutes: 5,
    preheatMinutes: 20,
    spritzeEveryMinutes: 0,
    defaultTargetTempF: 160,
  },
  beefRibs_lowAndSlow: {
    minutesPerLb: 60,
    minCookMinutes: 480,
    wrapAtTempF: 170,
    postWrapMinutes: 90,
    restMinutes: 45,
    preheatMinutes: 60,
    spritzeEveryMinutes: 60,
    defaultTargetTempF: 205,
  },
  beefRibs_hotAndFast: {
    minutesPerLb: 40,
    minCookMinutes: 300,
    wrapAtTempF: 175,
    postWrapMinutes: 60,
    restMinutes: 30,
    preheatMinutes: 45,
    spritzeEveryMinutes: 60,
    defaultTargetTempF: 205,
  },
  lamb_lowAndSlow: {
    minutesPerLb: 50,
    minCookMinutes: 180,
    wrapAtTempF: null,
    postWrapMinutes: 0,
    restMinutes: 20,
    preheatMinutes: 45,
    spritzeEveryMinutes: 60,
    defaultTargetTempF: 195,
  },
  lamb_hotAndFast: {
    minutesPerLb: 30,
    minCookMinutes: 120,
    wrapAtTempF: null,
    postWrapMinutes: 0,
    restMinutes: 15,
    preheatMinutes: 30,
    spritzeEveryMinutes: 45,
    defaultTargetTempF: 195,
  },
}

export function getCookProfile(meatType: MeatType, cookMethod: CookMethod): CookProfile {
  const key: ProfileKey = `${meatType}_${cookMethod}`
  return profiles[key]
}

export function getDefaultTargetTempF(meatType: MeatType): number {
  return profiles[`${meatType}_lowAndSlow`].defaultTargetTempF
}
