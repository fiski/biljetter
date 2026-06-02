import { ChevronDown } from 'lucide-react'
import { mockGenres, mockVenues } from '@/lib/data/mockEvents'

const monoStyle = { fontFamily: 'var(--font-ibm-plex-mono)' }

export function FilterBar() {
  return (
    <div className="flex items-end gap-8">
      <div className="flex flex-col gap-2">
        <label htmlFor="genre-filter" style={monoStyle} className="text-[16px] text-foreground">
          Genre
        </label>
        <div className="relative">
          <select
            id="genre-filter"
            style={monoStyle}
            className="appearance-none bg-background border border-foreground px-4 py-2 text-[16px] text-foreground pr-10 min-w-[200px]"
          >
            <option value="">All musik</option>
            {mockGenres.map((genre) => (
              <option key={genre.id} value={genre.slug}>{genre.name}</option>
            ))}
          </select>
          <ChevronDown size={24} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-foreground" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="venue-filter" style={monoStyle} className="text-[16px] text-foreground">
          Plats
        </label>
        <div className="relative">
          <select
            id="venue-filter"
            style={monoStyle}
            className="appearance-none bg-background border border-foreground px-4 py-2 text-[16px] text-foreground pr-10 min-w-[280px]"
          >
            <option value="">Alla platser</option>
            {mockVenues.map((venue) => (
              <option key={venue.id} value={venue.slug}>{venue.name}</option>
            ))}
          </select>
          <ChevronDown size={24} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-foreground" />
        </div>
      </div>
    </div>
  )
}
