'use client';

import { useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useAtlas } from '@/state/atlas-store';
import { SearchPanel } from './SearchPanel';
import { BookNavigator } from './BookNavigator';
import { PlacePanel } from './PlacePanel';
import { Timeline } from './Timeline';
import {
  placesAtYear,
  politiesAtYear,
  journeysAtYear,
  placesForBook,
  journeysForBook,
  eventsNearYear,
  ATLAS_COVERAGE,
} from '@/atlas/corpus';
import { JOURNEY_BY_ID } from '@/atlas/corpus';
import { BOOK_BY_ID } from '@/atlas/data/books';
import { periodForYear } from '@/atlas/data/periods';
import { formatYear } from '@/atlas/search';
import type { SearchResult } from '@/atlas/search';

// MapLibre touches `window` at import time, so it cannot be server-rendered.
// The fallback matches the map's own loading state to avoid a layout jump.
const AtlasMap = dynamic(() => import('./map/AtlasMap').then((m) => m.AtlasMap), {
  ssr: false,
  loading: () => (
    <div className="map-status" role="status">
      <p className="map-status__title">Drawing the map</p>
      <p className="map-status__body">Loading terrain and placing the gazetteer.</p>
    </div>
  ),
});

/**
 * The application shell.
 *
 * All map content is derived here, in one place, from the store's year and book
 * selection. Keeping the derivation in a single component means there is exactly
 * one answer to "what should be on the map right now" — the alternative, letting
 * each layer subscribe to the store and decide for itself, is how a map ends up
 * showing a route from a period whose cities have already been filtered away.
 */
