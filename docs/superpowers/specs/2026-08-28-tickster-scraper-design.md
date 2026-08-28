# Design — Tickster scraper (`biljetter-scraper`)

**Date**: 2026-08-28
**Status**: Approved design, not yet implemented

## Purpose

Produce real Göteborg concert data for the Biljetter calendar, so the app stops
running on mock events. The immediate driver is credibility: a working site
showing real programming across four venues is a materially stronger position
from which to request a Tickster API key than a site full of placeholder data.

The scraper is a **bridge, not the destination**. Tickster publishes a proper
Event API and a daily bulk Event dump. Access requires manual approval, which has
a lead time. This scraper covers that gap and doubles as a rehearsal for the API
integration: same venues, same normalization rules, same output shape.

## Scope

**In scope**

- A new sibling repository `biljetter-scraper`, independent of the web app
- Crawling `tickster.com` Göteborg listings and event detail pages
- Normalizing into the `EventWithRelations` shape defined by `prisma/schema.prisma`
- Emitting `lib/data/events.json` into the `biljetter` repo, committed as data

**Out of scope**

- Any scraping code inside `biljetter` (the app stays read-only over data)
- Spotify enrichment (write-side, later, in this same repo)
- A live database (JSON output only for now; DB seeding is a later addition)
- Venues that do not sell via Tickster (Way Out West, Sticky Fingers → Ticketmaster)

## Source analysis (verified 2026-08-28)

`tickster.com/robots.txt` contains a `Sitemap` line and:

```
User-agent: *
Crawl-delay: 2
```

No `Disallow` rules. Crawling is permitted; a 2-second delay between requests is
mandatory and non-negotiable for this project — we are about to ask this company
for API access, and our crawl behaviour is part of that conversation.

### Listing page — `/se/sv/events/in/göteborg`

Server-rendered HTML, roughly 700–800 Göteborg events. Paginated via
`?skip=N&take=M`. Each event is one `div.c-tile[data-requestcode]` containing:

| Field | Location |
|---|---|
| Event code | `data-requestcode` attribute |
| Detail URL | `a.c-tile__head[href]` — format `/se/sv/events/{code}/{YYYY-MM-DD}/{slug}` |
| **Date** | Embedded in the detail URL path — no Swedish date parsing needed |
| Title | `h2.c-tile__title` (whitespace-padded, needs trimming) |
| Date + venue + city | `span.c-tile__label` — e.g. `28 aug 2026, Pustervik, Göteborg` |
| Image | `img.c-avatar[data-src]` — `static.tickster.com` CDN, resizable via `cdn-cgi/image/...` params |
| Ticket URL | Buy button `href` — `https://secure.tickster.com/sv/{lowercased-code}` |

### Detail page — `/se/sv/events/{code}/{date}/{slug}`

Confirmed present in page content. DOM selectors are to be pinned during
implementation — only the rendered text was verified, not the element structure.

- Full date, e.g. `Fredag den 28 augusti 2026`
- Door time (`Startar 28 aug 19:00`) and stage time (`På scen: 20.00`)
- **`Framträdanden av: <artist>, <artist>`** — a structured lineup, separate from
  the title. This is the single most valuable field on the page: it removes the
  need to split titles like `Atomic Swing + Popsicle` or
  `Hannah Juanita & the Hardliners + Support: Folks` with heuristics.
- Genre tags, e.g. `Rock`, `Pop`, `Konsert`
- Age limit, e.g. `Åldersgräns: 18 år`
- Organizer, e.g. `FKP Scorpio & Pustervik`
- Full Swedish editorial description — several paragraphs, suitable for the
  drop-cap description block in `EventDrawer`

**Not available**: `price`. It sits behind the purchase flow. `Event.price` will
be left null; the UI already tolerates this, since mock data includes free events
with no price.

## Architecture

Four stages, each independently testable, communicating through plain data:

```
fetch → parse → normalize → emit
```

**`fetch`** — HTTP with a 2s delay between every request, an identifying
User-Agent, retry with backoff on 5xx, and an on-disk response cache keyed by URL
so re-runs during development do not re-hit Tickster. The cache is what makes the
crawl delay tolerable to work with.

**`parse`** — HTML → `RawEvent`, a flat record of strings exactly as they appear
on the page. No interpretation, no mapping. A pure function over an HTML string,
which makes it testable against saved fixture files.

**`normalize`** — `RawEvent[]` → `{ events, venues, artists, genres }` matching
the Prisma schema. This is where every judgement call lives, and where the
project's real complexity is.

