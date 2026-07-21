import type { ScriptureRef } from '@/atlas/types';
import { BOOK_BY_ID, PLACE_BY_ID } from '@/atlas/corpus';
import { formatScriptureRef, formatYearRange } from '@/atlas/search';
import { periodForYear } from '@/atlas/data/periods';
import { authoredSummary } from '@/atlas/data/chapter-summaries';

/** How many place names to name before summarising the rest as "+N more". */
const MAX_PLACE_NAMES = 6;

export interface ChapterContext {
  /** e.g. "Jonah 1". */
  reference: string;
  /** A written one-line summary of the chapter, when we hold one. */
  summary: string | null;
  /** Distinct place names the chapter mentions, in the atlas. */
  places: string[];
  /** Count of named places beyond the ones listed. */
  moreCount: number;
  /** e.g. "Divided monarchy · 790–750 BC" — the book's setting. */
  setting: string | null;
}

/**
 * Everything the hover tooltip needs for a scripture reference.
 *
 * The summary is authored where we have written one and null otherwise; the
 * caller decides how to present the difference. The places are derived from the
 * same chapter index the map is drawn from, so the tooltip and the pins can never
 * disagree about what a chapter names.
 */
export function chapterContext(ref: ScriptureRef): ChapterContext {
  const book = BOOK_BY_ID.get(ref.book);
  const reference = formatScriptureRef(ref);

  // Distinct place names, in index order. Two records can share a name (a curated
  // entry and an unmerged OpenBible one), and the tooltip should say "Jerusalem"
  // once, not twice.
  const placeIds = book?.placesByChapter[ref.chapter] ?? [];
  const names: string[] = [];
  const seen = new Set<string>();
  for (const id of placeIds) {
    const name = PLACE_BY_ID.get(id)?.name;
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(name);
  }

  const setting = book
    ? `${periodForYear(Math.round((book.narrativeRange.start + (book.narrativeRange.end ?? book.narrativeRange.start)) / 2)).name.replace(/^The /, '')} · ${formatYearRange(book.narrativeRange.start, book.narrativeRange.end)}`
    : null;

  return {
    reference,
    summary: authoredSummary(ref.book, ref.chapter),
    places: names.slice(0, MAX_PLACE_NAMES),
    moreCount: Math.max(0, names.length - MAX_PLACE_NAMES),
    setting,
  };
}
