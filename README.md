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
Greek — in script (pointed or not, accented or not) or in transliteration —
aliases, disambiguated Strong's numbers, competing site identifications, and
scripture references (`Acts 16`, `1 Kings 12:28`, `Jn 4`). It reaches everything
the corpus holds: the hall of Tyrannus, the three men named Abdi (told apart by
tribe and era in the result line), the province of Asia, the Sadducees, the month
of Adar. Searching a person frames every city they are attested in and opens a
profile — description, family as clickable links out into the genealogies, the
places they appear at, and the datable events they take part in.

**Every reference opens in Logos.** A place's chapter and verse references are
links into [Logos Bible Software](https://www.logos.com/) (via `ref.ly`, which
hands off to the desktop, mobile or web reader). Rest on one for half a second
and a card summarises what happens in the chapter and which places it names.

**A key that matches the plate.** The floating map key decodes both the territory
washes and the routes — each journey drawn in its own colour, solid for the real
legs and dashed only where a connection is inferred, and listed by name in the key
(click one to open it). The key rides along into fullscreen, where the confidence
key stays pinned in the lower corner too.

**Routes open like places.** Click a route on the map (or search one) and a panel
gives its span in years, its start and end, who travelled it, and how much of the
path is reconstructed — then the itinerary stage by stage, each leg naming its two
places, how that stretch was travelled, and its passages. It gathers the datable
events that fall along the way and totals the distance and the sea/overland split.
Selecting a route lights it up and drops the others so it reads from across the
map; click a single leg to isolate that one section, and an empty click restores
them all.

**The site today.** A place's panel pulls in present-day photographs geotagged
near its coordinates from Wikimedia Commons — genuine images of the location, each
credited to its author and licence — in a thumbnail grid that opens to a
fullscreen viewer. Because most sites sit on the excavated tell, these are largely
the ruins; where a file is tagged as ruins or archaeology it is ranked first, so a
living city leads with whatever ancient remains it has.

**Uncertainty as a first-class citizen.** Every identification carries a
confidence rating, and a place cannot be marked *contested* without naming the
competing candidates — the test suite enforces it. Ai shows you that its
traditional site had been a ruin for a thousand years before any plausible
conquest date. Mount Sinai shows you three candidate mountains and says the
southern tradition is Byzantine, not ancient.

## Coverage

**Every proper name in the Protestant Bible**, indexed to the chapter. Three
comprehensive layers are merged at load, with a hand-written core on top:

