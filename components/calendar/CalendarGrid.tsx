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

  let nextDay = 1
  while (days.length < 42) {
    days.push({
      date: new Date(year, month + 1, nextDay++),
      isCurrentMonth: false,
    })
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

function WeekSeparator({ hiddenColumn }: { hiddenColumn?: number }) {
  return (
    <div className="flex gap-6">
      {Array.from({ length: 7 }).map((_, i) => (
        <div
          key={i}
          className={`flex-1 h-[2px] ${i === hiddenColumn ? '' : 'bg-foreground-secondary'}`}
        />
      ))}
    </div>
  )
}

interface CalendarGridProps {
  events: EventWithRelations[]
  currentMonth: Date
  onSelectEvent?: (event: EventWithRelations) => void
}

export function CalendarGrid({ events, currentMonth, onSelectEvent }: CalendarGridProps) {
  const now = new Date()
  const calendarDays = getCalendarDays(currentMonth.getFullYear(), currentMonth.getMonth())

  const eventsByDate = new Map<string, EventWithRelations[]>()
  for (const event of events) {
    const start = new Date(event.startTime)
    const key = `${start.getFullYear()}-${start.getMonth()}-${start.getDate()}`
    const existing = eventsByDate.get(key) || []
    existing.push(event)
    eventsByDate.set(key, existing)
  }

  const todayIndex = calendarDays.findIndex((day) => isSameDay(day.date, now))
  const todayWeek = todayIndex === -1 ? -1 : Math.floor(todayIndex / 7)
  const todayColumn = todayIndex === -1 ? -1 : todayIndex % 7

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
            className={`px-4 py-3 text-[14px] font-semibold uppercase tracking-tight ${
              i === 5 ? 'text-accent' : 'text-foreground-secondary'
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Separator after headers */}
      <WeekSeparator hiddenColumn={todayWeek === 0 ? todayColumn : undefined} />

      {/* Week rows */}
      {weeks.map((week, weekIndex) => (
        <div key={weekIndex}>
          {weekIndex > 0 && (
            <WeekSeparator
              hiddenColumn={
                todayWeek === weekIndex || todayWeek === weekIndex - 1 ? todayColumn : undefined
              }
            />
          )}
          <div className="grid grid-cols-7">
            {week.map((day) => {
              const dateKey = `${day.date.getFullYear()}-${day.date.getMonth()}-${day.date.getDate()}`
              const dayEvents = eventsByDate.get(dateKey) || []
              const isToday = isSameDay(day.date, now)
              const isSaturday = day.date.getDay() === 6

              return (
                <div
                  key={dateKey}
                  className={`min-h-[180px] p-4 ${!day.isCurrentMonth ? 'opacity-40' : ''} ${
                    isToday ? 'bg-accent/[0.07] border-2 border-accent' : ''
                  }`}
                  /* Pull the frame out so its stroke lands on the week rules: 2px for the
                     rule band itself, plus 2px because a CSS border paints inside the box. */
                  style={isToday ? { marginTop: '-4px', marginBottom: '-4px' } : undefined}
                >
                  {/* Day number */}
                  <div
                    className={`text-[34px] font-bold leading-tight ${
                      isToday || isSaturday ? 'text-accent' : 'text-foreground-secondary'
                    }`}
                  >
                    {String(day.date.getDate()).padStart(2, '0')}
                  </div>

                  {/* Events */}
                  {dayEvents.length > 0 && (
                    <div className="space-y-4 mt-4">
                      {dayEvents.map((event) => {
                        const start = new Date(event.startTime)
                        const end = new Date(event.endTime)
                        return (
                          <div
                            key={event.id}
                            className={
                              onSelectEvent
                                ? '-mx-2 -my-1.5 px-2 py-1.5 cursor-pointer transition-colors hover:bg-foreground-secondary/[0.06]'
                                : ''
                            }
                            onClick={() => onSelectEvent?.(event)}
                          >
                            <div className="text-[14px] font-semibold text-foreground leading-tight">
                              {event.title}
                            </div>
                            <div className="text-[12px] font-medium text-foreground-secondary leading-tight mt-1">
                              {event.venue.name}
                            </div>
                            <div className="text-[12px] font-medium text-foreground-secondary leading-tight mt-1">
                              {formatTime(start)} – {formatTime(end)}
                            </div>
                          </div>
                        )
                      })}
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
