import { describe, it, expect } from 'vitest'
import { eventImage } from './eventImage'
import type { EventWithRelations } from '@/types'

function ev(overrides: Partial<EventWithRelations> = {}): EventWithRelations {
  return {
    title: 'Atomic Swing + Popsicle',
    artists: [],
    ...overrides,
  } as EventWithRelations
}

describe('eventImage', () => {
  it('prefers a real artist portrait when one exists', () => {
    const e = ev({
      artists: [{ id: 'a1', name: 'Atomic Swing', slug: 'atomic-swing', imageUrl: '/artist.png' }],
      imageUrl: '/poster.jpg',
    })
    expect(eventImage(e)).toEqual({ src: '/artist.png', alt: 'Atomic Swing' })
  })

  it('falls back to the event poster, which is what Tickster gives us', () => {
    const e = ev({
      artists: [{ id: 'a1', name: 'Atomic Swing', slug: 'atomic-swing' }],
      imageUrl: '/poster.jpg',
    })
    expect(eventImage(e)).toEqual({ src: '/poster.jpg', alt: 'Atomic Swing + Popsicle' })
  })

  it('uses the event title as alt text when there is no artist at all', () => {
    expect(eventImage(ev({ imageUrl: '/poster.jpg' }))?.alt).toBe('Atomic Swing + Popsicle')
  })

  it('returns null when there is no image anywhere, so callers can render a placeholder', () => {
    expect(eventImage(ev())).toBeNull()
  })
})
