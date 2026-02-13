import { NextRequest, NextResponse } from 'next/server'
import { mockEvents } from '@/lib/data/mockEvents'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const month = searchParams.get('month')
  const genres = searchParams.get('genres')?.split(',').filter(Boolean) || []
  const venues = searchParams.get('venues')?.split(',').filter(Boolean) || []

  let filteredEvents = [...mockEvents]

  if (month) {
    const [yearNum, monthNum] = month.split('-').map(Number)
    filteredEvents = filteredEvents.filter((event) => {
      const start = new Date(event.startTime)
      return start.getFullYear() === yearNum && start.getMonth() === monthNum - 1
    })
  }

  if (genres.length > 0) {
    filteredEvents = filteredEvents.filter((event) =>
      event.genres.some((genre) => genres.includes(genre.slug))
    )
  }

  if (venues.length > 0) {
    filteredEvents = filteredEvents.filter((event) =>
      venues.includes(event.venue.slug)
    )
  }

  return NextResponse.json(filteredEvents)
}
