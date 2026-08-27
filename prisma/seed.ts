import { PrismaClient, EventStatus } from '@prisma/client'
import { mockVenues, mockGenres, mockEvents } from '../lib/data/mockEvents'

// Seeds the database from the current mock data so a freshly provisioned DB
// has the known baseline events for local/dev work before the scraper runs.
// Idempotent: keyed on unique slugs, safe to run repeatedly.

const prisma = new PrismaClient()

async function main() {
  // ── Venues ────────────────────────────────────────────────────────────────
  const venueIdBySlug = new Map<string, string>()
  for (const v of mockVenues) {
    const data = {
      name: v.name,
      address: v.address,
      city: v.city,
      capacity: v.capacity ?? null,
      lat: v.coordinates?.lat ?? null,
      lng: v.coordinates?.lng ?? null,
      websiteUrl: v.websiteUrl ?? null,
    }
    const row = await prisma.venue.upsert({
      where: { slug: v.slug },
      update: data,
      create: { slug: v.slug, ...data },
    })
    venueIdBySlug.set(v.slug, row.id)
  }

  // ── Genres ────────────────────────────────────────────────────────────────
  const genreIdBySlug = new Map<string, string>()
  for (const g of mockGenres) {
    const row = await prisma.genre.upsert({
      where: { slug: g.slug },
      update: { name: g.name, color: g.color ?? null },
      create: { slug: g.slug, name: g.name, color: g.color ?? null },
    })
    genreIdBySlug.set(g.slug, row.id)
  }

  // ── Events (+ artists + join rows) ──────────────────────────────────────────
  for (const e of mockEvents) {
    const artistIds: string[] = []
    for (const a of e.artists) {
      const row = await prisma.artist.upsert({
        where: { slug: a.slug },
        update: { name: a.name, imageUrl: a.imageUrl ?? null },
        create: { slug: a.slug, name: a.name, imageUrl: a.imageUrl ?? null },
      })
      artistIds.push(row.id)
    }

    const venueId = venueIdBySlug.get(e.venue.slug)
    if (!venueId) throw new Error(`Unknown venue slug: ${e.venue.slug}`)

    const eventData = {
      title: e.title,
      description: e.description ?? null,
      startTime: e.startTime,
      endTime: e.endTime,
      status: e.status.toUpperCase() as EventStatus,
      venueId,
      ticketUrl: e.ticketUrl ?? null,
      imageUrl: e.imageUrl ?? null,
      spotifyListeners: e.spotifyListeners ?? null,
      price: e.price ?? null,
    }
    const event = await prisma.event.upsert({
      where: { slug: e.slug },
      update: eventData,
      create: { slug: e.slug, ...eventData },
    })

    // Reset join rows so re-seeding stays consistent.
    await prisma.eventArtist.deleteMany({ where: { eventId: event.id } })
    await prisma.eventGenre.deleteMany({ where: { eventId: event.id } })

    await prisma.eventArtist.createMany({
      data: artistIds.map((artistId, order) => ({ eventId: event.id, artistId, order })),
      skipDuplicates: true,
    })
    await prisma.eventGenre.createMany({
      data: e.genres
        .map((g) => genreIdBySlug.get(g.slug))
        .filter((id): id is string => Boolean(id))
        .map((genreId) => ({ eventId: event.id, genreId })),
      skipDuplicates: true,
    })
  }

  console.log(
    `Seeded ${mockVenues.length} venues, ${mockGenres.length} genres, ${mockEvents.length} events.`
  )
}

main()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
