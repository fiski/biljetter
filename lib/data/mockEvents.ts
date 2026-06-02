import { EventWithRelations, Venue, Artist, Genre } from '@/types'

// ── Venues ──────────────────────────────────────────────────────────────────

export const mockVenues: Venue[] = [
  {
    id: 'v1',
    name: 'Pustervik',
    slug: 'pustervik',
    address: 'Järntorget 12',
    city: 'Göteborg',
    capacity: 350,
    coordinates: { lat: 57.7002, lng: 11.9535 },
    websiteUrl: 'https://pustervik.nu',
  },
  {
    id: 'v2',
    name: 'Nefertiti',
    slug: 'nefertiti',
    address: 'Hvitfeldtsplatsen 6',
    city: 'Göteborg',
    capacity: 250,
    coordinates: { lat: 57.7045, lng: 11.968 },
    websiteUrl: 'https://nefertiti.se',
  },
  {
    id: 'v3',
    name: 'The Universe',
    slug: 'the-universe',
    address: 'Esperantoplatsen 3',
    city: 'Göteborg',
    capacity: 1200,
    coordinates: { lat: 57.701, lng: 11.965 },
  },
  {
    id: 'v4',
    name: 'Haga Lekplats',
    slug: 'haga-lekplats',
    address: 'Haga Nygata 13',
    city: 'Göteborg',
    capacity: 150,
    coordinates: { lat: 57.699, lng: 11.956 },
  },
  {
    id: 'v5',
    name: 'Farm',
    slug: 'farm',
    address: 'Kungsgatan 12',
    city: 'Göteborg',
    capacity: 200,
    coordinates: { lat: 57.704, lng: 11.973 },
  },
]

// ── Genres ───────────────────────────────────────────────────────────────────

export const mockGenres: Genre[] = [
  { id: 'g1',  name: 'Rock',       slug: 'rock',       color: '#E74C3C' },
  { id: 'g2',  name: 'Electronic', slug: 'electronic', color: '#3498DB' },
  { id: 'g3',  name: 'Jazz',       slug: 'jazz',       color: '#9B59B6' },
  { id: 'g4',  name: 'Indie',      slug: 'indie',      color: '#2ECC71' },
  { id: 'g5',  name: 'Folk',       slug: 'folk',       color: '#F39C12' },
  { id: 'g6',  name: 'Hip Hop',    slug: 'hip-hop',    color: '#95A5A6' },
  { id: 'g7',  name: 'Metal',      slug: 'metal',      color: '#8B0000' },
  { id: 'g8',  name: 'Soul',       slug: 'soul',       color: '#C0392B' },
  { id: 'g9',  name: 'Country',    slug: 'country',    color: '#D4AC0D' },
  { id: 'g10', name: 'Övrigt',     slug: 'ovrigt',     color: '#808080' },
]

// ── Helpers ────────────────────────────────────────────────────────────────

const IMGS = ['1', '2', '1-1', '1-2', '1-3', '1-4', '1-5']
const ts = new Date()

const [ROCK, ELECTRONIC, JAZZ, INDIE, FOLK, HIPHOP, METAL, SOUL, COUNTRY, MISC] = mockGenres

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[åä]/g, 'a')
    .replace(/[öø]/g, 'o')
    .replace(/é/g, 'e')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

interface EvOpts {
  free?: boolean
  price?: string
  cancelled?: boolean
  hour?: number
}

