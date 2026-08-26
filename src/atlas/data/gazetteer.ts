import type { Place, PlaceKind, Confidence, ScriptureRef, SourceNote } from '../types';
import generated from './gazetteer.generated.json';
import siteData from './sites.generated.json';
import { PLACES as CURATED_PLACES } from './places';
import { CURATED_SITES } from './places/sites';
import { BOOK_BY_ID } from './books';

/**
 * The comprehensive gazetteer, assembled from OpenBible.info's Bible Geocoding
 * data (CC BY 4.0) and merged with the hand-curated core.
 *
 *   Source: https://github.com/openbibleinfo/Bible-Geocoding-Data
 *
 * Two things happen here, both at module load and both cheap:
 *
 *  1. **Curated places win.** For the ~70 places we researched by hand, the rich
 *     entry (descriptions, Hebrew/Greek, archaeology, sources) is kept and the
 *     matching OpenBible record is folded into it — matched by name *and*
 *     coordinate proximity, so that genuinely distinct places sharing a name
 *     (there are three different "Ai"s in the text) are not collapsed together.
 *
 *  2. **Every reference is indexed.** Each OpenBible place carries the list of
 *     chapters that name it. Inverting that across all ~1,300 places gives a
 *     chapter-level index for the whole Protestant canon — which is what lets
 *     the book view light up every chapter rather than only the handful we had
 *     written out by hand.
 *
 * OpenBible records that are folded into a curated place contribute their
 * chapter references under the curated id, so nothing is double-pinned and no
 * reference is lost.
 */

interface RawPlace {
  /** slug id */ i: string;
  /** name */ n: string;
  /** normalized name */ nn: string;
  /** modern name */ m: string | null;
  /** [lon, lat] */ c: [number, number] | null;
  /** kind */ k: string;
  /** confidence */ f: string;
  /** alternatives: [site, lon, lat] */ a?: [string, number, number][];
  /** references: [bookIndex, chapters[]] */ r: [number, number[]][];
}

const BOOK_IDS: string[] = generated.books;
const RAW: RawPlace[] = generated.places as RawPlace[];

/**
 * Match key: lowercase, drop diacritics, drop a trailing disambiguation number,
 * and drop a leading article.
 *
 * The article matters. A written entry is titled the way a sentence would name
 * it — "The Areopagus", "The pool of Bethesda" — while a gazetteer row is a bare
 * headword. Without folding the article the two never meet, and the atlas ends
 * up with a rich entry and a bare one for the same rock.
 */
function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+\d+$/, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/^the /, '')
    .trim();
}

function squaredDistance(a: [number, number], b: [number, number]): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

/** ~0.75° ≈ 80 km. Beyond this, two same-named places are treated as distinct. */
const MERGE_THRESHOLD = 0.75 * 0.75;

// ── Decide, for each curated place, which OpenBible record (if any) it absorbs ──

/** raw id → the curated id it was folded into. */
const rawToCuratedId = new Map<string, string>();
const mergedRawIds = new Set<string>();

/** normalized name → the OpenBible records answering to it. */
const rawByNorm = new Map<string, RawPlace[]>();
for (const rp of RAW) {
  // The source ships its own normalization; ours additionally folds the article,
  // so index under both and let either key find the record.
  for (const key of new Set([rp.nn, normalizeName(rp.n)])) {
    const list = rawByNorm.get(key) ?? [];
    if (!list.includes(rp)) list.push(rp);
    rawByNorm.set(key, list);
  }
}

function refCount(rp: RawPlace): number {
  return rp.r.reduce((sum, [, chapters]) => sum + chapters.length, 0);
}

/**
 * The written entries, in one list for the merge.
 *
 * The curated sites belong here with the curated core: Golgotha, Gethsemane and
 * the Areopagus are all in the OpenBible dataset too, and if the sites did not
 * take part in this merge they would each end up pinned twice — once with the
 * written entry and once with a bare gazetteer row of the same name.
 */
