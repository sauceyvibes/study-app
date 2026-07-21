import { describe, it, expect } from 'vitest';
import { logosRefToken, logosUrl } from '../src/lib/bible-links';
import { chapterContext } from '../src/lib/chapter-context';
import { authoredSummary } from '../src/atlas/data/chapter-summaries';
import { BOOKS, eventsForPerson } from '../src/atlas/corpus';

/**
 * The scripture-link and person features rest on three pure pieces: the Logos URL
 * builder, the chapter-context composer behind the hover tooltip, and the
 * person→events lookup. The realistic failure is a reference that builds a broken
 * Logos token (a missing book abbreviation) or a tooltip that disagrees with the
 * map about what a chapter names. These pin both down.
 */

describe('logos reference links', () => {
  it('builds chapter tokens with the validated abbreviations', () => {
    // These three were checked against the live ref.ly resolver.
    expect(logosRefToken({ book: 'jonah', chapter: 1 })).toBe('Jon1');
    expect(logosRefToken({ book: 'songofsongs', chapter: 1 })).toBe('Song1');
    expect(logosRefToken({ book: '1kings', chapter: 12 })).toBe('1Ki12');
  });

  it('appends a verse and a verse range', () => {
    expect(logosRefToken({ book: 'genesis', chapter: 12, verse: 1 })).toBe('Ge12.1');
    expect(logosRefToken({ book: 'acts', chapter: 16, verse: 11, verseEnd: 15 })).toBe('Ac16.11-15');
  });

  it('points at ref.ly, which hands off to Logos', () => {
    expect(logosUrl({ book: 'jonah', chapter: 1 })).toBe('https://ref.ly/Jon1');
  });

  it('has an abbreviation for every book in the canon', () => {
    for (const book of BOOKS) {
      const token = logosRefToken({ book: book.id, chapter: 1 });
      // A missing mapping would fall back to the raw lowercase id (e.g. "genesis1").
      expect(token, `no Logos abbreviation for ${book.id}`).not.toBe(`${book.id}1`);
      expect(token).toMatch(/^[0-9A-Za-z]+1$/);
    }
  });
});

describe('chapter context (hover tooltip)', () => {
  it('carries the authored summary and the places the chapter names', () => {
    const context = chapterContext({ book: 'jonah', chapter: 1 });
    expect(context.reference).toBe('Jonah 1');
    expect(context.summary).not.toBeNull();
    // Derived from the same index the pins use, so the two can never disagree.
    expect(context.places).toContain('Nineveh');
    expect(context.setting).toBeTruthy();
  });

  it('falls back to null summary but still lists places for un-authored chapters', () => {
    const context = chapterContext({ book: 'acts', chapter: 21 });
    expect(context.summary).toBeNull();
    expect(context.places.length).toBeGreaterThan(0);
  });
});

describe('authored summaries', () => {
  it('are present for the narrative spine and absent otherwise', () => {
    expect(authoredSummary('jonah', 1)).toBeTruthy();
    expect(authoredSummary('psalms', 119)).toBeNull();
  });
});

describe('events for a person', () => {
  it('gathers a figure’s datable events, earliest first', () => {
    const events = eventsForPerson('jesus');
    expect(events.length).toBeGreaterThan(0);
    expect(events.map((e) => e.id)).toContain('crucifixion');
    const years = events.map((e) => e.year);
    expect([...years].sort((a, b) => a - b)).toEqual(years);
  });

  it('returns nothing for a person with no linked events', () => {
    expect(eventsForPerson('not-a-real-person')).toEqual([]);
  });
});
