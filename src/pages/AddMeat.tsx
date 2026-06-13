import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import type { MeatType } from '../domain/types'
import { MEAT_LABELS } from '../domain/types'
import { getCookProfile, getDefaultTargetTempF } from '../domain/cookProfiles'
import { useApp } from '../store/AppContext'
import { useRouter } from '../hooks/useRouter'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { generateId } from '../utils/uuid'
import type { MeatEntry } from '../domain/types'
import {
  tempUnitLabel,
  fromStoredTempF,
  toStoredTempF,
  weightUnitLabel,
  fromStoredWeightLbs,
  toStoredWeightLbs,
} from '../utils/units'

interface Props {
  eventId: string
  meatId?: string
}

const MEAT_OPTIONS = (Object.keys(MEAT_LABELS) as MeatType[]).map(k => ({
  value: k,
  label: MEAT_LABELS[k],
}))

export function AddMeat({ eventId, meatId }: Props) {
  const { state, updateEvent } = useApp()
  const { navigate, back } = useRouter()
  const prefs = state.preferences

  const event = state.events.find(e => e.id === eventId)
  const editingMeat = meatId ? event?.meats.find(m => m.id === meatId) : undefined
  const isEditing = Boolean(editingMeat)

  const [meatType, setMeatType] = useState<MeatType>(editingMeat?.meatType ?? 'beefRibs')
  const [label, setLabel] = useState(editingMeat?.label ?? '')
  const [weightInput, setWeightInput] = useState(
    String(editingMeat ? fromStoredWeightLbs(editingMeat.weightLbs, prefs.measurementSystem) : fromStoredWeightLbs(12, prefs.measurementSystem))
  )
  const [targetTempInput, setTargetTempInput] = useState(
    String(editingMeat ? fromStoredTempF(editingMeat.targetTempF, prefs.measurementSystem) : fromStoredTempF(getDefaultTargetTempF('beefRibs'), prefs.measurementSystem))
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  // When meat type changes, update defaults
  useEffect(() => {
    if (!isEditing) {
      setTargetTempInput(String(fromStoredTempF(getDefaultTargetTempF(meatType), prefs.measurementSystem)))
      setLabel(MEAT_LABELS[meatType])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meatType])

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-900 text-zinc-400">
        Event not found.
      </div>
    )
  }

  function validate(): boolean {
    const e: Record<string, string> = {}
    const w = Number(weightInput)
    if (prefs.measurementSystem === 'metric') {
      if (isNaN(w) || w < 0.1 || w > 90) e.weightInput = `0.1–90 ${weightUnitLabel(prefs.measurementSystem)}`
    } else {
      if (isNaN(w) || w <= 0 || w > 200) e.weightInput = `0.1–200 ${weightUnitLabel(prefs.measurementSystem)}`
    }
    const t = Number(targetTempInput)
    if (prefs.measurementSystem === 'metric') {
      if (isNaN(t) || t < 55 || t > 105) e.targetTempInput = `55–105${tempUnitLabel(prefs.measurementSystem)}`
    } else {
      if (isNaN(t) || t < 130 || t > 220) e.targetTempInput = `130–220${tempUnitLabel(prefs.measurementSystem)}`
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)

    const meat: MeatEntry = {
      id: editingMeat?.id ?? generateId(),
      meatType,
      label: label.trim() || MEAT_LABELS[meatType],
      weightLbs: toStoredWeightLbs(Number(weightInput), prefs.measurementSystem),
      targetTempF: toStoredTempF(Number(targetTempInput), prefs.measurementSystem),
    }

    if (!event) return

    const updatedMeats = isEditing
      ? event.meats.map(m => (m.id === meat.id ? meat : m))
      : [...event.meats, meat]

    await updateEvent({ ...event, meats: updatedMeats })
    setSaving(false)
    navigate({ page: 'eventDetail', eventId })
  }

  const profile = getCookProfile(meatType)

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900">
      <PageHeader
        title={isEditing ? 'Edit Meat' : 'Add Meat'}
        left={
          <button
            onClick={back}
            className="text-zinc-400 hover:text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            ←
          </button>
        }
      />

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-safe-bottom">
        <Select
          label="Meat Type"
          options={MEAT_OPTIONS}
          value={meatType}
          onChange={e => setMeatType(e.target.value as MeatType)}
        />

        <Input
          label="Label (optional)"
          placeholder={MEAT_LABELS[meatType]}
          value={label}
          onChange={e => setLabel(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label={`Weight (${weightUnitLabel(prefs.measurementSystem)})`}
            type="number"
            inputMode="decimal"
            step={prefs.measurementSystem === 'metric' ? '0.1' : '0.5'}
            min={prefs.measurementSystem === 'metric' ? '0.1' : '0.5'}
            max={prefs.measurementSystem === 'metric' ? '90' : '200'}
            value={weightInput}
            onChange={e => setWeightInput(e.target.value)}
            error={errors.weightInput}
          />
          <Input
            label={`Target Temp (${tempUnitLabel(prefs.measurementSystem)})`}
            type="number"
            inputMode="numeric"
            min={prefs.measurementSystem === 'metric' ? '55' : '130'}
            max={prefs.measurementSystem === 'metric' ? '105' : '220'}
            value={targetTempInput}
            onChange={e => setTargetTempInput(e.target.value)}
            error={errors.targetTempInput}
          />
        </div>

        {/* Cook profile hint */}
        <div className="bg-zinc-800 rounded-xl p-3 text-sm text-zinc-400 space-y-1">
          <p className="font-medium text-zinc-300">Estimated cook time</p>
          {(() => {
            const weightNum = toStoredWeightLbs(Number(weightInput) || 0, prefs.measurementSystem)
            const cookMins = Math.max(
              profile.minCookMinutes,
              Math.round(weightNum * profile.minutesPerLb),
            )
            const hours = Math.floor(cookMins / 60)
            const mins = cookMins % 60
            return (
              <p>
                ~{hours > 0 ? `${hours}h ` : ''}{mins > 0 ? `${mins}m` : ''} cook
                {profile.wrapAtTempF ? ` + wrap` : ''}
                {` + ${profile.restMinutes}m rest`}
              </p>
            )
          })()}
        </div>

        <div className="pb-4">
          <Button type="submit" fullWidth size="lg" disabled={saving}>
            {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Add to Cook →'}
          </Button>
        </div>
      </form>
    </div>
  )
}
