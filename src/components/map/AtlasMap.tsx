'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { type Map as MapLibreMap, type MapGeoJSONFeature, type GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { resolveBasemap, DEFAULT_VIEW, MAX_BOUNDS } from '@/lib/basemap';
import { placesToGeoJSON, journeysToGeoJSON, politiesToGeoJSON, boundsFor, DECOR_LABELS } from '@/lib/map-layers';
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

const SOURCES = { places: 'atlas-places', routes: 'atlas-routes', polities: 'atlas-polities', decor: 'atlas-decor' } as const;

/**
 * The plate palette, mirroring the design tokens in globals.css. MapLibre paint
 * properties cannot read CSS custom properties, so the crossover values live
 * here; if globals.css changes, change these with it.
 */
const INK = {
  text: '#241d11',
  halo: 'rgba(244, 236, 217, 0.9)',
  haloSoft: 'rgba(244, 236, 217, 0.8)',
  parchment: '#f4ecd9',
  accent: '#8a4023', // terracotta — routes overland, highlights, selection
  accent2: '#47756a', // sea teal — sea legs, decorative water labels
  accent2Deep: '#335c53',
  neutral: '#85765a', // inferred routes, conjectural sites
} as const;

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
  // Read by the framing effect without being one of its triggers: selection
  // alone must never cause a re-fit (clicking a dot would jump the camera to
  // whatever bounds were last focused), but when a focus change and a selection
  // arrive together, the fit must reserve room for the panel that is opening.
  const selectedRef = useRef(selectedPlaceId);
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
    // Fullscreen sits under the zoom buttons, top-left, so it stays clear of the
    // legend in the top-right corner. It promotes the whole `.map-region`, not just
    // the canvas — so the map key (top-right) and the confidence key (bottom-left)
    // stay on screen in fullscreen, which is where they are most needed. Falls back
    // to the map container if that ancestor is somehow absent. (In an embedded
    // iframe the browser may block the request; at the top level it works.)
    const fullscreenTarget = containerRef.current.closest('.map-region');
    map.addControl(
      new maplibregl.FullscreenControl(
        fullscreenTarget instanceof HTMLElement ? { container: fullscreenTarget } : {},
      ),
      'top-left',
    );
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

    // The tile providers (Stadia, Stamen, OpenMapTiles, OpenStreetMap) require
    // attribution, so the control stays — but collapsed to the compact "ⓘ"
    // button rather than the expanded credit bar, which is the standard,
    // licence-compliant way to keep it off the plate. One click still reveals
    // the full credits. MapLibre renders the compact control as <details open>;
    // closing it once after load is what minimises it.
    map.once('load', () => {
      const details = map
        .getContainer()
        .querySelector<HTMLDetailsElement>('details.maplibregl-ctrl-attrib');
      if (details) details.open = false;
    });

    map.on('error', (event) => {
      // Tile requests fail for all sorts of reasons — a gap in coverage, a rate
      // limit, an offline user. None of those should take the atlas down, since
      // our own layers do not depend on the basemap. Only report an error when
      // the style itself could not be parsed, which is unrecoverable.
      if (event.error && 'status' in event.error) return;
      // Always log: MapLibre reports an invalid layer spec here and then simply
      // omits the layer, which once cost us every route on the map. Silent in
      // production telemetry-wise, loud for anyone with a console open.
      console.error('[atlas] map error:', event.error?.message ?? event.error);
      setStatus((current) => (current === 'ready' ? current : 'error'));
    });

    // `style.load` fires as soon as the style is parsed. `load` additionally
    // waits for the first tiles to arrive, and hanging tile requests would leave
    // the loading overlay covering a map that is perfectly usable — the
    // gazetteer, routes and territory are all drawn from local data.
    // Dev-only escape hatch: this project has repeatedly needed to interrogate
    // the live map from the console (missing layers, framing bugs), and the
    // instance is otherwise unreachable from outside the component.
    if (process.env.NODE_ENV === 'development') {
      (window as unknown as { __atlasMap?: MapLibreMap }).__atlasMap = map;
    }

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
    selectedRef.current = selectedPlaceId;
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

    // Asymmetric padding keeps the subject clear of the detail panel — but only
    // when a panel is actually open, and only when the container can afford it.
    // Both conditions matter: this once reserved 420px against a 581px-wide map
    // because it measured the window instead of the container, and MapLibre
    // dutifully framed the subject into the 101px that remained.
    const width = map.getContainer().clientWidth;
    const panelPad = selectedRef.current !== null ? Math.min(400, Math.round(width * 0.45)) : 0;
    const right = width - (60 + panelPad + 60) >= 180 ? 60 + panelPad : 60;

    map.fitBounds(bounds, {
      padding: { top: 60, bottom: 60, left: 60, right },
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

      {status === 'ready' && basemap.isKeyless && (
        <p className="map-notice">
          Stamen Terrain, served keyless — fine on localhost. For a public deployment, whitelist
          the domain in the Stadia Maps dashboard or set <code>NEXT_PUBLIC_STADIA_API_KEY</code>,
          or keyless traffic will be rate-limited.
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
  map.addSource(SOURCES.decor, { type: 'geojson', data: DECOR_LABELS });

  // Decorative water labels — atlas-plate furniture, under everything else.
  map.addLayer({
    id: 'decor-label',
    type: 'symbol',
    source: SOURCES.decor,
    layout: {
      'text-field': ['get', 'name'],
      'text-font': ['Noto Sans Regular'],
      // Zoom interpolation must be the top-level expression; the per-feature
      // size factor lives in the interpolation's output values instead.
      'text-size': [
        'interpolate',
        ['linear'],
        ['zoom'],
        4, ['*', ['get', 'size'], 12],
        8, ['*', ['get', 'size'], 17],
      ],
      'text-letter-spacing': 0.38,
      'text-transform': 'uppercase',
      'text-max-width': 20,
      'text-allow-overlap': false,
      'text-optional': true,
    },
    paint: {
      'text-color': INK.accent2Deep,
      'text-opacity': 0.6,
      'text-halo-color': INK.haloSoft,
      'text-halo-width': 1,
    },
  });

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
      'text-halo-color': INK.haloSoft,
      'text-halo-width': 1.5,
    },
  });

  // Routes — one layer per travel mode. This is not a stylistic choice:
  // `line-dasharray` cannot be data-driven in MapLibre, and a layer that tries
  // is rejected in its entirety (surfaced only as an error event), which is
  // exactly how routes silently failed to draw before this was split.
  const routeWidth: maplibregl.DataDrivenPropertyValueSpecification<number> = [
    'interpolate', ['linear'], ['zoom'], 4, 1.4, 10, 2.6,
  ];

  map.addLayer({
    id: 'route-line-land',
    type: 'line',
    source: SOURCES.routes,
    filter: ['==', ['get', 'mode'], 'land'],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': INK.accent, 'line-width': routeWidth, 'line-opacity': 0.85 },
  });

  map.addLayer({
    id: 'route-line-sea',
    type: 'line',
    source: SOURCES.routes,
    filter: ['==', ['get', 'mode'], 'sea'],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': INK.accent2,
      'line-width': routeWidth,
      'line-opacity': 0.85,
      'line-dasharray': [6, 3],
    },
  });

  map.addLayer({
    id: 'route-line-inferred',
    type: 'line',
    source: SOURCES.routes,
    filter: ['==', ['get', 'mode'], 'inferred'],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': INK.neutral,
      'line-width': routeWidth,
      'line-opacity': 0.8,
      'line-dasharray': [2, 3],
    },
  });

  // Selection ring, drawn under the dot so it reads as a halo.
  map.addLayer({
    id: 'place-selected',
    type: 'circle',
    source: SOURCES.places,
    filter: ['==', ['get', 'id'], '__none__'],
    paint: {
      'circle-radius': 12,
      'circle-color': 'transparent',
      'circle-stroke-color': INK.accent2,
      'circle-stroke-width': 1.6,
    },
  });

  // Settlements. Radius scales with rank and zoom. Colour encodes confidence,
  // matching the key on the plate: certain filled terracotta, probable a paler
  // fill with a firm ring, contested a parchment centre, conjectural a faint
  // neutral ring. Highlight is carried by weight, not colour, so the confidence
  // signal survives being highlighted.
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
        'match',
        ['get', 'confidence'],
        'certain', INK.accent,
        'probable', '#e2b49c',
        'contested', INK.parchment,
        INK.parchment,
      ],
      'circle-stroke-color': [
        'match',
        ['get', 'confidence'],
        'conjectural', INK.neutral,
        'unlocated', INK.neutral,
        INK.accent,
      ],
      'circle-stroke-width': ['case', ['get', 'highlighted'], 2.4, 1.2],
      'circle-opacity': ['match', ['get', 'confidence'], 'conjectural', 0.75, 0.95],
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
      'text-color': ['case', ['get', 'highlighted'], INK.accent, INK.text],
      'text-halo-color': INK.halo,
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
