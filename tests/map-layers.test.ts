import { describe, it, expect } from 'vitest';
import { placesToGeoJSON, journeysToGeoJSON, politiesToGeoJSON, boundsFor } from '../src/lib/map-layers';
import { CORPUS, PLACE_BY_ID } from '../src/atlas/corpus';
import { JOURNEYS } from '../src/atlas/data/journeys';
import { POLITIES } from '../src/atlas/data/polities';

describe('placesToGeoJSON', () => {
  it('omits places that have no coordinates', () => {
    const withNull = [
      ...CORPUS.places.slice(0, 3),
      { ...CORPUS.places[0]!, id: 'unlocated-test', coordinates: null },
    ];
    const collection = placesToGeoJSON(withNull, new Set());
    expect(collection.features.some((f) => f.properties.id === 'unlocated-test')).toBe(false);
  });

  it('emits coordinates in GeoJSON longitude-latitude order', () => {
    const collection = placesToGeoJSON([PLACE_BY_ID.get('jerusalem')!], new Set());
    const [lon, lat] = collection.features[0]!.geometry.coordinates;
    // Jerusalem is near 35°E, 31°N — a lat/lon swap would put it in Iraq.
    expect(lon).toBeGreaterThan(34);
    expect(lon).toBeLessThan(36);
    expect(lat).toBeGreaterThan(31);
    expect(lat).toBeLessThan(32);
  });

  it('marks only the highlighted places', () => {
    const collection = placesToGeoJSON(CORPUS.places, new Set(['jerusalem']));
    const highlighted = collection.features.filter((f) => f.properties.highlighted);
    expect(highlighted).toHaveLength(1);
    expect(highlighted[0]!.properties.id).toBe('jerusalem');
  });

  it('ranks a royal city above a village', () => {
    const collection = placesToGeoJSON(CORPUS.places, new Set());
    const byId = new Map(collection.features.map((f) => [f.properties.id, f.properties.rank]));
    expect(byId.get('jerusalem')!).toBeGreaterThan(byId.get('bethany')!);
  });
});

describe('journeysToGeoJSON', () => {
  it('draws one feature per drawable leg', () => {
    const journey = JOURNEYS.find((j) => j.id === 'paul-second-journey')!;
    const collection = journeysToGeoJSON([journey]);
    expect(collection.features).toHaveLength(journey.legs.length);
  });

  it('produces curved paths rather than two-point straight lines', () => {
    const collection = journeysToGeoJSON([JOURNEYS[0]!]);
    expect(collection.features[0]!.geometry.coordinates.length).toBeGreaterThan(10);
  });

  it('starts and ends each leg exactly on its endpoints', () => {
    const journey = JOURNEYS.find((j) => j.id === 'paul-voyage-rome')!;
    const collection = journeysToGeoJSON([journey]);
    const first = collection.features[0]!;
    const leg = journey.legs[0]!;
    expect(first.geometry.coordinates[0]).toEqual(PLACE_BY_ID.get(leg.fromPlace)!.coordinates);
    expect(first.geometry.coordinates.at(-1)).toEqual(PLACE_BY_ID.get(leg.toPlace)!.coordinates);
  });

  it('draws every journey in the corpus without dropping legs', () => {
    // Guards against a route silently losing a stage because a place lacks
    // coordinates — which would show the user an incomplete journey.
    for (const journey of JOURNEYS) {
      const collection = journeysToGeoJSON([journey]);
      expect(collection.features.length, journey.id).toBe(journey.legs.length);
    }
  });
});

describe('politiesToGeoJSON', () => {
  it('skips polities with no mapped extent', () => {
    const collection = politiesToGeoJSON(POLITIES);
    const withExtent = POLITIES.filter((p) => p.extent !== null);
    expect(collection.features).toHaveLength(withExtent.length);
  });

  it('produces closed polygon rings', () => {
    const collection = politiesToGeoJSON(POLITIES);
    for (const feature of collection.features) {
      if (feature.geometry.type !== 'Polygon') continue;
      const ring = feature.geometry.coordinates[0]!;
      expect(ring[0], feature.properties.id).toEqual(ring.at(-1));
    }
  });
});

describe('boundsFor', () => {
  it('returns null when nothing can be located', () => {
    expect(boundsFor([])).toBeNull();
    expect(boundsFor(['does-not-exist'])).toBeNull();
  });

  it('pads a single point into a fittable box', () => {
    const bounds = boundsFor(['jerusalem'])!;
    expect(bounds[0][0]).toBeLessThan(bounds[1][0]);
    expect(bounds[0][1]).toBeLessThan(bounds[1][1]);
  });

  it('encloses every place it is given', () => {
    const ids = ['rome', 'jerusalem', 'babylon'];
    const [[minLon, minLat], [maxLon, maxLat]] = boundsFor(ids)!;
    for (const id of ids) {
      const [lon, lat] = PLACE_BY_ID.get(id)!.coordinates!;
      expect(lon).toBeGreaterThanOrEqual(minLon);
      expect(lon).toBeLessThanOrEqual(maxLon);
      expect(lat).toBeGreaterThanOrEqual(minLat);
      expect(lat).toBeLessThanOrEqual(maxLat);
    }
  });
});
