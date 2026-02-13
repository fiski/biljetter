# Concert Calendar Project - Claude Code Reference

## Project Overview

A Swedish concert/event calendar application inspired by a clean, minimal design. Users can browse concerts by month, filter by genre and venue, and view detailed event information. The calendar displays events in multiple views (month grid, list, detail modal) with integrated Spotify data.

**Target Audience**: Swedish music fans looking for concerts in their city (Göteborg focus)
**Primary Language**: Swedish (UI text)
**Reference Design**: Screenshots provided show calendar with events (mock data uses dynamic current-month dates)

---

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Calendar Library**: react-big-calendar ^1.11.0
- **Date Library**: Day.js ^1.11.0
- **Styling**: Tailwind CSS
- **State Management**: 
  - Zustand (UI state, filters)
  - React Query / TanStack Query (server state, caching)
- **Forms**: React Hook Form + Zod validation

### Backend
- **API**: Next.js API Routes
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Validation**: Zod schemas

### Integrations
- **Spotify Web API**: Artist data, listener counts
- **Mapbox** (future): Venue locations

---

## Project Structure

```
concert-calendar/
├── app/
│   ├── (routes)/
│   │   ├── page.tsx                 # Home/Calendar page
│   │   ├── event/[slug]/page.tsx    # Event detail page
│   │   └── api/
│   │       ├── events/route.ts      # GET /api/events
│   │       └── venues/route.ts      # GET /api/venues
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── calendar/
│   │   ├── CalendarView.tsx         # Main calendar wrapper
│   │   ├── MonthView.tsx            # Month grid
│   │   ├── ListView.tsx             # List view
│   │   ├── EventCard.tsx            # Event display component
│   │   └── EventDetailModal.tsx     # Detail modal/page
│   ├── filters/
│   │   ├── FilterBar.tsx            # Genre + Venue filters
│   │   ├── GenreFilter.tsx
│   │   └── VenueFilter.tsx
│   ├── ui/                          # Shadcn/ui components
│   └── layout/
│       ├── Header.tsx
│       └── ViewToggle.tsx           # Month/List/Grid toggle
├── lib/
│   ├── data/
│   │   └── mockEvents.ts            # Dummy data
│   ├── utils/
│   │   ├── dateUtils.ts
│   │   └── eventUtils.ts
│   ├── hooks/
│   │   ├── useEvents.ts
│   │   └── useFilters.ts
│   └── stores/
│       └── filterStore.ts           # Zustand store
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
└── types/
    └── index.ts                     # TypeScript types
```

---

## Data Models

### TypeScript Interfaces

```typescript
// Core Event type
interface Event {
  id: string
  title: string
  slug: string
  description?: string
  startTime: Date
  endTime: Date
  
  // Relationships (IDs)
  venueId: string
  artistIds: string[]
  genreIds: string[]
  
  // Metadata
  status: 'upcoming' | 'ongoing' | 'past' | 'cancelled'
  ticketUrl?: string
  imageUrl?: string
  spotifyListeners?: number
  price?: string
  
  // Timestamps
  createdAt: Date
  updatedAt: Date
}

// Event with populated relations (for display)
interface EventWithRelations extends Event {
  venue: Venue
  artists: Artist[]
  genres: Genre[]
}

// Venue
interface Venue {
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

// Artist/Performer
interface Artist {
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

// Genre
interface Genre {
  id: string
  name: string
  slug: string
  color?: string  // For UI theming
}

// Filter state
interface FilterState {
  selectedGenres: string[]
  selectedVenues: string[]
  dateRange: {
    start: Date
    end: Date
  }
  viewMode: 'month' | 'list' | 'grid'
  searchQuery?: string
}
```

### Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Event {
  id          String   @id @default(cuid())
  title       String
  slug        String   @unique
  description String?  @db.Text
  startTime   DateTime
  endTime     DateTime
  status      EventStatus @default(UPCOMING)
  
  // Relations
  venue       Venue    @relation(fields: [venueId], references: [id])
  venueId     String
  
  artists     EventArtist[]
  genres      EventGenre[]
  
  // Metadata
  ticketUrl        String?
  imageUrl         String?
  spotifyListeners Int?
  price            String?
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([startTime])
  @@index([venueId])
  @@index([status])
}

