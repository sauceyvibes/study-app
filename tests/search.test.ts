import { describe, it, expect } from 'vitest';
import { search, parseScriptureRef, formatScriptureRef, formatYear, formatYearRange, normalize } from '../src/atlas/search';

describe('normalize', () => {
  it('folds case, punctuation and diacritics', () => {
    expect(normalize('Beer-sheba')).toBe('beer sheba');
    expect(normalize('  Caesarea   Maritima  ')).toBe('caesarea maritima');
    expect(normalize('Yerushalayim')).toBe('yerushalayim');
  });
});

describe('scripture reference parsing', () => {
  it('parses a plain book and chapter', () => {
    expect(parseScriptureRef('Acts 16')).toEqual({ book: 'acts', chapter: 16 });
  });

  it('parses numbered books with and without a space', () => {
    expect(parseScriptureRef('1 Kings 12')).toEqual({ book: '1kings', chapter: 12 });
    expect(parseScriptureRef('2Sam 5')).toEqual({ book: '2samuel', chapter: 5 });
  });

  it('parses abbreviations', () => {
    expect(parseScriptureRef('Jn 4')).toEqual({ book: 'john', chapter: 4 });
    expect(parseScriptureRef('Gen 12')).toEqual({ book: 'genesis', chapter: 12 });
  });

  it('parses verses and verse ranges', () => {
    expect(parseScriptureRef('Acts 16:11-15')).toEqual({ book: 'acts', chapter: 16, verse: 11, verseEnd: 15 });
    expect(parseScriptureRef('Micah 5:2')).toEqual({ book: 'micah', chapter: 5, verse: 2 });
  });

  it('rejects chapters the book does not have', () => {
    // Jonah has four chapters; asking for the ninth is a typo, not a reference.
    expect(parseScriptureRef('Jonah 9')).toBeNull();
    expect(parseScriptureRef('Philemon 3')).toBeNull();
  });

  it('rejects strings that are not references', () => {
    expect(parseScriptureRef('Jerusalem')).toBeNull();
    expect(parseScriptureRef('Paul')).toBeNull();
    expect(parseScriptureRef('')).toBeNull();
  });

  it('round-trips through the formatter', () => {
    const ref = parseScriptureRef('1 Kings 12:28');
    expect(ref).not.toBeNull();
    expect(formatScriptureRef(ref!)).toBe('1 Kings 12:28');
  });
});

describe('year formatting', () => {
  it('renders BC and AD correctly', () => {
    expect(formatYear(-586)).toBe('586 BC');
    expect(formatYear(30)).toBe('AD 30');
  });

  it('does not repeat the era when both ends share it', () => {
    expect(formatYearRange(-931, -722)).toBe('931–722 BC');
    expect(formatYearRange(30, 100)).toBe('AD 30–100');
  });

  it('spells out both eras when a range crosses the boundary', () => {
    expect(formatYearRange(-63, 70)).toBe('63 BC – AD 70');
  });

  it('marks open-ended ranges', () => {
    expect(formatYearRange(-1000, null)).toBe('1000 BC onward');
  });
});

describe('search', () => {
  it('ignores queries too short to be meaningful', () => {
    expect(search('J')).toEqual([]);
    expect(search(' ')).toEqual([]);
  });

  it('puts an exact place-name match first', () => {
    const [first] = search('Jerusalem');
    expect(first?.kind).toBe('place');
    expect(first?.id).toBe('jerusalem');
  });

  it('finds places by their ancient names in transliteration', () => {
    const results = search('Yerushalayim');
    expect(results.some((r) => r.id === 'jerusalem')).toBe(true);
  });

  it('finds places by their Hebrew script', () => {
    const results = search('יְרוּשָׁלַ͏ִם');
    expect(results.some((r) => r.id === 'jerusalem')).toBe(true);
  });

  it('finds places by their Greek script', () => {
    const results = search('Ἔφεσος');
    expect(results.some((r) => r.id === 'ephesus')).toBe(true);
  });

  it('finds places by their modern name', () => {
    const results = search('Sebastia');
    expect(results.some((r) => r.id === 'samaria-city')).toBe(true);
  });

  it('finds a place by an alias', () => {
    expect(search('Zion').some((r) => r.id === 'jerusalem')).toBe(true);
    expect(search('Horeb').some((r) => r.id === 'mount-sinai')).toBe(true);
  });

  it('finds a place by a competing proposed identification', () => {
    // Someone searching "Tall el-Hammam" or "el-Araj" is asking about the debate.
    expect(search('el-Araj').some((r) => r.id === 'bethsaida')).toBe(true);
  });

  it('returns a person with the places they can be mapped to', () => {
    const paul = search('Paul').find((r) => r.kind === 'person' && r.id === 'paul');
    expect(paul).toBeDefined();
    expect(paul!.placeIds).toContain('corinth');
    expect(paul!.placeIds.length).toBeGreaterThan(5);
  });

  it('handles a scripture reference and reports its mapped places', () => {
    const [first] = search('Acts 16');
    expect(first?.kind).toBe('scripture');
    expect(first?.reference).toEqual({ book: 'acts', chapter: 16 });
    expect(first?.placeIds).toContain('philippi');
  });

  it('says when a chapter is indexed but names no places', () => {
    const [first] = search('Jonah 2');
    expect(first?.kind).toBe('scripture');
    expect(first?.placeIds).toEqual([]);
    expect(first?.subtitle).toMatch(/no places/i);
  });

  it('distinguishes an unindexed chapter from an empty one', () => {
    // Psalms is not indexed chapter by chapter, and must not claim otherwise.
    const [first] = search('Psalm 23');
    expect(first?.subtitle).toMatch(/not yet indexed/i);
  });

  it('falls back to prose when nothing matches by name', () => {
    const results = search('siege ramp');
    expect(results.some((r) => r.id === 'lachish')).toBe(true);
  });

  it('returns nothing for a query with no plausible match', () => {
    expect(search('zzzzqqqq')).toEqual([]);
  });

  it('only returns place ids that exist in the gazetteer', () => {
    for (const result of search('Paul')) {
      for (const id of result.placeIds) {
        expect(typeof id).toBe('string');
      }
    }
  });
});
