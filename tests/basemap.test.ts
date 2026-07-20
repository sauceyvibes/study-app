import { describe, it, expect } from 'vitest';
import { mapboxOutdoorsDusk, MAX_BOUNDS } from '../src/lib/basemap';
import { DECOR_LABELS } from '../src/lib/map-layers';

describe('mapboxOutdoorsDusk', () => {
  const style = mapboxOutdoorsDusk('pk.test-token');

  function rasterSource() {
    const source = style.sources['mapbox-outdoors'];
    if (!source || source.type !== 'raster') throw new Error('expected a raster source');
    return source;
  }

  it('requests the Outdoors style through the Static Tiles API with the token', () => {
    const source = rasterSource();
    const url = source.tiles?.[0] ?? '';
    // The style id and the token are the two things a typo would silently break:
    // wrong id serves a different map, missing token serves 401s (blank tiles).
    expect(url).toContain('/styles/v1/mapbox/outdoors-v12/tiles/');
    expect(url).toContain('access_token=pk.test-token');
    expect(source.tileSize).toBe(512);
  });

  it('carries the attribution Mapbox requires, including the feedback link', () => {
    const source = rasterSource();
    expect(source.attribution).toContain('mapbox.com');
    expect(source.attribution).toContain('openstreetmap.org');
    expect(source.attribution).toContain('Improve this map');
  });

  it('applies the dusk grade over the tiles', () => {
    const ids = style.layers.map((l) => l.id);
    // Order matters: the washes must come after the raster to darken it.
    expect(ids.indexOf('outdoors')).toBeGreaterThan(ids.indexOf('ground'));
    expect(ids.indexOf('dusk-shade')).toBeGreaterThan(ids.indexOf('outdoors'));
    expect(ids.indexOf('dusk-glow')).toBeGreaterThan(ids.indexOf('dusk-shade'));

    const raster = style.layers.find((l) => l.id === 'outdoors');
    expect(raster?.type).toBe('raster');
    const paint = (raster as { paint?: Record<string, unknown> }).paint ?? {};
    // Dimmed highlights are what makes it dusk rather than a tint.
    expect(paint['raster-brightness-max']).toBeLessThan(0.9);
  });

  it('declares a glyph endpoint so the atlas labels can render text', () => {
    expect(style.glyphs).toBeTruthy();
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
