import type { AdditionCollection } from '@/atlas/data/additions';
import { SCHEMAS, type RefTarget } from './schema';

/**
 * The server's check on an entry before it is committed.
 *
 * The browser's parse (`form.ts`) is a convenience; this is the gate. It checks
 * the shape of every field against the schema and then applies the same rules
 * `tests/corpus.test.ts` enforces on the whole corpus — ids resolve, a contested
 * place names its alternatives, a leg joins two real places — so an admin save
 * cannot commit something that would fail the main site's build.
 */

export type KnownIds = Record<RefTarget, ReadonlySet<string>>;

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;
const LEG_MODES = ['land', 'sea', 'inferred'];
const WITNESS_KINDS = ['historian', 'geographer', 'inscription', 'papyrus', 'excavation', 'reference'];

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === 'string');
const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function isRing(ring: unknown): boolean {
  return (
    Array.isArray(ring) &&
    ring.length >= 4 &&
    ring.every((p) => Array.isArray(p) && p.length === 2 && isNumber(p[0]) && isNumber(p[1]))
  );
}

function checkGeometry(value: unknown): string | null {
  if (!isObject(value)) return 'must be a GeoJSON geometry object';
  if (value.type === 'Polygon') {
    return Array.isArray(value.coordinates) && value.coordinates.every(isRing)
      ? null
      : 'Polygon coordinates must be rings of at least four [lon, lat] points';
  }
  if (value.type === 'MultiPolygon') {
    return Array.isArray(value.coordinates) &&
      value.coordinates.every((poly) => Array.isArray(poly) && poly.every(isRing))
      ? null
      : 'MultiPolygon coordinates must be polygons of rings of at least four [lon, lat] points';
  }
  return 'type must be "Polygon" or "MultiPolygon"';
}

function checkScripture(value: unknown, known: KnownIds): string | null {
  if (!Array.isArray(value)) return 'must be a list of references';
  for (const ref of value) {
    if (!isObject(ref) || typeof ref.book !== 'string' || !isNumber(ref.chapter)) return 'each reference needs a book and chapter';
    if (!known.books.has(ref.book)) return `unknown book "${ref.book}"`;
    if (ref.verse !== undefined && !isNumber(ref.verse)) return 'verse must be a number';
    if (ref.verseEnd !== undefined && !isNumber(ref.verseEnd)) return 'verseEnd must be a number';
  }
  return null;
}