model Venue {
  id       String  @id @default(cuid())
  name     String
  slug     String  @unique
  address  String
  city     String
  capacity Int?
  lat      Float?
  lng      Float?
  websiteUrl String?
  
  events   Event[]
  
  @@index([city])
}

model Artist {
  id               String  @id @default(cuid())
  name             String
  slug             String  @unique
  spotifyId        String? @unique
  imageUrl         String?
  bio              String? @db.Text
  spotifyListeners Int?
  spotifyUrl       String?
  instagramUrl     String?
  websiteUrl       String?
  
  events           EventArtist[]
}

model Genre {
  id     String @id @default(cuid())
  name   String
  slug   String @unique
  color  String?
  
  events EventGenre[]
}

// Junction tables for many-to-many
model EventArtist {
  event     Event  @relation(fields: [eventId], references: [id], onDelete: Cascade)
  eventId   String
  artist    Artist @relation(fields: [artistId], references: [id], onDelete: Cascade)
  artistId  String
  order     Int    @default(0)  // For display order
  
  @@id([eventId, artistId])
  @@index([artistId])
}

model EventGenre {
  event    Event  @relation(fields: [eventId], references: [id], onDelete: Cascade)
  eventId  String
  genre    Genre  @relation(fields: [genreId], references: [id], onDelete: Cascade)
  genreId  String
  
  @@id([eventId, genreId])
  @@index([genreId])
}

enum EventStatus {
  UPCOMING
  ONGOING
  PAST
  CANCELLED
}
```

---

## Design Requirements (from Screenshots)

### Color Palette
```css
/* Based on screenshots */
--background: #F5F3EE;        /* Warm off-white */
--foreground: #2C2C2C;        /* Dark gray text */
--accent: #E8735B;            /* Coral/salmon accent */
--muted: #9E9E9E;             /* Gray text */
--border: #D4D4D4;            /* Light borders */
--card-bg: #FFFFFF;           /* White cards */
```

### Typography
- **Font Family**: Serif font (similar to Libre Baskerville or Cormorant Garamond)
- **Headers**: Large serif titles (NOVEMBER 2021)
- **Body**: Clean, readable sans-serif for event details
- **Sizes**: 
  - Page title: 48-64px
  - Day numbers: 32-40px
  - Event titles: 14-16px
  - Event details: 12-14px

### Layout Patterns

#### 1. Month Grid View (Images 1-2)
- **Grid**: 7 columns (Mon-Sun), Swedish day abbreviations
- **Day cells**: Large date numbers, event list below
- **Event items**: 
  - Title (bold)
  - Venue name (lighter)
  - Time range
- **Highlighting**: Current date circled in coral/salmon
- **Spacing**: Generous padding, clean separators

#### 2. List View (Image 3)
- **Grouped by date**: "Torsdag 11 november", "Fredag 12 november", etc.
- **Event cards**: 
  - Left: Artist image (square)
  - Right: Event details
  - Bottom: "Biljetter" (Tickets) button
- **Details shown**:
  - Spotify listener count
  - Time range
  - Venue name
  - "Lyssna med Spotify" link

#### 3. Detail View (Image 4)
- **Left sidebar**: Mini calendar showing other events
- **Right main area**:
  - Large artist image
  - Event title
  - Listener count
  - Time and venue
  - Full description text
  - Map location
  - "Biljetter" button

### Swedish UI Text
```typescript
const swedishText = {
  // Days
  days: {
    mon: 'MÅN',
    tue: 'TIS',
    wed: 'ONS',
    thu: 'TOR',
    fri: 'FRE',
    sat: 'LÖR',
    sun: 'SÖN'
  },
  
  // Months
  months: {
    jan: 'JANUARI',
    feb: 'FEBRUARI',
    mar: 'MARS',
    apr: 'APRIL',
    may: 'MAJ',
    jun: 'JUNI',
    jul: 'JULI',
    aug: 'AUGUSTI',
    sep: 'SEPTEMBER',
    oct: 'OKTOBER',
    nov: 'NOVEMBER',
    dec: 'DECEMBER'
  },
  
  // UI Labels
  labels: {
    genre: 'Genre',
    allGenres: 'All musik',
    venue: 'Plats',
    allVenues: 'Alla platser',
    tickets: 'Biljetter',
    listenOnSpotify: 'Lyssna med Spotify',
    listeners: 'Lyssnare per månad',
    noEvents: 'Inga konserter',
    about: 'Om biljetter',
    contact: 'Kontakt'
  }
}
```

---

## Implementation Phases

### Phase 1: Setup & Mock Data ✓ START HERE
1. Initialize Next.js project with TypeScript
2. Install dependencies (react-big-calendar, Day.js, Tailwind)
3. Create mock data file with 20-30 events
4. Set up basic routing structure

### Phase 2: Calendar Views
1. Build MonthView with react-big-calendar
2. Implement custom event rendering
3. Add Swedish localization
4. Style to match design

### Phase 3: Filtering
1. Create FilterBar component
2. Implement Zustand filter store
3. Add genre/venue dropdown filters
4. Wire up filter logic

### Phase 4: List & Detail Views
1. Build ListView component
2. Create EventCard component
3. Implement EventDetailModal
4. Add routing for detail pages

### Phase 5: Database Integration
1. Set up Prisma schema
2. Create seed data
3. Build API routes
4. Replace mock data with real queries

### Phase 6: Enhancements
1. Add Spotify API integration
2. Implement search functionality
3. Add loading states
4. Mobile responsiveness

---

## Code Examples & Patterns

### react-big-calendar Setup

```typescript
// components/calendar/CalendarView.tsx
'use client'

