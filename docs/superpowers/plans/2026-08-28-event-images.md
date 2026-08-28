# Event Images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make event images actually appear in the app, at a resolution that suits the layouts, using the images Tickster already gives us.

**Architecture:** Two independent fixes. The scraper emits a larger image URL from Tickster's existing CDN transform; the app stops looking for the image on the wrong object. No new crawling, no new hosting.

**Tech Stack:** Existing — `biljetter-scraper` (TypeScript, cheerio, vitest) and `biljetter` (Next.js 15, plain `<img>` tags).

**Spec:** `docs/superpowers/specs/2026-08-28-tickster-scraper-design.md` (source analysis and crawl policy)

---

## Context: what is actually wrong

Two separate problems, discovered 2026-08-28. Both must be fixed for any image to appear.

**1. The app looks for images on the wrong object — this is why nothing renders today.**

Every component reads `artist.imageUrl`:

- `components/calendar/EventDrawer.tsx:96` — `artist?.imageUrl &&`
- `components/calendar/DayListPanel.tsx:62` — `artist?.imageUrl ?`
- `components/calendar/ListView.tsx:39` — `artist?.imageUrl &&`
- `components/calendar/MasonryView.tsx:30` — `artist?.imageUrl ?`
- `components/search/SearchPopover.tsx:107` — `artist?.imageUrl &&`

The scraper populates `event.imageUrl` and leaves `Artist.imageUrl` undefined. Measured on the current dataset: **227 of 227 events have an image; 0 of 260 artist entries do.** The mock data worked because `mockEvents.ts` synthesises an `imageUrl` onto its artists.

**2. The images we do have are thumbnails.**

Every URL is Tickster's Cloudflare transform at 240×134:

```
https://static.tickster.com/cdn-cgi/image/format=auto,width=240,height=134,fit=scale-down/fb/5e9a…
```

That is far too small for the layouts, which want:

| Component | Rendered size |
|---|---|
| `EventDrawer` | full drawer width × 360px |
| `DayListPanel` | full column width × 264px |
| `MasonryView` | full card, `object-cover`, scales 105% on hover |
| `SearchPopover` | 98×98 square |
| `ListView` | fills its container, `object-cover` |

Measured payloads for the same image:

| URL | Type | Size |
|---|---|---|
| `…width=240,height=134,fit=scale-down/<hash>` | JPEG | 8.9 KB |
| `…width=800/<hash>` | JPEG | ~70 KB |
| `…width=1200/<hash>` | JPEG | 144 KB |
| `static.tickster.com/<hash>` (origin, untransformed) | **PNG** | **2.4 MB** |

The origin is unusable directly. The transform is the right mechanism regardless of size chosen.

## The hosting question — read before starting

`www.tickster.com/robots.txt` allows crawling with `Crawl-delay: 2`, which is what the scraper relies on. **`static.tickster.com/robots.txt` does not:**

```
User-agent: *
Disallow: /
```

So bulk-downloading these images with a bot in order to re-host them is crawling a host that disallows it. This plan therefore **does not download images**. It emits URLs, and the viewer's browser loads them — which is an ordinary page resource load, not crawling.