export function Atlas() {
  const mode = useAtlas((s) => s.mode);
  const year = useAtlas((s) => s.year);
  const bookId = useAtlas((s) => s.bookId);
  const chapter = useAtlas((s) => s.chapter);
  const selectedPlaceId = useAtlas((s) => s.selectedPlaceId);
  const focusPlaceIds = useAtlas((s) => s.focusPlaceIds);
  const activeJourneyIds = useAtlas((s) => s.activeJourneyIds);
  const showPolities = useAtlas((s) => s.showPolities);
  const searchQuery = useAtlas((s) => s.searchQuery);

  const setYear = useAtlas((s) => s.setYear);
  const setMode = useAtlas((s) => s.setMode);
  const selectBook = useAtlas((s) => s.selectBook);
  const setChapter = useAtlas((s) => s.setChapter);
  const selectPlace = useAtlas((s) => s.selectPlace);
  const focusPlaces = useAtlas((s) => s.focusPlaces);
  const toggleJourney = useAtlas((s) => s.toggleJourney);
  const togglePolities = useAtlas((s) => s.togglePolities);
  const setSearchQuery = useAtlas((s) => s.setSearchQuery);

  const book = bookId ? BOOK_BY_ID.get(bookId) : undefined;

  // Places relevant to the current year. In book mode the book's places are added
  // even if their occupation window does not cover the chosen year, because the
  // reader asked for that book and expects its sites to be visible.
  const places = useMemo(() => {
    const byYear = placesAtYear(year);
    if (mode !== 'book' || !bookId) return byYear;

    const fromBook = placesForBook(bookId, chapter ?? undefined) ?? [];
    const seen = new Set(byYear.map((p) => p.id));
    return [...byYear, ...fromBook.filter((p) => !seen.has(p.id) && p.coordinates !== null)];
  }, [year, mode, bookId, chapter]);

  const highlightedIds = useMemo(() => {
    if (mode === 'book' && bookId) {
      return new Set((placesForBook(bookId, chapter ?? undefined) ?? []).map((p) => p.id));
    }
    return new Set(focusPlaceIds);
  }, [mode, bookId, chapter, focusPlaceIds]);

  const journeys = useMemo(() => {
    const explicit = activeJourneyIds
      .map((id) => JOURNEY_BY_ID.get(id))
      .filter((j): j is NonNullable<typeof j> => j !== undefined);
    if (explicit.length > 0) return explicit;
    // With nothing explicitly toggled, show what belongs to the current view.
    return mode === 'book' && bookId ? journeysForBook(bookId) : [];
  }, [activeJourneyIds, mode, bookId]);

  const polities = useMemo(() => (showPolities ? politiesAtYear(year) : []), [showPolities, year]);
  const availableJourneys = useMemo(() => journeysAtYear(year), [year]);
  const nearbyEvents = useMemo(() => eventsNearYear(year, 40), [year]);

  const handleSearchSelect = useCallback(
    (result: SearchResult) => {
      if (result.kind === 'place') {
        selectPlace(result.id);
        focusPlaces([result.id]);
        return;
      }

      if (result.kind === 'scripture' && result.reference) {
        selectBook(result.reference.book, result.reference.chapter);
        focusPlaces(result.placeIds);
        return;
      }

      if (result.kind === 'period') {
        setMode('timeline');
        return;
      }

      // People, events and journeys frame their places without opening a panel:
      // the subject is the set of locations, not any single one of them.
      selectPlace(null);
      focusPlaces(result.placeIds);
    },
    [selectPlace, focusPlaces, selectBook, setMode],
  );

  return (
    <div className="atlas">
      <header className="masthead">
        <h1 className="masthead__title">Sacred Geography</h1>
        <p className="masthead__subtitle">An historical atlas of the Bible</p>
        <p className="label masthead__meta">
          {ATLAS_COVERAGE.fullyIndexedBooks.length > 0 && `Edition ${ATLAS_COVERAGE.version}`}
        </p>
      </header>

      <div className="rail">
        <div className="mode-switch" role="tablist" aria-label="Exploration mode">
          <button
            type="button"
            role="tab"
            className="mode-switch__option"
            aria-selected={mode === 'timeline'}
            onClick={() => setMode('timeline')}
          >
            By period
          </button>
          <button
            type="button"
            role="tab"
            className="mode-switch__option"
            aria-selected={mode === 'book'}
            onClick={() => setMode('book')}
          >
            By book
          </button>
        </div>

        <SearchPanel query={searchQuery} onQueryChange={setSearchQuery} onSelect={handleSearchSelect} />

        <div className="rail__scroll">
          {mode === 'book' ? (
            <BookNavigator
              bookId={bookId}
              chapter={chapter}
              onSelectBook={(id) => selectBook(id)}
              onSelectChapter={setChapter}
            />
          ) : (
            <PeriodDetail year={year} />
          )}

          <hr className="rule-double" />

          <label className="toggle">
            <input type="checkbox" checked={showPolities} onChange={togglePolities} />
            Show kingdoms and empires
          </label>

          {availableJourneys.length > 0 && (
            <>
              <p className="label" style={{ marginTop: '1rem' }}>
                Routes in this period
              </p>
              <ul className="chips">
                {availableJourneys.map((journey) => (
                  <li className="chips__item" key={journey.id}>
                    <button
                      type="button"
                      onClick={() => toggleJourney(journey.id)}
                      aria-pressed={activeJourneyIds.includes(journey.id)}
                      style={
                        activeJourneyIds.includes(journey.id)
                          ? { borderColor: 'var(--oxblood)', color: 'var(--oxblood)' }
                          : undefined
                      }
                    >
                      {journey.name}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {nearbyEvents.length > 0 && mode === 'timeline' && (
            <>
              <p className="label" style={{ marginTop: '1.25rem' }}>
                Around this time
              </p>
              <ul className="sources" style={{ marginTop: '0.35rem' }}>
                {nearbyEvents.map((event) => (
                  <li key={event.id}>
                    <cite>{formatYear(event.year)}</cite> — {event.name}
                  </li>
                ))}
              </ul>
            </>
          )}

          <hr className="rule" />
          <p className="search__hint">{ATLAS_COVERAGE.statement}</p>
        </div>
      </div>

      <div className="map-region">
        <AtlasMap
          places={places}
          journeys={journeys}
          polities={polities}
          highlightedIds={highlightedIds}
          selectedPlaceId={selectedPlaceId}
          focusPlaceIds={focusPlaceIds}
          onSelectPlace={selectPlace}
        />

        {polities.length > 0 && (
          <div className="map-legend">
            <p className="label">Territory</p>
            <ul className="map-legend__list">
              {polities.map((polity) => (
                <li key={polity.id}>
                  <span
                    className="map-legend__swatch"
                    style={{ background: polity.color }}
                    aria-hidden="true"
                  />
                  {polity.name}
                </li>
              ))}
            </ul>
            <p className="search__hint" style={{ marginTop: '0.5rem', maxWidth: '13rem' }}>
              Zones of control, not surveyed borders.
            </p>
          </div>
        )}

        {selectedPlaceId && (
          <PlacePanel
            placeId={selectedPlaceId}
            onClose={() => selectPlace(null)}
            onSelectPlace={selectPlace}
          />
        )}

        {book && !selectedPlaceId && highlightedIds.size === 0 && (
          <div className="map-notice">
            {book.name}
            {chapter ? ` ${chapter}` : ''} has no places recorded in this edition
            {book.indexed ? '.' : ' yet.'}
          </div>
        )}
      </div>

      <div className="timeline-region">
        <Timeline year={year} onChange={setYear} />
      </div>
    </div>
  );
}

function PeriodDetail({ year }: { year: number }) {
  const period = periodForYear(year);

  return (
    <section aria-label="Current period">
      <p className="label books__division">Period</p>
      <h2 className="panel__name" style={{ fontSize: '1.25rem' }}>
        {period.name}
      </h2>
      <p className="panel__prose" style={{ marginTop: '0.5rem' }}>
        {period.summary}
      </p>
    </section>
  );
}
