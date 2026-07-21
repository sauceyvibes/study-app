import { describe, it, expect } from 'vitest';
import { stamenTerrain, resolveBasemap, MAX_BOUNDS } from '../src/lib/basemap';
import { DECOR_LABELS } from '../src/lib/map-layers';

describe('stamenTerrain', () => {
  function rasterSource(style: ReturnType<typeof stamenTerrain>) {
    const source = style.sources['stamen-terrain'];
    if (!source || source.type !== 'raster') throw new Error('expected a raster source');
    return source;
  }

  it('requests Stamen Terrain from the Stadia endpoint', () => {
    const url = rasterSource(stamenTerrain()).tiles?.[0] ?? '';
    // A wrong host or style id serves nothing; the @2x form matters because
    // MapLibre cannot expand Leaflet's {r} retina placeholder.
    expect(url).toContain('tiles.stadiamaps.com/tiles/stamen_terrain');
    expect(url).toContain('@2x.png');
  });

  it('appends the api_key only when one is given', () => {
    expect(rasterSource(stamenTerrain()).tiles?.[0]).not.toContain('api_key');
    expect(rasterSource(stamenTerrain('sk-test')).tiles?.[0]).toContain('api_key=sk-test');
  });

  it('uses 512-pixel tiles to match the @2x retina imagery', () => {
    expect(rasterSource(stamenTerrain()).tileSize).toBe(512);
  });

  it('carries the four-part attribution Stadia requires', () => {
    const attribution = rasterSource(stamenTerrain()).attribution ?? '';
    expect(attribution).toContain('Stadia Maps');
    expect(attribution).toContain('Stamen');
    expect(attribution).toContain('OpenMapTiles');
    expect(attribution).toContain('openstreetmap.org');
  });

  it('grades the terrain over a parchment ground, ground first', () => {
    const ids = stamenTerrain().layers.map((l) => l.id);
    expect(ids.indexOf('terrain')).toBeGreaterThan(ids.indexOf('ground'));
  });

  it('declares a glyph endpoint so the atlas labels can render text', () => {
    expect(stamenTerrain().glyphs).toBeTruthy();
  });
});

describe('resolveBasemap', () => {
  it('defaults to keyless Stamen Terrain when nothing is configured', () => {
    // The test environment sets none of the NEXT_PUBLIC_* basemap vars.
    const config = resolveBasemap();
    expect(config.provider).toBe('stamen-keyless');
    expect(config.isKeyless).toBe(true);
  });
});

describe('decorative labels', () => {
  it('places every label inside the map bounds', () => {
    const [[minLon, minLat], [maxLon, maxLat]] = MAX_BOUNDS;
    for (const feature of DECOR_LABELS.features) {
      const [lon, lat] = feature.geometry.coordinates;
      expect(lon, feature.properties.name).toBeGreaterThan(minLon);
      expect(lon, feature.properties.name).toBeLessThan(maxLon);
      expect(lat, feature.properties.name).toBeGreaterThan(minLat);
      expect(lat, feature.properties.name).toBeLessThan(maxLat);
    }
  });
});
