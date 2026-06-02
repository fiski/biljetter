# Concert Calendar Project - Claude Code Reference

## Project Overview

A Swedish concert/event calendar application with a clean, editorial design. Users can browse concerts by month, filter by genre and venue, and view detailed event information. The calendar displays events in multiple views (month grid, list, masonry) with integrated Spotify data.

**Target Audience**: Swedish music fans looking for concerts in their city (Göteborg focus)
**Primary Language**: Swedish (UI text)
**Reference Design**: Figma file — `https://www.figma.com/design/S5ujSdxVC8FsKgtXnkefKl/Biljetter` (in progress — Figma MCP requires the Figma desktop app to be open; keep it running when working with Claude Code)

---

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Calendar**: Custom-built `CalendarGrid.tsx` (react-big-calendar is installed but not used)
- **Date Library**: Day.js ^1.11.0
- **Styling**: Tailwind CSS v4 — no `tailwind.config.ts`; custom tokens via CSS variables in `globals.css`
- **Fonts**: Cinzel, Cormorant, IBM Plex Mono, Inter, Montserrat, Spectral, Crimson Text (all via Google Fonts in `layout.tsx`)
- **State Management**:
  - Zustand v5 — installed, not yet wired (store stub at `lib/stores/`)
  - TanStack Query v5 — installed, not yet wired (hook stub at `lib/hooks/`)
- **Icons**: lucide-react

### Backend
- **API**: Next.js API Routes
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Validation**: Zod schemas (planned)

### Integrations
- **Spotify Web API**: Artist images, follower counts, profile data (planned — see Spotify section)
- **Mapbox** (future): Venue map embeds

---

## Project Structure

```
biljetter/
├── app/
│   ├── api/
│   │   ├── events/route.ts          # GET /api/events (month, genre, venue filters)
│   │   └── venues/route.ts          # GET /api/venues
│   ├── event/[slug]/page.tsx        # Event detail page (SSR)
│   ├── layout.tsx                   # Root layout, Google Fonts import
│   ├── globals.css                  # CSS custom properties + Tailwind v4 base
│   └── page.tsx                     # Home/calendar page
├── components/
│   ├── calendar/
│   │   ├── CalendarGrid.tsx         # Month grid (7-col, custom built)
│   │   ├── DayListPanel.tsx         # Left sidebar: events grouped by day
│   │   ├── EventDrawer.tsx          # Slide-in event detail panel
│   │   ├── ListView.tsx             # List view grouped by date
│   │   ├── MasonryView.tsx          # 3-column masonry/grid view
│   │   └── MonthHeader.tsx          # Month/year title + prev/next arrows
│   ├── filters/
│   │   └── FilterBar.tsx            # Genre + Venue dropdowns (UI only — no logic yet)
│   ├── layout/
│   │   └── ViewToggle.tsx           # Calendar/List/Grid toggle
│   └── CalendarWrapper.tsx          # Top-level state container for views + events
├── lib/
│   ├── data/
│   │   └── mockEvents.ts            # 25 mock events with dynamic current-month dates
│   ├── hooks/                       # (stub) useEvents.ts, useFilters.ts — not yet created
│   ├── stores/                      # (stub) filterStore.ts — not yet created
│   └── utils/
│       └── cn.ts                    # classnames helper
├── prisma/                          # (not yet created) schema.prisma, seed.ts
├── public/
│   └── images/artists/              # Artist image PNGs
├── types/
│   └── index.ts                     # TypeScript interfaces (Event, Venue, Artist, Genre, etc.)
├── figma-components.js              # Unused script (can be deleted)
└── figma-design-system.js           # Unused script (can be deleted)
```

---

## Implementation Status

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Setup & mock data | ✅ Complete |
| 2 | Calendar views (grid, list, masonry) | ✅ Complete |
| 3 | Filtering (genre, venue, month nav) | ⚠️ UI exists — logic not wired |
| 4 | List & detail views | ✅ Complete |
| 4b | Frontend UI overhaul (Figma alignment) | 🔲 Next priority |
| 5 | Database integration (Prisma + PostgreSQL) | 🔲 Not started |
| 5b | Data pipeline (scraper — separate repo) | 🔲 Not started |
| 6 | Spotify API enrichment | 🔲 Not started |
| 7 | Search, loading states, mobile polish | 🔲 Not started |

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

