---
name: biljetter
description: Editorial concert calendar for Göteborg — a nightly arts-desk dispatch on warm newsprint paper
colors:
  ink: "#0F0F0F"
  masthead-indigo: "#363447"
  poster-red-orange: "#DD4829"
  dusty-blush: "#E5CBC6"
  newsprint-cream: "#F9F7F1"
  wire-grey: "#9E9E9E"
  hairline-grey: "#D4D4D4"
  bright-white: "#FFFFFF"
typography:
  display:
    fontFamily: "Cinzel, serif"
    fontSize: "3.125rem"
    fontWeight: 400
    letterSpacing: "0.04em"
  headline:
    fontFamily: "Cormorant Garamond, serif"
    fontSize: "80px"
    fontWeight: 700
    lineHeight: 1
  stat:
    fontFamily: "Spectral, serif"
    fontSize: "20px"
    fontWeight: 700
  label:
    fontFamily: "Montserrat, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    letterSpacing: "0.02em"
  mono:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: "16px"
    fontWeight: 400
  button:
    fontFamily: "Crimson Text, serif"
    fontSize: "16px"
    fontWeight: 600
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "16px"
    fontWeight: 400
rounded:
  none: "0px"
  sheet: "16px"
  pill: "9999px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "32px"
  xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.newsprint-cream}"
    rounded: "{rounded.none}"
    padding: "11px 42px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "11px 42px"
  button-secondary-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.newsprint-cream}"
  toggle-active:
    backgroundColor: "{colors.dusty-blush}"
    textColor: "{colors.poster-red-orange}"
---

# Design System: biljetter

## Overview

**Creative North Star: "The Late Edition"**

biljetter reads as a nightly arts-desk dispatch on Göteborg's concert scene rather than a generic ticketing aggregator — the point of the product, per PRODUCT.md, is that editorial curation and presentation *are* the value, not a skin on raw listings. That newspaper gravity shows up everywhere: a ceremonial all-caps Cinzel masthead for the month title, a large serif (Cormorant Garamond) carrying artist names and day numbers the way a broadsheet carries a byline, drop-capped body copy in event descriptions, and a warm off-white "newsprint" page rather than clinical white. Photography carries a constant, subtle film-grain overlay, and hairline rules (not shadows or cards) do the job of separating sections — the same restraint a printed page uses.

Color is used the way a paper uses its one spot color: almost never, and always meaningfully. Poster Red-Orange is reserved for calls to action, Saturday (the big-gig night), the "today" marker, and a couple of signature accents in the bottom-sheet rail — everywhere else the page is ink-on-cream.

**Key Characteristics:**
- Warm, paper-toned neutral palette; ink-black text, not pure black-on-white
- A six-voice type system, each font doing one job consistently (see Typography)
- Hairline borders as the primary structural device; flat by default
- Constant film-grain texture over every photographic surface
- Accent color used sparingly and with intent (CTAs, Saturday, "today", selection)
- No page chrome beyond what's needed — content and whitespace carry the design

## Colors

A warm, restrained palette: cream paper, ink text, one poster-red accent, and a deep indigo-slate for secondary text and hairlines.

### Primary
- **Poster Red-Orange** (`#DD4829`): The single spot color. Used only for CTAs and interactive affordances that need to stand out — primary/hover states, the Saturday column (both header and day numbers) in the calendar grid, the "today" ring, and artist names in the bottom-sheet day rail. Its rarity is what makes it register.

### Secondary
- **Dusty Blush** (`#E5CBC6`): A soft tint, not a second accent — used as the active-state fill behind the view toggle buttons, paired with Poster Red-Orange text/border. Signals "selected" without competing with the primary accent.

### Neutral
- **Newsprint Cream** (`#F9F7F1`): Page background. Warm off-white, never pure white — this is the "paper."
- **Ink** (`#0F0F0F`): Primary text and the fill for solid primary buttons.
- **Masthead Indigo** (`#363447`): Secondary text, metadata, and most hairline dividers/borders (list section rules, drag handle, day-rail underlines). A deep indigo-slate rather than a true grey — it's what gives the neutral text its slightly cool, inky character against the warm background.
- **Wire Grey** (`#9E9E9E`): Muted/tertiary text (e.g. empty-state copy).
- **Hairline Grey** (`#D4D4D4`): Lighter structural borders (calendar cell tokens; currently underused relative to Masthead Indigo, which carries most dividers in shipped UI).
- **Bright White** (`#FFFFFF`): Reserved for true white surfaces; the shipped UI mostly uses Newsprint Cream instead, so treat this as available but rarely the right choice.

### Named Rules
**The One Spot-Color Rule.** Poster Red-Orange appears only on things that are actionable or time-sensitive (buttons, Saturday, today, selection) — never as decoration. If a new element wants red-orange "for emphasis" without one of those jobs, it's the wrong color.

## Typography

