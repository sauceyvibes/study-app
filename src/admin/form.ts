import type { JourneyLeg, ScriptureRef, SourceNote } from '@/atlas/types';
import type { AdditionCollection } from '@/atlas/data/additions';
import { BOOKS } from '@/atlas/data/books';
import { SCHEMAS, type Field } from './schema';

/**
 * Converting between an entry and the strings a form holds.
 *
 * Every input is a string, so the form state is a flat string map. Compound
 * fields spread over several keys: a range is `occupation.start` and
 * `occupation.end`, coordinates are `coordinates.lon` and `coordinates.lat`.
 * This module imports nothing heavier than the book list, so the browser can run
 * it for instant feedback while the server re-validates what arrives.
 */

export type FormValues = Record<string, string>;
export type Entry = Record<string, unknown>;

// ── Scripture ────────────────────────────────────────────────────────────────

const squash = (text: string) => text.toLowerCase().replace(/[^a-z0-9]/g, '');
const BOOK_BY_KEY = new Map<string, (typeof BOOKS)[number]>();
for (const book of BOOKS) {
  BOOK_BY_KEY.set(squash(book.id), book);
  BOOK_BY_KEY.set(squash(book.name), book);
}

/** "1 Kings 12:28", "Acts 16", "Genesis 12:4-6" — full book names or ids. */
export function parseRef(text: string): ScriptureRef | string {
  const match = /^(.+?)\s*(\d+)(?::(\d+)(?:\s*[-–]\s*(\d+))?)?$/.exec(text.trim());
  if (!match) return `"${text}" is not a reference like "Acts 16:11-15"`;
  const [, rawBook = '', rawChapter = '', rawVerse, rawVerseEnd] = match;
  const book = BOOK_BY_KEY.get(squash(rawBook));
  if (!book) return `unknown book "${rawBook.trim()}" — use the full name, e.g. "1 Kings"`;
  const chapter = Number(rawChapter);
  if (chapter < 1 || chapter > book.chapters) return `${book.name} has ${book.chapters} chapters, not ${chapter}`;
  const ref: ScriptureRef = { book: book.id, chapter };
  if (rawVerse) ref.verse = Number(rawVerse);
  if (rawVerseEnd) ref.verseEnd = Number(rawVerseEnd);
  return ref;
}

export function formatRef(ref: ScriptureRef): string {
  const name = BOOKS.find((b) => b.id === ref.book)?.name ?? ref.book;
  if (ref.verse === undefined) return `${name} ${ref.chapter}`;
  if (ref.verseEnd === undefined) return `${name} ${ref.chapter}:${ref.verse}`;
  return `${name} ${ref.chapter}:${ref.verse}-${ref.verseEnd}`;
}

function parseRefs(text: string, errors: string[], label: string): ScriptureRef[] {
  const refs: ScriptureRef[] = [];
  for (const part of text.split(/[;\n]/).map((p) => p.trim()).filter(Boolean)) {
    const ref = parseRef(part);
    if (typeof ref === 'string') errors.push(`${label}: ${ref}`);
    else refs.push(ref);
  }
  return refs;
}

// ── Field helpers ────────────────────────────────────────────────────────────

const lines = (text: string) => text.split('\n').map((l) => l.trim()).filter(Boolean);
const items = (text: string) => text.split(/[,\n]/).map((l) => l.trim()).filter(Boolean);

function parseNumber(text: string, label: string, errors: string[]): number | null {
  const value = Number(text.trim().replace('−', '-'));
  if (text.trim() === '' || !Number.isFinite(value)) {
    errors.push(`${label}: "${text}" is not a number`);
    return null;
  }
  return value;
}

// ── Form → entry ─────────────────────────────────────────────────────────────

