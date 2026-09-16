'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { type Map as MapLibreMap, type MapGeoJSONFeature, type GeoJSONSource } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { resolveBasemap, DEFAULT_VIEW, MAX_BOUNDS } from '@/lib/basemap';
import {
  placesToGeoJSON,
  journeysToGeoJSON,
  politiesToGeoJSON,
  territoriesToGeoJSON,
  boundsFor,
  DECOR_LABELS,
} from '@/lib/map-layers';
import type { Journey, Place, Polity, Territory } from '@/atlas/types';
import { PLACE_BY_ID } from '@/atlas/corpus';

interface AtlasMapProps {
  places: Place[];
  journeys: Journey[];
  polities: Polity[];
  territories: Territory[];
  highlightedIds: ReadonlySet<string>;
  selectedPlaceId: string | null;
  selectedJourneyId: string | null;
  /** A leg index to isolate within the selected journey, or null for the whole route. */
  selectedLegIndex: number | null;
  /** Place ids to frame. Changing this array re-fits the viewport. */
  focusPlaceIds: string[];
  onSelectPlace: (placeId: string | null) => void;
  /** A route was clicked: the journey and which leg of it. */
  onRouteClick: (journeyId: string, legIndex: number) => void;
  /** A shaded territory was clicked. */
  onSelectTerritory: (territoryId: string) => void;
}

/** Route layers, listed where a click or hover query needs both at once. */
const ROUTE_LAYERS = ['route-line-solid', 'route-line-inferred'] as const;

const SOURCES = {
  places: 'atlas-places',
  routes: 'atlas-routes',
  polities: 'atlas-polities',
  territories: 'atlas-territories',
  decor: 'atlas-decor',
} as const;

/**
 * The zoom at which a settlement's named interior appears.
 *
 * Below this the map shows cities; at and above it, the gates, pools, porticoes
 * and halls inside them. Nine is about where a single city fills the plate, which
 * is exactly the point at which a reader has stopped looking at the region and
 * started looking at the place.
 */
const INTERIOR_MIN_ZOOM = 9;

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
  neon: '#39ff14', // the bright highlight a selected route lights up with
} as const;

