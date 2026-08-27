import { Artist } from '@/types'

/**
 * Placeholder album used until artists carry a real `spotifyId`.
 * Remove the fallback once the pipeline enriches Artist.spotifyId.
 */
const PLACEHOLDER_EMBED = 'https://open.spotify.com/embed/album/3nbh5p1xQMZOIegAprAULs?utm_source=generator&theme=0'

/** Pulls `{type}/{id}` out of any open.spotify.com URL (artist, album, track, playlist). */
function embedUrlFromLink(url?: string): string | null {
  if (!url) return null
  const match = url.match(/open\.spotify\.com\/(artist|album|track|playlist)\/([A-Za-z0-9]+)/)
  if (!match) return null
  return `https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator&theme=0`
}

export function spotifyEmbedUrl(artist?: Artist): string {
  if (artist?.spotifyId) {
    return `https://open.spotify.com/embed/artist/${artist.spotifyId}?utm_source=generator&theme=0`
  }
  return embedUrlFromLink(artist?.socialLinks?.spotify) ?? PLACEHOLDER_EMBED
}

interface SpotifyEmbedProps {
  artist?: Artist
  className?: string
  height?: number
}

export function SpotifyEmbed({ artist, className, height = 352 }: SpotifyEmbedProps) {
  return (
    <iframe
      data-testid="embed-iframe"
      src={spotifyEmbedUrl(artist)}
      title={artist ? `Spotify – ${artist.name}` : 'Spotify'}
      width="100%"
      height={height}
      frameBorder="0"
      allowFullScreen
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
      style={{ borderRadius: 12 }}
      className={className}
    />
  )
}
