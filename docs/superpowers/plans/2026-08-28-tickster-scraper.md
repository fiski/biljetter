# Tickster Scraper Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone `biljetter-scraper` repo that crawls Tickster's Göteborg listings and emits a committed `lib/data/events.json` of real concerts for the Biljetter web app.

**Architecture:** Four decoupled stages — `fetch → parse → normalize → emit`. `fetch` handles polite HTTP with an on-disk cache; `parse` turns HTML into flat `RawEvent` records with no interpretation; `normalize` applies all judgement (venue aliasing, genre mapping, artist dedup); `emit` writes one JSON file. The stage boundary exists so that when the Tickster API key is approved, `fetch`/`parse` are swapped for a dump reader and `normalize`/`emit` carry over unchanged.

**Tech Stack:** Node 24, TypeScript, `cheerio` (HTML parsing), `vitest` (tests), `tsx` (running TS directly). npm as package manager, matching `biljetter`.

**Spec:** `docs/superpowers/specs/2026-08-28-tickster-scraper-design.md` (in the `biljetter` repo)

## Global Constraints

- **Repo location:** `C:\Users\maxim\Documents\Github\biljetter-scraper` — a sibling of `biljetter`, never nested inside it.
- **Crawl delay:** minimum 2000ms between every HTTP request to `tickster.com`. Non-negotiable — `robots.txt` specifies `Crawl-delay: 2` and we are about to request API access from this company.
- **User-Agent:** identify the crawler honestly, including a contact address.
- **No scraping code in `biljetter`.** The only change to that repo is a JSON loader (Task 10).
- **Commit attribution:** Claude is not an author. Never add `Co-Authored-By: Claude` or any similar line to commit messages in either repo.
- **Zero network access in unit tests.** All parser tests run against committed HTML fixtures.
- **Output venues:** Pustervik, Nefertiti, Trädgår'n, Musikens Hus. Everything else is filtered out but counted.
- **Genre slugs** must be exactly the ten already in `biljetter/lib/data/mockEvents.ts`: `rock`, `electronic`, `jazz`, `indie`, `folk`, `hip-hop`, `metal`, `soul`, `country`, `ovrigt`.

---

### Task 1: Repo scaffold, shared types, and slugify

Sets up the project and lands the one pure utility every later stage depends on. `slugify` must match `biljetter`'s character-for-character so event URLs stay stable when the app switches from mock data to real data.

**Files:**
- Create: `biljetter-scraper/package.json`
- Create: `biljetter-scraper/tsconfig.json`
- Create: `biljetter-scraper/vitest.config.ts`
- Create: `biljetter-scraper/.gitignore`
- Create: `biljetter-scraper/CLAUDE.md`
- Create: `biljetter-scraper/src/types.ts`
- Create: `biljetter-scraper/src/normalize/slugify.ts`
- Test: `biljetter-scraper/src/normalize/slugify.test.ts`

**Interfaces:**
- Consumes: nothing (first task)
- Produces: `slugify(s: string): string`; the types `EventRef`, `RawEvent`, `OutputVenue`, `OutputArtist`, `OutputGenre`, `OutputEvent`, `EventsFile`, `NormalizeReport`

- [ ] **Step 1: Create the repo and install dependencies**

```bash
mkdir -p /c/Users/maxim/Documents/Github/biljetter-scraper
cd /c/Users/maxim/Documents/Github/biljetter-scraper
git init
npm init -y
npm install cheerio
npm install -D typescript tsx vitest @types/node
```

- [ ] **Step 2: Write the config files**

`package.json` — replace the generated `scripts` block and add `"type": "module"`:

```json
{
  "name": "biljetter-scraper",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "scrape": "tsx src/main.ts",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "types": ["node"],
    "noEmit": true
  },
  "include": ["src/**/*.ts"]
}
```

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
})
```

`.gitignore`:

```
node_modules/
.cache/
*.log
```

`CLAUDE.md`:

```markdown
# biljetter-scraper

Crawls Tickster for Göteborg concerts and emits `events.json` for the `biljetter`
web app. See `../biljetter/docs/superpowers/specs/2026-08-28-tickster-scraper-design.md`.

## Rules

- Minimum 2000ms between requests to tickster.com (`robots.txt` says `Crawl-delay: 2`).
- Unit tests never hit the network. Parsers are tested against fixtures in `src/parse/fixtures/`.
- Claude is not an author of commits in this repo. Do not add `Co-Authored-By: Claude`.
```

- [ ] **Step 3: Write the failing test for slugify**

`src/normalize/slugify.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { slugify } from './slugify.js'

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Atomic Swing')).toBe('atomic-swing')
  })

  it('folds Swedish characters the same way biljetter does', () => {
    expect(slugify('Trädgår\u0027n')).toBe('tradgarn')
    expect(slugify('Åsa Öberg')).toBe('asa-oberg')
  })

  it('strips punctuation and collapses separators', () => {
    expect(slugify('Atomic Swing + Popsicle')).toBe('atomic-swing-popsicle')
    expect(slugify('Silvana Imam • Naturkraft 10 år')).toBe('silvana-imam-naturkraft-10-ar')
  })

  it('trims leading and trailing hyphens', () => {
    expect(slugify('  - Dingo -  ')).toBe('dingo')
  })
})
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `./slugify.js`

- [ ] **Step 5: Implement slugify**

`src/normalize/slugify.ts` — copied verbatim from `biljetter/lib/data/mockEvents.ts` so the two never diverge:

```ts
export function slugify(s: string): string {
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
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm test`
Expected: PASS, 4 tests

- [ ] **Step 7: Write the shared types**

`src/types.ts`:

```ts
/** One event as seen on a listing page, before its detail page is fetched. */
export interface EventRef {
  code: string
  detailPath: string
  date: string
  title: string
  venueLabel: string
  city: string
  imageUrl?: string
  ticketUrl?: string
}

/** One event after its detail page is parsed. Strings exactly as they appear. */
export interface RawEvent {
  code: string
  title: string
  date: string
  startTime?: string
  venueLabel: string
  city: string
  organizer?: string
  artistNames: string[]
  genreTags: string[]
  ageLimit?: string
  description?: string
  imageUrl?: string
  ticketUrl: string
}

export interface OutputVenue {
  id: string
  name: string
  slug: string
  address: string
  city: string
  capacity?: number
  coordinates?: { lat: number; lng: number }
  websiteUrl?: string
}

export interface OutputArtist {
  id: string
  name: string
  slug: string
  imageUrl?: string
}

export interface OutputGenre {
  id: string
  name: string
  slug: string
  color?: string
}

export interface OutputEvent {
  id: string
  title: string
  slug: string
  description?: string
  startTime: string
  endTime: string
  venueId: string
  venue: OutputVenue
  artistIds: string[]
  artists: OutputArtist[]
  genreIds: string[]
  genres: OutputGenre[]
  status: 'upcoming' | 'past'
  ticketUrl?: string
  imageUrl?: string
  price?: string
  createdAt: string
  updatedAt: string
}

export interface EventsFile {
  generatedAt: string
  source: 'tickster'
  events: OutputEvent[]
}

export interface NormalizeReport {
  seen: number
  emitted: number
  droppedByVenue: number
  droppedAsNonMusic: number
  unmatchedVenues: Record<string, number>
  unmappedGenreTags: Record<string, number>
}
```

- [ ] **Step 8: Verify it typechecks**

Run: `npx tsc --noEmit`
Expected: no output, exit 0

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "Scaffold scraper repo with shared types and slugify"
```

---

### Task 2: Listing page parser

Turns one Göteborg listing page into `EventRef[]`. Pure function over an HTML string.

**Files:**
- Create: `biljetter-scraper/src/parse/listing.ts`
- Create: `biljetter-scraper/src/parse/fixtures/listing-goteborg.html`
- Test: `biljetter-scraper/src/parse/listing.test.ts`

**Interfaces:**
- Consumes: `EventRef` from `src/types.ts`
- Produces: `parseListing(html: string): EventRef[]`

- [ ] **Step 1: Capture the fixture**

Run from the repo root. The `sleep` honours the crawl delay even for a single fetch, so the habit is never broken:

```bash
mkdir -p src/parse/fixtures
sleep 2
curl -s -A "BiljetterBot/0.1 (+maximilian.wide@ambitiongrp.com)" \
  "https://www.tickster.com/se/sv/events/in/g%C3%B6teborg?skip=0&take=16" \
  -o src/parse/fixtures/listing-goteborg.html
