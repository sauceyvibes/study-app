import type { HistoricalEvent, Journey, Person, Place, Polity, Territory, Topic } from '../types';
import addedPlaces from './additions/places.json';
import addedPeople from './additions/people.json';
import addedEvents from './additions/events.json';
import addedJourneys from './additions/journeys.json';
import addedPolities from './additions/polities.json';
import addedTerritories from './additions/territories.json';
import addedTopics from './additions/topics.json';

/**
 * Entries written by the admin site.
 *
 * The admin site (deployed from the `additions` branch, never merged) commits
 * straight into these JSON files, so an addition still arrives as a commit with a
 * diff and still has to pass the integrity tests before it ships. Each file is a
 * plain array of the collection's own type. An entry whose id matches an existing
 * one replaces it — that is how a correction to a curated or generated entry is
 * made without touching the source layers — and anything else is appended.
 */
export const ADDITIONS = {
  places: addedPlaces as unknown as Place[],
  people: addedPeople as unknown as Person[],
  events: addedEvents as unknown as HistoricalEvent[],
  journeys: addedJourneys as unknown as Journey[],
  polities: addedPolities as unknown as Polity[],
  territories: addedTerritories as unknown as Territory[],
  topics: addedTopics as unknown as Topic[],
};

export type AdditionCollection = keyof typeof ADDITIONS;

/** Base entries in their original order with overrides swapped in place, then the new ones. */
export function mergeById<T extends { id: string }>(base: readonly T[], added: readonly T[]): T[] {
  if (added.length === 0) return [...base];
  const byId = new Map(added.map((entry) => [entry.id, entry]));
  const merged = base.map((entry) => {
    const replacement = byId.get(entry.id);
    if (replacement) byId.delete(entry.id);
    return replacement ?? entry;
  });
  return [...merged, ...byId.values()];
}
