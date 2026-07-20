import { describe, it, expect } from 'vitest';
import { CORPUS, PLACE_BY_ID, PERSON_BY_ID, EVENT_BY_ID, POLITY_BY_ID, placesForBook, placesAtYear, rangeContains } from '../src/atlas/corpus';
import { PERIODS, TIMELINE_BOUNDS, periodForYear } from '../src/atlas/data/periods';
import { BOOKS } from '../src/atlas/data/books';

/**
 * Referential integrity for the corpus.
 *
 * These are the tests that matter most in this project. The data files are hand
 * written, so the realistic failure mode is not a logic bug but a typo in an id —
 * a place that references an event that does not exist, a journey leg pointing at
 * a site we never wrote. Those would fail silently at runtime (an empty panel, a
 * route that doesn't draw). Here they fail loudly at build time.
 */

describe('corpus integrity', () => {
  it('has no duplicate ids within any collection', () => {
    for (const [name, items] of Object.entries(CORPUS)) {
      const ids = (items as { id: string }[]).map((i) => i.id);
      const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
      expect(duplicates, `duplicate ids in ${name}`).toEqual([]);
    }
  });

  it('resolves every cross-reference a place makes', () => {
    for (const place of CORPUS.places) {
      for (const id of place.people) {
        expect(PERSON_BY_ID.has(id), `${place.id} → person ${id}`).toBe(true);
      }
      for (const id of place.events) {
        expect(EVENT_BY_ID.has(id), `${place.id} → event ${id}`).toBe(true);
      }
      for (const id of place.polities) {
        expect(POLITY_BY_ID.has(id), `${place.id} → polity ${id}`).toBe(true);
      }
      for (const id of place.periods) {
        expect(PERIODS.some((p) => p.id === id), `${place.id} → period ${id}`).toBe(true);
      }
      for (const ref of place.scripture) {
        expect(BOOKS.some((b) => b.id === ref.book), `${place.id} → book ${ref.book}`).toBe(true);
      }
    }
  });

  it('resolves every place a person, event or journey names', () => {
    for (const person of CORPUS.people) {
      for (const id of person.places) {
        expect(PLACE_BY_ID.has(id), `${person.id} → place ${id}`).toBe(true);
      }
    }
    for (const event of CORPUS.events) {
      for (const id of event.places) {
        expect(PLACE_BY_ID.has(id), `${event.id} → place ${id}`).toBe(true);
      }
    }
    for (const journey of CORPUS.journeys) {
      for (const leg of journey.legs) {
        expect(PLACE_BY_ID.has(leg.fromPlace), `${journey.id} leg from ${leg.fromPlace}`).toBe(true);
        expect(PLACE_BY_ID.has(leg.toPlace), `${journey.id} leg to ${leg.toPlace}`).toBe(true);
      }
    }
  });

  it('only indexes chapters that exist in the book', () => {
    for (const bookMeta of BOOKS) {
      for (const key of Object.keys(bookMeta.placesByChapter)) {
        const chapter = Number(key);
        expect(chapter, `${bookMeta.id} chapter ${key}`).toBeGreaterThanOrEqual(1);
        expect(chapter, `${bookMeta.id} chapter ${key}`).toBeLessThanOrEqual(bookMeta.chapters);
      }
      for (const [chapter, ids] of Object.entries(bookMeta.placesByChapter)) {
        for (const id of ids) {
          expect(PLACE_BY_ID.has(id), `${bookMeta.id} ${chapter} → place ${id}`).toBe(true);
        }
      }
    }
  });

  it('gives every place a coherent occupation range', () => {
    for (const place of CORPUS.places) {
      if (place.occupation.end !== null) {
        expect(place.occupation.start, place.id).toBeLessThanOrEqual(place.occupation.end);
      }
    }
  });

  it('keeps coordinates inside the plausible bounds of the biblical world', () => {
    for (const place of CORPUS.places) {
      if (!place.coordinates) continue;
      const [lon, lat] = place.coordinates;
      // Roughly Gibraltar to the Iranian plateau, Upper Egypt to the Black Sea.
      expect(lon, `${place.id} longitude`).toBeGreaterThan(-10);
      expect(lon, `${place.id} longitude`).toBeLessThan(75);
      expect(lat, `${place.id} latitude`).toBeGreaterThan(20);
      expect(lat, `${place.id} latitude`).toBeLessThan(50);
    }
  });

  it('requires alternatives on every contested place', () => {
    // A place can only be marked contested if we can name what it is contested
    // with. This is the rule that stops "contested" becoming a shrug.
    for (const place of CORPUS.places) {
      if (place.confidence === 'contested') {
        expect(place.alternatives?.length ?? 0, `${place.id} is contested but lists no alternative`).toBeGreaterThan(0);
      }
    }
  });

  it('gives every event a range that contains its headline year', () => {
    for (const event of CORPUS.events) {
      expect(event.year, `${event.id}`).toBeGreaterThanOrEqual(event.range.start);
      if (event.range.end !== null) {
        expect(event.year, `${event.id}`).toBeLessThanOrEqual(event.range.end);
      }
    }
  });
});

