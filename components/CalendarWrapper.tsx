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
import { SearchControl } from './search/SearchControl'
import { useFilterStore } from '@/lib/stores/filterStore'
import { useEvents } from '@/lib/hooks/useEvents'
import { mockEvents, mockGenres, mockVenues } from '@/lib/data/mockEvents'

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

  const { currentMonthMs, selectedGenre, selectedVenue, navigateMonth, resetToToday, setGenre, setVenue } =
    useFilterStore()

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (selectedEvent) return
      if (e.key === 'ArrowLeft') navigateMonth('prev')
      if (e.key === 'ArrowRight') navigateMonth('next')
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [selectedEvent, navigateMonth])

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
      {/* Global search — overlays everything, opens the event drawer on select */}
      <SearchControl events={mockEvents} onSelectEvent={setSelectedEvent} />

      {/* Calendar — always rendered so it's visible under the drawer */}
      <MonthHeader currentMonth={currentMonth} onNavigate={navigateMonth} onResetToToday={resetToToday} />

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

      {/* Bottom sheet drawer — slides up over the calendar */}
      {selectedEvent && (
        <div
          className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ease-out ${
            isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          onClick={handleClose}
        />
      )}
      {selectedEvent && (
        <div
          className={`fixed bottom-0 left-0 right-0 z-50 flex justify-center items-end gap-3 pointer-events-none transition-transform duration-300 ease-out motion-reduce:transition-none ${
            isDrawerOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
          onTransitionEnd={() => {
            if (!isDrawerOpen) setSelectedEvent(null)
          }}
        >
          {/* Day list panel — wide screens only */}
          <div
            className="hidden min-[1440px]:flex flex-col w-[408px] h-[85vh] overflow-hidden rounded-t-2xl shrink-0 pointer-events-auto"
            style={{ background: '#f9f7f1', boxShadow: '0 -8px 32px rgba(0,0,0,0.10), 0 -2px 8px rgba(0,0,0,0.06)' }}
          >
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-[#363447]/20" />
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-10 pt-10 pb-10">
              <DayListPanel
                events={upcomingEvents}
                selectedEventId={selectedEvent.id}
                onSelectEvent={setSelectedEvent}
              />
            </div>
          </div>

          {/* Event info panel */}
          <div
            className="w-full max-w-[920px] h-[85vh] overflow-hidden rounded-t-2xl pointer-events-auto"
            style={{ boxShadow: '0 -8px 32px rgba(0,0,0,0.10), 0 -2px 8px rgba(0,0,0,0.06)' }}
          >
            <EventDrawer event={selectedEvent} onClose={handleClose} />
          </div>
        </div>
      )}
    </>
  )
}
