import type { JourneyLeg } from '@/atlas/types';

export type RouteMode = JourneyLeg['mode'];

export const ROUTE_LABEL: Record<RouteMode, string> = {
  land: 'Overland',
  sea: 'By sea',
  inferred: 'Inferred link',
};

/**
 * A short line drawn exactly as the map draws that route mode — solid terracotta
 * for land, dashed teal for sea, dotted neutral for an inferred connection. The
 * colours and dash patterns are the same values the map's route layers use, so
 * wherever this glyph appears (the legend, a journey's stages) it is a true
 * statement about the plate, not an approximation of it.
 */
export function RouteSwatch({ mode }: { mode: RouteMode }) {
  const stroke =
    mode === 'sea'
      ? 'var(--color-accent-2-600)'
      : mode === 'inferred'
        ? 'var(--color-neutral-600)'
        : 'var(--color-accent-700)';
  const dash = mode === 'sea' ? '6 3' : mode === 'inferred' ? '2 3' : undefined;
  return (
    <svg className="map-legend__route" width="22" height="8" viewBox="0 0 22 8" aria-hidden="true">
      <line x1="1" y1="4" x2="21" y2="4" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeDasharray={dash} />
    </svg>
  );
}
