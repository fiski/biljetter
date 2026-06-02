'use client'

import { useState } from 'react'
import { EventWithRelations } from '@/types'
import { CalendarGrid } from './calendar/CalendarGrid'
import { ListView } from './calendar/ListView'
import { MasonryView } from './calendar/MasonryView'
import { DayListPanel } from './calendar/DayListPanel'
import { EventDrawer } from './calendar/EventDrawer'
import { FilterBar } from './filters/FilterBar'
import { ViewToggle } from './layout/ViewToggle'

export type ViewMode = 'list' | 'calendar' | 'grid'

interface CalendarWrapperProps {
  events: EventWithRelations[]
}

export function CalendarWrapper({ events }: CalendarWrapperProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [selectedEvent, setSelectedEvent] = useState<EventWithRelations | null>(null)

  // Events to show in the left panel when drawer is open — upcoming only, sorted
  const upcomingEvents = events
    .filter((e) => new Date(e.startTime) >= new Date(new Date().setHours(0, 0, 0, 0)))
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

  if (selectedEvent) {
    return (
      <div className="flex gap-0 -mx-6 min-h-screen">
        {/* Left: scrollable day list */}
        <div
          className="w-[408px] shrink-0 overflow-y-auto pt-4 pb-8 px-6"
          style={{ maxHeight: '100vh', position: 'sticky', top: 0, alignSelf: 'flex-start' }}
        >
          <DayListPanel
            events={upcomingEvents}
            selectedEventId={selectedEvent.id}
            onSelectEvent={setSelectedEvent}
          />
        </div>

        {/* Right: event drawer */}
        <div className="flex-1 min-w-0">
          <EventDrawer event={selectedEvent} onClose={() => setSelectedEvent(null)} />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-end justify-between mb-6">
        <FilterBar />
        <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
      </div>

      {viewMode === 'list' ? (
        <ListView events={events} onSelectEvent={setSelectedEvent} />
      ) : viewMode === 'grid' ? (
        <MasonryView events={events} onSelectEvent={setSelectedEvent} />
      ) : (
        <CalendarGrid events={events} onSelectEvent={setSelectedEvent} />
      )}
    </>
  )
}
