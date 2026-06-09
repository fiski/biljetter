'use client'

import { useEffect, useMemo, useRef } from 'react'
import { EventWithRelations } from '@/types'
import { formatSwedishShortDate } from '@/lib/utils/formatDate'

const mono = { fontFamily: 'var(--font-ibm-plex-mono)' }

// Hardcoded popular searches — each chosen to match the mock dataset.
const POPULAR = ['Ben Howard', 'Metal', 'Pustervik', 'Quiz', 'Soul']

interface SearchPopoverProps {
  events: EventWithRelations[]
  query: string
  onQueryChange: (query: string) => void
  onSelectEvent: (event: EventWithRelations) => void
}

export function SearchPopover({ events, query, onQueryChange, onSelectEvent }: SearchPopoverProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const trimmed = query.trim().toLowerCase()

  const matches = useMemo(() => {
    if (!trimmed) return []
    return events
      .filter(
        (e) =>
          e.status !== 'cancelled' &&
          (e.title.toLowerCase().includes(trimmed) ||
          e.venue.name.toLowerCase().includes(trimmed) ||
          e.artists.some((a) => a.name.toLowerCase().includes(trimmed)))
      )
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  }, [events, trimmed])

  return (
    <div
      className="w-[426px] max-w-[calc(100vw-2rem)] border border-foreground bg-background px-10 py-12"
      style={{
        boxShadow:
          '0px 33px 32.5px rgba(0,0,0,0.08), 0px 23px 13px rgba(0,0,0,0.06), 0px 15px 7px rgba(0,0,0,0.04), 0px 9px 4px rgba(0,0,0,0.03), 0px 4px 2px rgba(0,0,0,0.02)',
      }}
    >
      {/* Input row */}
      <div className="flex flex-col gap-4 w-full">
        <div className="flex items-center justify-between gap-4 w-full">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Sök efter något"
            style={{ ...mono, caretColor: '#0f0f0f' }}
            className="flex-1 min-w-0 bg-transparent text-[16px] text-foreground outline-none placeholder:text-[rgba(15,15,15,0.47)]"
          />
          <span
            style={{ ...mono, fontWeight: 500 }}
            className={`text-[16px] text-foreground shrink-0 ${trimmed ? 'opacity-100' : 'opacity-40'}`}
          >
            Sök
          </span>
        </div>
        <div className="h-px w-full bg-foreground" />
      </div>

      {/* Empty → popular searches */}
      {!trimmed && (
        <div className="flex flex-col gap-4 w-full pt-4">
          <p style={{ ...mono, fontWeight: 500 }} className="text-[16px] text-foreground">
            Mest sökta
          </p>
          <div className="flex flex-wrap gap-3">
            {POPULAR.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => onQueryChange(term)}
                style={mono}
                className="border border-foreground rounded-[22px] px-4 py-2 text-[16px] text-foreground hover:bg-foreground hover:text-background transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {trimmed && matches.length > 0 && (
        <div className="flex flex-col w-full pt-4 max-h-[340px] overflow-y-auto search-scroll">
          {matches.map((event, i) => {
            const artist = event.artists[0]
            return (
              <button
                key={event.id}
                type="button"
                onClick={() => onSelectEvent(event)}
                className="flex flex-col gap-4 w-full text-left group pt-4 first:pt-0"
              >
                <div className="flex gap-8 items-start">
                  <div className="size-[98px] shrink-0 overflow-hidden bg-foreground-secondary/10">
                    {artist?.imageUrl && (
                      <img
                        src={artist.imageUrl}
                        alt={artist.name}
                        className="size-full object-cover group-hover:opacity-80 transition-opacity"
                      />
                    )}
                  </div>
                  <div style={mono} className="flex flex-col gap-[10px] items-start pt-4 min-w-0">
                    <p className="text-[22px] text-foreground break-words group-hover:text-accent transition-colors">
                      {artist?.name ?? event.title}
                    </p>
                    <p className="text-[18px] text-foreground-secondary">
                      {formatSwedishShortDate(new Date(event.startTime))}
                    </p>
                    <p className="text-[18px] text-foreground-secondary">{event.venue.name}</p>
                  </div>
                </div>
                {i < matches.length - 1 && <div className="h-px w-full bg-foreground/10" />}
              </button>
            )
          })}
        </div>
      )}

      {/* No results */}
      {trimmed && matches.length === 0 && (
        <div style={mono} className="w-full text-center pt-4">
          <p className="text-[14px] leading-[1.3] text-[#796f76]">Inget resultat</p>
          <p className="text-[14px] leading-[1.3] text-accent">:-(</p>
        </div>
      )}
    </div>
  )
}