import { Calendar, dayjsLocalizer, View } from 'react-big-calendar'
import dayjs from 'dayjs'
import 'dayjs/locale/sv'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { EventWithRelations } from '@/types'

dayjs.locale('sv')
const localizer = dayjsLocalizer(dayjs)

// Custom messages in Swedish
const messages = {
  month: 'Månad',
  week: 'Vecka',
  day: 'Dag',
  today: 'Idag',
  previous: 'Föregående',
  next: 'Nästa',
  showMore: (count: number) => `+${count} mer`
}

interface CalendarViewProps {
  events: EventWithRelations[]
  onSelectEvent: (event: EventWithRelations) => void
  onNavigate: (date: Date) => void
  currentDate: Date
}

export function CalendarView({ 
  events, 
  onSelectEvent, 
  onNavigate,
  currentDate 
}: CalendarViewProps) {
  // Transform events to react-big-calendar format
  const calendarEvents = events.map(event => ({
    ...event,
    start: new Date(event.startTime),
    end: new Date(event.endTime)
  }))

  return (
    <Calendar
      localizer={localizer}
      events={calendarEvents}
      startAccessor="start"
      endAccessor="end"
      messages={messages}
      views={['month']}
      defaultView="month"
      onSelectEvent={onSelectEvent}
      onNavigate={onNavigate}
      date={currentDate}
      style={{ height: '100%' }}
      components={{
        event: CustomEventComponent,
        toolbar: CustomToolbar
      }}
    />
  )
}
```

### Custom Event Component

```typescript
// components/calendar/CustomEventComponent.tsx
import { EventWithRelations } from '@/types'

interface CustomEventComponentProps {
  event: EventWithRelations
}

export function CustomEventComponent({ event }: CustomEventComponentProps) {
  const startTime = dayjs(event.startTime).format('HH:mm')
  const endTime = dayjs(event.endTime).format('HH:mm')
  
  return (
    <div className="text-xs p-1">
      <div className="font-semibold truncate">{event.title}</div>
      <div className="text-muted-foreground truncate">{event.venue.name}</div>
      <div className="text-muted-foreground">{startTime} – {endTime}</div>
    </div>
  )
}
```

### Filter Store (Zustand)

```typescript
// lib/stores/filterStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface FilterStore {
  selectedGenres: string[]
  selectedVenues: string[]
  viewMode: 'month' | 'list' | 'grid'
  currentMonth: Date
  
  setGenres: (genres: string[]) => void
  setVenues: (venues: string[]) => void
  setViewMode: (mode: 'month' | 'list' | 'grid') => void
  setCurrentMonth: (date: Date) => void
  resetFilters: () => void
}