const CURATED_ENTRIES: Place[] = [...CURATED_PLACES, ...CURATED_SITES];

/** ~0.02° ≈ 2 km. Two records this close under a shared name are one place. */
const SAME_SITE_THRESHOLD = 0.02 * 0.02;

for (const curated of CURATED_ENTRIES) {
  const primaryKey = normalizeName(curated.name);
  const keys = new Set([primaryKey, ...curated.aliases.map(normalizeName)]);
  const candidates = [...new Set([...keys].flatMap((k) => rawByNorm.get(k) ?? []))].filter(
    (rp) => !mergedRawIds.has(rp.i),
  );
  if (candidates.length === 0) continue;

  /**
   * A record matching the curated entry's *own name* outranks one matching only
   * an alias, however much closer the alias record happens to sit.
   *
   * This is not a hypothetical. Curated Jerusalem lists Zion, Salem, Jebus, City
   * of David and Ariel among its aliases, and OpenBible holds each of those as
   * its own record within a few hundred metres of the Temple Mount. Sorting the
   * whole pool by distance handed Jerusalem the "City of David" record — nearer
   * by four ten-thousandths of a degree — and left the actual Jerusalem record,
   * with its references from thirty-seven books, unmerged and drawn as a second
   * pin under the same name.
   */
  const isPrimary = (rp: RawPlace) => rp.nn === primaryKey || normalizeName(rp.n) === primaryKey;
  const tiers = [candidates.filter(isPrimary), candidates.filter((rp) => !isPrimary(rp))];

  let chosen: RawPlace | undefined;
  for (const tier of tiers) {
    if (tier.length === 0) continue;
    if (curated.coordinates) {
      // The nearest same-named record, but only if it is genuinely nearby.
      const located = tier
        .filter((rp) => rp.c)
        .sort((a, b) => squaredDistance(curated.coordinates!, a.c!) - squaredDistance(curated.coordinates!, b.c!));
      if (located.length > 0 && squaredDistance(curated.coordinates!, located[0]!.c!) <= MERGE_THRESHOLD) {
        chosen = located[0];
      }
    } else {
      // No curated coordinate to match on: take the principal referent (most cited).
      chosen = [...tier].sort((a, b) => refCount(b) - refCount(a))[0];
    }
    if (chosen) break;
  }

  if (!chosen) continue;
  mergedRawIds.add(chosen.i);
  rawToCuratedId.set(chosen.i, curated.id);

  /**
   * Absorb the rest of the pile.
   *
   * An alias list is an assertion that these names denote one place, so a second
   * record answering to one of them and sitting within two kilometres of the
   * chosen one is that same place under another name — Zion and the City of
   * David are not neighbours of Jerusalem. Left alone they draw as a heap of
   * coincident dots and split the reference index between them. The radius is
   * deliberately tight: this collapses a stack, it does not merge a region.
   */
  if (!chosen.c) continue;
  for (const other of candidates) {
    if (other === chosen || mergedRawIds.has(other.i) || !other.c) continue;
    if (squaredDistance(chosen.c, other.c) > SAME_SITE_THRESHOLD) continue;
    // Same name, same spot, different *kind* is not a duplicate: OpenBible holds
    // "Samaria 1" the town and "Samaria 2" the region at one coordinate, and they
    // are two things a reader needs told apart. Only fold like into like.
    if (other.k !== chosen.k) continue;
    mergedRawIds.add(other.i);
    rawToCuratedId.set(other.i, curated.id);
  }
}

/**
 * The final place id for every raw record: the curated id when merged, otherwise
 * its own slug — deconflicted against curated ids so a gazetteer entry can never
 * shadow a curated one (which would be a duplicate id in the corpus).
 */
const finalIdByRaw = new Map<string, string>();
const usedIds = new Set(CURATED_ENTRIES.map((p) => p.id));
for (const rp of RAW) {
  if (mergedRawIds.has(rp.i)) {
    finalIdByRaw.set(rp.i, rawToCuratedId.get(rp.i)!);
    continue;
  }
  let id = rp.i;
  while (usedIds.has(id)) id = `${id}-place`;
  usedIds.add(id);
  finalIdByRaw.set(rp.i, id);
}

