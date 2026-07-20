'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { type Map as MapLibreMap, type MapGeoJSONFeature, type GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { resolveBasemap, DEFAULT_VIEW, MAX_BOUNDS } from '@/lib/basemap';
import { placesToGeoJSON, journeysToGeoJSON, politiesToGeoJSON, boundsFor } from '@/lib/map-layers';
import type { Journey, Place, Polity } from '@/atlas/types';

interface AtlasMapProps {
  places: Place[];
  journeys: Journey[];
  polities: Polity[];
  highlightedIds: ReadonlySet<string>;
  selectedPlaceId: string | null;
  /** Place ids to frame. Changing this array re-fits the viewport. */
  focusPlaceIds: string[];
  onSelectPlace: (placeId: string | null) => void;
}

const SOURCES = { places: 'atlas-places', routes: 'atlas-routes', polities: 'atlas-polities' } as const;

/**
 * The map surface.
 *
 * MapLibre owns an imperative WebGL context, so this component follows the only
 * pattern that stays sane: the map is created **once**, and every subsequent
 * change is pushed into it through `setData` on existing sources. Rebuilding
 * layers on each render would drop the user's pan and zoom on every timeline
 * nudge, which is precisely the interaction we most need to feel continuous.
 *
 * Chosen over Leaflet for three reasons that matter here: vector rendering keeps
 * label placement crisp at any zoom, GPU compositing keeps the timeline scrub at
 * 60fps with several hundred features on screen, and the same style JSON will
 * carry over to a Capacitor build without change.
 */