// Route line widths, shared by the install and the selection effect so the two
// never drift. A selected route is drawn heavier so it reads from across the map.
const ROUTE_WIDTH: maplibregl.DataDrivenPropertyValueSpecification<number> = [
  'interpolate', ['linear'], ['zoom'], 4, 1.6, 10, 2.8,
];
const ROUTE_WIDTH_SELECTED: maplibregl.DataDrivenPropertyValueSpecification<number> = [
  'interpolate', ['linear'], ['zoom'], 4, 3, 10, 5,
];

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
  territories,
  highlightedIds,
  selectedPlaceId,
  selectedJourneyId,
  selectedLegIndex,
  focusPlaceIds,
  onSelectPlace,
  onRouteClick,
  onSelectTerritory,
}: AtlasMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  // Read by the framing effect without being one of its triggers: selection
  // alone must never cause a re-fit (clicking a dot would jump the camera to
  // whatever bounds were last focused), but when a focus change and a selection
  // arrive together, the fit must reserve room for the panel that is opening.
  const selectedRef = useRef(selectedPlaceId);
  // Same idea for the journey panel: it shares the drawer, so a fit that arrives
  // with a journey selected must leave room for it too.
  const journeyRef = useRef(selectedJourneyId);
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
      // Raised from 12 once settlements gained a named interior. At 12 the fan of
      // sites around Jerusalem spans about forty pixels and only two of fourteen
      // labels can be placed; by 14 there is room to read them, which is the
      // whole point of having drawn them.
      maxZoom: 14,
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

  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== 'ready') return;

    setSourceData(map, SOURCES.territories, territoriesToGeoJSON(territories));
  }, [territories, status]);

  // ── Selection ring ───────────────────────────────────────────────────────
  useEffect(() => {
    selectedRef.current = selectedPlaceId;
    const map = mapRef.current;
    if (!map || status !== 'ready') return;
    map.setFilter('place-selected', ['==', ['get', 'id'], selectedPlaceId ?? '__none__']);
  }, [selectedPlaceId, status]);

  // ── Route selection: isolate + light up ────────────────────────────────────
  // Selecting a route hides every other one and repaints the chosen route neon,
  // with a bright glow beneath so it is unmistakable from across the map. Isolating
  // a single leg narrows that to one section. Deselecting restores every route in
  // its own colour.
  useEffect(() => {
    journeyRef.current = selectedJourneyId;
    const map = mapRef.current;
    if (!map || status !== 'ready') return;

    if (selectedJourneyId) {
      const match: maplibregl.ExpressionSpecification[] = [['==', ['get', 'journeyId'], selectedJourneyId]];
      if (selectedLegIndex !== null) match.push(['==', ['get', 'legIndex'], selectedLegIndex]);

      map.setFilter('route-line-solid', ['all', ['!=', ['get', 'mode'], 'inferred'], ...match]);
      map.setFilter('route-line-inferred', ['all', ['==', ['get', 'mode'], 'inferred'], ...match]);
      map.setFilter('route-selected', ['all', ...match]);

      for (const id of ROUTE_LAYERS) {
        map.setPaintProperty(id, 'line-color', INK.neon);
        map.setPaintProperty(id, 'line-width', ROUTE_WIDTH_SELECTED);
        map.setPaintProperty(id, 'line-opacity', 1);
      }
    } else {
      map.setFilter('route-line-solid', ['!=', ['get', 'mode'], 'inferred']);
      map.setFilter('route-line-inferred', ['==', ['get', 'mode'], 'inferred']);
      map.setFilter('route-selected', ['==', ['get', 'journeyId'], '__none__']);

      map.setPaintProperty('route-line-solid', 'line-color', ['get', 'color']);
      map.setPaintProperty('route-line-inferred', 'line-color', ['get', 'color']);
      for (const id of ROUTE_LAYERS) map.setPaintProperty(id, 'line-width', ROUTE_WIDTH);
      map.setPaintProperty('route-line-solid', 'line-opacity', 0.9);
      map.setPaintProperty('route-line-inferred', 'line-opacity', 0.85);
    }
  }, [selectedJourneyId, selectedLegIndex, status]);

  // ── Framing ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== 'ready' || focusPlaceIds.length === 0) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Searching an interior site has to arrive at a zoom where interior sites are
    // drawn, or the reader is taken to the right city and shown nothing. Fitting
    // a bounding box around a single point cannot guarantee that — the padding
    // decides the zoom — so this goes straight there instead.
    if (focusPlaceIds.length === 1) {
      const only = PLACE_BY_ID.get(focusPlaceIds[0]!);
      if (only?.coordinates && only.siteRelation === 'in' && only.parentPlaceId) {
        map.easeTo({
          center: only.coordinates,
          zoom: Math.max(map.getZoom(), INTERIOR_MIN_ZOOM + 1.5),
          duration: reduceMotion ? 0 : 900,
        });
        return;
      }
    }

    const bounds = boundsFor(focusPlaceIds);
    if (!bounds) return;

    // Asymmetric padding keeps the subject clear of the detail panel — but only
    // when a panel is actually open, and only when the container can afford it.
    // Both conditions matter: this once reserved 420px against a 581px-wide map
    // because it measured the window instead of the container, and MapLibre
    // dutifully framed the subject into the 101px that remained.
    const width = map.getContainer().clientWidth;
    const panelOpen = selectedRef.current !== null || journeyRef.current !== null;
    const panelPad = panelOpen ? Math.min(400, Math.round(width * 0.45)) : 0;
    const right = width - (60 + panelPad + 60) >= 180 ? 60 + panelPad : 60;

    map.fitBounds(bounds, {
      padding: { top: 60, bottom: 60, left: 60, right },
      maxZoom: 9,
      duration: reduceMotion ? 0 : 900,
    });
  }, [focusPlaceIds, status]);

  // ── Interaction ──────────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || status !== 'ready') return;

    const handleClick = (event: maplibregl.MapMouseEvent) => {
      // Places take priority: a dot sitting on top of a route should select the
      // place, not the line under it. Interior sites come first among those — at
      // the zoom where they are drawn they sit over their own city's dot, and the
      // reader clicking the Fish Gate means the Fish Gate.
      const placeHits = map.queryRenderedFeatures(event.point, {
        layers: ['site-dot', 'site-label', 'place-dot', 'place-label'],
      }) as MapGeoJSONFeature[];
      const placeId = placeHits[0]?.properties?.['id'];
      if (typeof placeId === 'string') {
        onSelectPlace(placeId);
        return;
      }

      // Route lines are only a couple of pixels wide, so hit-test a small box
      // around the cursor rather than the exact point.
      const pad = 6;
      const box: [maplibregl.PointLike, maplibregl.PointLike] = [
        [event.point.x - pad, event.point.y - pad],
        [event.point.x + pad, event.point.y + pad],
      ];
      const routeHits = map.queryRenderedFeatures(box, { layers: [...ROUTE_LAYERS] }) as MapGeoJSONFeature[];
      const journeyId = routeHits[0]?.properties?.['journeyId'];
      const legIndex = routeHits[0]?.properties?.['legIndex'];
      if (typeof journeyId === 'string' && typeof legIndex === 'number') {
        onRouteClick(journeyId, legIndex);
        return;
      }

      // A shaded territory is the last thing consulted, because it covers whole
      // regions and would otherwise swallow every click meant for empty ground.
      // The topmost hit is the smallest area, since the fill layer draws large to
      // small — so clicking inside Judah opens Judah, not the empire over it.
      const territoryHits = map.queryRenderedFeatures(event.point, {
        layers: ['territory-fill'],
      }) as MapGeoJSONFeature[];
      const territoryId = territoryHits[territoryHits.length - 1]?.properties?.['id'];
      if (typeof territoryId === 'string') {
        onSelectTerritory(territoryId);
        return;
      }

      // Empty ground clears whatever panel is open.
      onSelectPlace(null);
    };

    const showPointer = () => {
      map.getCanvas().style.cursor = 'pointer';
    };
    const hidePointer = () => {
      map.getCanvas().style.cursor = '';
    };

    const hoverLayers = ['place-dot', 'site-dot', ...ROUTE_LAYERS];

    map.on('click', handleClick);
    for (const layer of hoverLayers) {
      map.on('mouseenter', layer, showPointer);
      map.on('mouseleave', layer, hidePointer);
    }

    return () => {
      map.off('click', handleClick);
      for (const layer of hoverLayers) {
        map.off('mouseenter', layer, showPointer);
        map.off('mouseleave', layer, hidePointer);
      }
    };
  }, [onSelectPlace, onRouteClick, onSelectTerritory, status]);

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
  map.addSource(SOURCES.territories, { type: 'geojson', data: emptyCollection() });
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

  // Named ground — provinces, regions, tribal allotments. Under the polities,
  // because an empire contains its provinces and the wash should read that way,
  // and drawn lighter for the same reason. Sorted largest-first by the feature
  // builder so a small allotment is never buried under the province around it.
  map.addLayer({
    id: 'territory-fill',
    type: 'fill',
    source: SOURCES.territories,
    paint: {
      'fill-color': ['get', 'color'],
      'fill-opacity': 0.11,
    },
  });

  map.addLayer({
    id: 'territory-edge',
    type: 'line',
    source: SOURCES.territories,
    paint: {
      'line-color': ['get', 'color'],
      'line-width': 1,
      'line-opacity': 0.45,
      // A finer dash than the polities use, so the two washes stay distinguishable
      // where they overlap — which, for a Roman province, is everywhere.
      'line-dasharray': [2, 2],
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

  // Routes are coloured per journey (data-driven from `color`), so overlapping
  // itineraries stay legible. Travel mode is carried by line *style*, not colour:
  // real legs — overland or by sea — are solid, and only an inferred connection is
  // drawn dashed to mark it as reconstructed. Two layers rather than one because
  // `line-dasharray` cannot be data-driven in MapLibre; a single layer that tried
  // would be rejected whole (surfaced only as an error event).

  // A wide neon glow beneath the selected route (filtered in by the selection
  // effect), so a chosen route lights up and is unmistakable from across the map.
  map.addLayer({
    id: 'route-selected',
    type: 'line',
    source: SOURCES.routes,
    filter: ['==', ['get', 'journeyId'], '__none__'],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': INK.neon,
      'line-width': ['interpolate', ['linear'], ['zoom'], 4, 8, 10, 18],
      'line-opacity': 0.45,
      'line-blur': 2.5,
    },
  });

  // Solid line for the real legs — overland and by sea alike.
  map.addLayer({
    id: 'route-line-solid',
    type: 'line',
    source: SOURCES.routes,
    filter: ['!=', ['get', 'mode'], 'inferred'],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: { 'line-color': ['get', 'color'], 'line-width': ROUTE_WIDTH, 'line-opacity': 0.9 },
  });

  // Dashed for inferred connections the text implies without naming the road.
  map.addLayer({
    id: 'route-line-inferred',
    type: 'line',
    source: SOURCES.routes,
    filter: ['==', ['get', 'mode'], 'inferred'],
    layout: { 'line-cap': 'round', 'line-join': 'round' },
    paint: {
      'line-color': ['get', 'color'],
      'line-width': ROUTE_WIDTH,
      'line-opacity': 0.85,
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
    // Settlements only. What lies inside them has its own pair of layers below,
    // held back until the reader has zoomed in far enough to want it.
    filter: ['!', ['get', 'interior']],
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
    filter: ['!', ['get', 'interior']],
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

  /*
   * The interior of a settlement: gates, pools, porticoes, towers, the hall Paul
   * hired. Held back until zoom 9 for the reason a printed atlas puts a city
   * inset on its own plate — at regional scale these are illegible clutter, and
   * at city scale they are the whole point.
   *
   * Drawn as small open squares rather than circles so they never read as rival
   * settlements: a different mark for a different kind of thing, which is the
   * same argument the confidence key makes about fill and stroke.
   */
  map.addLayer({
    id: 'site-dot',
    type: 'circle',
    source: SOURCES.places,
    filter: ['get', 'interior'],
    minzoom: INTERIOR_MIN_ZOOM,
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['zoom'], 9, 2.6, 14, 5.5],
      'circle-color': INK.parchment,
      'circle-stroke-color': INK.accent2,
      'circle-stroke-width': ['case', ['get', 'highlighted'], 2, 1.2],
      'circle-opacity': 0.95,
    },
  });

  map.addLayer({
    id: 'site-label',
    type: 'symbol',
    source: SOURCES.places,
    filter: ['get', 'interior'],
    minzoom: INTERIOR_MIN_ZOOM,
    layout: {
      'text-field': ['get', 'name'],
      'text-font': ['Noto Sans Regular'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 9, 10, 14, 13],
      'text-anchor': 'left',
      'text-offset': [0.6, 0],
      'text-max-width': 9,
      'text-allow-overlap': false,
      'text-optional': true,
    },
    paint: {
      'text-color': ['case', ['get', 'highlighted'], INK.accent, INK.accent2Deep],
      'text-halo-color': INK.halo,
      'text-halo-width': 1.6,
    },
  });

  /*
   * Territory names, placed last on purpose.
   *
   * MapLibre resolves label collisions in favour of whichever layer comes later
   * in the style, so with this layer where it belongs visually — down beneath the
   * territory wash — the settlement names took every position and the provinces
   * went unnamed: Asia would shade half of Asia Minor with nothing written on it.
   * Placed last, thirteen regions label where eight did, and the settlements are
   * barely affected (they hold thirty-six labels either way) because a handful of
   * widely spaced regional names competes for very little of the plate.
   *
   * The cost is that these draw over the settlement names rather than under them,
   * so they are set to read as ground rather than as figure: pale, letterspaced,
   * upper-case, tinted to the territory, and carrying a heavy halo so anything
   * crossing them stays legible.
   */
  map.addLayer({
    id: 'territory-label',
    type: 'symbol',
    source: SOURCES.territories,
    layout: {
      'text-field': ['get', 'name'],
      'text-font': ['Noto Sans Regular'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 4, 10, 9, 14],
      'text-letter-spacing': 0.3,
      'text-transform': 'uppercase',
      'text-max-width': 8,
      'symbol-placement': 'point',
      'text-allow-overlap': false,
      'text-optional': true,
      // Big areas label first, matching the fill order, so a province is named
      // before the allotment inside it when only one of them will fit.
      'symbol-sort-key': ['*', -1, ['get', 'area']],
    },
    paint: {
      'text-color': ['get', 'color'],
      'text-opacity': 0.62,
      'text-halo-color': INK.halo,
      'text-halo-width': 2.2,
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
