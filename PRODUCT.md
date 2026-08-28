# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Swedish music fans in Göteborg looking for concerts to attend. They want to browse what's on across the city's venues without checking each venue's site individually, filter by genre or venue, and get through to tickets.

## Product Purpose

A concert/event calendar that aggregates gigs across Göteborg venues into a single, editorially-designed browsing experience (month grid, list, and masonry views). Success means a user can find a show worth going to and reach its ticket link with minimal friction.

## Positioning

The differentiator is editorial curation and design: a single, unified, well-designed view across all Göteborg venues, rather than raw per-venue listings or a generic aggregator UI. Spotify data (listener counts, artist images) is an enrichment layer, not the core pitch.

## Operating Context

- Real event data comes from a **separate scraper project**, not this repo. This app is read-only against a shared PostgreSQL database via Prisma; the Prisma schema is the contract between scraper and frontend.
- Göteborg venues in scope: Pustervik, Nefertiti, Trädgårn, Sticky Fingers, Musikens Hus, Way Out West (festival).
- Spotify Web API enrichment (artist images, follower counts) runs at seed time / nightly sync, never per-request.

## Capabilities and Constraints

- Views: month grid, list, masonry — all reading from the same event dataset.
- Filtering by genre and venue, plus month navigation (UI exists; store/query wiring is in progress — see CLAUDE.md implementation status).
- Zero scraping code lives in this repo.
- Tech stack (existing): Next.js 15 App Router, TypeScript, Tailwind v4 (no config file, CSS custom properties), Prisma + PostgreSQL (planned), Zustand + TanStack Query (installed, not yet wired).

## Evidence on Hand

- No real event data yet. `lib/data/mockEvents.ts` holds 25 mock events with dynamically generated current-month dates; this is the only data source until the scraper (separate repo, Phase 5/5b) ships. Future work must not present mock data as real and must not fabricate venue/artist facts beyond the venue list above.

## Product Principles

- Curation and editorial presentation are the product, not a skin on a generic listings aggregator.
- Never build ahead of real data by faking it — mock data is clearly a placeholder for development, not a substitute for the real pipeline.
- Keep this repo read-only against event data; scraping/ingestion logic belongs in the separate scraper project.
- Swedish-first UI language, Göteborg-first scope — do not casually generalize to other cities or languages without an explicit decision.

## Accessibility & Inclusion

Standard WCAG AA baseline: reasonable contrast, keyboard navigation, semantic markup. No further product-specific requirement established yet.