**Display Font:** Cinzel (ceremonial, all-caps use only)
**Headline Font:** Cormorant Garamond (with Georgia, serif fallback)
**Stat Font:** Spectral (with Georgia, serif fallback)
**Label Font:** Montserrat (with system sans fallback)
**Mono/Data Font:** IBM Plex Mono
**Button Font:** Crimson Text
**Body Font:** Inter (default page sans; lightly used since most reading copy runs in Cormorant instead)

**Character:** Six fonts, six fixed jobs — this is not a decorative pairing so much as a small, disciplined system where switching typeface *is* the signal for switching content type (masthead vs. name vs. stat vs. label vs. data vs. CTA).

### Hierarchy
- **Display — Cinzel** (400, 50px/3.125rem, uppercase, 0.04em tracking): The month/year masthead only. Never used for anything else.
- **Headline — Cormorant Garamond** (700, ranges 32px–80px depending on context, tight leading): Artist names, calendar day numbers, list day headers, the event-drawer title. This is the "who and when" voice.
- **Stat — Spectral** (600–800, 16–34px): Listener counts, the day-rail's big day label, masonry card artist name. The "data-that-matters-to-a-fan" voice — slightly heavier than Headline, used for numbers and rail labels rather than running text.
- **Label — Montserrat** (500–700, 12–18px, sometimes uppercase/tracked): Calendar weekday headers, venue names, footer links, masonry card date. The small, quiet UI-label voice.
- **Mono — IBM Plex Mono** (400–500, 11–16px): Filter dropdowns and their labels, the "Idag" button, all search UI (input, results, popular-search chips, empty state). The mono face marks "this is an interactive control or raw data," consistently.
- **Button — Crimson Text** (600, 16px, capitalize): The "Biljetter" CTA label only, both solid and outlined variants. A single dedicated voice for the one action that matters most (buying a ticket).

### Named Rules
**The One Job Per Face Rule.** Each of the six fonts has exactly one job (masthead / name-or-number / stat / label / control / CTA). Don't borrow a font for a new job just because it "looks nice" there — introduce a role decision instead.

## Layout

Content-width flows edge-to-edge within the page container; there is no card-grid chrose — the calendar grid, list, and masonry views are the three top-level layouts, switched via `ViewToggle`, all reading from the same event set.

- **Calendar grid**: 7 equal columns, week rows separated by full-width 2px hairlines (`WeekSeparator`). Cells are generously padded (see recent padding pass) and grow to fit however many events land on a date rather than clipping or scrolling — a day with several gigs is simply a taller cell.
- **List view**: Grouped by date; each day section is bounded top and bottom by a hairline (`border-foreground-secondary`) plus a left vertical rule, with a fixed 86px left indent for the event rows — a deliberate "ledger column" the reading content sits inside.
- **Masonry/grid view**: Three flex columns, events distributed round-robin, card heights cycling through a fixed pattern (160–400px) for an organic bento rhythm rather than a strict grid.
- **Bottom sheet (event detail)**: Not a side drawer — a full-width sheet that slides up from the bottom over a scrim, with a day-list rail alongside on very wide screens (≥1440px) and just the detail panel on narrower ones. Both panels cap at 85vh and scroll internally.
- **Search**: A fixed-position icon (top-left) that expands into a popover in place, rather than a full-width search bar — keeps the page layout otherwise undisturbed.

Responsive behavior is currently narrow-scoped: the day-list rail's ≥1440px breakpoint is the one explicit responsive rule observed; the rest of the mobile/tablet story is still open per CLAUDE.md's Phase 7.

## Elevation & Depth

At present the system is flat by default: most surfaces sit directly on the page with a 1px hairline border doing the separation work instead of a shadow, and there's effectively no border-radius outside a few soft affordances (drag handle, "today" ring, search-term pills, the bottom sheet's top corners). Shadow currently appears only on the two floating/overlay surfaces — the bottom sheet (`0 -8px 32px rgba(0,0,0,0.10), 0 -2px 8px rgba(0,0,0,0.06)`, a soft upward glow) and the search popover (a five-layer soft downward shadow) — never on things at rest in the page flow (cards, cells, list rows).

This reads as intentional in spirit but is still evolving in practice, so treat it as the current baseline to extend consistently rather than a locked doctrine: new floating UI should probably follow the same "shadow only when it's overlaying the page" instinct, but that's a description of what's shipped, not yet a hard rule to cite.

### Shadow Vocabulary
- **Sheet-rise** (`0 -8px 32px rgba(0,0,0,0.10), 0 -2px 8px rgba(0,0,0,0.06)`): The bottom sheet drawer.
- **Popover-drop** (`0px 33px 32.5px rgba(0,0,0,0.08), 0px 23px 13px rgba(0,0,0,0.06), 0px 15px 7px rgba(0,0,0,0.04), 0px 9px 4px rgba(0,0,0,0.03), 0px 4px 2px rgba(0,0,0,0.02)`): The search popover.

## Shapes

