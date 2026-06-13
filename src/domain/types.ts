// ─── Enums ────────────────────────────────────────────────────────────────────

export type MeatType =
  | 'brisket'
  | 'porkButt'
  | 'ribs'
  | 'chicken'
  | 'turkey'
  | 'sausage'
  | 'beefRibs'
  | 'lamb'

export type SmokerType =
  | 'offsetStickBurner'
  | 'kamado'
  | 'pelletGrill'
  | 'kettleGrill'
  | 'cabinet'
  | 'uds'

export type FuelType = 'wood' | 'charcoal' | 'pellets' | 'gas' | 'electric'

export type EventStatus = 'planned' | 'active' | 'completed'

export type SessionStatus = 'active' | 'paused' | 'completed'

export type StepLabel =
  | 'startFire'
  | 'addToSmoker'
  | 'firstSpritz'
  | 'spritz'
  | 'checkBark'
  | 'wrap'
  | 'refuelSmoker'
  | 'refillWaterPan'
  | 'removeFromSmoker'
  | 'rest'
  | 'slice'
  | 'serve'

export type MeasurementSystem = 'metric' | 'imperial'
export type Theme = 'dark' | 'light' | 'auto'

// ─── Domain Models ────────────────────────────────────────────────────────────

export interface TimelineStep {
  id: string
  meatEntryId: string | null  // null = event-level step
  label: StepLabel
  scheduledAt: Date
  durationMinutes: number
  completed: boolean
  completedAt: Date | null
  notifyBefore: number        // minutes before step fires notification
  notificationEnabled: boolean
}

export interface MeatEntry {
  id: string
  meatType: MeatType
  weightLbs: number
  targetTempF: number
  label: string               // user-editable display name, defaults to meat type
}

export interface BBQEvent {
  id: string
  name: string
  date: string                // ISO date string YYYY-MM-DD
  servingTime: string         // ISO datetime string
  guestCount: number
  smokerType: SmokerType
  targetPitTempF: number
  fuelType: FuelType
  notes: string
  meats: MeatEntry[]
  status: EventStatus
  createdAt: string
  updatedAt: string
}

export interface Session {
  id: string
  eventId: string
  startedAt: string
  status: SessionStatus
  completedStepIds: string[]
}

export interface UserPreferences {
  measurementSystem: MeasurementSystem
  theme: Theme
  notificationsEnabled: boolean
  defaultNotifyBeforeMinutes: number
  spritzeEnabled: boolean
  wakeLockEnabled: boolean
  overnightModeEnabled: boolean
}

// ─── Computed (not persisted raw) ─────────────────────────────────────────────

export interface MeatTimeline {
  meatEntryId: string
  steps: TimelineStep[]
}

export interface EventTimeline {
  eventSteps: TimelineStep[]     // fire start, refuel, etc.
  meatTimelines: MeatTimeline[]
  allStepsSorted: TimelineStep[] // flat sorted view for dashboard
  sessionStartAt: Date
}

// ─── Display helpers ──────────────────────────────────────────────────────────

export const MEAT_LABELS: Record<MeatType, string> = {
  beefRibs: 'Beef Ribs',
  brisket: 'Brisket',
  lamb: 'Lamb',
  chicken: 'Chicken',
  turkey: 'Turkey',
  ribs: 'Pork Ribs',
  porkButt: 'Pork Butt',
  sausage: 'Sausage',
}

export const SMOKER_LABELS: Record<SmokerType, string> = {
  offsetStickBurner: 'Offset Smoker',
  kamado: 'Kamado',
  pelletGrill: 'Pellet Grill',
  kettleGrill: 'Kettle Grill',
  cabinet: 'Cabinet / Vault',
  uds: 'UDS (Drum)',
}

export const FUEL_LABELS: Record<FuelType, string> = {
  wood: 'Wood',
  charcoal: 'Charcoal',
  pellets: 'Pellets',
  gas: 'Gas',
  electric: 'Electric',
}

export const STEP_LABELS: Record<StepLabel, string> = {
  startFire: '🔥 Start Fire',
  addToSmoker: '🥩 Add to Smoker',
  firstSpritz: '💦 First Spritz',
  spritz: '💦 Spritz',
  checkBark: '🔍 Check Bark',
  wrap: '📦 Wrap',
  refuelSmoker: '🪵 Refuel Smoker',
  refillWaterPan: '💧 Refill Water Pan',
  removeFromSmoker: '🏁 Off Smoker',
  rest: '⏸ Rest',
  slice: '🔪 Slice',
  serve: '🎉 Cook Done — Time to Eat!',
}

export const SMOKERS_WITH_WATER_PAN: SmokerType[] = ['cabinet', 'offsetStickBurner', 'uds']