interface EventWithRelations extends Event {
  venue: Venue
  artists: Artist[]
  genres: Genre[]
}

interface Venue {
  id: string
  name: string
  slug: string
  address: string
  city: string
  capacity?: number
  lat?: number
  lng?: number
  websiteUrl?: string
}

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

interface Genre {
  id: string
  name: string
  slug: string
  color?: string
}

interface FilterState {
  selectedGenres: string[]
  selectedVenues: string[]
  dateRange: { start: Date; end: Date }
  viewMode: 'month' | 'list' | 'grid'
  searchQuery?: string
}
```

### Prisma Schema (planned — not yet created)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Event {
  id          String      @id @default(cuid())
  title       String
  slug        String      @unique
  description String?     @db.Text
  startTime   DateTime
  endTime     DateTime
  status      EventStatus @default(UPCOMING)

  venue    Venue  @relation(fields: [venueId], references: [id])
  venueId  String

  artists EventArtist[]
  genres  EventGenre[]

  ticketUrl        String?
  imageUrl         String?
  spotifyListeners Int?
  price            String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([startTime])
  @@index([venueId])
  @@index([status])
}

model Venue {
  id         String  @id @default(cuid())
  name       String
  slug       String  @unique
  address    String
  city       String
  capacity   Int?
  lat        Float?
  lng        Float?
  websiteUrl String?

  events Event[]

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

  events EventArtist[]
}

model Genre {
  id     String @id @default(cuid())
  name   String
  slug   String @unique
  color  String?

  events EventGenre[]
}

model EventArtist {
  event    Event  @relation(fields: [eventId], references: [id], onDelete: Cascade)
  eventId  String
  artist   Artist @relation(fields: [artistId], references: [id], onDelete: Cascade)
  artistId String
  order    Int    @default(0)

  @@id([eventId, artistId])
  @@index([artistId])
}

model EventGenre {
  event   Event  @relation(fields: [eventId], references: [id], onDelete: Cascade)
  eventId String
  genre   Genre  @relation(fields: [genreId], references: [id], onDelete: Cascade)
  genreId String

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

## Design System

### Color Tokens (defined in `globals.css`)

```css
--background: #F5F3EE;   /* Warm off-white — page background */
--foreground: #2C2C2C;   /* Dark gray — primary text */
--accent: #E8735B;       /* Coral/salmon — CTAs, today highlight, active states */
--muted: #9E9E9E;        /* Gray — secondary text, metadata */
--border: #D4D4D4;       /* Light gray — cell borders, dividers */
--card-bg: #FFFFFF;      /* White — card and cell backgrounds */
```

### Typography

| Use | Font | Weight | Size |
|-----|------|--------|------|
| Month/year header | Cinzel or Cormorant | 300–400 | 48–64px |
| Day numbers | Cormorant or Spectral | 400 | 32–40px |
| Section headers | Montserrat | 600 | 14px, uppercase |
| Event title | Inter or Crimson Text | 600 | 14–16px |
| Event metadata | Inter | 400 | 12–13px |
| Mono/data | IBM Plex Mono | 400 | 12px |

### Swedish UI Strings

```typescript
const days = ['MÅN', 'TIS', 'ONS', 'TOR', 'FRE', 'LÖR', 'SÖN']

const months = [
  'JANUARI', 'FEBRUARI', 'MARS', 'APRIL', 'MAJ', 'JUNI',
  'JULI', 'AUGUSTI', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DECEMBER'
]

const labels = {
  genre: 'Genre',
  allGenres: 'All musik',
  venue: 'Plats',
  allVenues: 'Alla platser',
  tickets: 'Biljetter',
  listenOnSpotify: 'Lyssna med Spotify',
  listeners: 'Lyssnare per månad',
  noEvents: 'Inga konserter',
}
```

---

## Frontend UI — Figma Alignment Checklist

The UI is functionally complete but needs visual polish to match the Figma design. Work through these in order:

### 1. Calendar Grid (`CalendarGrid.tsx`)
- [ ] Day header row: `MÅN TIS ONS TOR FRE LÖR SÖN` in Montserrat 600, 12px uppercase
- [ ] Day number: 32–40px, serif, left-aligned in cell
- [ ] Today: coral border circle around number (not filled background)
- [ ] Events in cell: title bold → venue lighter → time smallest; truncate with ellipsis
- [ ] Off-month days: visually desaturated (lower opacity text, slightly different bg)
- [ ] Cell borders: 1px `#D4D4D4`, no outer border on the grid itself
- [ ] No event background color — events sit as plain text rows

