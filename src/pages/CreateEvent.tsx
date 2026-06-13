import { useState } from 'react'
import type { FormEvent } from 'react'
import type { BBQEvent, SmokerType, FuelType } from '../domain/types'
import { SMOKER_LABELS, FUEL_LABELS } from '../domain/types'
import { useApp } from '../store/AppContext'
import { useRouter } from '../hooks/useRouter'
import { PageHeader } from '../components/ui/PageHeader'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { toDateString, toTimeString } from '../utils/time'
import { tempUnitLabel, fromStoredTempF, toStoredTempF } from '../utils/units'

interface Props {
  event?: BBQEvent  // if set, edit mode
}

export function CreateEvent({ event }: Props = {}) {
  const isEditing = Boolean(event)
  const { state, addEvent, updateEvent } = useApp()
  const { navigate, back } = useRouter()
  const prefs = state.preferences

  const hasActiveSession = isEditing && state.activeSession?.eventId === event?.id

  const today = toDateString(new Date())
  const defaultServeTime = '18:00'

  const [name, setName] = useState(event?.name ?? '')
  const [date, setDate] = useState(event ? toDateString(new Date(event.servingTime)) : today)
  const [serveTime, setServeTime] = useState(event ? toTimeString(new Date(event.servingTime)) : defaultServeTime)
  const [guestCount, setGuestCount] = useState(String(event?.guestCount ?? '4'))
  const [smokerType, setSmokerType] = useState<SmokerType>(event?.smokerType ?? 'kamado')
  const [targetPitTemp, setTargetPitTemp] = useState(
    String(event ? fromStoredTempF(event.targetPitTempF, prefs.measurementSystem) : fromStoredTempF(250, prefs.measurementSystem))
  )
  const [fuelType, setFuelType] = useState<FuelType>(event?.fuelType ?? 'wood')
  const [notes, setNotes] = useState(event?.notes ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Event name is required'
    if (!date) e.date = 'Date is required'
    if (!serveTime) e.serveTime = 'Serve time is required'
    const pit = Number(targetPitTemp)
    const unit = tempUnitLabel(prefs.measurementSystem)
    if (prefs.measurementSystem === 'metric') {
      if (isNaN(pit) || pit < 82 || pit > 260) e.targetPitTemp = `82–260${unit}`
    } else {
      if (isNaN(pit) || pit < 180 || pit > 500) e.targetPitTemp = `180–500${unit}`
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      const servingTime = new Date(`${date}T${serveTime}`).toISOString()
      const storedPitTempF = toStoredTempF(Number(targetPitTemp), prefs.measurementSystem)
      if (event) {
        await updateEvent({
          ...event,
          name: name.trim(),
          date,
          servingTime,
          guestCount: Number(guestCount) || 0,
          smokerType,
          targetPitTempF: storedPitTempF,
          fuelType,
          notes: notes.trim(),
        })
        navigate({ page: 'eventDetail', eventId: event.id })
      } else {
        const created = await addEvent({
          name: name.trim(),
          date,
          servingTime,
          guestCount: Number(guestCount) || 0,
          smokerType,
          targetPitTempF: storedPitTempF,
          fuelType,
          notes: notes.trim(),
          meats: [],
          status: 'planned',
        })
        navigate({ page: 'eventDetail', eventId: created.id })
      }
    } finally {
      setSaving(false)
    }
  }

  const smokerOptions = (Object.keys(SMOKER_LABELS) as SmokerType[]).map(k => ({
    value: k,
    label: SMOKER_LABELS[k],
  }))

  const fuelOptions = (Object.keys(FUEL_LABELS) as FuelType[]).map(k => ({
    value: k,
    label: FUEL_LABELS[k],
  }))

  return (
    <div className="flex flex-col min-h-screen bg-zinc-900">
      <PageHeader
        title={isEditing ? 'Edit Cook' : 'New Cook'}
        left={
          <button
            onClick={back}
            className="text-zinc-400 hover:text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            ←
          </button>
        }
      />

      {hasActiveSession && (
        <div className="mx-4 mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 text-sm">
          <p className="text-yellow-300 font-medium">Active session in progress</p>
          <p className="text-yellow-200/60 text-xs mt-0.5">
            Saving will recalculate the timeline and reset completed steps.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-safe-bottom">
        <Input
          label="Event Name"
          placeholder="Weekend Brisket"
          value={name}
          onChange={e => setName(e.target.value)}
          error={errors.name}
          autoFocus
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            error={errors.date}
          />
          <Input
            label="Serve Time"
            type="time"
            value={serveTime}
            onChange={e => setServeTime(e.target.value)}
            error={errors.serveTime}
          />
        </div>

        <Input
          label="Guests"
          type="number"
          inputMode="numeric"
          min="1"
          max="200"
          value={guestCount}
          onChange={e => setGuestCount(e.target.value)}
        />

        <Select
          label="Smoker Type"
          options={smokerOptions}
          value={smokerType}
          onChange={e => setSmokerType(e.target.value as SmokerType)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label={`Pit Temp (${tempUnitLabel(prefs.measurementSystem)})`}
            type="number"
            inputMode="numeric"
            min={prefs.measurementSystem === 'metric' ? '82' : '180'}
            max={prefs.measurementSystem === 'metric' ? '260' : '500'}
            value={targetPitTemp}
            onChange={e => setTargetPitTemp(e.target.value)}
            error={errors.targetPitTemp}
          />
          <Select
            label="Fuel"
            options={fuelOptions}
            value={fuelType}
            onChange={e => setFuelType(e.target.value as FuelType)}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="notes" className="text-sm font-medium text-zinc-300">
            Notes (optional)
          </label>
          <textarea
            id="notes"
            rows={3}
            className="bg-zinc-700 border border-zinc-600 rounded-xl px-4 py-3 text-white placeholder-zinc-500 text-base focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            placeholder="Rub recipe, wood type, special instructions…"
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        <div className="pb-4">
          <Button type="submit" fullWidth size="lg" disabled={saving}>
            {saving ? 'Saving…' : isEditing ? 'Save Changes' : 'Save & Add Meats →'}
          </Button>
        </div>
      </form>
    </div>
  )
}
