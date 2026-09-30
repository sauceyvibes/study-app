import { describe, it, expect } from 'vitest';
import { mergeById } from '../src/atlas/data/additions';

describe('mergeById', () => {
  const base = [
    { id: 'a', v: 1 },
    { id: 'b', v: 1 },
  ];

  it('replaces an entry in place when an addition shares its id', () => {
    expect(mergeById(base, [{ id: 'b', v: 2 }])).toEqual([
      { id: 'a', v: 1 },
      { id: 'b', v: 2 },
    ]);
  });

  it('appends additions with new ids after the base', () => {
    expect(mergeById(base, [{ id: 'c', v: 1 }]).map((e) => e.id)).toEqual(['a', 'b', 'c']);
  });

  it('leaves the base untouched when there is nothing to add', () => {
    expect(mergeById(base, [])).toEqual(base);
  });
});
