'use client';

import { useEffect, useRef } from 'react';
import { TOPIC_BY_ID } from '@/atlas/corpus';
import { linksForName } from '@/lib/external-links';
import { ScriptureLink } from './ScriptureLink';
import { ExternalWitnesses } from './ExternalWitnesses';
import type { TopicCategory } from '@/atlas/types';

interface TopicPanelProps {
  topicId: string;
  onClose: () => void;
}

const CATEGORY_LABEL: Record<TopicCategory, string> = {
  deity: 'God, angel or spirit',
  festival: 'Festival or sacred season',
  month: 'Month of the calendar',
  'people-group': 'People or religious group',
  title: 'Title or office',
  music: 'Musical or liturgical term',
  star: 'Star or constellation',
  other: 'Named in the text',
};

/**
 * A card for something the text names that has no place on the map.
 *
 * Pharisees, Nazirites, Passover, Adar, Selah, Molech, the Pleiades. A study
 * tool has to answer these — they are exactly the words a reader stops on — and
 * the atlas has been quietly unable to until now.
 *
 * It is a modal card rather than the right-hand drawer on purpose, and it never
 * touches the viewport. The drawer is where things that *are somewhere* go, and
 * opening one of these must not imply the map has moved to it, because there is
 * nowhere to move to. That restraint is the same argument as the one for keeping
 * these out of the map layers in the first place.
 */
export function TopicPanel({ topicId, onClose }: TopicPanelProps) {
  const topic = TOPIC_BY_ID.get(topicId);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    cardRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, topicId]);

  if (!topic) return null;

  return (
    <div className="person-modal__backdrop" onClick={onClose}>
      <div
        className="person-modal sg-scroll"
        role="dialog"
        aria-modal="true"
        aria-label={`${topic.name} — details`}
        tabIndex={-1}
        ref={cardRef}
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="panel__close" onClick={onClose}>
          Close ✕
        </button>

        <p className="label label--accent" style={{ margin: '0 0 2px' }}>
          {CATEGORY_LABEL[topic.category]}
        </p>
        <h2 className="panel__name">{topic.name}</h2>
        <p className="panel__modern">Named in the text · not a location</p>

        {(topic.ancientNames.hebrew || topic.ancientNames.greek || topic.aliases.length > 0) && (
          <dl className="panel__ancient">
            {topic.ancientNames.hebrew && (
              <>
                <dt>Hebrew</dt>
                <dd>
                  <span className="panel__script" lang="he" dir="rtl">
                    {topic.ancientNames.hebrew}
                  </span>
                </dd>
              </>
            )}
            {topic.ancientNames.greek && (
              <>
                <dt>Greek</dt>
                <dd>
                  <span className="panel__script" lang="el">
                    {topic.ancientNames.greek}
                  </span>
                </dd>
              </>
            )}
            {topic.aliases.length > 0 && (
              <>
                <dt>Also</dt>
                <dd>{topic.aliases.join(', ')}</dd>
              </>
            )}
          </dl>
        )}

        <hr className="panel__divider" />

        <p className="panel__prose">{topic.description || topic.role}</p>

        {topic.scripture.length > 0 && (
          <section className="panel__section">
            <h3 className="panel__heading">
              Named in {topic.scripture.length}{' '}
              {topic.scripture.length === 1 ? 'chapter' : 'chapters'}
            </h3>
            <div className="scripture-refs">
              {topic.scripture.slice(0, 60).map((ref) => (
                <ScriptureLink key={`${ref.book}-${ref.chapter}`} reference={ref} />
              ))}
            </div>
            <p className="scripture-refs__hint">Opens the passage in Logos · hover for a summary</p>
          </section>
        )}

        <ExternalWitnesses
          links={linksForName({ name: topic.name, strongs: topic.strongs })}
        />

        {topic.sources.length > 0 && (
          <section className="panel__section">
            <h3 className="panel__heading">Sources</h3>
            <ul className="sources">
              {topic.sources.map((source) => (
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
