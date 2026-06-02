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
import { MonthHeader } from './calendar/MonthHeader'
import { useFilterStore } from '@/lib/stores/filterStore'
import { useEvents } from '@/lib/hooks/useEvents'
import { mockGenres, mockVenues } from '@/lib/data/mockEvents'

export type ViewMode = 'list' | 'calendar' | 'grid'

export function CalendarWrapper() {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar')
  const [selectedEvent, setSelectedEvent] = useState<EventWithRelations | null>(null)

  const { currentMonthMs, selectedGenre, selectedVenue, navigateMonth, setGenre, setVenue } =
    useFilterStore()

  const currentMonth = new Date(currentMonthMs)

  const { data: events = [] } = useEvents({
    monthMs: currentMonthMs,
    genre: selectedGenre,
    venue: selectedVenue,
  })

  const upcomingEvents = events
    .filter((e) => new Date(e.startTime) >= new Date(new Date().setHours(0, 0, 0, 0)))
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

  if (selectedEvent) {
    return (
      <div className="fixed inset-0 flex z-50">
        <div
          className="w-[408px] shrink-0 overflow-y-auto pt-4 pb-8 px-6"
          style={{ background: 'var(--background)' }}
        >
          <DayListPanel
            events={upcomingEvents}
            selectedEventId={selectedEvent.id}
            onSelectEvent={setSelectedEvent}
          />
        </div>
        <div className="flex-1 min-w-0">
          <EventDrawer event={selectedEvent} onClose={() => setSelectedEvent(null)} />
        </div>
      </div>
    )
  }

  return (
    <>
      <MonthHeader currentMonth={currentMonth} onNavigate={navigateMonth} />

      <div className="flex items-end justify-between mb-6">
        <FilterBar
          genres={mockGenres}
          venues={mockVenues}
          selectedGenre={selectedGenre}
          selectedVenue={selectedVenue}
          onGenreChange={setGenre}
          onVenueChange={setVenue}
        />
        <ViewToggle viewMode={viewMode} onViewChange={setViewMode} />
      </div>

      {viewMode === 'list' ? (
        <ListView events={events} onSelectEvent={setSelectedEvent} />
      ) : viewMode === 'grid' ? (
        <MasonryView events={events} onSelectEvent={setSelectedEvent} />
      ) : (
        <CalendarGrid events={events} currentMonth={currentMonth} onSelectEvent={setSelectedEvent} />
      )}
    </>
  )
}
