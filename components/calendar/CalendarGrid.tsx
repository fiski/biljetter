'use client'

import { EventWithRelations } from '@/types'

const DAY_HEADERS = ['MÅN', 'TIS', 'ONS', 'TOR', 'FRE', 'LÖR', 'SÖN']

interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
}

function getCalendarDays(year: number, month: number): CalendarDay[] {
  const firstOfMonth = new Date(year, month, 1)
  const startWeekday = (firstOfMonth.getDay() + 6) % 7

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const days: CalendarDay[] = []

  for (let i = startWeekday - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      isCurrentMonth: false,
    })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    days.push({
      date: new Date(year, month, d),
      isCurrentMonth: true,
    })
  }

  const remaining = 7 - (days.length % 7)
  if (remaining < 7) {
    for (let d = 1; d <= remaining; d++) {
      days.push({
        date: new Date(year, month + 1, d),
        isCurrentMonth: false,
      })
    }
  }

  return days
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
}

function WeekSeparator() {
  return (
    <div className="flex gap-6">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex-1 h-[2px] bg-foreground-secondary" />
      ))}
    </div>
  )
}

interface CalendarGridProps {
  events: EventWithRelations[]
  onSelectEvent?: (event: EventWithRelations) => void
}

export function CalendarGrid({ events, onSelectEvent }: CalendarGridProps) {
  const now = new Date()
  const calendarDays = getCalendarDays(now.getFullYear(), now.getMonth())

  const eventsByDate = new Map<string, EventWithRelations[]>()
  for (const event of events) {
    const start = new Date(event.startTime)
    const key = `${start.getFullYear()}-${start.getMonth()}-${start.getDate()}`
    const existing = eventsByDate.get(key) || []
    existing.push(event)
    eventsByDate.set(key, existing)
  }

  const weeks: CalendarDay[][] = []
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7))
  }

  return (
    <div style={{ fontFamily: 'var(--font-montserrat)' }}>
      {/* Day headers */}
      <div className="grid grid-cols-7">
        {DAY_HEADERS.map((day, i) => (
          <div
            key={day}
            className={`py-3 text-[14px] font-semibold uppercase tracking-tight ${
              i === 5 ? 'text-accent' : 'text-foreground-secondary'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Separator after headers */}
      <WeekSeparator />

      {/* Week rows */}
      {weeks.map((week, weekIndex) => (
        <div key={weekIndex}>
          {weekIndex > 0 && <WeekSeparator />}
          <div className="grid grid-cols-7">
            {week.map((day) => {
              const dateKey = `${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}`
              const dayEvents = eventsByDate.get(dateKey) || []
              const isToday = isSameDay(day.date, now)
              const isSaturday = day.date.getDay() === 6

              return (
                <div
                  key={dateKey}
                  className={`min-h-[130px] p-2 ${!day.isCurrentMonth ? 'opacity-40' : ''}`}
                >
                  {/* Day number */}
                  <div
                    className={`text-[34px] font-bold leading-tight ${
                      isSaturday ? 'text-accent' : 'text-foreground-secondary'
                    }`}
                  >
                    {isToday ? (
                      <span
                        className="inline-block border border-accent rounded-[50%] px-2"
                        style={{ lineHeight: '1.2' }}
                      >
                        {String(day.date.getDate()).padStart(2, '0')}
                      </span>
                    ) : (
                      String(day.date.getDate()).padStart(2, '0')
                    )}
                  </div>

                  {/* Events */}
                  {dayEvents.length > 0 && (
                    <div className="relative mt-1 overflow-hidden max-h-[276px]">
                      <div className="space-y-2">
                        {dayEvents.map((event) => {
                          const start = new Date(event.startTime)
                          const end = new Date(event.endTime)
                          return (
                            <div
                              key={event.id}
                              className={onSelectEvent ? 'cursor-pointer hover:opacity-70 transition-opacity' : ''}
                              onClick={() => onSelectEvent?.(event)}
                            >
                              <div className="text-[14px] font-semibold text-foreground leading-tight">
                                {event.title}
                              </div>
                              <div className="text-[12px] font-medium text-foreground-secondary leading-tight">
                                {event.venue.name}
                              </div>
                              <div className="text-[12px] font-medium text-foreground-secondary leading-tight">
                                {formatTime(start)} – {formatTime(end)}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 h-[49px] bg-gradient-to-b from-transparent to-background pointer-events-none" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
