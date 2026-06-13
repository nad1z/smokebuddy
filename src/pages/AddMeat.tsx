import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import type { MeatType, CookMethod } from '../domain/types'
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

interface Props {
  eventId: string
  meatId?: string
}

const MEAT_OPTIONS = (Object.keys(MEAT_LABELS) as MeatType[]).map(k => ({
  value: k,
  label: MEAT_LABELS[k],
}))

const COOK_METHOD_OPTIONS = [
  { value: 'lowAndSlow', label: 'Low & Slow' },
  { value: 'hotAndFast', label: 'Hot & Fast' },
]

export function AddMeat({ eventId, meatId }: Props) {
  const { state, updateEvent } = useApp()
  const { navigate, back } = useRouter()

  const event = state.events.find(e => e.id === eventId)
  const editingMeat = meatId ? event?.meats.find(m => m.id === meatId) : undefined
  const isEditing = Boolean(editingMeat)

  const [meatType, setMeatType] = useState<MeatType>(editingMeat?.meatType ?? 'brisket')
  const [label, setLabel] = useState(editingMeat?.label ?? '')
  const [weightLbs, setWeightLbs] = useState(String(editingMeat?.weightLbs ?? '12'))
  const [targetTemp, setTargetTemp] = useState(String(editingMeat?.targetTempF ?? getDefaultTargetTempF('brisket')))
  const [restMinutes, setRestMinutes] = useState(String(editingMeat?.restMinutes ?? 120))
  const [cookMethod, setCookMethod] = useState<CookMethod>(editingMeat?.cookMethod ?? 'lowAndSlow')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  // When meat type changes, update defaults
  useEffect(() => {
    if (!isEditing) {
      const profile = getCookProfile(meatType, cookMethod)
      setTargetTemp(String(getDefaultTargetTempF(meatType)))
      setRestMinutes(String(profile.restMinutes))
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
    const w = Number(weightLbs)
    if (isNaN(w) || w <= 0 || w > 200) e.weightLbs = '0.1–200 lbs'
    const t = Number(targetTemp)
    if (isNaN(t) || t < 130 || t > 220) e.targetTemp = '130–220°F'
    const r = Number(restMinutes)
    if (isNaN(r) || r < 0 || r > 300) e.restMinutes = '0–300 min'
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
      weightLbs: Number(weightLbs),
      targetTempF: Number(targetTemp),
      restMinutes: Number(restMinutes),
      cookMethod,
    }

    if (!event) return

    const updatedMeats = isEditing
      ? event.meats.map(m => (m.id === meat.id ? meat : m))
      : [...event.meats, meat]

    await updateEvent({ ...event, meats: updatedMeats })
    setSaving(false)
    navigate({ page: 'eventDetail', eventId })
  }

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

        <Select
          label="Cook Method"
          options={COOK_METHOD_OPTIONS}
          value={cookMethod}
          onChange={e => setCookMethod(e.target.value as CookMethod)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Weight (lbs)"
            type="number"
            inputMode="decimal"
            step="0.5"
            min="0.5"
            max="200"
            value={weightLbs}
            onChange={e => setWeightLbs(e.target.value)}
            error={errors.weightLbs}
          />
          <Input
            label="Target Temp (°F)"
            type="number"
            inputMode="numeric"
            min="130"
            max="220"
            value={targetTemp}
            onChange={e => setTargetTemp(e.target.value)}
            error={errors.targetTemp}
          />
        </div>

        <Input
          label="Rest Time (minutes)"
          type="number"
          inputMode="numeric"
          min="0"
          max="300"
          value={restMinutes}
          onChange={e => setRestMinutes(e.target.value)}
          error={errors.restMinutes}
        />

        {/* Cook profile hint */}
        <div className="bg-zinc-800 rounded-xl p-3 text-sm text-zinc-400 space-y-1">
          <p className="font-medium text-zinc-300">Estimated cook time</p>
          {(() => {
            const profile = getCookProfile(meatType, cookMethod)
            const weightNum = Number(weightLbs) || 0
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
