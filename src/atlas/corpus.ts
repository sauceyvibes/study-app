import type { AtlasCorpus, BookMeta, HistoricalEvent, Journey, Person, Place, Polity, Year } from './types';
import { PLACES as CURATED_PLACES, ATLAS_COVERAGE } from './data/places';
import { PERIODS } from './data/periods';
import { PEOPLE } from './data/people';
import { MINOR_PEOPLE } from './data/people-minor';
import { EVENTS } from './data/events';
import { JOURNEYS } from './data/journeys';
import { POLITIES } from './data/polities';
import { BOOKS as BASE_BOOKS } from './data/books';
import { GAZETTEER_PLACES, CHAPTER_INDEX, GAZETTEER_ATTRIBUTION } from './data/gazetteer';

export { ATLAS_COVERAGE, GAZETTEER_ATTRIBUTION };

/**
 * The assembled corpus and the lookup indexes built over it.
 *
 * Everything here is computed once at module load from static data. There is no
 * network call and no database read: the corpus ships inside the bundle and the
 * CDN caches it at the edge. A document store would add latency and cost to
 * solve a problem this app does not have — see docs/architecture.md.
 *
 * Two layers make up the places: the hand-curated core (rich entries, in
 * `data/places/`) and the comprehensive OpenBible-derived gazetteer (in
 * `data/gazetteer.ts`). Curated first, so a curated entry wins any id lookup.
 */

/** Curated first, so their richer entries win the id lookup. */
export const PLACES: Place[] = [...CURATED_PLACES, ...GAZETTEER_PLACES];

/** Full biographies first, so they win the id lookup if a slug is ever repeated. */
const ALL_PEOPLE: Person[] = [...PEOPLE, ...MINOR_PEOPLE.filter((m) => !PEOPLE.some((p) => p.id === m.id))];

/**
 * Books with the comprehensive chapter index merged in. Every book is now marked
 * indexed: the OpenBible dataset covers the whole Protestant canon, so a chapter
 * with no places genuinely names none rather than being un-worked.
 */
export const BOOKS: BookMeta[] = BASE_BOOKS.map((book) => ({
  ...book,
  placesByChapter: CHAPTER_INDEX[book.id] ?? {},
  indexed: true,
}));

export const CORPUS: AtlasCorpus = {
  places: PLACES,
  periods: PERIODS,
  people: ALL_PEOPLE,
  events: EVENTS,
  journeys: JOURNEYS,
  polities: POLITIES,
  books: BOOKS,
};

function indexById<T extends { id: string }>(items: T[]): ReadonlyMap<string, T> {
  return new Map(items.map((item) => [item.id, item]));
}

export const PLACE_BY_ID = indexById(PLACES);
export const PERSON_BY_ID = indexById(ALL_PEOPLE);
export const EVENT_BY_ID = indexById(EVENTS);
export const JOURNEY_BY_ID = indexById(JOURNEYS);
export const POLITY_BY_ID = indexById(POLITIES);
export const BOOK_BY_ID: ReadonlyMap<string, BookMeta> = indexById(BOOKS);

/** Places with no coordinates cannot be drawn; keep them searchable but off-map. */
export const MAPPABLE_PLACES: Place[] = PLACES.filter((p) => p.coordinates !== null);

/**
 * Person id → place ids, built by reading the gazetteer rather than the people
 * files. Every `Place.people` entry is an assertion that the person belongs on
 * that place's map, so inverting it gives each figure their locations for free
 * and keeps the two directions from drifting apart.
 */
const PLACES_BY_PERSON: ReadonlyMap<string, string[]> = (() => {
  const index = new Map<string, string[]>();
  for (const place of PLACES) {
    for (const personId of place.people) {
      const existing = index.get(personId);
      if (existing) existing.push(place.id);
      else index.set(personId, [place.id]);
    }
  }
  return index;
})();

