import { useQuery } from '@tanstack/react-query'
import { Genre, Venue } from '@/types'

/** All genres — used to populate the genre filter dropdown. */
export function useGenres() {
  return useQuery({
    queryKey: ['genres'],
    queryFn: async () => {
      const res = await fetch('/api/genres')
      if (!res.ok) throw new Error('Failed to fetch genres')
      return res.json() as Promise<Genre[]>
    },
    staleTime: 60 * 60 * 1000,
  })
}

/** All venues — used to populate the venue filter dropdown. */
export function useVenues() {
  return useQuery({
    queryKey: ['venues'],
    queryFn: async () => {
      const res = await fetch('/api/venues')
      if (!res.ok) throw new Error('Failed to fetch venues')
      return res.json() as Promise<Venue[]>
    },
    staleTime: 60 * 60 * 1000,
  })
}
