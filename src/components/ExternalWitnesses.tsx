'use client';

import type { ExternalSource, WitnessKind } from '@/atlas/types';
import type { ExternalLink } from '@/lib/external-links';

/**
 * "Who else says so."
 *
 * Two sections that must not be confused with each other, and are therefore
 * given different headings and different weight:
 *
 *  - **Outside the Bible.** Named ancient witnesses — Josephus on the temple
 *    porticoes, Strabo on the harbour at Ephesus, the Gallio inscription, the
 *    excavation report for the pool of Siloam. Each says which work, where in it,
 *    roughly when it was written, and what it actually claims. This is the
 *    section a reader checking a fact needs.
 *
 *  - **Look it up.** Constructed links into concordances, lexicons, gazetteers
 *    and general reference. Useful, but a search box is not a witness, and
 *    listing the two together would let the second borrow the authority of the
 *    first.
 *
 * The kind badge is doing real work. A reader should be able to see at a glance
 * that a claim rests on an excavated building rather than on a historian writing
 * three centuries later, without reading a word of the note.
 */

const KIND_LABEL: Record<WitnessKind, string> = {
  historian: 'Historian',
  geographer: 'Geographer',
  inscription: 'Inscription',
  papyrus: 'Manuscript',
  excavation: 'Excavation',
  reference: 'Ancient reference',
};

interface ExternalWitnessesProps {
  sources?: ExternalSource[];
  links?: ExternalLink[];
}

export function ExternalWitnesses({ sources = [], links = [] }: ExternalWitnessesProps) {
  if (sources.length === 0 && links.length === 0) return null;

  return (
    <>
      {/* Silent when there is nothing to say. A curated witness list exists for
          the entries that warrant one; announcing its absence on the other
          fourteen hundred would be a line of apology on every panel. */}
      {sources.length > 0 && (
        <section className="panel__section">
          <h3 className="panel__heading">Outside the Bible</h3>
          <ul className="witnesses">
            {sources.map((source) => (
              <li className="witness" key={`${source.author}-${source.work}-${source.locus ?? ''}`}>
                <p className="witness__head">
                  <span className={`witness__kind witness__kind--${source.kind}`}>
                    {KIND_LABEL[source.kind]}
                  </span>
                  <span className="witness__author">{source.author}</span>
                  {source.date && <span className="witness__date">{source.date}</span>}
                </p>
                <p className="witness__work">
                  <cite>{source.work}</cite>
                  {source.locus && <span className="witness__locus"> {source.locus}</span>}
                </p>
                <p className="witness__note">{source.note}</p>
                {source.url && (
                  <a className="witness__link" href={source.url} target="_blank" rel="noreferrer">
                    Read the text ↗
                  </a>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {links.length > 0 && (
        <section className="panel__section">
          <h3 className="panel__heading">Look it up</h3>
          <ul className="lookups">
            {links.map((link) => (
              <li key={link.url}>
                <a href={link.url} target="_blank" rel="noreferrer">
                  {link.label} ↗
                </a>
                <span className="lookups__hint">{link.hint}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
