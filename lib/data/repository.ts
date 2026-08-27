import type { Prisma } from '@prisma/client'
import type { Artist, Event, EventWithRelations, Genre, Venue } from '@/types'
import {
  mockEvents,
  getEventsByMonth as mockEventsByMonth,
  getEventBySlug as mockEventBySlug,
  getAllVenues as mockGetAllVenues,
  getAllGenres as mockGetAllGenres,
} from './mockEvents'

// ──────────────────────────────────────────────────────────────────────────
// Data-access layer
//
// The single place that decides WHERE event data comes from. Every API route
// and server component reads through these functions and always receives the
// `EventWithRelations` shape the frontend already expects.
//
// Source selection: if DATABASE_URL is set we query Postgres via Prisma;
// otherwise we fall back to the in-memory mock data. Prisma is imported lazily
// so the app runs with zero database setup (and without a generated client at
// runtime) when no DATABASE_URL is present.
// ──────────────────────────────────────────────────────────────────────────

function isDbEnabled(): boolean {
  return Boolean(process.env.DATABASE_URL)
}

async function getPrisma() {
  const { prisma } = await import('@/lib/prisma')
  return prisma
}

export interface EventFilters {
  /** Month in `YYYY-MM` format. */
  month?: string
  /** Genre slugs. */
  genres?: string[]
  /** Venue slugs. */
  venues?: string[]
}

// ── Prisma → domain mappers ──────────────────────────────────────────────────

const eventInclude = {
  venue: true,
  artists: { include: { artist: true }, orderBy: { order: 'asc' } },
  genres: { include: { genre: true } },
} satisfies Prisma.EventInclude

type EventRow = Prisma.EventGetPayload<{ include: typeof eventInclude }>
type VenueRow = Prisma.VenueGetPayload<object>
type ArtistRow = Prisma.ArtistGetPayload<object>
type GenreRow = Prisma.GenreGetPayload<object>

function mapVenue(v: VenueRow): Venue {
  return {
    id: v.id,
    name: v.name,
    slug: v.slug,
    address: v.address,
    city: v.city,
    capacity: v.capacity ?? undefined,
    coordinates:
      v.lat != null && v.lng != null ? { lat: v.lat, lng: v.lng } : undefined,
    websiteUrl: v.websiteUrl ?? undefined,
  }
}

function mapArtist(a: ArtistRow): Artist {
  const hasSocial = a.spotifyUrl || a.instagramUrl || a.websiteUrl
  return {
    id: a.id,
    name: a.name,
    slug: a.slug,
    spotifyId: a.spotifyId ?? undefined,
    imageUrl: a.imageUrl ?? undefined,
    bio: a.bio ?? undefined,
    spotifyListeners: a.spotifyListeners ?? undefined,
    socialLinks: hasSocial
      ? {
          spotify: a.spotifyUrl ?? undefined,
          instagram: a.instagramUrl ?? undefined,
          website: a.websiteUrl ?? undefined,
        }
      : undefined,
  }
}

function mapGenre(g: GenreRow): Genre {
  return { id: g.id, name: g.name, slug: g.slug, color: g.color ?? undefined }
}

function mapEvent(e: EventRow): EventWithRelations {
  return {
    id: e.id,
    title: e.title,
    slug: e.slug,
    description: e.description ?? undefined,
    startTime: e.startTime,
    endTime: e.endTime,
    venueId: e.venueId,
    venue: mapVenue(e.venue),
    artistIds: e.artists.map((ea) => ea.artistId),
    artists: e.artists.map((ea) => mapArtist(ea.artist)),
    genreIds: e.genres.map((eg) => eg.genreId),
    genres: e.genres.map((eg) => mapGenre(eg.genre)),
    status: e.status.toLowerCase() as Event['status'],
    ticketUrl: e.ticketUrl ?? undefined,
    imageUrl: e.imageUrl ?? undefined,
    spotifyListeners: e.spotifyListeners ?? undefined,
    price: e.price ?? undefined,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function getEvents(
  filters: EventFilters = {}
): Promise<EventWithRelations[]> {
  const { month, genres, venues } = filters

  if (isDbEnabled()) {
    const prisma = await getPrisma()
    const where: Prisma.EventWhereInput = {}

    if (month) {
      const [year, monthNum] = month.split('-').map(Number)
      where.startTime = {
        gte: new Date(year, monthNum - 1, 1),
        lt: new Date(year, monthNum, 1),
      }
    }
    if (genres?.length) {
      where.genres = { some: { genre: { slug: { in: genres } } } }
    }
    if (venues?.length) {
      where.venue = { slug: { in: venues } }
    }

    const rows = await prisma.event.findMany({
      where,
      include: eventInclude,
      orderBy: { startTime: 'asc' },
    })
    return rows.map(mapEvent)
  }

  // Mock fallback — mirror the same filtering semantics.
  let result = month
    ? mockEventsByMonth(Number(month.split('-')[0]), Number(month.split('-')[1]))
    : [...mockEvents]

  if (genres?.length) {
    result = result.filter((e) => e.genres.some((g) => genres.includes(g.slug)))
  }
  if (venues?.length) {
    result = result.filter((e) => venues.includes(e.venue.slug))
  }
  return result
}

export async function getEventBySlug(
  slug: string
): Promise<EventWithRelations | null> {
  if (isDbEnabled()) {
    const prisma = await getPrisma()
    const row = await prisma.event.findUnique({
      where: { slug },
      include: eventInclude,
    })
    return row ? mapEvent(row) : null
  }
  return mockEventBySlug(slug) ?? null
}

export async function getAllVenues(): Promise<Venue[]> {
  if (isDbEnabled()) {
    const prisma = await getPrisma()
    const rows = await prisma.venue.findMany({ orderBy: { name: 'asc' } })
    return rows.map(mapVenue)
  }
  return mockGetAllVenues()
}

export async function getAllGenres(): Promise<Genre[]> {
  if (isDbEnabled()) {
    const prisma = await getPrisma()
    const rows = await prisma.genre.findMany({ orderBy: { name: 'asc' } })
    return rows.map(mapGenre)
  }
  return mockGetAllGenres()
}
