import type { Place, PlaceKind, Confidence, ScriptureRef } from '../types';
import generated from './gazetteer.generated.json';
import { PLACES as CURATED_PLACES } from './places';
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

/** Match key: lowercase, drop diacritics, drop a trailing disambiguation number. */
function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+\d+$/, '')
    .replace(/[^a-z0-9]+/g, ' ')
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

/** curated normName (from name + aliases) → curated places sharing it. */
const rawByNorm = new Map<string, RawPlace[]>();
for (const rp of RAW) {
  const list = rawByNorm.get(rp.nn) ?? [];
  list.push(rp);
  rawByNorm.set(rp.nn, list);
}

function refCount(rp: RawPlace): number {
  return rp.r.reduce((sum, [, chapters]) => sum + chapters.length, 0);
}

for (const curated of CURATED_PLACES) {
  const keys = new Set([normalizeName(curated.name), ...curated.aliases.map(normalizeName)]);
  const candidates = [...keys]
    .flatMap((k) => rawByNorm.get(k) ?? [])
    .filter((rp) => !mergedRawIds.has(rp.i));
  if (candidates.length === 0) continue;

  let chosen: RawPlace | undefined;
  if (curated.coordinates) {
    // The nearest same-named record, but only if it is genuinely nearby.
    const located = candidates
      .filter((rp) => rp.c)
      .sort((a, b) => squaredDistance(curated.coordinates!, a.c!) - squaredDistance(curated.coordinates!, b.c!));
    if (located.length > 0 && squaredDistance(curated.coordinates!, located[0]!.c!) <= MERGE_THRESHOLD) {
      chosen = located[0];
    }
  } else {
    // No curated coordinate to match on: take the principal referent (most cited).
    chosen = [...candidates].sort((a, b) => refCount(b) - refCount(a))[0];
  }

  if (chosen) {
    mergedRawIds.add(chosen.i);
    rawToCuratedId.set(chosen.i, curated.id);
  }
}

/**
 * The final place id for every raw record: the curated id when merged, otherwise
 * its own slug — deconflicted against curated ids so a gazetteer entry can never
 * shadow a curated one (which would be a duplicate id in the corpus).
 */
const finalIdByRaw = new Map<string, string>();
const usedIds = new Set(CURATED_PLACES.map((p) => p.id));
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

  // Curated hand-authored references, so a curated place with no OpenBible match
  // still contributes its chapters.
  for (const meta of BOOK_BY_ID.values()) {
    for (const [chapter, ids] of Object.entries(meta.placesByChapter)) {
      for (const id of ids) add(meta.id, Number(chapter), id);
    }
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
