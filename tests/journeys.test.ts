import { describe, it, expect } from 'vitest';
import {
  CORPUS,
  JOURNEY_BY_ID,
  PERSON_BY_ID,
  PLACE_BY_ID,
  placeIdsForJourney,
  placesForJourney,
  eventsForJourney,
  journeyStats,
} from '../src/atlas/corpus';

const JOURNEYS = CORPUS.journeys;

/**
 * The route panel is driven by four pure helpers. The realistic failures are a
 * journey whose traveller is not a real person, an itinerary that double-counts a
 * stop, an "events along the way" list that pulls in something outside the
 * journey's years, or a distance that silently comes out zero.
 */

describe('journey helpers', () => {
  it('lists each stop once, in itinerary order', () => {
    const journey = JOURNEY_BY_ID.get('paul-second-journey')!;
    const ids = placeIdsForJourney(journey);
    expect(ids[0]).toBe('antioch-syria');
    expect(new Set(ids).size).toBe(ids.length); // no duplicates
    expect(ids).toContain('corinth');
    expect(ids).toContain('ephesus');
    // Every stop resolves to a real place.
    expect(placesForJourney(journey).length).toBe(ids.length);
  });

  it('every journey has a real traveller and locatable legs', () => {
    for (const journey of JOURNEYS) {
      expect(PERSON_BY_ID.has(journey.traveler), `${journey.id} traveller`).toBe(true);
      for (const leg of journey.legs) {
        expect(PLACE_BY_ID.has(leg.fromPlace), `${journey.id} ${leg.fromPlace}`).toBe(true);
        expect(PLACE_BY_ID.has(leg.toPlace), `${journey.id} ${leg.toPlace}`).toBe(true);
      }
    }
  });

  it('gathers events within the journey window, earliest first', () => {
    const journey = JOURNEY_BY_ID.get('paul-second-journey')!;
    const events = eventsForJourney(journey);
    expect(events.map((e) => e.id)).toContain('gallio-hearing');
    expect(events.map((e) => e.id)).toContain('areopagus-address');
    for (const event of events) {
      expect(event.year).toBeGreaterThanOrEqual(journey.range.start);
      expect(event.year).toBeLessThanOrEqual(journey.range.end ?? journey.range.start);
    }
    const years = events.map((e) => e.year);
    expect([...years].sort((a, b) => a - b)).toEqual(years);
  });

  it('counts stages by mode and measures a non-zero distance', () => {
    const stats = journeyStats(JOURNEY_BY_ID.get('paul-first-journey')!);
    expect(stats.stages).toBe(5);
    expect(stats.seaStages).toBe(2);
    expect(stats.landStages).toBe(2);
    expect(stats.inferredStages).toBe(1);
    expect(stats.km).toBeGreaterThan(0);
  });

  it('measures a plausible distance for every journey', () => {
    for (const journey of JOURNEYS) {
      const stats = journeyStats(journey);
      expect(stats.stages).toBe(journey.legs.length);
      expect(stats.km, `${journey.id} distance`).toBeGreaterThan(0);
    }
  });
});
