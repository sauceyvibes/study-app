'use client';

import { useEffect, useRef } from 'react';
import { PERSON_BY_ID, eventsForPerson, placesForPerson } from '@/atlas/corpus';
import { formatYear, formatYearRange } from '@/atlas/search';
import { ScriptureLink } from './ScriptureLink';
import type { Person } from '@/atlas/types';

interface PersonPanelProps {
  personId: string;
  onClose: () => void;
  /** Jump the map to a place the person is attested at, closing the pop-up. */
  onSelectPlace: (placeId: string) => void;
}

/**
 * A pop-up biography for a person.
 *
 * Opened by clicking a name — in a place's People list, or a person search
 * result. Unlike the place panel, which is a fixed side column, this is a modal
 * card centred over the map: a person is a lens across many places, so it reads
 * better as an overlay you dismiss than as a second permanent rail. It gathers
 * what the corpus already knows — the description, the places they are attested
 * at (each a shortcut back to the map), the datable events they take part in, and
 * their key passages, which open in Logos like every other reference.
 */
export function PersonPanel({ personId, onClose, onSelectPlace }: PersonPanelProps) {
  const person = PERSON_BY_ID.get(personId);
  const cardRef = useRef<HTMLDivElement>(null);

  // Close on Escape, and move focus into the card so the dialog is keyboard-usable.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    cardRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, personId]);

  if (!person) return null;

  const places = placesForPerson(person.id);
  const events = eventsForPerson(person.id);

  return (
    <div className="person-modal__backdrop" onClick={onClose}>
      <div
        className="person-modal sg-scroll"
        role="dialog"
        aria-modal="true"
        aria-label={`${person.name} — details`}
        tabIndex={-1}
        ref={cardRef}
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="panel__close" onClick={onClose}>
          Close ✕
        </button>

        <p className="label label--accent" style={{ margin: '0 0 2px' }}>
          {person.role}
        </p>
        <h2 className="panel__name">{person.name}</h2>
        <p className="panel__modern">{formatYearRange(person.floruit.start, person.floruit.end)}</p>

        <PersonNames person={person} />

        <hr className="panel__divider" />

        <p className="panel__prose">{person.description}</p>

        {places.length > 0 && (
          <section className="panel__section">
            <h3 className="panel__heading">Attested at</h3>
            <ul className="chips">
              {places.map((place) => (
                <li className="chips__item" key={place.id}>
                  <button type="button" onClick={() => onSelectPlace(place.id)} title={`Show ${place.name} on the map`}>
                    {place.name}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {events.length > 0 && (
          <section className="panel__section">
            <h3 className="panel__heading">In these events</h3>
            <ul className="person-events">
              {events.map((event) => (
                <li key={event.id}>
                  <span className="person-events__year">{formatYear(event.year)}</span>
                  <span className="person-events__name">{event.name}</span>
                  <span className="person-events__desc">{event.description}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {person.scripture.length > 0 && (
          <section className="panel__section">
            <h3 className="panel__heading">Key passages</h3>
            <div className="scripture-refs">
              {person.scripture.map((ref) => (
                <ScriptureLink key={`${ref.book}-${ref.chapter}-${ref.verse ?? ''}`} reference={ref} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function PersonNames({ person }: { person: Person }) {
  const { hebrew, hebrewTranslit, greek, greekTranslit } = person.ancientNames;
  const hasAny = hebrew || greek || person.aliases.length > 0;
  if (!hasAny) return null;

  return (
    <dl className="panel__ancient">
      {hebrew && (
        <>
          <dt>Hebrew</dt>
          <dd>
            <span className="panel__script" lang="he" dir="rtl">
              {hebrew}
            </span>
            {hebrewTranslit && <span className="translit"> {hebrewTranslit}</span>}
          </dd>
        </>
      )}
      {greek && (
        <>
          <dt>Greek</dt>
          <dd>
            <span className="panel__script" lang="el">
              {greek}
            </span>
            {greekTranslit && <span className="translit"> {greekTranslit}</span>}
          </dd>
        </>
      )}
      {person.aliases.length > 0 && (
        <>
          <dt>Also</dt>
          <dd>{person.aliases.join(', ')}</dd>
        </>
      )}
    </dl>
  );
}