// ── Hydrate the unmerged OpenBible records into Place objects ─────────────────

const KIND_WORD: Record<string, string> = {
  town: 'settlement',
  region: 'region',
  mountain: 'height',
  water: 'body of water',
  wilderness: 'wilderness area',
  island: 'island',
};

function describe(rp: RawPlace): string {
  const word = KIND_WORD[rp.k] ?? 'place';
  const count = refCount(rp);
  const passages = `${count} ${count === 1 ? 'passage' : 'passages'}`;
  const modern = rp.m ? `, identified with ${rp.m}` : ', not yet located';
  return `A ${word} named in ${passages} of the biblical text${modern}. Basic gazetteer entry — see the source for the underlying scholarship.`;
}

function refsToScripture(rp: RawPlace): ScriptureRef[] {
  const out: ScriptureRef[] = [];
  for (const [bookIdx, chapters] of rp.r) {
    const book = BOOK_IDS[bookIdx];
    if (!book) continue;
    for (const chapter of chapters) out.push({ book, chapter });
  }
  return out;
}

/**
 * Occupation window and periods, derived from the books that name the place, so
 * gazetteer places surface on the timeline in the eras they belong to.
 */
function eraFor(rp: RawPlace): { start: number; end: number | null; periods: string[] } {
  let start = Infinity;
  let end = -Infinity;
  const periods = new Set<string>();
  for (const [bookIdx] of rp.r) {
    const meta = BOOK_BY_ID.get(BOOK_IDS[bookIdx]!);
    if (!meta) continue;
    start = Math.min(start, meta.narrativeRange.start);
    end = Math.max(end, meta.narrativeRange.end ?? meta.narrativeRange.start);
    for (const p of meta.periods) periods.add(p);
  }
  if (!Number.isFinite(start)) return { start: -2100, end: 100, periods: [] };
  return { start, end, periods: [...periods] };
}

const OPENBIBLE_SOURCE = {
  citation: 'OpenBible.info Bible Geocoding (CC BY 4.0)',
  note: 'Identification, coordinates and verse references from the OpenBible.info dataset.',
};

function hydrate(rp: RawPlace): Place {
  const era = eraFor(rp);
  const place: Place = {
    id: finalIdByRaw.get(rp.i)!,
    name: rp.n,
    aliases: [],
    modernName: rp.m,
    ancientNames: {},
    coordinates: rp.c,
    kind: rp.k as PlaceKind,
    confidence: rp.f as Confidence,
    occupation: { start: era.start, end: era.end },
    periods: era.periods,
    scripture: refsToScripture(rp),
    people: [],
    events: [],
    polities: [],
    description: describe(rp),
    sources: [OPENBIBLE_SOURCE],
  };
  if (rp.a && rp.a.length > 0) {
    place.alternatives = rp.a.map(([site, lon, lat]) => ({
      site,
      coordinates: [lon, lat] as [number, number],
      argument: 'A competing modern identification recorded in the source dataset.',
    }));
  }
  return place;
}

/** The OpenBible places that were not folded into a curated entry. */
export const GAZETTEER_PLACES: Place[] = RAW.filter((rp) => !mergedRawIds.has(rp.i)).map(hydrate);

/**
 * References the absorbed OpenBible records bring to the curated entry that took
 * them.
 *
 * Without this the merge is lossy in the place a reader would notice first:
 * Jerusalem's panel would list the dozen passages the curated entry was written
 * with, while the chapter index behind the book view knew about hundreds. The
 * curated references stay first and keep their verse numbers; the rest are
 * appended at chapter grain.
 */
const absorbedRefs = new Map<string, ScriptureRef[]>();
for (const rp of RAW) {
  const curatedId = rawToCuratedId.get(rp.i);
  if (!curatedId) continue;
  const list = absorbedRefs.get(curatedId) ?? [];
  list.push(...refsToScripture(rp));
  absorbedRefs.set(curatedId, list);
}

