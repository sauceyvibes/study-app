'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAtlas } from '@/state/atlas-store';
import { SearchPanel } from './SearchPanel';
import { BookNavigator } from './BookNavigator';
import { PlacePanel } from './PlacePanel';
import { PersonPanel } from './PersonPanel';
import { JourneyPanel } from './JourneyPanel';
import { RouteSwatch } from './RouteGlyph';
import { Timeline } from './Timeline';
import {
  placesAtYear,
  politiesAtYear,
  journeysAtYear,
  placesForBook,
  journeysForBook,
  eventsNearYear,
  placeIdsForJourney,
} from '@/atlas/corpus';
import { JOURNEY_BY_ID } from '@/atlas/corpus';
import { BOOK_BY_ID } from '@/atlas/corpus';
import { periodForYear } from '@/atlas/data/periods';
import { formatYear, formatYearRange } from '@/atlas/search';
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
  // Purely presentational, so it lives here rather than in the shared store:
  // whether the territory legend is shrunk to its badge.
  const [legendCollapsed, setLegendCollapsed] = useState(false);

  const mode = useAtlas((s) => s.mode);
  const year = useAtlas((s) => s.year);
  const bookId = useAtlas((s) => s.bookId);
  const chapter = useAtlas((s) => s.chapter);
  const selectedPlaceId = useAtlas((s) => s.selectedPlaceId);
  const selectedPersonId = useAtlas((s) => s.selectedPersonId);
  const selectedJourneyId = useAtlas((s) => s.selectedJourneyId);
  const focusPlaceIds = useAtlas((s) => s.focusPlaceIds);
  const activeJourneyIds = useAtlas((s) => s.activeJourneyIds);
  const showPolities = useAtlas((s) => s.showPolities);
  const searchQuery = useAtlas((s) => s.searchQuery);

  const setYear = useAtlas((s) => s.setYear);
  const setMode = useAtlas((s) => s.setMode);
  const selectBook = useAtlas((s) => s.selectBook);
  const clearBook = useAtlas((s) => s.clearBook);
  const setChapter = useAtlas((s) => s.setChapter);
  const selectPlace = useAtlas((s) => s.selectPlace);
  const selectPerson = useAtlas((s) => s.selectPerson);
  const selectJourney = useAtlas((s) => s.selectJourney);
  const focusPlaces = useAtlas((s) => s.focusPlaces);
  const toggleJourney = useAtlas((s) => s.toggleJourney);
  const togglePolities = useAtlas((s) => s.togglePolities);
  const setSearchQuery = useAtlas((s) => s.setSearchQuery);

  const book = bookId ? BOOK_BY_ID.get(bookId) : undefined;

  // Places relevant to the current year. In book mode the book's places are added
  // even if their occupation window does not cover the chosen year, because the
  // reader asked for that book and expects its sites to be visible.
  const places = useMemo(() => {
    // Book mode shows only what the selected book (or chapter) names — that is
    // the whole point of the mode, and with the full gazetteer it is a real
    // filter rather than the near-empty result it used to be.
    if (mode === 'book' && bookId) {
      return (placesForBook(bookId, chapter ?? undefined) ?? []).filter((p) => p.coordinates !== null);
    }
    return placesAtYear(year);
  }, [year, mode, bookId, chapter]);

  const highlightedIds = useMemo(() => {
    // In book mode every place shown already belongs to the book, so nothing is
    // singled out — let the confidence colours read. In timeline mode a search
    // focus is what gets emphasised.
    if (mode === 'book') return new Set<string>();
    return new Set(focusPlaceIds);
  }, [mode, focusPlaceIds]);

  const journeys = useMemo(() => {
    const explicit = activeJourneyIds
      .map((id) => JOURNEY_BY_ID.get(id))
      .filter((j): j is NonNullable<typeof j> => j !== undefined);
    if (explicit.length > 0) return explicit;
    // With nothing explicitly toggled, show what belongs to the current view.
    return mode === 'book' && bookId ? journeysForBook(bookId) : [];
  }, [activeJourneyIds, mode, bookId]);

  const polities = useMemo(() => (showPolities ? politiesAtYear(year) : []), [showPolities, year]);

  // Whether any drawn journey has an inferred (dashed) leg, so the key can gloss
  // the dashed style only when it is actually on the plate. The legend appears
  // whenever there is territory or a route to decode.
  const hasInferredLeg = useMemo(
    () => journeys.some((j) => j.legs.some((l) => l.mode === 'inferred')),
    [journeys],
  );
  const showLegend = polities.length > 0 || journeys.length > 0;

  // Choosing a book (or chapter) re-frames the map around that book's places —
  // picking Acts must carry the reader to the Aegean, not leave them parked
  // over the Levant with the routes running off the edge of the plate. Keyed on
  // the selection, not the derived arrays, so ordinary panning is never fought.
  useEffect(() => {
    if (mode !== 'book' || !bookId) return;
    const ids = (placesForBook(bookId, chapter ?? undefined) ?? [])
      .filter((p) => p.coordinates !== null)
      .map((p) => p.id);
    if (ids.length > 0) focusPlaces(ids);
  }, [mode, bookId, chapter, focusPlaces]);
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

      // A person frames their cities and opens their pop-up — the biography is
      // the point of searching a figure, not any one of the dots.
      if (result.kind === 'person') {
        selectPlace(null);
        focusPlaces(result.placeIds);
        selectPerson(result.id);
        return;
      }

      // A route opens its own panel, framed to the whole itinerary.
      if (result.kind === 'journey') {
        selectJourney(result.id);
        focusPlaces(result.placeIds);
        return;
      }

      // Events frame their places without opening a panel: the subject is the
      // set of locations, not any single one of them.
      selectPlace(null);
      focusPlaces(result.placeIds);
    },
    [selectPlace, selectPerson, selectJourney, focusPlaces, selectBook, setMode],
  );

  // Clicking a route on the map (or a route search result) opens its panel and
  // frames the map on the full journey, the way selecting a book frames a book.
  const handleSelectJourney = useCallback(
    (journeyId: string) => {
      selectJourney(journeyId);
      const journey = JOURNEY_BY_ID.get(journeyId);
      if (journey) focusPlaces(placeIdsForJourney(journey));
    },
    [selectJourney, focusPlaces],
  );

  return (
    <div className="atlas">
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
              onClearBook={clearBook}
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
              <p className="label" style={{ margin: '18px 0 7px' }}>
                Routes in this age
              </p>
              <ul className="chips">
                {availableJourneys.map((journey) => (
                  <li className="chips__item" key={journey.id}>
                    <button
                      type="button"
                      onClick={() => toggleJourney(journey.id)}
                      aria-pressed={activeJourneyIds.includes(journey.id)}
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
              <p className="label" style={{ margin: '20px 0 8px' }}>
                Around this time
              </p>
              <ul className="events-list">
                {nearbyEvents.map((event) => (
                  <li key={event.id}>
                    <span className="events-list__year">{formatYear(event.year)}</span> — {event.name}
                  </li>
                ))}
              </ul>
            </>
          )}

          <hr className="rule" />
          <p className="coverage-note">
            Every place named in the Protestant Bible, indexed to the chapter, with a curated core
            of major sites carrying fuller detail. Place identifications, coordinates and references
            are drawn from{' '}
            <a href="https://www.openbible.info/geo/" target="_blank" rel="noreferrer">
              OpenBible.info Bible Geocoding
            </a>{' '}
            (CC&nbsp;BY&nbsp;4.0); disputed identifications are shown with their alternatives.
          </p>
        </div>
      </div>

      <div className="map-region">
        {/* The framed plate: map, then its printed furniture over it. */}
        <div className="plate">
          <div className="plate__map">
            <AtlasMap
              places={places}
              journeys={journeys}
              polities={polities}
              highlightedIds={highlightedIds}
              selectedPlaceId={selectedPlaceId}
              selectedJourneyId={selectedJourneyId}
              focusPlaceIds={focusPlaceIds}
              onSelectPlace={selectPlace}
              onSelectJourney={handleSelectJourney}
            />
            <div className="plate__vignette" aria-hidden="true" />
            <PlateGrain />
          </div>

          {showLegend &&
            (legendCollapsed ? (
              <button
                type="button"
                className="map-legend map-legend--collapsed"
                onClick={() => setLegendCollapsed(false)}
                aria-label="Show the map key"
                title="Show the map key"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M8 1.5 1.5 5 8 8.5 14.5 5 8 1.5Z" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                  <path d="M2 8 8 11 14 8" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 11 8 14 14 11" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ) : (
              <div className="map-legend">
                <div className="map-legend__header">
                  <p className="map-legend__title">Map key</p>
                  <button
                    type="button"
                    className="map-legend__collapse"
                    onClick={() => setLegendCollapsed(true)}
                    aria-label="Collapse the map key"
                    title="Collapse the map key"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                      <line x1="3" y1="7" x2="11" y2="7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>

                {journeys.length > 0 && (
                  <div className="map-legend__group">
                    <p className="map-legend__subtitle">Routes</p>
                    <ul className="map-legend__list map-legend__list--routes">
                      {journeys.map((journey) => (
                        <li key={journey.id}>
                          <button
                            type="button"
                            className="map-legend__route-row"
                            onClick={() => handleSelectJourney(journey.id)}
                            aria-pressed={journey.id === selectedJourneyId}
                            title={`Open ${journey.name}`}
                          >
                            <RouteSwatch mode="land" color={journey.color} />
                            {journey.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                    {hasInferredLeg && <p className="map-legend__note">Dashed segments are inferred.</p>}
                  </div>
                )}

                {polities.length > 0 && (
                  <div className="map-legend__group">
                    <p className="map-legend__subtitle">Territory</p>
                    <ul className="map-legend__list">
                      {polities.map((polity) => (
                        <li key={polity.id}>
                          <span
                            className="map-legend__swatch"
                            style={{ background: polity.color, borderColor: polity.color }}
                            aria-hidden="true"
                          />
                          {polity.name}
                        </li>
                      ))}
                    </ul>
                    <p className="map-legend__note">Zones of control, not surveyed borders.</p>
                  </div>
                )}
              </div>
            ))}
        </div>

        <ConfidenceKey />

        {selectedPlaceId && (
          <PlacePanel
            placeId={selectedPlaceId}
            onClose={() => selectPlace(null)}
            onSelectPlace={selectPlace}
            onSelectPerson={selectPerson}
          />
        )}

        {selectedJourneyId && !selectedPlaceId && (
          <JourneyPanel
            journeyId={selectedJourneyId}
            onClose={() => selectJourney(null)}
            onSelectPlace={(id) => {
              selectPlace(id);
              focusPlaces([id]);
            }}
            onSelectPerson={selectPerson}
          />
        )}

        {selectedPersonId && (
          <PersonPanel
            personId={selectedPersonId}
            onClose={() => selectPerson(null)}
            onSelectPlace={(id) => {
              selectPlace(id);
              focusPlaces([id]);
            }}
          />
        )}

        {mode === 'book' && book && !selectedPlaceId && places.length === 0 && (
          <div className="map-notice map-notice--book">
            No geographic place is named in {book.name}
            {chapter ? ` ${chapter}` : ''}.
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
      <p className="label label--accent age__eyebrow">The Age of</p>
      <h2 className="age__name">{period.name.replace(/^The /, '')}</h2>
      <p className="age__range">{formatYearRange(period.range.start, period.range.end)}</p>
      <p className="age__summary">{period.summary}</p>
    </section>
  );
}

/** Film grain over the plate, so the tiles sit in the paper rather than on it. */
function PlateGrain() {
  return (
    <svg className="plate__grain" aria-hidden="true" width="100%" height="100%">
      <filter id="sg-grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0.35, 0 0 0 0 0.28, 0 0 0 0 0.18, 0 0 0 0.05 0"
        />
      </filter>
      <rect width="100%" height="100%" filter="url(#sg-grain)" />
    </svg>
  );
}

/**
 * The floating key to site-identification confidence. Its four marks are drawn
 * with the same fills and strokes the map's circle layer uses, so the key is a
 * statement of fact about the plate rather than an approximation of it.
 */
function ConfidenceKey() {
  return (
    <div className="conf-key" aria-label="Key to identification confidence">
      <span>
        <svg width="12" height="12" aria-hidden="true">
          <circle cx="6" cy="6" r="4.5" fill="var(--color-accent-700)" />
        </svg>
        Certain
      </span>
      <span>
        <svg width="12" height="12" aria-hidden="true">
          <circle cx="6" cy="6" r="4.5" fill="var(--color-accent-300)" stroke="var(--color-accent-700)" strokeWidth="1" />
        </svg>
        Probable
      </span>
      <span>
        <svg width="12" height="12" aria-hidden="true">
          <circle cx="6" cy="6" r="4.5" fill="var(--color-bg)" stroke="var(--color-accent-700)" strokeWidth="1.5" />
        </svg>
        Contested
      </span>
      <span>
        <svg width="12" height="12" aria-hidden="true">
          <circle cx="6" cy="6" r="4.5" fill="none" stroke="var(--color-neutral-600)" strokeWidth="1.2" strokeDasharray="2 2" />
        </svg>
        Conjectural
      </span>
    </div>
  );
}
