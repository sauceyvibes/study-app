import type { StyleSpecification } from 'maplibre-gl';

/**
 * Basemap configuration.
 *
 * The atlas draws on **Stamen Terrain**, the hillshaded relief cartography by
 * Stamen Design, now hosted by Stadia Maps. Terrain relief is exactly what a
 * historical atlas wants under it — the shape of the land is half the story of
 * where cities sat and armies marched — and Stamen's earthy palette sits kindly
 * inside the parchment plate.
 *
 * Resolution order:
 *
 *   1. NEXT_PUBLIC_MAP_STYLE_URL   — any MapLibre style URL you control. Escape
 *                                    hatch; wins over everything.
 *   2. NEXT_PUBLIC_STADIA_API_KEY  — Stamen Terrain with an explicit Stadia key.
 *                                    Use this for preview deploys whose domain
 *                                    is not whitelisted, or to lift rate limits.
 *   3. Nothing configured          — Stamen Terrain, keyless. This renders on
 *                                    localhost out of the box and on any
 *                                    production domain registered in the Stadia
 *                                    dashboard. See the note below.
 *
 * ## On keyless use and going to production
 *
 * Stadia serves tiles without a key from `localhost`/`127.0.0.1`, so development
 * needs no setup. For a public deployment you have two no-code options and one
 * code option:
 *
 *   - Register your Vercel domain under "Property Authentication" in the Stadia
 *     dashboard. No key ever appears in the source — recommended for web apps.
 *   - Or set NEXT_PUBLIC_STADIA_API_KEY (works anywhere, including previews).
 *
 * Keyless traffic from an unregistered production domain is rate-limited and
 * will eventually 429. The UI shows a quiet notice while running keyless so this
 * is never a surprise in production.
 *
 * ## Which Stamen Terrain layer
 *
 * We use `stamen_terrain_background`: the relief and water without Stamen's own
 * roads and place labels. This atlas supplies its own gazetteer labels, routes
 * and territory, and modern road names bleeding through under ancient sites
 * would fight all of it. To use the full labelled style instead, change
 * STAMEN_STYLE below to 'stamen_terrain'.
 */

/** Stamen layer id. `stamen_terrain` for the fully labelled variant. */
const STAMEN_STYLE = 'stamen_terrain_background';

/** Stadia requires this wording, with all four links, wherever the tiles show. */
const STAMEN_ATTRIBUTION =
  "© <a href='https://stadiamaps.com/'>Stadia Maps</a> © <a href='https://stamen.com/'>Stamen Design</a> © <a href='https://openmaptiles.org/'>OpenMapTiles</a> © <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>";

/**
 * MapLibre needs a glyph endpoint before any symbol layer of ours can render
 * text; a raster source brings no glyphs of its own.
 */
const GLYPHS_URL = 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf';

/** Parchment ground under the tiles, shown while they load and beyond maxzoom. */
const GROUND_COLOR = '#f4ecd9';

/**
 * A light warm grade so Stamen's relief marries the parchment frame without
 * losing its character. Far gentler than a full recolour — the terrain should
 * still read, at a glance, as Stamen Terrain.
 */
const TERRAIN_RASTER_PAINT = {
  'raster-saturation': -0.12,
  'raster-contrast': 0.05,
  'raster-brightness-min': 0.04,
  'raster-brightness-max': 0.96,
  'raster-hue-rotate': 8,
} as const;

/**
 * Stamen Terrain (via Stadia) as a MapLibre style, with the parchment grade.
 *
 * Exported for the test suite: the tile URL and the key handling are the
 * contract, and a typo in either fails silently at runtime — a blank plate, or
 * a key that never reaches the server — which is exactly what tests are for.
 *
 * The `@2x` retina tiles are used with `tileSize: 512`; MapLibre does not expand
 * Leaflet's `{r}` placeholder, so the explicit `@2x` form is required.
 */
export function stamenTerrain(apiKey?: string): StyleSpecification {
  const query = apiKey ? `?api_key=${apiKey}` : '';
  return {
    version: 8,
    glyphs: GLYPHS_URL,
    sources: {
      'stamen-terrain': {
        type: 'raster',
        tiles: [`https://tiles.stadiamaps.com/tiles/${STAMEN_STYLE}/{z}/{x}/{y}@2x.png${query}`],
        tileSize: 512,
        maxzoom: 16,
        attribution: STAMEN_ATTRIBUTION,
      },
    },
    layers: [
      { id: 'ground', type: 'background', paint: { 'background-color': GROUND_COLOR } },
      { id: 'terrain', type: 'raster', source: 'stamen-terrain', paint: { ...TERRAIN_RASTER_PAINT } },
    ],
  };
}

export type BasemapProvider = 'custom' | 'stamen-key' | 'stamen-keyless';

export interface BasemapConfig {
  /** Either a style URL for MapLibre to fetch, or an inline style object. */
  style: string | StyleSpecification;
  provider: BasemapProvider;
  /**
   * True when serving Stamen tiles with no key. Fine for development; for a
   * public deployment the domain should be whitelisted or a key set. The UI
   * surfaces this.
   */
  isKeyless: boolean;
}

export function resolveBasemap(): BasemapConfig {
  const explicit = process.env.NEXT_PUBLIC_MAP_STYLE_URL;
  if (explicit) {
    return { style: explicit, provider: 'custom', isKeyless: false };
  }

  const stadiaKey = process.env.NEXT_PUBLIC_STADIA_API_KEY;
  if (stadiaKey) {
    return { style: stamenTerrain(stadiaKey), provider: 'stamen-key', isKeyless: false };
  }

  return { style: stamenTerrain(), provider: 'stamen-keyless', isKeyless: true };
}

/** The biblical world, as an initial viewport. */
export const DEFAULT_VIEW = {
  center: [35.3, 31.9] as [number, number],
  zoom: 6.1,
} as const;

/**
 * Hard bounds on panning. Wide enough to reach every place in the gazetteer —
 * Tarshish in the west (Spain, ~7°W), the Persian and Indian frontier in the
 * east, Sheba and Ophir in the south (~14°N), and the Black Sea coast in the
 * north — without letting the user drift off into empty ocean.
 */
export const MAX_BOUNDS: [[number, number], [number, number]] = [
  [-12, 8],
  [78, 50],
];
