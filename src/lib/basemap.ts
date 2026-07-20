import type { StyleSpecification } from 'maplibre-gl';

/**
 * Basemap configuration.
 *
 * Resolution order:
 *
 *   1. NEXT_PUBLIC_MAP_STYLE_URL — any MapLibre style URL you control. Escape
 *      hatch; takes precedence over everything.
 *   2. NEXT_PUBLIC_MAPBOX_TOKEN  — Mapbox Outdoors cartography at dusk. This is
 *      the intended production basemap; see the note below on how "dusk" is
 *      achieved.
 *   3. NEXT_PUBLIC_MAPTILER_KEY  — MapTiler landscape, a serviceable fallback.
 *   4. Nothing configured        — OpenStreetMap raster tiles, development only.
 *      The OSMF tile policy excludes production traffic, and the UI shows a
 *      notice while this fallback is active.
 *
 * ## Why Mapbox Outdoors arrives as raster tiles, and where "dusk" comes from
 *
 * Mapbox's `dusk` light preset belongs to their *Standard* style and only runs
 * inside the proprietary `mapbox-gl` SDK, which refuses to draw anything —
 * including non-Mapbox fallbacks — without a token. Adopting it would have made
 * a Mapbox account a hard requirement for every contributor and swapped our
 * renderer for one we cannot use with the other providers.
 *
 * The classic Outdoors style (`outdoors-v12`) — the one with the terrain
 * shading and contours an atlas actually wants — has no dusk variant at all.
 *
 * So we take Outdoors through Mapbox's **Static Tiles API**, which is the
 * documented, billed path for third-party renderers, and grade it to dusk in
 * the style layer: desaturated, dimmed toward the horizon, and washed with a
 * violet shade and an amber glow. The result is Mapbox Outdoors cartography
 * with an evening cast, rendered by MapLibre like every other option here.
 */

const OSM_ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/**
 * Mapbox requires this attribution wording, including the feedback link, when
 * its tiles are displayed. Do not trim it.
 */
const MAPBOX_ATTRIBUTION =
  '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> <strong><a href="https://apps.mapbox.com/feedback/" target="_blank" rel="noreferrer">Improve this map</a></strong>';

/**
 * MapLibre needs a glyph endpoint before any symbol layer of ours can render
 * text; raster sources bring no glyphs of their own.
 */
const GLYPHS_URL = 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf';

/** Parchment ground under the tiles, shown while they load and beyond maxzoom. */
const GROUND_COLOR = '#f4ecd9';

/**
 * The dusk grade for Outdoors: mute the daylight palette, pull the highlights
 * down, and lean the hue slightly toward evening. The violet/amber wash layers
 * in `mapboxOutdoorsDusk` do the rest.
 */
const DUSK_RASTER_PAINT = {
  'raster-saturation': -0.2,
  'raster-contrast': 0.12,
  'raster-brightness-min': 0.06,
  'raster-brightness-max': 0.78,
  'raster-hue-rotate': -8,
} as const;

/** Aged-paper treatment for the OSM development fallback. */
const AGED_RASTER_PAINT = {
  'raster-saturation': -0.55,
  'raster-contrast': 0.08,
  'raster-brightness-min': 0.12,
  'raster-brightness-max': 0.94,
  'raster-hue-rotate': 12,
  'raster-opacity': 0.82,
} as const;

/**
 * Mapbox Outdoors via the Static Tiles API, graded to dusk.
 *
 * Exported for the test suite: the URL template and the grading layers are the
 * contract here, and a typo in either fails silently at runtime (blank tiles or
 * a daylight map), which is exactly the kind of failure tests exist to catch.
 */
export function mapboxOutdoorsDusk(token: string): StyleSpecification {
  return {
    version: 8,
    glyphs: GLYPHS_URL,
    sources: {
      'mapbox-outdoors': {
        type: 'raster',
        tiles: [
          `https://api.mapbox.com/styles/v1/mapbox/outdoors-v12/tiles/512/{z}/{x}/{y}@2x?access_token=${token}`,
        ],
        tileSize: 512,
        maxzoom: 16,
        attribution: MAPBOX_ATTRIBUTION,
      },
    },
    layers: [
      { id: 'ground', type: 'background', paint: { 'background-color': GROUND_COLOR } },
      { id: 'outdoors', type: 'raster', source: 'mapbox-outdoors', paint: { ...DUSK_RASTER_PAINT } },
      // Twilight, in two washes: a violet shade over everything, then a faint
      // amber warmth as the light on the horizon.
      { id: 'dusk-shade', type: 'background', paint: { 'background-color': '#2e2440', 'background-opacity': 0.18 } },
      { id: 'dusk-glow', type: 'background', paint: { 'background-color': '#c97b2a', 'background-opacity': 0.08 } },
    ],
  };
}

function osmFallbackStyle(): StyleSpecification {
  return {
    version: 8,
    glyphs: GLYPHS_URL,
    sources: {
      osm: {
        type: 'raster',
        tiles: [
          'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
        ],
        tileSize: 256,
        maxzoom: 19,
        attribution: OSM_ATTRIBUTION,
      },
    },
    layers: [
      { id: 'ground', type: 'background', paint: { 'background-color': GROUND_COLOR } },
      { id: 'osm', type: 'raster', source: 'osm', paint: { ...AGED_RASTER_PAINT } },
    ],
  };
}

export type BasemapProvider = 'custom' | 'mapbox-dusk' | 'maptiler' | 'osm-fallback';

export interface BasemapConfig {
  /** Either a style URL for MapLibre to fetch, or an inline style object. */
  style: string | StyleSpecification;
  provider: BasemapProvider;
  /** True when we are on the development fallback, so the UI can say so. */
  isDevelopmentFallback: boolean;
}

export function resolveBasemap(): BasemapConfig {
  const explicit = process.env.NEXT_PUBLIC_MAP_STYLE_URL;
  if (explicit) {
    return { style: explicit, provider: 'custom', isDevelopmentFallback: false };
  }

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (mapboxToken) {
    return { style: mapboxOutdoorsDusk(mapboxToken), provider: 'mapbox-dusk', isDevelopmentFallback: false };
  }

  const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
  if (maptilerKey) {
    return {
      style: `https://api.maptiler.com/maps/landscape/style.json?key=${maptilerKey}`,
      provider: 'maptiler',
      isDevelopmentFallback: false,
    };
  }

  return { style: osmFallbackStyle(), provider: 'osm-fallback', isDevelopmentFallback: true };
}

/** The biblical world, as an initial viewport. */
export const DEFAULT_VIEW = {
  center: [35.3, 31.9] as [number, number],
  zoom: 6.1,
} as const;

/**
 * Hard bounds on panning. Generous enough to reach Rome and Ur without letting
 * the user get lost in the Atlantic.
 */
export const MAX_BOUNDS: [[number, number], [number, number]] = [
  [-2, 18],
  [72, 52],
];
