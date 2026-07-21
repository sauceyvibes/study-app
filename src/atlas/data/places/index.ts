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
  version: '0.2.0',
  statement:
    'Every place named in the Protestant Bible is indexed to the chapter, drawn from OpenBible.info Bible Geocoding (CC BY 4.0). A curated core of major sites carries fuller detail — descriptions, ancient names, archaeology and sources — layered on top of that comprehensive base.',
} as const;