/**
 * Every place associated with a person.
 *
 * A curated `Person.places` list comes first and in its authored order — for
 * Paul or Abraham that order is the itinerary, which is worth preserving — and
 * anything the reverse index adds is appended.
 */
export function placesForPerson(personId: string): Place[] {
  const person = PERSON_BY_ID.get(personId);
  const curated = person?.places ?? [];
  const derived = PLACES_BY_PERSON.get(personId) ?? [];
  const ordered = [...curated, ...derived.filter((id) => !curated.includes(id))];
  return resolvePlaces(ordered);
}

/**
 * Every datable event a person takes part in, earliest first.
 *
 * Read straight off `HistoricalEvent.people`, so the person panel and the timeline
 * are drawing on the same links rather than a second, hand-kept list that could
 * drift from it.
 */
export function eventsForPerson(personId: string): HistoricalEvent[] {
  return EVENTS.filter((e) => e.people.includes(personId)).sort((a, b) => a.year - b.year);
}

/** Resolve a list of ids to entities, silently dropping ids that do not exist. */
export function resolvePlaces(ids: readonly string[]): Place[] {
  return ids.map((id) => PLACE_BY_ID.get(id)).filter((p): p is Place => p !== undefined);
}

export function resolvePeople(ids: readonly string[]): Person[] {
  return ids.map((id) => PERSON_BY_ID.get(id)).filter((p): p is Person => p !== undefined);
}

export function resolveEvents(ids: readonly string[]): HistoricalEvent[] {
  return ids.map((id) => EVENT_BY_ID.get(id)).filter((e): e is HistoricalEvent => e !== undefined);
}

export function resolvePolities(ids: readonly string[]): Polity[] {
  return ids.map((id) => POLITY_BY_ID.get(id)).filter((p): p is Polity => p !== undefined);
}

/** True when `year` falls inside the range, treating a null end as open. */
export function rangeContains(range: { start: Year; end: Year | null }, year: Year): boolean {
  return year >= range.start && (range.end === null || year <= range.end);
}

/** Places whose relevance window includes the given year. */
export function placesAtYear(year: Year): Place[] {
  return MAPPABLE_PLACES.filter((p) => rangeContains(p.occupation, year));
}

/** Polities with a drawable extent active in the given year. */
export function politiesAtYear(year: Year): Polity[] {
  return POLITIES.filter((p) => p.extent !== null && rangeContains(p.range, year));
}

/** Events falling within `tolerance` years of the given year. */
export function eventsNearYear(year: Year, tolerance = 25): HistoricalEvent[] {
  return EVENTS.filter((e) => Math.abs(e.year - year) <= tolerance).sort((a, b) => a.year - b.year);
}

/** Journeys whose span overlaps the given year. */
export function journeysAtYear(year: Year): Journey[] {
  return JOURNEYS.filter((j) => rangeContains(j.range, year));
}

/**
 * Places associated with a book, optionally narrowed to one chapter.
 *
 * Returns `null` for `chapter` values outside the book's range rather than an
 * empty array, so callers can distinguish "chapter 4 mentions no places we hold"
 * from "there is no chapter 4".
 */
export function placesForBook(bookId: string, chapter?: number): Place[] | null {
  const meta = BOOKS.find((b) => b.id === bookId);
  if (!meta) return null;

  if (chapter !== undefined) {
    if (chapter < 1 || chapter > meta.chapters) return null;
    return resolvePlaces(meta.placesByChapter[chapter] ?? []);
  }

  const ids = new Set<string>();
  for (const list of Object.values(meta.placesByChapter)) {
    for (const id of list) ids.add(id);
  }
  return resolvePlaces([...ids]);
}

/** Journeys that a given book narrates, by scripture-reference overlap. */
export function journeysForBook(bookId: string): Journey[] {
  return JOURNEYS.filter(
    (j) => j.scripture.some((r) => r.book === bookId) || j.legs.some((l) => l.scripture.some((r) => r.book === bookId)),
  );
}
