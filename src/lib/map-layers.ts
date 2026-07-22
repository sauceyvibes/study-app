import type { Feature, FeatureCollection, LineString, Point, Polygon, MultiPolygon } from 'geojson';
import type { Journey, Place, Polity } from '@/atlas/types';
import { PLACE_BY_ID } from '@/atlas/corpus';

/**
 * Corpus → GeoJSON.
 *
 * Kept deliberately separate from the React component. Turning atlas entities
 * into map features is pure data work with real edge cases (unlocated places,
 * journey legs whose endpoints share coordinates), and it is far easier to reason
 * about — and to test — outside a component that also owns a WebGL context.
 */

export interface PlaceFeatureProps {
  id: string;
  name: string;
  kind: string;
  confidence: string;
  /** Drives label size and symbol weight. Higher is more prominent. */
  rank: number;
  /** True when the place is in the current book/chapter or search focus. */
  highlighted: boolean;
}

/**
 * Visual weight for a place.
 *
 * Capitals and major cities carry larger type in a printed atlas, and villages
 * get a small dot and small caps. This mirrors that convention rather than
 * drawing every settlement identically.
 */
function rankFor(place: Place): number {
  switch (place.kind) {
    case 'capital':
      return 4;
    case 'city':
      return 3;
    case 'fortress':
    case 'sanctuary':
    case 'region':
      return 2;
    case 'town':
    case 'mountain':
    case 'water':
    case 'island':
      return 1;
    default:
      return 0;
  }
}

export function placesToGeoJSON(
  places: Place[],
  highlightedIds: ReadonlySet<string>,
): FeatureCollection<Point, PlaceFeatureProps> {
  const features: Feature<Point, PlaceFeatureProps>[] = [];

  for (const place of places) {
    if (!place.coordinates) continue;
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: place.coordinates },
      properties: {
        id: place.id,
        name: place.name,
        kind: place.kind,
        confidence: place.confidence,
        rank: rankFor(place),
        highlighted: highlightedIds.has(place.id),
      },
    });
  }

  return { type: 'FeatureCollection', features };
}

export interface RouteFeatureProps {
  journeyId: string;
  journeyName: string;
  /** The journey's identifying colour, drawn data-driven by the route layers. */
  color: string;
  mode: 'land' | 'sea' | 'inferred';
  legIndex: number;
}

/**
 * A gently curved path between two points.
 *
 * Straight lines between cities read as modern network diagrams; the arc is what
 * makes a route look like a journey. The offset is perpendicular to the leg and
 * scales with its length, so short hops stay nearly straight and long sea
 * crossings bow noticeably — which also stops overlapping legs from hiding each
 * other.
 */
function arcBetween(
  from: [number, number],
  to: [number, number],
  bend: number,
  segments = 48,
): [number, number][] {
  const [x1, y1] = from;
  const [x2, y2] = to;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy);

  if (length === 0) return [from, to];

  // Control point offset perpendicular to the chord.
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const controlX = midX + (-dy / length) * length * bend;
  const controlY = midY + (dx / length) * length * bend;

  const points: [number, number][] = [];
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    const inverse = 1 - t;
    points.push([
      inverse * inverse * x1 + 2 * inverse * t * controlX + t * t * x2,
      inverse * inverse * y1 + 2 * inverse * t * controlY + t * t * y2,
    ]);
  }
  return points;
}

const BEND_BY_MODE: Record<RouteFeatureProps['mode'], number> = {
  land: 0.08,
  sea: 0.16,
  inferred: 0.1,
};

export function journeysToGeoJSON(journeys: Journey[]): FeatureCollection<LineString, RouteFeatureProps> {
  const features: Feature<LineString, RouteFeatureProps>[] = [];

  for (const journey of journeys) {
    journey.legs.forEach((leg, legIndex) => {
      const from = PLACE_BY_ID.get(leg.fromPlace)?.coordinates;
      const to = PLACE_BY_ID.get(leg.toPlace)?.coordinates;
      // A leg whose endpoints we cannot place is dropped rather than drawn to
      // [0,0]. The corpus test makes the ids valid; this guards the coordinates,
      // which unlocated places legitimately lack.
      if (!from || !to) return;

      features.push({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: arcBetween(from, to, BEND_BY_MODE[leg.mode]) },
        properties: {
          journeyId: journey.id,
          journeyName: journey.name,
          color: journey.color,
          mode: leg.mode,
          legIndex,
        },
      });
    });
  }

  return { type: 'FeatureCollection', features };
}

export interface PolityFeatureProps {
  id: string;
  name: string;
  color: string;
}

export function politiesToGeoJSON(polities: Polity[]): FeatureCollection<Polygon | MultiPolygon, PolityFeatureProps> {
  const features: Feature<Polygon | MultiPolygon, PolityFeatureProps>[] = [];

  for (const polity of polities) {
    if (!polity.extent) continue;
    features.push({
      type: 'Feature',
      geometry: polity.extent,
      properties: { id: polity.id, name: polity.name, color: polity.color },
    });
  }

  return { type: 'FeatureCollection', features };
}

/**
 * Decorative water labels, in the manner of a printed atlas plate — "The Great
 * Sea" set letterspaced across the eastern Mediterranean. These are furniture,
 * not gazetteer entries: they never appear in search and have no detail panel.
 */
export const DECOR_LABELS: FeatureCollection<Point, { name: string; size: number }> = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', geometry: { type: 'Point', coordinates: [32.6, 33.6] }, properties: { name: 'The Great Sea', size: 1.4 } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [36.4, 25.9] }, properties: { name: 'Red Sea', size: 1 } },
    { type: 'Feature', geometry: { type: 'Point', coordinates: [50.5, 28.6] }, properties: { name: 'The Lower Sea', size: 1 } },
  ],
};

/** Bounding box of a set of places, padded, or null if none can be located. */
export function boundsFor(placeIds: readonly string[]): [[number, number], [number, number]] | null {
  const coords = placeIds
    .map((id) => PLACE_BY_ID.get(id)?.coordinates)
    .filter((c): c is [number, number] => c !== undefined && c !== null);

  if (coords.length === 0) return null;

  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;
  for (const [lon, lat] of coords) {
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }

  // A single point would give a zero-area box that MapLibre cannot fit; give it
  // roughly half a degree of breathing room instead.
  if (minLon === maxLon && minLat === maxLat) {
    return [
      [minLon - 0.5, minLat - 0.5],
      [maxLon + 0.5, maxLat + 0.5],
    ];
  }

  return [
    [minLon, minLat],
    [maxLon, maxLat],
  ];
}