// ── The third layer: STEPBible TIPNR ─────────────────────────────────────────

/**
 * TIPNR's places, merged over the two layers above.
 *
 *   Source: STEPBible TIPNR (Tyndale House Cambridge), CC BY 4.0
 *
 * OpenBible is the better gazetteer — it is built for geocoding, and its
 * confidence ratings and competing identifications are the backbone of this
 * atlas. But it catalogues *settlements and features*, and two things it does
 * not carry matter a great deal to a reader:
 *
 *  1. **The ancient names.** Every OpenBible record arrives with an empty
 *     `ancientNames`. TIPNR has the Hebrew or Greek for essentially all of them,
 *     which is what makes searching בֵּית לֶחֶם or Βηθλέεμ work at all.
 *
 *  2. **The places inside places.** The Areopagus, the pool of Bethesda, the
 *     Beautiful Gate, Solomon's Portico, the Fish Gate, the Ophel, the Millo —
 *     fifty-odd named locations *within* a settlement, each recorded with the
 *     city that holds it. A gazetteer of settlements has no row for these, and
 *     without them a reader zooming into Jerusalem finds one dot where the text
 *     names twenty.
 *
 * So TIPNR enriches where it agrees and contributes where it adds.
 */

interface RawSite {
  /** slug id */ i: string;
  /** name */ n: string;
  /** aliases */ a?: string[];
  /** hebrew */ h?: string;
  /** greek */ g?: string;
  /** disambiguated Strong's */ s?: string[];
  /** [lon, lat] */ c: [number, number] | null;
  /** OpenBible headword, when it differs from the name */ ob?: string;
  /** `in` or `near` */ rel?: string;
  /** parent site id */ pa?: string;
  /** free-text location note, where the parent could not be resolved */ note?: string;
  /** founder or origin */ fo?: string;
  /** the people who lived there */ pe?: string;
  /** wider geographical area */ ar?: string;
  /** references: [bookIndex, chapters[]] */ r: [number, number[]][];
}

const RAW_SITES: RawSite[] = siteData.places as RawSite[];
const SITE_BOOK_IDS: string[] = siteData.books;

const TIPNR_SOURCE: SourceNote = {
  citation: 'STEPBible TIPNR (Tyndale House Cambridge), CC BY 4.0',
  note: 'Ancient-language forms, alternative spellings and the containing settlement.',
};

function siteRefsToScripture(raw: [number, number[]][]): ScriptureRef[] {
  const out: ScriptureRef[] = [];
  for (const [bookIdx, chapters] of raw) {
    const book = SITE_BOOK_IDS[bookIdx];
    if (!book) continue;
    for (const chapter of chapters) out.push({ book, chapter });
  }
  return out;
}

function siteRefCount(raw: [number, number[]][]): number {
  return raw.reduce((sum, [, chapters]) => sum + chapters.length, 0);
}

/**
 * Everything placed so far, indexed by every name it answers to. Curated entries
 * come first so a TIPNR record prefers to enrich the rich entry over the bare one.
 */
const placedByName = new Map<string, Place[]>();
const PLACED: Place[] = [...CURATED_ENTRIES, ...GAZETTEER_PLACES];
for (const place of PLACED) {
  for (const label of [place.name, ...place.aliases]) {
    const key = normalizeName(label);
    if (!key) continue;
    const list = placedByName.get(key) ?? [];
    list.push(place);
    placedByName.set(key, list);
  }
}

/**
 * Which existing place a TIPNR record is, if any.
 *
 * The same rule the curated/OpenBible merge uses, for the same reason: name
 * agreement alone would collapse the three Bethlehems and the two Bethels into
 * one pin. A shared name plus a coordinate within about eighty kilometres is a
 * match; a shared name eight hundred kilometres away is a different place that
 * happens to be called the same thing.
 */