function ev(
  n: number,
  title: string,
  y: number, mo: number, day: number,
  g: Genre,
  opts: EvOpts = {}
): EventWithRelations {
  const hour = opts.hour ?? 20
  const start = new Date(y, mo - 1, day, hour, 0)
  const end   = new Date(y, mo - 1, day, hour + 3, 0)
  const dateSuffix = `${y}-${String(mo).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const slug = `${slugify(title)}-${dateSuffix}`
  const artist: Artist = {
    id: `a${n}`,
    name: title,
    slug: slugify(title),
    imageUrl: `/images/artists/${IMGS[n % IMGS.length]}.png`,
  }
  return {
    id: `e${n}`,
    title,
    slug,
    startTime: start,
    endTime: end,
    venueId: 'v1',
    venue: mockVenues[0],
    artistIds: [artist.id],
    artists: [artist],
    genreIds: [g.id],
    genres: [g],
    status: opts.cancelled ? 'cancelled' : 'upcoming',
    price: opts.free ? undefined : (opts.price ?? '200 kr'),
    createdAt: ts,
    updatedAt: ts,
  }
}

// ── Events ─────────────────────────────────────────────────────────────────

export const mockEvents: EventWithRelations[] = [
  // ─── Juni 2026 ────────────────────────────────────────────────────────────
  ev( 1, 'LA VERNISSAGE SAUVAGE: NEW BLOOD',                               2026,  6,  3, MISC,       { free: true }),
  ev( 2, 'Baxter Dury + Agent Blå',                                         2026,  6,  3, INDIE),
  ev( 3, 'Martin Kerr - nytt datum',                                        2026,  6,  4, FOLK),
  ev( 4, 'Ben Howard',                                                       2026,  6,  5, FOLK,       { price: '320 kr' }),
  ev( 5, 'Nils Albin',                                                       2026,  6,  6, FOLK),
  ev( 6, 'Hannah Juanita & the Hardliners + Support: Folks',                2026,  6,  6, COUNTRY),
  ev( 7, 'Inställt - Elio Mei',                                              2026,  6,  7, INDIE,      { cancelled: true }),
  ev( 8, 'Quiz - Mittwoch',                                                  2026,  6, 10, MISC,       { free: true, hour: 19 }),
  ev( 9, 'Brooklyn Live - Oedipa Star',                                      2026,  6, 11, INDIE,      { free: true }),
  ev(10, 'NOT YOUR HABIBI: SWANA Queer Festival',                           2026,  6, 12, MISC,       { price: '150 kr' }),
  ev(11, 'West Pride • After Party',                                         2026,  6, 13, ELECTRONIC, { price: '180 kr' }),
  ev(12, 'Inställt - Kassi Valazza',                                         2026,  6, 15, COUNTRY,    { cancelled: true }),
  ev(13, 'Pitch-A-Friend',                                                   2026,  6, 16, MISC,       { price: '150 kr' }),
  ev(14, 'Quiz med Nisse',                                                   2026,  6, 17, MISC,       { free: true, hour: 19 }),
  ev(15, 'Curtis Harding',                                                   2026,  6, 18, SOUL,       { price: '280 kr' }),
  ev(16, 'Carla Thomas & The Brunnsvik Sounds – An Evening with Memphis Soul Music', 2026, 6, 30, SOUL, { price: '250 kr' }),

  // ─── Juli 2026 ────────────────────────────────────────────────────────────
  ev(17, 'Joshua Ray Walker',                                                2026,  7, 18, COUNTRY),

  // ─── Augusti 2026 ────────────────────────────────────────────────────────
  ev(18, 'Testament + Metal Church + Armored Saint',                        2026,  8,  1, METAL,      { price: '350 kr' }),
  ev(19, 'Thy Art Is Murder + Ghost Iris',                                   2026,  8,  9, METAL,      { price: '280 kr' }),
  ev(20, 'The Ghost Inside',                                                 2026,  8, 11, METAL,      { price: '280 kr' }),
  ev(21, 'Jeffrey Silverstein + Bobby Lee',                                  2026,  8, 20, FOLK),
  ev(22, 'Ryan Davis & The Roadhouse Band',                                  2026,  8, 25, ROCK),
  ev(23, 'Toody Cole and her band + Jenny Don´t & The Spurs',               2026,  8, 27, COUNTRY),
  ev(24, 'Atomic Swing + Popsicle',                                          2026,  8, 28, ROCK,       { price: '220 kr' }),

  // ─── September 2026 ───────────────────────────────────────────────────────
  ev(25, 'Wilmer X',                                                         2026,  9,  3, ROCK,       { price: '220 kr' }),
  ev(26, 'Silvana Imam • Naturkraft 10 år',                                  2026,  9,  4, HIPHOP,     { price: '350 kr' }),
  ev(27, 'Dingo',                                                            2026,  9,  5, ROCK),
  ev(28, 'Devin Townsend',                                                   2026,  9,  9, METAL,      { price: '350 kr' }),
  ev(29, 'The Jayhawks - 40 Years',                                          2026,  9, 10, COUNTRY,    { price: '280 kr' }),
  ev(30, 'Maustetytöt',                                                      2026,  9, 11, INDIE),
  ev(31, 'BIJI',                                                             2026,  9, 12, INDIE),
  ev(32, 'Inställt - Lucinda Williams',                                       2026,  9, 16, COUNTRY,    { cancelled: true }),
  ev(33, 'The Plan',                                                         2026,  9, 18, ROCK),
  ev(34, 'Blurry Baby + Linn Levine',                                        2026,  9, 18, INDIE),
  ev(35, 'Jelly Crystal + Support',                                          2026,  9, 19, INDIE),
  ev(36, 'DICE',                                                             2026,  9, 19, ROCK),
  ev(37, 'The Undertones + Ruts DC',                                         2026,  9, 22, ROCK,       { price: '250 kr' }),
  ev(38, 'Dan Berglund',                                                     2026,  9, 24, JAZZ,       { price: '220 kr' }),
  ev(39, 'Foy Vance - The Wake World Tour',                                  2026,  9, 25, FOLK,       { price: '280 kr' }),
  ev(40, 'Donny Benét',                                                      2026,  9, 26, ELECTRONIC, { price: '220 kr' }),
  ev(41, 'Myrath',                                                           2026,  9, 30, METAL,      { price: '280 kr' }),

  // ─── Oktober 2026 ────────────────────────────────────────────────────────
  ev(42, 'Future Palace',                                                    2026, 10,  4, METAL),
  ev(43, 'Sean Koch',                                                        2026, 10,  5, FOLK),
  ev(44, 'Dexys Midnight Runners',                                           2026, 10,  6, SOUL,       { price: '320 kr' }),
  ev(45, 'Another Festival',                                                 2026, 10,  9, ROCK,       { price: '250 kr' }),
  ev(46, 'Another Festival',                                                 2026, 10, 10, ROCK,       { price: '250 kr' }),
  ev(47, 'The Delines',                                                      2026, 10, 12, COUNTRY),
  ev(48, 'Luke Elliot',                                                      2026, 10, 16, FOLK),
  ev(49, 'Grave + Disarray + Imperishable',                                  2026, 10, 17, METAL),
  ev(50, 'lovad',                                                            2026, 10, 17, INDIE),
  ev(51, 'Dreamdnvr',                                                        2026, 10, 21, INDIE),
  ev(52, 'Icona Pop',                                                        2026, 10, 23, ELECTRONIC, { price: '320 kr' }),
  ev(53, 'Ulrika Spacek',                                                    2026, 10, 23, INDIE),
  ev(54, 'Division 7 + Support',                                             2026, 10, 24, ROCK),
  ev(55, 'Embla and The Karidotters',                                        2026, 10, 24, FOLK),
  ev(56, 'Andrew Strong - The Commitments 35th Anniversary',                 2026, 10, 27, SOUL,       { price: '280 kr' }),
  ev(57, 'Rymdpojken',                                                       2026, 10, 30, ELECTRONIC),
  ev(58, 'Jeremy Pinnell',                                                   2026, 10, 30, COUNTRY),
  ev(59, 'Gloryhammer + Majestica + Arion',                                  2026, 10, 31, METAL,      { price: '280 kr' }),

  // ─── November 2026 ───────────────────────────────────────────────────────
  ev(60, 'Eagles of Death Metal',                                            2026, 11,  7, ROCK,       { price: '350 kr' }),
  ev(61, 'Mammoth + Florence Black',                                         2026, 11, 10, ROCK),
  ev(62, 'Merit Hemmingson',                                                 2026, 11, 12, JAZZ),
  ev(63, 'The Dahmers + Spiders',                                            2026, 11, 13, ROCK),
  ev(64, 'Kristofer Åström • Northern Blues 2026',                           2026, 11, 14, FOLK),
  ev(65, 'Hardcore Superstar',                                               2026, 11, 19, ROCK,       { price: '280 kr' }),
  ev(66, 'Gasbox',                                                           2026, 11, 20, ROCK),
  ev(67, 'Maggie Reilly + Special Guest: Cutting Crew',                      2026, 11, 25, ROCK,       { price: '250 kr' }),
  ev(68, 'David Eugene Edwards',                                             2026, 11, 26, FOLK),

  // ─── December 2026 ───────────────────────────────────────────────────────
  ev(69, 'Widowspeak',                                                       2026, 12,  4, INDIE),
  ev(70, 'Jake Xerxes Fussell',                                              2026, 12,  5, FOLK),
  ev(71, 'Thorbjørn Risager & The Black Tornado',                            2026, 12, 12, ROCK,       { price: '250 kr' }),
  ev(72, 'Pretty Maids',                                                     2026, 12, 17, METAL,      { price: '280 kr' }),

  // ─── Februari 2027 ───────────────────────────────────────────────────────
  ev(73, 'Hannes Aitman',                                                    2027,  2,  5, FOLK),
  ev(74, 'Young Gun Silver Fox',                                             2027,  2,  7, SOUL),
  ev(75, 'U.D.O.',                                                           2027,  2, 17, METAL,      { price: '280 kr' }),
  ev(76, 'Bernth',                                                           2027,  2, 20, METAL),

  // ─── Mars 2027 ───────────────────────────────────────────────────────────
  ev(77, 'Trentemøller',                                                     2027,  3, 18, ELECTRONIC, { price: '280 kr' }),
  ev(78, 'Eivør',                                                            2027,  3, 27, FOLK,       { price: '250 kr' }),
  ev(79, 'KMFDM - nytt datum',                                               2027,  3, 29, ELECTRONIC, { price: '280 kr' }),
]

export const mockArtists: Artist[] = mockEvents
  .flatMap(e => e.artists)
  .filter((a, i, arr) => arr.findIndex(x => x.id === a.id) === i)

// ── Helper functions ────────────────────────────────────────────────────────

export function getEventsByMonth(yearNum: number, monthNum: number): EventWithRelations[] {
  return mockEvents.filter((event) => {
    const start = new Date(event.startTime)
    return start.getFullYear() === yearNum && start.getMonth() === monthNum - 1
  })
}

export function getEventBySlug(eventSlug: string): EventWithRelations | undefined {
  return mockEvents.find((event) => event.slug === eventSlug)
}

export function getAllVenues(): Venue[] {
  return mockVenues
}

export function getAllGenres(): Genre[] {
  return mockGenres
}
