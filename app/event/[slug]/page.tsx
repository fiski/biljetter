import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getEventBySlug } from '@/lib/data/mockEvents'

interface EventPageProps {
  params: Promise<{ slug: string }>
}

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params
  const event = getEventBySlug(slug)

  if (!event) {
    notFound()
  }

  const start = new Date(event.startTime)
  const end = new Date(event.endTime)
  const date = start.toLocaleDateString('sv-SE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const startTime = start.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
  const endTime = end.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })

  return (
    <main className="min-h-screen px-6 py-12 max-w-3xl mx-auto">
      <Link href="/" className="text-accent hover:underline text-sm mb-8 inline-block">
        &larr; Tillbaka
      </Link>

      <h1 className="font-serif text-4xl md:text-6xl font-semibold tracking-tight mb-4">
        {event.title}
      </h1>

      <div className="space-y-2 text-muted mb-8">
        <p className="capitalize">{date}</p>
        <p>{startTime} – {endTime}</p>
        <p>{event.venue.name} — {event.venue.address}, {event.venue.city}</p>
      </div>

      {event.spotifyListeners && (
        <p className="text-sm text-muted mb-6">
          {event.spotifyListeners.toLocaleString('sv-SE')} lyssnare per månad
        </p>
      )}

      <div className="flex flex-wrap gap-2 mb-8">
        {event.genres.map((genre) => (
          <span
            key={genre.id}
            className="px-3 py-1 rounded-full text-xs font-medium border border-border"
            style={{ color: genre.color }}
          >
            {genre.name}
          </span>
        ))}
      </div>

      {event.description && (
        <p className="text-foreground leading-relaxed mb-8">{event.description}</p>
      )}

      {event.price && (
        <div className="border-t border-border pt-6">
          <p className="text-lg font-semibold mb-2">{event.price}</p>
          {event.ticketUrl ? (
            <a
              href={event.ticketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-accent text-white px-6 py-2 rounded-lg hover:opacity-90 transition-opacity"
            >
              Biljetter
            </a>
          ) : (
            <p className="text-sm text-muted">Biljettlänk saknas</p>
          )}
        </div>
      )}

      <div className="mt-10 border-t border-border pt-6">
        <h2 className="font-semibold mb-2">Artister</h2>
        <ul className="space-y-1">
          {event.artists.map((artist) => (
            <li key={artist.id} className="text-muted">
              {artist.name}
              {artist.spotifyListeners && (
                <span className="text-xs ml-2">
                  ({artist.spotifyListeners.toLocaleString('sv-SE')} Spotify-lyssnare)
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