function matchPlaced(site: RawSite): Place | undefined {
  const primaryKeys = new Set([site.ob, site.n].filter(Boolean).map((l) => normalizeName(l as string)));
  const keys = new Set([...primaryKeys, ...(site.a ?? []).map(normalizeName)]);
  const candidates = [...new Set([...keys].flatMap((key) => placedByName.get(key) ?? []))];
  if (candidates.length === 0) return undefined;

  // Head-name matches before alias matches, for the reason set out at the curated
  // merge above: an alias record sitting a few metres nearer must not outrank the
  // record that actually shares the name.
  const isPrimary = (p: Place) => primaryKeys.has(normalizeName(p.name));
  const tiers = [candidates.filter(isPrimary), candidates.filter((p) => !isPrimary(p))];

  for (const tier of tiers) {
    if (tier.length === 0) continue;

    /*
     * A region's coordinate is a centroid somebody chose, not a location.
     * OpenBible puts the province of Asia at 28.3°E and TIPNR puts it at 32.7°E
     * — three hundred and eighty kilometres apart, and both are perfectly
     * reasonable answers for an area six hundred kilometres across. Judging
     * these by proximity rejects every match and leaves a second "Asia" pinned
     * as a town. For an area, the shared name is the evidence.
     */
    const sameNamedArea = tier.find((p) => p.kind === 'region' || p.kind === 'wilderness');
    if (sameNamedArea && tier === tiers[0]) return sameNamedArea;

    if (site.c) {
      const located = tier
        .filter((p) => p.coordinates)
        .sort(
          (a, b) => squaredDistance(site.c!, a.coordinates!) - squaredDistance(site.c!, b.coordinates!),
        );
      const nearest = located[0];
      if (nearest && squaredDistance(site.c, nearest.coordinates!) <= MERGE_THRESHOLD) return nearest;
      // A same-named record far from every candidate is a distinct place. Only fall
      // back to an unlocated candidate, which has no coordinate to disagree with.
      const unlocated = tier.find((p) => !p.coordinates);
      if (unlocated) return unlocated;
    } else {
      return [...tier].sort((a, b) => b.scripture.length - a.scripture.length)[0];
    }
  }
  return undefined;
}

/** TIPNR site id → the id it carries in the assembled corpus. */
const siteToPlaceId = new Map<string, string>();
/** Place ids an existing entry already occupies, so the site is not re-added. */
const matchedPlaceIds = new Set<string>();
/** The enrichment a matched record contributes, keyed by the place it matched. */
const enrichmentByPlaceId = new Map<string, RawSite>();
const usedPlaceIds = new Set(PLACED.map((p) => p.id));

for (const site of RAW_SITES) {
  const match = matchPlaced(site);
  if (match) {
    siteToPlaceId.set(site.i, match.id);
    matchedPlaceIds.add(match.id);
    // Only the first record to claim a place enriches it; a second one naming
    // the same place is a different referent whose name happens to collide, and
    // folding its Hebrew in would attach the wrong word to the entry.
    if (!enrichmentByPlaceId.has(match.id)) enrichmentByPlaceId.set(match.id, site);
    continue;
  }
  let id = site.i;
  while (usedPlaceIds.has(id)) id = `${id}-site`;
  usedPlaceIds.add(id);
  siteToPlaceId.set(site.i, id);
}

/**
 * A settlement's own kind, guessed from its name.
 *
 * TIPNR does not type its places beyond "Place", so the sub-locations arrive
 * untyped. The name is a better guide here than it usually is, because these are
 * built things and the text names them for what they are: a gate is a gate, a
 * tower a fortification, a pool water.
 */
function guessKind(name: string, hasParent: boolean): PlaceKind {
  if (/\b(gate|tower|wall|fortress|citadel|stronghold)\b/i.test(name)) return 'fortress';
  if (/\b(pool|spring|well|brook|river|stream|waters?)\b/i.test(name)) return 'water';
  if (/\b(mount|mountain|hill|rock)\b/i.test(name)) return 'mountain';
  if (/\b(valley|plain|field|wilderness|desert)\b/i.test(name)) return 'wilderness';
  if (/\b(portico|colonnade|hall|house|temple|court|place|chamber|treasury)\b/i.test(name)) {
    return 'sanctuary';
  }
  return hasParent ? 'sanctuary' : 'town';
}

