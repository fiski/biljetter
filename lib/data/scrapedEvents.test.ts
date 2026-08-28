import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { loadScrapedEvents } from './scrapedEvents'

const hasFile = existsSync(join(process.cwd(), 'lib/data/events.json'))

describe.skipIf(!hasFile)('loadScrapedEvents', () => {
  const events = loadScrapedEvents()

  it('returns events when events.json is present', () => {
    expect(events).not.toBeNull()
    expect(events!.length).toBeGreaterThan(0)
  })

  it('revives ISO date strings into Date objects', () => {
    expect(events![0].startTime).toBeInstanceOf(Date)
    expect(events![0].endTime).toBeInstanceOf(Date)
    expect(Number.isNaN(events![0].startTime.getTime())).toBe(false)
  })

  it('keeps relations intact', () => {
    const e = events![0]
    expect(e.venue.name).toBeTruthy()
    expect(e.artists.length).toBeGreaterThan(0)
    expect(e.genres.length).toBeGreaterThan(0)
  })

  it('gives every event a unique slug, since slugs are routes', () => {
    const slugs = events!.map((e) => e.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })
})
