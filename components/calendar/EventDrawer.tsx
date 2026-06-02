'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { EventWithRelations } from '@/types'
import { GrainOverlay } from '@/components/ui/GrainOverlay'

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
    'Nästan tjugo år efter att han började sin musikaliska resa har konstnären vuxit till en av de mest hyllade artisterna i sin generation. Med rötter i en rik musiktradition och influenser från blues, rock och afrikansk psykedelisk musik har han skapat ett unikt och omedelbart igenkännbart sound som lyft honom till internationell berömmelse.\n\nHan växte upp i en stad som länge har varit ett kulturellt centrum för sin folkgrupp. Som ung man lärde han sig spela av äldre musiker och absorberade den rika musikaliska tradition som omgav honom. Det var inte förrän han kom i kontakt med västerländsk rockmusik — framför allt Jimi Hendrix och Mark Knopfler — som hans stil verkligen börja blomstra till något alldeles eget.\n\nHans senaste skiva, inspelad tillsammans med en av branschens mest namnkunniga producenter, är ett mästerverk av fusion och känsla. Albumet rör sig sömlöst mellan traditionella melodier och moderna rockriffs, med en intensitet och närvaro som gör det omöjligt att sitta still. Varje spår är ett vittnesbörd om artistens förmåga att brygga kulturer och musikstilar utan att förlora sin distinkta röst.\n\nPå scen är han en kraftfull berättare. Hans spel är tekniskt imponerande men aldrig kallt — det pulserar med liv och emotion. Varje konsert är en resa, från de långsamma drömmande öppningarna till de explosiva finalerna där publiken ofelbart dras med i dansen. Det är musik som talar till kropp och själ på en gång, och som sätter spår långt efter att sista tonen klingat ut.\n\nPå Pustervik bjuder han denna kväll på ett set som sträcker sig över hela karriären — från tidiga folkliga låtar till de senaste elektrifierade styckena. Ta chansen att uppleva en artist som, trots sin internationella framgång, fortfarande bär med sig grunderna i den tradition som format honom. Konserten är en sällsynt möjlighet att se ett av världsmusikens mest fascinerande fenomen på nära håll.\n\nDörrarna öppnar 19:00 och förband spelar från 19:30. Kvällen avslutas runt midnatt. Inga åldersgränser, alla välkomna. Biljetter säljs i dörren om ej slutsålt i förväg — vi rekommenderar bokning online för att garantera din plats på detta unika framträdande.'

  const paragraphs = description.split('\n\n').filter(Boolean)
  const firstChar = paragraphs[0]?.[0] ?? ''
  const firstRest = paragraphs[0]?.slice(1) ?? ''

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="h-full overflow-y-auto" style={{ background: '#f9f7f1' }}>
      {/* Drag handle */}
      <div className="flex justify-center pt-3 pb-1">
        <div className="w-10 h-1 rounded-full bg-[#363447]/20" />
      </div>
      <div className="px-[86px] pt-4 pb-[80px]">
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
        <div className="relative w-full h-[360px] overflow-hidden mb-4 bg-[#363447]/10">
          {artist?.imageUrl && (
            <img
              src={artist.imageUrl}
              alt={artist.name}
              className="w-full h-full object-cover"
            />
          )}
          <GrainOverlay />
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
          className="text-[#363447] text-[18px] leading-[1.5] mb-10 space-y-6"
          style={{ fontFamily: 'var(--font-cormorant)', fontWeight: 600 }}
        >
          <p>
            <span
              className="float-left font-bold leading-[0.8] mr-1 mt-1"
              style={{ fontFamily: 'var(--font-cormorant)', fontSize: '89px', color: '#363447' }}
            >
              {firstChar}
            </span>
            {firstRest}
          </p>
          {paragraphs.slice(1).map((p, i) => (
            <p key={i} className="clear-both">{p}</p>
          ))}
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

        {/* Map */}
        <div className="relative w-full h-[443px] overflow-hidden">
          <iframe
            src="https://www.openstreetmap.org/export/embed.html?bbox=11.938%2C57.696%2C11.969%2C57.706&layer=mapnik&marker=57.7002%2C11.9535"
            className="w-full h-full border-0"
            title="Karta"
            style={{ pointerEvents: 'none' }}
          />
          <GrainOverlay />
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#f9f7f1]/80 to-transparent">
            <p
              className="text-[13px] text-[#363447]"
              style={{ fontFamily: 'var(--font-montserrat)' }}
            >
              {event.venue.name} · {event.venue.address}, {event.venue.city}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
