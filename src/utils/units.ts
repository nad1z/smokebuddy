import type { MeasurementSystem } from '../domain/types'

// ── Temperature ───────────────────────────────────────────────────────────────

export function displayTemp(tempF: number, system: MeasurementSystem): string {
  if (system === 'metric') {
    return `${Math.round((tempF - 32) * 5 / 9)}°C`
  }
  return `${tempF}°F`
}

/** Stored value is always °F. Returns the value in the user's display unit. */
export function fromStoredTempF(tempF: number, system: MeasurementSystem): number {
  return system === 'metric' ? Math.round((tempF - 32) * 5 / 9) : tempF
}

/** User input value in display unit → stored °F. */
export function toStoredTempF(value: number, system: MeasurementSystem): number {
  return system === 'metric' ? Math.round(value * 9 / 5 + 32) : value
}

export function tempUnitLabel(system: MeasurementSystem): string {
  return system === 'metric' ? '°C' : '°F'
}

// ── Weight ────────────────────────────────────────────────────────────────────

export function displayWeight(weightLbs: number, system: MeasurementSystem): string {
  if (system === 'metric') {
    return `${(weightLbs * 0.453592).toFixed(1)} kg`
  }
  return `${weightLbs} lbs`
}

/** Stored value is always lbs. Returns the value in the user's display unit. */
export function fromStoredWeightLbs(weightLbs: number, system: MeasurementSystem): number {
  return system === 'metric' ? parseFloat((weightLbs * 0.453592).toFixed(1)) : weightLbs
}

/** User input value in display unit → stored lbs. */
export function toStoredWeightLbs(value: number, system: MeasurementSystem): number {
  return system === 'metric' ? value / 0.453592 : value
}

export function weightUnitLabel(system: MeasurementSystem): string {
  return system === 'metric' ? 'kg' : 'lbs'
}