describe('periods', () => {
  it('covers the whole timeline with no gaps', () => {
    // Periods may overlap — the apostolic age begins in AD 30 while Roman Judea
    // still has forty years to run, and forcing them apart would misrepresent
    // the history. What must hold is that no year falls through the cracks.
    const sorted = [...PERIODS].sort((a, b) => a.range.start - b.range.start);
    expect(sorted[0]!.range.start).toBe(TIMELINE_BOUNDS.start);

    let covered = sorted[0]!.range.end ?? TIMELINE_BOUNDS.end;
    for (const period of sorted.slice(1)) {
      expect(period.range.start, `gap before ${period.id}`).toBeLessThanOrEqual(covered);
      covered = Math.max(covered, period.range.end ?? TIMELINE_BOUNDS.end);
    }
    expect(covered).toBeGreaterThanOrEqual(TIMELINE_BOUNDS.end);
  });

  it('resolves a period for every year on the slider', () => {
    for (let year = TIMELINE_BOUNDS.start; year <= TIMELINE_BOUNDS.end; year += 1) {
      expect(periodForYear(year), `year ${year}`).toBeDefined();
    }
  });

  it('prefers the more recently begun period where two overlap', () => {
    // AD 46 falls inside both Roman Judea and the Apostolic Age. A reader who
    // has just opened Acts should be told they are in the apostolic period.
    expect(periodForYear(46).id).toBe('apostolic');
    // AD 20 predates the apostolic age, so Roman Judea is the only answer.
    expect(periodForYear(20).id).toBe('roman-judea');
  });

  it('clamps out-of-range years rather than throwing', () => {
    expect(periodForYear(-9999).id).toBe(PERIODS[0]!.id);
    expect(periodForYear(9999).id).toBe(PERIODS[PERIODS.length - 1]!.id);
  });
});

describe('selectors', () => {
  it('returns Jerusalem at every year of the timeline', () => {
    // A useful canary: Jerusalem is occupied throughout, so an empty result at
    // any year means the range filter is broken rather than the data thin.
    for (const year of [-2000, -1000, -586, 0, 30, 100]) {
      expect(placesAtYear(year).some((p) => p.id === 'jerusalem'), `year ${year}`).toBe(true);
    }
  });

  it('distinguishes a chapter with no places from a chapter that does not exist', () => {
    expect(placesForBook('jonah', 2)).toEqual([]);
    expect(placesForBook('jonah', 99)).toBeNull();
    expect(placesForBook('nonexistent-book')).toBeNull();
  });

  it('treats an open-ended range as extending forward', () => {
    expect(rangeContains({ start: -1000, end: null }, 2026)).toBe(true);
    expect(rangeContains({ start: -1000, end: null }, -2000)).toBe(false);
  });
});
