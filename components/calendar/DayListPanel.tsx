'use client'

import { EventWithRelations } from '@/types'

const SWEDISH_MONTHS_LONG = [
  'januari', 'februari', 'mars', 'april', 'maj', 'juni',
  'juli', 'augusti', 'september', 'oktober', 'november', 'december',
]

function formatTime(date: Date): string {
  return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
}

function groupByDate(events: EventWithRelations[]): { date: Date; events: EventWithRelations[] }[] {
  const map = new Map<string, { date: Date; events: EventWithRelations[] }>()
  for (const event of events) {
    const date = new Date(event.startTime)
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    if (!map.has(key)) map.set(key, { date, events: [] })
    map.get(key)!.events.push(event)
  }
  return Array.from(map.values()).sort((a, b) => a.date.getTime() - b.date.getTime())
}

interface DayListPanelProps {
  events: EventWithRelations[]
  selectedEventId?: string
  onSelectEvent: (event: EventWithRelations) => void
}

export function DayListPanel({ events, selectedEventId, onSelectEvent }: DayListPanelProps) {
  const days = groupByDate(events)

  return (
    <div className="flex flex-col gap-12 pb-20">
      {days.map(({ date, events: dayEvents }, dayIdx) => {
        const day = date.getDate()
        const month = SWEDISH_MONTHS_LONG[date.getMonth()]
        const label = dayIdx === 0 ? `${day} ${month}` : String(day).padStart(2, '0')

        return (
          <div key={`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`}>
            <p
              className="text-[34px] text-[#363447] leading-tight pb-6"
              style={{ fontFamily: 'var(--font-spectral)', fontWeight: 700 }}
            >
              {label}
            </p>
            <div className="h-px bg-[#363447] mb-6" />

            {dayEvents.length > 0 && (
              <div className="flex flex-col gap-6">
                {dayEvents.map((event) => {
                  const artist = event.artists[0]
                  const start = new Date(event.startTime)
                  const end = new Date(event.endTime)
                  const isSelected = event.id === selectedEventId

                  return (
                    <button
                      key={event.id}
                      className={`flex flex-col gap-4 text-left w-full transition-opacity ${
                        isSelected ? 'opacity-100' : 'opacity-60 hover:opacity-100'
                      }`}
                      onClick={() => onSelectEvent(event)}
                    >
                      <div className="w-full h-[224px] overflow-hidden">
                        {artist?.imageUrl ? (
                          <img
                            src={artist.imageUrl}
                            alt={artist.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#363447]/10" />
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <p
                          className="text-[24px] font-bold text-[#dd4829] leading-tight"
                          style={{ fontFamily: 'var(--font-cormorant)' }}
                        >
                          {artist?.name ?? event.title}
                        </p>
                        <div
                          className="flex flex-col gap-0.5 text-[14px] font-medium text-[#363447]"
                          style={{ fontFamily: 'var(--font-montserrat)' }}
                        >
                          <span>{event.venue.name}</span>
                          <span>{formatTime(start)} – {formatTime(end)}</span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
