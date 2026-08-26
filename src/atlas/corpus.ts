import type {
  AtlasCorpus,
  BookMeta,
  Coordinates,
  HistoricalEvent,
  Journey,
  Person,
  Place,
  Polity,
  Territory,
  Year,
} from './types';
import { ATLAS_COVERAGE } from './data/places';
import { PERIODS } from './data/periods';
import { EVENTS } from './data/events';
import { JOURNEYS } from './data/journeys';
import { POLITIES } from './data/polities';
import { TERRITORIES } from './data/territories';
import { BOOKS as BASE_BOOKS } from './data/books';
import { ASSEMBLED_PLACES, CHAPTER_INDEX, GAZETTEER_ATTRIBUTION } from './data/gazetteer';
import { ALL_PEOPLE, TOPICS, NOMENCLATURE_ATTRIBUTION } from './data/nomenclature';

export { ATLAS_COVERAGE, GAZETTEER_ATTRIBUTION, NOMENCLATURE_ATTRIBUTION };

/**
 * The assembled corpus and the lookup indexes built over it.
 *
 * Everything here is computed once at module load from static data. There is no
 * network call and no database read: the corpus ships inside the bundle and the
 * CDN caches it at the edge. A document store would add latency and cost to
 * solve a problem this app does not have — see docs/architecture.md.
 *
 * Three layers make up the places, assembled in `data/gazetteer.ts`: the
 * hand-curated core and its named sites (`data/places/`), the comprehensive
 * OpenBible gazetteer, and STEPBible's TIPNR, which supplies the ancient-language
 * names the first two lack and the locations *inside* settlements that neither
 * catalogues. People are assembled the same way in `data/nomenclature.ts`.
 * Curated first throughout, so a curated entry wins any id lookup.
 */

/** Curated first, so their richer entries win the id lookup. */
export const PLACES: Place[] = ASSEMBLED_PLACES;

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
  territories: TERRITORIES,
  topics: TOPICS,
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
export const TERRITORY_BY_ID = indexById(TERRITORIES);
export const TOPIC_BY_ID = indexById(TOPICS);
export const BOOK_BY_ID: ReadonlyMap<string, BookMeta> = indexById(BOOKS);

/** Places with no coordinates cannot be drawn; keep them searchable but off-map. */
export const MAPPABLE_PLACES: Place[] = PLACES.filter((p) => p.coordinates !== null);

/**
 * Place id → the named locations inside or beside it.
 *
 * Inverted from `Place.parentPlaceId` rather than kept as a second list on the
 * parent, for the same reason `PLACES_BY_PERSON` is: one direction is authored
 * and the other is derived, so the two cannot drift apart.
 */
const SITES_BY_PARENT: ReadonlyMap<string, string[]> = (() => {
  const index = new Map<string, string[]>();
  for (const place of PLACES) {
    if (!place.parentPlaceId) continue;
    const existing = index.get(place.parentPlaceId);
    if (existing) existing.push(place.id);
    else index.set(place.parentPlaceId, [place.id]);
  }
  return index;
})();

/**
 * The named locations within a place, best-attested first.
 *
 * Jerusalem has more than thirty — gates, pools, towers, the porticoes of the
 * temple — so the ordering matters: a reader opening Jerusalem should meet the
 * temple and Solomon's Portico before the Dung Gate.
 */
export function sitesWithin(placeId: string): Place[] {
  return resolvePlaces(SITES_BY_PARENT.get(placeId) ?? []).sort(
    (a, b) => b.scripture.length - a.scripture.length || a.name.localeCompare(b.name),
  );
}

/** The settlement a site belongs to, or null for a place that stands on its own. */
export function parentOf(place: Place): Place | null {
  return place.parentPlaceId ? PLACE_BY_ID.get(place.parentPlaceId) ?? null : null;
}

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

export function resolveTerritories(ids: readonly string[]): Territory[] {
  return ids.map((id) => TERRITORY_BY_ID.get(id)).filter((t): t is Territory => t !== undefined);
}

/** Territories whose name denoted that ground in the given year. */
export function territoriesAtYear(year: Year): Territory[] {
  return TERRITORIES.filter((t) => rangeContains(t.range, year));
}

