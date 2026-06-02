'use client'

import { useState, useEffect, useCallback } from 'react'
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  useEffect(() => {
    if (selectedEvent) {
      const id = requestAnimationFrame(() => setIsDrawerOpen(true))
      return () => cancelAnimationFrame(id)
    }
  }, [selectedEvent])

  const handleClose = useCallback(() => setIsDrawerOpen(false), [])

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

  return (
    <>
      {/* Calendar — always rendered so it's visible under the drawer */}
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

      {/* Drawer overlay — slides in over the calendar */}
      {selectedEvent && (
        <div className="fixed inset-0 flex z-50 overflow-hidden">
          <div
            className={`w-[408px] shrink-0 overflow-y-auto pt-4 pb-8 px-6 transition-transform duration-300 ease-out motion-reduce:transition-none ${
              isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
            style={{ background: 'var(--background)' }}
          >
            <DayListPanel
              events={upcomingEvents}
              selectedEventId={selectedEvent.id}
              onSelectEvent={setSelectedEvent}
            />
          </div>
          <div
            className={`flex-1 min-w-0 transition-transform duration-300 ease-out motion-reduce:transition-none ${
              isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
            }`}
            onTransitionEnd={() => {
              if (!isDrawerOpen) setSelectedEvent(null)
            }}
          >
            <EventDrawer event={selectedEvent} onClose={handleClose} />
          </div>
        </div>
      )}
    </>
  )
}
