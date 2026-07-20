'use client';

import { BOOKS, BOOK_BY_ID } from '@/atlas/data/books';
import { formatYearRange } from '@/atlas/search';
import type { BookMeta } from '@/atlas/types';

interface BookNavigatorProps {
  bookId: string | null;
  chapter: number | null;
  onSelectBook: (bookId: string) => void;
  onSelectChapter: (chapter: number | null) => void;
}

/** Canonical order, grouped for the picker. */
const DIVISIONS = ['Torah', 'Historical', 'Wisdom', 'Prophets', 'Gospels', 'Letters'] as const;

/**
 * Book and chapter selection.
 *
 * The chapter grid distinguishes three states, which matters more here than it
 * might elsewhere: a chapter we have indexed and which names places, a chapter we
 * have indexed that names none, and a chapter we have not yet worked through.
 * Collapsing the last two would quietly tell the reader that Genesis 30 mentions
 * no places, which is not something we know.
 */
export function BookNavigator({ bookId, chapter, onSelectBook, onSelectChapter }: BookNavigatorProps) {
  const selected = bookId ? BOOK_BY_ID.get(bookId) : undefined;

  return (
    <section aria-label="Books of the Bible">
      {DIVISIONS.map((division) => {
        const books = BOOKS.filter((b) => b.division === division);
        if (books.length === 0) return null;

        return (
          <div key={division}>
            <p className="label books__division">{division}</p>
            <ul className="books__list">
              {books.map((meta) => (
                <li key={meta.id}>
                  <button
                    type="button"
                    className="books__button"
                    aria-pressed={meta.id === bookId}
                    onClick={() => onSelectBook(meta.id)}
                  >
                    {meta.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      {selected && <ChapterPicker book={selected} chapter={chapter} onSelectChapter={onSelectChapter} />}
    </section>
  );
}

function ChapterPicker({
  book,
  chapter,
  onSelectChapter,
}: {
  book: BookMeta;
  chapter: number | null;
  onSelectChapter: (chapter: number | null) => void;
}) {
  const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);

  return (
    <>
      <hr className="rule-double" />

      <p className="label">{book.name}</p>
      <p className="panel__prose" style={{ marginTop: '0.2rem' }}>
        Set in {formatYearRange(book.narrativeRange.start, book.narrativeRange.end)}.
      </p>

      {!book.indexed && (
        <div className="empty">
          <p>
            {book.name} has not yet been indexed chapter by chapter. The chapters marked below are
            the ones we have confirmed; the rest are not necessarily empty, only unverified.
          </p>
        </div>
      )}

      <p className="label" style={{ marginTop: '1rem' }}>
        Chapter
      </p>
      <ul className="chapters">
        <li>
          <button
            type="button"
            className="chapters__button"
            aria-pressed={chapter === null}
            onClick={() => onSelectChapter(null)}
            style={{ minWidth: '3.5rem' }}
          >
            All
          </button>
        </li>
        {chapters.map((number) => {
          const indexed = (book.placesByChapter[number]?.length ?? 0) > 0;
          return (
            <li key={number}>
              <button
                type="button"
                className={`chapters__button${indexed ? '' : ' chapters__button--unindexed'}`}
                aria-pressed={chapter === number}
                onClick={() => onSelectChapter(number)}
                title={indexed ? undefined : 'No places recorded for this chapter yet'}
              >
                {number}
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
}
