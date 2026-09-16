import { describe, it, expect } from 'vitest';
import {
  CORPUS,
  PLACE_BY_ID,
  PERSON_BY_ID,
  TOPIC_BY_ID,
  TERRITORY_BY_ID,
  POLITY_BY_ID,
  BOOKS,
  sitesWithin,
  parentOf,
  territoriesAtYear,
} from '../src/atlas/corpus';
import { PERIODS } from '../src/atlas/data/periods';
import { search } from '../src/atlas/search';
import { placesToGeoJSON, territoriesToGeoJSON } from '../src/lib/map-layers';

/**
 * Integrity for the three collections the comprehensive nomenclature adds:
 * people, subjects and territories, plus the sites-within-places relation that
 * cuts across the gazetteer.
 *
 * These matter for the same reason the existing corpus tests do — the data is
 * assembled by a merge over three sources, and the realistic failure is not a
 * logic bug but a match that silently went to the wrong record. A wrong merge
 * looks completely normal at runtime: a panel with plausible content that
 * happens to belong to a different person.
 */

describe('the comprehensive nomenclature', () => {
  it('carries every proper name, not just the curated core', () => {
    // TIPNR individuates a little over three thousand people. A regression that
    // dropped the bulk import would show here long before anyone noticed a
    // search returning nothing.
    expect(CORPUS.people.length).toBeGreaterThan(3000);
    expect(CORPUS.topics.length).toBeGreaterThan(90);
    expect(CORPUS.territories.length).toBeGreaterThan(30);
  });

  it('resolves every family link a person makes', () => {
    for (const person of CORPUS.people) {
      const relations = person.relations;
      if (!relations) continue;
      const ids = [
        ...(relations.father ? [relations.father] : []),
        ...(relations.mother ? [relations.mother] : []),
        ...relations.siblings,
        ...relations.partners,
        ...relations.offspring,
      ];
      for (const id of ids) {
        expect(PERSON_BY_ID.has(id), `${person.id} → person ${id}`).toBe(true);
      }
      expect(ids, `${person.id} is related to itself`).not.toContain(person.id);
    }
  });

  it('gives every person a period that exists and a coherent floruit', () => {
    for (const person of CORPUS.people) {
      for (const id of person.periods ?? []) {
        expect(PERIODS.some((p) => p.id === id), `${person.id} → period ${id}`).toBe(true);
      }
      if (person.floruit.end !== null) {
        expect(person.floruit.start, person.id).toBeLessThanOrEqual(person.floruit.end);
      }
    }
  });

  it('points every scripture reference at a chapter the book actually has', () => {
    const chapters = new Map(BOOKS.map((b) => [b.id, b.chapters]));
    for (const collection of [CORPUS.people, CORPUS.topics, CORPUS.territories]) {
      for (const entry of collection) {
        for (const ref of entry.scripture) {
          const count = chapters.get(ref.book);
          expect(count, `${entry.id} → book ${ref.book}`).toBeDefined();
          expect(ref.chapter, `${entry.id} → ${ref.book} ${ref.chapter}`).toBeGreaterThanOrEqual(1);
          expect(ref.chapter, `${entry.id} → ${ref.book} ${ref.chapter}`).toBeLessThanOrEqual(count!);
        }
      }
    }
  });

  it('merges each curated figure onto the right individual, not merely the right name', () => {
    // The five Marys and eleven Josephs are the whole reason the merge scores on
    // evidence rather than matching on name. If that scoring regresses, these are
    // the entries that go wrong first and the least likely to be noticed by eye.
    expect(PERSON_BY_ID.get('mary')?.role).toBe('Mother of Jesus');
    expect(PERSON_BY_ID.get('mary')?.ancientNames.greek).toBeTruthy();
    expect(PERSON_BY_ID.get('joseph')?.role).toContain('Patriarch');

    // `joseph` named the patriarch *and* the husband of Mary, and the shared id
    // meant the husband of Mary was silently dropped from the atlas entirely.
    const spouse = CORPUS.people.find((p) => p.role === 'Husband of Mary');
    expect(spouse, 'the husband of Mary must survive the id collision').toBeDefined();
    expect(spouse!.id).not.toBe('joseph');
  });

  it('enriches curated people with the ancient names and references they lacked', () => {
    const aaron = PERSON_BY_ID.get('aaron')!;
    expect(aaron.ancientNames.hebrew).toBeTruthy();
    expect(aaron.strongs?.length ?? 0).toBeGreaterThan(0);
    // The curated entry was written with a handful of key passages; the merge
    // should have brought the exhaustive list in behind them.
    expect(aaron.scripture.length).toBeGreaterThan(50);
    expect(aaron.relations?.siblings).toContain('moses');
  });

  it('holds the minor figures a study tool is actually consulted about', () => {
    const tyrannus = PERSON_BY_ID.get('tyrannus');
    expect(tyrannus, 'Tyrannus of Acts 19 must be in the corpus').toBeDefined();
    expect(tyrannus!.ancientNames.greek?.normalize('NFC')).toBe('Τύραννος'.normalize('NFC'));
    expect(tyrannus!.scripture).toContainEqual({ book: 'acts', chapter: 19 });
  });

  it('keeps peoples and sects searchable and off the map', () => {
    const pharisee = TOPIC_BY_ID.get('pharisee');
    expect(pharisee, 'Pharisees must be searchable').toBeDefined();
    expect(pharisee!.category).toBe('people-group');
    // Topics carry no coordinate by construction, and nothing in the corpus
    // should have quietly given them one.
    for (const topic of CORPUS.topics) {
      expect(topic, `${topic.id}`).not.toHaveProperty('coordinates');
    }
  });
});

