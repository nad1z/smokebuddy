import { useMemo } from 'react'
import type { EventTimeline, BBQEvent } from '../../domain/types'
import { MEAT_LABELS } from '../../domain/types'
import { formatTime } from '../../utils/time'

interface Props {
  timeline: EventTimeline
  event: BBQEvent
  now?: Date
}

export function GanttChart({ timeline, event, now }: Props) {
  const startMs = timeline.sessionStartAt.getTime()
  const endMs = new Date(event.servingTime).getTime()
  const totalMs = endMs - startMs

  const pct = (date: Date): number =>
    Math.max(0, Math.min(100, ((date.getTime() - startMs) / totalMs) * 100))

  const ticks = useMemo(() => {
    const result: Date[] = []
    const first = new Date(startMs)
    first.setMinutes(0, 0, 0)
    first.setHours(first.getHours() + 1)
    while (first.getTime() <= endMs) {
      result.push(new Date(first))
      first.setHours(first.getHours() + 1)
    }
    return result
  }, [startMs, endMs])

  const bars = useMemo(() =>
    timeline.meatTimelines.map(mt => {
      const meat = event.meats.find(m => m.id === mt.meatEntryId)!
      const get = (lbl: string) => mt.steps.find(s => s.label === lbl)?.scheduledAt ?? null
      return {
        meatId: mt.meatEntryId,
        label: meat?.label || MEAT_LABELS[meat?.meatType ?? 'brisket'],
        smokeStart: get('addToSmoker'),
        wrapAt: get('wrap'),
        offSmokerAt: get('removeFromSmoker'),
        sliceAt: get('slice'),
      }
    }),
  [timeline, event])

  const refuelSteps = timeline.eventSteps.filter(s => s.label === 'refuelSmoker')
  const nowPct = now ? pct(now) : null
  const nowInRange = nowPct !== null && nowPct >= 0 && nowPct <= 100

  return (
    <div className="overflow-x-auto rounded-2xl bg-zinc-800/60 border border-zinc-700/40 shadow-md">
      <div className="p-4" style={{ minWidth: '540px' }}>

        {/* ── Time axis ── */}
        <div className="flex mb-1">
          <div className="w-20 shrink-0" />
          <div className="flex-1 relative h-5">
            {ticks.map(tick => (
              <div
                key={tick.getTime()}
                className="absolute top-0 -translate-x-1/2"
                style={{ left: `${pct(tick)}%` }}
              >
                <span className="text-[10px] text-zinc-500 tabular-nums">{formatTime(tick)}</span>
              </div>
            ))}
            <div className="absolute top-0 right-0">
              <span className="text-[10px] text-orange-400 font-semibold translate-x-0 inline-block">serve</span>
            </div>
          </div>
        </div>

        {/* ── Fire / event row ── */}
        <div className="flex items-center h-9 border-b border-zinc-700/30">
          <div className="w-20 shrink-0 text-[11px] text-zinc-500 text-right pr-3 leading-tight">
            Fire
          </div>
          <div className="flex-1 relative h-full">
            <GridLines ticks={ticks} pct={pct} />
            <div className="absolute top-0 bottom-0 right-0 w-px bg-orange-500/50" />
            {nowInRange && <NowLine pct={nowPct!} />}

            <div
              className="absolute top-1/2 -translate-y-1/2 text-base leading-none"
              style={{ left: 0, transform: 'translateY(-50%)' }}
              title={formatTime(timeline.sessionStartAt)}
            >
              🔥
            </div>

            {refuelSteps.map((s, i) => (
              <div
                key={i}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 text-sm leading-none"
                style={{ left: `${pct(s.scheduledAt)}%` }}
                title={`Refuel at ${formatTime(s.scheduledAt)}`}
              >
                🪵
              </div>
            ))}
          </div>
        </div>

        {/* ── Meat rows ── */}
        {bars.map((bar, idx) => {
          const hasWrap = bar.wrapAt !== null
          const smokeStartPct = bar.smokeStart ? pct(bar.smokeStart) : 0
          const wrapPct = bar.wrapAt ? pct(bar.wrapAt) : null
          const offPct = bar.offSmokerAt ? pct(bar.offSmokerAt) : 100
          const slicePct = bar.sliceAt ? pct(bar.sliceAt) : 100
          const smokeEndPct = wrapPct ?? offPct

          return (
            <div
              key={bar.meatId}
              className={`flex items-center h-11 ${idx < bars.length - 1 ? 'border-b border-zinc-700/30' : ''}`}
            >
              <div className="w-20 shrink-0 text-xs text-zinc-200 font-medium text-right pr-3 truncate leading-tight">
                {bar.label}
              </div>
              <div className="flex-1 relative h-full">
                <GridLines ticks={ticks} pct={pct} />
                <div className="absolute top-0 bottom-0 right-0 w-px bg-orange-500/50" />
                {nowInRange && <NowLine pct={nowPct!} />}

                {/* Bar track */}
                <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-[18px]">
                  {/* Smoke phase */}
                  {smokeStartPct < smokeEndPct && (
                    <div
                      className={`absolute inset-y-0 bg-orange-500/75 ${hasWrap ? 'rounded-l-md' : 'rounded-md'}`}
                      style={{ left: `${smokeStartPct}%`, right: `${100 - smokeEndPct}%` }}
                    />
                  )}

                  {/* Wrap phase */}
                  {hasWrap && wrapPct !== null && wrapPct < offPct && (
                    <div
                      className="absolute inset-y-0 bg-amber-400/80 rounded-r-md"
                      style={{ left: `${wrapPct}%`, right: `${100 - offPct}%` }}
                    />
                  )}

                  {/* Rest phase */}
                  {offPct < slicePct && (
                    <div
                      className="absolute inset-y-0 bg-sky-500/35 rounded-r-md"
                      style={{ left: `${offPct}%`, right: `${100 - slicePct}%` }}
                    />
                  )}
                </div>

                {/* Start time label inside bar */}
                {bar.smokeStart && smokeEndPct - smokeStartPct > 10 && (
                  <span
                    className="absolute text-[9px] text-white/75 leading-none pointer-events-none z-10"
                    style={{
                      left: `${smokeStartPct}%`,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      paddingLeft: '3px',
                    }}
                  >
                    {formatTime(bar.smokeStart)}
                  </span>
                )}
              </div>
            </div>
          )
        })}

        {/* ── Legend ── */}
        <div className="flex items-center gap-5 mt-4 pl-20 text-[11px] text-zinc-500">
          <LegendItem color="bg-orange-500/75" label="Smoking" />
          <LegendItem color="bg-amber-400/80" label="Wrapped" />
          <LegendItem color="bg-sky-500/35" label="Resting" />
          {nowInRange && (
            <div className="flex items-center gap-1.5">
              <div className="w-px h-3.5 bg-white/50" />
              <span>Now</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function GridLines({ ticks, pct }: { ticks: Date[]; pct: (d: Date) => number }) {
  return (
    <>
      {ticks.map(tick => (
        <div
          key={tick.getTime()}
          className="absolute top-0 bottom-0 w-px bg-zinc-700/25"
          style={{ left: `${pct(tick)}%` }}
        />
      ))}
    </>
  )
}

function NowLine({ pct }: { pct: number }) {
  return (
    <div
      className="absolute top-0 bottom-0 w-px bg-white/50 z-10"
      style={{ left: `${pct}%` }}
    />
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`w-3 h-2.5 rounded-sm ${color}`} />
      <span>{label}</span>
    </div>
  )
}
