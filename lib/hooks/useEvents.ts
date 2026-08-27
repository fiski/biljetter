import { useQuery } from '@tanstack/react-query'
import { EventWithRelations } from '@/types'
import dayjs from 'dayjs'

interface UseEventsOptions {
  monthMs: number
  genre: string
  venue: string
}

export function useEvents({ monthMs, genre, venue }: UseEventsOptions) {
  const month = dayjs(monthMs).format('YYYY-MM')

  return useQuery({
    queryKey: ['events', month, genre, venue],
    queryFn: async () => {
      const params = new URLSearchParams({ month })
      if (genre) params.set('genres', genre)
      if (venue) params.set('venues', venue)

      const res = await fetch(`/api/events?${params}`)
      if (!res.ok) throw new Error('Failed to fetch events')
      return res.json() as Promise<EventWithRelations[]>
    },
  })
}

/** All events, unfiltered — used by global search. */
export function useAllEvents() {
  return useQuery({
    queryKey: ['events', 'all'],
    queryFn: async () => {
      const res = await fetch('/api/events')
      if (!res.ok) throw new Error('Failed to fetch events')
      return res.json() as Promise<EventWithRelations[]>
    },
    staleTime: 5 * 60 * 1000,
  })
}