describe('places within places', () => {
  it('resolves every parent and never lets a place contain itself', () => {
    for (const place of CORPUS.places) {
      if (!place.parentPlaceId) continue;
      expect(PLACE_BY_ID.has(place.parentPlaceId), `${place.id} → ${place.parentPlaceId}`).toBe(true);
      expect(place.parentPlaceId, `${place.id} is its own parent`).not.toBe(place.id);
      expect(['in', 'near']).toContain(place.siteRelation);
    }
  });

  it('has no cycle in the containment chain', () => {
    // A cycle would hang the panel's parent link and, worse, would mean the merge
    // had concluded that two places each contain the other.
    for (const place of CORPUS.places) {
      const seen = new Set<string>([place.id]);
      let current = parentOf(place);
      while (current) {
        expect(seen.has(current.id), `containment cycle at ${current.id}`).toBe(false);
        seen.add(current.id);
        current = parentOf(current);
      }
    }
  });

  it('holds the named interior of Jerusalem', () => {
    const sites = sitesWithin('jerusalem');
    // Gates, pools, towers, porticoes, the temple. Nehemiah 3 alone names a dozen.
    expect(sites.length).toBeGreaterThan(30);
    const names = sites.map((s) => s.name);
    expect(names).toContain('Solomon\'s Portico');
    expect(names).toContain('Fish Gate');
  });

  it('holds the hall of Tyrannus, inside Ephesus, with witnesses', () => {
    // The worked example: a location the text names, no gazetteer catalogues,
    // and a reader studying Acts 19 needs.
    const hall = PLACE_BY_ID.get('hall-of-tyrannus');
    expect(hall).toBeDefined();
    expect(hall!.parentPlaceId).toBe('ephesus');
    expect(hall!.siteRelation).toBe('in');
    expect(hall!.people).toContain('tyrannus');
    expect(hall!.externalSources?.length ?? 0).toBeGreaterThan(0);
  });

  it('does not pin the same settlement twice', () => {
    // Curated Jerusalem used to absorb OpenBible's "City of David" record — a few
    // hundred metres nearer than its "Jerusalem" record — leaving a second
    // Jerusalem drawn beside the first and carrying most of the references.
    const jerusalems = CORPUS.places.filter((p) => p.name === 'Jerusalem');
    expect(jerusalems).toHaveLength(1);
    expect(jerusalems[0]!.id).toBe('jerusalem');
    expect(jerusalems[0]!.scripture.length).toBeGreaterThan(200);
  });

  it('fans coincident interior sites apart so each can be clicked', () => {
    const sites = sitesWithin('jerusalem');
    const collection = placesToGeoJSON(sites, new Set());
    const positions = new Set(
      collection.features.map((f) => f.geometry.coordinates.join(',')),
    );
    // Every site must land on its own point, or the ones underneath are
    // unreachable however carefully the panel lists them.
    expect(positions.size).toBe(collection.features.length);
  });

  it('keeps a fanned site inside its own city', () => {
    const centre = PLACE_BY_ID.get('jerusalem')!.coordinates!;
    for (const feature of placesToGeoJSON(sitesWithin('jerusalem'), new Set()).features) {
      if (!feature.properties.displaced) continue;
      const [lon, lat] = feature.geometry.coordinates as [number, number];
      // Roughly a kilometre and a half — about the footprint of the walled city.
      expect(Math.hypot(lon - centre[0], lat - centre[1])).toBeLessThan(0.02);
    }
  });
});

