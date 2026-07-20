'use client';

import { useId } from 'react';
import { PERIODS, TIMELINE_BOUNDS, periodForYear } from '@/atlas/data/periods';
import { formatYear, formatYearRange } from '@/atlas/search';

interface TimelineProps {
  year: number;
  onChange: (year: number) => void;
}

const SPAN = TIMELINE_BOUNDS.end - TIMELINE_BOUNDS.start;

/**
 * The century scrubber.
 *
 * The period bands are proportional to their real duration, which means the
 * patriarchal age is wide and the exile is a sliver — an honest picture of how
 * unevenly the biblical narrative is distributed across time, and more useful
 * than equal-width tabs that would flatten it.
 *
 * Bands are buttons, not decoration: clicking one jumps to the middle of that
 * period. That gives keyboard users a way to move between eras without dragging
 * a range input across two thousand years one arrow-press at a time.
 */
export function Timeline({ year, onChange }: TimelineProps) {
  const sliderId = useId();
  const current = periodForYear(year);

  return (
    <div className="timeline">
      <div className="timeline__header">
        <span className="timeline__year">{formatYear(year)}</span>
        <span className="timeline__period">{current.name}</span>

        <div className="timeline__nudge">
          <button type="button" onClick={() => onChange(year - 50)} aria-label="Back fifty years">
            − 50
          </button>
          <button type="button" onClick={() => onChange(year + 50)} aria-label="Forward fifty years">
            + 50
          </button>
        </div>
      </div>

      <div className="timeline__track">
        <div className="timeline__bands" aria-hidden="true">
          {PERIODS.map((period) => {
            const end = period.range.end ?? TIMELINE_BOUNDS.end;
            const width = ((end - period.range.start) / SPAN) * 100;
            const midpoint = Math.round((period.range.start + end) / 2);
            return (
              <button
                key={period.id}
                type="button"
                className="timeline__band"
                style={{ width: `${width}%` }}
                data-current={period.id === current.id}
                title={`${period.name} — ${formatYearRange(period.range.start, period.range.end)}`}
                tabIndex={-1}
                onClick={() => onChange(midpoint)}
              />
            );
          })}
        </div>

        <label className="visually-hidden" htmlFor={sliderId}>
          Year, from {formatYear(TIMELINE_BOUNDS.start)} to {formatYear(TIMELINE_BOUNDS.end)}
        </label>
        <input
          id={sliderId}
          className="timeline__slider"
          type="range"
          min={TIMELINE_BOUNDS.start}
          max={TIMELINE_BOUNDS.end}
          step={10}
          value={year}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-valuetext={`${formatYear(year)}, ${current.name}`}
        />
      </div>

      <div className="timeline__scale" aria-hidden="true">
        <span>{formatYear(TIMELINE_BOUNDS.start)}</span>
        <span>1000 BC</span>
        <span>1 BC</span>
        <span>{formatYear(TIMELINE_BOUNDS.end)}</span>
      </div>
    </div>
  );
}