function describeSite(site: RawSite, parentName: string | undefined): string {
  const count = siteRefCount(site.r);
  const passages = count === 1 ? 'once' : `in ${count} chapters`;
  const where = parentName
    ? site.rel === 'in'
      ? ` within ${parentName}`
      : ` near ${parentName}`
    : site.note
      ? ` ${site.note}`
      : '';
  const people = site.pe ? ` Occupied by the ${site.pe}.` : '';
  const founder = site.fo ? ` Named in the text from ${site.fo}.` : '';
  return `A location${where}, named ${passages} of the biblical text.${people}${founder}`.replace(/\s+/g, ' ');
}

function hydrateSite(site: RawSite): Place {
  const scripture = siteRefsToScripture(site.r);
  const era = eraForScripture(scripture);
  const parentId = site.pa ? siteToPlaceId.get(site.pa) : undefined;
  const parentName = site.pa
    ? RAW_SITES.find((s) => s.i === site.pa)?.n ?? undefined
    : undefined;

  const place: Place = {
    id: siteToPlaceId.get(site.i)!,
    name: site.n,
    aliases: site.a ?? [],
    modernName: null,
    ancientNames: {
      ...(site.h ? { hebrew: site.h } : {}),
      ...(site.g ? { greek: site.g } : {}),
    },
    coordinates: site.c,
    kind: guessKind(site.n, Boolean(parentId)),
    // TIPNR states where a place is but does not rate how firmly it is
    // identified, which is the whole subject of OpenBible's confidence column.
    // Anything arriving only through this layer is therefore marked conjectural
    // rather than borrowing a certainty nobody claimed.
    confidence: site.c ? 'conjectural' : 'unlocated',
    occupation: { start: era.start, end: era.end },
    periods: era.periods,
    scripture,
    people: [],
    events: [],
    polities: [],
    description: describeSite(site, parentName),
    sources: [TIPNR_SOURCE],
  };
  if (parentId) {
    place.parentPlaceId = parentId;
    place.siteRelation = site.rel === 'in' ? 'in' : 'near';
  }
  if (site.s?.length) place.strongs = site.s;
  return place;
}

/** The union of a place's own references and any it absorbed, chapter by chapter. */
function withAbsorbedRefs(place: Place): ScriptureRef[] {
  const extra = absorbedRefs.get(place.id);
  if (!extra || extra.length === 0) return place.scripture;

  const scripture = [...place.scripture];
  const covered = new Set(scripture.map((ref) => `${ref.book} ${ref.chapter}`));
  for (const ref of extra) {
    const key = `${ref.book} ${ref.chapter}`;
    if (covered.has(key)) continue;
    covered.add(key);
    scripture.push(ref);
  }
  return scripture;
}

/** Add what the merged records know and the existing entry does not. */
function enrichPlace(place: Place): Place {
  const site = enrichmentByPlaceId.get(place.id);
  const scripture = withAbsorbedRefs(place);
  if (!site) return scripture === place.scripture ? place : { ...place, scripture };

  const ancientNames = { ...place.ancientNames };
  if (site.h && !ancientNames.hebrew) ancientNames.hebrew = site.h;
  if (site.g && !ancientNames.greek) ancientNames.greek = site.g;

  const aliases = [...new Set([...place.aliases, ...(site.a ?? []), ...(site.ob ? [site.ob] : [])])]
    .filter((alias) => alias !== place.name);

  const enriched: Place = { ...place, ancientNames, aliases, scripture };
  if (site.s?.length && !place.strongs) enriched.strongs = site.s;
  if (!place.parentPlaceId && site.pa) {
    const parentId = siteToPlaceId.get(site.pa);
    // Never let a place become its own parent, which a self-referential source
    // row would otherwise produce and which would loop the panel's breadcrumb.
    if (parentId && parentId !== place.id) {
      enriched.parentPlaceId = parentId;
      enriched.siteRelation = site.rel === 'in' ? 'in' : 'near';
    }
  }
  if (!place.sources.some((s) => s.citation === TIPNR_SOURCE.citation)) {
    enriched.sources = [...place.sources, TIPNR_SOURCE];
  }
  return enriched;
}