### 2. List View (`ListView.tsx`)
- [ ] Date group header: full Swedish label — "Torsdag 11 juni" — Cinzel or Cormorant, large
- [ ] Event card: square artist image (120×120px) left, details right
- [ ] Details: artist name large, venue + time smaller, listener count with Spotify icon
- [ ] "Biljetter" button: coral background, white text, full width on mobile
- [ ] "Lyssna med Spotify" as secondary text link below the button

### 3. Event Drawer (`EventDrawer.tsx`)
- [ ] Full-bleed artist image at top (or right column on desktop)
- [ ] Drop cap on first letter of description (already partially done — audit)
- [ ] Listener count: Spotify green icon + number formatted (e.g. "123 087 lyssnare per månad")
- [ ] Time + venue block: clearly grouped, icon-prefixed
- [ ] Map area: styled placeholder with venue name, not just an empty div
- [ ] "Biljetter" CTA: large coral button, sticky on mobile

### 4. Month Header (`MonthHeader.tsx`)
- [ ] Prev/next arrows must call `onNavigate` prop correctly — currently non-functional
- [ ] Month name in large serif, year lighter/smaller to the right
- [ ] Active view indicator aligned with ViewToggle

### 5. Filter Bar (`FilterBar.tsx`)
- [ ] Wire genre dropdown → Zustand store → filter events
- [ ] Wire venue dropdown → Zustand store → filter events
- [ ] "Återställ" (reset) button clears both filters
- [ ] Dropdown style: minimal, no heavy border, matches overall aesthetic

### 6. Interactions & State
- [ ] Month navigation state lives in `CalendarWrapper`, passed down via props
- [ ] Filter state: create `lib/stores/filterStore.ts` (Zustand) — see planned example below
- [ ] Event data fetching: create `lib/hooks/useEvents.ts` (TanStack Query) — see planned example below
- [ ] View transitions: smooth CSS transition when switching Calendar/List/Grid
- [ ] Drawer open/close: slide-in from right on desktop, bottom sheet on mobile

### 7. Mobile
- [ ] Calendar grid: scrolls horizontally below ~600px, or collapses to list view
- [ ] Drawer: full-screen bottom sheet with drag handle
- [ ] Filter bar: collapses behind a "Filter" button on mobile

---

## Data Pipeline Architecture

Real event data comes from a **separate scraper project**, not this repo.

```
[Scraper — separate repo]
  ↓  Crawls Göteborg venue websites on a schedule
  ↓  Normalises to the Prisma schema below
  ↓  Writes to shared PostgreSQL DB
  ↓
[Shared PostgreSQL database]  ←→  [This app, via Prisma + DATABASE_URL]
                                    ↓
                               Next.js API routes → Frontend
```

**Göteborg venues to scrape**: Pustervik, Nefertiti, Trädgårn, Sticky Fingers, Röda Sten, Haga Lekplats, Farm, Musikens Hus, Way Out West (festival)

**Rules for this repo**:
- Zero scraping code lives here
- This app is read-only against the DB
- The Prisma schema in this repo is the **contract** between scraper and frontend — both sides must agree on it before the scraper is built
- `DATABASE_URL` env var connects to the shared DB

---

## Spotify API Integration

### What to fetch

| Field | Spotify endpoint | Notes |
|-------|-----------------|-------|
| `spotifyId` | `GET /search?type=artist&q={name}` | Match by artist name at seed time |
| `imageUrl` | `GET /artists/{id}` → `images[0].url` | Use largest image |
| `spotifyListeners` | Not in public API | Use `followers.total` as proxy; display as "följare" not "lyssnare per månad" unless a better source is found |
| `spotifyUrl` | `GET /artists/{id}` → `external_urls.spotify` | |
| `genres[]` | `GET /artists/{id}` → `genres[]` | Can seed Genre table from this |

**Artist bio**: Not available from Spotify. Options: Wikipedia API (`/api/rest_v1/page/summary/{artist_name}`), manual entry, or skip bio for MVP.

### Implementation approach

