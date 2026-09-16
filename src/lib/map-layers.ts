import type { Feature, FeatureCollection, LineString, Point, Polygon, MultiPolygon } from 'geojson';
import type { Journey, Place, Polity, Territory } from '@/atlas/types';
import { PLACE_BY_ID, sitesWithin } from '@/atlas/corpus';

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
  /**
   * True for a location *inside* a settlement — a gate, a pool, a portico, a
   * hired lecture hall. Jerusalem alone holds fifty-nine of them, stacked within
   * a kilometre of each other, so drawing them at every zoom would bury the city
   * they belong to under its own furniture. The map gives them their own layer
   * and only shows it once the reader has zoomed in far enough to be asking.
   */
  interior: boolean;
  /**
   * True when the dot has been moved off the coordinate the corpus holds.
   *
   * Only ever set for an interior site that has no coordinate of its own and has
   * inherited its city's — the Fish Gate is recorded as being *in* Jerusalem and
   * nothing more. Drawn on the city's own point, fifty of those become one dot
   * and the reader can reach none of them. So they are fanned around the city
   * centre, and this flag makes the interface say so rather than letting a
   * legible dot pass for a located one.
   */
  displaced: boolean;
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

/** Coordinates agreeing to three decimals — about a hundred metres — are one point. */
function clusterKey(coordinates: [number, number]): string {
  return `${coordinates[0].toFixed(3)},${coordinates[1].toFixed(3)}`;
}

/**
 * Fan interior sites that share a point into concentric rings around it.
 *
 * Returns the drawing position for each, keyed by place id. Rings hold eight,
 * then fourteen, then twenty, growing by six as the radius steps out, which
 * keeps the angular spacing roughly even. The outermost ring for a city with
 * fifty-nine named interiors lands about a kilometre from centre — very close to
 * the actual footprint of the walled city — so the fan reads as a city rather
 * than as a starburst.
 *
 * Two decisions worth stating. The grouping is by where the sites *actually sit*
 * rather than by agreement with the parent's own coordinate: a gate that
 * inherited its position from a gazetteer record will be a few hundred metres
 * off the curated city centre while still being stacked on forty of its
 * neighbours, and it is the stack that has to be broken. And the whole sibling
 * set is consulted through `sitesWithin`, not just the places currently drawn,
 * so a site keeps the same position as the timeline moves under it instead of
 * hopping around its city whenever its neighbours come and go.
 */
function fanCoincidentSites(places: Place[]): Map<string, [number, number]> {
  const parentIds = new Set<string>();
  for (const place of places) {
    if (place.parentPlaceId) parentIds.add(place.parentPlaceId);
  }

  const positions = new Map<string, [number, number]>();

  for (const parentId of parentIds) {
    // Both relations, not just "in". A place recorded only as *near* a city and
    // given that city's coordinate — Akeldama, Ezel — is stacked exactly as the
    // gates are, and is drawn on the settlement layer where the stack is worse.
    const clusters = new Map<string, Place[]>();
    for (const sibling of sitesWithin(parentId)) {
      if (!sibling.coordinates) continue;
      const key = clusterKey(sibling.coordinates);
      const group = clusters.get(key) ?? [];
      group.push(sibling);
      clusters.set(key, group);
    }

    for (const group of clusters.values()) {
      if (group.length < 2) continue;
      const centre = group[0]!.coordinates!;
      // Longitude degrees shrink with latitude; without this the fan is an ellipse.
      const lonScale = 1 / Math.max(0.2, Math.cos((centre[1] * Math.PI) / 180));
      const ordered = [...group].sort((a, b) => a.id.localeCompare(b.id));

      let index = 0;
      let ring = 0;
      while (index < ordered.length) {
        const capacity = 8 + ring * 6;
        const radius = 0.003 + ring * 0.002;
        const count = Math.min(capacity, ordered.length - index);
        for (let i = 0; i < count; i += 1) {
          const angle = (2 * Math.PI * i) / count + ring * 0.4;
          positions.set(ordered[index + i]!.id, [
            centre[0] + Math.cos(angle) * radius * lonScale,
            centre[1] + Math.sin(angle) * radius,
          ]);
        }
        index += count;
        ring += 1;
      }
    }
  }

  return positions;
}

