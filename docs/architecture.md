# Architecture

## Technology choices, and why

| Concern | Choice | Reasoning |
| --- | --- | --- |
| Framework | Next.js 15, App Router | The whole atlas prerenders to static HTML, so it deploys to Vercel's edge for free and converts to a Capacitor app without a rewrite. |
| Language | TypeScript, `strict` + `noUncheckedIndexedAccess` | The corpus is hand-written data; the type system is the first line of defence against a malformed entry. |
| Map | MapLibre GL JS | See below. |
| State | Zustand | The store is about eighty lines. Redux would be ceremony; context would re-render the map on every timeline tick. |
| Styling | Hand-written CSS with custom properties | See "On not using Tailwind" below. |
| Tests | Vitest | Fast, no config, runs the corpus integrity suite in under a second. |

### Why MapLibre rather than Leaflet

Leaflet is the more common choice and would have worked, but three things decided it:

1. **Timeline scrubbing.** Dragging the year slider re-filters several hundred
   features per frame. MapLibre pushes new data to a GPU-composited vector layer;
   Leaflet would be creating and destroying DOM markers, which visibly stutters
   well before we reach the corpus size we want.
2. **Label quality.** A historical atlas lives or dies on its typography.
   MapLibre gives us collision-aware label placement with a sort key, so at low
   zoom the map thins out to capitals rather than to whichever marker happened to
   render first. Leaflet has no equivalent without a plugin.
3. **One style, two targets.** The same style JSON drives the web build and the
   Capacitor build.

Rotation and pitch are disabled deliberately: a tilted atlas is a novelty that
costs legibility, and locking north-up means the label rules only ever have one
orientation to satisfy.

### On not using Tailwind

The brief asked for something that does not look AI-generated, and utility-first
CSS actively pushes against that. Its defaults — the rounded corners, the shadow
scale, the grey ramp — are the visual signature the brief wanted avoided, and
resisting them costs more than writing the CSS directly. `app/globals.css` is
around 700 lines, uses custom properties for theming, and encodes the rules the
design depends on (square corners, hairline rules, two accents, letterspaced
small-caps labels) where they can be read rather than scattered across class
strings.

## Where the data lives, and why not Firestore

**The atlas corpus is static TypeScript in `src/atlas/data/`, not a database.**
This is a deliberate departure from the brief, and the reasoning is worth stating
because the brief specifically asked for Firebase.

The corpus is a few hundred kilobytes of read-only, slow-changing, editorially
curated content. Putting it in Firestore would mean:

- a network round trip before the first place can be drawn, where the current
  build ships the data inside a CDN-cached bundle;
- read costs that scale with traffic, for data that never changes between
  deploys;
- losing code review on the content — a mistaken coordinate for Lachish should
  arrive as a pull request with a diff, not as a console edit with no history;
- losing the integrity tests, which are the most valuable tests in the project.
  `tests/corpus.test.ts` catches a journey leg pointing at a place that does not
  exist. That check cannot run against a database that is edited at runtime.

Firestore earns its place the moment there is **user-generated** data — saved
study notes, bookmarked places, shared reading plans, an account. That is real
Firebase work with real security rules, and `docs/firebase.md` sets it up. But
shipping the gazetteer through it would add cost and latency to solve a problem
this application does not have.

If the corpus grows past roughly two megabytes, the answer is to split it by
region and load regions on demand — still static, still cached, still tested.

## Layering

```
src/atlas/          Domain. Pure data and pure functions. No React, no DOM.
  types.ts          The model. Uncertainty is a field, not a footnote.
  data/             The corpus, split by region and entity type.
  corpus.ts         Assembly, indexes and selectors.
  search.ts         Query parsing and the search index.

src/lib/            Adapters between the domain and the map.
  basemap.ts        Basemap resolution and the licensing warning.
  map-layers.ts     Corpus entities → GeoJSON. Pure, and tested.

src/state/          Zustand store. The year is the single source of truth.
src/components/     React. The map component owns the only imperative code.
app/                Next.js routes and the stylesheet.
tests/              Vitest.
```

The rule that keeps this honest: **`src/atlas/` never imports from `src/components/`
or `src/lib/`.** The domain does not know a map exists, which is what makes the
corpus testable in isolation and portable to a future native renderer.

## The year is the single source of truth

Book mode does not keep its own clock. Selecting a book moves the year to the
midpoint of that book's narrative window, and everything downstream continues to
derive from the year. This is why switching from Acts back to the timeline leaves
the map where Acts left it — the behaviour a reader expects, and one that is
fiddly to keep correct with two competing sources of time.

Overlapping periods are resolved by preferring the one that began most recently,
so AD 46 reports as the Apostolic Age rather than Roman Judea even though both
contain it.

## Editorial rules encoded in the code

These are enforced, not merely intended:

- A place marked `contested` **must** list at least one alternative
  identification. `tests/corpus.test.ts` fails the build otherwise. This stops
  "contested" degrading into a shrug.
- Every id cross-reference resolves. A place cannot cite an event that does not
  exist; a journey leg cannot point at a missing site.
- A chapter index cannot reference a chapter the book does not have.
- `placesForBook` returns `null` for a chapter that does not exist and `[]` for
  one that exists but names no places — so the interface can distinguish "nothing
  here" from "we have not done this yet", and says which.

## Known limitations

- **Coverage is partial and labelled as such.** Roughly 70 places, with
  chapter-level indexing complete for only two books. `ATLAS_COVERAGE` in
  `src/atlas/data/places/index.ts` is surfaced in the UI so a user is never left
  guessing whether a missing place is absent from the Bible or from this corpus.
- **The default basemap is not production-licensed.** See `src/lib/basemap.ts`.
- **Polity extents are generalised to about a degree.** Ancient authority faded
  with distance rather than stopping at a line; the map says so in the legend.
- **No route animation yet.** Routes draw as static arcs. Animating them along
  the path is a natural next step and needs no data changes.
