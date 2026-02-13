export interface Event {
  id: string
  title: string
  slug: string
  description?: string
  startTime: Date
  endTime: Date

  venueId: string
  artistIds: string[]
  genreIds: string[]

  status: 'upcoming' | 'ongoing' | 'past' | 'cancelled'
  ticketUrl?: string
  imageUrl?: string
  spotifyListeners?: number
  price?: string

  createdAt: Date
  updatedAt: Date
}

export interface EventWithRelations extends Event {
  venue: Venue
  artists: Artist[]
  genres: Genre[]
}

export interface Venue {
  id: string
  name: string
  slug: string
  address: string
  city: string
  capacity?: number
  coordinates?: {
    lat: number
    lng: number
  }
  websiteUrl?: string
}

export interface Artist {
  id: string
  name: string
  slug: string
  spotifyId?: string
  imageUrl?: string
  bio?: string
  spotifyListeners?: number
  socialLinks?: {
    spotify?: string
    instagram?: string
    website?: string
  }
}

export interface Genre {
  id: string
  name: string
  slug: string
  color?: string
}

export interface FilterState {
  selectedGenres: string[]
  selectedVenues: string[]
  dateRange: {
    start: Date
    end: Date
  }
  viewMode: 'month' | 'list' | 'grid'
  searchQuery?: string
}
