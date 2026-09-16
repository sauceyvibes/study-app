'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAtlas } from '@/state/atlas-store';
import { SearchPanel } from './SearchPanel';
import { BookNavigator } from './BookNavigator';
import { PlacePanel } from './PlacePanel';
import { PersonPanel } from './PersonPanel';
import { JourneyPanel } from './JourneyPanel';
import { TerritoryPanel } from './TerritoryPanel';
import { TopicPanel } from './TopicPanel';
import { RouteSwatch } from './RouteGlyph';
import { Timeline } from './Timeline';
import {
  placesAtYear,
  politiesAtYear,
  territoriesAtYear,
  journeysAtYear,
  placesForBook,
  journeysForBook,
  eventsNearYear,
  placeIdsForJourney,
  rangeContains,
  PLACE_BY_ID,
} from '@/atlas/corpus';
import { TERRITORY_CATEGORY_LABEL } from '@/atlas/data/territories';
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
  const selectedLegIndex = useAtlas((s) => s.selectedLegIndex);
  const selectedTerritoryId = useAtlas((s) => s.selectedTerritoryId);
  const selectedTopicId = useAtlas((s) => s.selectedTopicId);
  const focusPlaceIds = useAtlas((s) => s.focusPlaceIds);
  const activeJourneyIds = useAtlas((s) => s.activeJourneyIds);
  const showPolities = useAtlas((s) => s.showPolities);
  const showTerritories = useAtlas((s) => s.showTerritories);
  const searchQuery = useAtlas((s) => s.searchQuery);

  const setYear = useAtlas((s) => s.setYear);
  const setMode = useAtlas((s) => s.setMode);
  const selectBook = useAtlas((s) => s.selectBook);
  const clearBook = useAtlas((s) => s.clearBook);
  const setChapter = useAtlas((s) => s.setChapter);
  const selectPlace = useAtlas((s) => s.selectPlace);
  const selectPerson = useAtlas((s) => s.selectPerson);
  const selectJourney = useAtlas((s) => s.selectJourney);
  const selectJourneyLeg = useAtlas((s) => s.selectJourneyLeg);
  const selectTerritory = useAtlas((s) => s.selectTerritory);
  const selectTopic = useAtlas((s) => s.selectTopic);
  const focusPlaces = useAtlas((s) => s.focusPlaces);
  const toggleJourney = useAtlas((s) => s.toggleJourney);
  const togglePolities = useAtlas((s) => s.togglePolities);
  const toggleTerritories = useAtlas((s) => s.toggleTerritories);
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

  const territories = useMemo(
    () => (showTerritories ? territoriesAtYear(year) : []),
    [showTerritories, year],
  );

  // Whether any drawn journey has an inferred (dashed) leg, so the key can gloss
  // the dashed style only when it is actually on the plate. The legend appears
  // whenever there is territory or a route to decode.
  const hasInferredLeg = useMemo(
    () => journeys.some((j) => j.legs.some((l) => l.mode === 'inferred')),
    [journeys],
  );
  const showLegend = polities.length > 0 || journeys.length > 0 || territories.length > 0;

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

  /**
   * Move the timeline to a place's own era when it is not already there.
   *
   * The year filters what the map draws, so searching the hall of Tyrannus from
   * 850 BC used to fly the camera to Ephesus and show nothing at all: the panel
   * opened, and the dot it described had been filtered out a thousand years
   * before the building existed. Carrying the year along is the same rule
   * selecting a book already follows — the reader asked for this place, and the
   * year is a means of showing it rather than a constraint on being shown it.
   */
  const carryYearTo = useCallback(
    (placeId: string) => {
      const place = PLACE_BY_ID.get(placeId);
      if (!place || rangeContains(place.occupation, year)) return;
      const { start, end } = place.occupation;
      setYear(Math.round((start + (end ?? start)) / 2));
    },
    [year, setYear],
  );

  /** Open a place: carry the year to it, select it, and frame it. */
  const openPlace = useCallback(
    (placeId: string) => {
      carryYearTo(placeId);
      selectPlace(placeId);
      focusPlaces([placeId]);
    },
    [carryYearTo, selectPlace, focusPlaces],
  );

  const handleSearchSelect = useCallback(
    (result: SearchResult) => {
      if (result.kind === 'place') {
        openPlace(result.id);
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

      // A territory shades itself on the map and opens its panel. Turning the
      // layer on is part of selecting one: a reader who searched "Asia" and got
      // a panel but no wash would reasonably think the map had failed.
      if (result.kind === 'territory') {
        if (!showTerritories) toggleTerritories();
        selectTerritory(result.id);
        focusPlaces(result.placeIds);
        return;
      }

      // A subject has no location, so this is the one result that leaves the map
      // exactly as it was.
      if (result.kind === 'topic') {
        selectTopic(result.id);
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
    [
      selectPlace,
      selectPerson,
      selectJourney,
      selectTerritory,
      selectTopic,
      focusPlaces,
      selectBook,
      setMode,
      showTerritories,
      toggleTerritories,
      carryYearTo,
    ],
  );

  // Selecting a route from a list (rail chip, map key, search): isolate it on the
  // map, frame the whole itinerary, and open its panel.
  const selectJourneyFramed = useCallback(
    (journeyId: string) => {
      selectJourney(journeyId);
      const journey = JOURNEY_BY_ID.get(journeyId);
      if (journey) focusPlaces(placeIdsForJourney(journey));
    },
    [selectJourney, focusPlaces],
  );

  // Toggle from a list control: a second click on the already-selected route
  // deselects it (bringing the others back).
  const handleToggleJourney = useCallback(
    (journeyId: string) => {
      if (journeyId === selectedJourneyId) selectJourney(null);
      else selectJourneyFramed(journeyId);
    },
    [selectedJourneyId, selectJourney, selectJourneyFramed],
  );

  // A click on the route lines drills down: first click selects the whole route
  // (hiding the rest); clicking again on a section isolates that one leg; clicking
  // the isolated leg restores the whole route. Empty-map clicks (handled in the
  // map) deselect entirely.
  const handleRouteClick = useCallback(
    (journeyId: string, legIndex: number) => {
      const journey = JOURNEY_BY_ID.get(journeyId);
      if (journeyId !== selectedJourneyId) {
        selectJourneyFramed(journeyId);
      } else if (selectedLegIndex === null) {
        selectJourneyLeg(legIndex);
        const leg = journey?.legs[legIndex];
        if (leg) focusPlaces([leg.fromPlace, leg.toPlace]);
      } else {
        selectJourneyLeg(null);
        if (journey) focusPlaces(placeIdsForJourney(journey));
      }
    },
    [selectedJourneyId, selectedLegIndex, selectJourneyFramed, selectJourneyLeg, focusPlaces],
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

          <label className="toggle">
            <input type="checkbox" checked={showTerritories} onChange={toggleTerritories} />
            Show provinces, regions and tribal land
          </label>

          {/* In book mode the rail mirrors exactly what the map draws for the book
              — every one of its routes — and a click opens that route's panel. In
              timeline mode routes are an optional overlay you toggle on for the age. */}
          {mode === 'book'
            ? journeys.length > 0 && (
                <>
                  <p className="label" style={{ margin: '18px 0 7px' }}>
                    Routes in this book
                  </p>
                  <ul className="chips">
                    {journeys.map((journey) => (
                      <li className="chips__item" key={journey.id}>
                        <button
                          type="button"
                          onClick={() => handleToggleJourney(journey.id)}
                          aria-pressed={journey.id === selectedJourneyId}
                        >
                          {journey.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )
            : availableJourneys.length > 0 && (
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
            Every proper name in the Protestant Bible, indexed to the chapter: places and the gates,
            pools and halls within them, every person, every people and sect, the provinces and
            regions. A curated core carries fuller detail and witnesses from outside the Bible.
            Place identifications, coordinates and references are drawn from{' '}
            <a href="https://www.openbible.info/geo/" target="_blank" rel="noreferrer">
              OpenBible.info Bible Geocoding
            </a>{' '}
            (CC&nbsp;BY&nbsp;4.0); personal names, ancient-language forms and family relations from{' '}
            <a href="https://github.com/STEPBible/STEPBible-Data" target="_blank" rel="noreferrer">
              STEPBible TIPNR
            </a>{' '}
            (Tyndale House Cambridge, CC&nbsp;BY&nbsp;4.0). Disputed identifications are shown with
            their alternatives.
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
              territories={territories}
              highlightedIds={highlightedIds}
              selectedPlaceId={selectedPlaceId}
              selectedJourneyId={selectedJourneyId}
              selectedLegIndex={selectedLegIndex}
              focusPlaceIds={focusPlaceIds}
              onSelectPlace={selectPlace}
              onRouteClick={handleRouteClick}
              onSelectTerritory={selectTerritory}
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
                            onClick={() => handleToggleJourney(journey.id)}
                            aria-pressed={journey.id === selectedJourneyId}
                            title={journey.id === selectedJourneyId ? `Deselect ${journey.name}` : `Isolate ${journey.name}`}
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
                    <p className="map-legend__subtitle">Powers</p>
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

                {territories.length > 0 && (
                  <div className="map-legend__group">
                    <p className="map-legend__subtitle">Named ground</p>
                    <ul className="map-legend__list map-legend__list--routes">
                      {territories.map((territory) => (
                        <li key={territory.id}>
                          <button
                            type="button"
                            className="map-legend__route-row"
                            onClick={() => selectTerritory(territory.id)}
                            aria-pressed={territory.id === selectedTerritoryId}
                            title={TERRITORY_CATEGORY_LABEL[territory.category]}
                          >
                            <span
                              className="map-legend__swatch"
                              style={{ background: territory.color, borderColor: territory.color }}
                              aria-hidden="true"
                            />
                            {territory.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                    <p className="map-legend__note">
                      Provinces, regions and allotments. Generalised outlines.
                    </p>
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
            onSelectPlace={openPlace}
            onSelectPerson={selectPerson}
          />
        )}

        {selectedJourneyId && !selectedPlaceId && (
          <JourneyPanel
            journeyId={selectedJourneyId}
            isolatedLegIndex={selectedLegIndex}
            onClose={() => selectJourney(null)}
            onSelectPlace={openPlace}
            onSelectPerson={selectPerson}
            onIsolateLeg={(index) => {
              selectJourneyLeg(index);
              const journey = JOURNEY_BY_ID.get(selectedJourneyId);
              if (index !== null) {
                const leg = journey?.legs[index];
                if (leg) focusPlaces([leg.fromPlace, leg.toPlace]);
              } else if (journey) {
                focusPlaces(placeIdsForJourney(journey));
              }
            }}
          />
        )}

        {selectedTerritoryId && !selectedPlaceId && !selectedJourneyId && (
          <TerritoryPanel
            territoryId={selectedTerritoryId}
            onClose={() => selectTerritory(null)}
            onSelectPlace={openPlace}
          />
        )}

        {selectedPersonId && (
          <PersonPanel
            personId={selectedPersonId}
            onClose={() => selectPerson(null)}
            onSelectPlace={openPlace}
            onSelectPerson={selectPerson}
          />
        )}

        {selectedTopicId && <TopicPanel topicId={selectedTopicId} onClose={() => selectTopic(null)} />}

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
