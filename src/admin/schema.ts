import type { AdditionCollection } from '@/atlas/data/additions';

/**
 * What the admin forms edit, collection by collection.
 *
 * The fields mirror `src/atlas/types.ts` one for one. Each has a `kind` that says
 * how it is typed into the form and parsed back out (`form.ts`), and the
 * reference kinds name the collection their ids must resolve against
 * (`validate.ts`). Keeping the whole description in one table means a new field
 * on a type is one line here rather than a new widget.
 */

export type RefTarget = AdditionCollection | 'periods' | 'books';

export type FieldKind =
  | { type: 'id' }
  | { type: 'text' }
  | { type: 'textarea' }
  | { type: 'number' }
  | { type: 'color' }
  | { type: 'select'; options: readonly string[] }
  | { type: 'list' }
  | { type: 'refs'; target: RefTarget }
  | { type: 'ref'; target: RefTarget }
  | { type: 'coords' }
  | { type: 'range' }
  | { type: 'scripture' }
  | { type: 'legs' }
  | { type: 'sources' }
  | { type: 'json'; placeholder: string };

export type Field = FieldKind & {
  key: string;
  label: string;
  help?: string;
  /** Empty input omits the key entirely. */
  optional?: boolean;
  /** Empty input stores `null` (the type allows it). */
  nullable?: boolean;
  /** For a JSON field that is required but may be blank: what blank stores. */
  empty?: unknown;
};

export interface CollectionSchema {
  label: string;
  singular: string;
  fields: Field[];
}

const CONFIDENCE = ['certain', 'probable', 'contested', 'conjectural', 'unlocated'] as const;
const PLACE_KINDS = [
  'city', 'town', 'village', 'capital', 'sanctuary', 'fortress',
  'mountain', 'water', 'wilderness', 'region', 'island',
] as const;

const ID: Field = { key: 'id', label: 'Id', type: 'id', help: 'Lowercase words joined by hyphens, e.g. tell-el-hesi. Reusing an existing id replaces that entry.' };
const NAME: Field = { key: 'name', label: 'Name', type: 'text' };
const ALIASES: Field = { key: 'aliases', label: 'Aliases', type: 'list', help: 'One per line. Fed into search.' };
const SCRIPTURE: Field = { key: 'scripture', label: 'Scripture', type: 'scripture', help: 'One per line or separated by semicolons: "Genesis 12:4-6", "Acts 16", "1 Kings 12:28".' };
const SOURCES: Field = { key: 'sources', label: 'Sources', type: 'sources', help: 'One per line: citation | note' };
const ANCIENT_NAMES: Field = {
  key: 'ancientNames',
  label: 'Ancient names',
  type: 'json',
  empty: {},
  placeholder: '{ "hebrew": "", "hebrewTranslit": "", "greek": "", "greekTranslit": "" }',
  help: 'JSON. Leave empty for none.',
};
const EXTERNAL_SOURCES: Field = {
  key: 'externalSources',
  label: 'External witnesses',
  type: 'json',
  optional: true,
  placeholder: '[{ "author": "Josephus", "work": "Antiquities", "locus": "15.9.6", "kind": "historian", "note": "" }]',
  help: 'JSON array. kind is one of historian, geographer, inscription, papyrus, excavation, reference.',
};
const EXTENT_HELP = 'GeoJSON Polygon or MultiPolygon geometry, [longitude, latitude] order. Draw one at geojson.io and paste the geometry object.';

