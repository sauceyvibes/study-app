'use client';

import { useEffect, useRef } from 'react';
import {
  PERSON_BY_ID,
  eventsForPerson,
  placesForPerson,
  placesNamedWithPerson,
  resolvePeople,
} from '@/atlas/corpus';
import { formatYear, formatYearRange } from '@/atlas/search';
import { linksForName } from '@/lib/external-links';
import { ScriptureLink } from './ScriptureLink';
import { ExternalWitnesses } from './ExternalWitnesses';
import type { Person } from '@/atlas/types';

interface PersonPanelProps {
  personId: string;
  onClose: () => void;
  /** Jump the map to a place the person is attested at, closing the pop-up. */
  onSelectPlace: (placeId: string) => void;
  /** Open another figure's card — a parent, a sibling, a child. */
  onSelectPerson: (personId: string) => void;
}

/** Distinct chapter references, capped so a much-named figure does not bury the card. */
const MAX_REFS = 48;

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
export function PersonPanel({ personId, onClose, onSelectPlace, onSelectPerson }: PersonPanelProps) {
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
  const isGroup = person.kind === 'group';
  // Only worth offering when the corpus has nothing better. For Paul or Abraham
  // the attested itinerary is the answer; for the three thousand figures with no
  // place attached, chapter co-occurrence is the only geography there is.
  const nearby = places.length === 0 ? placesNamedWithPerson(person.id) : [];

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
          {isGroup ? 'People group' : person.role}
        </p>
        <h2 className="panel__name">{person.name}</h2>
        <p className="panel__modern">
          {formatYearRange(person.floruit.start, person.floruit.end)}
          {person.tribe && <span className="panel__tribe"> · {person.tribe}</span>}
        </p>

        <PersonNames person={person} />

        <hr className="panel__divider" />

        <p className="panel__prose">{person.description}</p>

        {person.relations && (
          <Family relations={person.relations} onSelectPerson={onSelectPerson} />
        )}

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

        {nearby.length > 0 && (
          <section className="panel__section">
            <h3 className="panel__heading">Named in the same chapters</h3>
            <p className="panel__prose panel__prose--small" style={{ color: 'var(--color-neutral-700)' }}>
              No place is attested for {person.name}. These are the places the same chapters name —
              a hint at where to look, not a claim about where they were.
            </p>
            <ul className="chips">
              {nearby.map((place) => (
                <li className="chips__item" key={place.id}>
                  <button type="button" onClick={() => onSelectPlace(place.id)}>
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

        {person.scripture.length > 0 && (
          <section className="panel__section">
            <h3 className="panel__heading">
              {person.scripture.length > MAX_REFS ? 'Passages' : 'Key passages'}
            </h3>
            <div className="scripture-refs">
              {person.scripture.slice(0, MAX_REFS).map((ref) => (
                <ScriptureLink key={`${ref.book}-${ref.chapter}-${ref.verse ?? ''}`} reference={ref} />
              ))}
            </div>
            {person.scripture.length > MAX_REFS && (
              <p className="scripture-refs__hint">
                The first {MAX_REFS} of {person.scripture.length}. The concordance link below has
                them all.
              </p>
            )}
          </section>
        )}

        <ExternalWitnesses
          sources={person.externalSources}
          links={linksForName({ name: person.name, strongs: person.strongs })}
        />

        {person.sources && person.sources.length > 0 && (
          <section className="panel__section">
            <h3 className="panel__heading">Sources</h3>
            <ul className="sources">
              {person.sources.map((source) => (
                <li key={source.citation}>
                  <cite>{source.citation}</cite> — {source.note}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

/**
 * The genealogies, as links.
 *
 * This is the single biggest thing the comprehensive layer adds. Almost every
 * minor figure in the Bible is defined entirely by their family — "Abdi, father
 * of Kish" is the whole of what is said about him — and until now those names
 * were dead text. Made clickable, the corpus becomes walkable: from Abdi to
 * Kish to Kish's line, which is how genealogical study is actually done.
 */
function Family({
  relations,
  onSelectPerson,
}: {
  relations: NonNullable<Person['relations']>;
  onSelectPerson: (personId: string) => void;
}) {
  const rows: { label: string; ids: string[] }[] = [
    { label: 'Father', ids: relations.father ? [relations.father] : [] },
    { label: 'Mother', ids: relations.mother ? [relations.mother] : [] },
    { label: 'Siblings', ids: relations.siblings },
    { label: 'Married to', ids: relations.partners },
    { label: 'Children', ids: relations.offspring },
  ].filter((row) => row.ids.length > 0);

  if (rows.length === 0) return null;

  return (
    <section className="panel__section">
      <h3 className="panel__heading">Family</h3>
      {rows.map((row) => {
        const people = resolvePeople(row.ids);
        if (people.length === 0) return null;
        return (
          <div className="family-row" key={row.label}>
            <span className="family-row__label">{row.label}</span>
            <ul className="chips">
              {people.map((relative) => (
                <li className="chips__item" key={relative.id}>
                  <button type="button" onClick={() => onSelectPerson(relative.id)} title={relative.role}>
                    {relative.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </section>
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
