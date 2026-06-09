'use client'

import { EventWithRelations } from '@/types'
import { GrainOverlay } from '@/components/ui/GrainOverlay'
import { SWEDISH_MONTHS } from '@/lib/utils/formatDate'

// Height pattern (px) — cycles across all cards for organic bento feel
const CARD_HEIGHTS = [320, 200, 380, 240, 280, 160, 360, 220, 300, 180, 400, 200]

function MasonryCard({
  event,
  height,
  onSelectEvent,
}: {
  event: EventWithRelations
  height: number
  onSelectEvent?: (event: EventWithRelations) => void
}) {
  const artist = event.artists[0]
  const date = new Date(event.startTime)
  const dateStr = `${date.getDate()} ${SWEDISH_MONTHS[date.getMonth()]}`

  return (
    <div
      className="relative overflow-hidden cursor-pointer group flex-shrink-0"
      style={{ height: `${height}px` }}
      onClick={() => onSelectEvent?.(event)}
    >
      {/* Background image */}
      {artist?.imageUrl ? (
        <img
          src={artist.imageUrl}
          alt={artist.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-foreground-secondary/30" />
      )}

      {/* Dark gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0) 58%, rgba(0,0,0,0.7) 100%)',
        }}
      />
      <GrainOverlay />

      {/* Artist name + date */}
      <div className="absolute bottom-0 left-0 right-0 pb-4 pl-4 pr-2 pt-2 flex flex-col gap-1.5">
        <p
          className="text-white text-[16px] leading-[16px]"
          style={{ fontFamily: 'var(--font-spectral)', fontWeight: 800 }}
        >
          {artist?.name ?? event.title}
        </p>
        <p
          className="text-white text-[16px] leading-[16px] font-normal"
          style={{ fontFamily: 'var(--font-montserrat)' }}
        >
          {dateStr}
        </p>
      </div>
    </div>
  )
}

interface MasonryViewProps {
  events: EventWithRelations[]
  onSelectEvent?: (event: EventWithRelations) => void
}

export function MasonryView({ events, onSelectEvent }: MasonryViewProps) {
  if (events.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-[400px] text-muted text-[16px]"
        style={{ fontFamily: 'var(--font-ibm-plex-mono)' }}
      >
        Inga konserter
      </div>
    )
  }

  const columns: EventWithRelations[][] = [[], [], []]
  events.forEach((event, i) => {
    columns[i % 3].push(event)
  })

  return (
    <div className="flex gap-4">
      {columns.map((colEvents, colIdx) => (
        <div key={colIdx} className="flex-1 flex flex-col gap-4">
          {colEvents.map((event, itemIdx) => {
            const idx = itemIdx * 3 + colIdx
            return (
              <MasonryCard
                key={event.id}
                event={event}
                height={CARD_HEIGHTS[idx % CARD_HEIGHTS.length]}
                onSelectEvent={onSelectEvent}
              />
            )
          })}
        </div>
      ))}
    </div>
  )
}