grep -c 'c-tile__title' src/parse/fixtures/listing-goteborg.html
```

Expected: a count of at least 10. If it is 0, the markup has changed and the selectors below must be re-derived before continuing.

- [ ] **Step 2: Write the failing test**

`src/parse/listing.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseListing } from './listing.js'

const html = readFileSync(
  join(import.meta.dirname, 'fixtures/listing-goteborg.html'),
  'utf8'
)

describe('parseListing', () => {
  const refs = parseListing(html)

  it('finds every event tile on the page', () => {
    expect(refs.length).toBeGreaterThanOrEqual(10)
  })

  it('extracts the event code from data-requestcode', () => {
    expect(refs[0].code).toMatch(/^[A-Z0-9]{15}$/)
  })

  it('extracts the date from the detail URL rather than parsing Swedish text', () => {
    for (const ref of refs) {
      expect(ref.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('trims the whitespace-padded title', () => {
    for (const ref of refs) {
      expect(ref.title).toBe(ref.title.trim())
      expect(ref.title.length).toBeGreaterThan(0)
    }
  })

  it('splits the label into venue and city', () => {
    const withCity = refs.filter((r) => r.city === 'Göteborg')
    expect(withCity.length).toBeGreaterThan(0)
    expect(withCity[0].venueLabel.length).toBeGreaterThan(0)
  })

  it('builds an absolute ticket URL', () => {
    const withTicket = refs.filter((r) => r.ticketUrl)
    expect(withTicket.length).toBeGreaterThan(0)
    expect(withTicket[0].ticketUrl).toMatch(/^https:\/\/secure\.tickster\.com\//)
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -- listing`
Expected: FAIL — cannot resolve `./listing.js`

- [ ] **Step 4: Implement the parser**

`src/parse/listing.ts`:

```ts
import * as cheerio from 'cheerio'
import type { EventRef } from '../types.js'

const DETAIL_PATH = /^\/[a-z]{2}\/[a-z]{2}\/events\/([a-z0-9]+)\/(\d{4}-\d{2}-\d{2})\//

/**
 * Parses one Tickster listing page into event references.
 *
 * The date comes from the detail URL path, not from the human-readable label —
 * the URL is machine-formatted and locale-independent, the label is neither.
 */
export function parseListing(html: string): EventRef[] {
  const $ = cheerio.load(html)
  const refs: EventRef[] = []

  $('.c-tile[data-requestcode]').each((_, el) => {
    const tile = $(el)
    const code = tile.attr('data-requestcode')
    const detailPath = tile.find('a.c-tile__head').attr('href')
    if (!code || !detailPath) return

    const match = DETAIL_PATH.exec(detailPath)
    if (!match) return

    const label = tile.find('.c-tile__label').text().trim()
    const { venueLabel, city } = splitLabel(label)

    refs.push({
      code,
      detailPath,
      date: match[2],
      title: tile.find('.c-tile__title').text().trim(),
      venueLabel,
      city,
      imageUrl: tile.find('img.c-avatar').attr('data-src') ?? undefined,
      ticketUrl: tile.find('a[data-eventrequestcode]').attr('href') ?? undefined,
    })
  })

  return refs
}

/** `28 aug 2026, Pustervik, Göteborg` → venue `Pustervik`, city `Göteborg`. */
function splitLabel(label: string): { venueLabel: string; city: string } {
  const parts = label.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length < 2) return { venueLabel: '', city: '' }
  return {
    city: parts[parts.length - 1],
    venueLabel: parts.slice(1, -1).join(', '),
  }
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- listing`
Expected: PASS, 6 tests

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Parse Tickster listing pages into event references"
```

---

### Task 3: Detail page parser

Turns one event detail page into a `RawEvent`. This is where the three open questions from the spec get answered against real HTML.

**Files:**
- Create: `biljetter-scraper/src/parse/detail.ts`
- Create: `biljetter-scraper/src/parse/fixtures/detail-multi-artist.html`
- Create: `biljetter-scraper/src/parse/fixtures/detail-no-lineup.html`
- Test: `biljetter-scraper/src/parse/detail.test.ts`

**Interfaces:**
- Consumes: `EventRef`, `RawEvent` from `src/types.ts`
- Produces: `parseDetail(html: string, ref: EventRef): RawEvent`

- [ ] **Step 1: Capture two fixtures**

The first is a confirmed multi-artist bill. For the second, pick any event from the listing fixture whose page has no `Framträdanden av` section — a club night or quiz is the likeliest candidate.

```bash
sleep 2
curl -s -A "BiljetterBot/0.1 (+maximilian.wide@ambitiongrp.com)" \
  "https://www.tickster.com/se/sv/events/j4cew62e6r3rbxu/2026-08-28/atomic-swing-popsicle" \
  -o src/parse/fixtures/detail-multi-artist.html
grep -c 'Framtr' src/parse/fixtures/detail-multi-artist.html
```

Expected: at least 1. Then find and save a no-lineup event:

```bash
node -e "
const fs=require('fs');
const h=fs.readFileSync('src/parse/fixtures/listing-goteborg.html','utf8');
for (const m of h.matchAll(/href=\"(\/se\/sv\/events\/[a-z0-9]+\/\d{4}-\d{2}-\d{2}\/[^\"]+)\"/g)) console.log(m[1]);
" | sort -u
```

Fetch candidates one at a time with `sleep 2` between each until one has no `Framtr` match, and save it as `detail-no-lineup.html`.

- [ ] **Step 2: Inspect the real DOM structure**

The spec records that these fields are present in the page *text*; the element structure was never verified. Pin the selectors now:

```bash
node -e "
const cheerio=require('cheerio');
const h=require('fs').readFileSync('src/parse/fixtures/detail-multi-artist.html','utf8');
const \$=cheerio.load(h);
\$('*').each((_,el)=>{
  const t=\$(el).clone().children().remove().end().text().trim();
  if (/Framtr|Startar|Åldersgräns|På scen/.test(t)) {
    console.log(el.tagName, JSON.stringify(\$(el).attr('class')||''), '::', t.slice(0,90));
  }
});
"
```

Record the tag and class for each field. The implementation below uses text-anchored lookups that survive class renames, but if a stable class exists, prefer it and adjust.

- [ ] **Step 3: Write the failing test**

`src/parse/detail.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseDetail } from './detail.js'
import type { EventRef } from '../types.js'

const fixture = (name: string) =>
  readFileSync(join(import.meta.dirname, 'fixtures', name), 'utf8')

const ref: EventRef = {
  code: 'J4CEW62E6R3RBXU',
  detailPath: '/se/sv/events/j4cew62e6r3rbxu/2026-08-28/atomic-swing-popsicle',
  date: '2026-08-28',
  title: 'Atomic Swing + Popsicle',
  venueLabel: 'Pustervik',
  city: 'Göteborg',
  ticketUrl: 'https://secure.tickster.com/sv/j4cew62e6r3rbxu',
}

describe('parseDetail', () => {
  const raw = parseDetail(fixture('detail-multi-artist.html'), ref)

  it('carries the reference fields through untouched', () => {
    expect(raw.code).toBe('J4CEW62E6R3RBXU')
    expect(raw.date).toBe('2026-08-28')
    expect(raw.venueLabel).toBe('Pustervik')
  })

  it('extracts the lineup from "Framträdanden av"', () => {
    expect(raw.artistNames).toEqual(['Atomic Swing', 'Popsicle'])
  })

  it('extracts the door time as HH:MM', () => {
    expect(raw.startTime).toBe('19:00')
  })

  it('extracts genre tags', () => {
    expect(raw.genreTags.map((t) => t.toLowerCase())).toContain('rock')
  })

  it('extracts the age limit', () => {
    expect(raw.ageLimit).toBe('18')
  })

  it('extracts a description of real length', () => {
    expect(raw.description!.length).toBeGreaterThan(100)
  })

  it('falls back to an empty lineup when the section is absent', () => {
    const noLineup = parseDetail(fixture('detail-no-lineup.html'), {
      ...ref,
      title: 'Klubbkväll',
    })
    expect(noLineup.artistNames).toEqual([])
  })
})
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npm test -- detail`
Expected: FAIL — cannot resolve `./detail.js`

- [ ] **Step 5: Implement the parser**

`src/parse/detail.ts`. Adjust the selectors to whatever Step 2 revealed; the text-anchored helpers below are the fallback that works regardless of class names:

```ts
import * as cheerio from 'cheerio'
import type { EventRef, RawEvent } from '../types.js'

const TIME = /(\d{1,2})[:.](\d{2})/
const AGE = /Åldersgräns:\s*(\d+)/

export function parseDetail(html: string, ref: EventRef): RawEvent {
  const $ = cheerio.load(html)
  const bodyText = $('body').text()

  return {
    code: ref.code,
    title: ref.title,
    date: ref.date,
    venueLabel: ref.venueLabel,
    city: ref.city,
    startTime: extractStartTime(bodyText),
    artistNames: extractLineup($),
    genreTags: extractGenreTags($),
    ageLimit: AGE.exec(bodyText)?.[1],
    description: extractDescription($),
    organizer: textAfterLabel($, 'Arrangör:'),
    imageUrl: ref.imageUrl,
    ticketUrl: ref.ticketUrl ?? `https://secure.tickster.com/sv/${ref.code.toLowerCase()}`,
  }
}

/** `Startar 28 aug 19:00` → `19:00`. */
function extractStartTime(text: string): string | undefined {
  const line = text.split('\n').find((l) => l.includes('Startar'))
  const m = line ? TIME.exec(line) : null
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : undefined
}

/**
 * `Framträdanden av` is followed by one link per artist. Reading the links
 * rather than splitting a text blob keeps multi-word and comma-containing
 * artist names intact.
 */
function extractLineup($: cheerio.CheerioAPI): string[] {
  const heading = $('*')
    .filter((_, el) => $(el).children().length === 0)
    .filter((_, el) => $(el).text().trim().startsWith('Framträdanden av'))
    .first()

  if (heading.length === 0) return []

  const names = heading
    .parent()
    .find('a')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean)

  return [...new Set(names)]
}

function extractGenreTags($: cheerio.CheerioAPI): string[] {
  const tags = $('a[href*="/events/tagged/"]')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean)
  return [...new Set(tags)]
}

function extractDescription($: cheerio.CheerioAPI): string | undefined {
  const paragraphs = $('p')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter((t) => t.length > 60)
  return paragraphs.length ? paragraphs.join('\n\n') : undefined
}

function textAfterLabel($: cheerio.CheerioAPI, label: string): string | undefined {
  const el = $('*')
    .filter((_, e) => $(e).children().length === 0)
    .filter((_, e) => $(e).text().trim() === label)
    .first()
  const value = el.parent().text().replace(label, '').trim()
  return value || undefined
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm test -- detail`
Expected: PASS, 7 tests. If `extractLineup` or `extractGenreTags` return empty, correct the selectors using the Step 2 output — do not weaken the assertions.

- [ ] **Step 7: Record the answers to the spec's open questions**

Append findings to `../biljetter/docs/superpowers/specs/2026-08-28-tickster-scraper-design.md` under "Open questions": whether cancellation is marked, whether price appears anywhere, and whether `Framträdanden av` was present on both fixtures.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Parse Tickster event detail pages into raw events"
```

---

### Task 4: Polite fetch client with on-disk cache

**Files:**
- Create: `biljetter-scraper/src/fetch/client.ts`
- Test: `biljetter-scraper/src/fetch/client.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks
- Produces: `createClient(opts?: { cacheDir?: string; delayMs?: number }): { get(url: string): Promise<string> }`

- [ ] **Step 1: Write the failing test**

The test injects a fake fetch so it never touches the network. It asserts the two properties that matter: caching prevents repeat requests, and consecutive live requests are separated by the delay.

`src/fetch/client.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createClient } from './client.js'

let cacheDir: string

beforeEach(() => {
  cacheDir = mkdtempSync(join(tmpdir(), 'scraper-cache-'))
})

afterEach(() => {
  rmSync(cacheDir, { recursive: true, force: true })
  vi.unstubAllGlobals()
})

describe('createClient', () => {
  it('fetches once and serves the second call from cache', async () => {
    const spy = vi.fn(async () => new Response('<html>hi</html>', { status: 200 }))
    vi.stubGlobal('fetch', spy)

    const client = createClient({ cacheDir, delayMs: 0 })
    const a = await client.get('https://example.test/a')
    const b = await client.get('https://example.test/a')

    expect(a).toBe('<html>hi</html>')
    expect(b).toBe('<html>hi</html>')
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('waits at least delayMs between two live requests', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('ok', { status: 200 })))

    const client = createClient({ cacheDir, delayMs: 50 })
    const started = Date.now()
    await client.get('https://example.test/a')
    await client.get('https://example.test/b')

    expect(Date.now() - started).toBeGreaterThanOrEqual(50)
  })

  it('throws on a 404 so a bad URL is never silently cached', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('no', { status: 404 })))

    const client = createClient({ cacheDir, delayMs: 0 })
    await expect(client.get('https://example.test/missing')).rejects.toThrow('404')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- client`
Expected: FAIL — cannot resolve `./client.js`

- [ ] **Step 3: Implement the client**

`src/fetch/client.ts`:

```ts
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const USER_AGENT = 'BiljetterBot/0.1 (+maximilian.wide@ambitiongrp.com)'

export interface ClientOptions {
  cacheDir?: string
  delayMs?: number
  maxRetries?: number
}

/**
 * HTTP client that honours tickster.com's `Crawl-delay: 2` and caches every
 * response on disk. The cache is what makes a 2s delay workable in development:
 * a re-run of the pipeline costs nothing.
 */
export function createClient(opts: ClientOptions = {}) {
  const cacheDir = opts.cacheDir ?? '.cache'
  const delayMs = opts.delayMs ?? 2000
  const maxRetries = opts.maxRetries ?? 3

  mkdirSync(cacheDir, { recursive: true })
  let lastRequestAt = 0

  async function get(url: string): Promise<string> {
    const path = join(cacheDir, createHash('sha1').update(url).digest('hex') + '.html')
    if (existsSync(path)) return readFileSync(path, 'utf8')

    const body = await fetchWithRetry(url)
    writeFileSync(path, body, 'utf8')
    return body
  }

  async function fetchWithRetry(url: string): Promise<string> {
    let lastError: unknown

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      await waitForTurn(attempt)
      try {
        const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
        if (res.status >= 500) throw new Error(`${url} returned ${res.status}`)
        if (!res.ok) throw new FatalHttpError(`${url} returned ${res.status}`)
        return await res.text()
      } catch (err) {
        if (err instanceof FatalHttpError) throw err
        lastError = err
      }
    }

    throw lastError
  }

  async function waitForTurn(attempt: number): Promise<void> {
    const backoff = attempt === 0 ? 0 : delayMs * 2 ** attempt
    const earliest = lastRequestAt + delayMs + backoff
    const waitFor = earliest - Date.now()
    if (waitFor > 0) await new Promise((r) => setTimeout(r, waitFor))
    lastRequestAt = Date.now()
  }

  return { get }
}

/** A status we should never retry — retrying a 404 just wastes the crawl budget. */
class FatalHttpError extends Error {}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- client`
Expected: PASS, 3 tests

- [ ] **Step 5: Add the opt-in live test**

The spec calls for exactly one test that really hits Tickster, run by hand and never in CI. Append to `src/fetch/client.test.ts`:

```ts
const LIVE = process.env.LIVE === '1'

describe.skipIf(!LIVE)('live Tickster fetch', () => {
  it('retrieves a real listing page', async () => {
    const client = createClient({ cacheDir })
    const html = await client.get(
      'https://www.tickster.com/se/sv/events/in/g%C3%B6teborg?skip=0&take=16'
    )
    expect(html).toContain('c-tile__title')
  }, 30_000)
})
```

Run it once to confirm the client works end to end:

Run: `LIVE=1 npm test -- client`
Expected: PASS, 4 tests. Without `LIVE=1` the fourth is skipped.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Add polite cached HTTP client honouring the crawl delay"
```

---

### Task 5: Venue configuration and canonicalization

The spec's most important rule lives here: unmatched venues are reported, never silently dropped.

**Files:**
- Create: `biljetter-scraper/config/venues.json`
- Create: `biljetter-scraper/src/normalize/venues.ts`
- Test: `biljetter-scraper/src/normalize/venues.test.ts`

**Interfaces:**
- Consumes: `OutputVenue` from `src/types.ts`, `slugify` from `src/normalize/slugify.ts`
- Produces: `loadVenueConfig(path?: string): VenueConfig`; `matchVenue(config: VenueConfig, rawName: string): OutputVenue | null`; type `VenueConfig`

- [ ] **Step 1: Confirm the two unknown addresses**

Pustervik and Nefertiti come from `biljetter/lib/data/mockEvents.ts`. Trädgår'n is `Nya Allén 11`, confirmed from its Tickster event page. Musikens Hus is unverified — check it before writing the config:

```bash
sleep 2
curl -s -A "BiljetterBot/0.1 (+maximilian.wide@ambitiongrp.com)" https://www.musikenshus.se/ \
  | grep -oiE '[A-ZÅÄÖ][a-zåäö]+(gatan|vägen|torget|allén)[^<]{0,20}' | sort -u | head
```

Use what this returns. If nothing usable comes back, set `address` to the empty string rather than inventing one — a wrong address is worse than a missing one, and the app already treats it as display-only text.

- [ ] **Step 2: Write the venue config**

`config/venues.json`. The `aliases` lists start with the spellings observed on 2026-08-28; Step 7 of Task 9 grows them from real run output:

```json
{
  "pustervik": {
    "name": "Pustervik",
    "address": "Järntorget 12",
    "city": "Göteborg",
    "capacity": 350,
    "coordinates": { "lat": 57.7002, "lng": 11.9535 },
    "websiteUrl": "https://pustervik.nu",
    "aliases": ["Pustervik"]
  },
  "nefertiti": {
    "name": "Nefertiti",
    "address": "Hvitfeldtsplatsen 6",
    "city": "Göteborg",
    "capacity": 250,
    "coordinates": { "lat": 57.7045, "lng": 11.968 },
    "websiteUrl": "https://nefertiti.se",
    "aliases": ["Nefertiti"]
  },
  "tradgarn": {
    "name": "Trädgår'n",
    "address": "Nya Allén 11",
    "city": "Göteborg",
    "websiteUrl": "https://tradgarn.se",
    "aliases": [
      "Trädgår'n",
      "TRÄDGÅR'N",
      "Trädgår´n",
      "Trädgår'n Nattklubb",
      "Restaurang Trädgår'n",
      "RESTAURANG TRÄDGÅR'N"
    ]
  },
  "musikens-hus": {
    "name": "Musikens Hus",
    "address": "",
    "city": "Göteborg",
    "websiteUrl": "https://www.musikenshus.se",
    "aliases": [
      "Musikens Hus",
      "Musikens Hus Stora Scen",
      "Musikens Hus / Hängmattan Scen"
    ]
  }
}
```

- [ ] **Step 3: Write the failing test**

`src/normalize/venues.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { loadVenueConfig, matchVenue } from './venues.js'

const config = loadVenueConfig()

describe('matchVenue', () => {
  it('matches an exact venue name', () => {
    expect(matchVenue(config, 'Pustervik')?.slug).toBe('pustervik')
  })

  it('collapses every Trädgår\u0027n spelling onto one venue', () => {
    const names = [
      'Trädgår\u0027n',
      'TRÄDGÅR\u0027N',
      'Trädgår´n',
      'Trädgår\u0027n Nattklubb',
      'RESTAURANG TRÄDGÅR\u0027N',
    ]
    for (const name of names) {
      expect(matchVenue(config, name)?.slug).toBe('tradgarn')
    }
  })

  it('collapses the three Musikens Hus records onto one venue', () => {
    expect(matchVenue(config, 'Musikens Hus Stora Scen')?.slug).toBe('musikens-hus')
    expect(matchVenue(config, 'Musikens Hus / Hängmattan Scen')?.slug).toBe('musikens-hus')
  })

  it('is insensitive to case and surrounding whitespace', () => {
    expect(matchVenue(config, '  pustervik  ')?.slug).toBe('pustervik')
  })

  it('returns null for an unknown venue rather than guessing', () => {
    expect(matchVenue(config, 'Ullevi')).toBeNull()
    expect(matchVenue(config, 'Valand')).toBeNull()
  })

  it('gives every venue a stable id derived from its slug', () => {
    expect(matchVenue(config, 'Pustervik')?.id).toBe('v-pustervik')
  })
})
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npm test -- venues`
Expected: FAIL — cannot resolve `./venues.js`

- [ ] **Step 5: Implement venue matching**

`src/normalize/venues.ts`:

```ts
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { OutputVenue } from '../types.js'

interface VenueEntry {
  name: string
  address: string
  city: string
  capacity?: number
  coordinates?: { lat: number; lng: number }
  websiteUrl?: string
  aliases: string[]
}

export type VenueConfig = Map<string, OutputVenue>

const DEFAULT_CONFIG = join(import.meta.dirname, '../../config/venues.json')

/** Builds a lookup from every normalized alias to its canonical venue. */
export function loadVenueConfig(path: string = DEFAULT_CONFIG): VenueConfig {
  const raw: Record<string, VenueEntry> = JSON.parse(readFileSync(path, 'utf8'))
  const lookup: VenueConfig = new Map()

  for (const [slug, entry] of Object.entries(raw)) {
    const venue: OutputVenue = {
      id: `v-${slug}`,
      name: entry.name,
      slug,
      address: entry.address,
      city: entry.city,
      capacity: entry.capacity,
      coordinates: entry.coordinates,
      websiteUrl: entry.websiteUrl,
    }
    for (const alias of [entry.name, ...entry.aliases]) {
      lookup.set(normalizeKey(alias), venue)
    }
  }

  return lookup
}

export function matchVenue(config: VenueConfig, rawName: string): OutputVenue | null {
  return config.get(normalizeKey(rawName)) ?? null
}

/**
 * Tickster venue names are free text per organizer, so they vary in case,
 * whitespace, and apostrophe character. Normalizing all three before lookup
 * keeps the alias lists short and readable.
 */
function normalizeKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\u2018\u2019\u00b4`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm test -- venues`
Expected: PASS, 6 tests

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "Canonicalize Tickster venue names via an alias config"
```

---

### Task 6: Genre mapping and non-music filtering

**Files:**
- Create: `biljetter-scraper/config/genres.json`
- Create: `biljetter-scraper/src/normalize/genres.ts`
- Test: `biljetter-scraper/src/normalize/genres.test.ts`

**Interfaces:**
- Consumes: `OutputGenre` from `src/types.ts`
- Produces: `GENRES: OutputGenre[]`; `loadGenreConfig(path?: string): GenreConfig`; `mapGenres(config: GenreConfig, tags: string[]): { genres: OutputGenre[]; unmapped: string[]; isMusic: boolean }`; type `GenreConfig`

- [ ] **Step 1: Write the genre config**

`config/genres.json`. `map` holds Tickster tags that become one of the ten slugs; `structural` holds tags that describe format rather than genre and carry no signal either way; `nonMusic` holds tags that positively indicate the event is not a concert.

```json
{
  "map": {
    "rock": "rock",
    "hårdrock": "metal",
    "metal": "metal",
    "punk": "rock",
    "indie": "indie",
    "alternativt": "indie",
    "pop": "ovrigt",
    "elektroniskt": "electronic",
    "electronic": "electronic",
    "house": "electronic",
    "techno": "electronic",
    "jazz": "jazz",
    "blues": "soul",
    "soul": "soul",
    "funk": "soul",
    "folk": "folk",
    "folkmusik": "folk",
    "visa": "folk",
    "country": "country",
    "americana": "country",
    "hiphop": "hip-hop",
    "hip hop": "hip-hop",
    "hip-hop": "hip-hop",
    "rap": "hip-hop",
    "reggae": "ovrigt",
    "världsmusik": "ovrigt",
    "world": "ovrigt",
    "klassiskt": "ovrigt"
  },
  "structural": ["konsert", "livemusik", "festival", "klubb", "turné"],
  "nonMusic": [
    "ölprovning",
    "vinprovning",
    "mat & dryck",
    "afterwork",
    "konferens",
    "utbildning",
    "sport",
    "teater",
    "stand up",
    "föreläsning",
    "barn"
  ]
}
```

- [ ] **Step 2: Write the failing test**

`src/normalize/genres.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { loadGenreConfig, mapGenres, GENRES } from './genres.js'

const config = loadGenreConfig()

describe('GENRES', () => {
  it('holds exactly the ten slugs biljetter already uses', () => {
    expect(GENRES.map((g) => g.slug)).toEqual([
      'rock', 'electronic', 'jazz', 'indie', 'folk',
      'hip-hop', 'metal', 'soul', 'country', 'ovrigt',
    ])
  })
})

describe('mapGenres', () => {
  it('maps known tags and ignores structural ones', () => {
    const r = mapGenres(config, ['Rock', 'Konsert'])
    expect(r.genres.map((g) => g.slug)).toEqual(['rock'])
    expect(r.unmapped).toEqual([])
    expect(r.isMusic).toBe(true)
  })

  it('is case insensitive', () => {
    expect(mapGenres(config, ['HÅRDROCK']).genres[0].slug).toBe('metal')
  })

  it('deduplicates tags that collapse onto one genre', () => {
    const r = mapGenres(config, ['Hip Hop', 'Rap'])
    expect(r.genres.map((g) => g.slug)).toEqual(['hip-hop'])
  })

  it('falls through to ovrigt and reports the unmapped tag', () => {
    const r = mapGenres(config, ['Dansband'])
    expect(r.genres.map((g) => g.slug)).toEqual(['ovrigt'])
    expect(r.unmapped).toEqual(['Dansband'])
    expect(r.isMusic).toBe(true)
  })

  it('flags an event as non-music when a nonMusic tag is present', () => {
    expect(mapGenres(config, ['Ölprovning']).isMusic).toBe(false)
    expect(mapGenres(config, ['Rock', 'Ölprovning']).isMusic).toBe(false)
  })

  it('treats an event with only structural tags as music', () => {
    const r = mapGenres(config, ['Konsert'])
    expect(r.isMusic).toBe(true)
    expect(r.genres.map((g) => g.slug)).toEqual(['ovrigt'])
  })

  it('returns ovrigt when there are no tags at all', () => {
    expect(mapGenres(config, []).genres.map((g) => g.slug)).toEqual(['ovrigt'])
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -- genres`
Expected: FAIL — cannot resolve `./genres.js`

- [ ] **Step 4: Implement genre mapping**

`src/normalize/genres.ts`. The `GENRES` array is copied from `biljetter/lib/data/mockEvents.ts`, ids included, so the emitted JSON is interchangeable with the mock data it replaces:

```ts
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { OutputGenre } from '../types.js'

export const GENRES: OutputGenre[] = [
  { id: 'g1', name: 'Rock', slug: 'rock', color: '#E74C3C' },
  { id: 'g2', name: 'Electronic', slug: 'electronic', color: '#3498DB' },
  { id: 'g3', name: 'Jazz', slug: 'jazz', color: '#9B59B6' },
  { id: 'g4', name: 'Indie', slug: 'indie', color: '#2ECC71' },
  { id: 'g5', name: 'Folk', slug: 'folk', color: '#F39C12' },
  { id: 'g6', name: 'Hip Hop', slug: 'hip-hop', color: '#95A5A6' },
  { id: 'g7', name: 'Metal', slug: 'metal', color: '#8B0000' },
  { id: 'g8', name: 'Soul', slug: 'soul', color: '#C0392B' },
  { id: 'g9', name: 'Country', slug: 'country', color: '#D4AC0D' },
  { id: 'g10', name: 'Övrigt', slug: 'ovrigt', color: '#808080' },
]

const BY_SLUG = new Map(GENRES.map((g) => [g.slug, g]))

export interface GenreConfig {
  map: Record<string, string>
  structural: Set<string>
  nonMusic: Set<string>
}

const DEFAULT_CONFIG = join(import.meta.dirname, '../../config/genres.json')

export function loadGenreConfig(path: string = DEFAULT_CONFIG): GenreConfig {
  const raw = JSON.parse(readFileSync(path, 'utf8')) as {
    map: Record<string, string>
    structural: string[]
    nonMusic: string[]
  }
  return {
    map: raw.map,
    structural: new Set(raw.structural),
    nonMusic: new Set(raw.nonMusic),
  }
}

export interface GenreResult {
  genres: OutputGenre[]
  unmapped: string[]
  isMusic: boolean
}

/**
 * Maps Tickster's free-form tags onto the ten fixed genres.
 *
 * A tag that maps to nothing still produces `ovrigt` — an event is never
 * dropped for having an unfamiliar genre — but it is reported so the config
 * can grow. Only an explicit `nonMusic` tag marks an event as not a concert.
 */
export function mapGenres(config: GenreConfig, tags: string[]): GenreResult {
  const slugs = new Set<string>()
  const unmapped: string[] = []
  let isMusic = true

  for (const tag of tags) {
    const key = tag.toLowerCase().trim()
    if (config.nonMusic.has(key)) {
      isMusic = false
      continue
    }
    if (config.structural.has(key)) continue

    const slug = config.map[key]
    if (slug) slugs.add(slug)
    else {
      unmapped.push(tag)
      slugs.add('ovrigt')
    }
  }

  if (slugs.size === 0) slugs.add('ovrigt')

  const genres = GENRES.filter((g) => slugs.has(g.slug))
  return { genres, unmapped, isMusic }
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- genres`
Expected: PASS, 8 tests

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Map Tickster genre tags onto the fixed genre set"
```

---

### Task 7: The normalize stage

Assembles `RawEvent[]` into the final dataset plus a report. All the judgement calls from Tasks 5 and 6 come together here.

**Files:**
- Create: `biljetter-scraper/src/normalize/index.ts`
- Test: `biljetter-scraper/src/normalize/index.test.ts`

**Interfaces:**
- Consumes: `matchVenue`/`loadVenueConfig` (Task 5), `mapGenres`/`loadGenreConfig` (Task 6), `slugify` (Task 1), `RawEvent`/`OutputEvent`/`NormalizeReport` (Task 1)
- Produces: `normalize(raws: RawEvent[], opts: { now: Date }): { events: OutputEvent[]; report: NormalizeReport }`

- [ ] **Step 1: Write the failing test**

`src/normalize/index.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { normalize } from './index.js'
import type { RawEvent } from '../types.js'

const NOW = new Date('2026-08-28T12:00:00Z')

function raw(overrides: Partial<RawEvent> = {}): RawEvent {
  return {
    code: 'ABC123',
    title: 'Atomic Swing + Popsicle',
    date: '2026-09-15',
    startTime: '19:00',
    venueLabel: 'Pustervik',
    city: 'Göteborg',
    artistNames: ['Atomic Swing', 'Popsicle'],
    genreTags: ['Rock'],
    description: 'En kväll med svensk 90-talsrock.',
    ticketUrl: 'https://secure.tickster.com/sv/abc123',
    ...overrides,
  }
}

describe('normalize', () => {
  it('emits an event with a date-suffixed slug matching biljetter\u0027s format', () => {
    const { events } = normalize([raw()], { now: NOW })
    expect(events).toHaveLength(1)
    expect(events[0].slug).toBe('atomic-swing-popsicle-2026-09-15')
  })

  it('combines date and start time into an ISO start, and ends three hours later', () => {
    const { events } = normalize([raw()], { now: NOW })
    expect(events[0].startTime).toBe(new Date(2026, 8, 15, 19, 0).toISOString())
    expect(events[0].endTime).toBe(new Date(2026, 8, 15, 22, 0).toISOString())
  })

  it('defaults to 20:00 when the page had no start time', () => {
    const { events } = normalize([raw({ startTime: undefined })], { now: NOW })
    expect(events[0].startTime).toBe(new Date(2026, 8, 15, 20, 0).toISOString())
  })

  it('marks elapsed events as past', () => {
    const { events } = normalize([raw({ date: '2026-01-05' })], { now: NOW })
    expect(events[0].status).toBe('past')
  })

  it('expands the lineup into artists shared by slug across events', () => {
    const { events } = normalize(
      [raw(), raw({ code: 'DEF456', date: '2026-10-01', artistNames: ['Popsicle'] })],
      { now: NOW }
    )
    const first = events[0].artists.find((a) => a.slug === 'popsicle')!
    const second = events[1].artists.find((a) => a.slug === 'popsicle')!
    expect(second.id).toBe(first.id)
  })

  it('falls back to the title when there is no lineup', () => {
    const { events } = normalize([raw({ artistNames: [] })], { now: NOW })
    expect(events[0].artists.map((a) => a.name)).toEqual(['Atomic Swing + Popsicle'])
  })

  it('drops events at venues outside the configured set and counts them', () => {
    const { events, report } = normalize([raw({ venueLabel: 'Ullevi' })], { now: NOW })
    expect(events).toHaveLength(0)
    expect(report.droppedByVenue).toBe(1)
    expect(report.unmatchedVenues).toEqual({ Ullevi: 1 })
  })

  it('drops non-music events and counts them separately', () => {
    const { events, report } = normalize([raw({ genreTags: ['Ölprovning'] })], { now: NOW })
    expect(events).toHaveLength(0)
    expect(report.droppedAsNonMusic).toBe(1)
  })

  it('reports unmapped genre tags without dropping the event', () => {
    const { events, report } = normalize([raw({ genreTags: ['Dansband'] })], { now: NOW })
    expect(events).toHaveLength(1)
    expect(report.unmappedGenreTags).toEqual({ Dansband: 1 })
  })

  it('never emits a price, because Tickster does not expose one', () => {
    const { events } = normalize([raw()], { now: NOW })
    expect(events[0].price).toBeUndefined()
  })

  it('sorts events chronologically', () => {
    const { events } = normalize(
      [raw({ code: 'B', date: '2026-11-01' }), raw({ code: 'A', date: '2026-09-01' })],
      { now: NOW }
    )
    expect(new Date(events[0].startTime).getTime()).toBeLessThan(
      new Date(events[1].startTime).getTime()
    )
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- normalize/index`
Expected: FAIL — cannot resolve `./index.js`

- [ ] **Step 3: Implement normalize**

`src/normalize/index.ts`:

```ts
import { slugify } from './slugify.js'
import { loadVenueConfig, matchVenue, type VenueConfig } from './venues.js'
import { loadGenreConfig, mapGenres, type GenreConfig } from './genres.js'
import type { NormalizeReport, OutputArtist, OutputEvent, RawEvent } from '../types.js'

const DEFAULT_HOUR = 20
const EVENT_LENGTH_HOURS = 3

export interface NormalizeOptions {
  now: Date
  venues?: VenueConfig
  genres?: GenreConfig
}

export function normalize(
  raws: RawEvent[],
  opts: NormalizeOptions
): { events: OutputEvent[]; report: NormalizeReport } {
  const venueConfig = opts.venues ?? loadVenueConfig()
  const genreConfig = opts.genres ?? loadGenreConfig()
  const stamp = opts.now.toISOString()

  const artistsBySlug = new Map<string, OutputArtist>()
  const events: OutputEvent[] = []
  const report: NormalizeReport = {
    seen: raws.length,
    emitted: 0,
    droppedByVenue: 0,
    droppedAsNonMusic: 0,
    unmatchedVenues: {},
    unmappedGenreTags: {},
  }

  for (const r of raws) {
    const venue = matchVenue(venueConfig, r.venueLabel)
    if (!venue) {
      report.droppedByVenue++
      const key = r.venueLabel || '(blank)'
      report.unmatchedVenues[key] = (report.unmatchedVenues[key] ?? 0) + 1
      continue
    }

    const { genres, unmapped, isMusic } = mapGenres(genreConfig, r.genreTags)
    for (const tag of unmapped) {
      report.unmappedGenreTags[tag] = (report.unmappedGenreTags[tag] ?? 0) + 1
    }
    if (!isMusic) {
      report.droppedAsNonMusic++
      continue
    }

    const start = toDate(r.date, r.startTime)
    const end = new Date(start.getTime() + EVENT_LENGTH_HOURS * 3600_000)
    const names = r.artistNames.length > 0 ? r.artistNames : [r.title]
    const artists = names.map((name) => internArtist(artistsBySlug, name))

    events.push({
      id: `e-${r.code.toLowerCase()}`,
      title: r.title,
      slug: `${slugify(r.title)}-${r.date}`,
      description: r.description,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      venueId: venue.id,
      venue,
      artistIds: artists.map((a) => a.id),
      artists,
      genreIds: genres.map((g) => g.id),
      genres,
      status: start < opts.now ? 'past' : 'upcoming',
      ticketUrl: r.ticketUrl,
      imageUrl: r.imageUrl,
      createdAt: stamp,
      updatedAt: stamp,
    })
  }

  events.sort((a, b) => a.startTime.localeCompare(b.startTime))
  report.emitted = events.length
  return { events, report }
}

/** `2026-09-15` + `19:00` → a local Date. Tickster times are Europe/Stockholm. */
function toDate(date: string, time?: string): Date {
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time ? time.split(':').map(Number) : [DEFAULT_HOUR, 0]
  return new Date(y, m - 1, d, hh, mm)
}

/** One Artist row per slug across the whole run, so relations stay consistent. */
function internArtist(seen: Map<string, OutputArtist>, name: string): OutputArtist {
  const slug = slugify(name)
  const existing = seen.get(slug)
  if (existing) return existing

  const artist: OutputArtist = { id: `a-${slug}`, name, slug }
  seen.set(slug, artist)
  return artist
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- normalize/index`
Expected: PASS, 11 tests

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Normalize raw events into the biljetter dataset shape"
```

---

### Task 8: Emit and run report

**Files:**
- Create: `biljetter-scraper/src/emit/json.ts`
- Create: `biljetter-scraper/src/report.ts`
- Test: `biljetter-scraper/src/emit/json.test.ts`

**Interfaces:**
- Consumes: `OutputEvent`, `EventsFile`, `NormalizeReport` (Task 1)
- Produces: `writeEventsFile(path: string, events: OutputEvent[], generatedAt: Date): void`; `formatReport(report: NormalizeReport, previousCount: number | null): string`

- [ ] **Step 1: Write the failing test**

`src/emit/json.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { writeEventsFile } from './json.js'
import { formatReport } from '../report.js'
import type { OutputEvent, NormalizeReport } from '../types.js'

let dir: string
beforeEach(() => { dir = mkdtempSync(join(tmpdir(), 'emit-')) })
afterEach(() => { rmSync(dir, { recursive: true, force: true }) })

const event = { id: 'e-abc', title: 'Test', slug: 'test-2026-09-15' } as OutputEvent

describe('writeEventsFile', () => {
  it('writes a file with metadata and events', () => {
    const path = join(dir, 'events.json')
    writeEventsFile(path, [event], new Date('2026-08-28T10:00:00Z'))

    const parsed = JSON.parse(readFileSync(path, 'utf8'))
    expect(parsed.source).toBe('tickster')
    expect(parsed.generatedAt).toBe('2026-08-28T10:00:00.000Z')
    expect(parsed.events).toHaveLength(1)
  })

  it('refuses to write an empty dataset over an existing file', () => {
    const path = join(dir, 'events.json')
    writeEventsFile(path, [event], new Date())
    expect(() => writeEventsFile(path, [], new Date())).toThrow(/empty/i)
    expect(JSON.parse(readFileSync(path, 'utf8')).events).toHaveLength(1)
  })

  it('creates the parent directory when it does not exist', () => {
    const path = join(dir, 'nested', 'events.json')
    writeEventsFile(path, [event], new Date())
    expect(existsSync(path)).toBe(true)
  })
})

describe('formatReport', () => {
  const report: NormalizeReport = {
    seen: 100,
    emitted: 40,
    droppedByVenue: 55,
    droppedAsNonMusic: 5,
    unmatchedVenues: { Ullevi: 12, Valand: 3 },
    unmappedGenreTags: { Dansband: 2 },
  }

  it('lists unmatched venues by descending count', () => {
    const out = formatReport(report, null)
    expect(out.indexOf('Ullevi')).toBeLessThan(out.indexOf('Valand'))
  })

  it('warns loudly when this run emitted fewer events than the last', () => {
    expect(formatReport(report, 60)).toMatch(/WARNING/)
  })

  it('does not warn when the count grew', () => {
    expect(formatReport(report, 30)).not.toMatch(/WARNING/)
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- emit`
Expected: FAIL — cannot resolve `./json.js`

- [ ] **Step 3: Implement the emitter**

`src/emit/json.ts`:

```ts
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import type { EventsFile, OutputEvent } from '../types.js'

/**
 * Writes the dataset in one shot. An empty result is treated as a failed run,
 * not a valid state — the most likely cause is a markup change that broke the
 * parsers, and silently blanking the app's data would hide that.
 */
export function writeEventsFile(
  path: string,
  events: OutputEvent[],
  generatedAt: Date
): void {
  if (events.length === 0) {
    throw new Error(
      'Refusing to write an empty events file — the run produced no events, ' +
        'which usually means the Tickster markup changed and the parsers need updating.'
    )
  }

  const payload: EventsFile = {
    generatedAt: generatedAt.toISOString(),
    source: 'tickster',
    events,
  }

  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(payload, null, 2) + '\n', 'utf8')
}
```

`src/report.ts`:

```ts
import type { NormalizeReport } from './types.js'

export function formatReport(
  report: NormalizeReport,
  previousCount: number | null
): string {
  const lines = [
    '',
    '── Run report ────────────────────────────────',
    `  events seen        ${report.seen}`,
    `  events emitted     ${report.emitted}`,
    `  dropped (venue)    ${report.droppedByVenue}`,
    `  dropped (non-music) ${report.droppedAsNonMusic}`,
  ]

  if (previousCount !== null && report.emitted < previousCount) {
    lines.push(
      '',
      `  WARNING: this run emitted ${report.emitted} events, down from ${previousCount}.`,
      '  Check for a markup change before committing the output.'
    )
  }

  lines.push(...section('Unmatched venues', report.unmatchedVenues,
    'Add these to config/venues.json if any belong to a venue in scope.'))
  lines.push(...section('Unmapped genre tags', report.unmappedGenreTags,
    'These fell through to "ovrigt". Add mappings to config/genres.json.'))

  lines.push('──────────────────────────────────────────────', '')
  return lines.join('\n')
}

function section(title: string, counts: Record<string, number>, hint: string): string[] {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1])
  if (entries.length === 0) return []
  return [
    '',
    `  ${title}:`,
    ...entries.map(([name, n]) => `    ${String(n).padStart(4)}  ${name}`),
    `  ${hint}`,
  ]
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- emit`
Expected: PASS, 6 tests

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "Emit events.json and a run report"
```

---

### Task 9: CLI orchestration and the first real run

**Files:**
- Create: `biljetter-scraper/src/main.ts`
- Create: `biljetter-scraper/README.md`
- Modify: `biljetter-scraper/config/venues.json` (grow aliases from real output)

**Interfaces:**
- Consumes: everything from Tasks 1–8
- Produces: the `npm run scrape` command and `../biljetter/lib/data/events.json`

- [ ] **Step 1: Write the orchestrator**

`src/main.ts`:

```ts
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from './fetch/client.js'
import { parseListing } from './parse/listing.js'
import { parseDetail } from './parse/detail.js'
import { normalize } from './normalize/index.js'
import { writeEventsFile } from './emit/json.js'
import { formatReport } from './report.js'
import type { EventRef, RawEvent } from './types.js'

const BASE = 'https://www.tickster.com'
const LISTING = `${BASE}/se/sv/events/in/g%C3%B6teborg`
const PAGE_SIZE = 16
const MAX_PAGES = 60
const OUTPUT = resolve('../biljetter/lib/data/events.json')

async function main(): Promise<void> {
  const client = createClient()

  console.log('Collecting listing pages…')
  const refs = await collectRefs(client)
  console.log(`  ${refs.length} events found`)

  console.log('Fetching detail pages…')
  const raws = await collectDetails(client, refs)
  console.log(`  ${raws.length} detail pages parsed`)

  const { events, report } = normalize(raws, { now: new Date() })
  console.log(formatReport(report, previousCount()))

  writeEventsFile(OUTPUT, events, new Date())
  console.log(`Wrote ${events.length} events to ${OUTPUT}`)
}

async function collectRefs(client: { get(url: string): Promise<string> }) {
  const seen = new Map<string, EventRef>()

  for (let page = 0; page < MAX_PAGES; page++) {
    const url = `${LISTING}?skip=${page * PAGE_SIZE}&take=${PAGE_SIZE}&sort=eventstart`
    const refs = parseListing(await client.get(url))
    if (refs.length === 0) break

    const before = seen.size
    for (const ref of refs) seen.set(ref.code, ref)
    if (seen.size === before) break // pagination looped; stop rather than spin
  }

  return [...seen.values()]
}

async function collectDetails(
  client: { get(url: string): Promise<string> },
  refs: EventRef[]
): Promise<RawEvent[]> {
  const raws: RawEvent[] = []

  for (const [i, ref] of refs.entries()) {
    try {
      raws.push(parseDetail(await client.get(BASE + ref.detailPath), ref))
    } catch (err) {
      console.warn(`  skipped ${ref.code} (${ref.title}): ${(err as Error).message}`)
    }
    if ((i + 1) % 25 === 0) console.log(`  ${i + 1}/${refs.length}`)
  }

  return raws
}

/** The previous run's event count, so the report can flag a drop. */
function previousCount(): number | null {
  if (!existsSync(OUTPUT)) return null
  try {
    return JSON.parse(readFileSync(OUTPUT, 'utf8')).events.length
  } catch {
    return null
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

- [ ] **Step 2: Run the scraper for real**

This is the first full crawl. At 2s per request across ~800 listing entries it takes roughly 30 minutes; the cache means later runs are instant.

Run: `npm run scrape`
Expected: a run report, then a written `events.json`. It is normal for `dropped (venue)` to be the large majority — most Göteborg events are not at these four venues.

- [ ] **Step 3: Grow the venue alias list from the report**

Read the "Unmatched venues" section. Any entry that is a spelling of Pustervik, Nefertiti, Trädgår'n, or Musikens Hus goes into that venue's `aliases` in `config/venues.json`. Anything else is correctly excluded — leave it.

Then delete the cache and re-run so the change takes effect against fresh normalization:

```bash
rm -rf .cache && npm run scrape
```

Repeat until no unmatched venue belongs to one of the four.

- [ ] **Step 4: Sanity-check the output**

```bash
node -e "
const d=require('../biljetter/lib/data/events.json');
console.log('events:', d.events.length);
const byVenue={}; for (const e of d.events) byVenue[e.venue.name]=(byVenue[e.venue.name]||0)+1;
console.log(byVenue);
console.log('with description:', d.events.filter(e=>e.description).length);
console.log('with image:', d.events.filter(e=>e.imageUrl).length);
console.log('with >1 artist:', d.events.filter(e=>e.artists.length>1).length);
console.log('sample:', JSON.stringify(d.events[0], null, 2).slice(0, 700));
"
```

Expected: all four venues represented, most events carrying a description and image. If one venue has zero events, its aliases are still wrong — return to Step 3.

- [ ] **Step 5: Write the README**

`README.md`:

```markdown
# biljetter-scraper

Crawls Tickster for Göteborg concerts and writes `../biljetter/lib/data/events.json`.

## Usage

    npm install
    npm run scrape     # full crawl, ~30 min cold, instant when cached
    npm test

## How it works

`fetch → parse → normalize → emit`. `fetch` caches every response under `.cache/`,
so re-runs cost nothing; delete it to force a fresh crawl. `parse` is pure and
tested against fixtures in `src/parse/fixtures/`. All judgement lives in
`normalize`, configured by `config/venues.json` and `config/genres.json`.

## Maintenance

Each run reports unmatched venue names and unmapped genre tags. Those two lists
are the maintenance surface — add entries to the configs as Tickster's free-text
venue records drift.

## Crawl policy

`tickster.com/robots.txt` sets `Crawl-delay: 2` and no `Disallow` rules. The
client enforces a 2000ms minimum between requests. Do not lower it.
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "Add CLI orchestration and seed venue aliases from a real run"
```

---

### Task 10: Consume the scraped data in biljetter

The only change to the web app. Adds a third source branch, keeping mock data as the fallback so the app still runs on a clean checkout with no `events.json`.

**Files:**
- Create: `biljetter/lib/data/scrapedEvents.ts`
- Modify: `biljetter/lib/data/repository.ts`
- Test: `biljetter/lib/data/scrapedEvents.test.ts`

**Interfaces:**
- Consumes: `events.json` written by Task 9; `EventWithRelations` from `biljetter/types`
- Produces: `loadScrapedEvents(): EventWithRelations[] | null`

- [ ] **Step 1: Add a test runner to biljetter**

`biljetter` has no test framework yet. Add vitest:

```bash
cd /c/Users/maxim/Documents/Github/biljetter
npm install -D vitest
```

Add to `package.json` scripts:

```json
"test": "vitest run"
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  test: { include: ['lib/**/*.test.ts'] },
  resolve: { alias: { '@': resolve(import.meta.dirname, '.') } },
})
```

- [ ] **Step 2: Write the failing test**

`lib/data/scrapedEvents.test.ts`:

The suite is skipped when `events.json` is absent, so a clean checkout without scraped data still has a green test run — the fallback to mock data is a supported state, not a failure.

```ts
import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { loadScrapedEvents } from './scrapedEvents'

const hasFile = existsSync(join(process.cwd(), 'lib/data/events.json'))

describe.skipIf(!hasFile)('loadScrapedEvents', () => {
  const events = loadScrapedEvents()

  it('returns events when events.json is present', () => {
    expect(events).not.toBeNull()
    expect(events!.length).toBeGreaterThan(0)
  })

  it('revives ISO date strings into Date objects', () => {
    expect(events![0].startTime).toBeInstanceOf(Date)
    expect(events![0].endTime).toBeInstanceOf(Date)
    expect(Number.isNaN(events![0].startTime.getTime())).toBe(false)
  })

  it('keeps relations intact', () => {
    const e = events![0]
    expect(e.venue.name).toBeTruthy()
    expect(e.artists.length).toBeGreaterThan(0)
    expect(e.genres.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `./scrapedEvents`

- [ ] **Step 4: Implement the loader**

`lib/data/scrapedEvents.ts`:

```ts
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
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test`
Expected: PASS, 3 tests

- [ ] **Step 6: Wire it into the repository switch**

In `lib/data/repository.ts`, add the import alongside the existing mock imports:

```ts
import { loadScrapedEvents } from './scrapedEvents'
```

`mockEvents.ts` is not touched — it stays a self-contained fixture. All four public functions gain a scraped-data branch ahead of their existing mock branch.

In `getEvents`, replace the block that currently begins `// Mock fallback — mirror the same filtering semantics.` with:

```ts
  // File fallback — real scraped events when present, else mock data.
  const scraped = loadScrapedEvents()
  let result = scraped ?? [...mockEvents]

  if (month) {
    const [year, monthNum] = month.split('-').map(Number)
    result = result.filter(
      (e) =>
        e.startTime.getFullYear() === year && e.startTime.getMonth() === monthNum - 1
    )
  }
  if (genres?.length) {
    result = result.filter((e) => e.genres.some((g) => genres.includes(g.slug)))
  }
  if (venues?.length) {
    result = result.filter((e) => venues.includes(e.venue.slug))
  }
  return result
```

This drops the `mockEventsByMonth` call in favour of one filter that serves both sources, so remove `getEventsByMonth as mockEventsByMonth` from the `./mockEvents` import or lint will flag it as unused.

In `getEventBySlug`, replace `return mockEventBySlug(slug) ?? null` with:

```ts
  const scraped = loadScrapedEvents()
  if (scraped) return scraped.find((e) => e.slug === slug) ?? null
  return mockEventBySlug(slug) ?? null
```

In `getAllVenues`, replace `return mockGetAllVenues()` with:

```ts
  const scraped = loadScrapedEvents()
  if (scraped) {
    const bySlug = new Map(scraped.map((e) => [e.venue.slug, e.venue]))
    return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name, 'sv'))
  }
  return mockGetAllVenues()
```

In `getAllGenres`, replace `return mockGetAllGenres()` with:

```ts
  const scraped = loadScrapedEvents()
  if (scraped) {
    const bySlug = new Map(
      scraped.flatMap((e) => e.genres.map((g) => [g.slug, g] as const))
    )
    return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name, 'sv'))
  }
  return mockGetAllGenres()
```

Deriving venues and genres from the events themselves means the filter dropdowns only ever offer options that have something behind them — which matters now that the venue list is real rather than curated.

- [ ] **Step 7: Verify the app serves real data**

```bash
npx tsc --noEmit
npm run dev
```

Open `http://localhost:3000` and confirm: events across all four venues, real Swedish descriptions in the drawer, working `Biljetter` links to `secure.tickster.com`, and images loading from `static.tickster.com`.

If images fail, add the remote host to `next.config.ts`:

```ts
const nextConfig = {
  images: { remotePatterns: [{ protocol: 'https', hostname: 'static.tickster.com' }] },
}
```

- [ ] **Step 8: Commit both repos**

```bash
cd /c/Users/maxim/Documents/Github/biljetter
git add -A
git commit -m "Serve real scraped Tickster events with mock data as fallback"
```

---

## Notes for the executor

- **Task 3 Step 2 is not optional.** The detail-page selectors in this plan are inferred from rendered text, not from verified DOM structure. Run the inspection step and correct the selectors before trusting the implementation.
- **The crawl delay is a commitment, not a setting.** Do not lower it to speed up development — delete `.cache/` only when you actually need fresh data.
- **`dropped (venue)` being large is correct.** The Göteborg feed is city-wide; four venues are a small slice of it.
- If Task 9 Step 4 shows few events carrying multiple artists, that answers open question 3 in the spec: `Framträdanden av` coverage is thin, and title-splitting needs its own follow-up task.