**`emit`** — write `events.json` to a configured path in the `biljetter` repo.

### Normalization rules

**Venue canonicalization.** Tickster venue records are free text per organizer, so
one real venue appears under many codes and spellings. Trädgår'n alone has at
least six (`bmv7kd1a65pgjkd`, `c2a13v5dnwltmej`, `6whfhwnby97zxnx`,
`za2pj57xungd6p4`, plus separate Nattklubb and Restaurang records); Musikens Hus
has three. This is handled by an explicit **alias map committed as a data file**,
not as code:

```
venues.config.json
  "tradgarn": {
    canonical: { name: "Trädgår'n", address: "Nya Allén 11", city: "Göteborg", ... },
    aliases: ["Trädgår'n", "TRÄDGÅR'N", "Trädgår´n", "Trädgår'n Nattklubb", ...]
  }
```

Any raw venue name matching no alias is **reported, not silently dropped**. The
run prints unmatched venue names with event counts, which is how new venue records
get discovered. Under-reporting is this scraper's most dangerous failure mode
precisely because it looks like success, so unmatched venues must be loud.

**Venue scope.** Only the four Tickster venues are emitted: Pustervik, Nefertiti,
Trädgår'n, Musikens Hus. Everything else in the Göteborg feed is filtered out but
counted in the run report.

**Genre mapping.** Tickster tags map to the ten existing `Genre` slugs in
`mockEvents.ts` (rock, electronic, jazz, indie, folk, hip-hop, metal, soul,
country, ovrigt). Structural tags such as `Konsert` are dropped, not mapped.
Unmapped tags fall through to `ovrigt` and are reported, same as venues.

**Non-music filtering.** The Göteborg feed carries ölprovning, afterwork events,
and boat tours. Filtering is by venue first, which removes most of it, then by
dropping events whose only genre tag is non-musical.

**Artists.** Taken from `Framträdanden av` where present; fall back to the event
title when absent. Deduplicated by slug across the whole run so one `Artist` row
is shared across events. `spotifyId` and related fields stay null — that is a
later enrichment pass, and it belongs in this repo, not in the web app.

**Status.** `upcoming` for future dates, `past` for elapsed ones. Cancellation
detection is unresolved: venue sites prefix titles with `Inställt`, but whether
Tickster exposes cancellation is not yet verified. Until it is, no event is
marked `cancelled`.

**Slugs.** Reuse the exact `slugify` from `lib/data/mockEvents.ts`, which handles
å/ä/ö, so slugs stay stable across the mock-to-real transition and existing
`/event/[slug]` URLs behave identically.

## Handoff contract

The scraper writes `lib/data/events.json` into the `biljetter` working tree, and
the file is committed there as data. `biljetter` gains a small loader that reads
it in place of `mockEvents`, behind the existing `lib/data/repository.ts` switch,
so source precedence becomes:

```
DATABASE_URL set    →  Postgres
events.json present →  real scraped data
otherwise           →  mockEvents
```

This keeps the app's read-only posture, requires no infrastructure, and means the
later move to Postgres changes only which branch of an existing switch is taken.

## Error handling

- A single event's detail page failing must not abort the run. Log it, skip it,
  continue, and include it in the final report.
- The run ends with a summary: events found, emitted, skipped, unmatched venues,
  unmapped genres. A run emitting fewer events than the previous run should say so
  prominently.
- Never write a partial `events.json`. Build the full dataset in memory, write once.

## Testing

- `parse` is tested against committed HTML fixtures: one listing page, and several
  detail pages including a multi-artist bill and an event with no
  `Framträdanden av`. No network access in tests.
- `normalize` is tested on hand-written `RawEvent` fixtures, particularly venue
  alias matching, the Trädgår'n multi-code case, and genre fallthrough.
- One opt-in integration test that hits Tickster, run manually, never in CI.

## Open questions

1. Does Tickster mark cancelled events, and how?
2. Is `price` reachable anywhere without entering the purchase flow?
3. How many of the four venues' events actually carry `Framträdanden av`? If
   coverage is poor, title-splitting returns as a real problem.

All three are answerable during implementation of `parse`, against real fixtures,
and none should block starting.

## Future

When the Tickster API key is approved, the `fetch` and `parse` stages are replaced
by a dump reader; `normalize` and `emit` carry over unchanged. That is the point
of the stage boundary. Spotify enrichment then slots in as a fifth stage between
`normalize` and `emit`, and Ticketmaster becomes a second source feeding the same
`normalize`, covering Way Out West and Sticky Fingers.