/** Occupation window and periods for a set of references. */
function eraForScripture(scripture: ScriptureRef[]): { start: number; end: number; periods: string[] } {
  let start = Infinity;
  let end = -Infinity;
  const periods = new Set<string>();
  for (const ref of scripture) {
    const meta = BOOK_BY_ID.get(ref.book);
    if (!meta) continue;
    start = Math.min(start, meta.narrativeRange.start);
    end = Math.max(end, meta.narrativeRange.end ?? meta.narrativeRange.start);
    for (const p of meta.periods) periods.add(p);
  }
  if (!Number.isFinite(start)) return { start: -2100, end: 100, periods: [] };
  return { start, end, periods: [...periods] };
}

/**
 * Every place in the atlas, in one list and fully assembled: the curated core
 * and the curated sites first (so their ids win any lookup), then the OpenBible
 * gazetteer, then the TIPNR locations neither of them holds. All three layers
 * carry whatever the layers below could add to them.
 */
export const ASSEMBLED_PLACES: Place[] = [
  ...PLACED.map(enrichPlace),
  ...RAW_SITES.filter((site) => !matchedPlaceIds.has(siteToPlaceId.get(site.i)!)).map(hydrateSite),
];

// ── The comprehensive chapter index ──────────────────────────────────────────

export type ChapterIndex = Record<string, Record<number, string[]>>;

function buildChapterIndex(): ChapterIndex {
  const index: ChapterIndex = {};
  const seen: Record<string, Record<number, Set<string>>> = {};

  const add = (book: string, chapter: number, placeId: string) => {
    (seen[book] ??= {})[chapter] ??= new Set();
    seen[book][chapter]!.add(placeId);
  };

  // Every OpenBible reference, attributed to the final id (curated when merged).
  for (const rp of RAW) {
    const id = finalIdByRaw.get(rp.i)!;
    for (const [bookIdx, chapters] of rp.r) {
      const book = BOOK_IDS[bookIdx];
      if (!book) continue;
      for (const chapter of chapters) add(book, chapter, id);
    }
  }

  // Every TIPNR reference, under the id the site merge settled on. Without this
  // pass, opening Acts 17 would not light up the Areopagus and opening Nehemiah 3
  // would not light up a single one of the gates that chapter is about.
  for (const site of RAW_SITES) {
    const id = siteToPlaceId.get(site.i)!;
    for (const [bookIdx, chapters] of site.r) {
      const book = SITE_BOOK_IDS[bookIdx];
      if (!book) continue;
      for (const chapter of chapters) add(book, chapter, id);
    }
  }

  // Curated hand-authored references, so a curated place with no OpenBible match
  // still contributes its chapters.
  for (const meta of BOOK_BY_ID.values()) {
    for (const [chapter, ids] of Object.entries(meta.placesByChapter)) {
      for (const id of ids) add(meta.id, Number(chapter), id);
    }
  }

  // The curated sites, whose references are authored by hand rather than coming
  // from either dataset.
  for (const site of CURATED_SITES) {
    for (const ref of site.scripture) add(ref.book, ref.chapter, site.id);
  }

  for (const [book, chapters] of Object.entries(seen)) {
    index[book] = {};
    for (const [chapter, ids] of Object.entries(chapters)) {
      index[book]![Number(chapter)] = [...ids].sort();
    }
  }
  return index;
}

export const CHAPTER_INDEX: ChapterIndex = buildChapterIndex();

/** Attribution string for the UI and docs. */
export const GAZETTEER_ATTRIBUTION =
  'Place identifications and verse references from OpenBible.info Bible Geocoding, licensed CC BY 4.0.';
