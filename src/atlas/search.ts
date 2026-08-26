import type { AncientNames, Person, Place, ScriptureRef, Territory, Topic } from './types';
import { BOOKS, CORPUS, PLACE_BY_ID, placesForPerson } from './corpus';

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

export type ResultKind =
  | 'place'
  | 'person'
  | 'event'
  | 'journey'
  | 'scripture'
  | 'period'
  | 'topic'
  | 'territory';

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

/**
 * Fold Hebrew and Greek to their bare letters.
 *
 * Vowel points and accents are combining marks, and dropping them is what makes
 * the search usable: a reader typing consonantal טורוס or unaccented Τυραννος
 * should find the pointed and accented forms the corpus stores, and a reader
 * copying a word out of a lexicon should not be defeated by whether their source
 * used precomposed or decomposed Unicode. Decomposing first makes both spellings
 * of the same word identical.
 */
function normalizeScript(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
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
  /**
   * How much of the biblical text this entry occupies, used only to order equal
   * textual matches. With three thousand people in the corpus there are eleven
   * Josephs and seven Zechariahs, and a reader typing "Joseph" means the one the
   * text is mostly about.
   */
  weight: number;
}

/**
 * Built on the first search rather than at module load.
 *
 * The index now spans some forty-seven hundred entries across places, people,
 * topics and territories, and normalising every name and alias in it is real
 * work — perhaps twenty milliseconds. Doing it at import would spend that on the
 * critical path of the first paint, for a feature the reader has not asked for
 * yet. Deferring it puts the cost on the first keystroke instead, where it is
 * already hidden behind `useDeferredValue` in the search panel.
 */
let INDEX: IndexEntry[] | null = null;

function index(): IndexEntry[] {
  if (INDEX === null) INDEX = buildIndex();
  return INDEX;
}

/** Strong's numbers are searchable directly: "H0175" finds Aaron. */
function strongsTerms(strongs: readonly string[] | undefined): { term: string; label: string }[] {
  return (strongs ?? []).map((code) => ({ term: normalize(code), label: `Strong's ${code}` }));
}

function buildIndex(): IndexEntry[] {
  const entries: IndexEntry[] = [];

  for (const place of CORPUS.places) {
    const terms = [
      { term: normalize(place.name), label: place.name },
      ...place.aliases.map((a) => ({ term: normalize(a), label: `also called ${a}` })),
      ...ancientNameTerms(place.ancientNames),
      ...strongsTerms(place.strongs),
    ];
    if (place.modernName) terms.push({ term: normalize(place.modernName), label: `modern: ${place.modernName}` });
    for (const alt of place.alternatives ?? []) {
      terms.push({ term: normalize(alt.site), label: `proposed site: ${alt.site}` });
    }
    entries.push({
      kind: 'place',
      id: place.id,
      title: place.name,
      subtitle: describePlace(place),
      placeIds: [place.id],
      terms,
      prose: normalize(`${place.description} ${place.archaeology ?? ''}`),
      weight: place.scripture.length,
    });
  }

  for (const person of CORPUS.people) {
    entries.push({
      kind: 'person',
      id: person.id,
      title: person.name,
      subtitle: describePerson(person),
      placeIds: placesForPerson(person.id).map((p) => p.id),
      terms: [
        { term: normalize(person.name), label: person.name },
        ...person.aliases.map((a) => ({ term: normalize(a), label: `also called ${a}` })),
        ...ancientNameTerms(person.ancientNames),
        ...strongsTerms(person.strongs),
      ],
      prose: normalize(person.description),
      weight: person.scripture.length,
    });
  }

  // Peoples, sects, gods, festivals, months, musical terms, constellations. These
  // carry no coordinates on purpose — see the note on `Topic` in types.ts — so
  // their `placeIds` stay empty and selecting one never moves the map.
  for (const topic of CORPUS.topics) {
    entries.push({
      kind: 'topic',
      id: topic.id,
      title: topic.name,
      subtitle: TOPIC_LABEL[topic.category],
      placeIds: [],
      terms: [
        { term: normalize(topic.name), label: topic.name },
        ...topic.aliases.map((a) => ({ term: normalize(a), label: `also called ${a}` })),
        ...ancientNameTerms(topic.ancientNames),
        ...strongsTerms(topic.strongs),
      ],
      prose: normalize(`${topic.description} ${topic.role}`),
      weight: topic.scripture.length,
    });
  }

  for (const territory of CORPUS.territories) {
    entries.push({
      kind: 'territory',
      id: territory.id,
      title: territory.name,
      subtitle: TERRITORY_LABEL[territory.category],
      placeIds: territory.placeId ? [territory.placeId] : [],
      terms: [
        { term: normalize(territory.name), label: territory.name },
        ...territory.aliases.map((a) => ({ term: normalize(a), label: `also called ${a}` })),
        ...ancientNameTerms(territory.ancientNames),
      ],
      prose: normalize(territory.summary),
      weight: territory.scripture.length,
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
      weight: event.scripture.length,
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
      weight: journey.legs.length,
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
      weight: 0,
    });
  }

  return entries;
}

