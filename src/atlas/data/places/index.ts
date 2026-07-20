import type { Place } from '../../types';
import { JUDAH_PLACES } from './judah';
import { NORTH_PLACES } from './north';
import { TRANSJORDAN_SYRIA_PLACES } from './transjordan-syria';
import { EGYPT_SINAI_PLACES } from './egypt-sinai';
import { MESOPOTAMIA_PLACES } from './mesopotamia';
import { MEDITERRANEAN_PLACES } from './mediterranean';

/**
 * The gazetteer, assembled from its regional files.
 *
 * Coverage is deliberately not comprehensive. This is a curated core — the places
 * that carry the most narrative weight, researched properly — rather than a thin
 * scrape of every toponym in the text. `ATLAS_COVERAGE` below is surfaced in the
 * UI so a user is never left guessing whether a missing place is absent from the
 * Bible or merely absent from this corpus.
 */
export const PLACES: Place[] = [
  ...JUDAH_PLACES,
  ...NORTH_PLACES,
  ...TRANSJORDAN_SYRIA_PLACES,
  ...EGYPT_SINAI_PLACES,
  ...MESOPOTAMIA_PLACES,
  ...MEDITERRANEAN_PLACES,
];

export const ATLAS_COVERAGE = {
  version: '0.1.0',
  /** Books whose chapter-level place index is complete. */
  fullyIndexedBooks: ['ruth', 'jonah'] as const,
  statement:
    'This edition carries a curated core of the biblical gazetteer rather than every toponym in the text. Places absent here may still be named in scripture. Chapter-level indexing is complete only for the books listed as indexed; elsewhere the book view shows the places we have confirmed, not an exhaustive list.',
} as const;
