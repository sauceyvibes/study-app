'use client';

import type { Confidence } from '@/atlas/types';
import { JOURNEY_BY_ID, PERSON_BY_ID, PLACE_BY_ID, eventsForJourney, journeyStats } from '@/atlas/corpus';
import { formatYear, formatYearRange } from '@/atlas/search';
import { ScriptureLink } from './ScriptureLink';
import { RouteSwatch, ROUTE_LABEL } from './RouteGlyph';

interface JourneyPanelProps {
  journeyId: string;
  onClose: () => void;
  onSelectPlace: (placeId: string) => void;
  onSelectPerson: (personId: string) => void;
}

const ROUTE_CONFIDENCE_TEXT: Record<Confidence, string> = {
  certain: 'Route securely traced',
  probable: 'Route reconstruction probable',
  contested: 'Route contested',
  conjectural: 'Route largely reconstructed',
  unlocated: 'Route uncertain',
};

const ROUTE_CONFIDENCE_EXPLANATION: Record<Confidence, string> = {
  certain: 'The stages and their order are fixed by the text and by secure site identifications.',
  probable:
    'The overall course is well supported, though some legs are drawn to the nearest place the atlas holds rather than every port of call.',
  contested: 'Serious proposals disagree over the route, and the competing readings imply different paths.',
  conjectural:
    "Only the fixed points are certain. The line between them is a sketch of the journey's shape, not a survey of the path taken.",
  unlocated: 'Too little is fixed to draw the route with any confidence.',
};

function placeName(id: string): string {
  return PLACE_BY_ID.get(id)?.name ?? id;
}

/**
 * The detail panel for a route — the journey equivalent of the place panel.
 *
 * A route is a sequence, so the panel leads with where it starts and ends and the
 * years it spans, then lays the itinerary out stage by stage: each leg names its
 * two places (both live links back to the map), shows how that stretch was
 * travelled with the same glyph the legend uses, and carries its own scripture.
 * The honesty the atlas keeps for places it keeps for routes too — the route's
 * confidence says plainly how much of the path is reconstructed rather than read
 * off the text.
 */
export function JourneyPanel({ journeyId, onClose, onSelectPlace, onSelectPerson }: JourneyPanelProps) {
  const journey = JOURNEY_BY_ID.get(journeyId);

  if (!journey) {
    return (
      <aside className="panel" aria-label="Route details">
        <button type="button" className="panel__close" onClick={onClose}>
          Close ✕
        </button>
        <div className="empty">
          <p>That route is not in the atlas.</p>
        </div>
      </aside>
    );
  }

  const traveler = PERSON_BY_ID.get(journey.traveler);
  const stats = journeyStats(journey);
  const events = eventsForJourney(journey);
  const startId = journey.legs[0]?.fromPlace;
  const endId = journey.legs[journey.legs.length - 1]?.toPlace;

  return (
    <aside className="panel sg-scroll" aria-label={`${journey.name} — details`} tabIndex={-1}>
      <button type="button" className="panel__close" onClick={onClose}>
        Close ✕
      </button>

      <p className="label label--accent" style={{ margin: '0 0 2px' }}>
        Route
      </p>
      <h2 className="panel__name">{journey.name}</h2>
      <p className="panel__modern">{formatYearRange(journey.range.start, journey.range.end)}</p>

      {startId && endId && (
        <div className="journey-endpoints">
          <button type="button" className="inline-link" onClick={() => onSelectPlace(startId)}>
            {placeName(startId)}
          </button>
          <span className="journey-endpoints__arrow" aria-hidden="true">
            →
          </span>
          <button type="button" className="inline-link" onClick={() => onSelectPlace(endId)}>
            {placeName(endId)}
          </button>
        </div>
      )}

      {traveler && (
        <p className="journey-traveler">
          Traced by{' '}
          <button type="button" className="inline-link" onClick={() => onSelectPerson(traveler.id)}>
            {traveler.name}
          </button>
        </p>
      )}

      <p style={{ margin: '14px 0 0' }}>
        <span className={`confidence confidence--${journey.routeConfidence}`}>
          <span className="confidence__mark" aria-hidden="true" />
          {ROUTE_CONFIDENCE_TEXT[journey.routeConfidence]}
        </span>
      </p>
      <p className="confidence-explain">{ROUTE_CONFIDENCE_EXPLANATION[journey.routeConfidence]}</p>

      <hr className="panel__divider" />

      <p className="panel__prose">{journey.summary}</p>

      <div className="journey-stats">
        <span>
          <strong>{stats.km.toLocaleString()}</strong> km traced
        </span>
        <span>
          <strong>{stats.stages}</strong> {stats.stages === 1 ? 'stage' : 'stages'}
        </span>
        {stats.landStages > 0 && (
          <span>
            <strong>{stats.landStages}</strong> overland
          </span>
        )}
        {stats.seaStages > 0 && (
          <span>
            <strong>{stats.seaStages}</strong> by sea
          </span>
        )}
        {stats.inferredStages > 0 && (
          <span>
            <strong>{stats.inferredStages}</strong> inferred
          </span>
        )}
      </div>

      <section className="panel__section">
        <h3 className="panel__heading">Stages</h3>
        <ol className="stages">
          {journey.legs.map((leg, index) => (
            <li className="stage" key={`${leg.fromPlace}-${leg.toPlace}-${index}`}>
              <div className="stage__route">
                <button type="button" className="inline-link" onClick={() => onSelectPlace(leg.fromPlace)}>
                  {placeName(leg.fromPlace)}
                </button>
                <RouteSwatch mode={leg.mode} />
                <button type="button" className="inline-link" onClick={() => onSelectPlace(leg.toPlace)}>
                  {placeName(leg.toPlace)}
                </button>
                <span className="stage__mode">{ROUTE_LABEL[leg.mode]}</span>
              </div>
              {leg.note && <p className="stage__note">{leg.note}</p>}
              {leg.scripture.length > 0 && (
                <div className="scripture-refs stage__refs">
                  {leg.scripture.map((ref) => (
                    <ScriptureLink key={`${ref.book}-${ref.chapter}-${ref.verse ?? ''}`} reference={ref} />
                  ))}
                </div>
              )}
            </li>
          ))}
        </ol>
      </section>

      {events.length > 0 && (
        <section className="panel__section">
          <h3 className="panel__heading">Events along the way</h3>
          <ul className="event-log">
            {events.map((event) => (
              <li key={event.id}>
                <span className="event-log__year">{formatYear(event.year)}</span>
                <span className="event-log__name">{event.name}</span>
                <span className="event-log__desc">{event.description}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {journey.scripture.length > 0 && (
        <section className="panel__section">
          <h3 className="panel__heading">In scripture</h3>
          <div className="scripture-refs">
            {journey.scripture.map((ref) => (
              <ScriptureLink key={`${ref.book}-${ref.chapter}-${ref.verse ?? ''}`} reference={ref} />
            ))}
          </div>
          <p className="scripture-refs__hint">Opens the passage in Logos · hover for a summary</p>
        </section>
      )}

      {journey.sources.length > 0 && (
        <section className="panel__section">
          <h3 className="panel__heading">Sources</h3>
          <ul className="sources">
            {journey.sources.map((source) => (
              <li key={source.citation}>
                <cite>{source.citation}</cite> — {source.note}
              </li>
            ))}
          </ul>
        </section>
      )}
    </aside>
  );
}
