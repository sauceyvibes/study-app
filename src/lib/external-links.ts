import type { Coordinates } from '@/atlas/types';

/**
 * Links out of the atlas, into the reference works a study session actually needs.
 *
 * Two kinds live here. The curated `ExternalSource` entries in the corpus name a
 * specific ancient witness — Josephus on the porticoes, the Gallio inscription —
 * and carry their own URLs. What this file adds is the *systematic* set: the
 * links that can be built for any entry from what the corpus already holds, so
 * that a figure named once in a genealogy still opens onto a concordance, a
 * lexicon and a map, instead of into a dead end.
 *
 * Everything is constructed rather than stored. A STEPBible query built from a
 * Strong's number is a hundred bytes of code and would be four hundred kilobytes
 * of shipped JSON across three thousand people.
 */

export interface ExternalLink {
  label: string;
  /** One line on what the reader will find there. */
  hint: string;
  url: string;
}

const STEP = 'https://www.stepbible.org/';

/**
 * Every occurrence of this exact word, in the ESV alongside the KJV.
 *
 * Keyed on the *disambiguated* Strong's number rather than the English spelling,
 * which is the whole value of it: searching "Zechariah" in a concordance returns
 * every Zechariah, while H2148B returns the one person.
 */
export function stepBibleByStrongs(strongs: readonly string[] | undefined): ExternalLink | null {
  const code = strongs?.[0];
  if (!code) return null;
  const query = `version=ESV|version=KJV|strong=${encodeURIComponent(code)}`;
  return {
    label: 'STEPBible concordance',
    hint: `Every occurrence of ${code}, with the Hebrew or Greek and an interlinear.`,
    url: `${STEP}?q=${query}`,
  };
}

/** A plain word search, for an entry with no Strong's number to key on. */
export function stepBibleByName(name: string): ExternalLink {
  const query = `version=ESV|version=KJV|text=${encodeURIComponent(name)}`;
  return {
    label: 'STEPBible search',
    hint: `Every verse naming ${name} in the ESV and KJV.`,
    url: `${STEP}?q=${query}`,
  };
}

/** The lexicon entry: the root, the semantic range, and the cognates. */
export function blueLetterLexicon(strongs: readonly string[] | undefined): ExternalLink | null {
  const code = strongs?.[0];
  if (!code) return null;
  const prefix = code.startsWith('G') ? 'G' : 'H';
  // Blue Letter Bible keys on the plain Strong's number: the leading zeros and
  // the disambiguating letter this corpus carries are STEPBible's additions.
  const bare = code.replace(/^[HG]/, '').replace(/[A-Z]$/, '').replace(/^0+/, '');
  if (!bare) return null;
  return {
    label: 'Blue Letter Bible lexicon',
    hint: 'The lexical entry: root, range of meaning, and every form attested.',
    url: `https://www.blueletterbible.org/lexicon/${prefix.toLowerCase()}${bare}/kjv/wlc/0-1/`,
  };
}

/** The OpenBible page for a place: its identifications and every verse. */
export function openBibleGeocoding(name: string): ExternalLink {
  return {
    label: 'OpenBible geocoding',
    hint: 'The identification, its confidence, and the full verse list.',
    url: `https://www.openbible.info/geo/search?q=${encodeURIComponent(name)}`,
  };
}

/** Modern satellite and street imagery of the coordinate the atlas holds. */
export function googleMaps(coordinates: Coordinates, name: string): ExternalLink {
  const [lon, lat] = coordinates;
  return {
    label: 'Satellite imagery',
    hint: `The site today, at ${lat.toFixed(4)}°, ${lon.toFixed(4)}°.`,
    url: `https://www.google.com/maps/search/?api=1&query=${lat},${lon}&query_place_id=${encodeURIComponent(name)}`,
  };
}

/**
 * Pleiades, the gazetteer of the classical world.
 *
 * Searched by name rather than linked by id, because this corpus holds no
 * Pleiades identifiers and guessing one would be worse than a search box. For a
 * Greek or Roman site it is the doorway to the epigraphic and archaeological
 * literature that no biblical reference work covers.
 */
export function pleiades(name: string): ExternalLink {
  return {
    label: 'Pleiades gazetteer',
    hint: 'The ancient-world gazetteer: attestations, bibliography, and linked archaeology.',
    url: `https://pleiades.stoa.org/search?SearchableText=${encodeURIComponent(name)}`,
  };
}

/** General reference, for the history around the entry rather than inside it. */
export function wikipedia(name: string): ExternalLink {
  return {
    label: 'Wikipedia',
    hint: 'General background, and onward references to the scholarly literature.',
    url: `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(name)}`,
  };
}

/**
 * The standard set for a place.
 *
 * Ordered by what a reader reaches for first: the text, then the word behind it,
 * then the ground, then the wider literature.
 */
export function linksForPlace(input: {
  name: string;
  strongs?: readonly string[];
  coordinates: Coordinates | null;
}): ExternalLink[] {
  const links: ExternalLink[] = [];
  const step = stepBibleByStrongs(input.strongs);
  links.push(step ?? stepBibleByName(input.name));
  const lexicon = blueLetterLexicon(input.strongs);
  if (lexicon) links.push(lexicon);
  links.push(openBibleGeocoding(input.name));
  if (input.coordinates) links.push(googleMaps(input.coordinates, input.name));
  links.push(pleiades(input.name), wikipedia(input.name));
  return links;
}

/** The standard set for a person or a subject: text, word, background. */
export function linksForName(input: { name: string; strongs?: readonly string[] }): ExternalLink[] {
  const links: ExternalLink[] = [];
  const step = stepBibleByStrongs(input.strongs);
  links.push(step ?? stepBibleByName(input.name));
  const lexicon = blueLetterLexicon(input.strongs);
  if (lexicon) links.push(lexicon);
  links.push(wikipedia(input.name));
  return links;
}