export function AtlasMap({
  places,
  journeys,
  polities,
  highlightedIds,
  selectedPlaceId,
  focusPlaceIds,
  onSelectPlace,
}: AtlasMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const basemap = useMemo(() => resolveBasemap(), []);

  // ── Create the map once ──────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: basemap.style,
      center: [...DEFAULT_VIEW.center],
      zoom: DEFAULT_VIEW.zoom,
      maxBounds: MAX_BOUNDS,
      minZoom: 3,
      maxZoom: 12,
      attributionControl: { compact: true },
      // Pitch and rotation are disabled deliberately. A tilted historical atlas
      // is a novelty that costs legibility, and locking north-up means our label
      // placement rules only ever have one orientation to satisfy.
      pitchWithRotate: false,
      dragRotate: false,
      touchZoomRotate: true,
    });

    map.touchZoomRotate.disableRotation();
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-left');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

    map.on('error', (event) => {
      // Tile requests fail for all sorts of reasons — a gap in coverage, a rate
      // limit, an offline user. None of those should take the atlas down, since
      // our own layers do not depend on the basemap. Only report an error when
      // the style itself could not be parsed, which is unrecoverable.
      if (event.error && 'status' in event.error) return;
      setStatus((current) => (current === 'ready' ? current : 'error'));
    });

    // `style.load` fires as soon as the style is parsed. `load` additionally
    // waits for the first tiles to arrive, and hanging tile requests would leave
    // the loading overlay covering a map that is perfectly usable — the
    // gazetteer, routes and territory are all drawn from local data.
    map.on('style.load', () => {
      installLayers(map);
      setStatus('ready');
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [basemap.style]);

  // ── Push data updates ────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== 'ready') return;

    setSourceData(map, SOURCES.places, placesToGeoJSON(places, highlightedIds));
  }, [places, highlightedIds, status]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== 'ready') return;

    setSourceData(map, SOURCES.routes, journeysToGeoJSON(journeys));
  }, [journeys, status]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== 'ready') return;

    setSourceData(map, SOURCES.polities, politiesToGeoJSON(polities));
  }, [polities, status]);

  // ── Selection ring ───────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== 'ready') return;
    map.setFilter('place-selected', ['==', ['get', 'id'], selectedPlaceId ?? '__none__']);
  }, [selectedPlaceId, status]);

  // ── Framing ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== 'ready' || focusPlaceIds.length === 0) return;

    const bounds = boundsFor(focusPlaceIds);
    if (!bounds) return;

    map.fitBounds(bounds, {
      // Asymmetric padding: the detail panel covers the right edge on desktop,
      // so centring naively would push the subject under it.
      padding: { top: 60, bottom: 60, left: 60, right: window.innerWidth > 960 ? 420 : 60 },
      maxZoom: 9,
      duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 900,
    });
  }, [focusPlaceIds, status]);

  // ── Interaction ──────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== 'ready') return;

    const handleClick = (event: maplibregl.MapMouseEvent) => {
      const hits = map.queryRenderedFeatures(event.point, {
        layers: ['place-dot', 'place-label'],
      }) as MapGeoJSONFeature[];

      const id = hits[0]?.properties?.['id'];
      onSelectPlace(typeof id === 'string' ? id : null);
    };

    const showPointer = () => {
      map.getCanvas().style.cursor = 'pointer';
    };
    const hidePointer = () => {
      map.getCanvas().style.cursor = '';
    };

    map.on('click', handleClick);
    map.on('mouseenter', 'place-dot', showPointer);
    map.on('mouseleave', 'place-dot', hidePointer);

    return () => {
      map.off('click', handleClick);
      map.off('mouseenter', 'place-dot', showPointer);
      map.off('mouseleave', 'place-dot', hidePointer);
    };
  }, [onSelectPlace, status]);

  return (
    <>
      {/*
        A WebGL canvas cannot be read by a screen reader, so rather than hiding
        the map outright we label the region and point to the equivalent content
        that is reachable: search results, the book index and the detail panel
        all carry the same information in text.
      */}
      <div
        ref={containerRef}
        style={{ position: 'absolute', inset: 0 }}
        role="region"
        aria-label="Map of the biblical world. Place details are available through the search results and the detail panel."
      />

      {status === 'loading' && (
        <div className="map-status" role="status">
          <p className="map-status__title">Drawing the map</p>
          <p className="map-status__body">Loading terrain and placing the gazetteer.</p>
        </div>
      )}

      {status === 'error' && (
        <div className="map-status" role="alert">
          <p className="map-status__title">The basemap could not be loaded</p>
          <p className="map-status__body">
            The terrain tiles failed to load, so the map cannot be drawn. Check your network
            connection, or set <code>NEXT_PUBLIC_MAP_STYLE_URL</code> to a basemap you control.
            Search and the gazetteer still work.
          </p>
        </div>
      )}

      {status === 'ready' && basemap.isDevelopmentFallback && (
        <p className="map-notice">
          Development basemap: tiles are served from the OpenStreetMap Foundation, whose usage
          policy excludes production traffic. Configure a basemap provider before deploying
          publicly — see <code>src/lib/basemap.ts</code>.
        </p>
      )}
    </>
  );
}

/**
 * Layer definitions.
 *
 * Order matters and reads bottom-up: territory shading, then routes, then
 * settlements, then type. Everything is expressed as data-driven styling on a
 * feature property rather than as separate layers per category, which keeps the
 * layer count low and lets a single `setData` call restyle the whole map.
 */