That is a deliberate limitation, not an oversight. Self-hosting is the better end state (it removes a third-party dependency and stops leaning on someone else's bandwidth), but it needs Tickster's permission. Fold that request into the API-key conversation: ask about image rights and hosting at the same time. Until then, hotlinking the transform is the honest option.

## Global Constraints

- **No new crawling.** Do not fetch anything from `static.tickster.com` in a script. Emit URLs only.
- **Do not change the `Crawl-delay: 2` behaviour** in the scraper's client.
- **Claude is not an author of commits** in either repo. No `Co-Authored-By` lines.
- **Components use plain `<img>`, not `next/image`** — confirmed, there is no `next/image` import anywhere. No `remotePatterns` config is needed, and none should be added.
- The app must still work on mock data when `lib/data/events.json` is absent.

---

### Task 1: Emit a usable image size from the scraper

**Files:**
- Modify: `biljetter-scraper/src/parse/listing.ts`
- Test: `biljetter-scraper/src/parse/listing.test.ts`

**Interfaces:**
- Consumes: nothing new
- Produces: `EventRef.imageUrl` at a render-appropriate width; exported `upscaleImageUrl(url: string, width: number): string`

- [ ] **Step 1: Write the failing test**

Append to `src/parse/listing.test.ts`:

```ts
import { upscaleImageUrl } from './listing.js'

describe('upscaleImageUrl', () => {
  const thumb =
    'https://static.tickster.com/cdn-cgi/image/format=auto,width=240,height=134,fit=scale-down/fb/5e9a'

  it('replaces the thumbnail dimensions with the requested width', () => {
    const big = upscaleImageUrl(thumb, 800)
    expect(big).toContain('width=800')
    expect(big).not.toContain('width=240')
    expect(big).not.toContain('height=134')
  })

  it('keeps the image hash path untouched', () => {
    expect(upscaleImageUrl(thumb, 800)).toMatch(/\/fb\/5e9a$/)
  })

  it('keeps format=auto so the CDN can serve webp', () => {
    expect(upscaleImageUrl(thumb, 800)).toContain('format=auto')
  })

  it('leaves a URL it does not recognise alone', () => {
    const other = 'https://example.test/poster.jpg'
    expect(upscaleImageUrl(other, 800)).toBe(other)
  })
})
```

Then change the existing listing assertion to expect the larger size — find the test block for `parseListing` and add:

```ts
  it('emits images at a size the layouts can use, not the 240px thumbnail', () => {
    const withImage = refs.filter((r) => r.imageUrl)
    expect(withImage.length).toBeGreaterThan(0)
    for (const ref of withImage) {
      expect(ref.imageUrl).toContain('width=800')
    }
  })
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd biljetter-scraper && npm test -- listing`
Expected: FAIL — `upscaleImageUrl` is not exported.

- [ ] **Step 3: Implement**

In `src/parse/listing.ts`, add near the top:

```ts
/** Width to request from Tickster's CDN. Covers the largest layout (the drawer). */
const IMAGE_WIDTH = 800

/** Matches Cloudflare's transform segment: `/cdn-cgi/image/<options>/<path>`. */
const CDN_TRANSFORM = /(\/cdn-cgi\/image\/)([^/]+)(\/)/

/**
 * Tickster's listing markup hardcodes a 240x134 thumbnail, which is far too
 * small for a 360px-tall drawer or a full-bleed masonry card. The path after
 * the options segment is the real image, so asking the same CDN for a larger
 * render costs us nothing and needs no download.
 *
 * Height is dropped deliberately: the layouts crop with `object-cover`, so a
 * width-constrained render preserves the aspect ratio and lets each component
 * decide its own crop.
 */
export function upscaleImageUrl(url: string, width: number = IMAGE_WIDTH): string {
  return url.replace(CDN_TRANSFORM, `$1format=auto,width=${width}$3`)
}
```

Then in the `refs.push({ ... })` call, wrap the image:

```ts
      imageUrl: (() => {
        const src = tile.find('img.c-avatar').attr('data-src')
        return src ? upscaleImageUrl(src) : undefined
      })(),
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd biljetter-scraper && npm test -- listing`
Expected: PASS

- [ ] **Step 5: Regenerate the dataset**

The cache holds the listing HTML, so this re-parses without any new requests:

```bash
cd biljetter-scraper && npm run scrape
```

Expected: 227 events emitted, no WARNING about a drop.

- [ ] **Step 6: Verify the emitted URLs**

```bash
cd biljetter-scraper && node -e "
const d=require('../biljetter/lib/data/events.json');
const u=d.events.map(e=>e.imageUrl).filter(Boolean);
console.log('with image:', u.length, 'of', d.events.length);
console.log('at width=800:', u.filter(x=>x.includes('width=800')).length);
console.log(u[0]);
"
```

Expected: 227 of 227, all at `width=800`.

- [ ] **Step 7: Commit**

```bash
cd biljetter-scraper
git add -A
git commit -m "Request render-sized images from Tickster's CDN, not 240px thumbnails"
```

---

### Task 2: Make the app read the event image

The fix that actually puts pixels on screen. One helper, used by all five components, so the fallback rule lives in one place.

**Files:**
- Create: `biljetter/lib/utils/eventImage.ts`
- Test: `biljetter/lib/utils/eventImage.test.ts`
- Modify: `biljetter/components/calendar/EventDrawer.tsx:96-101`
- Modify: `biljetter/components/calendar/DayListPanel.tsx:62-67`
- Modify: `biljetter/components/calendar/ListView.tsx:39-44`
- Modify: `biljetter/components/calendar/MasonryView.tsx:30-35`
- Modify: `biljetter/components/search/SearchPopover.tsx:107-112`

**Interfaces:**
- Consumes: `EventWithRelations` from `@/types`
- Produces: `eventImage(event: EventWithRelations): { src: string; alt: string } | null`

- [ ] **Step 1: Write the failing test**

`lib/utils/eventImage.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { eventImage } from './eventImage'
import type { EventWithRelations } from '@/types'

function ev(overrides: Partial<EventWithRelations> = {}): EventWithRelations {
  return {
    title: 'Atomic Swing + Popsicle',
    artists: [],
    ...overrides,
  } as EventWithRelations
}

describe('eventImage', () => {
  it('prefers a real artist portrait when one exists', () => {
    const e = ev({
      artists: [{ id: 'a1', name: 'Atomic Swing', slug: 'atomic-swing', imageUrl: '/artist.png' }],
      imageUrl: '/poster.jpg',
    })
    expect(eventImage(e)).toEqual({ src: '/artist.png', alt: 'Atomic Swing' })
  })

  it('falls back to the event poster, which is what Tickster gives us', () => {
    const e = ev({
      artists: [{ id: 'a1', name: 'Atomic Swing', slug: 'atomic-swing' }],
      imageUrl: '/poster.jpg',
    })
    expect(eventImage(e)).toEqual({ src: '/poster.jpg', alt: 'Atomic Swing + Popsicle' })
  })

  it('uses the event title as alt text when there is no artist at all', () => {
    expect(eventImage(ev({ imageUrl: '/poster.jpg' }))?.alt).toBe('Atomic Swing + Popsicle')
  })

  it('returns null when there is no image anywhere, so callers can render a placeholder', () => {
    expect(eventImage(ev())).toBeNull()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test`
Expected: FAIL — cannot resolve `./eventImage`

- [ ] **Step 3: Implement the helper**

`lib/utils/eventImage.ts`:

```ts
import type { EventWithRelations } from '@/types'

/**
 * Picks the image to show for an event, and the alt text that goes with it.
 *
 * An artist portrait wins when we have one — that is the editorial ideal, and
 * it is what Spotify enrichment will eventually supply. Scraped events have no
 * portrait, only the promoter's poster on `event.imageUrl`, so that is the
 * fallback. Alt text follows the image: a portrait is of the artist, a poster
 * is of the event.
 *
 * Returns null rather than an empty src so callers render their placeholder
 * instead of a broken image.
 */
export function eventImage(
  event: EventWithRelations
): { src: string; alt: string } | null {
  const artist = event.artists?.[0]

  if (artist?.imageUrl) return { src: artist.imageUrl, alt: artist.name }
  if (event.imageUrl) return { src: event.imageUrl, alt: event.title }

  return null
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test`
Expected: PASS, 4 new tests

- [ ] **Step 5: Rewrite each component to use it**

In each of the five files, add the import:

```ts
import { eventImage } from '@/lib/utils/eventImage'
```

Then replace the image block. The existing shape is always `artist?.imageUrl && <img src={artist.imageUrl} alt={artist.name} className="…" />` — keep the exact `className` each file already has, change only the condition and the two attributes. Introduce a local first:

```tsx
const image = eventImage(event)
```

`EventDrawer.tsx:96-101` becomes:

```tsx
          {image && (
            <img
              src={image.src}
              alt={image.alt}
              className="w-full h-full object-cover"
            />
          )}
```

`DayListPanel.tsx:62-67` keeps its ternary and its existing `:` branch:

```tsx
                        {image ? (
                          <img
                            src={image.src}
                            alt={image.alt}
                            loading="lazy"
                            className="w-full h-full object-cover"
                          />
                        ) : (
```

`ListView.tsx:39-44`:

```tsx
        {image && (
          <img
            src={image.src}
            alt={image.alt}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        )}
```

`MasonryView.tsx:30-35` keeps its ternary:

```tsx
      {image ? (
        <img
          src={image.src}
          alt={image.alt}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
```

`SearchPopover.tsx:107-112`:

```tsx
                    {image && (
                      <img
                        src={image.src}
                        alt={image.alt}
                        loading="lazy"
                        className="size-full object-cover group-hover:opacity-80 transition-opacity"
                      />
                    )}
```

`loading="lazy"` is added to the four list/grid contexts because a month of masonry cards is ~30 images at ~70 KB. It is deliberately **not** added in `EventDrawer`, which shows one image the user just asked to see.

In each file, `image` must be computed where `artist` currently is — inside the per-event component or map callback, not at the top of the file.

- [ ] **Step 6: Verify it typechecks and lints**

```bash
npx tsc --noEmit
npm run lint
```

Expected: clean typecheck; lint shows only the five pre-existing `no-img-element` warnings, zero errors.

- [ ] **Step 7: Verify in the running app**

```bash
npm run dev
```

Open `http://localhost:3000` and check all four views plus search. Confirm images appear in month grid, list, masonry, the drawer, and the search popover — and that they are sharp rather than upscaled 240px mush.

If `artist` is now an unused variable in any component, remove it; if it is still used for the name or link, leave it.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "Show event images by falling back from artist portrait to event poster"
```

---

### Task 3: Handle the events with no usable image

Currently every scraped event has an image, so this is about not regressing when one does not — and about what the placeholder looks like.

**Files:**
- Modify: whichever of the five components lack a placeholder branch
- Test: covered by Task 2's `returns null` case

- [ ] **Step 1: Audit the placeholder branches**

```bash
grep -n "imageUrl\|image &&\|image ?" components/calendar/*.tsx components/search/*.tsx
```

`DayListPanel` and `MasonryView` already have `:` branches. `EventDrawer`, `ListView`, and `SearchPopover` use `&&`, so they render an empty box.

- [ ] **Step 2: Give the three `&&` cases a real placeholder**

Their containers already have a tinted background (`bg-[#363447]/10`, `bg-foreground-secondary/10`), so an empty box is not broken — just blank. Add the event title, centred and muted, so the space reads as intentional:

```tsx
        {image ? (
          <img src={image.src} alt={image.alt} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-4">
            <span className="text-xs uppercase tracking-wider text-muted text-center">
              {event.title}
            </span>
          </div>
        )}
```

Match each file's existing class conventions rather than copying these verbatim.

- [ ] **Step 3: Verify**

Temporarily blank one event's image to see the placeholder:

```bash
node -e "
const fs=require('fs');const p='lib/data/events.json';
const d=JSON.parse(fs.readFileSync(p,'utf8'));
delete d.events[0].imageUrl;
fs.writeFileSync(p, JSON.stringify(d,null,2)+'\n');
console.log('blanked:', d.events[0].title);
"
```

Check that event in the app, then restore:

```bash
cd ../biljetter-scraper && npm run scrape
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "Render the event title when no image is available"
```

---

## Deferred: self-hosting the images

Not part of this plan, recorded so it is not lost.

Hotlinking works and is honest, but it leaves the app dependent on Tickster's CDN and on URLs that could change. Self-hosting would fix both. It requires permission, because `static.tickster.com` disallows crawlers.

When requesting the Tickster API key, ask in the same message:

1. May we cache and re-host event images for a Göteborg concert calendar that links back to Tickster checkout?
2. Does the Event dump or Event API expose image URLs and their licensing?

If permission is granted, the work is: download at build time into `public/images/events/<event-code>.jpg`, keyed by the Tickster event code so re-runs are idempotent; emit the local path; keep the remote URL as a fallback for anything missing.

A separate future source is Spotify artist images, already the documented plan for `Artist.imageUrl`. Note its ceiling: only about 45 of 227 events carry a structured lineup, and titles like `APHUSET + APA GBG` will not match a Spotify artist. Spotify improves the best events, it does not cover the catalogue — so the poster fallback stays either way.

## Notes for the executor

- **Task 2 is the one that matters.** Task 1 alone changes nothing visible: the app is not reading `event.imageUrl` at all today. If you only have time for one, do Task 2.
- **Do not add `next/image`.** There is none in the codebase, and adding it pulls in `remotePatterns` config and a different optimisation path for no benefit here.
- **Do not download from `static.tickster.com`.** See the hosting question above.
- If `width=800` proves heavy on the masonry view, the cheap next step is a second smaller URL for grid contexts rather than a build-time pipeline — `upscaleImageUrl` already takes a width.