/**
 * Places named in the same chapters as a person.
 *
 * Most of the three thousand figures in the corpus have no place attested to
 * them: the sources say who a man's father was, not where he lived. Chapter
 * co-occurrence is a real signal in place of that, but a weak one, and it is
 * labelled as such in the interface — these are places *named alongside* someone,
 * not places they are recorded at.
 *
 * Raw co-occurrence alone would return Jerusalem for everybody, since Jerusalem
 * is named in hundreds of chapters. Scoring by how much of a place's *own*
 * footprint the overlap accounts for corrects that: three chapters shared with a
 * place named in four is a strong association, and three shared with a place
 * named in four hundred is a coincidence.
 */
export function placesNamedWithPerson(personId: string, limit = 12): Place[] {
  const person = PERSON_BY_ID.get(personId);
  if (!person) return [];

  const shared = new Map<string, number>();
  // A much-named figure can carry hundreds of references; the leading ones are
  // enough to characterise them and keep this cheap enough to call on open.
  for (const ref of person.scripture.slice(0, 200)) {
    for (const id of CHAPTER_INDEX[ref.book]?.[ref.chapter] ?? []) {
      shared.set(id, (shared.get(id) ?? 0) + 1);
    }
  }

  const scored: { place: Place; score: number }[] = [];
  for (const [id, count] of shared) {
    const place = PLACE_BY_ID.get(id);
    if (!place || !place.coordinates) continue;
    const footprint = Math.max(1, place.scripture.length);
    scored.push({ place, score: count * (count / footprint) });
  }

  return scored
    .sort((a, b) => b.score - a.score || a.place.name.localeCompare(b.place.name))
    .slice(0, limit)
    .map((entry) => entry.place);
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

/** Ordered, de-duplicated place ids a journey passes through. */
export function placeIdsForJourney(journey: Journey): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const leg of journey.legs) {
    for (const id of [leg.fromPlace, leg.toPlace]) {
      if (!seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
    }
  }
  return ids;
}

/** The places a journey passes through, in itinerary order. */
export function placesForJourney(journey: Journey): Place[] {
  return resolvePlaces(placeIdsForJourney(journey));
}

/**
 * The datable events that fall within a journey.
 *
 * An event counts if it is dated inside the journey's window *and* it either
 * involves the traveller or happens at one of the journey's stops — which keeps,
 * say, the Areopagus address on Paul's second journey while excluding an unrelated
 * event that merely shares the years.
 */
export function eventsForJourney(journey: Journey): HistoricalEvent[] {
  const stops = new Set(journey.legs.flatMap((l) => [l.fromPlace, l.toPlace]));
  const start = journey.range.start;
  const end = journey.range.end ?? start;
  return EVENTS.filter((e) => {
    if (e.year < start || e.year > end) return false;
    return e.people.includes(journey.traveler) || e.places.some((p) => stops.has(p));
  }).sort((a, b) => a.year - b.year);
}

/** Great-circle distance in kilometres between two [lon, lat] points. */
function haversineKm(a: Coordinates, b: Coordinates): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b[1] - a[1]);
  const dLon = toRad(b[0] - a[0]);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export interface JourneyStats {
  /** Rounded total path length in km, summed over locatable legs. */
  km: number;
  stages: number;
  landStages: number;
  seaStages: number;
  inferredStages: number;
}

/**
 * Distance and mode breakdown for a journey. The distance is the sum of the
 * straight-line lengths of the legs whose endpoints we can place — an honest
 * lower bound on the ground covered, not a claim about the exact road taken.
 */
export function journeyStats(journey: Journey): JourneyStats {
  let km = 0;
  let landStages = 0;
  let seaStages = 0;
  let inferredStages = 0;
  for (const leg of journey.legs) {
    const from = PLACE_BY_ID.get(leg.fromPlace)?.coordinates;
    const to = PLACE_BY_ID.get(leg.toPlace)?.coordinates;
    if (from && to) km += haversineKm(from, to);
    if (leg.mode === 'sea') seaStages += 1;
    else if (leg.mode === 'inferred') inferredStages += 1;
    else landStages += 1;
  }
  return { km: Math.round(km), stages: journey.legs.length, landStages, seaStages, inferredStages };
}
