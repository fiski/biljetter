'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { EventWithRelations } from '@/types'

function SpotifyIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.36-.66.48-1.021.24-2.82-1.74-6.36-2.1-10.561-1.14-.418.122-.779-.18-.899-.54-.12-.42.18-.78.54-.9 4.56-1.02 8.52-.6 11.64 1.32.42.18.479.66.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.02.6-1.14C9.6 9.9 15 10.56 18.72 12.84c.361.18.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.3c-.6.18-1.2-.18-1.38-.72-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.721 1.62.539.3.719 1.02.419 1.56-.299.42-1.02.6-1.559.3z" />
    </svg>
  )
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
}

interface EventDrawerProps {
  event: EventWithRelations
  onClose: () => void
}

export function EventDrawer({ event, onClose }: EventDrawerProps) {
  const artist = event.artists[0]
  const start = new Date(event.startTime)
  const end = new Date(event.endTime)
  const listeners = artist?.spotifyListeners ?? event.spotifyListeners
  const spotifyHref = artist?.socialLinks?.spotify
    ?? (artist?.spotifyId ? `https://open.spotify.com/artist/${artist.spotifyId}` : 'https://open.spotify.com')
  const description =
    event.description ??
    'En kväll fylld av musik och energi – ett liveframträdande du sent ska glömma. Artisten bjuder på ett varierat set med låtar från hela karriären, varvat med nya spår och improviserade moment som gör varje konsert unik.'

  const firstChar = description[0]
  const rest = description.slice(1)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      className="h-full overflow-y-auto"
      style={{
        background: '#f9f7f1',
        boxShadow: '-33px 0 32.5px rgba(0,0,0,0.08), -23px 0 13px rgba(0,0,0,0.06), -15px 0 7px rgba(0,0,0,0.04)',
      }}
    >
      <div className="px-[86px] pt-[48px] pb-[80px]">
        {/* Close button */}
        <div className="flex justify-end mb-2">
          <button
            onClick={onClose}
            aria-label="Stäng"
            className="cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
          >
            <X size={28} strokeWidth={1.5} />
          </button>
        </div>

        {/* Artist name */}
        <h1
          className="text-[#0f0f0f] leading-none mb-6"
          style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 700, fontSize: '80px' }}
        >
          {artist?.name ?? event.title}
        </h1>

        {/* Listeners + time/venue row */}
        <div
          className="flex items-start justify-between text-[#0f0f0f] mb-3"
          style={{ fontFamily: 'var(--font-spectral)' }}
        >
          {listeners != null ? (
            <div>
              <p className="text-[20px]">{listeners.toLocaleString('sv-SE')}</p>
              <p className="text-[16px]">Lyssnare per månad</p>
            </div>
          ) : (
            <div />
          )}
          <div className="text-right">
            <p className="text-[20px]">{formatTime(start)} – {formatTime(end)}</p>
            <p className="text-[16px]">{event.venue.name}</p>
          </div>
        </div>

        {/* Artist photo */}
        <div className="w-full h-[360px] overflow-hidden mb-4 bg-[#363447]/10">
          {artist?.imageUrl && (
            <img
              src={artist.imageUrl}
              alt={artist.name}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Spotify + Biljetter */}
        <div className="flex items-center justify-between mb-12">
          <a
            href={spotifyHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-[#0f0f0f] hover:opacity-70 transition-opacity"
          >
            <SpotifyIcon />
            <span
              className="text-[14px]"
              style={{ fontFamily: 'var(--font-spectral)' }}
            >
              Lyssna med Spotify
            </span>
          </a>
          <a
            href={event.ticketUrl ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#0f0f0f] text-[#f9f7f1] px-[42px] py-[11px] hover:opacity-80 transition-opacity"
          >
            <span
              className="text-[16px] font-semibold capitalize"
              style={{ fontFamily: 'var(--font-crimson-text)' }}
            >
              Biljetter
            </span>
          </a>
        </div>

        {/* Description with drop cap */}
        <div
          className="text-[#363447] text-[18px] leading-[1.5] mb-10"
          style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 600 }}
        >
          <span
            className="float-left font-bold leading-[0.8] mr-1 mt-1"
            style={{ fontFamily: 'var(--font-cormorant)', fontSize: '89px', color: '#363447' }}
          >
            {firstChar}
          </span>
          {rest}
        </div>

        {/* Outlined Biljetter */}
        <div className="clear-both mb-12">
          <a
            href={event.ticketUrl ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block border border-[#0f0f0f] px-[42px] py-[11px] hover:bg-[#0f0f0f] hover:text-[#f9f7f1] transition-colors group"
          >
            <span
              className="text-[16px] font-semibold capitalize text-[#0f0f0f] group-hover:text-[#f9f7f1] transition-colors"
              style={{ fontFamily: 'var(--font-crimson-text)' }}
            >
              Biljetter
            </span>
          </a>
        </div>

        {/* Map placeholder */}
        <div className="w-full h-[300px] bg-[#e0ddd6] flex items-end p-4">
          <p
            className="text-[13px] text-[#363447]/60"
            style={{ fontFamily: 'var(--font-montserrat)' }}
          >
            {event.venue.name} · {event.venue.address}, {event.venue.city}
          </p>
        </div>
      </div>
    </div>
  )
}