- Auth: **Client Credentials flow** (no user login needed)
- Enrichment runs at **seed time** and on a **nightly sync job** — never per-request
- Code lives in `lib/spotify.ts`:
  ```typescript
  // lib/spotify.ts
  export async function getSpotifyToken(): Promise<string>
  export async function searchArtist(name: string): Promise<SpotifyArtist | null>
  export async function getArtist(spotifyId: string): Promise<SpotifyArtist>
  ```
- Rate limit: 100 requests / 30s — well within seed limits
- Env vars needed: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`

---

## Planned Code (Not Yet Implemented)

These patterns are the intended architecture. Create these files when wiring up Phase 3.

### Filter Store (`lib/stores/filterStore.ts`)

```typescript
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
      resetFilters: () => set({ selectedGenres: [], selectedVenues: [] }),
    }),
    { name: 'concert-calendar-filters' }
  )
)
```

### Event Fetching Hook (`lib/hooks/useEvents.ts`)

```typescript
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
        ...(venues.length && { venues: venues.join(',') }),
      })
      const res = await fetch(`/api/events?${params}`)
      if (!res.ok) throw new Error('Failed to fetch events')
      return res.json() as Promise<EventWithRelations[]>
    },
    staleTime: 5 * 60 * 1000,
  })
}
```

---

## Styling — Tailwind v4 Approach

This project uses **Tailwind CSS v4**. There is no `tailwind.config.ts`. All custom tokens are defined as CSS custom properties in `globals.css` and referenced in components.

```css
/* globals.css */
@import "tailwindcss";

:root {
  --background: #F5F3EE;
  --foreground: #2C2C2C;
  --accent: #E8735B;
  --muted: #9E9E9E;
  --border: #D4D4D4;
  --card-bg: #FFFFFF;
}
```

Use these in components with `style={{ background: 'var(--background)' }}` or via `@apply` in CSS modules if needed. Tailwind utility classes work as normal — custom tokens are composable with them.

---

## API Routes

### Events (`app/api/events/route.ts`)

```typescript
// GET /api/events?month=YYYY-MM&genres=rock,jazz&venues=pustervik
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const month = searchParams.get('month')
  const genres = searchParams.get('genres')?.split(',').filter(Boolean) || []
  const venues = searchParams.get('venues')?.split(',').filter(Boolean) || []

  // Currently: filter mockEvents
  // Phase 5: replace with Prisma query
}
```

---

## Mock Data

`lib/data/mockEvents.ts` has 25 events with dynamic dates:

```typescript
const now = new Date()
const year = now.getFullYear()
const month = now.getMonth()

// Previous month → status: 'past'
new Date(year, month - 1, day, hour, min)

// Current month (past date) → status: 'past'
// Current month (future date) → status: 'upcoming'
new Date(year, month, day, hour, min)

// Next month → status: 'upcoming'
new Date(year, month + 1, day, hour, min)
```

---

## Development Commands

```bash
npm run dev          # Dev server at localhost:3000

# Once Prisma is set up:
npx prisma generate  # Regenerate client after schema changes
npx prisma migrate dev --name <name>  # Create and apply migration
npx prisma db seed   # Seed with real or Spotify-enriched data
npx prisma studio    # DB browser at localhost:5555
```

---

## Performance Checklist

- [ ] React.memo on CalendarGrid event rows
- [ ] Virtual scrolling in ListView (100+ events)
- [ ] Lazy-load artist images
- [ ] Prefetch adjacent months with TanStack Query
- [ ] Debounce filter changes (200ms)
- [ ] DB indexes already in Prisma schema (startTime, venueId, status)

---

## Future Enhancements

- [ ] User accounts + saved events
- [ ] iCal export
- [ ] Social sharing
- [ ] Full-text search (by artist, venue, date range)
- [ ] Event recommendations
- [ ] Admin panel for event management
- [ ] Multiple cities
- [ ] Ticket checkout integration

---

## Resources

- [Day.js docs](https://day.js.org/docs/en/installation/installation)
- [Prisma docs](https://www.prisma.io/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [TanStack Query](https://tanstack.com/query/latest)
- [Spotify Web API](https://developer.spotify.com/documentation/web-api)
- [Wikipedia REST API](https://en.wikipedia.org/api/rest_v1/)

---

**Last Updated**: June 2026
**Status**: Phase 4b — Frontend UI overhaul in progress
