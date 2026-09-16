'use client';

import { TERRITORY_BY_ID, PLACE_BY_ID, POLITY_BY_ID } from '@/atlas/corpus';
import { formatYearRange } from '@/atlas/search';
import { linksForName, pleiades, wikipedia } from '@/lib/external-links';
import { TERRITORY_CATEGORY_LABEL } from '@/atlas/data/territories';
import { ScriptureLink } from './ScriptureLink';
import { ExternalWitnesses } from './ExternalWitnesses';

interface TerritoryPanelProps {
  territoryId: string;
  onClose: () => void;
  onSelectPlace: (placeId: string) => void;
}

/**
 * The detail panel for a shaded area.
 *
 * It shares the right-hand drawer with places and routes, and it leads with the
 * warning rather than burying it, because a filled polygon is the most confident
 * thing a map can draw and the confidence is not warranted. A reader who takes
 * the edge of Asia here for the edge of the province in AD 50 has been misled by
 * the medium, and the panel's job is to say so before it says anything else.
 */
export function TerritoryPanel({ territoryId, onClose, onSelectPlace }: TerritoryPanelProps) {
  const territory = TERRITORY_BY_ID.get(territoryId);

  if (!territory) {
    return (
      <aside className="panel" aria-label="Territory details">
        <button type="button" className="panel__close" onClick={onClose}>
          Close
        </button>
        <div className="empty">
          <p>That territory is not in the atlas.</p>
        </div>
      </aside>
    );
  }

  const seat = territory.placeId ? PLACE_BY_ID.get(territory.placeId) : undefined;
  const polity = territory.polityId ? POLITY_BY_ID.get(territory.polityId) : undefined;

  return (
    <aside className="panel sg-scroll" aria-label={`${territory.name} — details`} tabIndex={-1}>
      <button type="button" className="panel__close" onClick={onClose}>
        Close ✕
      </button>

      <p className="label label--accent" style={{ margin: '0 0 2px' }}>
        {TERRITORY_CATEGORY_LABEL[territory.category]}
      </p>
      <h2 className="panel__name">{territory.name}</h2>
      <p className="panel__modern">{formatYearRange(territory.range.start, territory.range.end)}</p>

      {(territory.ancientNames.greek || territory.ancientNames.hebrew || territory.aliases.length > 0) && (
        <dl className="panel__ancient">
          {territory.ancientNames.hebrew && (
            <>
              <dt>Hebrew</dt>
              <dd>
                <span className="panel__script" lang="he" dir="rtl">
                  {territory.ancientNames.hebrew}
                </span>
                {territory.ancientNames.hebrewTranslit && (
                  <span className="translit"> {territory.ancientNames.hebrewTranslit}</span>
                )}
              </dd>
            </>
          )}
          {territory.ancientNames.greek && (
            <>
              <dt>Greek</dt>
              <dd>
                <span className="panel__script" lang="el">
                  {territory.ancientNames.greek}
                </span>
              </dd>
            </>
          )}
          {territory.aliases.length > 0 && (
            <>
              <dt>Also</dt>
              <dd>{territory.aliases.join(', ')}</dd>
            </>
          )}
        </dl>
      )}

      <p style={{ margin: '14px 0 0' }}>
        <span className="confidence confidence--conjectural">
          <span className="confidence__mark" aria-hidden="true" />
          Extent generalised
        </span>
      </p>
      <p className="confidence-explain">
        A wash, not a border. Ancient authority faded with distance instead of stopping at a line,
        and where a boundary was administrative it moved — this outline is drawn to about a degree
        of resolution and every atlas draws it differently.
      </p>

      <hr className="panel__divider" />

      <p className="panel__prose">{territory.summary}</p>

      {(seat || polity) && (
        <section className="panel__section">
          <h3 className="panel__heading">In the atlas</h3>
          <ul className="chips">
            {seat && (
              <li className="chips__item">
                <button type="button" onClick={() => onSelectPlace(seat.id)}>
                  {seat.name} — the gazetteer entry
                </button>
              </li>
            )}
            {polity && (
              <li className="chips__item">
                <span title={polity.summary}>Governed by {polity.name}</span>
              </li>
            )}
          </ul>
        </section>
      )}

      {territory.scripture.length > 0 && (
        <section className="panel__section">
          <h3 className="panel__heading">References</h3>
          <div className="scripture-refs">
            {territory.scripture.map((ref) => (
              <ScriptureLink key={`${ref.book}-${ref.chapter}-${ref.verse ?? ''}`} reference={ref} />
            ))}
          </div>
          <p className="scripture-refs__hint">Opens the passage in Logos · hover for a summary</p>
        </section>
      )}

      <ExternalWitnesses
        sources={territory.externalSources}
        links={[
          ...linksForName({ name: territory.name }),
          pleiades(territory.name),
          wikipedia(`${territory.name} ${territory.category === 'province' ? 'Roman province' : ''}`.trim()),
        ]}
      />

      {territory.sources.length > 0 && (
        <section className="panel__section">
          <h3 className="panel__heading">Sources</h3>
          <ul className="sources">
            {territory.sources.map((source) => (
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
