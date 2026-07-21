'use client';

import type { Confidence, Place, ScriptureRef } from '@/atlas/types';
import { resolveEvents, resolvePeople, resolvePolities, PLACE_BY_ID } from '@/atlas/corpus';
import { formatYear, formatYearRange } from '@/atlas/search';
import { ScriptureLink } from './ScriptureLink';

interface PlacePanelProps {
  placeId: string;
  onClose: () => void;
  onSelectPlace: (placeId: string) => void;
  onSelectPerson: (personId: string) => void;
}

/** Distinct references in canonical order-ish, capped so a much-named place does
 *  not bury the panel under a hundred chapter chips. */
function distinctRefs(refs: ScriptureRef[]): ScriptureRef[] {
  const seen = new Set<string>();
  const out: ScriptureRef[] = [];
  for (const ref of refs) {
    const key = `${ref.book}-${ref.chapter}-${ref.verse ?? ''}-${ref.verseEnd ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(ref);
  }
  return out;
}

const MAX_REFS = 60;

const CONFIDENCE_TEXT: Record<Confidence, string> = {
  certain: 'Identification certain',
  probable: 'Identification probable',
  contested: 'Identification contested',
  conjectural: 'Location conjectural',
  unlocated: 'Not located',
};

const CONFIDENCE_EXPLANATION: Record<Confidence, string> = {
  certain: 'Continuously occupied, or confirmed by an inscription found at the site.',
  probable: 'Broad scholarly agreement, on topography, name survival and excavation together.',
  contested: 'Serious published proposals disagree. The competing candidates are set out below.',
  conjectural: 'Inferred from the logic of an itinerary rather than from evidence at a site.',
  unlocated: 'Named in the text, with no accepted modern location.',
};

/**
 * The detail panel for a place.
 *
 * Structured so that the uncertainty is impossible to miss: the confidence marker
 * sits directly under the name, above the description, and contested sites lead
 * with their competing identifications rather than burying them under the prose.
 * An atlas that presents Ai at et-Tell without saying that the site was a ruin a
 * thousand years before Joshua is not being useful, it is being tidy.
 */
export function PlacePanel({ placeId, onClose, onSelectPlace, onSelectPerson }: PlacePanelProps) {
  const place = PLACE_BY_ID.get(placeId);

  if (!place) {
    return (
      <aside className="panel" aria-label="Place details">
        <button type="button" className="panel__close" onClick={onClose}>
          Close
        </button>
        <div className="empty">
          <p>That place is not in the atlas.</p>
        </div>
      </aside>
    );
  }

  const people = resolvePeople(place.people);
  const events = resolveEvents(place.events);
  const polities = resolvePolities(place.polities);

  return (
    <aside className="panel sg-scroll" aria-label={`${place.name} — details`} tabIndex={-1}>
      <button type="button" className="panel__close" onClick={onClose}>
        Close ✕
      </button>

      <h2 className="panel__name">{place.name}</h2>
      {place.modernName && <p className="panel__modern">Today {place.modernName}</p>}

      <p style={{ margin: '14px 0 0' }}>
        <span className={`confidence confidence--${place.confidence}`}>
          <span className="confidence__mark" aria-hidden="true" />
          {CONFIDENCE_TEXT[place.confidence]}
        </span>
      </p>
      <p className="confidence-explain">{CONFIDENCE_EXPLANATION[place.confidence]}</p>

      <AncientNames place={place} />

      <hr className="panel__divider" />

      <p className="panel__prose">{place.description}</p>

      {place.alternatives && place.alternatives.length > 0 && (
        <section className="panel__section">
          <h3 className="panel__heading">Competing identifications</h3>
          {place.alternatives.map((alternative) => (
            <div className="alternative" key={alternative.site}>
              <p className="alternative__site">{alternative.site}</p>
              <p className="alternative__argument">{alternative.argument}</p>
              {alternative.proponents && (
                <p className="alternative__proponents">Argued by {alternative.proponents}</p>
              )}
            </div>
          ))}
        </section>
      )}

      {place.archaeology && (
        <section className="panel__section">
          <h3 className="panel__heading">Archaeology</h3>
          <p className="panel__prose panel__prose--small">{place.archaeology}</p>
        </section>
      )}

      <section className="panel__section">
        <h3 className="panel__heading">In the narrative</h3>
        <p className="panel__prose panel__prose--small" style={{ color: 'var(--color-neutral-700)' }}>
          {formatYearRange(place.occupation.start, place.occupation.end)}
        </p>
      </section>

      {place.scripture.length > 0 && (
        <section className="panel__section">
          <h3 className="panel__heading">References</h3>
          {/* Each reference opens in Logos; resting on one previews the chapter. */}
          <div className="scripture-refs">
            {distinctRefs(place.scripture)
              .slice(0, MAX_REFS)
              .map((ref) => (
                <ScriptureLink key={`${ref.book}-${ref.chapter}-${ref.verse ?? ''}`} reference={ref} />
              ))}
          </div>
          <p className="scripture-refs__hint">Opens the passage in Logos · hover for a summary</p>
        </section>
      )}

      {people.length > 0 && (
        <section className="panel__section">
          <h3 className="panel__heading">People</h3>
          <ul className="chips">
            {people.map((person) => (
              <li className="chips__item" key={person.id}>
                <button
                  type="button"
                  onClick={() => onSelectPerson(person.id)}
                  title={`${person.role} — open`}
                >
                  {person.name}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {events.length > 0 && (
        <section className="panel__section">
          <h3 className="panel__heading">Events</h3>
          <ul className="chips">
            {events.map((event) => (
              <li className="chips__item" key={event.id}>
                <span title={event.description}>
                  {event.name} · {formatYear(event.year)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {polities.length > 0 && (
        <section className="panel__section">
          <h3 className="panel__heading">Under the rule of</h3>
          <ul className="chips">
            {polities.map((polity) => (
              <li className="chips__item" key={polity.id}>
                <span title={polity.summary}>{polity.name}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {place.alternatives?.some((a) => a.coordinates) && (
        <section className="panel__section">
          <h3 className="panel__heading">Related sites in the atlas</h3>
          <ul className="chips">
            {place.alternatives
              .filter((a) => PLACE_BY_ID.has(a.site))
              .map((a) => (
                <li className="chips__item" key={a.site}>
                  <button type="button" onClick={() => onSelectPlace(a.site)}>
                    {a.site}
                  </button>
                </li>
              ))}
          </ul>
        </section>
      )}

      {place.sources.length > 0 && (
        <section className="panel__section">
          <h3 className="panel__heading">Sources</h3>
          <ul className="sources">
            {place.sources.map((source) => (
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

function AncientNames({ place }: { place: Place }) {
  const { hebrew, hebrewTranslit, greek, greekTranslit, other } = place.ancientNames;
  const hasAny = hebrew || greek || other?.length || place.aliases.length > 0;
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
      {other?.map((form) => (
        <div key={`${form.language}-${form.form}`} style={{ display: 'contents' }}>
          <dt>{form.language}</dt>
          <dd>{form.form}</dd>
        </div>
      ))}
      {place.aliases.length > 0 && (
        <>
          <dt>Also</dt>
          <dd>{place.aliases.join(', ')}</dd>
        </>
      )}
    </dl>
  );
}