export function placesToGeoJSON(
  places: Place[],
  highlightedIds: ReadonlySet<string>,
): FeatureCollection<Point, PlaceFeatureProps> {
  const features: Feature<Point, PlaceFeatureProps>[] = [];
  const fanned = fanCoincidentSites(places);

  for (const place of places) {
    if (!place.coordinates) continue;
    // A site is interior only when it sits *in* its parent. "Near" is how the
    // sources locate an ordinary settlement by its better-known neighbour —
    // Abronah near Ezion-geber — and those are towns in their own right.
    const interior = Boolean(place.parentPlaceId) && place.siteRelation === 'in';
    const displacedTo = fanned.get(place.id);
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: displacedTo ?? place.coordinates },
      properties: {
        id: place.id,
        name: place.name,
        kind: place.kind,
        confidence: place.confidence,
        rank: rankFor(place),
        highlighted: highlightedIds.has(place.id),
        interior,
        displaced: displacedTo !== undefined,
      },
    });
  }

  return { type: 'FeatureCollection', features };
}

/**
 * True when the map draws this place away from the coordinate the corpus holds.
 *
 * Computed by the same rule the fan uses — a site is moved exactly when it shares
 * its point with a sibling — so the panel's disclosure and the map's behaviour
 * cannot disagree.
 */
export function isDisplacedOnMap(place: Place): boolean {
  if (!place.coordinates || !place.parentPlaceId) return false;
  const key = clusterKey(place.coordinates);
  let sharing = 0;
  for (const sibling of sitesWithin(place.parentPlaceId)) {
    if (!sibling.coordinates) continue;
    if (clusterKey(sibling.coordinates) === key) sharing += 1;
    if (sharing > 1) return true;
  }
  return false;
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

export interface TerritoryFeatureProps {
  id: string;
  name: string;
  color: string;
  category: string;
  /**
   * Rough polygon area in square degrees. Territories nest — Judea sits inside
   * the province of Judaea, which sits inside the empire — so the largest must
   * be drawn first or a province would paint over every region within it.
   */
  area: number;
}

/** Shoelace area of a ring, in square degrees. Sign discarded; we only rank by size. */
function ringArea(ring: [number, number][] | number[][]): number {
  let sum = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const [x1, y1] = ring[i] as [number, number];
    const [x2, y2] = ring[(i + 1) % ring.length] as [number, number];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
}

function extentArea(extent: Polygon | MultiPolygon): number {
  if (extent.type === 'Polygon') return ringArea(extent.coordinates[0] ?? []);
  return extent.coordinates.reduce((total, polygon) => total + ringArea(polygon[0] ?? []), 0);
}

/**
 * Territories as shaded areas, largest first.
 *
 * The ordering is the whole trick. Asia is roughly forty times the area of the
 * allotment of Benjamin, and a fill layer paints features in source order, so
 * without sorting the small ones vanish under the large. Sorting descending puts
 * Benjamin on top of Judah on top of the province, which is the order a reader
 * needs: the more specific label is the one worth seeing.
 */
export function territoriesToGeoJSON(
  territories: Territory[],
): FeatureCollection<Polygon | MultiPolygon, TerritoryFeatureProps> {
  const features: Feature<Polygon | MultiPolygon, TerritoryFeatureProps>[] = territories.map(
    (territory) => ({
      type: 'Feature' as const,
      geometry: territory.extent,
      properties: {
        id: territory.id,
        name: territory.name,
        color: territory.color,
        category: territory.category,
        area: extentArea(territory.extent),
      },
    }),
  );

  features.sort((a, b) => b.properties.area - a.properties.area);
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
