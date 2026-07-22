import type { JourneyLeg } from '@/atlas/types';

export type RouteMode = JourneyLeg['mode'];

export const ROUTE_LABEL: Record<RouteMode, string> = {
  land: 'Overland',
  sea: 'By sea',
  inferred: 'Inferred link',
};

/**
 * A short line drawn exactly as the map draws it: in the journey's own colour,
 * solid for a real leg (overland or by sea) and dashed only for an inferred
 * connection. The colour and dash pattern match the map's route layers, so
 * wherever this glyph appears — the legend, a journey's stages — it is a true
 * statement about the plate, not an approximation of it.
 */
export function RouteSwatch({ mode, color }: { mode: RouteMode; color: string }) {
  const dash = mode === 'inferred' ? '2 3' : undefined;
  return (
    <svg className="map-legend__route" width="22" height="8" viewBox="0 0 22 8" aria-hidden="true">
      <line x1="1" y1="4" x2="21" y2="4" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeDasharray={dash} />
    </svg>
  );
}