export function validateEntry(
  collection: AdditionCollection,
  entry: unknown,
  known: KnownIds,
): string[] {
  const errors: string[] = [];
  if (!isObject(entry)) return ['Entry must be an object'];

  const fields = SCHEMAS[collection].fields;
  const allowed = new Set(fields.map((f) => f.key));
  for (const key of Object.keys(entry)) {
    if (!allowed.has(key)) errors.push(`Unexpected field "${key}"`);
  }

  const unresolved = (target: RefTarget, ids: string[], label: string) => {
    const missing = ids.filter((id) => !known[target].has(id));
    if (missing.length) errors.push(`${label}: no ${target} with id ${missing.map((m) => `"${m}"`).join(', ')}`);
  };

  for (const field of fields) {
    const { key, label } = field;
    const value = entry[key];
    if (value === undefined) {
      if (!field.optional) errors.push(`${label} is required`);
      continue;
    }
    if (value === null) {
      if (!field.nullable && !field.optional) errors.push(`${label} cannot be empty`);
      continue;
    }

    const fail = (message: string) => errors.push(`${label} ${message}`);
    switch (field.type) {
      case 'id':
        if (typeof value !== 'string' || !ID_PATTERN.test(value)) fail('must be lowercase letters and digits joined by hyphens');
        break;
      case 'text':
      case 'textarea':
        if (typeof value !== 'string' || value.trim() === '') fail('must be text');
        break;
      case 'number':
        if (!isNumber(value)) fail('must be a number');
        break;
      case 'color':
        if (typeof value !== 'string' || !COLOR_PATTERN.test(value)) fail('must be a colour like #8a4023');
        break;
      case 'select':
        if (typeof value !== 'string' || !field.options.includes(value)) fail(`must be one of ${field.options.join(', ')}`);
        break;
      case 'list':
        if (!isStringArray(value)) fail('must be a list of text');
        break;
      case 'refs':
        if (!isStringArray(value)) fail('must be a list of ids');
        else unresolved(field.target, value, label);
        break;
      case 'ref':
        if (typeof value !== 'string') fail('must be an id');
        else unresolved(field.target, [value], label);
        break;
      case 'coords':
        if (!Array.isArray(value) || value.length !== 2 || !isNumber(value[0]) || !isNumber(value[1])) {
          fail('must be [longitude, latitude]');
        } else if (Math.abs(value[0]) > 180 || Math.abs(value[1]) > 90) {
          fail('is out of range — longitude first, then latitude');
        }
        break;
      case 'range':
        if (!isObject(value) || !isNumber(value.start) || !(value.end === null || isNumber(value.end))) {
          fail('needs a start year and an end year or none');
        } else if (value.end !== null && (value.end as number) < value.start) {
          fail('ends before it starts');
        }
        break;
      case 'scripture': {
        const problem = checkScripture(value, known);
        if (problem) fail(problem);
        break;
      }
      case 'sources':
        if (!Array.isArray(value) || !value.every((s) => isObject(s) && typeof s.citation === 'string' && s.citation !== '' && typeof s.note === 'string')) {
          fail('must each have a citation (and a note after a |)');
        }
        break;
      case 'legs':
        if (!Array.isArray(value)) { fail('must be a list'); break; }
        value.forEach((leg, index) => {
          const n = `${label} ${index + 1}`;
          if (!isObject(leg)) { errors.push(`${n} is malformed`); return; }
          if (typeof leg.fromPlace !== 'string' || typeof leg.toPlace !== 'string') { errors.push(`${n} needs a from and a to place`); return; }
          unresolved('places', [leg.fromPlace, leg.toPlace].filter(Boolean), n);
          if (!leg.fromPlace || !leg.toPlace) errors.push(`${n} needs a from and a to place`);
          if (!LEG_MODES.includes(leg.mode as string)) errors.push(`${n} mode must be land, sea or inferred`);
          const problem = checkScripture(leg.scripture, known);
          if (problem) errors.push(`${n} scripture ${problem}`);
          if (leg.note !== undefined && typeof leg.note !== 'string') errors.push(`${n} note must be text`);
        });
        break;
      case 'json':
        if (key === 'extent') {
          const problem = checkGeometry(value);
          if (problem) fail(problem);
        } else if (key === 'ancientNames' || key === 'relations') {
          if (!isObject(value)) fail('must be a JSON object');
        } else if (!Array.isArray(value)) {
          fail('must be a JSON array');
        }
        break;
    }
  }

  // Rules that span fields, mirroring tests/corpus.test.ts.
  if (collection === 'places') {
    if (entry.confidence === 'contested' && !(Array.isArray(entry.alternatives) && entry.alternatives.length > 0)) {
      errors.push('A contested place must list at least one alternative identification');
    }
    if (entry.parentPlaceId && entry.parentPlaceId === entry.id) errors.push('A place cannot sit inside itself');
    if (entry.siteRelation && !entry.parentPlaceId) errors.push('Relation to a place needs the place it relates to');
    if (Array.isArray(entry.alternatives)) {
      for (const alt of entry.alternatives) {
        if (!isObject(alt) || typeof alt.site !== 'string' || typeof alt.argument !== 'string') {
          errors.push('Each alternative needs a site and an argument');
          break;
        }
      }
    }
  }
  if (collection === 'events' && isNumber(entry.year) && isObject(entry.range) && isNumber(entry.range.start)) {
    const end = entry.range.end;
    if (entry.year < entry.range.start || (isNumber(end) && entry.year > end)) {
      errors.push('Best-estimate year must fall inside the possible years');
    }
  }
  if (collection === 'people' && isObject(entry.relations)) {
    const r = entry.relations;
    const ids = [r.father, r.mother, ...[r.siblings, r.partners, r.offspring].flatMap((l) => (Array.isArray(l) ? l : []))];
    if (!Array.isArray(r.siblings) || !Array.isArray(r.partners) || !Array.isArray(r.offspring)) {
      errors.push('Family needs siblings, partners and offspring lists (they may be empty)');
    }
    unresolved('people', ids.filter((id): id is string => typeof id === 'string' && id !== ''), 'Family');
  }
  if (Array.isArray(entry.externalSources)) {
    for (const source of entry.externalSources) {
      if (!isObject(source) || typeof source.author !== 'string' || typeof source.work !== 'string' || typeof source.note !== 'string' || !WITNESS_KINDS.includes(source.kind as string)) {
        errors.push('Each external witness needs author, work, note and a valid kind');
        break;
      }
    }
  }

  return errors;
}
