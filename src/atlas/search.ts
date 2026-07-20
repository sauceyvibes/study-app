import type { AncientNames, ScriptureRef } from './types';
import { BOOKS } from './data/books';
import { CORPUS, PLACE_BY_ID, placesForPerson } from './corpus';

/**
 * The atlas search engine.
 *
 * Deliberately not a fuzzy matcher. Users searching an atlas usually know what
 * they are looking for and mistype it in predictable ways — a wrong vowel in a
 * transliteration, a missing accent, "Ceasarea". Prefix and substring matching
 * over a rich alias set handles those, while fuzzy scoring would surface Gath for
 * "Gaza" and erode trust in the results. Where we cannot match, we say so.
 *
 * Three query shapes are handled:
 *
 *  - **Scripture references** — "Acts 16", "1 Kings 12:28", "Jn 4". Parsed first,
 *    because they should never be treated as name text.
 *  - **Names** — English, Hebrew (in script or transliteration), Greek, modern
 *    site names, and alternative identifications for contested places.
 *  - **Free text** — falls back to matching descriptions, so "shipwreck" or
 *    "siege ramp" finds something useful.
 */

export type ResultKind = 'place' | 'person' | 'event' | 'journey' | 'scripture' | 'period';

export interface SearchResult {
  kind: ResultKind;
  id: string;
  title: string;
  /** Short context line shown under the title. */
  subtitle: string;
  /** Which field matched, so the UI can explain itself ("Hebrew: Yerushalayim"). */
  matchedOn: string;
  /** Higher sorts first. */
  score: number;
  /** Set for scripture-reference results so the UI can jump the map. */
  reference?: ScriptureRef;
  /** Place ids this result should focus on the map. */
  placeIds: string[];
}

