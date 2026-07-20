import type { StyleSpecification } from 'maplibre-gl';

/**
 * Basemap configuration.
 *
 * **Read this before deploying publicly.** The default below draws raster tiles
 * from the OpenStreetMap Foundation's public servers. That is fine for local
 * development and evaluation, but the OSMF tile usage policy explicitly excludes
 * production applications, and shipping this default to real traffic would be
 * abusing a volunteer-funded service. Set one of the environment variables below
 * before launch:
 *
 *   NEXT_PUBLIC_MAP_STYLE_URL   A full MapLibre style URL (self-hosted, Protomaps,
 *                               or any provider). Takes precedence.
 *   NEXT_PUBLIC_MAPTILER_KEY    A MapTiler key; their free tier is generous and
 *                               their terrain styles suit a historical atlas.
 *
 * The colour treatment is applied as MapLibre raster paint properties rather than
 * a CSS filter, because a CSS filter would also wash out our own overlays. We are
 * desaturating and warming the modern basemap so that it recedes behind the
 * historical layers — the terrain should be legible, not competing.
 */

const OSM_ATTRIBUTION = '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/** Muted, warm-shifted raster paint. Tuned so coastlines stay readable. */
const AGED_RASTER_PAINT = {
  'raster-saturation': -0.55,
  'raster-contrast': 0.08,
  'raster-brightness-min': 0.12,
  'raster-brightness-max': 0.94,
  'raster-hue-rotate': 12,
  'raster-opacity': 0.82,
} as const;

function osmFallbackStyle(): StyleSpecification {
  return {
    version: 8,
    // MapLibre needs a glyph source to render any text; this is the standard
    // free endpoint published for exactly this purpose.
    glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
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
      // A parchment ground beneath the tiles, so gaps and the sea read warm
      // rather than as flat grey while tiles are still loading.
      { id: 'ground', type: 'background', paint: { 'background-color': '#D8CDB4' } },
      { id: 'osm', type: 'raster', source: 'osm', paint: { ...AGED_RASTER_PAINT } },
    ],
  };
}

export interface BasemapConfig {
  /** Either a style URL for MapLibre to fetch, or an inline style object. */
  style: string | StyleSpecification;
  /** True when we are on the development fallback, so the UI can say so. */
  isDevelopmentFallback: boolean;
}

export function resolveBasemap(): BasemapConfig {
  const explicit = process.env.NEXT_PUBLIC_MAP_STYLE_URL;
  if (explicit) {
    return { style: explicit, isDevelopmentFallback: false };
  }

  const maptilerKey = process.env.NEXT_PUBLIC_MAPTILER_KEY;
  if (maptilerKey) {
    return {
      style: `https://api.maptiler.com/maps/landscape/style.json?key=${maptilerKey}`,
      isDevelopmentFallback: false,
    };
  }

  return { style: osmFallbackStyle(), isDevelopmentFallback: true };
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