- **~1,430 places** from [OpenBible.info Bible Geocoding](https://www.openbible.info/geo/)
  (CC BY 4.0), which disambiguates each place, catalogues it by verse, and rates
  the confidence of its modern identification.
- **~3,150 people**, individuated, from [STEPBible TIPNR](https://github.com/STEPBible/STEPBible-Data)
  (Tyndale House Cambridge, CC BY 4.0) — with the Hebrew or Greek of every form
  of the name, the disambiguated Strong's numbers, the family links out of the
  genealogies, and an exhaustive reference list. *Individuated* is the word that
  matters: there are seven men called Zechariah and eleven called Joseph, and the
  corpus knows which verse belongs to which one.
- **~100 subjects** that are named but are neither people nor places — gods and
  angels, festivals and months, sects and schools, musical directions in the
  psalm headings, the constellations of Job. Searchable, deliberately never
  mapped: "Passover" is something a reader looks up, not a place to pin.

**Places inside places.** Around 330 locations are recorded as sitting *in* or
*near* a settlement rather than standing alone — the Areopagus in Athens, the
pool of Bethesda and every named gate of Jerusalem, Solomon's Portico, the Ophel,
the Millo, Gabbatha. They stay off the plate until zoom 9 and then appear on
their own layer. Where a source records only that something was "in Jerusalem",
the map fans it around the city centre so it can be picked out, and the panel
says plainly that the marker's position carries no claim.

**Territories.** Roman provinces, geographical regions and the tribal allotments,
shaded the way the empires are and toggled separately from them: Asia, Macedonia,
Achaia, Galatia, Bithynia and Pontus, Cappadocia, Cilicia, Syria, Judaea, Crete,
Cyprus, Illyricum; Galilee, Samaria, Judea, Idumea, Perea, the Decapolis, Gilead,
Bashan, the Negev, the Shephelah, Sharon, the Jezreel valley, Goshen, the Arabah;
and the thirteen allotments of Joshua 13-19.

**Witnesses from outside the Bible.** The curated entries — ~70 major sites and
~40 named venues — carry the ancient testimony for what they claim: Josephus on
the temple porticoes and Herod's harbour, Strabo on Ephesus, Pausanias on the
Areopagus, Tacitus on the imperial cult in Asia, the Gallio inscription, the
Pilate stone, the Theodotus inscription, the Siloam tunnel inscription, and the
excavation reports. Each is named, dated, located in its own work, marked as
text or inscription or excavation, and linked to a public-domain edition where
one exists. Every entry in the corpus additionally gets constructed links into a
concordance, a lexicon and the ancient-world gazetteers.

- **Every book is indexed.** A chapter with no places genuinely names none — the
  book view marks it plainly rather than leaving it in an "unverified" state.
- **Routes are drawn arcs, and interactive.** Each is clickable and opens its
  own panel; animating them along the path is a next step and needs no data
  changes.
- **Going public needs a one-time Stadia Maps step.** See below.

The place gazetteer is regenerated with `node scripts/build-gazetteer.mjs`, and
the people, sites and subjects with `node scripts/build-nomenclature.mjs`. Each
script's header names its exact input and provenance; both read a source file you
download once and emit compact JSON into `src/atlas/data/`.

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

The comprehensive layers come from two open datasets, both licensed CC BY 4.0 and
both credited in the app:

- **OpenBible.info Bible Geocoding** — place identifications, coordinates,
  confidence ratings and verse references. Transformed into
  `gazetteer.generated.json` by `scripts/build-gazetteer.mjs`.
- **STEPBible TIPNR**, a work of Tyndale House Cambridge — every proper name,
  individuated, with ancient-language forms, Strong's numbers, family relations
  and exhaustive references. Transformed into `people.generated.json`,
  `sites.generated.json` and `topics.generated.json` by
  `scripts/build-nomenclature.mjs`.

The merges — curated over OpenBible over TIPNR — and the chapter-index inversion
happen at load, in `src/atlas/data/gazetteer.ts` for places and
`src/atlas/data/nomenclature.ts` for people and subjects. Matching is on evidence
rather than on name alone, because name alone gets it wrong: OpenBible holds
"Samaria" as both a town and a region at one coordinate, TIPNR holds five Marys,
and picking by name would silently attach one entry's references to another. See
the comments in those two files for what each merge weighs.

**One thing TIPNR ships that this atlas does not use.** The dataset includes
per-entry prose written by an AI in 2024 and labelled as such by STEPBible. It is
not carried here. Descriptions for the comprehensive layers are composed instead
from the structured fields — office, tribe, era, family, reference count — which
are Tyndale House's editorial work and can be checked against the text. An atlas
that advertises its sources should not seat unverified prose beside them. If you
want those articles, they are in the source file and the build script would need
a dozen lines to carry them.

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

115 tests. The most valuable are the corpus integrity checks. The hand-written
files fail by typo — a journey leg pointing at a site that does not exist, a
chapter index referencing a chapter the book does not have — and the merged
layers fail by *mismatch*, which is worse, because a mismatch looks entirely
normal at runtime: a full panel of plausible content that happens to belong to a
different person. So `tests/nomenclature.test.ts` pins the ones that would go
wrong first and be noticed last — that `mary` is the mother of Jesus and not one
of the other four, that the husband of Mary survives an id collision that used to
delete him, that no settlement is pinned twice, that no place contains itself,
and that every family link resolves. All of it fails at build time instead of
silently at read time.
