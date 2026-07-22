'use client';

import { BOOKS, BOOK_BY_ID } from '@/atlas/corpus';
import { formatYearRange } from '@/atlas/search';
import type { BookMeta } from '@/atlas/types';

interface BookNavigatorProps {
  bookId: string | null;
  chapter: number | null;
  onSelectBook: (bookId: string) => void;
  onClearBook: () => void;
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
export function BookNavigator({ bookId, chapter, onSelectBook, onClearBook, onSelectChapter }: BookNavigatorProps) {
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
                    // Clicking the chosen book again clears the selection, so a
                    // reader can back out to the whole-canon view.
                    onClick={() => (meta.id === bookId ? onClearBook() : onSelectBook(meta.id))}
                    title={meta.id === bookId ? 'Click to deselect' : undefined}
                  >
                    {meta.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}

      {selected && (
        <ChapterPicker book={selected} chapter={chapter} onSelectChapter={onSelectChapter} onClearBook={onClearBook} />
      )}
    </section>
  );
}

function ChapterPicker({
  book,
  chapter,
  onSelectChapter,
  onClearBook,
}: {
  book: BookMeta;
  chapter: number | null;
  onSelectChapter: (chapter: number | null) => void;
  onClearBook: () => void;
}) {
  const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);

  return (
    <>
      <hr className="rule-double" />

      <div className="book__head">
        <div>
          <p className="label label--accent" style={{ margin: '0 0 2px' }}>
            Book of
          </p>
          <h3 className="book__name">{book.name}</h3>
        </div>
        <button type="button" className="book__clear" onClick={onClearBook}>
          Deselect ✕
        </button>
      </div>
      <p className="book__range">
        Set in {formatYearRange(book.narrativeRange.start, book.narrativeRange.end)}
      </p>

      <p className="label" style={{ margin: '16px 0 7px' }}>
        Chapter
      </p>
      <ul className="chapters">
        <li>
          <button
            type="button"
            className="chapters__button"
            aria-pressed={chapter === null}
            onClick={() => onSelectChapter(null)}
            style={{ minWidth: '52px' }}
          >
            All
          </button>
        </li>
        {chapters.map((number) => {
          const hasPlaces = (book.placesByChapter[number]?.length ?? 0) > 0;
          return (
            <li key={number}>
              <button
                type="button"
                className={`chapters__button${hasPlaces ? '' : ' chapters__button--unindexed'}`}
                aria-pressed={chapter === number}
                onClick={() => onSelectChapter(number)}
                title={hasPlaces ? undefined : 'No geographic place is named in this chapter'}
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