/** Lowercase, strip diacritics and punctuation, collapse whitespace. */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Hebrew and Greek script are indexed as-is; only case and spacing are folded. */
function normalizeScript(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

function ancientNameTerms(names: AncientNames): { term: string; label: string }[] {
  const terms: { term: string; label: string }[] = [];
  if (names.hebrew) terms.push({ term: normalizeScript(names.hebrew), label: 'Hebrew' });
  if (names.hebrewTranslit) terms.push({ term: normalize(names.hebrewTranslit), label: `Hebrew: ${names.hebrewTranslit}` });
  if (names.greek) terms.push({ term: normalizeScript(names.greek), label: 'Greek' });
  if (names.greekTranslit) terms.push({ term: normalize(names.greekTranslit), label: `Greek: ${names.greekTranslit}` });
  for (const other of names.other ?? []) {
    terms.push({ term: normalize(other.form), label: `${other.language}: ${other.form}` });
  }
  return terms;
}

interface IndexEntry {
  kind: ResultKind;
  id: string;
  title: string;
  subtitle: string;
  placeIds: string[];
  /** Exact/prefix-matchable terms, each with a label explaining the match. */
  terms: { term: string; label: string }[];
  /** Prose searched only as a last resort. */
  prose: string;
}

/** Built once at module load. The corpus is small enough that this is instant. */
const INDEX: IndexEntry[] = buildIndex();

function buildIndex(): IndexEntry[] {
  const entries: IndexEntry[] = [];

  for (const place of CORPUS.places) {
    const terms = [
      { term: normalize(place.name), label: place.name },
      ...place.aliases.map((a) => ({ term: normalize(a), label: `also called ${a}` })),
      ...ancientNameTerms(place.ancientNames),
    ];
    if (place.modernName) terms.push({ term: normalize(place.modernName), label: `modern: ${place.modernName}` });
    for (const alt of place.alternatives ?? []) {
      terms.push({ term: normalize(alt.site), label: `proposed site: ${alt.site}` });
    }
    entries.push({
      kind: 'place',
      id: place.id,
      title: place.name,
      subtitle: place.modernName ? `${describeKind(place.kind)} — today ${place.modernName}` : describeKind(place.kind),
      placeIds: [place.id],
      terms,
      prose: normalize(`${place.description} ${place.archaeology ?? ''}`),
    });
  }

  for (const person of CORPUS.people) {
    entries.push({
      kind: 'person',
      id: person.id,
      title: person.name,
      subtitle: person.role,
      placeIds: placesForPerson(person.id).map((p) => p.id),
      terms: [
        { term: normalize(person.name), label: person.name },
        ...person.aliases.map((a) => ({ term: normalize(a), label: `also called ${a}` })),
        ...ancientNameTerms(person.ancientNames),
      ],
      prose: normalize(person.description),
    });
  }

  for (const event of CORPUS.events) {
    entries.push({
      kind: 'event',
      id: event.id,
      title: event.name,
      subtitle: formatYear(event.year),
      placeIds: event.places,
      terms: [{ term: normalize(event.name), label: event.name }],
      prose: normalize(event.description),
    });
  }

  for (const journey of CORPUS.journeys) {
    entries.push({
      kind: 'journey',
      id: journey.id,
      title: journey.name,
      subtitle: `${journey.legs.length} stages`,
      placeIds: journey.legs.flatMap((l) => [l.fromPlace, l.toPlace]),
      terms: [{ term: normalize(journey.name), label: journey.name }],
      prose: normalize(journey.summary),
    });
  }

  for (const period of CORPUS.periods) {
    entries.push({
      kind: 'period',
      id: period.id,
      title: period.name,
      subtitle: formatYearRange(period.range.start, period.range.end),
      placeIds: [],
      terms: [{ term: normalize(period.name), label: period.name }],
      prose: normalize(period.summary),
    });
  }

  return entries;
}

function describeKind(kind: string): string {
  const labels: Record<string, string> = {
    city: 'City',
    town: 'Town',
    village: 'Village',
    capital: 'Royal city',
    sanctuary: 'Sanctuary',
    fortress: 'Fortress',
    mountain: 'Mountain',
    water: 'Water',
    wilderness: 'Wilderness',
    region: 'Region',
    island: 'Island',
  };
  return labels[kind] ?? 'Place';
}

/** -586 → "586 BC"; 30 → "AD 30". */
export function formatYear(year: number): string {
  return year < 0 ? `${Math.abs(year)} BC` : `AD ${year}`;
}

export function formatYearRange(start: number, end: number | null): string {
  if (end === null) return `${formatYear(start)} onward`;
  // Don't repeat the era when both ends share it.
  if (start < 0 && end < 0) return `${Math.abs(start)}–${Math.abs(end)} BC`;
  if (start >= 0 && end >= 0) return `AD ${start}–${end}`;
  return `${formatYear(start)} – ${formatYear(end)}`;
}

// ── Scripture reference parsing ──────────────────────────────────────────────

/** Common abbreviations, mapped to canonical book ids. */
const BOOK_ALIASES: Record<string, string> = {
  gen: 'genesis', ge: 'genesis', gn: 'genesis',
  ex: 'exodus', exod: 'exodus',
  lev: 'leviticus', lv: 'leviticus',
  num: 'numbers', nm: 'numbers',
  deut: 'deuteronomy', dt: 'deuteronomy',
  josh: 'joshua', jos: 'joshua',
  judg: 'judges', jdg: 'judges',
  rt: 'ruth',
  '1 sam': '1samuel', '1sam': '1samuel', '1 sa': '1samuel',
  '2 sam': '2samuel', '2sam': '2samuel', '2 sa': '2samuel',
  '1 kgs': '1kings', '1kgs': '1kings', '1 ki': '1kings', '1 kings': '1kings',
  '2 kgs': '2kings', '2kgs': '2kings', '2 ki': '2kings', '2 kings': '2kings',
  '1 chr': '1chronicles', '1chr': '1chronicles', '1 ch': '1chronicles',
  '2 chr': '2chronicles', '2chr': '2chronicles', '2 ch': '2chronicles',
  neh: 'nehemiah', est: 'esther',
  ps: 'psalms', psa: 'psalms', psalm: 'psalms',
  prov: 'proverbs', pr: 'proverbs',
  eccl: 'ecclesiastes', ecc: 'ecclesiastes',
  song: 'songofsongs', sos: 'songofsongs', 'song of solomon': 'songofsongs',
  isa: 'isaiah', is: 'isaiah',
  jer: 'jeremiah', lam: 'lamentations',
  ezek: 'ezekiel', eze: 'ezekiel', ezk: 'ezekiel',
  dan: 'daniel', dn: 'daniel',
  hos: 'hosea', jl: 'joel', am: 'amos', obad: 'obadiah', ob: 'obadiah',
  jon: 'jonah', mic: 'micah', nah: 'nahum', hab: 'habakkuk', zeph: 'zephaniah',
  hag: 'haggai', zech: 'zechariah', zec: 'zechariah', mal: 'malachi',
  matt: 'matthew', mt: 'matthew',
  mk: 'mark', mr: 'mark',
  lk: 'luke', lu: 'luke',
  jn: 'john', joh: 'john',
  ac: 'acts', rom: 'romans', ro: 'romans',
  '1 cor': '1corinthians', '1cor': '1corinthians',
  '2 cor': '2corinthians', '2cor': '2corinthians',
  gal: 'galatians', eph: 'ephesians', phil: 'philippians', php: 'philippians',
  col: 'colossians',
  '1 thess': '1thessalonians', '1thess': '1thessalonians', '1 th': '1thessalonians',
  '2 thess': '2thessalonians', '2thess': '2thessalonians', '2 th': '2thessalonians',
  '1 tim': '1timothy', '1tim': '1timothy', '2 tim': '2timothy', '2tim': '2timothy',
  tit: 'titus', phlm: 'philemon', phm: 'philemon',
  heb: 'hebrews', jas: 'james',
  '1 pet': '1peter', '1pet': '1peter', '2 pet': '2peter', '2pet': '2peter',
  '1 jn': '1john', '1jn': '1john', '2 jn': '2john', '2jn': '2john', '3 jn': '3john', '3jn': '3john',
  jud: 'jude', rev: 'revelation', rv: 'revelation',
};

/** Full book names, normalized, mapped to ids — built from the canon itself. */
const BOOK_NAMES: Record<string, string> = Object.fromEntries(
  BOOKS.map((b) => [normalize(b.name), b.id]),
);

/**
 * Parse "Acts 16", "1 Kings 12:28", "Jn 4:1-15" into a reference.
 * Returns null when the string is not a reference at all.
 */
export function parseScriptureRef(query: string): ScriptureRef | null {
  const cleaned = query.trim().replace(/\s+/g, ' ');
  const match = /^(\d?\s?[a-z][a-z\s]*?)\s*(\d+)(?::(\d+)(?:\s*-\s*(\d+))?)?$/i.exec(cleaned);
  if (!match) return null;

  const [, rawBook, rawChapter, rawVerse, rawVerseEnd] = match;
  if (!rawBook || !rawChapter) return null;

  const key = normalize(rawBook);
  // Aliases are keyed with a space after a leading numeral ("1 sam"); normalize
  // collapses "1sam" to "1sam", so check both spellings.
  const bookId = BOOK_NAMES[key] ?? BOOK_ALIASES[key] ?? BOOK_ALIASES[key.replace(/^(\d)\s/, '$1')];
  if (!bookId) return null;

  const meta = BOOKS.find((b) => b.id === bookId);
  const chapter = Number(rawChapter);
  if (!meta || chapter < 1 || chapter > meta.chapters) return null;

  const ref: ScriptureRef = { book: bookId, chapter };
  if (rawVerse) ref.verse = Number(rawVerse);
  if (rawVerseEnd) ref.verseEnd = Number(rawVerseEnd);
  return ref;
}

export function formatScriptureRef(ref: ScriptureRef): string {
  const meta = BOOKS.find((b) => b.id === ref.book);
  const name = meta?.name ?? ref.book;
  if (ref.verse === undefined) return `${name} ${ref.chapter}`;
  if (ref.verseEnd === undefined) return `${name} ${ref.chapter}:${ref.verse}`;
  return `${name} ${ref.chapter}:${ref.verse}-${ref.verseEnd}`;
}

// ── Query execution ──────────────────────────────────────────────────────────

const MAX_RESULTS = 24;

export function search(query: string): SearchResult[] {
  const raw = query.trim();
  if (raw.length < 2) return [];

  const results: SearchResult[] = [];

  // 1. Scripture references take priority — "Acts 16" is never a place name.
  const ref = parseScriptureRef(raw);
  if (ref) {
    const meta = BOOKS.find((b) => b.id === ref.book);
    const placeIds = meta?.placesByChapter[ref.chapter] ?? [];
    results.push({
      kind: 'scripture',
      id: `${ref.book}-${ref.chapter}`,
      title: formatScriptureRef(ref),
      subtitle:
        placeIds.length > 0
          ? `${placeIds.length} ${placeIds.length === 1 ? 'place' : 'places'} on the map`
          : meta?.indexed
            ? 'No places named in this chapter'
            : 'This chapter is not yet indexed',
      matchedOn: 'Scripture reference',
      score: 1000,
      reference: ref,
      placeIds,
    });
  }

  // 2. Name matching, in script and in transliteration.
  const q = normalize(raw);
  const qScript = normalizeScript(raw);

  for (const entry of INDEX) {
    let best: { score: number; label: string } | null = null;

    for (const { term, label } of entry.terms) {
      if (!term) continue;
      let score = 0;
      if (term === q || term === qScript) score = 500;
      else if (term.startsWith(q) || term.startsWith(qScript)) score = 300;
      else if (term.includes(q) && q.length >= 3) score = 150;
      if (score > 0 && (best === null || score > best.score)) best = { score, label };
    }

    if (best === null && q.length >= 4 && entry.prose.includes(q)) {
      best = { score: 40, label: 'mentioned in the notes' };
    }

    if (best) {
      results.push({
        kind: entry.kind,
        id: entry.id,
        title: entry.title,
        subtitle: entry.subtitle,
        matchedOn: best.label,
        // Places outrank people and events on an equal textual match: on a map,
        // the place is almost always what was meant.
        score: best.score + (entry.kind === 'place' ? 20 : 0),
        placeIds: entry.placeIds.filter((id) => PLACE_BY_ID.has(id)),
      });
    }
  }

  return results.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, MAX_RESULTS);
}