function installLayers(map: MapLibreMap): void {
  map.addSource(SOURCES.polities, { type: 'geojson', data: emptyCollection() });
  map.addSource(SOURCES.routes, { type: 'geojson', data: emptyCollection() });
  map.addSource(SOURCES.places, { type: 'geojson', data: emptyCollection() });

  // Territory — a wash of colour with a firmer edge, never a hard border.
  map.addLayer({
    id: 'polity-fill',
    type: 'fill',
    source: SOURCES.polities,
    paint: {
      'fill-color': ['get', 'color'],
      'fill-opacity': 0.16,
    },
  });

  map.addLayer({
    id: 'polity-edge',
    type: 'line',
    source: SOURCES.polities,
    paint: {
      'line-color': ['get', 'color'],
      'line-width': 1.2,
      'line-opacity': 0.5,
      // A long dash reinforces that these are zones of control, not surveyed
      // boundaries. It is a cartographic convention doing honest work.
      'line-dasharray': [4, 3],
    },
  });

  map.addLayer({
    id: 'polity-label',
    type: 'symbol',
    source: SOURCES.polities,
    layout: {
      'text-field': ['get', 'name'],
      'text-font': ['Noto Sans Regular'],
      'text-size': 13,
      'text-letter-spacing': 0.22,
      'text-transform': 'uppercase',
      'text-max-width': 9,
      'symbol-placement': 'point',
    },
    paint: {
      'text-color': ['get', 'color'],
      'text-opacity': 0.75,
      'text-halo-color': 'rgba(231, 221, 198, 0.8)',
      'text-halo-width': 1.5,
    },
  });

  // Routes — sea legs dashed differently from inferred ones, so the two kinds of
  // uncertainty stay visually distinct.
  map.addLayer({
    id: 'route-line',
    type: 'line',
    source: SOURCES.routes,
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': ['match', ['get', 'mode'], 'sea', '#3a615a', 'inferred', '#8a7f6b', '#7b2e2e'],
      'line-width': ['interpolate', ['linear'], ['zoom'], 4, 1.4, 10, 2.6],
      'line-opacity': 0.85,
      'line-dasharray': ['match', ['get', 'mode'], 'inferred', ['literal', [2, 3]], 'sea', ['literal', [6, 3]], ['literal', [1, 0]]],
    },
  });

  // Selection ring, drawn under the dot so it reads as a halo.
  map.addLayer({
    id: 'place-selected',
    type: 'circle',
    source: SOURCES.places,
    filter: ['==', ['get', 'id'], '__none__'],
    paint: {
      'circle-radius': 11,
      'circle-color': 'transparent',
      'circle-stroke-color': '#7b2e2e',
      'circle-stroke-width': 1.5,
    },
  });

  // Settlements. Radius scales with rank and zoom; contested identifications get
  // a hollow centre, which is the printed-atlas convention for an uncertain site.
  map.addLayer({
    id: 'place-dot',
    type: 'circle',
    source: SOURCES.places,
    paint: {
      'circle-radius': [
        'interpolate',
        ['linear'],
        ['zoom'],
        4, ['+', 2, ['*', 0.7, ['get', 'rank']]],
        10, ['+', 3.5, ['*', 1.3, ['get', 'rank']]],
      ],
      'circle-color': [
        'case',
        ['get', 'highlighted'], '#7b2e2e',
        ['match', ['get', 'confidence'], 'contested', 'rgba(0,0,0,0)', 'conjectural', 'rgba(0,0,0,0)', '#23201a'],
      ],
      'circle-stroke-color': ['case', ['get', 'highlighted'], '#7b2e2e', '#23201a'],
      'circle-stroke-width': 1.2,
      'circle-opacity': 0.95,
    },
  });

  map.addLayer({
    id: 'place-label',
    type: 'symbol',
    source: SOURCES.places,
    layout: {
      'text-field': ['get', 'name'],
      'text-font': ['Noto Sans Regular'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 4, ['+', 9, ['get', 'rank']], 10, ['+', 11, ['*', 1.4, ['get', 'rank']]]],
      'text-anchor': 'left',
      'text-offset': [0.7, 0],
      'text-max-width': 8,
      // Higher-ranked places win when labels collide, so at low zoom the map
      // thins out to capitals rather than to whatever happened to render first.
      'symbol-sort-key': ['-', 10, ['get', 'rank']],
      'text-allow-overlap': false,
      'text-optional': true,
    },
    paint: {
      'text-color': ['case', ['get', 'highlighted'], '#7b2e2e', '#23201a'],
      'text-halo-color': 'rgba(231, 221, 198, 0.9)',
      'text-halo-width': 1.6,
    },
  });
}

/**
 * Replace a GeoJSON source's data.
 *
 * Guards against the window between a style reload and our layers being
 * reinstalled, during which `getSource` legitimately returns undefined.
 */
function setSourceData(map: MapLibreMap, id: string, data: GeoJSON.FeatureCollection): void {
  const source = map.getSource(id) as GeoJSONSource | undefined;
  source?.setData(data);
}

function emptyCollection(): GeoJSON.FeatureCollection {
  return { type: 'FeatureCollection', features: [] };
}
