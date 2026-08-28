import type { EventWithRelations } from '@/types'

/**
 * Picks the image to show for an event, and the alt text that goes with it.
 *
 * An artist portrait wins when we have one — that is the editorial ideal, and
 * it is what Spotify enrichment will eventually supply. Scraped events have no
 * portrait, only the promoter's poster on `event.imageUrl`, so that is the
 * fallback. Alt text follows the image: a portrait is of the artist, a poster
 * is of the event.
 *
 * Returns null rather than an empty src so callers render their placeholder
 * instead of a broken image.
 */
export function eventImage(
  event: EventWithRelations
): { src: string; alt: string } | null {
  const artist = event.artists?.[0]

  if (artist?.imageUrl) return { src: artist.imageUrl, alt: artist.name }
  if (event.imageUrl) return { src: event.imageUrl, alt: event.title }

  return null
}
