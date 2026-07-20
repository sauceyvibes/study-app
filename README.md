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
Searching a person frames every city they are attested in.

**Uncertainty as a first-class citizen.** Every identification carries a
confidence rating, and a place cannot be marked *contested* without naming the
competing candidates — the test suite enforces it. Ai shows you that its
traditional site had been a ruin for a thousand years before any plausible
conquest date. Mount Sinai shows you three candidate mountains and says the
southern tradition is Byzantine, not ancient.

## Honest scope

This is a working application on a curated corpus, not a finished atlas.

- **About 70 places**, researched properly, covering the sites that carry the
  most narrative weight. Places named in scripture may be absent here; the
  interface says so rather than implying the Bible is silent about them.
- **Chapter-level indexing is complete for two books** (Ruth, Jonah). Other books
  show confirmed places and are visibly marked as partial — unindexed chapters
  render with a dashed outline rather than being silently shown as empty.
- **Routes are static arcs.** Animating them along the path is a next step and
  needs no data changes.
- **The default basemap is not licensed for production traffic.** See below.

## The basemap

The production basemap is **Mapbox Outdoors at dusk**: Outdoors cartography
served through Mapbox's Static Tiles API (their documented path for third-party
renderers), graded to evening in the style layer. Mapbox's own `dusk` light
preset belongs to their Standard style and runs only inside their proprietary
SDK, which refuses to render anything without a token — so this route keeps the
dusk look without making a Mapbox account a hard requirement to develop the app.

```
NEXT_PUBLIC_MAPBOX_TOKEN=pk....          # Mapbox Outdoors, dusk-graded (intended)
NEXT_PUBLIC_MAP_STYLE_URL=https://...    # or any MapLibre style you control
NEXT_PUBLIC_MAPTILER_KEY=...             # or a MapTiler key
```

Get a token at account.mapbox.com (the free tier is ample); add it to
`.env.local` for development and to Vercel under Project → Settings →
Environment Variables for production, then redeploy.

Without any of these, the app falls back to OpenStreetMap Foundation tiles,
whose usage policy excludes production applications; the map shows a notice
while that fallback is active.

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
so a correction to a coordinate arrives as a reviewable diff. Coordinates are
given for the excavated tell where one is identified, not the modern town that
inherited the name — for Jericho and Beth-shemesh these are more than a kilometre
apart.

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

60 tests. The most valuable are the corpus integrity checks: the data files are
hand-written, so the realistic failure is not a logic bug but a typo in an id —
a journey leg pointing at a site that does not exist, a chapter index referencing
a chapter the book does not have. Those would fail silently at runtime as an
empty panel or a route that does not draw. Here they fail at build time.