export const useFilterStore = create<FilterStore>()(
  persist(
    (set) => ({
      selectedGenres: [],
      selectedVenues: [],
      viewMode: 'month',
      currentMonth: new Date(),
      
      setGenres: (genres) => set({ selectedGenres: genres }),
      setVenues: (venues) => set({ selectedVenues: venues }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setCurrentMonth: (date) => set({ currentMonth: date }),
      resetFilters: () => set({ 
        selectedGenres: [], 
        selectedVenues: [] 
      })
    }),
    {
      name: 'concert-calendar-filters'
    }
  )
)
```

### Event Fetching Hook

```typescript
// lib/hooks/useEvents.ts
import { useQuery } from '@tanstack/react-query'
import { EventWithRelations } from '@/types'
import dayjs from 'dayjs'

interface UseEventsOptions {
  month: Date
  genres?: string[]
  venues?: string[]
}

export function useEvents({ month, genres = [], venues = [] }: UseEventsOptions) {
  return useQuery({
    queryKey: ['events', dayjs(month).format('YYYY-MM'), genres, venues],
    queryFn: async () => {
      const params = new URLSearchParams({
        month: dayjs(month).format('YYYY-MM'),
        ...(genres.length && { genres: genres.join(',') }),
        ...(venues.length && { venues: venues.join(',') })
      })
      
      const response = await fetch(`/api/events?${params}`)
      if (!response.ok) throw new Error('Failed to fetch events')
      return response.json() as Promise<EventWithRelations[]>
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
```

---

## Mock Data Structure

### Example Mock Events

```typescript
// lib/data/mockEvents.ts
import { EventWithRelations, Venue, Artist, Genre } from '@/types'

// Sample venues
export const mockVenues: Venue[] = [
  {
    id: 'v1',
    name: 'Pustervik',
    slug: 'pustervik',
    address: 'Järntorget 12',
    city: 'Göteborg',
    capacity: 350,
    lat: 57.7032,
    lng: 11.9582
  },
  {
    id: 'v2',
    name: 'Nefertiti',
    slug: 'nefertiti',
    address: 'Hvitfeldtsplatsen 6',
    city: 'Göteborg',
    capacity: 250
  },
  {
    id: 'v3',
    name: 'The universe',
    slug: 'the-universe',
    address: 'Esperantoplatsen 3',
    city: 'Göteborg',
    capacity: 1200
  },
  {
    id: 'v4',
    name: 'Haga lekplats',
    slug: 'haga-lekplats',
    address: 'Haga Nygata 13',
    city: 'Göteborg',
    capacity: 150
  },
  {
    id: 'v5',
    name: 'Farm',
    slug: 'farm',
    address: 'Kungsgatan 12',
    city: 'Göteborg',
    capacity: 200
  }
]

// Sample genres
export const mockGenres: Genre[] = [
  { id: 'g1', name: 'Rock', slug: 'rock', color: '#E74C3C' },
  { id: 'g2', name: 'Electronic', slug: 'electronic', color: '#3498DB' },
  { id: 'g3', name: 'Jazz', slug: 'jazz', color: '#9B59B6' },
  { id: 'g4', name: 'Indie', slug: 'indie', color: '#2ECC71' },
  { id: 'g5', name: 'Folk', slug: 'folk', color: '#F39C12' },
  { id: 'g6', name: 'Hip Hop', slug: 'hip-hop', color: '#95A5A6' }
]

// Sample artists
export const mockArtists: Artist[] = [
  {
    id: 'a1',
    name: 'Viper!!',
    slug: 'viper',
    imageUrl: '/images/artists/viper.jpg',
    spotifyListeners: 123087
  },
  {
    id: 'a2',
    name: 'Blazers',
    slug: 'blazers',
    imageUrl: '/images/artists/blazers.jpg',
    spotifyListeners: 45200
  },
  {
    id: 'a3',
    name: 'Sheep boi',
    slug: 'sheep-boi',
    imageUrl: '/images/artists/sheep-boi.jpg',
    spotifyListeners: 28500
  },
  {
    id: 'a4',
    name: 'Front 242',
    slug: 'front-242',
    imageUrl: '/images/artists/front-242.jpg',
    spotifyListeners: 150000
  },
  // Add more as needed
]

// Events use dynamic dates relative to current month
// Helper: const now = new Date(); const year = now.getFullYear(); const month = now.getMonth();
// Previous month events: new Date(year, month - 1, day, hour, min) → status: 'past'
// Current month events: new Date(year, month, day, hour, min) → status: 'past' or 'upcoming'
// Next month events: new Date(year, month + 1, day, hour, min) → status: 'upcoming'
// See lib/data/mockEvents.ts for full implementation
```

---

## Styling Guidelines

### Tailwind Config Additions

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#F5F3EE',
        foreground: '#2C2C2C',
        accent: '#E8735B',
        muted: '#9E9E9E',
        border: '#D4D4D4',
        'card-bg': '#FFFFFF',
      },
      fontFamily: {
        serif: ['var(--font-serif)'],
        sans: ['var(--font-sans)'],
      },
    },
  },
  plugins: [],
}
export default config
```

### Custom CSS for react-big-calendar

```css
/* app/globals.css - Override react-big-calendar styles */

.rbc-calendar {
  font-family: var(--font-sans);
  background: var(--background);
}

.rbc-header {
  padding: 1rem 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--foreground);
  border-bottom: 1px solid var(--border);
}

.rbc-month-view {
  border: none;
  background: transparent;
}

.rbc-day-bg {
  background: var(--card-bg);
  border: 1px solid var(--border);
}

.rbc-off-range-bg {
  background: #FAFAFA;
}

.rbc-today {
  background-color: #FFF5F2;
}

.rbc-date-cell {
  padding: 0.5rem;
  text-align: left;
}

.rbc-date-cell > a {
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--foreground);
  text-decoration: none;
}

.rbc-today .rbc-date-cell > a {
  color: var(--accent);
  border: 2px solid var(--accent);
  border-radius: 50%;
  width: 3rem;
  height: 3rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.rbc-event {
  background: transparent;
  border: none;
  padding: 0.25rem;
  margin: 0.125rem 0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.rbc-event:hover {
  background-color: rgba(232, 115, 91, 0.1);
}

.rbc-event-label {
  display: none;
}

.rbc-event-content {
  color: var(--foreground);
}

.rbc-toolbar {
  display: none; /* We'll create custom toolbar */
}
```

---

## API Routes Structure

### Events API

```typescript
// app/api/events/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { mockEvents } from '@/lib/data/mockEvents'
import dayjs from 'dayjs'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const month = searchParams.get('month') // Format: YYYY-MM
  const genres = searchParams.get('genres')?.split(',').filter(Boolean) || []
  const venues = searchParams.get('venues')?.split(',').filter(Boolean) || []
  
  let filteredEvents = [...mockEvents]
  
  // Filter by month
  if (month) {
    const [year, monthNum] = month.split('-').map(Number)
    filteredEvents = filteredEvents.filter(event => {
      const eventDate = dayjs(event.startTime)
      return eventDate.year() === year && eventDate.month() === monthNum - 1
    })
  }
  
  // Filter by genres
  if (genres.length > 0) {
    filteredEvents = filteredEvents.filter(event =>
      event.genres.some(genre => genres.includes(genre.slug))
    )
  }
  
  // Filter by venues
  if (venues.length > 0) {
    filteredEvents = filteredEvents.filter(event =>
      venues.includes(event.venue.slug)
    )
  }
  
  return NextResponse.json(filteredEvents)
}
```

---

## Testing Strategy

### Key Test Cases

1. **Calendar Rendering**
   - Month view displays correct number of days
   - Events appear on correct dates
   - Swedish day/month names display correctly

2. **Filtering**
   - Genre filter updates event list
   - Venue filter updates event list
   - Combined filters work correctly
   - "All" option shows all events

3. **Navigation**
   - Month navigation updates calendar
   - View toggle switches between views
   - Event click opens detail modal

4. **Data**
   - API returns correct filtered events
   - Mock data matches schema
   - Date formatting is consistent

---

## Performance Considerations

### Optimization Checklist

- [ ] Use React.memo for event components
- [ ] Implement virtual scrolling for list view (100+ events)
- [ ] Lazy load event images
- [ ] Prefetch adjacent months
- [ ] Cache API responses with React Query
- [ ] Debounce filter changes
- [ ] Use proper indexes in Prisma schema
- [ ] Optimize database queries (use `include` strategically)
- [ ] Implement pagination for list view if needed

---

## Development Workflow

### Initial Setup Commands

```bash
# Create Next.js app
npx create-next-app@15 biljetter --typescript --tailwind --app --eslint --use-npm --import-alias "@/*"

# Install dependencies
cd concert-calendar
npm install react-big-calendar dayjs zustand @tanstack/react-query
npm install -D @types/react-big-calendar

# Install Prisma (for later)
npm install prisma @prisma/client
npm install -D prisma

# Install UI dependencies (optional)
npm install class-variance-authority clsx tailwind-merge
npm install lucide-react  # for icons
```

### Development Commands

```bash
# Run dev server
npm run dev

# Run Prisma studio (when database is set up)
npx prisma studio

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed database
npx prisma db seed
```

---

## Common Issues & Solutions

### react-big-calendar

**Issue**: Events not displaying
- Check that `startAccessor` and `endAccessor` match your data structure
- Ensure dates are proper Date objects, not strings

**Issue**: Swedish not showing
- Make sure Day.js locale is imported: `import 'dayjs/locale/sv'`
- Set locale before creating localizer: `dayjs.locale('sv')`

**Issue**: Styling not applying
- Import CSS: `import 'react-big-calendar/lib/css/react-big-calendar.css'`
- Check CSS specificity, may need `!important` or higher specificity

### Filtering

**Issue**: Filters not updating
- Verify Zustand store is properly connected
- Check that filter state is being read correctly
- Ensure API query includes filter parameters

---

## Future Enhancements

### Phase 7+
- [ ] User accounts and favorites
- [ ] Email notifications for new events
- [ ] Export to calendar (iCal)
- [ ] Social sharing
- [ ] Advanced search (by artist, date range)
- [ ] Event recommendations
- [ ] Mobile app (React Native)
- [ ] Admin panel for event management
- [ ] Ticket integration (checkout flow)
- [ ] Multiple cities support

---

## Resources & References

### Documentation
- [react-big-calendar](https://jquense.github.io/react-big-calendar/examples)
- [Day.js](https://day.js.org/docs/en/installation/installation)
- [Prisma](https://www.prisma.io/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [TanStack Query](https://tanstack.com/query/latest)

### Design Inspiration
- Reference screenshots (provided)
- [Resident Advisor](https://ra.co) - Event calendar design
- [Songkick](https://www.songkick.com) - Concert discovery

---

## Contact & Support

When working with Claude Code, provide:
1. Specific component you're working on
2. Error messages (full stack trace)
3. Relevant code snippets
4. What you've tried already

Example prompt:
"I'm building the FilterBar component and the genre dropdown isn't updating the Zustand store. Here's my code: [paste code]. The console shows: [paste error]. I've checked that the store is initialized correctly."

---

## Version History

- **v1.0** (Initial) - Project setup with mock data, calendar view
- **v1.1** (Planned) - Database integration, API routes
- **v1.2** (Planned) - Spotify integration, enhanced styling
- **v2.0** (Planned) - User features, production ready

---

**Last Updated**: February 2026
**Maintainer**: [Your Name]
**Status**: In Development - Phase 1
