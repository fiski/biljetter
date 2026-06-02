'use client'

import { EventWithRelations } from '@/types'
import { GrainOverlay } from '@/components/ui/GrainOverlay'

const SWEDISH_WEEKDAYS = ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag']
const SWEDISH_MONTHS = [
  'januari', 'februari', 'mars', 'april', 'maj', 'juni',
  'juli', 'augusti', 'september', 'oktober', 'november', 'december',
]

function formatTime(date: Date): string {
  return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
}

function SpotifyIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.36-.66.48-1.021.24-2.82-1.74-6.36-2.1-10.561-1.14-.418.122-.779-.18-.899-.54-.12-.42.18-.78.54-.9 4.56-1.02 8.52-.6 11.64 1.32.42.18.479.66.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.02.6-1.14C9.6 9.9 15 10.56 18.72 12.84c.361.18.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.3c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.721 1.62.539.3.719 1.02.419 1.56-.299.42-1.02.6-1.559.3z" />
    </svg>
  )
}

function EventCard({ event, onSelectEvent }: { event: EventWithRelations; onSelectEvent?: (e: EventWithRelations) => void }) {
  const artist = event.artists[0]
  const start = new Date(event.startTime)
  const end = new Date(event.endTime)
  const listeners = artist?.spotifyListeners ?? event.spotifyListeners

  const spotifyHref = artist?.socialLinks?.spotify
    ?? (artist?.spotifyId ? `https://open.spotify.com/artist/${artist.spotifyId}` : 'https://open.spotify.com')

  return (
    <div className="flex gap-6 items-start">
      {/* Artist image — click to open detail */}
      <button
        type="button"
        className={`relative shrink-0 w-[409px] h-[316px] overflow-hidden bg-foreground-secondary/10 ${onSelectEvent ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
        onClick={() => onSelectEvent?.(event)}
        aria-label={`Visa detaljer för ${artist?.name ?? event.title}`}
      >
        {artist?.imageUrl && (
          <img
            src={artist.imageUrl}
            alt={artist.name}
            className="w-full h-full object-cover"
          />
        )}
        <GrainOverlay />
      </button>

      {/* Event details */}
      <div className="flex-1 min-w-0 flex items-end justify-between" style={{ minHeight: '316px' }}>
        <div className="flex flex-col justify-between h-[316px]">
          {/* Top: name + stats */}
          <div className="flex flex-col gap-4">
            <p
              className="text-[32px] font-bold text-foreground leading-tight"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              {artist?.name ?? event.title}
            </p>
            <div className="flex gap-14 items-end">
              {listeners != null && (
                <div style={{ fontFamily: 'var(--font-spectral)' }}>
                  <p className="text-[20px] text-foreground">{listeners.toLocaleString('en-US')}</p>
                  <p className="text-[16px] text-foreground">Lyssnare per månad</p>
                </div>
              )}
              <a
                href={spotifyHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-2 items-center text-foreground hover:opacity-70 transition-opacity"
              >
                <SpotifyIcon />
                <p className="text-[14px]" style={{ fontFamily: 'var(--font-spectral)' }}>
                  Lyssna med Spotify
                </p>
              </a>
            </div>
          </div>

          {/* Bottom: time + venue */}
          <div className="flex flex-col gap-1">
            <p
              className="text-[32px] font-bold text-foreground-secondary leading-tight"
              style={{ fontFamily: 'var(--font-cormorant)' }}
            >
              {formatTime(start)} – {formatTime(end)}
            </p>
            <p
              className="text-[18px] font-medium text-foreground-secondary"
              style={{ fontFamily: 'var(--font-montserrat)' }}
            >
              {event.venue.name}
            </p>
          </div>
        </div>

        {/* Biljetter button */}
        <a
          href={event.ticketUrl ?? '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="border border-foreground px-[42px] py-[11px] self-end shrink-0 hover:bg-foreground hover:text-background transition-colors"
        >
          <span
            className="text-[16px] font-semibold text-foreground capitalize"
            style={{ fontFamily: 'var(--font-crimson-text)' }}
          >
            Biljetter
          </span>
        </a>
      </div>
    </div>
  )
}

function DaySection({ date, events, onSelectEvent }: { date: Date; events: EventWithRelations[]; onSelectEvent?: (e: EventWithRelations) => void }) {
  const dayOfWeek = date.getDay()
  // Fri (5), Sat (6), Sun (0) get accent day name
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6
  const weekdayName = SWEDISH_WEEKDAYS[dayOfWeek]
  const monthName = SWEDISH_MONTHS[date.getMonth()]

  return (
    <div className="mb-12">
      {/* Day header */}
      <p
        className="text-[34px] font-bold text-foreground pb-3 leading-tight"
        style={{ fontFamily: 'var(--font-cormorant)' }}
      >
        {isWeekend ? (
          <>
            <span className="text-accent">{weekdayName}</span>
            {` ${date.getDate()} ${monthName}`}
          </>
        ) : (
          `${weekdayName} ${date.getDate()} ${monthName}`
        )}
      </p>

      {/* Bordered content section */}
      <div className="border-t border-b border-foreground-secondary relative">
        {/* Left vertical line */}
        <div className="absolute left-0 top-0 bottom-0 w-px bg-foreground-secondary" />

        <div className="pl-[86px] py-12 flex flex-col gap-14">
          {events.map((event) => (
            <EventCard key={event.id} event={event} onSelectEvent={onSelectEvent} />
          ))}
        </div>
      </div>
    </div>
  )
}

interface ListViewProps {
  events: EventWithRelations[]
  onSelectEvent?: (event: EventWithRelations) => void
}

export function ListView({ events, onSelectEvent }: ListViewProps) {
  // Group events by date
  const eventsByDate = new Map<string, { date: Date; events: EventWithRelations[] }>()
  for (const event of events) {
    const date = new Date(event.startTime)
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    if (!eventsByDate.has(key)) {
      eventsByDate.set(key, { date, events: [] })
    }
    eventsByDate.get(key)!.events.push(event)
  }

  const sortedDays = Array.from(eventsByDate.values()).sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  )

  return (
    <div>
      {sortedDays.map(({ date, events: dayEvents }) => {
        const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
        return <DaySection key={key} date={date} events={dayEvents} onSelectEvent={onSelectEvent} />
      })}

      <footer
        className="flex items-center gap-[102px] py-10 border-t border-foreground-secondary"
        style={{ fontFamily: 'var(--font-montserrat)' }}
      >
        <span className="text-[16px] font-medium text-foreground cursor-pointer hover:text-accent transition-colors">
          Om biljetter
        </span>
        <span className="text-[16px] font-medium text-foreground cursor-pointer hover:text-accent transition-colors">
          Kontakt
        </span>
      </footer>
    </div>
  )
}
