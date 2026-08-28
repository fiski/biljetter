import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { EventWithRelations } from '@/types'

const FILE = join(process.cwd(), 'lib/data/events.json')

let cached: EventWithRelations[] | null | undefined

/**
 * Real Göteborg events produced by the biljetter-scraper repo.
 *
 * Returns null when the file is absent, which is the signal for the repository
 * layer to fall back to mock data — a clean checkout must still run.
 */
export function loadScrapedEvents(): EventWithRelations[] | null {
  if (cached !== undefined) return cached
  if (!existsSync(FILE)) return (cached = null)

  const parsed = JSON.parse(readFileSync(FILE, 'utf8')) as {
    events: Array<Record<string, unknown>>
  }

  cached = parsed.events.map((e) => ({
    ...e,
    startTime: new Date(e.startTime as string),
    endTime: new Date(e.endTime as string),
    createdAt: new Date(e.createdAt as string),
    updatedAt: new Date(e.updatedAt as string),
  })) as EventWithRelations[]

  return cached
}
