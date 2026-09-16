'use client';

import { useDeferredValue, useId, useMemo } from 'react';
import { search, type SearchResult } from '@/atlas/search';

interface SearchPanelProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (result: SearchResult) => void;
}

const KIND_LABEL: Record<SearchResult['kind'], string> = {
  place: 'Place',
  person: 'Person',
  event: 'Event',
  journey: 'Route',
  scripture: 'Text',
  period: 'Period',
  // Named in the text but never drawn: peoples, sects, gods, festivals, months.
  topic: 'Subject',
  territory: 'Territory',
};

/**
 * Search over the gazetteer.
 *
 * Results are computed synchronously — the corpus is small enough that the index
 * scan finishes well inside a frame — but wrapped in `useDeferredValue` so that
 * typing never blocks on rendering a long result list. There is no debounce and
 * no spinner, because there is nothing to wait for; adding either would be
 * theatre.
 */
export function SearchPanel({ query, onQueryChange, onSelect }: SearchPanelProps) {
  const inputId = useId();
  const deferred = useDeferredValue(query);
  const results = useMemo(() => search(deferred), [deferred]);

  const trimmed = query.trim();
  const showNoResults = trimmed.length >= 2 && results.length === 0;

  return (
    <section className="search" aria-labelledby={`${inputId}-heading`}>
      <h2 className="visually-hidden" id={`${inputId}-heading`}>
        Search the atlas
      </h2>

      <div className="search__field">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-neutral-600)"
          strokeWidth="2.4"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <label className="visually-hidden" htmlFor={inputId}>
          Search places, people, events or a scripture reference
        </label>
        <input
          id={inputId}
          className="search__input"
          type="search"
          value={query}
          spellCheck={false}
          autoComplete="off"
          placeholder="Jerusalem, Tyrannus, Asia, Acts 16…"
          onChange={(event) => onQueryChange(event.target.value)}
        />
        {trimmed.length > 0 && (
          <button type="button" className="search__clear" onClick={() => onQueryChange('')}>
            Clear
          </button>
        )}
      </div>

      {trimmed.length === 0 && (
        <p className="search__hint">
          Every proper name in the Bible: places and the gates, pools and halls inside them, all
          three thousand people, peoples and sects, provinces and regions, festivals and months.
          Ancient or modern spelling, Hebrew or Greek, a Strong&rsquo;s number, or a chapter
          reference.
        </p>
      )}

      {showNoResults && (
        <div className="empty">
          <p>
            Nothing in this edition matches “{trimmed}”. Try an alternative spelling, or a chapter
            reference such as “Joshua 10”.
          </p>
        </div>
      )}

      {results.length > 0 && (
        <>
          <p className="visually-hidden" role="status">
            {results.length} {results.length === 1 ? 'result' : 'results'}
          </p>
          <ul className="results sg-scroll">
            {results.map((result) => (
              <li className="results__item" key={`${result.kind}-${result.id}`}>
                <button type="button" className="results__button" onClick={() => onSelect(result)}>
                  <span className="results__title">
                    <span className="results__kind">{KIND_LABEL[result.kind]}</span>
                    {result.title}
                  </span>
                  <span className="results__subtitle">{result.subtitle}</span>
                  {result.matchedOn !== result.title && (
                    <span className="results__matched"> · {result.matchedOn}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