export const SCHEMAS: Record<AdditionCollection, CollectionSchema> = {
  places: {
    label: 'Places',
    singular: 'place',
    fields: [
      ID,
      NAME,
      ALIASES,
      { key: 'modernName', label: 'Modern name', type: 'text', nullable: true },
      { key: 'coordinates', label: 'Coordinates', type: 'coords', nullable: true, help: 'Leave both empty for an unlocated place.' },
      { key: 'kind', label: 'Kind', type: 'select', options: PLACE_KINDS },
      { key: 'confidence', label: 'Confidence', type: 'select', options: CONFIDENCE, help: 'Contested places must list at least one alternative.' },
      { key: 'occupation', label: 'Years relevant', type: 'range', help: 'Negative for BC. Leave the end empty for still extant.' },
      { key: 'periods', label: 'Periods', type: 'refs', target: 'periods' },
      SCRIPTURE,
      { key: 'people', label: 'People', type: 'refs', target: 'people' },
      { key: 'events', label: 'Events', type: 'refs', target: 'events' },
      { key: 'polities', label: 'Kingdoms', type: 'refs', target: 'polities' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'archaeology', label: 'Archaeology', type: 'textarea', optional: true },
      { key: 'parentPlaceId', label: 'Inside / near place', type: 'ref', target: 'places', optional: true },
      { key: 'siteRelation', label: 'Relation to that place', type: 'select', options: ['in', 'near'], optional: true },
      {
        key: 'alternatives',
        label: 'Alternative identifications',
        type: 'json',
        optional: true,
        placeholder: '[{ "site": "Tall el-Hammam", "coordinates": [35.67, 31.84], "argument": "", "proponents": "" }]',
        help: 'JSON array.',
      },
      ANCIENT_NAMES,
      { key: 'strongs', label: "Strong's numbers", type: 'list', optional: true },
      SOURCES,
      EXTERNAL_SOURCES,
    ],
  },
  journeys: {
    label: 'Routes',
    singular: 'route',
    fields: [
      ID,
      NAME,
      { key: 'traveler', label: 'Traveller', type: 'ref', target: 'people' },
      { key: 'range', label: 'Years', type: 'range' },
      { key: 'periods', label: 'Periods', type: 'refs', target: 'periods' },
      { key: 'summary', label: 'Summary', type: 'textarea' },
      { key: 'routeConfidence', label: 'Route confidence', type: 'select', options: CONFIDENCE },
      { key: 'color', label: 'Line colour', type: 'color' },
      {
        key: 'legs',
        label: 'Legs',
        type: 'legs',
        help: 'One leg per line: from-place | to-place | land, sea or inferred | scripture (; separated) | note (optional)',
      },
      SCRIPTURE,
      SOURCES,
    ],
  },
  polities: {
    label: 'Kingdoms',
    singular: 'kingdom',
    fields: [
      ID,
      NAME,
      { key: 'range', label: 'Years', type: 'range' },
      { key: 'color', label: 'Shading colour', type: 'color' },
      { key: 'summary', label: 'Summary', type: 'textarea' },
      { key: 'capitalPlaceId', label: 'Capital', type: 'ref', target: 'places', nullable: true },
      { key: 'extent', label: 'Extent', type: 'json', nullable: true, placeholder: '{ "type": "Polygon", "coordinates": [[[35.0, 31.5], [35.5, 31.5], [35.5, 32.0], [35.0, 31.5]]] }', help: `${EXTENT_HELP} Leave empty to list it without shading.` },
      SOURCES,
    ],
  },
  territories: {
    label: 'Territories',
    singular: 'territory',
    fields: [
      ID,
      NAME,
      ALIASES,
      { key: 'category', label: 'Category', type: 'select', options: ['province', 'region', 'tribal-allotment', 'district'] },
      { key: 'range', label: 'Years', type: 'range' },
      { key: 'color', label: 'Shading colour', type: 'color' },
      { key: 'summary', label: 'Summary', type: 'textarea' },
      { key: 'placeId', label: 'Gazetteer place', type: 'ref', target: 'places', optional: true },
      { key: 'polityId', label: 'Governing kingdom', type: 'ref', target: 'polities', optional: true },
      { key: 'extent', label: 'Extent', type: 'json', placeholder: '{ "type": "Polygon", "coordinates": [[[35.0, 31.5], [35.5, 31.5], [35.5, 32.0], [35.0, 31.5]]] }', help: EXTENT_HELP },
      SCRIPTURE,
      ANCIENT_NAMES,
      SOURCES,
      EXTERNAL_SOURCES,
    ],
  },
  events: {
    label: 'Events',
    singular: 'event',
    fields: [
      ID,
      NAME,
      { key: 'year', label: 'Best-estimate year', type: 'number', help: 'Negative for BC.' },
      { key: 'range', label: 'Possible years', type: 'range' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'places', label: 'Places', type: 'refs', target: 'places' },
      { key: 'people', label: 'People', type: 'refs', target: 'people' },
      SCRIPTURE,
      { key: 'dating', label: 'Basis of the date', type: 'text', optional: true },
    ],
  },
  people: {
    label: 'People',
    singular: 'person',
    fields: [
      ID,
      NAME,
      ALIASES,
      { key: 'kind', label: 'Kind', type: 'select', options: ['male', 'female', 'group'], optional: true },
      { key: 'floruit', label: 'Floruit', type: 'range' },
      { key: 'role', label: 'Role', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'places', label: 'Places', type: 'refs', target: 'places', help: 'In narrative order.' },
      SCRIPTURE,
      { key: 'tribe', label: 'Tribe or nation', type: 'text', optional: true },
      { key: 'periods', label: 'Periods', type: 'refs', target: 'periods', optional: true },
      {
        key: 'relations',
        label: 'Family',
        type: 'json',
        optional: true,
        placeholder: '{ "father": "", "mother": "", "siblings": [], "partners": [], "offspring": [] }',
        help: 'JSON, person ids.',
      },
      ANCIENT_NAMES,
      { key: 'strongs', label: "Strong's numbers", type: 'list', optional: true },
      { ...SOURCES, optional: true },
      EXTERNAL_SOURCES,
    ],
  },
  topics: {
    label: 'Subjects',
    singular: 'subject',
    fields: [
      ID,
      NAME,
      ALIASES,
      { key: 'category', label: 'Category', type: 'select', options: ['deity', 'festival', 'month', 'people-group', 'title', 'music', 'star', 'other'] },
      { key: 'role', label: 'Role', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      SCRIPTURE,
      ANCIENT_NAMES,
      { key: 'strongs', label: "Strong's numbers", type: 'list', optional: true },
      SOURCES,
      EXTERNAL_SOURCES,
    ],
  },
};

export const COLLECTIONS = Object.keys(SCHEMAS) as AdditionCollection[];

export function isCollection(value: unknown): value is AdditionCollection {
  return typeof value === 'string' && value in SCHEMAS;
}