Sharp rectangles by default — buttons, filter selects, calendar cells, list images, and masonry cards all have zero border-radius. Roundness is reserved for a small set of soft, hand-like affordances: the bottom sheet's top corners (16px), the drag handle and "today" ring (fully round), and the search popover's "popular search" chips (22px). As with Elevation, this split (sharp structure vs. a few round affordances) reads as a real pattern in the shipped UI but hasn't been confirmed as a permanent constraint — extend it by default, but it's not yet a named rule to enforce against.

## Components

### Buttons
- **Shape:** No radius (0px), sharp rectangle.
- **Primary (solid):** Ink (`#0F0F0F`) background, Newsprint Cream text, Crimson Text 600 16px, capitalize, generous padding (`11px 42px`). Used for the main "Biljetter" CTA at the top of the event drawer.
- **Secondary (outline):** Transparent background, 1px ink border, same type. On hover, inverts to filled ink/cream — used for the repeated "Biljetter" CTA in list cards and the bottom of the event drawer.
- **Ghost/icon:** Plain icon with color-only hover (foreground → accent, plus a faint background tint on press) — month-navigation arrows, search icon, drawer close.
- **Toggle group (view switcher):** Bordered squares in a connected row; active state is Dusty Blush fill + Poster Red-Orange border/icon — a tint, not a solid fill, distinguishing "selected" from "hovered."

### Chips
- **Style:** Border-only pill (22px radius), ink text on cream, hover inverts to filled ink/cream. Used for "popular searches" in the search popover.

### Cards / Containers
- **Corner Style:** 0px (sharp) for grid cells, list images, masonry cards; 16px only on the bottom sheet's top edge.
- **Background:** Newsprint Cream or the photo itself; no separate "card" surface color from the page.
- **Shadow Strategy:** None at rest — see Elevation & Depth. Only the bottom sheet and search popover carry shadow.
- **Border:** 1px, mostly Masthead Indigo (dividers/rules) rather than Hairline Grey.
- **Internal Padding:** Calendar cells `16px`; list/drawer content commonly indents `86px` on the left as a deliberate "ledger" margin, not a generic spacing-scale step.

### Inputs / Fields
- **Style:** No border box — filter `<select>`s use a bottom-line-free bordered rectangle (1px ink border, sharp corners); the search input is borderless with just a bottom hairline under the whole input row. Both run in IBM Plex Mono.
- **Focus:** No custom focus treatment observed beyond browser default — worth auditing (see PRODUCT.md's WCAG AA baseline).

### Navigation
- **Month header:** Centered Cinzel masthead flanked by icon-only prev/next arrows and a small mono "Idag" (today) reset button with its own bordered-ghost style.
- **View toggle:** See Buttons above.

### Search Popover (signature component)
Fixed-position icon that expands in place into a bordered, drop-shadowed panel: mono input with an inline "Sök" label, a hairline rule, then either "Mest sökta" pill suggestions or a scrollable result list (98px square thumbnail + mono name/date/venue), or a small "Inget resultat / :-(" empty state. The one place in the UI that combines a shadow, mono type, and result thumbnails together — treat as its own idiom rather than a template for other overlays.

### Grain Overlay (signature component)
A looped, muted `.webm` video (`grain-overlay` class: `position: absolute; inset: 0; opacity: 0.2; mix-blend-mode: overlay; pointer-events: none;`) layered over every photographic surface — artist images in the grid, list, masonry, drawer, and even the map embed. It's togglable via a "Pausa animationer" control (state lives in the filter store) for reduced-motion users. This is the single most distinctive visual signature of the system: it's what makes flat, sharp-edged photography feel like it belongs on "paper" rather than on a screen.

## Do's and Don'ts

### Do:
- **Do** keep Poster Red-Orange rare and purposeful — CTAs, Saturday, "today," selection. Not for illustration or decoration.
- **Do** apply the Grain Overlay to any new photographic surface (artist photos, venue photos, maps) to keep the paper-like texture consistent.
- **Do** use hairline borders (mostly Masthead Indigo) as the default separator instead of reaching for a shadow or a card background.
- **Do** keep each of the six type faces to its one established job (masthead / name-or-number / stat / label / control-and-data / CTA) rather than introducing a seventh voice or reassigning an existing one.
- **Do** let calendar cells and similar content-driven containers grow to fit their content rather than clipping or forcing a scrollbar.

### Don't:
- **Don't** add card shadows or drop shadows to content at rest (grid cells, list rows, masonry cards) — shadow is currently reserved for floating overlays (bottom sheet, search popover) only.
- **Don't** introduce a second accent color alongside Poster Red-Orange; Dusty Blush is a tint of the same system, not a competing hue.
- **Don't** add border-radius to structural containers (cards, buttons, cells, images) by default — radius is reserved for the small set of soft affordances (drag handle, today-marker, sheet corners, search chips).
- **Don't** use pure white (`#FFFFFF` / Bright White) as a page or card background in place of Newsprint Cream; the warm off-white is the paper tone the rest of the system is tuned against.