describe('territories', () => {
  it('resolves every place and polity a territory names', () => {
    for (const territory of CORPUS.territories) {
      if (territory.placeId) {
        expect(PLACE_BY_ID.has(territory.placeId), ` → place `).toBe(true);
      }
      if (territory.polityId) {
        expect(POLITY_BY_ID.has(territory.polityId), `${territory.id} → polity ${territory.polityId}`).toBe(true);
      }
    }
  });

  it('draws closed rings inside the bounds of the map', () => {
    for (const territory of CORPUS.territories) {
      const rings =
        territory.extent.type === 'Polygon'
          ? territory.extent.coordinates
          : territory.extent.coordinates.flat();
      expect(rings.length, `${territory.id} has no ring`).toBeGreaterThan(0);
      for (const ring of rings) {
        expect(ring.length, `${territory.id} ring too short`).toBeGreaterThanOrEqual(4);
        expect(ring[0], `${territory.id} ring is not closed`).toEqual(ring[ring.length - 1]);
        for (const [lon, lat] of ring) {
          expect(lon, `${territory.id} longitude`).toBeGreaterThan(-12);
          expect(lon, `${territory.id} longitude`).toBeLessThan(78);
          expect(lat, `${territory.id} latitude`).toBeGreaterThan(8);
          expect(lat, `${territory.id} latitude`).toBeLessThan(51);
        }
      }
    }
  });

  it('gives every territory a coherent span', () => {
    for (const territory of CORPUS.territories) {
      if (territory.range.end !== null) {
        expect(territory.range.start, territory.id).toBeLessThanOrEqual(territory.range.end);
      }
    }
  });

  it('draws the largest area first, so a small one is never buried', () => {
    const features = territoriesToGeoJSON(CORPUS.territories).features;
    const areas = features.map((f) => f.properties.area);
    expect([...areas].sort((a, b) => b - a)).toEqual(areas);
  });

  it('shades the province of Asia in the apostolic age', () => {
    const asia = TERRITORY_BY_ID.get('province-asia');
    expect(asia, 'the province of Asia must be on the map').toBeDefined();
    expect(territoriesAtYear(52).map((t) => t.id)).toContain('province-asia');
    // Ephesus stands inside it, which is the whole point of drawing it.
    expect(asia!.polityId).toBe('rome');
  });
});

describe('search over the whole nomenclature', () => {
  const topId = (query: string, kind: string) =>
    search(query).find((r) => r.kind === kind)?.id;

  it('finds a man named once in the whole Bible', () => {
    expect(topId('Tyrannus', 'person')).toBe('tyrannus');
  });

  it('finds a room inside a city', () => {
    const hall = search('Tyrannus').find((r) => r.kind === 'place');
    expect(hall?.id).toBe('hall-of-tyrannus');
    expect(hall?.subtitle).toContain('Ephesus');
  });

  it('finds a Roman province', () => {
    expect(topId('province of Asia', 'territory')).toBe('province-asia');
  });

  it('finds a sect, and gives it nowhere to go on the map', () => {
    const results = search('Sadducee');
    const topic = results.find((r) => r.kind === 'topic');
    expect(topic).toBeDefined();
    expect(topic!.placeIds).toEqual([]);
  });

  it('ranks the well-known bearer of a shared name first', () => {
    // Eleven Josephs, five Marys. The one the text is mostly about should lead.
    expect(topId('Joseph', 'person')).toBe('joseph');
    expect(topId('Mary', 'person')).toBe('mary');
  });

  it('searches Hebrew and Greek script, and Strong\'s numbers', () => {
    expect(topId('Τύραννος', 'person')).toBe('tyrannus');
    expect(topId('G5181', 'person')).toBe('tyrannus');
  });

  it('finds a gazetteer place by the Hebrew the merge supplied', () => {
    // The OpenBible layer ships no ancient names at all; every one of these
    // arrived from the TIPNR merge, so an empty result means that merge broke.
    const withHebrew = CORPUS.places.filter((p) => p.ancientNames.hebrew);
    expect(withHebrew.length).toBeGreaterThan(500);
  });
});
