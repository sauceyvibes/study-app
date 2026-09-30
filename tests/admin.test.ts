import { describe, it, expect, beforeEach } from 'vitest';
import { CORPUS, JOURNEY_BY_ID, PLACE_BY_ID, POLITY_BY_ID } from '../src/atlas/corpus';
import { COLLECTIONS } from '../src/admin/schema';
import { blankForm, parseRef, toEntry, toForm, type Entry } from '../src/admin/form';
import { validateEntry } from '../src/admin/validate';
import { knownIds } from '../src/admin/known';
import { createSession, verifySession, checkPassword } from '../src/admin/session';

const known = knownIds({});

describe('admin form', () => {
  it('parses scripture by full book name or id', () => {
    expect(parseRef('1 Kings 12:28')).toEqual({ book: '1kings', chapter: 12, verse: 28 });
    expect(parseRef('Acts 16:11-15')).toEqual({ book: 'acts', chapter: 16, verse: 11, verseEnd: 15 });
    expect(parseRef('song of songs 2')).toEqual({ book: 'songofsongs', chapter: 2 });
    expect(typeof parseRef('Acts 29')).toBe('string');
    expect(typeof parseRef('Hezekiah 1')).toBe('string');
  });

  // Loading a published entry into the form and saving it untouched must not
  // change it, or "correct an existing entry" would quietly rewrite fields.
  it('round-trips curated entries through the form unchanged', () => {
    const cases: [(typeof COLLECTIONS)[number], Entry][] = [
      ['places', PLACE_BY_ID.get('jerusalem') as unknown as Entry],
      ['journeys', JOURNEY_BY_ID.get('paul-first-journey') as unknown as Entry],
      ['polities', POLITY_BY_ID.get('egypt') as unknown as Entry],
      ['territories', CORPUS.territories[0] as unknown as Entry],
      ['events', CORPUS.events[0] as unknown as Entry],
      ['topics', CORPUS.topics[0] as unknown as Entry],
    ];
    for (const [collection, entry] of cases) {
      const { entry: back, errors } = toEntry(collection, toForm(collection, entry));
      expect(errors, entry.id as string).toEqual([]);
      expect(back, entry.id as string).toEqual(JSON.parse(JSON.stringify(entry)));
      expect(validateEntry(collection, back, known), entry.id as string).toEqual([]);
    }
  });

  it('builds a valid route from the pipe-separated leg syntax', () => {
    const form = {
      ...blankForm('journeys'),
      id: 'test-route',
      name: 'Test route',
      traveler: 'paul',
      'range.start': '50',
      'range.end': '52',
      summary: 'A test.',
      legs: 'antioch-syria | paphos | sea | Acts 13:4-6\npaphos | iconium | inferred | | guessed',
    };
    const { entry, errors } = toEntry('journeys', form);
    expect(errors).toEqual([]);
    expect(entry.legs).toEqual([
      { fromPlace: 'antioch-syria', toPlace: 'paphos', mode: 'sea', scripture: [{ book: 'acts', chapter: 13, verse: 4, verseEnd: 6 }] },
      { fromPlace: 'paphos', toPlace: 'iconium', mode: 'inferred', scripture: [], note: 'guessed' },
    ]);
    expect(validateEntry('journeys', entry, known)).toEqual([]);
  });

  it('reports what cannot be parsed', () => {
    const { errors } = toEntry('places', { ...blankForm('places'), 'coordinates.lon': 'east', 'occupation.start': '' });
    expect(errors.some((e) => e.includes('longitude'))).toBe(true);
    expect(errors.some((e) => e.includes('Years relevant start'))).toBe(true);
  });
});

describe('admin validation', () => {
  const place = (overrides: Partial<Entry> = {}): Entry => ({
    ...(JSON.parse(JSON.stringify(PLACE_BY_ID.get('jerusalem'))) as Entry),
    id: 'new-place',
    ...overrides,
  });

  it('rejects references that do not resolve', () => {
    const errors = validateEntry('places', place({ people: ['nobody-at-all'], periods: ['bronze'] }), known);
    expect(errors.join('\n')).toMatch(/nobody-at-all/);
    expect(errors.join('\n')).toMatch(/bronze/);
  });

  it('accepts a reference to something added moments ago', () => {
    const fresh = knownIds({ people: [{ id: 'new-person' }] });
    expect(validateEntry('places', place({ people: ['new-person'] }), fresh)).toEqual([]);
  });

  it('enforces the contested-needs-alternatives rule', () => {
    const errors = validateEntry('places', place({ confidence: 'contested', alternatives: undefined }), known);
    expect(errors.join('\n')).toMatch(/alternative/);
  });

  it('rejects bad ids, unknown fields, swapped coordinates and bad extents', () => {
    const errors = validateEntry('places', place({ id: 'New Place', color: '#fff', coordinates: [31.7, 235.2] }), known);
    expect(errors.join('\n')).toMatch(/Id must be/);
    expect(errors.join('\n')).toMatch(/Unexpected field "color"/);
    expect(errors.join('\n')).toMatch(/out of range/);
    const polity = { ...(JSON.parse(JSON.stringify(POLITY_BY_ID.get('egypt'))) as Entry), extent: { type: 'Point', coordinates: [1, 2] } };
    expect(validateEntry('polities', polity, known).join('\n')).toMatch(/Polygon/);
  });

  it('rejects a leg to a place that does not exist', () => {
    const route = JSON.parse(JSON.stringify(JOURNEY_BY_ID.get('paul-first-journey'))) as Entry & { legs: { toPlace: string }[] };
    route.legs[0]!.toPlace = 'atlantis';
    expect(validateEntry('journeys', route, known).join('\n')).toMatch(/atlantis/);
  });
});

describe('admin session', () => {
  beforeEach(() => {
    process.env.ADMIN_PASSWORD = 'correct horse';
    process.env.ADMIN_SESSION_SECRET = 'secret';
  });

  it('checks the password', async () => {
    expect(await checkPassword('correct horse')).toBe(true);
    expect(await checkPassword('correct hors')).toBe(false);
  });

  it('accepts its own tokens and rejects tampered or expired ones', async () => {
    const token = await createSession();
    expect(await verifySession(token)).toBe(true);
    expect(await verifySession(token.replace(/.$/, (c) => (c === '0' ? '1' : '0')))).toBe(false);
    expect(await verifySession(`9999999999.${token.split('.')[1]}`)).toBe(false);
    expect(await verifySession(token, Date.now() + 8 * 24 * 3600 * 1000)).toBe(false);
  });

  it('signs everyone out when the password changes', async () => {
    const token = await createSession();
    process.env.ADMIN_PASSWORD = 'new password';
    expect(await verifySession(token)).toBe(false);
  });
});