const TOPIC_LABEL: Record<Topic['category'], string> = {
  deity: 'God, angel or spirit named in the text',
  festival: 'Festival or sacred season',
  month: 'Month of the calendar',
  'people-group': 'People or religious group',
  title: 'Title or office',
  music: 'Musical or liturgical term',
  star: 'Star or constellation',
  other: 'Named in the text',
};

const TERRITORY_LABEL: Record<Territory['category'], string> = {
  province: 'Roman province',
  region: 'Region',
  'tribal-allotment': 'Tribal allotment',
  district: 'District',
};

/**
 * The line under a place in the results.
 *
 * A location inside a settlement says so — "in Jerusalem" tells a reader looking
 * for the Fish Gate that they have found the right thing far better than "Town"
 * does, and there are fifty-nine of them under Jerusalem alone.
 */
function describePlace(place: Place): string {
  const parent = place.parentPlaceId ? PLACE_BY_ID.get(place.parentPlaceId) : undefined;
  if (parent) {
    return `${describeKind(place.kind)} — ${place.siteRelation === 'near' ? 'near' : 'in'} ${parent.name}`;
  }
  return place.modernName ? `${describeKind(place.kind)} — today ${place.modernName}` : describeKind(place.kind);
}

/**
 * The line under a person in the results.
 *
 * "Man" on its own is no help when the corpus holds two and a half thousand of
 * them. What distinguishes one Zechariah from the next is when he lived and what
 * house he belonged to, so both go on the line — that is exactly the information
 * a reader needs to pick the right one out of a list of seven identical names.
 *
 * A people reckoned from an ancestor is not a person and must not read as one.
 */
function describePerson(person: Person): string {
  if (person.kind === 'group') return person.role || 'People group';
  const parts = [person.role || 'Person'];
  if (person.tribe) parts.push(person.tribe);
  parts.push(formatYearRange(person.floruit.start, person.floruit.end));
  return parts.join(' · ');
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
      // Every book is indexed against the full gazetteer now, so an empty result
      // is a fact about the chapter, not a gap in our data.
      subtitle:
        placeIds.length > 0
          ? `${placeIds.length} ${placeIds.length === 1 ? 'place' : 'places'} on the map`
          : 'No places named in this chapter',
      matchedOn: 'Scripture reference',
      score: 1000,
      reference: ref,
      placeIds,
    });
  }

  // 2. Name matching, in script and in transliteration.
  const q = normalize(raw);
  const qScript = normalizeScript(raw);

  // Prose matches are collected apart from name matches, because they are a
  // fallback and behave like one only if they are kept out of the way. Every
  // minor figure's description now names their father and their children, so
  // "Abdi" appears in the prose of a dozen unrelated entries; before this split
  // those filled fourteen of the twenty-four result slots and pushed the other
  // two men actually called Abdi off the page.
  const prose: SearchResult[] = [];

  for (const entry of index()) {
    let best: { score: number; label: string } | null = null;

    for (const { term, label } of entry.terms) {
      if (!term) continue;
      let score = 0;
      if (term === q || term === qScript) score = 500;
      else if (term.startsWith(q) || term.startsWith(qScript)) score = 300;
      else if (term.includes(q) && q.length >= 3) score = 150;
      if (score > 0 && (best === null || score > best.score)) best = { score, label };
    }

    const isProse = best === null && q.length >= 4 && entry.prose.includes(q);
    if (isProse) best = { score: 40, label: 'mentioned in the notes' };
    if (!best) continue;

    const result: SearchResult = {
      kind: entry.kind,
      id: entry.id,
      title: entry.title,
      subtitle: entry.subtitle,
      matchedOn: best.label,
      // Places outrank people and events on an equal textual match: on a map,
      // the place is almost always what was meant. Prominence then separates
      // the equals — searching "Joseph" among eleven of them should lead with
      // the one Genesis spends fourteen chapters on, and searching "Zechariah"
      // with the prophet rather than a gatekeeper named once in Chronicles.
      score: best.score + (entry.kind === 'place' ? 20 : 0) + prominence(entry.weight),
      placeIds: entry.placeIds.filter((id) => PLACE_BY_ID.has(id)),
    };
    (isProse ? prose : results).push(result);
  }

  const byScore = (a: SearchResult, b: SearchResult) =>
    b.score - a.score || a.title.localeCompare(b.title);

  results.sort(byScore);

  // Fill any room the named matches leave. A query like "shipwreck" or "siege
  // ramp" matches no name at all and is answered entirely from here.
  if (results.length < MAX_RESULTS) {
    results.push(...prose.sort(byScore).slice(0, MAX_RESULTS - results.length));
  }

  return results.slice(0, MAX_RESULTS);
}

/**
 * Prominence, compressed so it orders equals without ever outweighing the match
 * itself. A place named in four hundred chapters scores about 12 here, one named
 * once scores 0 — enough to sort a page of identical names, never enough to lift
 * a substring match above a prefix match.
 */
function prominence(weight: number): number {
  return weight <= 0 ? 0 : Math.min(15, Math.log2(weight + 1) * 1.4);
}
