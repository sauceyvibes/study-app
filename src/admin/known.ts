import { CORPUS } from '@/atlas/corpus';
import { PERIODS } from '@/atlas/data/periods';
import { BOOKS } from '@/atlas/data/books';
import type { AdditionCollection } from '@/atlas/data/additions';
import { COLLECTIONS } from './schema';
import type { Entry } from './form';
import type { KnownIds } from './validate';

/**
 * Every id a reference may resolve to: the corpus bundled into this deployment
 * plus the additions as they stand on GitHub right now, so a place added a
 * minute ago can already be named as a route's stop.
 */
export function knownIds(fresh: Partial<Record<AdditionCollection, Entry[]>>): KnownIds {
  const ids = (base: { id: string }[], extra: Entry[] = []) =>
    new Set([...base.map((e) => e.id), ...extra.map((e) => String(e.id))]);
  const known = {
    periods: new Set(PERIODS.map((p) => p.id)),
    books: new Set(BOOKS.map((b) => b.id)),
  } as Record<keyof KnownIds, Set<string>>;
  for (const collection of COLLECTIONS) {
    known[collection] = ids(CORPUS[collection] as { id: string }[], fresh[collection]);
  }
  return known;
}

/** Collections an entry of this kind can point at, which are worth reading fresh. */
export function referencedCollections(collection: AdditionCollection): AdditionCollection[] {
  switch (collection) {
    case 'places': return ['places', 'people', 'events', 'polities'];
    case 'journeys': return ['journeys', 'places', 'people'];
    case 'polities': return ['polities', 'places'];
    case 'territories': return ['territories', 'places', 'polities'];
    case 'events': return ['events', 'places', 'people'];
    case 'people': return ['people', 'places'];
    case 'topics': return ['topics'];
  }
}
