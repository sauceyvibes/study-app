# Sacred Geography
 
An interactive historical atlas of the Bible: places, people, routes and empires
from the patriarchal age to the apostolic mission, with the scholarly uncertainty
shown rather than smoothed away.

## Running it

```bash
npm install
npm run dev          # http://localhost:3000
npm run verify       # typecheck, lint, tests
```

## What it does

**Two ways in.** A century timeline that filters the map by year — cities appear
and disappear, territory shifts, events surface as you scrub — and a book mode
that jumps the map to a book's historical setting and can narrow to a single
chapter.

**Search that understands the domain.** Modern names, ancient names, Hebrew and
Greek in script or transliteration, aliases, people, events, competing site
identifications, and scripture references (`Acts 16`, `1 Kings 12:28`, `Jn 4`).
Searching a person frames every city they are attested in and opens a short
profile — description, the places they appear at, and the datable events they
take part in.

**Every reference opens in Logos.** A place's chapter and verse references are
links into [Logos Bible Software](https://www.logos.com/) (via `ref.ly`, which
hands off to the desktop, mobile or web reader). Rest on one for half a second
and a card summarises what happens in the chapter and which places it names.

**A key that matches the plate.** The floating map key decodes both the territory
washes and the route lines — overland, by sea, and inferred connections drawn
exactly as the map draws them — and it rides along into fullscreen, where the
confidence key stays pinned in the lower corner too.

**Uncertainty as a first-class citizen.** Every identification carries a
confidence rating, and a place cannot be marked *contested* without naming the
competing candidates — the test suite enforces it. Ai shows you that its
traditional site had been a ruin for a thousand years before any plausible
conquest date. Mount Sinai shows you three candidate mountains and says the
southern tradition is Byzantine, not ancient.

## Coverage

- **Every place named in the Protestant Bible**, indexed to the chapter — about
  1,300 places drawn from [OpenBible.info Bible Geocoding](https://www.openbible.info/geo/)
  (CC BY 4.0), which disambiguates each place, catalogues it by verse, and rates
  the confidence of its modern identification.
- **A curated core of ~70 major sites** carries fuller detail on top of that
  base: written descriptions, Hebrew/Greek names, archaeology and cited sources.
  Where a curated entry and an OpenBible record are the same place (matched by
  name *and* location) they are folded together, so nothing is double-pinned.
- **Every book is indexed.** A chapter with no places genuinely names none — the
  book view marks it plainly rather than leaving it in an "unverified" state.
- **Routes are static arcs.** Animating them along the path is a next step and
  needs no data changes.
- **Going public needs a one-time Stadia Maps step.** See below.

The gazetteer is regenerated with `node scripts/build-gazetteer.mjs` from the
OpenBible source data; see the script header for the exact input and provenance.

## The basemap

The atlas draws on **Stamen Terrain** — Stamen Design's hillshaded relief
cartography, now hosted by Stadia Maps — lightly warm-graded to sit inside the
parchment plate. Terrain relief is what a historical atlas wants underneath it:
the shape of the land is half the story of where cities sat and armies moved.

It renders **keyless on `localhost`**, so development needs no setup at all.
Specifically we use the `stamen_terrain_background` layer (relief and water,
without Stamen's own roads and modern labels) so it doesn't fight the atlas's
own gazetteer labels; to use the fully labelled style, change `STAMEN_STYLE` in
`src/lib/basemap.ts` to `stamen_terrain`.

For a **public deployment**, do one of (either is free, no credit card):

- Register your domain under *Property Authentication* in the
  [Stadia Maps dashboard](https://client.stadiamaps.com) — no key in the code,
  recommended for web apps; or
- set `NEXT_PUBLIC_STADIA_API_KEY` (works anywhere, including Vercel previews).

```
NEXT_PUBLIC_STADIA_API_KEY=...           # Stamen Terrain in production
NEXT_PUBLIC_MAP_STYLE_URL=https://...    # or override with any MapLibre style
```

Until one of those is in place, keyless traffic from an unregistered production
domain is rate-limited; the map shows a quiet notice while running keyless.

Deploying to Vercel otherwise needs no configuration — every route prerenders to
static HTML, and `vercel.json` pins the framework preset so the build does not
depend on dashboard settings being right.

If a Vercel project was created against this repo *before* the application
existed, its framework preset will have been detected as "Other" and the build
fails with `No Output Directory named "public" found`. The `vercel.json` in this
repo overrides that. If it persists, set Framework Preset to **Next.js** under
Project → Settings → Build & Deployment.

## Data and sources

The corpus lives in `src/atlas/data/` as typed TypeScript, under version control,
so a correction to a coordinate arrives as a reviewable diff. The curated core's
coordinates are given for the excavated tell where one is identified, not the
modern town that inherited the name — for Jericho and Beth-shemesh these are more
than a kilometre apart.

The comprehensive layer — place identifications, coordinates, confidence ratings
and verse references — comes from **OpenBible.info Bible Geocoding**, licensed
CC BY 4.0, and is credited in the app. It is transformed into
`src/atlas/data/gazetteer.generated.json` by `scripts/build-gazetteer.mjs`; the
merge with the curated core and the chapter-index inversion happen at load in
`src/atlas/data/gazetteer.ts`.

Dates follow the standard anchors: the Assyrian eponym canon and the Babylonian
Chronicles for the first millennium BC, Thiele's regnal synchronisms for the
Hebrew monarchy, and the Gallio inscription for Pauline chronology. Where the
field is genuinely divided — the date of the Exodus, the extent of the united
monarchy, the destruction layers at Jericho and Hazor — the atlas presents both
readings and names the arguments instead of quietly picking one.

Individual entries cite their sources. Where a claim rests on a single
inscription or excavation report, the entry says which.

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — technology choices, layering,
  and why the corpus is not in Firestore
- [`docs/firebase.md`](docs/firebase.md) — Firebase setup for user data, with
  security rules

## Tests

```bash
npm test
```

77 tests. The most valuable are the corpus integrity checks: the data files are
hand-written, so the realistic failure is not a logic bug but a typo in an id —
a journey leg pointing at a site that does not exist, a chapter index referencing
a chapter the book does not have. Those would fail silently at runtime as an
empty panel or a route that does not draw. Here they fail at build time.