export function toEntry(
  collection: AdditionCollection,
  form: FormValues,
): { entry: Entry; errors: string[] } {
  const errors: string[] = [];
  const entry: Entry = {};
  const get = (key: string) => (form[key] ?? '').trim();

  for (const field of SCHEMAS[collection].fields) {
    const { key, label } = field;
    const raw = get(key);

    const empty = (): void => {
      if (field.optional) return;
      if (field.nullable) entry[key] = null;
      else if (field.empty !== undefined) entry[key] = field.empty;
      else if (field.type === 'list' || field.type === 'refs' || field.type === 'scripture' || field.type === 'sources' || field.type === 'legs') entry[key] = [];
      else errors.push(`${label} is required`);
    };

    switch (field.type) {
      case 'id':
      case 'text':
      case 'textarea':
      case 'color':
      case 'select':
      case 'ref':
        if (raw === '') empty();
        else entry[key] = raw;
        break;
      case 'number': {
        if (raw === '') { empty(); break; }
        const value = parseNumber(raw, label, errors);
        if (value !== null) entry[key] = value;
        break;
      }
      case 'list':
      case 'refs': {
        const values = field.type === 'list' ? lines(raw) : items(raw);
        if (values.length === 0) empty();
        else entry[key] = values;
        break;
      }
      case 'coords': {
        const lon = get(`${key}.lon`);
        const lat = get(`${key}.lat`);
        if (lon === '' && lat === '') { empty(); break; }
        const x = parseNumber(lon, `${label} longitude`, errors);
        const y = parseNumber(lat, `${label} latitude`, errors);
        if (x !== null && y !== null) entry[key] = [x, y];
        break;
      }
      case 'range': {
        const start = parseNumber(get(`${key}.start`), `${label} start`, errors);
        const endText = get(`${key}.end`);
        const end = endText === '' ? null : parseNumber(endText, `${label} end`, errors);
        if (start !== null) entry[key] = { start, end };
        break;
      }
      case 'scripture': {
        const refs = parseRefs(raw, errors, label);
        if (refs.length === 0) empty();
        else entry[key] = refs;
        break;
      }
      case 'sources': {
        const notes: SourceNote[] = lines(raw).map((line) => {
          const [citation = '', ...rest] = line.split('|');
          return { citation: citation.trim(), note: rest.join('|').trim() };
        });
        if (notes.length === 0) empty();
        else entry[key] = notes;
        break;
      }
      case 'legs': {
        const legs: JourneyLeg[] = [];
        lines(raw).forEach((line, index) => {
          const [from = '', to = '', mode = '', refs = '', ...note] = line.split('|').map((p) => p.trim());
          const leg: JourneyLeg = {
            fromPlace: from,
            toPlace: to,
            mode: mode as JourneyLeg['mode'],
            scripture: parseRefs(refs, errors, `${label} ${index + 1}`),
          };
          if (note.join('|')) leg.note = note.join(' | ');
          legs.push(leg);
        });
        if (legs.length === 0) empty();
        else entry[key] = legs;
        break;
      }
      case 'json': {
        if (raw === '') { empty(); break; }
        try {
          entry[key] = JSON.parse(raw);
        } catch (error) {
          errors.push(`${label}: not valid JSON (${(error as Error).message})`);
        }
        break;
      }
    }
  }
  return { entry, errors };
}

// ── Entry → form ─────────────────────────────────────────────────────────────

function fieldToForm(field: Field, value: unknown, form: FormValues): void {
  const { key } = field;
  if (value === undefined || value === null) return;
  switch (field.type) {
    case 'number':
      form[key] = String(value);
      return;
    case 'list':
      form[key] = (value as string[]).join('\n');
      return;
    case 'refs':
      form[key] = (value as string[]).join(', ');
      return;
    case 'coords': {
      const [lon, lat] = value as [number, number];
      form[`${key}.lon`] = String(lon);
      form[`${key}.lat`] = String(lat);
      return;
    }
    case 'range': {
      const range = value as { start: number; end: number | null };
      form[`${key}.start`] = String(range.start);
      form[`${key}.end`] = range.end === null ? '' : String(range.end);
      return;
    }
    case 'scripture':
      form[key] = (value as ScriptureRef[]).map(formatRef).join('\n');
      return;
    case 'sources':
      form[key] = (value as SourceNote[]).map((s) => `${s.citation} | ${s.note}`).join('\n');
      return;
    case 'legs':
      form[key] = (value as JourneyLeg[])
        .map((leg) =>
          [leg.fromPlace, leg.toPlace, leg.mode, leg.scripture.map(formatRef).join('; '), leg.note ?? '']
            .join(' | ')
            .replace(/ \| $/, ''),
        )
        .join('\n');
      return;
    case 'json': {
      const isEmpty =
        field.empty !== undefined && JSON.stringify(value) === JSON.stringify(field.empty);
      // Keep [lon, lat] pairs on one line, or a polygon becomes a column of numbers.
      form[key] = isEmpty
        ? ''
        : JSON.stringify(value, null, 2).replace(/\[\s*(-?[\d.eE+-]+),\s*(-?[\d.eE+-]+)\s*\]/g, '[$1, $2]');
      return;
    }
    default:
      form[key] = String(value);
  }
}

export function toForm(collection: AdditionCollection, entry: Entry): FormValues {
  const form: FormValues = {};
  for (const field of SCHEMAS[collection].fields) fieldToForm(field, entry[field.key], form);
  return form;
}

/** Sensible starting values for a new entry, so a blank form is one step from valid. */
export function blankForm(collection: AdditionCollection): FormValues {
  const form: FormValues = {};
  for (const field of SCHEMAS[collection].fields) {
    if (field.type === 'select' && !field.optional) form[field.key] = field.options[0] ?? '';
    if (field.type === 'color') form[field.key] = '#8a4023';
  }
  return form;
}
